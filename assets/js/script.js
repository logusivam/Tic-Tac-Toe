
window.addEventListener('DOMContentLoaded', () => {
    const tiles = Array.from(document.querySelectorAll('.tile'));
    const playerDisplay = document.getElementById('display-player');
    const resetButton = document.getElementById('reset');
    const playAgainButton = document.getElementById('play-again');
    const announcer = document.getElementById('announcer');
    const modal = document.getElementById('modal');

    // Score Elements
    const scoreXEl = document.getElementById('score-x');
    const scoreOEl = document.getElementById('score-o');
    const scoreTiesEl = document.getElementById('score-ties');

    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let isGameActive = true;

    // Score State
    let scores = { X: 0, O: 0, TIES: 0 };

    const PLAYERX_WON = 'PLAYERX_WON';
    const PLAYERO_WON = 'PLAYERO_WON';
    const TIE = 'TIE';

    const winningCondition = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    function handleResultValidation() {
        let roundWon = false;
        let winningTiles = [];

        for (let i = 0; i <= 7; i++) {
            const winCondition = winningCondition[i];
            const a = board[winCondition[0]];
            const b = board[winCondition[1]];
            const c = board[winCondition[2]];

            if (a === '' || b === '' || c === '') continue;

            if (a === b && b === c) {
                roundWon = true;
                winningTiles = winCondition;
                break;
            }
        }

        if (roundWon) {
            announce(currentPlayer === 'X' ? PLAYERX_WON : PLAYERO_WON);
            isGameActive = false;
            highlightWinningTiles(winningTiles);
            return;
        }

        if (!board.includes('')) {
            announce(TIE);
        }
    }

    const highlightWinningTiles = (winningTiles) => {
        tiles.forEach((tile, index) => {
            if (winningTiles.includes(index)) {
                tile.classList.add('win');
            } else {
                tile.classList.add('dim');
            }
        });
    }

    const updateScores = (type) => {
        if (type === PLAYERX_WON) {
            scores.X++;
            scoreXEl.innerText = scores.X;
        } else if (type === PLAYERO_WON) {
            scores.O++;
            scoreOEl.innerText = scores.O;
        } else {
            scores.TIES++;
            scoreTiesEl.innerText = scores.TIES;
        }
    }

    const announce = (type) => {
        updateScores(type);

        switch (type) {
            case PLAYERO_WON:
                announcer.innerHTML = '<span class="playerO" style="text-shadow: 0 0 20px var(--neon-o);">O WINS!</span>';
                break;
            case PLAYERX_WON:
                announcer.innerHTML = '<span class="playerX" style="text-shadow: 0 0 20px var(--neon-x);">X WINS!</span>';
                break;
            case TIE:
                announcer.innerHTML = '<span style="color: white; text-shadow: 0 0 20px white;">IT\'S A TIE</span>';
        }

        // Slight delay before showing modal for dramatic effect
        setTimeout(() => {
            modal.classList.add('active');
        }, 600);
    };

    const isValidAction = (tile) => {
        if (tile.innerText === 'X' || tile.innerText === 'O') {
            return false;
        }
        return true;
    };

    const updateBoard = (index) => {
        board[index] = currentPlayer;
    }

    const changePlayer = () => {
        playerDisplay.classList.remove(`player${currentPlayer}`);
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        playerDisplay.innerText = currentPlayer;
        playerDisplay.classList.add(`player${currentPlayer}`);
    }

    const userAction = (tile, index) => {
        if (isValidAction(tile) && isGameActive) {
            tile.innerText = currentPlayer;
            tile.classList.add(`player${currentPlayer}`, 'occupied');
            updateBoard(index);
            handleResultValidation();
            if (isGameActive) changePlayer();
        }
    }

    const resetBoard = () => {
        board = ['', '', '', '', '', '', '', '', ''];
        isGameActive = true;
        modal.classList.remove('active');

        // Reset visual state
        if (currentPlayer === 'O') {
            changePlayer(); // Always let X start on reset
        } else {
            // Ensure display is correct even if X was already playing
            playerDisplay.innerText = 'X';
            playerDisplay.className = 'display-player playerX';
        }

        tiles.forEach(tile => {
            tile.innerText = '';
            tile.className = 'tile'; // Resets all classes
        });
    }

    tiles.forEach((tile, index) => {
        tile.addEventListener('click', () => userAction(tile, index));
    });

    resetButton.addEventListener('click', resetBoard);
    playAgainButton.addEventListener('click', resetBoard);
});
