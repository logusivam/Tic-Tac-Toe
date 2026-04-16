window.addEventListener('DOMContentLoaded', () => {
    let socket = null;
    if (typeof io !== 'undefined') {
        socket = io();
    }
    // Buttons
    const btnCreate = document.getElementById('btn-create-room');
    const btnJoin = document.getElementById('btn-join-room');
    const btnRandom = document.getElementById('btn-play-random');
    const btnLocal = document.getElementById('btn-play-local');
    const roomInput = document.getElementById('room-code-input');

    const userModal = document.getElementById('user-modal');
    const btnSubmitUser = document.getElementById('btn-submit-user');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const nameInput = document.getElementById('user-name');
    const ageInput = document.getElementById('user-age');
    const errorMsg = document.getElementById('user-modal-error');
    const errorToast = document.getElementById('error-toast');
    
    const inviteToast = document.getElementById('invite-toast');
    const inviteHostName = document.getElementById('invite-host-name');
    const btnAcceptInvite = document.getElementById('btn-accept-invite');
    const btnDeclineInvite = document.getElementById('btn-decline-invite');

    let pendingAction = null; // 'create' or 'join'
    let pendingRoomCode = null;
    
    // Register global user map if socket exists
    if (socket) {
        const savedGlobalId = sessionStorage.getItem('userId');
        if (savedGlobalId) {
            socket.emit('registerUser', { userId: savedGlobalId });
        }
        
        socket.on('playAgainInvite', ({ roomId, hostName }) => {
            inviteHostName.innerText = hostName;
            inviteToast.style.display = 'block';
            
            btnAcceptInvite.onclick = () => {
                inviteToast.style.display = 'none';
                simulateConnection(btnJoin, `CONNECTING...`, () => {
                    window.location.href = `${gameFileUrl}?mode=join&room=${roomId}&userId=${savedGlobalId || sessionStorage.getItem('userId')}`;
                });
            };
            
            btnDeclineInvite.onclick = () => {
                inviteToast.style.display = 'none';
            };
        });
        
        socket.on('roomCheckResult', ({ valid, message }) => {
            if (valid) {
                 showModal('join', pendingRoomCode);
            } else {
                 showError(message || 'Invalid Room ID');
            }
        });
    }

    // Path to your external game file
    const gameFileUrl = 'games/gamePlay.html';

    const showError = (msg) => {
        errorToast.innerText = msg;
        errorToast.style.display = 'block';
        setTimeout(() => {
            errorToast.style.display = 'none';
        }, 3000);
    };

    const showModal = (action, code = null) => {
        // Ask for user every time if you want, but caching is better
        const savedUserId = sessionStorage.getItem('userId');
        if (savedUserId) {
            proceedAction(action, code, savedUserId);
            return;
        }

        pendingAction = action;
        pendingRoomCode = code;
        userModal.style.display = 'flex';
    };

    const hideModal = () => {
        userModal.style.display = 'none';
        nameInput.value = '';
        ageInput.value = '';
        errorMsg.style.display = 'none';
    };

    const proceedAction = (action, roomCode, userId) => {
        if (action === 'create') {
            const newRoomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
            simulateConnection(btnCreate, `HOSTING...`, () => {
                window.location.href = `${gameFileUrl}?mode=host&room=${newRoomCode}&userId=${userId}`;
            });
        } else if (action === 'join') {
            simulateConnection(btnJoin, `JOINING...`, () => {
                window.location.href = `${gameFileUrl}?mode=join&room=${roomCode}&userId=${userId}`;
            });
        }
    };

    btnSubmitUser.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const age = ageInput.value.trim();

        if (!name || !age) {
            errorMsg.innerText = 'Name and Age are required!';
            errorMsg.style.display = 'block';
            return;
        }

        btnSubmitUser.disabled = true;
        btnSubmitUser.innerText = 'Creating Profile...';

        try {
            const res = await fetch('/api/v1/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, age: Number(age) })
            });

            if (!res.ok) throw new Error('Failed to create profile');

            const userData = await res.json();
            sessionStorage.setItem('userId', userData._id);
            sessionStorage.setItem('userName', userData.name);
            
            hideModal();
            proceedAction(pendingAction, pendingRoomCode, userData._id);
            
        } catch (err) {
            errorMsg.innerText = err.message;
            errorMsg.style.display = 'block';
        } finally {
            btnSubmitUser.disabled = false;
            btnSubmitUser.innerText = 'Submit';
        }
    });

    btnCloseModal.addEventListener('click', hideModal);

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
        showModal('create');
    });

    btnJoin.addEventListener('click', () => {
        const code = roomInput.value.trim().toUpperCase();
        if (code.length >= 3) {
            if (socket) {
                pendingRoomCode = code; // temporarily store it
                socket.emit('checkRoom', { roomId: code });
            } else {
                showModal('join', code);
            }
        } else {
            roomInput.style.borderColor = '#ff3860';
            roomInput.style.boxShadow = '0 0 10px rgba(255, 56, 96, 0.5)';
            setTimeout(() => {
                roomInput.style.borderColor = 'rgba(255,255,255,0.1)';
                roomInput.style.boxShadow = 'none';
            }, 1000);
            showError('Room code must be at least 3 characters.');
        }
    });

    btnRandom.addEventListener('click', () => {
        const savedUserId = sessionStorage.getItem('userId');
        if (!savedUserId) { showError("Create or Join Room to play first!"); return; }
        simulateConnection(btnRandom, 'SEARCHING GRID...', () => {
            window.location.href = `${gameFileUrl}?mode=random&userId=${savedUserId}`;
        });
    });

    btnLocal.addEventListener('click', () => {
        window.location.href = `${gameFileUrl}?mode=local`;
    });
});