const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Game states
const gameState = {
    running: true,
    score: 0,
    lives: 3,
    level: 1,
    wave: 1
};

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    speed: 5,
    velocityX: 0,
    velocityY: 0
};

// Arrays for game objects
let bullets = [];
let enemies = [];
let particles = [];
let explosions = [];

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        shootBullet();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Bullet class
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 15;
        this.speed = 7;
        this.color = '#00ff88';
    }

    update() {
        this.y -= this.speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff88';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    isOffScreen() {
        return this.y < 0;
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 2 + gameState.level * 0.5;
        this.type = type;
        this.health = type === 'strong' ? 2 : 1;
        this.color = type === 'strong' ? '#ff6b6b' : '#ff00ff';
        this.shootTimer = Math.random() * 100;
    }

    update() {
        this.y += this.speed;
        this.x += Math.sin(this.y * 0.01) * 0.5;
        this.shootTimer--;

        if (this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = 80 + Math.random() * 40;
        }
    }

    draw() {
        // Enemy body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    shoot() {
        bullets.push(new EnemyBullet(this.x + this.width / 2, this.y + this.height));
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
}

// Enemy bullet class
class EnemyBullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 15;
        this.speed = 4;
        this.color = '#ff6b6b';
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff6b6b';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
}

// Particle class for explosions
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 30;
        this.maxLife = 30;
        this.color = color;
        this.size = Math.random() * 3 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // gravity
        this.life--;
    }

    draw() {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isAlive() {
        return this.life > 0;
    }
}

// Shoot bullet
function shootBullet() {
    bullets.push(new Bullet(player.x + player.width / 2 - 2.5, player.y));
}

// Spawn enemies
function spawnEnemies() {
    const enemyCount = 3 + gameState.wave;
    for (let i = 0; i < enemyCount; i++) {
        const x = Math.random() * (canvas.width - 30);
        const type = Math.random() < 0.2 ? 'strong' : 'basic';
        enemies.push(new Enemy(x, -50, type));
    }
}

// Update player
function updatePlayer() {
    player.velocityX = 0;

    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.velocityX = -player.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.velocityX = player.speed;
    }

    player.x += player.velocityX;

    // Boundary check
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

// Draw player
function drawPlayer() {
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Player glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff88';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;

    // Cockpit
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(player.x + 8, player.y + 8, 24, 16);
}

// Collision detection
function checkCollisions() {
    // Bullets hitting enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (
                bullets[i].x < enemies[j].x + enemies[j].width &&
                bullets[i].x + bullets[i].width > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemies[j].height &&
                bullets[i].y + bullets[i].height > enemies[j].y
            ) {
                // Hit!
                enemies[j].health--;
                bullets.splice(i, 1);

                // Particles
                for (let k = 0; k < 8; k++) {
                    particles.push(new Particle(enemies[j].x + enemies[j].width / 2, enemies[j].y + enemies[j].height / 2, enemies[j].color));
                }

                if (enemies[j].health <= 0) {
                    gameState.score += 10;
                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    // Enemy bullets hitting player
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i] instanceof EnemyBullet) {
            if (
                bullets[i].x < player.x + player.width &&
                bullets[i].x + bullets[i].width > player.x &&
                bullets[i].y < player.y + player.height &&
                bullets[i].y + bullets[i].height > player.y
            ) {
                gameState.lives--;
                bullets.splice(i, 1);

                for (let k = 0; k < 15; k++) {
                    particles.push(new Particle(player.x + player.width / 2, player.y + player.height / 2, '#00ff88'));
                }

                if (gameState.lives <= 0) {
                    gameState.running = false;
                    endGame();
                }
            }
        }
    }

    // Enemies hitting player
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (
            enemies[i].x < player.x + player.width &&
            enemies[i].x + enemies[i].width > player.x &&
            enemies[i].y < player.y + player.height &&
            enemies[i].y + player.height > enemies[i].y
        ) {
            gameState.lives -= 2;
            enemies.splice(i, 1);

            for (let k = 0; k < 20; k++) {
                particles.push(new Particle(player.x + player.width / 2, player.y + player.height / 2, '#ff00ff'));
            }

            if (gameState.lives <= 0) {
                gameState.running = false;
                endGame();
            }
        }
    }
}

// End game
function endGame() {
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('finalScore').textContent = `Final Score: ${gameState.score}`;
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
    document.getElementById('lives').textContent = `Lives: ${gameState.lives}`;
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars (background)
    drawStars();

    if (gameState.running) {
        // Update
        updatePlayer();

        // Spawn enemies
        if (enemies.length === 0) {
            gameState.wave++;
            if (gameState.wave % 3 === 0) {
                gameState.level++;
            }
            spawnEnemies();
        }

        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].update();
            bullets[i].draw();

            if (bullets[i].isOffScreen()) {
                bullets.splice(i, 1);
            }
        }

        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update();
            enemies[i].draw();

            if (enemies[i].isOffScreen()) {
                enemies.splice(i, 1);
            }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();

            if (!particles[i].isAlive()) {
                particles.splice(i, 1);
            }
        }

        // Check collisions
        checkCollisions();

        // Update UI
        updateUI();
    }

    // Draw player
    drawPlayer();

    requestAnimationFrame(gameLoop);
}

// Draw stars in background
function drawStars() {
    if (!window.stars) {
        window.stars = [];
        for (let i = 0; i < 50; i++) {
            window.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5,
                opacity: Math.random() * 0.5 + 0.5
            });
        }
    }

    ctx.fillStyle = '#ffffff';
    for (let star of window.stars) {
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.opacity += (Math.random() - 0.5) * 0.1;
        if (star.opacity > 1) star.opacity = 1;
        if (star.opacity < 0.2) star.opacity = 0.2;
    }
    ctx.globalAlpha = 1;
}

// Start the game
spawnEnemies();
gameLoop();
