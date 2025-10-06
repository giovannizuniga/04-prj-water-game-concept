const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const feedbackDiv = document.getElementById('feedback');
const restartBtn = document.getElementById('restartBtn');

// Game settings
const truckSize = 20;
const canSize = 16;
const dropSize = 14;
const pollutantSize = 14;
const speed = 20;
let direction = 'right';
let score = 0;
let feedback = '';
let gameOver = false;

// Truck and jerry cans
let truck = { x: 100, y: 200 };
let cans = [];

// Water drops and pollutants
let drops = [];
let pollutants = [];

function randomPos(size) {
  return {
    x: Math.floor(Math.random() * (canvas.width - size) / speed) * speed,
    y: Math.floor(Math.random() * (canvas.height - size) / speed) * speed
  };
}

function spawnDrop() {
  drops.push({ ...randomPos(dropSize) });
}
function spawnPollutant() {
  pollutants.push({ ...randomPos(pollutantSize) });
}

function resetGame() {
  truck = { x: 100, y: 200 };
  cans = [];
  drops = [];
  pollutants = [];
  direction = 'right';
  score = 0;
  feedback = '';
  gameOver = false;
  scoreDiv.textContent = 'Score: 0';
  feedbackDiv.textContent = '';
  spawnDrop();
  spawnPollutant();
}

function drawTruck() {
  ctx.fillStyle = '#1976d2';
  ctx.fillRect(truck.x, truck.y, truckSize, truckSize);
  // Draw truck wheels
  ctx.fillStyle = '#333';
  ctx.fillRect(truck.x, truck.y + truckSize - 4, 6, 4);
  ctx.fillRect(truck.x + truckSize - 6, truck.y + truckSize - 4, 6, 4);
}

function drawCans() {
  ctx.fillStyle = '#ffd600';
  cans.forEach(can => {
    ctx.fillRect(can.x, can.y, canSize, canSize);
    // Handle
    ctx.fillStyle = '#333';
    ctx.fillRect(can.x + 2, can.y + 2, 4, 4);
    ctx.fillStyle = '#ffd600';
  });
}

function drawDrops() {
  ctx.fillStyle = '#00bcd4';
  drops.forEach(drop => {
    ctx.beginPath();
    ctx.arc(drop.x + dropSize/2, drop.y + dropSize/2, dropSize/2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPollutants() {
  ctx.fillStyle = '#757575';
  pollutants.forEach(pollutant => {
    ctx.beginPath();
    ctx.arc(pollutant.x + pollutantSize/2, pollutant.y + pollutantSize/2, pollutantSize/2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function moveTruck() {
  if (gameOver) return;
  let prev = { x: truck.x, y: truck.y };
  switch (direction) {
    case 'right': truck.x += speed; break;
    case 'left': truck.x -= speed; break;
    case 'up': truck.y -= speed; break;
    case 'down': truck.y += speed; break;
  }
  // Move cans
  for (let i = cans.length - 1; i > 0; i--) {
    cans[i].x = cans[i-1].x;
    cans[i].y = cans[i-1].y;
  }
  if (cans.length) {
    cans[0].x = prev.x;
    cans[0].y = prev.y;
  }
}

function checkCollisions() {
  // Wall collision
  if (
    truck.x < 0 || truck.x + truckSize > canvas.width ||
    truck.y < 0 || truck.y + truckSize > canvas.height
  ) {
    feedback = 'You hit the wall!';
    gameOver = true;
    return;
  }
  // Self collision
  for (let can of cans) {
    if (truck.x === can.x && truck.y === can.y) {
      feedback = 'You hit your own jerry cans!';
      gameOver = true;
      return;
    }
  }
  // Drop collision
  for (let i = 0; i < drops.length; i++) {
    let drop = drops[i];
    if (
      truck.x < drop.x + dropSize && truck.x + truckSize > drop.x &&
      truck.y < drop.y + dropSize && truck.y + truckSize > drop.y
    ) {
      score++;
      scoreDiv.textContent = 'Score: ' + score;
      feedback = 'Great! You collected water.';
      cans.push({ x: truck.x, y: truck.y });
      drops.splice(i, 1);
      spawnDrop();
      if (score % 5 === 0) {
        feedback = 'Milestone! ' + score + ' drops collected!';
      }
      break;
    }
  }
  // Pollutant collision
  for (let i = 0; i < pollutants.length; i++) {
    let pollutant = pollutants[i];
    if (
      truck.x < pollutant.x + pollutantSize && truck.x + truckSize > pollutant.x &&
      truck.y < pollutant.y + pollutantSize && truck.y + truckSize > pollutant.y
    ) {
      feedback = 'Oh no! You hit a pollutant.';
      gameOver = true;
      break;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTruck();
  drawCans();
  drawDrops();
  drawPollutants();
}

function gameLoop() {
  if (!gameOver) {
    moveTruck();
    checkCollisions();
    draw();
    feedbackDiv.textContent = feedback;
  } else {
    feedbackDiv.textContent = feedback + ' Game Over!';
  }
}

// Controls
window.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp': if (direction !== 'down') direction = 'up'; break;
    case 'ArrowDown': if (direction !== 'up') direction = 'down'; break;
    case 'ArrowLeft': if (direction !== 'right') direction = 'left'; break;
    case 'ArrowRight': if (direction !== 'left') direction = 'right'; break;
  }
});

restartBtn.addEventListener('click', resetGame);

resetGame();
setInterval(gameLoop, 120);
