// Game Constants
const GRID_SIZE = 20;
const BASE_GAME_SPEED = 150; // milliseconds per tick (lower = faster)

// Mode-modifiable runtime values
let currentGameSpeed = BASE_GAME_SPEED;
let pollutantPenalty = 5;
let selectedMode = 'easy';
let modeBias = 0.7; // probability bias used for pollution spawning (higher = rarer)

// Game State Variables
let snake = [{ x: 10, y: 10 }];
let direction = { x: 1, y: 0 };
let gameItems = [];
let score = 0;
let gameOver = false;
let gameStarted = false;
let jerryCanCount = 0;
let feedbackMessage = '';
let peopleServed = 0;
let gameInterval = null;
let feedbackTimeout = null;
let pollutantCount = 0;

// DOM Elements
const gameCanvas = document.getElementById('gameCanvas');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const playingInstructions = document.getElementById('playingInstructions');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const milestoneContainer = document.getElementById('milestoneContainer');
const milestoneBadge = document.getElementById('milestoneBadge');
const feedbackContainer = document.getElementById('feedbackContainer');
const feedbackMessageElement = document.getElementById('feedbackMessage');
// New controls
const soundToggle = document.getElementById('soundToggle');
const volumeControl = document.getElementById('volumeControl');
const tutorialModal = document.getElementById('tutorialModal');
const closeTutorial = document.getElementById('closeTutorial');

// Stat elements
const scoreElement = document.getElementById('score');
const jerryCanCountElement = document.getElementById('jerryCanCount');
const peopleServedElement = document.getElementById('peopleServed');
const trailLengthElement = document.getElementById('trailLength');
const finalJerryCansElement = document.getElementById('finalJerryCans');
const finalPeopleServedElement = document.getElementById('finalPeopleServed');
const highScoreElement = document.getElementById('highScore');
// Share modal elements
const shareModal = document.getElementById('shareModal');
const shareScoreElement = document.getElementById('shareScore');
const shareTextElement = document.getElementById('shareText');
const copyShare = document.getElementById('copyShare');
const openLink = document.getElementById('openLink');
const closeShare = document.getElementById('closeShare');
const shareButton = document.getElementById('shareButton');
// Add pollutant counter element
let pollutantCountElement = document.getElementById('pollutantCount');

// Generate random position for game items
function generateRandomPosition() {
    return {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
    };
}

// Ensure generated position is not on the snake
function generateSafePosition() {
    let pos;
    let attempts = 0;
    do {
        pos = generateRandomPosition();
        attempts++;
        // safety fallback after many attempts
        if (attempts > 50) break;
    } while (snake.some(segment => segment.x === pos.x && segment.y === pos.y));
    return pos;
}

// Generate game items (water drops and pollution)
function generateGameItems() {
    const items = [];
    
    // Add water drops (more frequent)
    for (let i = 0; i < 3; i++) {
        const pos = generateSafePosition();
        items.push({ ...pos, type: 'water' });
    }
    
    // Add pollution: easy = 1 attempt, medium/hard = 2 attempts (higher expected pollutants)
    const pollutionAttempts = (selectedMode === 'medium' || selectedMode === 'hard') ? 2 : 1;
    for (let i = 0; i < pollutionAttempts; i++) {
        // Use modeBias (set by mode buttons) to determine spawn chance
        if (Math.random() > modeBias) {
            const pos = generateSafePosition();
            items.push({ ...pos, type: 'pollution' });
        }
    }
    
    gameItems = items;
}

// Initialize game
function initializeGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    score = 0;
    jerryCanCount = 0;
    peopleServed = 0;
    gameOver = false;
    feedbackMessage = '';
    pollutantCount = 0;
    generateGameItems();
    updateStats();
    updateDisplay();
    hideFeedback();
    hideMilestone();
}

// Update statistics display
function updateStats() {
    scoreElement.textContent = score;
    jerryCanCountElement.textContent = jerryCanCount;
    peopleServedElement.textContent = peopleServed;
    trailLengthElement.textContent = snake.length;
    if (pollutantCountElement) {
        pollutantCountElement.textContent = pollutantCount;
    }
}

// Show feedback message
function showFeedback(message) {
    feedbackMessage = message;
    feedbackMessageElement.textContent = message;
    feedbackContainer.style.display = 'block';
    
    // Clear previous timeout
    if (feedbackTimeout) {
        clearTimeout(feedbackTimeout);
    }
    
    // Hide after 2 seconds
    feedbackTimeout = setTimeout(() => {
        hideFeedback();
    }, 2000);
}

