// Game configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const milestoneDisplay = document.getElementById('milestone');
const feedbackDisplay = document.getElementById('feedback');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverDisplay = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');
const finalMessageDisplay = document.getElementById('finalMessage');

// Game state
let gameRunning = false;
let score = 0;
let gameSpeed = 2;

// Player (truck)
const player = {
    x: 100,
    y: canvas.height / 2,
    width: 40,
    height: 30,
    speed: 5,
    color: '#333'
};

// Jerry cans trail
let jerryCans = [];

// Game objects
let waterDrops = [];
let pollutants = [];

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Milestones
const milestones = [
    { score: 5, message: "Great start! Keep going! 🌊" },
    { score: 10, message: "You're making a difference! 💧" },
    { score: 20, message: "Amazing work! 🎉" },
    { score: 30, message: "Water hero! 🏆" },
    { score: 50, message: "Incredible! You're unstoppable! 🌟" }
];

let lastMilestone = 0;

// Initialize game
function init() {
    score = 0;
    gameSpeed = 2;
    jerryCans = [];
    waterDrops = [];
    pollutants = [];
    lastMilestone = 0;
    player.x = 100;
    player.y = canvas.height / 2;
    updateScore();
    milestoneDisplay.textContent = '';
    feedbackDisplay.textContent = '';
    gameOverDisplay.style.display = 'none';
}

// Start game
function startGame() {
    init();
    gameRunning = true;
    startBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
    spawnWaterDrop();
    spawnPollutant();
    gameLoop();
}

// Restart game
function restartGame() {
    startGame();
}

// Update score
function updateScore() {
    scoreDisplay.textContent = score;
    
    // Check for milestones
    for (let milestone of milestones) {
        if (score >= milestone.score && lastMilestone < milestone.score) {
            lastMilestone = milestone.score;
            milestoneDisplay.textContent = milestone.message;
            setTimeout(() => {
                milestoneDisplay.textContent = '';
            }, 3000);
        }
    }
}

// Show feedback
function showFeedback(message, type) {
    feedbackDisplay.textContent = message;
    feedbackDisplay.className = `feedback ${type}`;
    setTimeout(() => {
        feedbackDisplay.textContent = '';
        feedbackDisplay.className = 'feedback';
    }, 1000);
}

// Spawn water drop
function spawnWaterDrop() {
    if (!gameRunning) return;
    
    const drop = {
        x: canvas.width,
        y: Math.random() * (canvas.height - 30) + 15,
        radius: 12,
        color: '#2196F3'
    };
    waterDrops.push(drop);
    
    // Spawn next drop
    setTimeout(() => spawnWaterDrop(), 2000 - (gameSpeed * 100));
}

// Spawn pollutant
function spawnPollutant() {
    if (!gameRunning) return;
    
    const pollutant = {
        x: canvas.width,
        y: Math.random() * (canvas.height - 30) + 15,
        width: 25,
        height: 25,
        color: '#8B4513'
    };
    pollutants.push(pollutant);
    
    // Spawn next pollutant
    setTimeout(() => spawnPollutant(), 3000 - (gameSpeed * 100));
}

// Update player position
function updatePlayer() {
    if (keys['ArrowUp'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

// Draw player (truck)
function drawPlayer() {
    // Truck body
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Truck cabin
    ctx.fillStyle = '#555';
    ctx.fillRect(player.x + player.width - 15, player.y + 5, 12, player.height - 10);
    
    // Wheels
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y + player.height, 5, 0, Math.PI * 2);
    ctx.arc(player.x + player.width - 10, player.y + player.height, 5, 0, Math.PI * 2);
    ctx.fill();
}

// Add jerry can to trail
function addJerryCan() {
    jerryCans.push({
        x: player.x,
        y: player.y + player.height / 2,
        width: 15,
        height: 20,
        color: '#FFC107'
    });
}

// Draw jerry cans trail
function drawJerryCans() {
    jerryCans.forEach((can, index) => {
        ctx.fillStyle = can.color;
        ctx.fillRect(can.x - (index * 18), can.y - 10, can.width, can.height);
        
        // Handle
        ctx.strokeStyle = '#FFD54F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(can.x - (index * 18) + 7, can.y - 8, 4, Math.PI, 0);
        ctx.stroke();
    });
}

// Update water drops
function updateWaterDrops() {
    waterDrops.forEach((drop, index) => {
        drop.x -= gameSpeed;
        
        // Check collision with player
        const dist = Math.hypot(drop.x - (player.x + player.width / 2), drop.y - (player.y + player.height / 2));
        if (dist < drop.radius + 20) {
            score++;
            updateScore();
            showFeedback('+1 Water Drop! 💧', 'positive');
            waterDrops.splice(index, 1);
            addJerryCan();
            
            // Increase game speed gradually
            if (score % 5 === 0 && gameSpeed < 6) {
                gameSpeed += 0.5;
            }
        }
        
        // Remove if off screen
        if (drop.x < -drop.radius) {
            waterDrops.splice(index, 1);
        }
    });
}

// Draw water drops
function drawWaterDrops() {
    waterDrops.forEach(drop => {
        ctx.fillStyle = drop.color;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(drop.x - 3, drop.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Update pollutants
function updatePollutants() {
    pollutants.forEach((pollutant, index) => {
        pollutant.x -= gameSpeed;
        
        // Check collision with player
        if (player.x < pollutant.x + pollutant.width &&
            player.x + player.width > pollutant.x &&
            player.y < pollutant.y + pollutant.height &&
            player.y + player.height > pollutant.y) {
            gameOver();
        }
        
        // Remove if off screen
        if (pollutant.x < -pollutant.width) {
            pollutants.splice(index, 1);
        }
    });
}

// Draw pollutants
function drawPollutants() {
    pollutants.forEach(pollutant => {
        ctx.fillStyle = pollutant.color;
        ctx.fillRect(pollutant.x, pollutant.y, pollutant.width, pollutant.height);
        
        // Draw X mark
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pollutant.x + 5, pollutant.y + 5);
        ctx.lineTo(pollutant.x + pollutant.width - 5, pollutant.y + pollutant.height - 5);
        ctx.moveTo(pollutant.x + pollutant.width - 5, pollutant.y + 5);
        ctx.lineTo(pollutant.x + 5, pollutant.y + pollutant.height - 5);
        ctx.stroke();
    });
}

// Game over
function gameOver() {
    gameRunning = false;
    finalScoreDisplay.textContent = score;
    
    let message = '';
    if (score < 5) {
        message = 'Keep trying! Every drop counts!';
    } else if (score < 15) {
        message = 'Good effort! You collected ' + score + ' water drops!';
    } else if (score < 30) {
        message = 'Great job! You helped bring clean water to many!';
    } else {
        message = 'Outstanding! You\'re a true water hero!';
    }
    
    finalMessageDisplay.textContent = message;
    gameOverDisplay.style.display = 'block';
}

// Clear canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    clearCanvas();
    updatePlayer();
    updateWaterDrops();
    updatePollutants();
    
    drawJerryCans();
    drawPlayer();
    drawWaterDrops();
    drawPollutants();
    
    requestAnimationFrame(gameLoop);
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);

// Draw initial state
drawPlayer();
