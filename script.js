/**
 * DR. MARIO - FULL GAME SCRIPT
 * Features: True-center rotation, Wall/Floor Kicks, 
 * Delta-time Game Loop, Speed Controller, and Clearing Animations.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCtx = document.getElementById('nextCanvas').getContext('2d');
const scoreElement = document.getElementById('score');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

// Game Constants
const ROWS = 16;
const COLS = 8;
const SIZE = 30; // Block size in pixels
const COLORS = ['#FF2D55', '#00FFDD', '#FFCC00']; // Red, Blue, Yellow

// Game State
let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let score = 0;
let lastTime = 0;
let dropCounter = 0;
let clearingBlocks = []; // Holds blocks currently in "pop" animation

// Next Pill Preview
let nextPillColors = [
    COLORS[Math.floor(Math.random() * 3)], 
    COLORS[Math.floor(Math.random() * 3)]
];

// Active Pill Object
let pill = {
    x: 3,
    y: 1,
    rotation: 0, // 0: Horiz, 1: Vert, 2: Horiz(Rev), 3: Vert(Rev)
    colors: []
};

// Rotation Offset Map (Prevents "scooting" by defining relative block positions)
const ROTATION_MAP = [
    [{dx: 0, dy: 0}, {dx: 1, dy: 0}],  // 0: Horizontal
    [{dx: 0, dy: 0}, {dx: 0, dy: -1}], // 1: Vertical
    [{dx: 1, dy: 0}, {dx: 0, dy: 0}],  // 2: Horizontal (Flipped)
    [{dx: 0, dy: -1}, {dx: 0, dy: 0}]  // 3: Vertical (Flipped)
];

/**
 * CORE LOGIC
 */

function spawnPill() {
    pill.x = 3;
    pill.y = 1;
    pill.rotation = 0;
    pill.colors = [...nextPillColors];
    
    // Generate next colors
    nextPillColors = [
        COLORS[Math.floor(Math.random() * 3)], 
        COLORS[Math.floor(Math.random() * 3)]
    ];
    drawNext();

    // Game Over Check
    if (checkCollision(pill.x, pill.y, pill.rotation)) {
        alert("GAME OVER! Final Score: " + score);
        grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        score = 0;
        updateScore();
    }
}

function getSegments(x, y, r) {
    return [
        {x: x + ROTATION_MAP[r][0].dx, y: y + ROTATION_MAP[r][0].dy, color: pill.colors[0]},
        {x: x + ROTATION_MAP[r][1].dx, y: y + ROTATION_MAP[r][1].dy, color: pill.colors[1]}
    ];
}

function checkCollision(nx, ny, nr) {
    return getSegments(nx, ny, nr).some(s => {
        return s.x < 0 || s.x >= COLS || s.y >= ROWS || (s.y >= 0 && grid[s.y][s.x]);
    });
}

function tryRotate() {
    const nextRot = (pill.rotation + 1) % 4;
    
    // Attempt rotations with "Kicks"
    if (!checkCollision(pill.x, pill.y, nextRot)) {
        pill.rotation = nextRot;
    } else if (!checkCollision(pill.x, pill.y - 1, nextRot)) { // Floor Kick
        pill.y--;
        pill.rotation = nextRot;
    } else if (!checkCollision(pill.x - 1, pill.y, nextRot)) { // Wall Kick Left
        pill.x--;
        pill.rotation = nextRot;
    } else if (!checkCollision(pill.x + 1, pill.y, nextRot)) { // Wall Kick Right
        pill.x++;
        pill.rotation = nextRot;
    }
}

function lock() {
    getSegments(pill.x, pill.y, pill.rotation).forEach(s => {
        if (s.y >= 0) grid[s.y][s.x] = s.color;
    });
    clearMatches();
    spawnPill();
}

/**
 * MATCHING & GRAVITY
 */

