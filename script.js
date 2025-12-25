const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

const ROWS = 16;
const COLS = 8;
const SIZE = 30;
const COLORS = ['#FF0000', '#00FF00', '#0000FF']; // Red, Green, Blue

let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let score = 0;

// Pill Object
let pill = {
    x: 3,
    y: 0,
    segments: [
        { dx: 0, dy: 0, color: COLORS[Math.floor(Math.random() * 3)] },
        { dx: 1, dy: 0, color: COLORS[Math.floor(Math.random() * 3)] }
    ],
    vertical: false
};

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    grid.forEach((row, y) => {
        row.forEach((color, x) => {
            if (color) drawBlock(x, y, color);
        });
    });

    // Draw Active Pill
    pill.segments.forEach(s => {
        drawBlock(pill.x + s.dx, pill.y + s.dy, s.color);
    });
}

function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * SIZE, y * SIZE, SIZE - 2, SIZE - 2);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(x * SIZE, y * SIZE, SIZE - 2, SIZE - 2);
}

function movePill(dx, dy) {
    if (!checkCollision(pill.x + dx, pill.y + dy, pill.segments)) {
        pill.x += dx;
        pill.y += dy;
        return true;
    }
    if (dy > 0) lockPill();
    return false;
}

function rotatePill() {
    let nextSegments;
    if (pill.vertical) {
        nextSegments = [{ dx: 0, dy: 0, color: pill.segments[0].color }, { dx: 1, dy: 0, color: pill.segments[1].color }];
    } else {
        nextSegments = [{ dx: 0, dy: 0, color: pill.segments[0].color }, { dx: 0, dy: -1, color: pill.segments[1].color }];
    }

    if (!checkCollision(pill.x, pill.y, nextSegments)) {
        pill.segments = nextSegments;
        pill.vertical = !pill.vertical;
    }
}

function checkCollision(nx, ny, segments) {
    return segments.some(s => {
        let tx = nx + s.dx;
        let ty = ny + s.dy;
        return tx < 0 || tx >= COLS || ty >= ROWS || (ty >= 0 && grid[ty][tx]);
    });
}

function lockPill() {
    pill.segments.forEach(s => {
        if (pill.y + s.dy >= 0) {
            grid[pill.y + s.dy][pill.x + s.dx] = s.color;
        }
    });
    clearMatches();
    spawnPill();
}

function spawnPill() {
    pill = {
        x: 3, y: 0,
        segments: [
            { dx: 0, dy: 0, color: COLORS[Math.floor(Math.random() * 3)] },
            { dx: 1, dy: 0, color: COLORS[Math.floor(Math.random() * 3)] }
        ],
        vertical: false
    };
    if (checkCollision(pill.x, pill.y, pill.segments)) {
        alert("Game Over! Score: " + score);
        grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        score = 0;
        scoreElement.innerText = score;
    }
}

function clearMatches() {
    let toClear = new Set();

    // Horizontal check
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS - 3; x++) {
            let color = grid[y][x];
            if (color && grid[y][x+1] === color && grid[y][x+2] === color && grid[y][x+3] === color) {
                [0,1,2,3].forEach(i => toClear.add(`${y},${x+i}`));
            }
        }
    }

    // Vertical check
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS - 3; y++) {
            let color = grid[y][x];
            if (color && grid[y+1][x] === color && grid[y+2][x] === color && grid[y+3][x] === color) {
                [0,1,2,3].forEach(i => toClear.add(`${y+i},${x}`));
            }
        }
    }

    if (toClear.size > 0) {
        toClear.forEach(pos => {
            let [y, x] = pos.split(',').map(Number);
            grid[y][x] = null;
        });
        score += toClear.size * 10;
        scoreElement.innerText = score;
        applyGravity();
    }
}

function applyGravity() {
    for (let x = 0; x < COLS; x++) {
        for (let y = ROWS - 1; y > 0; y--) {
            if (!grid[y][x] && grid[y-1][x]) {
                grid[y][x] = grid[y-1][x];
                grid[y-1][x] = null;
                y = ROWS; // Re-check column
            }
        }
    }
}

// Input Handling
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') movePill(-1, 0);
    if (e.key === 'ArrowRight' || e.key === 'd') movePill(1, 0);
    if (e.key === 'ArrowDown' || e.key === 's') movePill(0, 1);
    if (e.key === 'ArrowUp' || e.key === 'w') rotatePill();
});

// Game Loop
setInterval(() => {
    movePill(0, 1);
    draw();
}, 800);

draw();