// Simple audio feedback using WebAudio API for collect/hit
const audioCtx = (typeof AudioContext !== 'undefined') ? new AudioContext() : null;
function beep(frequency = 440, duration = 0.08, type = 'sine', gain = 0.05) {
    if (!audioCtx) return;
    if (soundToggle && !soundToggle.checked) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = frequency;
    // respect volume control slider
    const vol = (volumeControl && volumeControl.value) ? parseFloat(volumeControl.value) : gain;
    g.gain.value = vol;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    setTimeout(() => { o.stop(); }, duration * 1000);
}

// small select sound for UI interactions
function selectBeep(mode) {
    if (!audioCtx) return;
    if (soundToggle && !soundToggle.checked) return;
    // different pitches per mode
    const freq = (mode === 'easy') ? 720 : (mode === 'medium') ? 540 : 440;
    beep(freq, 0.06, 'sine', (volumeControl && volumeControl.value) ? parseFloat(volumeControl.value) : 0.06);
}

// Hide feedback message
function hideFeedback() {
    feedbackContainer.style.display = 'none';
    feedbackMessage = '';
}

// Get milestone message
function getMilestoneMessage() {
    if (jerryCanCount >= 50) return "🏆 Water Hero! 50+ jerry cans collected!";
    if (jerryCanCount >= 25) return "⭐ Water Champion! 25+ jerry cans!";
    if (jerryCanCount >= 10) return "💧 Making a difference! 10+ jerry cans!";
    if (jerryCanCount >= 5) return "🚛 Good start! 5+ jerry cans collected!";
    return "";
}

// Show milestone
function showMilestone() {
    const message = getMilestoneMessage();
    if (message) {
        milestoneBadge.textContent = message;
        milestoneContainer.style.display = 'block';
    } else {
        hideMilestone();
    }
}

// Hide milestone
function hideMilestone() {
    milestoneContainer.style.display = 'none';
}

// Handle keyboard input
function handleKeyPress(event) {
    if (!gameStarted || gameOver) return;

    switch (event.key) {
        case 'ArrowUp':
            if (direction.y !== 1) {
                direction = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
            if (direction.y !== -1) {
                direction = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
            if (direction.x !== 1) {
                direction = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
            if (direction.x !== -1) {
                direction = { x: 1, y: 0 };
            }
            break;
    }
    
    // Prevent default behavior for arrow keys
    if (event.key.startsWith('Arrow')) {
        event.preventDefault();
    }
}

// Helper to set direction safely from buttons (prevents reversing into self)
function setDirection(dx, dy) {
    // prevent reversing directly
    if (direction.x === -dx && direction.y === -dy) return;
    direction = { x: dx, y: dy };
}

// Move snake
function moveSnake() {
    if (!gameStarted || gameOver) return;

    const newSnake = [...snake];
    const head = { ...newSnake[0] };
    
    head.x += direction.x;
    head.y += direction.y;

    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        endGame('Truck crashed into a wall! Game Over.');
        return;
    }

    // Check self collision
    if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame('Truck crashed into its trail! Game Over.');
        return;
    }

    newSnake.unshift(head);

    // Check item collision
    const hitItem = gameItems.find(item => item.x === head.x && item.y === head.y);
    
    if (hitItem) {
        if (hitItem.type === 'water') {
            // Collected water drop
            score += 10;
            jerryCanCount += 1;
            peopleServed += 5; // Each jerry can serves ~5 people
            showFeedback('Water collected! +10 points');
            beep(880, 0.06, 'triangle', 0.06);
            
            // Generate new items after a short delay
            setTimeout(() => generateGameItems(), 100);
        } else if (hitItem.type === 'pollution') {
                // Hit pollution: decrease score by mode penalty and increment counter
                score = Math.max(0, score - pollutantPenalty);
                pollutantCount += 1;
                showFeedback(`Pollution hit! -${pollutantPenalty} points`);
                beep(160, 0.12, 'sawtooth', 0.08);
                // Remove the pollutant and generate new items
                setTimeout(() => generateGameItems(), 100);
        }
        
        // Remove the collected item
        gameItems = gameItems.filter(item => !(item.x === head.x && item.y === head.y));
    } else {
        // Remove tail if no item collected
        newSnake.pop();
    }

    snake = newSnake;
    updateStats();
    updateDisplay();
    showMilestone();
}

// End game
function endGame(message) {
    gameOver = true;
    gameStarted = false;
    
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    showFeedback(message);
    showGameOverScreen();
}

// Update game display
function updateDisplay() {
    // Clear canvas
    gameCanvas.innerHTML = '';
    
    // Create grid cells
    for (let index = 0; index < GRID_SIZE * GRID_SIZE; index++) {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);
        
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        
        // Check if this position contains snake
        const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
        const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
        
        // Check if this position contains game items
        const gameItem = gameItems.find(item => item.x === x && item.y === y);
        
        // Apply styles and content
        if (isSnakeHead) {
            cell.classList.add('snake-head');
            cell.textContent = '🚛';
        } else if (isSnakeBody) {
            cell.classList.add('snake-body');
            cell.textContent = '🛢️';
        } else if (gameItem?.type === 'water') {
            cell.classList.add('water-drop');
            cell.textContent = '💧';
        } else if (gameItem?.type === 'pollution') {
            cell.classList.add('pollution');
            cell.textContent = '☠️';
        }
        
        gameCanvas.appendChild(cell);
    }
}