function clearMatches() {
    let toClear = [];
    
    // Horizontal & Vertical Scan
    for(let y=0; y<ROWS; y++) {
        for(let x=0; x<COLS; x++) {
            let c = grid[y][x];
            if(!c) continue;
            
            // Check Horizontal 4
            if(x < COLS - 3 && grid[y][x+1] === c && grid[y][x+2] === c && grid[y][x+3] === c) {
                [0,1,2,3].forEach(i => toClear.push({x: x+i, y: y}));
            }
            // Check Vertical 4
            if(y < ROWS - 3 && grid[y+1][x] === c && grid[y+2][x] === c && grid[y+3][x] === c) {
                [0,1,2,3].forEach(i => toClear.push({x: x, y: y+i}));
            }
        }
    }

    if (toClear.length > 0) {
        clearingBlocks = toClear; // Trigger animation state
        
        // Short delay for the "Pop" animation before removing from grid
        setTimeout(() => {
            toClear.forEach(p => { grid[p.y][p.x] = null; });
            clearingBlocks = [];
            score += toClear.length * 10;
            updateScore();
            applyGravity();
        }, 150);
    }
}

function applyGravity() {
    let moved = false;
    for (let x = 0; x < COLS; x++) {
        for (let y = ROWS - 1; y > 0; y--) {
            if (!grid[y][x] && grid[y-1][x]) {
                grid[y][x] = grid[y-1][x];
                grid[y-1][x] = null;
                moved = true;
                y = ROWS; // Re-check this column
            }
        }
    }
    if (moved) setTimeout(applyGravity, 80);
}

/**
 * RENDERING
 */

function drawBlock(x, y, color, targetCtx = ctx, isClearing = false) {
    const s = (targetCtx === ctx) ? SIZE : 20;
    targetCtx.fillStyle = color;
    
    targetCtx.beginPath();
    // Clearing blocks get a rounder "orb" shape
    const radius = isClearing ? s/2 : 6;
    targetCtx.roundRect(x * s + 1, y * s + 1, s - 2, s - 2, radius);
    targetCtx.fill();

    if (!isClearing) {
        // Shine effect
        targetCtx.fillStyle = "rgba(255,255,255,0.2)";
        targetCtx.fillRect(x * s + 5, y * s + 5, s/4, s/4);
    }
}

function drawNext() {
    nextCtx.clearRect(0, 0, 80, 40);
    drawBlock(0.5, 0.5, nextPillColors[0], nextCtx);
    drawBlock(1.5, 0.5, nextPillColors[1], nextCtx);
}

function updateScore() {
    scoreElement.innerText = score.toString().padStart(6, '0');
}

/**
 * GAME LOOP
 */

function gameLoop(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    const dropInterval = 1100 - (speedSlider.value * 100);

    if (dropCounter > dropInterval) {
        if (!checkCollision(pill.x, pill.y + 1, pill.rotation)) {
            pill.y++;
        } else {
            lock();
        }
        dropCounter = 0;
    }

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Static Grid
    grid.forEach((row, y) => row.forEach((col, x) => {
        if (col) {
            const isClearing = clearingBlocks.some(b => b.x === x && b.y === y);
            drawBlock(x, y, col, ctx, isClearing);
        }
    }));

    // Draw Active Pill
    getSegments(pill.x, pill.y, pill.rotation).forEach(s => {
        drawBlock(s.x, s.y, s.color);
    });

    requestAnimationFrame(gameLoop);
}

/**
 * INPUTS
 */

window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (['a', 'arrowleft'].includes(key) && !checkCollision(pill.x - 1, pill.y, pill.rotation)) pill.x--;
    if (['d', 'arrowright'].includes(key) && !checkCollision(pill.x + 1, pill.y, pill.rotation)) pill.x++;
    if (['s', 'arrowdown'].includes(key) && !checkCollision(pill.x, pill.y + 1, pill.rotation)) pill.y++;
    if (['w', 'arrowup', ' '].includes(key)) tryRotate();
});

speedSlider.oninput = () => {
    speedValue.innerText = `Level ${speedSlider.value}`;
};

// Initialize
spawnPill();
requestAnimationFrame(gameLoop);
