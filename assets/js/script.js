
window.addEventListener('DOMContentLoaded', () => {
    // Buttons
    const btnCreate = document.getElementById('btn-create-room');
    const btnJoin = document.getElementById('btn-join-room');
    const btnRandom = document.getElementById('btn-play-random');
    const btnLocal = document.getElementById('btn-play-local');
    const roomInput = document.getElementById('room-code-input');

    // Path to your external game file
    const gameFileUrl = 'games/gamePlay.html';

    // Simulate Networking Delays
    const simulateConnection = (btnElement, loadingText, finalAction) => {
        const originalText = btnElement.innerText;
        btnElement.innerText = loadingText;
        btnElement.disabled = true;

        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.disabled = false;
            finalAction();
        }, 1500);
    };

    // Event Listeners for Lobby linking to the game file
    btnCreate.addEventListener('click', () => {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        simulateConnection(btnCreate, `HOSTING ID: ${roomCode}...`, () => {
            window.location.href = `${gameFileUrl}?mode=host&room=${roomCode}`;
        });
    });

    btnJoin.addEventListener('click', () => {
        const code = roomInput.value.trim().toUpperCase();
        if (code.length >= 3) {
            simulateConnection(btnJoin, `CONNECTING...`, () => {
                window.location.href = `${gameFileUrl}?mode=join&room=${code}`;
            });
        } else {
            roomInput.style.borderColor = '#ff3860';
            roomInput.style.boxShadow = '0 0 10px rgba(255, 56, 96, 0.5)';
            setTimeout(() => {
                roomInput.style.borderColor = 'rgba(255,255,255,0.1)';
                roomInput.style.boxShadow = 'none';
            }, 1000);
        }
    });

    btnRandom.addEventListener('click', () => {
        simulateConnection(btnRandom, 'SEARCHING GRID...', () => {
            window.location.href = `${gameFileUrl}?mode=random`;
        });
    });

    btnLocal.addEventListener('click', () => {
        window.location.href = `${gameFileUrl}?mode=local`;
    });
});