// Start game
function startGame() {
    // Read selected mode from the mode buttons
    const modeBtn = document.querySelector('.mode-button.selected');
    selectedMode = modeBtn ? modeBtn.getAttribute('data-mode') : 'easy';

    // Apply mode settings defaults
    if (selectedMode === 'easy') {
        pollutantPenalty = 5;
        currentGameSpeed = BASE_GAME_SPEED;
    } else if (selectedMode === 'medium') {
        pollutantPenalty = 12;
        currentGameSpeed = BASE_GAME_SPEED;
    } else if (selectedMode === 'hard') {
        pollutantPenalty = 12;
        currentGameSpeed = Math.max(50, Math.floor(BASE_GAME_SPEED / 2)); // faster
    }

    // Override with manual tuning sliders if user adjusted before start
    // Use mode defaults for penalty/spawn bias (no manual overrides)

    gameStarted = true;
    initializeGame();
    showPlayingScreen();

    // Start game loop with currentGameSpeed
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    gameInterval = setInterval(moveSnake, currentGameSpeed);
}

// Restart game
function restartGame() {
    // Stop any running loop and reset running flags
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    gameOver = false;
    gameStarted = false;
    // Reset game state so stats show fresh values on the start screen
    initializeGame();
    updateDisplay();
    updateStats();
    // Show the start screen so the player can pick a difficulty and tune settings
    showStartScreen();
}

// Show start screen
function showStartScreen() {
    startScreen.style.display = 'block';
    gameOverScreen.style.display = 'none';
    playingInstructions.style.display = 'none';
}

// Show playing screen
function showPlayingScreen() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    playingInstructions.style.display = 'block';
}

// Show game over screen
function showGameOverScreen() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'block';
    playingInstructions.style.display = 'none';
    
    // Update final stats
    finalJerryCansElement.textContent = jerryCanCount;
    finalPeopleServedElement.textContent = peopleServed;
    // Update high score if needed
    const prevHigh = parseInt(localStorage.getItem('waterHighScore') || '0', 10);
    if (score > prevHigh) {
        localStorage.setItem('waterHighScore', String(score));
        if (highScoreElement) highScoreElement.textContent = score;
    }
    if (highScoreElement && !highScoreElement.textContent) {
        highScoreElement.textContent = localStorage.getItem('waterHighScore') || '0';
    }
    // Prepare share text
    if (shareScoreElement) shareScoreElement.textContent = score;
    if (shareTextElement) {
        shareTextElement.textContent = `I just scored ${score} points in Water Mission to support charity: water — help bring clean water! 👉 https://www.charitywater.org`;
    }
    // Show share modal button available on game over screen; clicking it will open modal
}

// Event Listeners
document.addEventListener('keydown', handleKeyPress);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
// Share modal event wiring
if (shareButton) {
    shareButton.addEventListener('click', () => {
        if (!shareModal) return;
        shareModal.style.display = 'flex';
        // allow paint then add class to trigger animation
        requestAnimationFrame(() => shareModal.classList.add('show'));
    });
}
if (closeShare) {
    closeShare.addEventListener('click', () => {
        if (!shareModal) return;
        shareModal.classList.remove('show');
        // wait for animation then hide
        setTimeout(() => { if (shareModal) shareModal.style.display = 'none'; }, 220);
    });
}
// Close modal when clicking on backdrop
if (shareModal) {
    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            shareModal.classList.remove('show');
            setTimeout(() => { if (shareModal) shareModal.style.display = 'none'; }, 220);
        }
    });
}
if (openLink) {
    openLink.addEventListener('click', () => {
        window.open('https://www.charitywater.org', '_blank');
    });
}
if (copyShare) {
    copyShare.addEventListener('click', () => {
        const text = shareTextElement ? shareTextElement.textContent : '';
        if (navigator.clipboard && text) {
            navigator.clipboard.writeText(text).then(() => {
                showFeedback('Share text copied to clipboard');
            });
        }
    });
}

