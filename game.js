// Game Constants
const GRID_SIZE = 20;
const GAME_SPEED = 150;

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

// Stat elements
const scoreElement = document.getElementById('score');
const jerryCanCountElement = document.getElementById('jerryCanCount');
const peopleServedElement = document.getElementById('peopleServed');
const trailLengthElement = document.getElementById('trailLength');
const finalJerryCansElement = document.getElementById('finalJerryCans');
const finalPeopleServedElement = document.getElementById('finalPeopleServed');

// Generate random position for game items
function generateRandomPosition() {
    return {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
    };
}

// Generate game items (water drops and pollution)
function generateGameItems() {
    const items = [];
    
    // Add water drops (more frequent)
    for (let i = 0; i < 3; i++) {
        const pos = generateRandomPosition();
        items.push({ ...pos, type: 'water' });
    }
    
    // Add pollution (less frequent)
    if (Math.random() > 0.7) {
        const pos = generateRandomPosition();
        items.push({ ...pos, type: 'pollution' });
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
            
            // Generate new items after a short delay
            setTimeout(() => generateGameItems(), 100);
        } else if (hitItem.type === 'pollution') {
            // Hit pollution
            endGame('Hit pollution! Clean water mission failed.');
            return;
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
    gameStarted = true;
    initializeGame();
    showPlayingScreen();
    
    // Start game loop
    gameInterval = setInterval(moveSnake, GAME_SPEED);
}

// Restart game
function restartGame() {
    initializeGame();
    startGame();
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
}

// Event Listeners
document.addEventListener('keydown', handleKeyPress);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

// Initialize the game on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    updateDisplay();
    showStartScreen();
});
