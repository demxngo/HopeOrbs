
// Game variables
let player;
let hopeOrbs = [];
let enemies = [];
let score = 0;
let brightness = 20;
let gameOver = false;
let gameStarted = false;
let currentScreen = 'menu'; 

// UI elements
let scoreDisplay;
let gameOverScreen;
let finalScoreDisplay;
let restartButton;
let menuScreen;
let instructionsScreen;
let gameContainer;

// Game settings
const CANVAS_WIDTH = Math.min(800, window.innerWidth - 40);
const CANVAS_HEIGHT = Math.min(600, window.innerHeight - 100);
const PLAYER_SIZE = 30;
const ORB_SIZE = 20;
const ENEMY_SIZE = 30;
const INITIAL_ORBS = 5;
const INITIAL_ENEMIES = 3;
const ORB_SPAWN_INTERVAL = 180; // frames
const ENEMY_SPAWN_INTERVAL = 300; // frames

function setup() {
    // Create canvas and attach it to the game-canvas div
    let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('game-canvas');

    // Get UI elements
    scoreDisplay = document.getElementById('score-display');
    gameOverScreen = document.getElementById('game-over-screen');
    finalScoreDisplay = document.getElementById('final-score');
    restartButton = document.getElementById('restart-button');
    menuScreen = document.getElementById('menu-screen');
    instructionsScreen = document.getElementById('instructions-screen');
    gameContainer = document.getElementById('game-container');

    // Menu button event listeners
    document.getElementById('play-button').addEventListener('click', startGame);
    document.getElementById('how-to-play-button').addEventListener('click', showInstructions);
    document.getElementById('back-button').addEventListener('click', showMenu);
    document.getElementById('start-from-instructions').addEventListener('click', startGame);
    document.getElementById('menu-button').addEventListener('click', showMenu);

    // Add restart button event listener for both click and touch
    restartButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log("Restart button clicked via click event");
        restartGame();
    });
    restartButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Restart button touched via touchstart event");
        restartGame();
    });
    restartButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Restart button touched via touchend event");
    });

    // Start with menu screen
    showMenu();
    noLoop(); // Don't start game loop until playing
}

function initializeGame() {
    // Reset game state
    score = 0;
    brightness = 20;
    gameOver = false;
    gameStarted = true;

    // Hide game over screen
    gameOverScreen.classList.add('hidden');

    // Create player object
    player = {
        x: width/2,
        y: height/2,
        size: PLAYER_SIZE
    };

    // Clear arrays
    hopeOrbs = [];
    enemies = [];

    // Spawn initial hope orbs
    for (let i = 0; i < INITIAL_ORBS; i++) {
        spawnHopeOrb();
    }

    // Spawn initial enemies
    for (let i = 0; i < INITIAL_ENEMIES; i++) {
        spawnEnemy();
    }

    // Update score display
    updateScoreDisplay();

    // Resume the draw loop if it was stopped
    loop();
}

function draw() {
    // Only draw game if we're in game mode
    if (currentScreen !== 'game') {
        return;
    }

    // Set background with current brightness
    background(brightness);

    // Check if game is over
    if (gameOver) {
        showGameOver();
        return;
    }

    // Update player position to follow mouse/touch, constrained to canvas
    if (player) {
        // Use touch position if available, otherwise use mouse
        let targetX = mouseX;
        let targetY = mouseY;

        // If there are active touches, use the first touch position
        if (touches && touches.length > 0) {
            targetX = touches[0].x;
            targetY = touches[0].y;
        }

        player.x = constrain(targetX, PLAYER_SIZE/2, width - PLAYER_SIZE/2);
        player.y = constrain(targetY, PLAYER_SIZE/2, height - PLAYER_SIZE/2);
    }

    // Update enemy movement
    for (let enemy of enemies) {
        // Add random movement
        enemy.velX += random(-0.1, 0.1);
        enemy.velY += random(-0.1, 0.1);

        // Constrain velocity
        enemy.velX = constrain(enemy.velX, -3, 3);
        enemy.velY = constrain(enemy.velY, -3, 3);

        // Update position
        enemy.x += enemy.velX;
        enemy.y += enemy.velY;

        // Bounce off walls
        if (enemy.x <= ENEMY_SIZE/2 || enemy.x >= width - ENEMY_SIZE/2) {
            enemy.velX *= -1;
        }
        if (enemy.y <= ENEMY_SIZE/2 || enemy.y >= height - ENEMY_SIZE/2) {
            enemy.velY *= -1;
        }

        // Keep enemies within bounds
        enemy.x = constrain(enemy.x, ENEMY_SIZE/2, width - ENEMY_SIZE/2);
        enemy.y = constrain(enemy.y, ENEMY_SIZE/2, height - ENEMY_SIZE/2);
    }

    // Check collisions
    if (player) {
        // Check player to orb collisions
        for (let i = hopeOrbs.length - 1; i >= 0; i--) {
            let orb = hopeOrbs[i];
            let distance = dist(player.x, player.y, orb.x, orb.y);
            if (distance < (PLAYER_SIZE/2 + ORB_SIZE/2)) {
                collectOrb(i);
            }
        }

        // Check player to enemy collisions
        for (let enemy of enemies) {
            let distance = dist(player.x, player.y, enemy.x, enemy.y);
            if (distance < (PLAYER_SIZE/2 + ENEMY_SIZE/2)) {
                hitEnemy();
                break;
            }
        }
    }

    // Draw player
    if (player) {
        push();
        translate(player.x, player.y);
        noStroke();

        // Create glowing effect with multiple circles
        for (let r = PLAYER_SIZE; r > 10; r -= 5) {
            let alpha = map(r, PLAYER_SIZE, 10, 50, 0);
            fill(255, 255, 100, alpha);
            ellipse(0, 0, r * 2);
        }

        // Inner bright core
        fill(255, 255, 150);
        ellipse(0, 0, 20);
        pop();
    }

    // Draw hope orbs
    for (let orb of hopeOrbs) {
        push();
        translate(orb.x, orb.y);
        noStroke();

        // Outer glow
        fill(255, 255, 100, 100);
        ellipse(0, 0, ORB_SIZE + 5);

        // Main orb
        fill(255, 255, 100);
        ellipse(0, 0, ORB_SIZE);

        // Inner highlight
        fill(255, 255, 180);
        ellipse(0, 0, ORB_SIZE/2);
        pop();
    }

    // Draw enemies
    for (let enemy of enemies) {
        push();
        translate(enemy.x, enemy.y);
        noStroke();

        // Outer red glow
        fill(255, 50, 50, 80);
        ellipse(0, 0, ENEMY_SIZE + 5);

        // Main enemy body
        fill(255, 50, 50);
        ellipse(0, 0, ENEMY_SIZE);

        // Inner dark core
        fill(200, 0, 0);
        ellipse(0, 0, ENEMY_SIZE/2);
        pop();
    }

    // Spawn new orbs and enemies at a time
    if (frameCount % ORB_SPAWN_INTERVAL === 0) {
        spawnHopeOrb();
    }

    if (frameCount % ENEMY_SPAWN_INTERVAL === 0) {
        spawnEnemy();
    }
}

