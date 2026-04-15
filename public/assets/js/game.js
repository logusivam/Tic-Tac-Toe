document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Query params
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const roomId = urlParams.get('room');
    const userId = urlParams.get('userId');

    // UI Elements
    const tiles = Array.from(document.querySelectorAll('.tile'));
    const displayPlayer = document.getElementById('display-player');
    const labelX = document.getElementById('label-x');
    const labelO = document.getElementById('label-o');
    const scoreX = document.getElementById('score-x');
    const scoreO = document.getElementById('score-o');
    const scoreTies = document.getElementById('score-ties');
    const vicX = document.getElementById('vic-x');
    const vicO = document.getElementById('vic-o');
    const roomInfo = document.getElementById('room-info');
    const displayRoomCode = document.getElementById('room-code-display');
    const btnCopy = document.getElementById('copy-btn');
    const playAgainBtn = document.getElementById('play-again');
    const modal = document.getElementById('modal');
    const announcer = document.getElementById('announcer');
    const errorToast = document.getElementById('error-toast');

    let myRole = null;
    let isMyTurn = false;
    let currentTurn = 'X';

    const showError = (msg) => {
        if(errorToast) {
            errorToast.innerText = msg;
            errorToast.style.display = 'block';
            setTimeout(() => {
                errorToast.style.display = 'none';
            }, 5000);
        } else {
            console.error(msg);
        }
    };

    if (!roomId || !userId) {
        showError('Missing Room ID or User ID. Redirecting...');
        setTimeout(() => window.location.href = '../index.html', 2000);
        return;
    }

    if (mode === 'host' || mode === 'join') {
        roomInfo.style.display = 'flex';
        displayRoomCode.innerText = roomId;
    }

    // Connect to room
    socket.emit('joinRoom', { roomId, userId });

    socket.on('errorMsg', (data) => {
        showError(data.message);
        setTimeout(() => window.location.href = '../index.html', 2000);
    });

    const updateScores = (scores) => {
        scoreX.innerText = scores.X;
        scoreO.innerText = scores.O;
        scoreTies.innerText = scores.TIES;
    };

    socket.on('joined', (data) => {
        myRole = data.role; // 'X' or 'O'
        const state = data.gameState;
        
        labelX.innerText = state.playerNames.X || 'PLAYER X';
        labelO.innerText = state.playerNames.O || 'Waiting...';
        
        vicX.innerText = state.playerStats.X || 0;
        vicO.innerText = state.playerStats.O || 0;
        
        updateScores(state.scores);
        
        // update board
        state.board.forEach((val, i) => {
            tiles[i].innerText = val;
            tiles[i].classList.remove('playerX', 'playerO');
            if(val) tiles[i].classList.add(`player${val}`);
        });
        
        currentTurn = state.turn;
        updateTurnDisplay();
    });

    socket.on('gameStart', (data) => {
        const state = data.gameState;
        labelX.innerText = state.playerNames.X;
        labelO.innerText = state.playerNames.O;
        vicX.innerText = state.playerStats.X;
        vicO.innerText = state.playerStats.O;
        
        modal.classList.remove('active');
        
        // clear local board just in case
        tiles.forEach(tile => {
            if(!state.board[tiles.indexOf(tile)]) {
               tile.innerText = '';
               tile.classList.remove('playerX', 'playerO');
            }
        });
        currentTurn = state.turn || 'X';
        updateTurnDisplay();
    });

    socket.on('moveMade', (data) => {
        const { index, role, nextTurn } = data;
        tiles[index].innerText = role;
        tiles[index].classList.add(`player${role}`);
        
        if (nextTurn) {
            currentTurn = nextTurn;
            updateTurnDisplay();
        }
    });

    socket.on('gameOver', (data) => {
        const { winnerRole, scores } = data;
        updateScores(scores);
        
        if (winnerRole === 'TIE') {
            announcer.innerHTML = 'Game Ended in a <span style="color:var(--neon-magenta)">TIE</span>';
        } else {
            const playerClass = `player${winnerRole}`;
            announcer.innerHTML = `Player <span class="${playerClass}">${winnerRole}</span> Won`;
        }
        
        modal.classList.add('active');
        
        if (myRole === 'X') {
            playAgainBtn.style.display = 'block';
            playAgainBtn.innerText = 'Play Again (Host)';
        } else {
            playAgainBtn.style.display = 'none';
        }
    });

    socket.on('gameRestarted', (data) => {
        const state = data.gameState;
        tiles.forEach(tile => {
            tile.innerText = '';
            tile.classList.remove('playerX', 'playerO');
        });
        modal.classList.remove('active');
        currentTurn = 'X';
        updateTurnDisplay();
    });

    socket.on('playerDisconnected', (data) => {
        showError(data.message);
        setTimeout(() => window.location.href = '../index.html', 3000);
    });

    const updateTurnDisplay = () => {
        if (!currentTurn) return; // game over
        isMyTurn = (myRole === currentTurn);
        displayPlayer.innerText = currentTurn;
        displayPlayer.className = `display-player player${currentTurn}`;
    };

    tiles.forEach((tile, index) => {
        tile.addEventListener('click', () => {
            if (isMyTurn && !tile.innerText) {
                socket.emit('makeMove', { index });
            }
        });
    });

    btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(roomId).then(() => {
            btnCopy.innerText = 'Copied!';
            setTimeout(() => btnCopy.innerText = 'Copy', 2000);
        });
    });

    playAgainBtn.addEventListener('click', () => {
        if (myRole === 'X') {
            playAgainBtn.style.display = 'none';
            socket.emit('restartReq');
        }
    });
});
