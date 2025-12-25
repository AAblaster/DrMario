const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const ROWS = 16, COLS = 8, SIZE = 30;
const COLORS = ['#FF2D55', '#00FFDD', '#FFCC00']; 
let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let score = 0;

let nextPill = [COLORS[Math.floor(Math.random() * 3)], COLORS[Math.floor(Math.random() * 3)]];

let pill = {
    x: 3, y: 1,
    rotation: 0, // 0: Horiz, 1: Vert, 2: Horiz(Rev), 3: Vert(Rev)
    colors: []
};

// This defines the "shape" relative to the pivot (x, y)
// By changing these offsets, we ensure the pill stays centered.
const ROTATION_MAP = [
    [{dx: 0, dy: 0}, {dx: 1, dy: 0}],  // 0: Horizontal
    [{dx: 0, dy: 0}, {dx: 0, dy: -1}], // 1: Vertical
    [{dx: 1, dy: 0}, {dx: 0, dy: 0}],  // 2: Horizontal (Flipped)
    [{dx: 0, dy: -1}, {dx: 0, dy: 0}]  // 3: Vertical (Flipped)
];

function spawnPill() {
    pill.x = 3; pill.y = 1; pill.rotation = 0;
    pill.colors = [...nextPill];
    nextPill = [COLORS[Math.floor(Math.random() * 3)], COLORS[Math.floor(Math.random() * 3)]];
    drawNext();
    
    if (checkCollision(pill.x, pill.y, pill.rotation)) {
        alert("GAME OVER");
        grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        score = 0;
        document.getElementById('score').innerText = "000000";
    }
}

function getSegments(x, y, rotation) {
    const layout = ROTATION_MAP[rotation];
    return [
        {x: x + layout[0].dx, y: y + layout[0].dy, color: pill.colors[0]},
        {x: x + layout[1].dx, y: y + layout[1].dy, color: pill.colors[1]}
    ];
}

function checkCollision(nx, ny, nr) {
    return getSegments(nx, ny, nr).some(s => {
        return s.x < 0 || s.x >= COLS || s.y >= ROWS || (s.y >= 0 && grid[s.y][s.x]);
    });
}

function tryRotate() {
    const nextRot = (pill.rotation + 1) % 4;
    
    // 1. Try normal rotation
    if (!checkCollision(pill.x, pill.y, nextRot)) {
        pill.rotation = nextRot;
    } 
    // 2. Wall kick (if against right wall)
    else if (!checkCollision(pill.x - 1, pill.y, nextRot)) {
        pill.x -= 1;
        pill.rotation = nextRot;
    }
    // 3. Wall kick (if against left wall)
    else if (!checkCollision(pill.x + 1, pill.y, nextRot)) {
        pill.x += 1;
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

function clearMatches() {
    let toClear = new Set();
    for(let y=0; y<ROWS; y++) {
        for(let x=0; x<COLS; x++) {
            let c = grid[y][x];
            if(!c) continue;
            // Check 4 in a row
            if(x<COLS-3 && grid[y][x+1]===c && grid[y][x+2]===c && grid[y][x+3]===c) 
                [0,1,2,3].forEach(i => toClear.add(`${y},${x+i}`));
            // Check 4 in a column
            if(y<ROWS-3 && grid[y+1][x]===c && grid[y+2][x]===c && grid[y+3][x]===c) 
                [0,1,2,3].forEach(i => toClear.add(`${y+i},${x}`));
        }
    }
    
    toClear.forEach(pos => {
        let [y,x] = pos.split(',').map(Number);
        grid[y][x] = null;
    });

    if (toClear.size > 0) {
        score += toClear.size * 10;
        document.getElementById('score').innerText = score.toString().padStart(6, '0');
        applyGravity();
    }
}

function applyGravity() {
    let falling = false;
    for (let x = 0; x < COLS; x++) {
        for (let y = ROWS - 1; y > 0; y--) {
            if (!grid[y][x] && grid[y-1][x]) {
                grid[y][x] = grid[y-1][x];
                grid[y-1][x] = null;
                falling = true;
            }
        }
    }
    if (falling) setTimeout(applyGravity, 100);
}

function drawBlock(x, y, color, targetCtx = ctx) {
    const s = (targetCtx === ctx) ? SIZE : 20;
    const padding = 2;
    targetCtx.fillStyle = color;
    
    // Draw rounded block
    targetCtx.beginPath();
    targetCtx.roundRect(x * s + padding, y * s + padding, s - padding*2, s - padding*2, 8);
    targetCtx.fill();
    
    // Modern shine effect
    targetCtx.fillStyle = "rgba(255,255,255,0.2)";
    targetCtx.fillRect(x * s + 6, y * s + 6, s/4, s/4);
}

function drawNext() {
    nextCtx.clearRect(0, 0, 80, 40);
    drawBlock(0.5, 0.5, nextPill[0], nextCtx);
    drawBlock(1.5, 0.5, nextPill[1], nextCtx);
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Grid
    grid.forEach((row, y) => row.forEach((col, x) => { 
        if(col) drawBlock(x, y, col); 
    }));
    
    // Draw Active Pill
    getSegments(pill.x, pill.y, pill.rotation).forEach(s => {
        drawBlock(s.x, s.y, s.color);
    });
}

// Controls
window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (['a', 'arrowleft'].includes(key) && !checkCollision(pill.x - 1, pill.y, pill.rotation)) pill.x--;
    if (['d', 'arrowright'].includes(key) && !checkCollision(pill.x + 1, pill.y, pill.rotation)) pill.x++;
    if (['s', 'arrowdown'].includes(key) && !checkCollision(pill.x, pill.y + 1, pill.rotation)) pill.y++;
    if (['w', 'arrowup', ' '].includes(key)) tryRotate();
    update();
});

// Gravity Loop
setInterval(() => {
    if (!checkCollision(pill.x, pill.y + 1, pill.rotation)) {
        pill.y++;
    } else {
        lock();
    }
    update();
}, 800);

spawnPill();