// Initialize the game on page load
document.addEventListener('DOMContentLoaded', function() {
    // `pollutantCountElement` now comes from the static DOM
    if (!pollutantCountElement) pollutantCountElement = document.getElementById('pollutantCount');
    initializeGame();
    updateDisplay();
    showStartScreen();
    // Show tutorial modal once on first load (persisted)
    const tutorialSeen = localStorage.getItem('tutorialSeen') === 'true';
    if (!tutorialSeen) {
        if (tutorialModal) tutorialModal.style.display = 'flex';
    }

    // Wire up explicit show tutorial link
    const showTutorialLink = document.getElementById('showTutorialLink');
    if (showTutorialLink) {
        showTutorialLink.addEventListener('click', (e) => {
            e.preventDefault();
            openTutorial();
            // ensure modal is visible
            if (tutorialModal) tutorialModal.style.display = 'flex';
            // hide the show link while the modal is open
            showTutorialLink.classList.add('hide-show-tutorial');
            showTutorialLink.setAttribute('aria-hidden', 'true');
            // move focus into the dialog
            const gotIt = document.getElementById('closeTutorialPrimary');
            if (gotIt) gotIt.focus();
        });
    }
    // Wire the primary Got it button to close and persist the seen flag
    const closePrimary = document.getElementById('closeTutorialPrimary');
    if (closePrimary) {
        closePrimary.addEventListener('click', () => {
            if (tutorialModal) tutorialModal.style.display = 'none';
            localStorage.setItem('tutorialSeen', 'true');
            const showLink = document.getElementById('showTutorialLink');
            if (showLink) {
                showLink.classList.remove('hide-show-tutorial');
                showLink.setAttribute('aria-hidden', 'false');
                // return focus to the show link for accessibility
                showLink.focus();
            }
        });
    }

    // Touch control wiring for mobile
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const bindBtn = (el, dx, dy) => {
        if (!el) return;
        const activate = (e) => { e.preventDefault(); setDirection(dx, dy);
            // haptic feedback if available
            if (navigator.vibrate) navigator.vibrate(18);
            el.classList.add('pressed');
            // remove pressed state shortly after
            setTimeout(() => el.classList.remove('pressed'), 120);
        };
        el.addEventListener('pointerdown', activate);
        el.addEventListener('touchstart', activate, { passive: false });
        el.addEventListener('click', activate);
        // ensure pressed state removed on pointer up/cancel
        el.addEventListener('pointerup', () => el.classList.remove('pressed'));
        el.addEventListener('pointercancel', () => el.classList.remove('pressed'));
    };
    bindBtn(btnUp, 0, -1);
    bindBtn(btnDown, 0, 1);
    bindBtn(btnLeft, -1, 0);
    bindBtn(btnRight, 1, 0);
});

// (old X-button listener removed) - primary Got it is wired above

function openTutorial() {
    if (tutorialModal) tutorialModal.style.display = 'flex';
    const showLink = document.getElementById('showTutorialLink');
    if (showLink) showLink.classList.add('hide-show-tutorial');
}

// Highlight selected mode label on the start screen
// Mode button highlight handling
function updateModeButtonHighlight() {
    const btns = document.querySelectorAll('.mode-button');
    btns.forEach(b => b.classList.remove('selected'));
    const sel = document.querySelector('.mode-button[data-mode="' + selectedMode + '"]');
    if (sel) sel.classList.add('selected');
}

document.querySelectorAll('.mode-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const m = btn.getAttribute('data-mode');
        if (m) selectedMode = m;
        updateModeButtonHighlight();
        // play select sound
        selectBeep(selectedMode);
        // add a short mode-specific pulse animation for tactile feedback
        btn.classList.remove('pulse', 'pulse-easy', 'pulse-medium', 'pulse-hard');
        // force reflow
        void btn.offsetWidth;
        const cls = (selectedMode === 'easy') ? 'pulse-easy' : (selectedMode === 'medium') ? 'pulse-medium' : 'pulse-hard';
        btn.classList.add(cls);
    });
});

// run once to set initial highlight
updateModeButtonHighlight();

// Subtle parallax effect: track mouse and shift background position slightly
let parallaxX = 0, parallaxY = 0;
let targetX = 0, targetY = 0;
const parallaxIntensity = 10; // pixels max
let parallaxEnabled = true;

