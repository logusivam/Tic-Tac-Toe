const User = require('../models/User');

const WIN_CONDITIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

const checkWin = (board) => {
    for (let i = 0; i < WIN_CONDITIONS.length; i++) {
        const [a, b, c] = WIN_CONDITIONS[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], winningCells: [a, b, c] };
        }
    }
    return null;
};

// In-memory store for active games
const activeGames = {};

// Global user registry: userId -> socketId
const onlineUsers = {};

module.exports = (io) => {
    io.on('connection', (socket) => {
        
        socket.on('registerUser', ({ userId }) => {
            if (userId) {
                onlineUsers[userId] = socket.id;
                socket.userId = userId;
            }
        });

        socket.on('checkRoom', ({ roomId }) => {
            if (activeGames[roomId]) {
                const roomClients = io.sockets.adapter.rooms.get(roomId);
                const numClients = roomClients ? roomClients.size : 0;
                if (numClients < 2) {
                    socket.emit('roomCheckResult', { valid: true });
                } else {
                    socket.emit('roomCheckResult', { valid: false, message: 'Room is full' });
                }
            } else {
                socket.emit('roomCheckResult', { valid: false, message: 'Room does not exist' });
            }
        });

        socket.on('joinRoom', async ({ roomId, userId }) => {
            if (userId) {
                onlineUsers[userId] = socket.id;
                socket.userId = userId;
            }

            const roomClients = io.sockets.adapter.rooms.get(roomId);
            const numClients = roomClients ? roomClients.size : 0;
            
            if (numClients >= 2) {
                socket.emit('errorMsg', { message: 'Room is full. Only 2 players can join.' });
                return;
            }

            const user = await User.findById(userId).catch(() => null);
            if(!user) {
                 socket.emit('errorMsg', { message: 'User not found in Database.' });
                 return;
            }

            socket.join(roomId);
            socket.roomId = roomId;

            if (!activeGames[roomId]) {
                // Initialize room as Host
                activeGames[roomId] = {
                    board: Array(9).fill(''),
                    players: { X: userId, O: null },
                    playerNames: { X: user.name, O: "Waiting..." },
                    playerStats: { X: user.victories, O: 0 },
                    turn: 'X',
                    scores: { X: 0, TIES: 0, O: 0 }
                };
                
                socket.emit('joined', { role: 'X', gameState: activeGames[roomId] });
            } else {
                // Join as Player O (or rejoin)
                const game = activeGames[roomId];
                if (!game.players.O || game.players.O === userId) {
                    game.players.O = userId;
                    game.playerNames.O = user.name;
                    game.playerStats.O = user.victories;
                    
                    // Reset board if we are re-entering from an invite
                    game.board = Array(9).fill('');
                    game.turn = 'X';
                    
                    socket.emit('joined', { role: 'O', gameState: game });
                    // Notify both that game is ready
                    io.to(roomId).emit('gameStart', { gameState: game });
                } else if (game.players.X === userId) {
                    // Rejoining as Host
                    socket.emit('joined', { role: 'X', gameState: game });
                }
            }
        });

        socket.on('makeMove', async ({ index }) => {
            const { roomId, userId } = socket;
            if(!roomId || !userId) return;

            const game = activeGames[roomId];
            if (!game || !game.players.O) return; 
            
            const role = game.players.X === userId ? 'X' : (game.players.O === userId ? 'O' : null);
            if (!role || game.turn !== role || game.board[index] !== '') return;
            
            game.board[index] = role;
            const winResult = checkWin(game.board);
            const isDraw = !game.board.includes('');
            
            if (winResult || isDraw) {
                game.turn = null;
                io.to(roomId).emit('moveMade', { index, role, nextTurn: null });
                
                if (winResult) {
                    const winnerRole = winResult.winner;
                    const winnerId = game.players[winnerRole];
                    
                    game.scores[winnerRole]++;
                    io.to(roomId).emit('gameOver', { 
                        winnerRole, 
                        winningCells: winResult.winningCells,
                        scores: game.scores,
                        gameData: game
                    });
                    
                    await User.findByIdAndUpdate(winnerId, { $inc: { victories: 1 } });
                } else {
                    game.scores.TIES++;
                    io.to(roomId).emit('gameOver', { winnerRole: 'TIE', scores: game.scores, gameData: game });
                }
            } else {
                game.turn = role === 'X' ? 'O' : 'X';
                io.to(roomId).emit('moveMade', { index, role, nextTurn: game.turn });
            }
        });

        socket.on('quitGame', async () => {
            const { roomId, userId } = socket;
            if(!roomId || !userId) return;

            const game = activeGames[roomId];
            if (!game || !game.players.O || game.turn === null) return; // not playing

            const role = game.players.X === userId ? 'X' : (game.players.O === userId ? 'O' : null);
            if (!role) return;

            game.turn = null; 
            const winnerRole = role === 'X' ? 'O' : 'X';
            const winnerId = game.players[winnerRole];

            game.scores[winnerRole]++;
            io.to(roomId).emit('gameOver', { 
                winnerRole, 
                winningCells: [], // Exited
                scores: game.scores,
                gameData: game,
                reason: `${game.playerNames[role]} surrendered.`
            });
            await User.findByIdAndUpdate(winnerId, { $inc: { victories: 1 } });
        });

        socket.on('playAgainReq', () => {
             const { roomId, userId } = socket;
             const game = activeGames[roomId];
             if(!game) return;

             const isHost = game.players.X === userId;
             const targetUserId = isHost ? game.players.O : game.players.X;
             
             if (targetUserId && onlineUsers[targetUserId]) {
                 const requesterName = isHost ? game.playerNames.X : game.playerNames.O;
                 io.to(onlineUsers[targetUserId]).emit('playAgainInvite', { roomId, hostName: requesterName });
             }
        });
        
        socket.on('hostExit', () => {
             const { roomId } = socket;
             if (activeGames[roomId]) {
                 io.to(roomId).emit('playerDisconnected', { message: 'Host canceled the match.' });
                 delete activeGames[roomId];
             }
        });

        socket.on('disconnect', () => {
             const { roomId, userId } = socket;
             if (userId && onlineUsers[userId] === socket.id) {
                 delete onlineUsers[userId];
             }
             if (roomId && activeGames[roomId]) {
                 // Clean up or notify
             }
        });
    });
};