function collectOrb(index) {
    // Remove the orb
    hopeOrbs.splice(index, 1);

    // Increase score
    score++;

    // Increase brightness
    brightness = min(255, brightness + 10);

    // Update score display
    updateScoreDisplay();

    console.log(`Collected orb! Score: ${score}, Brightness: ${brightness}`);
}

function hitEnemy() {
    console.log("Hit enemy! Game over.");
    gameOver = true;
}

function spawnHopeOrb() {
    // Create a hope orb at random positions
    let orb = {
        x: random(ORB_SIZE, width - ORB_SIZE),
        y: random(ORB_SIZE, height - ORB_SIZE)
    };

    hopeOrbs.push(orb);
    console.log(`Spawned hope orb at (${orb.x}, ${orb.y})`);
}

function spawnEnemy() {
    // Create an enemy at random position, away from player
    let x, y;
    let attempts = 0;

    do {
        x = random(ENEMY_SIZE, width - ENEMY_SIZE);
        y = random(ENEMY_SIZE, height - ENEMY_SIZE);
        attempts++;
    } while (player && dist(x, y, player.x, player.y) < 100 && attempts < 50);

    let enemy = {
        x: x,
        y: y,
        velX: random(-2, 2),
        velY: random(-2, 2)
    };

    enemies.push(enemy);
    console.log(`Spawned enemy at (${enemy.x}, ${enemy.y})`);
}

function showGameOver() {
    // Update final score
    finalScoreDisplay.textContent = score;

    // Show game over screen
    gameOverScreen.classList.remove('hidden');

    // Stop the draw loop
    noLoop();
}

function restartGame() {
    console.log("Restart button clicked! Restarting game...");

    // Clear arrays
    hopeOrbs = [];
    enemies = [];

    // Reset frame count to avoid immediate spawning
    frameCount = 0;

    // Reinitialize the game
    initializeGame();
}

// Screen management functions
function showMenu() {
    currentScreen = 'menu';
    if (menuScreen) menuScreen.classList.remove('hidden');
    if (instructionsScreen) instructionsScreen.classList.add('hidden');
    if (gameContainer) gameContainer.classList.add('hidden');
    noLoop();
}

function showInstructions() {
    currentScreen = 'instructions';
    if (menuScreen) menuScreen.classList.add('hidden');
    if (instructionsScreen) instructionsScreen.classList.remove('hidden');
    if (gameContainer) gameContainer.classList.add('hidden');
    noLoop();
}

function startGame() {
    currentScreen = 'game';
    if (menuScreen) menuScreen.classList.add('hidden');
    if (instructionsScreen) instructionsScreen.classList.add('hidden');
    if (gameContainer) gameContainer.classList.remove('hidden');
    initializeGame();
}

function updateScoreDisplay() {
    if (scoreDisplay) {
        scoreDisplay.textContent = `Hope Orbs Collected: ${score}`;
    }
}

// Handle window resize
function windowResized() {
    // Keep the canvas size fixed 
}

// Prevent context menu on right click
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Handle touch events for mobile
function touchStarted() {
    // Update mouse position to touch position 
    if (touches && touches.length > 0) {
        mouseX = touches[0].x;
        mouseY = touches[0].y;
    }
    // Prevent default touch behavior
    return false;
}

function touchMoved() {
    // Update mouse position to touch position
    if (touches && touches.length > 0) {
        mouseX = touches[0].x;
        mouseY = touches[0].y;
    }
    return false;
}

function touchEnded() {
    // Keep the player at the last touch position
    return false;
}

// Add touch event listeners
document.addEventListener('touchstart', function(e) {
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', function(e) {
    e.preventDefault();
}, { passive: false });