function onParallaxMove(e) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const nx = (e.clientX / w) - 0.5; // -0.5 .. 0.5
    const ny = (e.clientY / h) - 0.5;
    targetX = nx * parallaxIntensity * -1; // invert for subtle shift
    targetY = ny * parallaxIntensity * -0.6;
}

function parallaxTick() {
    // smooth towards target
    if (parallaxEnabled) {
        parallaxX += (targetX - parallaxX) * 0.08;
        parallaxY += (targetY - parallaxY) * 0.08;
        document.body.style.backgroundPosition = `calc(50% + ${parallaxX}px) calc(0% + ${parallaxY}px)`;

        // Apply transforms to layered background if present
        const layers = document.querySelectorAll('.parallax-bg .parallax-layer');
        if (layers && layers.length) {
            layers.forEach(layer => {
                const depth = parseFloat(layer.getAttribute('data-depth')) || 0.5;
                const moveX = parallaxX * depth * 1.2; // scale per-layer
                const moveY = parallaxY * depth;
                layer.style.transform = `translate3d(calc(-50% + ${moveX}px), ${moveY}px, 0)`;
            });
        }
    }

    requestAnimationFrame(parallaxTick);
}

window.addEventListener('mousemove', onParallaxMove);
// touch support: map touch move to parallax
window.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    onParallaxMove(e.touches[0]);
}, { passive: true });
requestAnimationFrame(parallaxTick);

// Parallax toggle element and persistence
const parallaxToggle = document.getElementById('parallaxToggle');
function loadParallaxPreference() {
    // If user OS prefers reduced motion, default off
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stored = localStorage.getItem('parallaxEnabled');
    if (stored !== null) {
        parallaxEnabled = stored === 'true';
    } else {
        parallaxEnabled = !prefersReduced; // default true unless reduced motion
    }
    if (parallaxToggle) parallaxToggle.checked = parallaxEnabled;
    applyParallaxState();
}

function applyParallaxState() {
    const layers = document.querySelectorAll('.parallax-bg .parallax-layer');
    if (!parallaxEnabled) {
        // reset transforms to center and clear background position
        document.body.style.backgroundPosition = '';
        layers.forEach(layer => {
            layer.style.transform = 'translate3d(-50%, 0px, 0)';
        });
    }
    // If enabled we keep running; state is read in parallaxTick
}

if (parallaxToggle) {
    parallaxToggle.addEventListener('change', () => {
        parallaxEnabled = !!parallaxToggle.checked;
        localStorage.setItem('parallaxEnabled', parallaxEnabled ? 'true' : 'false');
        applyParallaxState();
    });
}

// Load pref once on script load
loadParallaxPreference();

// Apply default values for a given mode (penalty, bias, speed)
function applyModeDefaults(mode) {
    if (mode === 'easy') {
        pollutantPenalty = 5;
        modeBias = 0.7; // rarer pollution
        currentGameSpeed = BASE_GAME_SPEED;
    } else if (mode === 'medium') {
        pollutantPenalty = 12;
        modeBias = 0.5; // more pollution
        currentGameSpeed = BASE_GAME_SPEED;
    } else if (mode === 'hard') {
        pollutantPenalty = 12;
        modeBias = 0.45; // even more
        currentGameSpeed = Math.max(50, Math.floor(BASE_GAME_SPEED / 2));
    }
}

// Initialize defaults for initial selected mode
applyModeDefaults(selectedMode);

// Update applyModeDefaults when a mode button is clicked
document.querySelectorAll('.mode-button').forEach(btn => {
    btn.addEventListener('click', () => {
        const m = btn.getAttribute('data-mode');
        if (m) applyModeDefaults(m);
    });
});

// Keyboard shortcuts: E, M, H to select modes
document.addEventListener('keydown', (e) => {
    if (gameStarted) return; // only allow mode change on start screen
    const key = e.key.toLowerCase();
    if (key === 'e' || key === 'm' || key === 'h') {
        let m = 'easy';
        if (key === 'm') m = 'medium';
        if (key === 'h') m = 'hard';
        selectedMode = m;
        applyModeDefaults(m);
        updateModeButtonHighlight();
        const btn = document.querySelector(`.mode-button[data-mode="${m}"]`);
        if (btn) {
            selectBeep(m);
            btn.classList.remove('pulse-easy','pulse-medium','pulse-hard');
            void btn.offsetWidth;
            btn.classList.add((m === 'easy') ? 'pulse-easy' : (m === 'medium') ? 'pulse-medium' : 'pulse-hard');
        }
    }
});
