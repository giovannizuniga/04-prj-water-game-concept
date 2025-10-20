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
    // Add pollutant counter to stats grid if not present
    if (!pollutantCountElement) {
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            const statCard = document.createElement('div');
            statCard.className = 'stat-card';
            statCard.innerHTML = '<div class="stat-icon">☠️</div><div class="stat-label">Pollutants Hit</div><div class="stat-value" id="pollutantCount">0</div>';
            statsGrid.appendChild(statCard);
            pollutantCountElement = document.getElementById('pollutantCount');
        }
    }
    initializeGame();
    updateDisplay();
    showStartScreen();
    // Show tutorial modal once on first load
    if (tutorialModal) tutorialModal.style.display = 'flex';
});

if (closeTutorial) {
    closeTutorial.addEventListener('click', () => {
        if (tutorialModal) tutorialModal.style.display = 'none';
    });
}

function openTutorial() {
    if (tutorialModal) tutorialModal.style.display = 'flex';
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
    });
});

// run once to set initial highlight
updateModeButtonHighlight();

// Subtle parallax effect: track mouse and shift background position slightly
let parallaxX = 0, parallaxY = 0;
let targetX = 0, targetY = 0;
const parallaxIntensity = 10; // pixels max

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
    parallaxX += (targetX - parallaxX) * 0.08;
    parallaxY += (targetY - parallaxY) * 0.08;
    document.body.style.backgroundPosition = `calc(50% + ${parallaxX}px) calc(0% + ${parallaxY}px)`;
    requestAnimationFrame(parallaxTick);
}

window.addEventListener('mousemove', onParallaxMove);
requestAnimationFrame(parallaxTick);

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
