const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const ROWS = 16, COLS = 8, SIZE = 30;
const COLORS = ['#FF2D55', '#00FFDD', '#FFCC00']; // Modern Neon Palette
let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let score = 0;

let nextPill = [COLORS[Math.floor(Math.random() * 3)], COLORS[Math.floor(Math.random() * 3)]];

let pill = {
    x: 3, y: 0,
    rotation: 0, // 0: Horiz, 1: Vert, 2: Horiz(Rev), 3: Vert(Rev)
    colors: []
};

function spawnPill() {
    pill.x = 3; pill.y = 1; pill.rotation = 0;
    pill.colors = [...nextPill];
    nextPill = [COLORS[Math.floor(Math.random() * 3)], COLORS[Math.floor(Math.random() * 3)]];
    drawNext();
    
    if (checkCollision(pill.x, pill.y, pill.rotation)) {
        alert("GAME OVER");
        grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        score = 0;
    }
}

function getSegments(x, y, rotation) {
    // Defines where the second half of the pill is based on rotation
    const offsets = [{dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: -1, dy: 0}, {dx: 0, dy: 1}];
    return [
        {x: x, y: y, color: pill.colors[0]},
        {x: x + offsets[rotation].dx, y: y + offsets[rotation].dy, color: pill.colors[1]}
    ];
}

function checkCollision(nx, ny, nr) {
    return getSegments(nx, ny, nr).some(s => {
        return s.x < 0 || s.x >= COLS || s.y >= ROWS || (s.y >= 0 && grid[s.y][s.x]);
    });
}

function tryRotate() {
    let nextRot = (pill.rotation + 1) % 4;
    // Standard rotation
    if (!checkCollision(pill.x, pill.y, nextRot)) {
        pill.rotation = nextRot;
    } 
    // Wall Kick: Try moving left or right if against a wall
    else if (!checkCollision(pill.x - 1, pill.y, nextRot)) {
        pill.x -= 1; pill.rotation = nextRot;
    } 
    else if (!checkCollision(pill.x + 1, pill.y, nextRot)) {
        pill.x += 1; pill.rotation = nextRot;
    }
}

function lock() {
    getSegments(pill.x, pill.y, pill.rotation).forEach(s => {
        if (s.y >= 0) grid[s.y][s.x] = s.color;
    });
    clearMatches();
    spawnPill();
}

function clearMatches() {
    let toClear = new Set();
    // Horizontal & Vertical Match 4 Logic
    for(let y=0; y<ROWS; y++) {
        for(let x=0; x<COLS; x++) {
            let c = grid[y][x];
            if(!c) continue;
            if(x<COLS-3 && [1,2,3].every(i => grid[y][x+i] === c)) [0,1,2,3].forEach(i => toClear.add(`${y},${x+i}`));
            if(y<ROWS-3 && [1,2,3].every(i => grid[y+i][x] === c)) [0,1,2,3].forEach(i => toClear.add(`${y+i},${x}`));
        }
    }
    toClear.forEach(pos => { let [y,x] = pos.split(',').map(Number); grid[y][x] = null; });
    if (toClear.size > 0) {
        score += toClear.size * 10;
        document.getElementById('score').innerText = score.toString().padStart(6, '0');
        applyGravity();
    }
}

function applyGravity() {
    let changed = false;
    for (let x = 0; x < COLS; x++) {
        for (let y = ROWS - 1; y > 0; y--) {
            if (!grid[y][x] && grid[y-1][x]) {
                grid[y][x] = grid[y-1][x];
                grid[y-1][x] = null;
                changed = true;
            }
        }
    }
    if (changed) setTimeout(applyGravity, 100);
}

function drawBlock(x, y, color, targetCtx = ctx) {
    const s = (targetCtx === ctx) ? SIZE : 20;
    targetCtx.fillStyle = color;
    targetCtx.beginPath();
    targetCtx.roundRect(x * s + 2, y * s + 2, s - 4, s - 4, 8);
    targetCtx.fill();
    // Highlight effect
    targetCtx.fillStyle = "rgba(255,255,255,0.3)";
    targetCtx.fillRect(x * s + 6, y * s + 6, 4, 4);
}

function drawNext() {
    nextCtx.clearRect(0, 0, 80, 40);
    drawBlock(0.5, 0.5, nextPill[0], nextCtx);
    drawBlock(1.5, 0.5, nextPill[1], nextCtx);
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    grid.forEach((row, y) => row.forEach((col, x) => { if(col) drawBlock(x, y, col) }));
    getSegments(pill.x, pill.y, pill.rotation).forEach(s => drawBlock(s.x, s.y, s.color));
}

window.addEventListener('keydown', e => {
    if (['a', 'ArrowLeft'].includes(e.key) && !checkCollision(pill.x - 1, pill.y, pill.rotation)) pill.x--;
    if (['d', 'ArrowRight'].includes(e.key) && !checkCollision(pill.x + 1, pill.y, pill.rotation)) pill.x++;
    if (['s', 'ArrowDown'].includes(e.key) && !checkCollision(pill.x, pill.y + 1, pill.rotation)) pill.y++;
    if (['w', 'ArrowUp', ' '].includes(e.key)) tryRotate();
    update();
});

setInterval(() => {
    if (!checkCollision(pill.x, pill.y + 1, pill.rotation)) pill.y++;
    else lock();
    update();
}, 800);

spawnPill();
