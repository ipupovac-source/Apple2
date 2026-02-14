// ============================================================
//  CINDY THE SNAKE — Apple II style
//  Architecture mirrors 6502 original:
//    Backend : 40×24 character grid (logic & collision)
//    Frontend: Canvas renderer with custom bitmap characters
// ============================================================

(function () {
  "use strict";

  // ── Display constants (Apple II text mode: 40 cols × 24 rows) ──
  const COLS = 40;
  const ROWS = 24;
  const CHAR_W = 7;           // Apple II character cell: 7 px wide
  const CHAR_H = 8;           // Apple II character cell: 8 px tall
  const SCALE = 3;            // upscale factor for modern screens
  const PX_W = CHAR_W * SCALE;
  const PX_H = CHAR_H * SCALE;
  const CANVAS_W = COLS * PX_W;
  const CANVAS_H = ROWS * PX_H;

  // ── Apple II Lo-Res palette ──
  const PALETTE = {
    BLACK:   "#000000",
    RED:     "#901740",
    DKBLUE:  "#402ca5",
    MAGENTA: "#d043e5",
    DKGREEN: "#006940",
    GRAY:    "#808080",
    MIDBLUE: "#2f95e5",
    LTBLUE:  "#bfabff",
    BROWN:   "#405400",
    ORANGE:  "#d06a1a",
    LTGRAY:  "#808080",
    APRICOT: "#ff96bf",
    GREEN:   "#2fbc1a",
    YELLOW:  "#bfd35a",
    AQUA:    "#6fe8bf",
    WHITE:   "#ffffff",
  };

  // Phosphor green tint for text
  const GREEN_TEXT = "#33ff33";
  const DIM_GREEN  = "#118811";

  // ── Game states ──
  const STATE_INTRO    = 4;
  const STATE_TITLE    = 0;
  const STATE_PLAYING  = 1;
  const STATE_GAMEOVER = 2;
  const STATE_PAUSED   = 3;
  const STATE_DYING    = 5;

  // ── Backend cell types (character grid) ──
  const CELL_EMPTY = 0;
  const CELL_WALL  = 1;
  const CELL_SNAKE = 2;
  const CELL_FOOD  = 3;

  // ── Direction vectors ──
  const DIR = {
    UP:    { x:  0, y: -1 },
    DOWN:  { x:  0, y:  1 },
    LEFT:  { x: -1, y:  0 },
    RIGHT: { x:  1, y:  0 },
  };

  // ── Canvas setup ──
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  // Off-screen buffer for character bitmap rendering
  const charCanvas = document.createElement("canvas");
  charCanvas.width = CHAR_W;
  charCanvas.height = CHAR_H;
  const charCtx = charCanvas.getContext("2d");

  // ============================================================
  //  CUSTOM BITMAP CHARACTERS (7×8 pixel bitmaps)
  //  Each array has 8 rows; each row is a 7-bit number
  //  Bit 6 = leftmost pixel, bit 0 = rightmost pixel
  // ============================================================
  const BITMAPS = {
    // Wall block — solid brick pattern
    wall: [
      0b1111111,
      0b1000100,
      0b1111111,
      0b0010001,
      0b1111111,
      0b1000100,
      0b1111111,
      0b0010001,
    ],
    // Snake head facing right
    head_r: [
      0b0111100,
      0b1111110,
      0b1101110,
      0b1111111,
      0b1111111,
      0b1101110,
      0b1111110,
      0b0111100,
    ],
    // Snake head facing left
    head_l: [
      0b0011110,
      0b0111111,
      0b0111011,
      0b1111111,
      0b1111111,
      0b0111011,
      0b0111111,
      0b0011110,
    ],
    // Snake head facing up
    head_u: [
      0b0010100,
      0b0111110,
      0b1101011,
      0b1111111,
      0b1111111,
      0b1111111,
      0b0111110,
      0b0111110,
    ],
    // Snake head facing down
    head_d: [
      0b0111110,
      0b0111110,
      0b1111111,
      0b1111111,
      0b1111111,
      0b1101011,
      0b0111110,
      0b0010100,
    ],
    // Snake body segment
    body: [
      0b0000000,
      0b0111110,
      0b0111110,
      0b1111111,
      0b1111111,
      0b0111110,
      0b0111110,
      0b0000000,
    ],
    // Snake tail (small)
    tail: [
      0b0000000,
      0b0000000,
      0b0011100,
      0b0111110,
      0b0111110,
      0b0011100,
      0b0000000,
      0b0000000,
    ],
    // Food — apple shape
    food: [
      0b0001000,
      0b0001100,
      0b0111110,
      0b1111111,
      0b1111111,
      0b1111111,
      0b0111110,
      0b0010100,
    ],
    // Food alt — star/diamond
    food2: [
      0b0000000,
      0b0010100,
      0b0011100,
      0b1111111,
      0b0011100,
      0b0010100,
      0b0000000,
      0b0000000,
    ],
    // Heart / life icon
    life: [
      0b0000000,
      0b0110110,
      0b1111111,
      0b1111111,
      0b0111110,
      0b0011100,
      0b0001000,
      0b0000000,
    ],
  };

  // ── Apple II-style bitmap font (subset for our needs) ──
  // 7×8 bitmaps for uppercase + digits + punctuation
  const FONT = buildFont();

  function buildFont() {
    const f = {};
    // Compact font definitions — each char is 8 rows of 7-bit values
    const defs = {
      "A": [0b0011100,0b0100010,0b1000001,0b1000001,0b1111111,0b1000001,0b1000001,0b0000000],
      "B": [0b1111110,0b1000001,0b1000001,0b1111110,0b1000001,0b1000001,0b1111110,0b0000000],
      "C": [0b0111110,0b1000001,0b1000000,0b1000000,0b1000000,0b1000001,0b0111110,0b0000000],
      "D": [0b1111100,0b1000010,0b1000001,0b1000001,0b1000001,0b1000010,0b1111100,0b0000000],
      "E": [0b1111111,0b1000000,0b1000000,0b1111100,0b1000000,0b1000000,0b1111111,0b0000000],
      "F": [0b1111111,0b1000000,0b1000000,0b1111100,0b1000000,0b1000000,0b1000000,0b0000000],
      "G": [0b0111110,0b1000001,0b1000000,0b1001111,0b1000001,0b1000001,0b0111110,0b0000000],
      "H": [0b1000001,0b1000001,0b1000001,0b1111111,0b1000001,0b1000001,0b1000001,0b0000000],
      "I": [0b0111110,0b0001000,0b0001000,0b0001000,0b0001000,0b0001000,0b0111110,0b0000000],
      "J": [0b0011111,0b0000100,0b0000100,0b0000100,0b0000100,0b1000100,0b0111000,0b0000000],
      "K": [0b1000010,0b1000100,0b1001000,0b1110000,0b1001000,0b1000100,0b1000010,0b0000000],
      "L": [0b1000000,0b1000000,0b1000000,0b1000000,0b1000000,0b1000000,0b1111111,0b0000000],
      "M": [0b1000001,0b1100011,0b1010101,0b1001001,0b1000001,0b1000001,0b1000001,0b0000000],
      "N": [0b1000001,0b1100001,0b1010001,0b1001001,0b1000101,0b1000011,0b1000001,0b0000000],
      "O": [0b0111110,0b1000001,0b1000001,0b1000001,0b1000001,0b1000001,0b0111110,0b0000000],
      "P": [0b1111110,0b1000001,0b1000001,0b1111110,0b1000000,0b1000000,0b1000000,0b0000000],
      "Q": [0b0111110,0b1000001,0b1000001,0b1000001,0b1000101,0b1000010,0b0111101,0b0000000],
      "R": [0b1111110,0b1000001,0b1000001,0b1111110,0b1001000,0b1000100,0b1000010,0b0000000],
      "S": [0b0111110,0b1000001,0b1000000,0b0111110,0b0000001,0b1000001,0b0111110,0b0000000],
      "T": [0b1111111,0b0001000,0b0001000,0b0001000,0b0001000,0b0001000,0b0001000,0b0000000],
      "U": [0b1000001,0b1000001,0b1000001,0b1000001,0b1000001,0b1000001,0b0111110,0b0000000],
      "V": [0b1000001,0b1000001,0b1000001,0b0100010,0b0100010,0b0010100,0b0001000,0b0000000],
      "W": [0b1000001,0b1000001,0b1000001,0b1001001,0b1010101,0b1100011,0b1000001,0b0000000],
      "X": [0b1000001,0b0100010,0b0010100,0b0001000,0b0010100,0b0100010,0b1000001,0b0000000],
      "Y": [0b1000001,0b0100010,0b0010100,0b0001000,0b0001000,0b0001000,0b0001000,0b0000000],
      "Z": [0b1111111,0b0000010,0b0000100,0b0001000,0b0010000,0b0100000,0b1111111,0b0000000],
      "0": [0b0111110,0b1000011,0b1000101,0b1001001,0b1010001,0b1100001,0b0111110,0b0000000],
      "1": [0b0001000,0b0011000,0b0001000,0b0001000,0b0001000,0b0001000,0b0111110,0b0000000],
      "2": [0b0111110,0b1000001,0b0000010,0b0011100,0b0100000,0b1000000,0b1111111,0b0000000],
      "3": [0b0111110,0b1000001,0b0000001,0b0011110,0b0000001,0b1000001,0b0111110,0b0000000],
      "4": [0b0000100,0b0001100,0b0010100,0b0100100,0b1111111,0b0000100,0b0000100,0b0000000],
      "5": [0b1111111,0b1000000,0b1111110,0b0000001,0b0000001,0b1000001,0b0111110,0b0000000],
      "6": [0b0111110,0b1000000,0b1000000,0b1111110,0b1000001,0b1000001,0b0111110,0b0000000],
      "7": [0b1111111,0b0000001,0b0000010,0b0000100,0b0001000,0b0001000,0b0001000,0b0000000],
      "8": [0b0111110,0b1000001,0b1000001,0b0111110,0b1000001,0b1000001,0b0111110,0b0000000],
      "9": [0b0111110,0b1000001,0b1000001,0b0111111,0b0000001,0b0000001,0b0111110,0b0000000],
      " ": [0b0000000,0b0000000,0b0000000,0b0000000,0b0000000,0b0000000,0b0000000,0b0000000],
      ":": [0b0000000,0b0001000,0b0001000,0b0000000,0b0000000,0b0001000,0b0001000,0b0000000],
      "-": [0b0000000,0b0000000,0b0000000,0b0111110,0b0000000,0b0000000,0b0000000,0b0000000],
      "!": [0b0001000,0b0001000,0b0001000,0b0001000,0b0001000,0b0000000,0b0001000,0b0000000],
      ".": [0b0000000,0b0000000,0b0000000,0b0000000,0b0000000,0b0001100,0b0001100,0b0000000],
      ",": [0b0000000,0b0000000,0b0000000,0b0000000,0b0000000,0b0001000,0b0010000,0b0000000],
      "'": [0b0001000,0b0001000,0b0010000,0b0000000,0b0000000,0b0000000,0b0000000,0b0000000],
      "*": [0b0000000,0b0001000,0b0101010,0b0011100,0b0101010,0b0001000,0b0000000,0b0000000],
      "/": [0b0000001,0b0000010,0b0000100,0b0001000,0b0010000,0b0100000,0b1000000,0b0000000],
      "(": [0b0000100,0b0001000,0b0010000,0b0010000,0b0010000,0b0001000,0b0000100,0b0000000],
      ")": [0b0010000,0b0001000,0b0000100,0b0000100,0b0000100,0b0001000,0b0010000,0b0000000],
      "[": [0b0011100,0b0010000,0b0010000,0b0010000,0b0010000,0b0010000,0b0011100,0b0000000],
      "]": [0b0011100,0b0000100,0b0000100,0b0000100,0b0000100,0b0000100,0b0011100,0b0000000],
    };
    for (const ch in defs) f[ch] = defs[ch];
    return f;
  }

  // ============================================================
  //  BACKEND — Character grid (collision & game state)
  // ============================================================
  let grid = [];          // 2D array [row][col] of CELL_* values
  let snake = [];         // array of {x,y} — head is snake[0]
  let direction = DIR.RIGHT;
  let nextDirection = DIR.RIGHT;
  let foodPos = null;
  let foodType = 0;       // alternates visual
  let score = 0;
  let hiScore = 0;
  let gameState = STATE_INTRO;
  let introTimer = 0;
  let tickInterval = 150; // ms between moves
  let lastTick = 0;
  let animFrame = 0;      // for blinking cursor / animations
  let deathFlashTimer = 0;
  let lives = 3;
  let dyingTimer = 0;

  // Playfield boundaries (inside the wall border)
  // Row 0: title bar, Row 1: top wall, Row 22: bottom wall, Row 23: status bar
  const PLAY_TOP = 2;
  const PLAY_BOTTOM = 21;
  const PLAY_LEFT = 1;
  const PLAY_RIGHT = 38;

  function initGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        grid[r][c] = CELL_EMPTY;
      }
    }
    // Draw walls (row 1 and row 22 are horizontal walls, cols 0 and 39 are vertical)
    for (let c = 0; c < COLS; c++) {
      grid[1][c] = CELL_WALL;
      grid[22][c] = CELL_WALL;
    }
    for (let r = 1; r <= 22; r++) {
      grid[r][0] = CELL_WALL;
      grid[r][39] = CELL_WALL;
    }
  }

  function initSnake() {
    snake = [];
    const startX = 10;
    const startY = 12;
    for (let i = 0; i < 4; i++) {
      snake.push({ x: startX - i, y: startY });
    }
    direction = DIR.RIGHT;
    nextDirection = DIR.RIGHT;
    // Mark snake cells on grid
    for (const seg of snake) {
      grid[seg.y][seg.x] = CELL_SNAKE;
    }
  }

  function spawnFood() {
    let attempts = 0;
    while (attempts < 1000) {
      const x = PLAY_LEFT + Math.floor(Math.random() * (PLAY_RIGHT - PLAY_LEFT + 1));
      const y = PLAY_TOP + Math.floor(Math.random() * (PLAY_BOTTOM - PLAY_TOP + 1));
      if (grid[y][x] === CELL_EMPTY) {
        foodPos = { x, y };
        foodType = Math.random() < 0.5 ? 0 : 1;
        grid[y][x] = CELL_FOOD;
        return;
      }
      attempts++;
    }
  }

  function startGame() {
    score = 0;
    lives = 3;
    tickInterval = 150;
    initGrid();
    initSnake();
    spawnFood();
    gameState = STATE_PLAYING;
    deathFlashTimer = 0;
  }

  // ── Backend: move snake, detect collisions ──
  function tick() {
    direction = nextDirection;
    const head = snake[0];
    const nx = head.x + direction.x;
    const ny = head.y + direction.y;

    // Collision detection (backend — checks character grid)
    const targetCell = grid[ny][nx];
    if (targetCell === CELL_WALL || targetCell === CELL_SNAKE) {
      // Death!
      lives--;
      deathFlashTimer = 12;
      if (lives <= 0) {
        gameState = STATE_GAMEOVER;
        if (score > hiScore) hiScore = score;
      } else {
        gameState = STATE_DYING;
        dyingTimer = 60;
      }
      return;
    }

    const ateFood = (targetCell === CELL_FOOD);

    // Move head
    snake.unshift({ x: nx, y: ny });
    grid[ny][nx] = CELL_SNAKE;

    if (ateFood) {
      // Snake grows — don't remove tail
      score += 10;
      // Speed up slightly
      if (tickInterval > 70) tickInterval -= 2;
      spawnFood();
    } else {
      // Remove tail
      const tail = snake.pop();
      grid[tail.y][tail.x] = CELL_EMPTY;
    }
  }

  // ============================================================
  //  FRONTEND — Canvas renderer with custom bitmaps
  // ============================================================

  // Draw a 7×8 bitmap at grid position (col, row) with given color
  function drawBitmap(bitmap, col, row, fgColor, bgColor) {
    const ox = col * PX_W;
    const oy = row * PX_H;
    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(ox, oy, PX_W, PX_H);
    }
    ctx.fillStyle = fgColor;
    for (let r = 0; r < 8; r++) {
      const bits = bitmap[r];
      for (let b = 6; b >= 0; b--) {
        if (bits & (1 << b)) {
          const px = (6 - b) * SCALE;
          const py = r * SCALE;
          ctx.fillRect(ox + px, oy + py, SCALE, SCALE);
        }
      }
    }
  }

  // Draw a text string at grid position using our bitmap font
  function drawText(str, col, row, color, bgColor) {
    const s = str.toUpperCase();
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      const bmp = FONT[ch];
      if (bmp) {
        drawBitmap(bmp, col + i, row, color || GREEN_TEXT, bgColor || null);
      }
    }
  }

  // Draw text centered on a row
  function drawTextCentered(str, row, color, bgColor) {
    const col = Math.floor((COLS - str.length) / 2);
    drawText(str, col, row, color, bgColor);
  }

  // Clear entire screen
  function clearScreen() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // ── Render the playing field ──
  function renderGame() {
    clearScreen();

    // Row 0 — Title bar
    ctx.fillStyle = "#001800";
    ctx.fillRect(0, 0, CANVAS_W, PX_H);
    drawText("CINDY THE SNAKE", 1, 0, GREEN_TEXT);
    const scoreStr = "SCORE:" + String(score).padStart(5, "0");
    drawText(scoreStr, COLS - scoreStr.length - 1, 0, GREEN_TEXT);

    // Draw walls and food from backend grid
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c];
        if (cell === CELL_WALL) {
          drawBitmap(BITMAPS.wall, c, r, PALETTE.GREEN, "#001200");
        } else if (cell === CELL_FOOD) {
          const fbmp = foodType === 0 ? BITMAPS.food : BITMAPS.food2;
          const fcol = foodType === 0 ? PALETTE.RED : PALETTE.YELLOW;
          // Pulsing animation
          const pulse = Math.sin(animFrame * 0.15) > 0;
          drawBitmap(fbmp, c, r, pulse ? fcol : PALETTE.ORANGE);
        }
      }
    }

    // Draw snake (frontend graphics from backend positions)
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      if (i === 0) {
        // Head — pick direction bitmap
        let hbmp;
        if (direction === DIR.RIGHT) hbmp = BITMAPS.head_r;
        else if (direction === DIR.LEFT) hbmp = BITMAPS.head_l;
        else if (direction === DIR.UP) hbmp = BITMAPS.head_u;
        else hbmp = BITMAPS.head_d;

        // Death flash
        if (gameState === STATE_GAMEOVER && deathFlashTimer > 0) {
          const flashOn = deathFlashTimer % 2 === 0;
          drawBitmap(hbmp, seg.x, seg.y, flashOn ? PALETTE.WHITE : PALETTE.RED);
        } else {
          drawBitmap(hbmp, seg.x, seg.y, PALETTE.GREEN);
        }
      } else if (i === snake.length - 1) {
        // Tail
        drawBitmap(BITMAPS.tail, seg.x, seg.y, PALETTE.GREEN);
      } else {
        // Body — alternating shade for visual interest
        const shade = (i % 2 === 0) ? PALETTE.GREEN : "#1fa015";
        drawBitmap(BITMAPS.body, seg.x, seg.y, shade);
      }
    }

    // Row 23 — Status bar
    ctx.fillStyle = "#001800";
    ctx.fillRect(0, 23 * PX_H, CANVAS_W, PX_H);
    drawText("HI:" + String(hiScore).padStart(5, "0"), 1, 23, DIM_GREEN);
    // Lives display (heart icons)
    for (let i = 0; i < lives; i++) {
      drawBitmap(BITMAPS.life, COLS - 3 - i, 23, PALETTE.RED);
    }

    if (gameState === STATE_PAUSED) {
      drawTextCentered("PAUSED", 23, PALETTE.YELLOW);
    }
  }

  // ── Intro splash: "21ST CENTURY IPS" with searchlight ──
  function renderIntro() {
    clearScreen();
    introTimer++;

    // Start intro music (works after first user interaction unlocks audio)
    if (!introMusicStarted) {
      playIntroMusic();
    }

    // --- Searchlight beams (behind the monument) ---
    // Source point: bottom-right area
    var srcX = 32 * PX_W;
    var srcY = 22 * PX_H;
    // Sweep angle: oscillate slowly
    var baseAngle = -Math.PI / 2; // straight up
    var sweep = Math.sin(introTimer * 0.012) * 0.6;
    var NUM_BEAMS = 5;
    var beamSpread = 0.08;

    ctx.save();
    ctx.globalAlpha = 0.12;
    for (var b = 0; b < NUM_BEAMS; b++) {
      var angle = baseAngle + sweep + (b - (NUM_BEAMS - 1) / 2) * beamSpread;
      var beamLen = CANVAS_H * 1.2;
      var endX = srcX + Math.cos(angle) * beamLen;
      var endY = srcY + Math.sin(angle) * beamLen;
      // Draw beam as a thin triangle
      var perpX = Math.cos(angle + Math.PI / 2) * 3;
      var perpY = Math.sin(angle + Math.PI / 2) * 3;
      ctx.fillStyle = GREEN_TEXT;
      ctx.beginPath();
      ctx.moveTo(srcX - 2, srcY);
      ctx.lineTo(srcX + 2, srcY);
      ctx.lineTo(endX + perpX, endY + perpY);
      ctx.lineTo(endX - perpX, endY - perpY);
      ctx.closePath();
      ctx.fill();
    }

    // Second searchlight from left
    var srcX2 = 8 * PX_W;
    var sweep2 = Math.sin(introTimer * 0.015 + 1.5) * 0.5;
    for (var b2 = 0; b2 < 3; b2++) {
      var angle2 = baseAngle + sweep2 + (b2 - 1) * beamSpread;
      var beamLen2 = CANVAS_H * 1.2;
      var endX2 = srcX2 + Math.cos(angle2) * beamLen2;
      var endY2 = srcY + Math.sin(angle2) * beamLen2;
      var perpX2 = Math.cos(angle2 + Math.PI / 2) * 2;
      var perpY2 = Math.sin(angle2 + Math.PI / 2) * 2;
      ctx.fillStyle = GREEN_TEXT;
      ctx.beginPath();
      ctx.moveTo(srcX2 - 2, srcY);
      ctx.lineTo(srcX2 + 2, srcY);
      ctx.lineTo(endX2 + perpX2, endY2 + perpY2);
      ctx.lineTo(endX2 - perpX2, endY2 - perpY2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // --- Monument / pedestal structure ---
    // Base platform
    for (var c = 8; c <= 31; c++) {
      drawBitmap(BITMAPS.wall, c, 18, PALETTE.GREEN);
    }
    // Pillars
    for (var r = 8; r <= 17; r++) {
      drawBitmap(BITMAPS.wall, 8, r, PALETTE.GREEN);
      drawBitmap(BITMAPS.wall, 9, r, PALETTE.GREEN);
      drawBitmap(BITMAPS.wall, 30, r, PALETTE.GREEN);
      drawBitmap(BITMAPS.wall, 31, r, PALETTE.GREEN);
    }
    // Top cap
    for (var c2 = 8; c2 <= 31; c2++) {
      drawBitmap(BITMAPS.wall, c2, 7, PALETTE.GREEN);
    }
    // Steps
    for (var c3 = 6; c3 <= 33; c3++) {
      drawBitmap(BITMAPS.wall, c3, 19, DIM_GREEN);
    }
    for (var c4 = 4; c4 <= 35; c4++) {
      drawBitmap(BITMAPS.wall, c4, 20, "#0a4a0a");
    }

    // --- Big text: "21ST" ---
    // Draw each letter 2x2 cells for a big look
    drawBigText("21ST", 13, 9, GREEN_TEXT);

    // --- "CENTURY" ---
    drawBigText("CENTURY", 10, 12, GREEN_TEXT);

    // --- "IPS" ---
    drawBigText("IPS", 15, 15, PALETTE.WHITE);

    // --- Bottom text ---
    drawTextCentered("PRESENTS", 22, DIM_GREEN);

    // --- Blinking skip prompt ---
    if (introTimer > 60 && Math.sin(animFrame * 0.1) > 0) {
      drawTextCentered("TAP OR PRESS SPACE", 23, "#005500");
    }

    // Auto-advance after ~6 seconds
    if (introTimer > 360) {
      stopIntroMusic();
      gameState = STATE_TITLE;
      introTimer = 0;
    }
  }

  // Draw text with 2×2 scaled characters (big logo text)
  function drawBigText(str, startCol, startRow, color) {
    var s = str.toUpperCase();
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      var bmp = FONT[ch];
      if (!bmp) continue;
      // Draw the bitmap scaled 2x, at grid positions
      var ox = (startCol + i * 2) * PX_W;
      var oy = startRow * PX_H;
      ctx.fillStyle = color;
      for (var r = 0; r < 8; r++) {
        var bits = bmp[r];
        for (var b = 6; b >= 0; b--) {
          if (bits & (1 << b)) {
            var px = (6 - b) * SCALE * 2;
            var py = r * SCALE * 2;
            ctx.fillRect(ox + px, oy + py, SCALE * 2, SCALE * 2);
          }
        }
      }
    }
  }

  // ── Title screen ──
  function renderTitle() {
    clearScreen();

    // Border decoration
    for (let c = 0; c < COLS; c++) {
      drawBitmap(BITMAPS.wall, c, 0, PALETTE.GREEN, "#001200");
      drawBitmap(BITMAPS.wall, c, 23, PALETTE.GREEN, "#001200");
    }
    for (let r = 0; r < ROWS; r++) {
      drawBitmap(BITMAPS.wall, 0, r, PALETTE.GREEN, "#001200");
      drawBitmap(BITMAPS.wall, 39, r, PALETTE.GREEN, "#001200");
    }

    // Title
    drawTextCentered("CINDY THE SNAKE", 4, GREEN_TEXT);

    // Snake art
    const artRow = 7;
    drawBitmap(BITMAPS.head_r, 24, artRow, PALETTE.GREEN);
    for (let i = 0; i < 8; i++) {
      const shade = i % 2 === 0 ? PALETTE.GREEN : "#1fa015";
      drawBitmap(BITMAPS.body, 23 - i, artRow, shade);
    }
    drawBitmap(BITMAPS.tail, 15, artRow, PALETTE.GREEN);

    // Food
    drawBitmap(BITMAPS.food, 27, artRow, PALETTE.RED);

    // Instructions
    drawTextCentered("ARROWS/WASD OR SWIPE", 11, DIM_GREEN);
    drawTextCentered("TO MOVE", 12, DIM_GREEN);

    drawTextCentered("EAT FOOD TO GROW", 14, DIM_GREEN);
    drawTextCentered("AVOID WALLS AND YOURSELF", 15, DIM_GREEN);

    drawTextCentered("TAP TO PAUSE", 17, DIM_GREEN);

    // Blinking prompt
    if (Math.sin(animFrame * 0.08) > 0) {
      drawTextCentered("TAP OR PRESS SPACE", 20, GREEN_TEXT);
    }

    // Credits
    drawTextCentered("APPLE ][ 1982", 22, "#005500");
  }

  // ── Game over screen ──
  function renderGameOver() {
    // Keep the game field visible, overlay message
    renderGame();

    // Semi-dark overlay via dark rectangles
    const overlayTop = 8;
    const overlayBot = 16;
    for (let r = overlayTop; r <= overlayBot; r++) {
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(3 * PX_W, r * PX_H, 34 * PX_W, PX_H);
    }

    // Border for overlay
    for (let c = 3; c <= 36; c++) {
      drawBitmap(BITMAPS.wall, c, overlayTop, PALETTE.RED);
      drawBitmap(BITMAPS.wall, c, overlayBot, PALETTE.RED);
    }
    for (let r = overlayTop; r <= overlayBot; r++) {
      drawBitmap(BITMAPS.wall, 3, r, PALETTE.RED);
      drawBitmap(BITMAPS.wall, 36, r, PALETTE.RED);
    }

    drawTextCentered("GAME OVER!", 10, PALETTE.RED);
    drawTextCentered("SCORE: " + String(score).padStart(5, "0"), 12, GREEN_TEXT);
    if (score >= hiScore) {
      drawTextCentered("NEW HIGH SCORE!", 13, PALETTE.YELLOW);
    }

    if (Math.sin(animFrame * 0.08) > 0) {
      drawTextCentered("TAP OR PRESS SPACE", 15, GREEN_TEXT);
    }
  }

  // ============================================================
  //  AUDIO — Apple II style single-channel square wave
  //  "Forever Young" (Alphaville) refrain, digitized from vinyl
  //  Single speaker, one channel — authentic Apple II sound
  // ============================================================
  let audioCtx = null;
  let introMusicNodes = [];
  let introMusicStarted = false;

  // Melody constants
  const MELODY_BPM = 108;
  const BEAT_MS = 60000 / MELODY_BPM;
  const N8  = BEAT_MS / 2;       // eighth note  ~278ms
  const NQ  = BEAT_MS;           // quarter note  ~556ms
  const NDQ = BEAT_MS * 1.5;     // dotted quarter ~834ms
  const NH  = BEAT_MS * 2;       // half note     ~1111ms

  // Note frequencies (key of D major)
  const _D4 = 293.66, _E4 = 329.63, _Fs4 = 369.99;
  const _G4 = 392.00, _A4 = 440.00, _R = 0;

  // "Forever young, I want to be forever young
  //  Do you really want to live forever, forever, forever young"
  const INTRO_MELODY = [
    // "For-ev-er young"
    [_D4,N8],[_D4,N8],[_E4,N8],[_Fs4,NDQ],
    // "I want to be"
    [_Fs4,N8],[_E4,N8],[_D4,N8],[_E4,N8],
    // "for-ev-er young"
    [_D4,N8],[_D4,N8],[_E4,N8],[_Fs4,NDQ],[_R,N8],
    // "Do you real-ly"
    [_A4,N8],[_A4,N8],[_G4,N8],[_Fs4,N8],
    // "want to live"
    [_E4,N8],[_D4,N8],[_E4,NQ],
    // "for-ev-er"
    [_Fs4,N8],[_Fs4,N8],[_E4,NQ],
    // "for-ev-er"
    [_D4,N8],[_E4,N8],[_Fs4,NQ],
    // "for-ev-er young"
    [_D4,N8],[_D4,N8],[_E4,N8],[_Fs4,NH],
  ];

  function playIntroMusic() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      stopIntroMusic();
      introMusicStarted = true;
      let time = audioCtx.currentTime + 0.1;
      const gap = 0.015; // tiny click gap between notes (Apple II feel)
      for (const [freq, dur] of INTRO_MELODY) {
        const durSec = dur / 1000;
        if (freq > 0) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "square";
          osc.frequency.value = freq;
          gain.gain.value = 0.06;
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(time);
          osc.stop(time + durSec - gap);
          introMusicNodes.push(osc);
        }
        time += durSec;
      }
    } catch (e) {
      // Audio not available — silently skip
    }
  }

  function stopIntroMusic() {
    for (const osc of introMusicNodes) {
      try { osc.stop(); } catch (e) {}
    }
    introMusicNodes = [];
    introMusicStarted = false;
  }

  // ============================================================
  //  INPUT HANDLING
  // ============================================================
  const keyMap = {
    ArrowUp: DIR.UP, ArrowDown: DIR.DOWN, ArrowLeft: DIR.LEFT, ArrowRight: DIR.RIGHT,
    w: DIR.UP, W: DIR.UP,
    s: DIR.DOWN, S: DIR.DOWN,
    a: DIR.LEFT, A: DIR.LEFT,
    d: DIR.RIGHT, D: DIR.RIGHT,
  };

  document.addEventListener("keydown", function (e) {
    // Prevent scrolling
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) {
      e.preventDefault();
    }

    // Unlock audio on user interaction
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

    if (gameState === STATE_INTRO) {
      if (e.key === " ") { stopIntroMusic(); gameState = STATE_TITLE; introTimer = 0; }
      return;
    }

    if (gameState === STATE_TITLE) {
      if (e.key === " ") startGame();
      return;
    }

    if (gameState === STATE_GAMEOVER) {
      if (e.key === " ") { gameState = STATE_INTRO; introTimer = 0; }
      return;
    }

    if (gameState === STATE_PLAYING) {
      if (e.key === "p" || e.key === "P") {
        gameState = STATE_PAUSED;
        return;
      }
      const dir = keyMap[e.key];
      if (dir) {
        // Prevent 180° reversal
        if (dir.x !== -direction.x || dir.y !== -direction.y) {
          nextDirection = dir;
        }
      }
    } else if (gameState === STATE_PAUSED) {
      if (e.key === "p" || e.key === "P") {
        gameState = STATE_PLAYING;
      }
    }
  });

  // ============================================================
  //  TOUCH / MOBILE INPUT
  // ============================================================

  // Swipe detection on canvas (for gameplay direction changes)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
  }, { passive: false });

  canvas.addEventListener("touchend", function (e) {
    e.preventDefault();
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    // Swipe — change direction during gameplay
    if (gameState === STATE_PLAYING) {
      const SWIPE_MIN = 30;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > SWIPE_MIN) handleDirection(DIR.RIGHT);
        else if (dx < -SWIPE_MIN) handleDirection(DIR.LEFT);
      } else {
        if (dy > SWIPE_MIN) handleDirection(DIR.DOWN);
        else if (dy < -SWIPE_MIN) handleDirection(DIR.UP);
      }
    }
  }, { passive: false });

  // Tap anywhere on screen — for start, pause, skip intro
  document.addEventListener("touchstart", function (e) {
    // Don't handle D-pad button touches here
    if (e.target.classList && e.target.classList.contains("dpad-btn")) return;

    // Unlock audio on user interaction
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

    if (gameState === STATE_INTRO) {
      e.preventDefault();
      stopIntroMusic(); gameState = STATE_TITLE; introTimer = 0;
    } else if (gameState === STATE_TITLE) {
      e.preventDefault();
      startGame();
    } else if (gameState === STATE_GAMEOVER) {
      e.preventDefault();
      gameState = STATE_INTRO; introTimer = 0;
    } else if (gameState === STATE_PLAYING) {
      // Only pause if tapping canvas area (not D-pad)
      if (e.target === canvas) {
        e.preventDefault();
        gameState = STATE_PAUSED;
      }
    } else if (gameState === STATE_PAUSED) {
      e.preventDefault();
      gameState = STATE_PLAYING;
    }
  }, { passive: false });

  // D-pad buttons
  function setupDpad() {
    var btns = {
      "btn-up": DIR.UP,
      "btn-down": DIR.DOWN,
      "btn-left": DIR.LEFT,
      "btn-right": DIR.RIGHT,
    };
    for (var id in btns) {
      (function (dir) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("touchstart", function (e) {
          e.preventDefault();
          if (gameState === STATE_TITLE) {
            startGame();
          } else if (gameState === STATE_GAMEOVER) {
            gameState = STATE_INTRO; introTimer = 0;
          } else if (gameState === STATE_PLAYING) {
            handleDirection(dir);
          }
        }, { passive: false });
      })(btns[id]);
    }
  }

  function handleDirection(dir) {
    if (dir.x !== -direction.x || dir.y !== -direction.y) {
      nextDirection = dir;
    }
  }

  setupDpad();

  // ============================================================
  //  MAIN LOOP
  // ============================================================
  function gameLoop(timestamp) {
    animFrame++;

    if (gameState === STATE_INTRO) {
      renderIntro();
    } else if (gameState === STATE_PLAYING) {
      if (timestamp - lastTick >= tickInterval) {
        tick();
        lastTick = timestamp;
      }
      renderGame();
    } else if (gameState === STATE_TITLE) {
      renderTitle();
    } else if (gameState === STATE_GAMEOVER) {
      if (deathFlashTimer > 0) {
        if (animFrame % 4 === 0) deathFlashTimer--;
      }
      renderGameOver();
    } else if (gameState === STATE_DYING) {
      if (deathFlashTimer > 0) {
        if (animFrame % 4 === 0) deathFlashTimer--;
      }
      dyingTimer--;
      renderGame();
      // Overlay: show lives remaining
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(8 * PX_W, 10 * PX_H, 24 * PX_W, 3 * PX_H);
      drawTextCentered("LIVES: " + lives, 11, PALETTE.YELLOW);
      if (dyingTimer <= 0) {
        initGrid();
        initSnake();
        spawnFood();
        gameState = STATE_PLAYING;
        deathFlashTimer = 0;
      }
    } else if (gameState === STATE_PAUSED) {
      renderGame();
    }

    requestAnimationFrame(gameLoop);
  }

  // Start
  requestAnimationFrame(gameLoop);

})();
