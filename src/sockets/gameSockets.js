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

module.exports = (io) => {
    io.on('connection', (socket) => {
        
        socket.on('joinRoom', async ({ roomId, userId }) => {
            const roomClients = io.sockets.adapter.rooms.get(roomId);
            const numClients = roomClients ? roomClients.size : 0;
            
            if (numClients >= 2) {
                socket.emit('errorMsg', { message: 'Room is full. Only 2 players can join.' });
                return;
            }

            // fetch user from db to get their name and victories
            const user = await User.findById(userId).catch(() => null);
            if(!user) {
                 socket.emit('errorMsg', { message: 'User not found in Database.' });
                 return;
            }

            socket.join(roomId);
            socket.userId = userId;
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
                // Join as Player O
                // Note: user must not be same as Host, but for local testing it's fine.
                activeGames[roomId].players.O = userId;
                activeGames[roomId].playerNames.O = user.name;
                activeGames[roomId].playerStats.O = user.victories;
                
                socket.emit('joined', { role: 'O', gameState: activeGames[roomId] });
                
                // Notify both that game is ready
                io.to(roomId).emit('gameStart', { gameState: activeGames[roomId] });
            }
        });

        socket.on('makeMove', async ({ index }) => {
            const { roomId, userId } = socket;
            if(!roomId || !userId) return;

            const game = activeGames[roomId];
            
            // Validate move
            if (!game || !game.players.O) return; // game not started
            
            const role = game.players.X === userId ? 'X' : (game.players.O === userId ? 'O' : null);
            if (!role || game.turn !== role || game.board[index] !== '') return; // not your turn / invalid index
            
            // Apply move
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
                        scores: game.scores
                    });
                    
                    // Update stats
                    await User.findByIdAndUpdate(winnerId, { $inc: { victories: 1 } });
                } else {
                    game.scores.TIES++;
                    io.to(roomId).emit('gameOver', { winnerRole: 'TIE', scores: game.scores });
                }
            } else {
                game.turn = role === 'X' ? 'O' : 'X';
                io.to(roomId).emit('moveMade', { index, role, nextTurn: game.turn });
            }
        });

        socket.on('restartReq', () => {
             const { roomId } = socket;
             const game = activeGames[roomId];
             if(game) {
                 game.board = Array(9).fill('');
                 game.turn = 'X';
                 io.to(roomId).emit('gameRestarted', { gameState: game });
             }
        });

        socket.on('disconnect', () => {
             const { roomId } = socket;
             if (roomId && activeGames[roomId]) {
                 io.to(roomId).emit('playerDisconnected', { message: 'Opponent disconnected. Please create a new room.' });
                 delete activeGames[roomId];
             }
        });
    });
};
