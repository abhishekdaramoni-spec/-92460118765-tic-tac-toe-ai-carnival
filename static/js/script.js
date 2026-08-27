document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // STATE VARIABLES
    // ==========================================
    let board = ["", "", "", "", "", "", "", "", ""];
    let isGameActive = false;
    let isAiThinking = false;
    let currentTurn = "X"; // Always starts with X
    
    // Configurations
    let gameMode = "pva"; // "pva", "pvp", "eve"
    let playerSymbol = "X";
    let aiSymbol = "O";
    let difficulty = "impossible";
    
    // Spectator state
    let isSpectating = false;
    let spectatorInterval = null;
    let spectatorSpeed = 1000;

    // Persisted states
    let stats = { p1Wins: 0, p2Wins: 0, draws: 0 };
    let preferences = { sound: true, animations: true, confetti: true, theme: "carnival", analysis: true };

    // Retry cache for connection errors
    let lastFailedCall = null;

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    // Screens
    const screens = {
        landing: document.getElementById("screen-landing"),
        modes: document.getElementById("screen-modes"),
        setup: document.getElementById("screen-setup"),
        game: document.getElementById("screen-game"),
        how: document.getElementById("screen-how")
    };

    // Nav and menu triggers
    const navLogo = document.getElementById("nav-home");
    const navBtnArena = document.getElementById("nav-btn-arena");
    const navBtnHow = document.getElementById("nav-btn-how");
    const navBtnSettings = document.getElementById("nav-btn-settings");
    const btnSettingsCircus = document.getElementById("btn-settings-circus");

    // Game Board
    const boardElement = document.getElementById("game-board");
    const statusText = document.getElementById("status-message");

    // Score cards
    const cardP1 = document.getElementById("card-player1");
    const cardP2 = document.getElementById("card-player2");
    const labelP1 = document.getElementById("label-player1");
    const labelP2 = document.getElementById("label-player2");
    const scoreP1 = document.getElementById("score-p1");
    const scoreP2 = document.getElementById("score-p2");
    const scoreDraws = document.getElementById("score-draws");
    
    // Machine Analysis Panel (Carnival Booth Style)
    const explanationPanel = document.getElementById("explanation-panel");
    const expAlgo = document.getElementById("exp-algo");
    const expSearch = document.getElementById("exp-search");
    const expDepth = document.getElementById("exp-depth");
    const expMoves = document.getElementById("exp-moves");
    const expBest = document.getElementById("exp-best");
    const expEval = document.getElementById("exp-eval");

    // Spectator Controls
    const spectatorPanel = document.getElementById("spectator-controls");
    const btnSpecPlay = document.getElementById("btn-spec-play");
    const btnSpecRestart = document.getElementById("btn-spec-restart");
    const speedSlider = document.getElementById("speed-slider");

    // Modals & settings inputs
    const modalSettings = document.getElementById("modal-settings");
    const checkSound = document.getElementById("settings-sound");
    const checkAnimations = document.getElementById("settings-animations");
    const checkConfetti = document.getElementById("settings-confetti");
    const checkAnalysis = document.getElementById("settings-analysis");
    const selectTheme = document.getElementById("settings-theme");
    const errorOverlay = document.getElementById("error-overlay");
    const btnRetryConn = document.getElementById("btn-retry-conn");

    // Action buttons
    const btnToModes = document.getElementById("btn-to-modes");
    const btnToHow = document.getElementById("btn-to-how");
    const btnStartGame = document.getElementById("btn-start-game");
    const btnRestartMatch = document.getElementById("btn-restart-match");
    const btnBackMenu = document.getElementById("btn-back-menu");
    const btnCloseSettings = document.getElementById("btn-close-settings");
    const btnResetScores = document.getElementById("btn-reset-scores");

    // Constants for Win Lines
    const WIN_COMBINATIONS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    // ==========================================
    // AUDIO ENGINE (Vibrant Arcade Synthesizer)
    // ==========================================
    let audioCtx = null;

    function playSynthSound(type) {
        if (!preferences.sound) return;

        // Initialize AudioContext on first gesture
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const playTone = (freq, duration, typeOsc = 'sine', startTimeOffset = 0, gainVal = 0.08) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc.type = typeOsc;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTimeOffset);

            gainNode.gain.setValueAtTime(gainVal, audioCtx.currentTime + startTimeOffset);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTimeOffset + duration);

            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.start(audioCtx.currentTime + startTimeOffset);
            osc.stop(audioCtx.currentTime + startTimeOffset + duration);
            return { osc, gainNode };
        };

        if (type === 'click') {
            // Bright double-tone beep
            playTone(523, 0.08, 'sine', 0, 0.06); // C5
            playTone(659, 0.08, 'sine', 0.03, 0.06); // E5
        } else if (type === 'ai') {
            // Whimsical pop tone
            const { osc } = playTone(500, 0.08, 'triangle', 0, 0.08);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);
        } else if (type === 'button') {
            // Bubble pop
            playTone(950, 0.04, 'sine', 0, 0.05);
        } else if (type === 'win') {
            // Upbeat carnival fanfare arpeggio
            playTone(523, 0.1, 'sine', 0, 0.08); // C5
            playTone(659, 0.1, 'sine', 0.08, 0.08); // E5
            playTone(784, 0.1, 'sine', 0.16, 0.08); // G5
            playTone(1046, 0.25, 'sine', 0.24, 0.08); // C6
        } else if (type === 'draw') {
            // Descending whistle slide
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.25);
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
        } else if (type === 'error') {
            // Comical buzz
            playTone(120, 0.3, 'sawtooth', 0, 0.06);
        }
    }

    // ==========================================
    // HTML-BASED CONFETTI SYSTEM
    // ==========================================
    function burstConfetti() {
        if (!preferences.confetti) return;
        const container = document.getElementById("confetti-container");
        container.innerHTML = ""; // Clear old particles

        const colors = ["#ff007f", "#00f0ff", "#ca8a04", "#22c55e", "#ff8800", "#c084fc"];

        for (let i = 0; i < 45; i++) {
            const particle = document.createElement("div");
            particle.classList.add("confetti-particle");

            // Random properties
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomLeft = Math.random() * 100; // %
            const randomDelay = Math.random() * 1.5; // s
            const randomDuration = 1.5 + Math.random() * 2; // s
            const randomWidth = 8 + Math.random() * 8; // px

            particle.style.background = randomColor;
            particle.style.left = randomLeft + "%";
            particle.style.width = randomWidth + "px";
            particle.style.height = (randomWidth * (0.8 + Math.random() * 0.4)) + "px";
            particle.style.animationDelay = randomDelay + "s";
            particle.style.animationDuration = randomDuration + "s";

            container.appendChild(particle);
        }

        // Clean up particles from DOM
        setTimeout(() => {
            container.innerHTML = "";
        }, 4000);
    }

    // ==========================================
    // SCREEN NAVIGATION ROUTINES
    // ==========================================
    function showScreen(screenKey) {
        Object.keys(screens).forEach(key => {
            if (key === screenKey) {
                screens[key].classList.remove("hidden");
            } else {
                screens[key].classList.add("hidden");
            }
        });
        
        // Stop spec loop if leaving the game screen
        if (screenKey !== 'game') {
            stopSpectatorMode();
        }

        // Show/hide arena nav links
        if (isGameActive && screenKey !== 'game') {
            navBtnArena.classList.remove("hidden");
        } else {
            navBtnArena.classList.add("hidden");
        }
    }

    // Home / navbar links
    navLogo.addEventListener("click", () => {
        playSynthSound('button');
        showScreen("landing");
    });

    navBtnArena.addEventListener("click", () => {
        playSynthSound('button');
        showScreen("game");
    });

    navBtnHow.addEventListener("click", () => {
        playSynthSound('button');
        showScreen("how");
    });

    // Landing Screen triggers
    btnToModes.addEventListener("click", () => {
        playSynthSound('button');
        showScreen("modes");
    });

    btnToHow.addEventListener("click", () => {
        playSynthSound('button');
        showScreen("how");
    });

    // Screen mode selection
    document.querySelectorAll(".circus-mode-card").forEach(card => {
        card.addEventListener("click", () => {
            playSynthSound('button');
            gameMode = card.dataset.mode;
            
            if (gameMode === "pva") {
                showScreen("setup");
            } else {
                playerSymbol = "X";
                aiSymbol = "O";
                startMatch();
            }
        });
    });

    // Setup Section Bindings
    document.querySelectorAll(".symbol-btn-circus").forEach(btn => {
        btn.addEventListener("click", () => {
            playSynthSound('click');
            document.querySelectorAll(".symbol-btn-circus").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            playerSymbol = btn.dataset.symbol;
            aiSymbol = playerSymbol === "X" ? "O" : "X";
        });
    });

    document.querySelectorAll(".diff-ticket-btn").forEach(card => {
        card.addEventListener("click", () => {
            playSynthSound('click');
            document.querySelectorAll(".diff-ticket-btn").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            difficulty = card.dataset.diff;
        });
    });

    btnStartGame.addEventListener("click", () => {
        playSynthSound('button');
        startMatch();
    });

    btnBackMenu.addEventListener("click", () => {
        playSynthSound('button');
        showScreen("modes");
    });

    // Back to menu links
    document.querySelectorAll(".back-to-landing").forEach(btn => {
        btn.addEventListener("click", () => {
            playSynthSound('button');
            showScreen("landing");
        });
    });

    document.querySelectorAll(".back-to-modes").forEach(btn => {
        btn.addEventListener("click", () => {
            playSynthSound('button');
            showScreen("modes");
        });
    });

    // ==========================================
    // SYSTEM SETTINGS & THEME MANAGERS
    // ==========================================
    function loadPreferences() {
        const localPrefs = localStorage.getItem("ttt_circus_prefs");
        if (localPrefs) {
            preferences = JSON.parse(localPrefs);
        }

        checkSound.checked = preferences.sound;
        checkAnimations.checked = preferences.animations;
        checkConfetti.checked = preferences.confetti !== false;
        checkAnalysis.checked = preferences.analysis !== false;
        selectTheme.value = preferences.theme;

        applyTheme(preferences.theme);
        applyAnimations(preferences.animations);
        applyAnalysis(preferences.analysis);
    }

    function savePreferences() {
        preferences.sound = checkSound.checked;
        preferences.animations = checkAnimations.checked;
        preferences.confetti = checkConfetti.checked;
        preferences.analysis = checkAnalysis.checked;
        preferences.theme = selectTheme.value;
        
        localStorage.setItem("ttt_circus_prefs", JSON.stringify(preferences));
        
        applyTheme(preferences.theme);
        applyAnimations(preferences.animations);
        applyAnalysis(preferences.analysis);
    }

    function applyTheme(theme) {
        if (theme === "light") {
            document.body.classList.remove("carnival-theme");
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.remove("light-theme");
            document.body.classList.add("carnival-theme");
        }
    }

    function applyAnimations(on) {
        if (on) {
            document.body.classList.remove("no-animations");
        } else {
            document.body.classList.add("no-animations");
        }
    }

    function applyAnalysis(on) {
        if (on && gameMode !== "pvp") {
            explanationPanel.classList.remove("hidden");
        } else {
            explanationPanel.classList.add("hidden");
        }
    }

    // Modal Trigger Buttons
    if (navBtnSettings) {
        navBtnSettings.addEventListener("click", () => {
            playSynthSound('button');
            modalSettings.classList.remove("hidden");
        });
    }

    if (btnSettingsCircus) {
        btnSettingsCircus.addEventListener("click", () => {
            playSynthSound('button');
            modalSettings.classList.remove("hidden");
        });
    }

    btnCloseSettings.addEventListener("click", () => {
        playSynthSound('button');
        modalSettings.classList.add("hidden");
        savePreferences();
    });

    btnResetScores.addEventListener("click", () => {
        playSynthSound('button');
        stats = { p1Wins: 0, p2Wins: 0, draws: 0 };
        saveStats();
        updateScoreboardUI();
    });

    // Score Caches
    function loadStats() {
        const localStats = localStorage.getItem(`ttt_circus_stats_${gameMode}`);
        if (localStats) {
            stats = JSON.parse(localStats);
        } else {
            stats = { p1Wins: 0, p2Wins: 0, draws: 0 };
        }
        updateScoreboardUI();
    }

    function saveStats() {
        localStorage.setItem(`ttt_circus_stats_${gameMode}`, JSON.stringify(stats));
    }

    // ==========================================
    // GAME LOOPS
    // ==========================================
    function startMatch() {
        loadStats();
        
        board = ["", "", "", "", "", "", "", "", ""];
        isGameActive = true;
        isAiThinking = false;
        currentTurn = "X"; // X always plays first
        
        showScreen("game");
        
        applyAnalysis(preferences.analysis);

        // Adjust scoreboard labels dynamically
        if (gameMode === "pva") {
            labelP1.textContent = playerSymbol === "X" ? "YOU (X)" : "YOU (O)";
            labelP2.textContent = playerSymbol === "X" ? "AI (O)" : "AI (X)";
            document.getElementById("label-player1-avatar").textContent = "🎩";
            document.getElementById("label-player2-avatar").textContent = "🤖";
            spectatorPanel.classList.add("hidden");
        } else if (gameMode === "pvp") {
            labelP1.textContent = "PLAYER 1 (X)";
            labelP2.textContent = "PLAYER 2 (O)";
            document.getElementById("label-player1-avatar").textContent = "🤹";
            document.getElementById("label-player2-avatar").textContent = "🤡";
            spectatorPanel.classList.add("hidden");
            explanationPanel.classList.add("hidden");
        } else if (gameMode === "eve") {
            labelP1.textContent = "MINIMAX (X)";
            labelP2.textContent = "MINIMAX (O)";
            document.getElementById("label-player1-avatar").textContent = "🤖";
            document.getElementById("label-player2-avatar").textContent = "⚙️";
            spectatorPanel.classList.remove("hidden");
            setupSpectatorUI();
        }

        renderBoard();
        updateTurnIndicators();
        
        // AI plays first if Player is O (AI is X)
        if (gameMode === "pva" && aiSymbol === "X") {
            triggerAiMove();
        }
    }

    function renderBoard() {
        boardElement.innerHTML = "";
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.index = i;
            
            if (board[i] !== "") {
                cell.textContent = board[i];
                cell.classList.add(board[i].toLowerCase());
                cell.classList.add("disabled");
            }
            
            cell.addEventListener("click", handleCellClick);
            boardElement.appendChild(cell);
        }
    }

    function handleCellClick(e) {
        if (!isGameActive || isAiThinking || gameMode === "eve") return;
        
        const cell = e.currentTarget;
        const idx = parseInt(cell.dataset.index);
        
        if (board[idx] !== "") return;
        
        playSynthSound('click');
        board[idx] = currentTurn;
        renderBoard();
        
        const status = checkWinnerLocal(board);
        if (status.ended) {
            handleGameEnd(status.winner, status.combo);
            return;
        }

        currentTurn = currentTurn === "X" ? "O" : "X";
        updateTurnIndicators();

        if (gameMode === "pva") {
            triggerAiMove();
        }
    }

    // ==========================================
    // AI ENGINE API CALLS
    // ==========================================
    async function triggerAiMove() {
        isAiThinking = true;
        updateTurnIndicators();
        
        document.querySelectorAll(".cell:not(.disabled)").forEach(c => c.classList.add("disabled"));

        const makeCall = async () => {
            const response = await fetch("/api/move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    board: board,
                    player_symbol: playerSymbol,
                    ai_symbol: aiSymbol,
                    difficulty: difficulty
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Circus calculations failed.");
            }

            return await response.json();
        };

        try {
            const data = await makeCall();
            lastFailedCall = null;
            
            board = data.board;
            renderBoard();
            playSynthSound('ai');

            updateExplanationPanel(data.explanation);

            if (data.status === "win_O" || data.status === "win_X") {
                const check = checkWinnerLocal(board);
                handleGameEnd(check.winner, check.combo);
            } else if (data.status === "draw") {
                handleGameEnd(null);
            } else {
                isAiThinking = false;
                currentTurn = currentTurn === "X" ? "O" : "X";
                updateTurnIndicators();
            }
        } catch (error) {
            console.error(error);
            playSynthSound('error');
            
            lastFailedCall = triggerAiMove;
            errorOverlay.classList.remove("hidden");
        }
    }

    btnRetryConn.addEventListener("click", () => {
        playSynthSound('button');
        errorOverlay.classList.add("hidden");
        if (lastFailedCall) {
            lastFailedCall();
        }
    });

    // ==========================================
    // SPECTATOR LOOP INSTRUCTIONS
    // ==========================================
    function setupSpectatorUI() {
        isSpectating = false;
        btnSpecPlay.textContent = "▶ START";
        btnSpecPlay.classList.remove("btn-danger");
        btnSpecPlay.classList.add("btn-circus-primary");
        stopSpectatorMode();
    }

    function toggleSpectatorPlay() {
        playSynthSound('button');
        if (isSpectating) {
            isSpectating = false;
            btnSpecPlay.textContent = "▶ RESUME";
            stopSpectatorMode();
            statusText.textContent = "SHOW PAUSED";
        } else {
            isSpectating = true;
            btnSpecPlay.textContent = "⏸ PAUSE";
            startSpectatorLoop();
        }
    }

    function startSpectatorLoop() {
        stopSpectatorMode();
        
        statusText.textContent = "🎪 ANALYZING MOVES...";
        
        spectatorInterval = setInterval(async () => {
            if (!isGameActive || isAiThinking) return;

            isAiThinking = true;
            updateTurnIndicators();

            const currentAiSymbol = currentTurn;
            const opposingAiSymbol = currentTurn === "X" ? "O" : "X";

            const makeCall = async () => {
                const response = await fetch("/api/move", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        board: board,
                        player_symbol: opposingAiSymbol,
                        ai_symbol: currentAiSymbol,
                        difficulty: "impossible"
                    })
                });

                if (!response.ok) throw new Error("Spectator step failed.");
                return await response.json();
            };

            try {
                // Alternating arcade titles
                const messages = ["🤖 X IS THINKING...", "🎪 ANALYZING MOVES...", "✨ BEST MOVE FOUND!"];
                statusText.textContent = messages[Math.floor(Math.random() * messages.length)];

                const data = await makeCall();
                lastFailedCall = null;
                
                board = data.board;
                renderBoard();
                playSynthSound('ai');

                updateExplanationPanel(data.explanation);

                if (data.status === "win_X" || data.status === "win_O") {
                    const check = checkWinnerLocal(board);
                    handleGameEnd(check.winner, check.combo);
                    stopSpectatorMode();
                } else if (data.status === "draw") {
                    handleGameEnd(null);
                    stopSpectatorMode();
                } else {
                    isAiThinking = false;
                    currentTurn = currentTurn === "X" ? "O" : "X";
                    updateTurnIndicators();
                }
            } catch (err) {
                console.error(err);
                playSynthSound('error');
                stopSpectatorMode();
                lastFailedCall = startSpectatorLoop;
                errorOverlay.classList.remove("hidden");
                isAiThinking = false;
            }
        }, spectatorSpeed);
    }

    function stopSpectatorMode() {
        if (spectatorInterval) {
            clearInterval(spectatorInterval);
            spectatorInterval = null;
        }
    }

    btnSpecPlay.addEventListener("click", toggleSpectatorPlay);
    btnSpecRestart.addEventListener("click", () => {
        playSynthSound('button');
        stopSpectatorMode();
        startMatch();
    });

    speedSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        spectatorSpeed = 2200 - val;
        
        if (isSpectating) {
            startSpectatorLoop();
        }
    });

    function updateExplanationPanel(exp) {
        if (!exp) return;
        expAlgo.textContent = exp.algorithm.toUpperCase();
        expSearch.textContent = exp.search_type.toUpperCase();
        expDepth.textContent = exp.depth;
        expMoves.textContent = exp.possible_moves;
        expBest.textContent = exp.best_move.toUpperCase();
        expEval.textContent = exp.evaluation.toUpperCase();
    }

    // ==========================================
    // WIN & DRAW MARQUEES
    // ==========================================
    function checkWinnerLocal(currBoard) {
        for (const combo of WIN_COMBINATIONS) {
            const [a, b, c] = combo;
            if (currBoard[a] && currBoard[a] === currBoard[b] && currBoard[a] === currBoard[c]) {
                return { ended: true, winner: currBoard[a], combo };
            }
        }
        if (currBoard.every(cell => cell !== "")) {
            return { ended: true, winner: null, combo: null };
        }
        return { ended: false, winner: null, combo: null };
    }

    function handleGameEnd(winner, winningCombo = null) {
        isGameActive = false;
        isAiThinking = false;
        stopSpectatorMode();

        btnSpecPlay.textContent = "▶ START";
        btnSpecPlay.classList.remove("btn-danger");
        btnSpecPlay.classList.add("btn-circus-primary");
        isSpectating = false;

        document.querySelectorAll(".cell").forEach(cell => cell.classList.add("disabled"));

        if (winner) {
            playSynthSound('win');
            burstConfetti(); // Confetti shower explosion!

            if (winningCombo) {
                winningCombo.forEach(idx => {
                    document.querySelectorAll(".cell")[idx].classList.add("winning");
                });
            }

            if (gameMode === "pva") {
                if (winner === playerSymbol) {
                    statusText.textContent = "🎉 YOU WIN! 🎉";
                    stats.p1Wins++;
                } else {
                    statusText.textContent = "🤖 THE MACHINE WINS!";
                    stats.p2Wins++;
                }
            } else if (gameMode === "pvp") {
                if (winner === "X") {
                    statusText.textContent = "🎉 PLAYER 1 VICTORY! 🎉";
                    stats.p1Wins++;
                } else {
                    statusText.textContent = "🎉 PLAYER 2 VICTORY! 🎉";
                    stats.p2Wins++;
                }
            } else if (gameMode === "eve") {
                if (winner === "X") {
                    statusText.textContent = "👑 MINIMAX (X) WINS 👑";
                    stats.p1Wins++;
                } else {
                    statusText.textContent = "👑 MINIMAX (O) WINS 👑";
                    stats.p2Wins++;
                }
            }
        } else {
            playSynthSound('draw');
            burstConfetti(); // Confetti shower on draw too!
            statusText.textContent = "🎪 WHAT A SHOW! IT'S A DRAW!";
            stats.draws++;
        }

        saveStats();
        updateScoreboardUI();
        
        cardP1.classList.remove("active");
        cardP2.classList.remove("active");
    }

    function updateTurnIndicators() {
        cardP1.classList.remove("active");
        cardP2.classList.remove("active");

        if (!isGameActive) return;

        if (gameMode === "eve") {
            if (currentTurn === "X") {
                cardP1.classList.add("active");
                statusText.textContent = isAiThinking ? "🤖 X IS THINKING..." : "MINIMAX (X) TURN";
            } else {
                cardP2.classList.add("active");
                statusText.textContent = isAiThinking ? "🤖 O IS THINKING..." : "MINIMAX (O) TURN";
            }
            return;
        }

        if (gameMode === "pvp") {
            if (currentTurn === "X") {
                cardP1.classList.add("active");
                statusText.textContent = "PLAYER 1 (X) TURN";
            } else {
                cardP2.classList.add("active");
                statusText.textContent = "PLAYER 2 (O) TURN";
            }
            return;
        }

        if (isAiThinking) {
            cardP2.classList.add("active");
            statusText.textContent = "🤖 AI IS THINKING...";
        } else {
            if (currentTurn === playerSymbol) {
                cardP1.classList.add("active");
                statusText.textContent = "🎟️ YOUR TURN!";
            } else {
                cardP2.classList.add("active");
                statusText.textContent = "🤖 AI IS THINKING...";
            }
        }
    }

    function updateScoreboardUI() {
        const pad = (num) => num.toString().padStart(2, '0');
        scoreP1.textContent = pad(stats.p1Wins);
        scoreP2.textContent = pad(stats.p2Wins);
        scoreDraws.textContent = pad(stats.draws);
    }

    // Reset round actions
    btnRestartMatch.addEventListener("click", () => {
        playSynthSound('button');
        stopSpectatorMode();
        
        fetch("/api/reset", { method: "POST" })
            .then(res => res.json())
            .then(() => {
                startMatch();
            })
            .catch(err => {
                console.error(err);
                startMatch();
            });
    });

    // Startup initializations
    loadPreferences();
});
