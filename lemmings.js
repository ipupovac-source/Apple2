(function() {
'use strict';

// ==================== CANVAS SETUP ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const UI_HEIGHT = 140;
const TOTAL_HEIGHT = GAME_HEIGHT + UI_HEIGHT;

canvas.width = GAME_WIDTH;
canvas.height = TOTAL_HEIGHT;

// Detect mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

// Offscreen terrain canvas
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d');
terrainCanvas.width = GAME_WIDTH;
terrainCanvas.height = GAME_HEIGHT;

// ==================== CHARACTER TYPES (inspired by photos) ====================
const CHARACTER_TYPES = [
  { name:'BluePat',   hairStyle:'wavy',  hairColor:'#1a1008', shirtColor:'#2b4499', shirtColor2:'#1e3377', glasses:false, bald:false, tie:null,     pantsColor:'#444' },
  { name:'RedGlass',  hairStyle:'short', hairColor:'#1a1008', shirtColor:'#8b2222', shirtColor2:'#6b1818', glasses:true,  bald:false, tie:null,     pantsColor:'#333' },
  { name:'CreamJkt',  hairStyle:'short', hairColor:'#5a4a2a', shirtColor:'#ccc0a0', shirtColor2:'#b0a888', glasses:false, bald:false, tie:null,     pantsColor:'#444' },
  { name:'Stripes',   hairStyle:'short', hairColor:'#888888', shirtColor:'#7799bb', shirtColor2:'#6688aa', glasses:false, bald:false, tie:null,     pantsColor:'#333' },
  { name:'Baldy',     hairStyle:'none',  hairColor:null,      shirtColor:'#ddcccc', shirtColor2:'#ccbbbb', glasses:false, bald:true,  tie:null,     pantsColor:'#222' },
  { name:'RedTie',    hairStyle:'curly', hairColor:'#111108', shirtColor:'#99aacc', shirtColor2:'#8899bb', glasses:true,  bald:false, tie:'#cc2222',pantsColor:'#333' },
  { name:'DarkSuit',  hairStyle:'short', hairColor:'#0a0a0a', shirtColor:'#334466', shirtColor2:'#283858', glasses:false, bald:false, tie:'#333355',pantsColor:'#222' },
  { name:'NeatGuy',   hairStyle:'neat',  hairColor:'#3a2a1a', shirtColor:'#ccddee', shirtColor2:'#bbccdd', glasses:true,  bald:false, tie:'#882244',pantsColor:'#333' },
  { name:'GreyTee',   hairStyle:'thin',  hairColor:'#666666', shirtColor:'#778888', shirtColor2:'#667777', glasses:false, bald:false, tie:null,     pantsColor:'#444' },
  { name:'BlueGuy',   hairStyle:'short', hairColor:'#1a1008', shirtColor:'#3366aa', shirtColor2:'#2255aa', glasses:false, bald:false, tie:null,     pantsColor:'#333' },
];

const SKIN_COLOR = '#e8b89a';
const SKIN_SHADOW = '#d4a080';

// ==================== GAME STATES ====================
const STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_COMPLETE: 'levelComplete',
  LEVEL_FAIL: 'levelFail',
  ALL_COMPLETE: 'allComplete'
};

// ==================== LEMMING STATES ====================
const LEM = {
  WALKING: 'walking',
  FALLING: 'falling',
  DIGGING: 'digging',
  BUILDING: 'building',
  BASHING: 'bashing',
  MINING: 'mining',
  BLOCKING: 'blocking',
  CLIMBING: 'climbing',
  FLOATING: 'floating',
  EXPLODING: 'exploding',
  EXITING: 'exiting',
  DEAD: 'dead',
  SAVED: 'saved'
};

// ==================== ABILITIES ====================
const ABILITIES = ['climber','floater','exploder','blocker','builder','basher','miner','digger'];
const ABILITY_COLORS = {
  climber: '#44cc44',
  floater: '#44aaff',
  exploder: '#ff4444',
  blocker: '#ff8844',
  builder: '#ccaa44',
  basher: '#cc44cc',
  miner: '#aa8866',
  digger: '#8888ff'
};
const ABILITY_ICONS = {
  climber: '\u2191',  // up arrow
  floater: '\u2602',  // umbrella
  exploder: '\u2736', // star
  blocker: '\u2588',  // block
  builder: '\u2592',  // steps
  basher: '\u2694',   // swords
  miner: '\u26CF',    // pick
  digger: '\u2193'    // down arrow
};

// ==================== LEVEL DATA ====================
const LEVELS = [
  {
    name: "First Steps",
    description: "A simple walk to safety. Build over the gap!",
    lemmingCount: 15,
    required: 10,
    spawnRate: 50,
    abilities: { climber:0, floater:0, exploder:0, blocker:2, builder:5, basher:0, miner:0, digger:0 },
    entry: { x:120, y:160 },
    exit: { x:830, y:420 },
    buildTerrain: function(tCtx) {
      fillGround(tCtx, 0, 440, 400, 100, '#886644', '#665533');
      fillGround(tCtx, 520, 440, 440, 100, '#886644', '#665533');
      fillGround(tCtx, 40, 200, 200, 20, '#778866', '#667755');
      fillGround(tCtx, 350, 300, 30, 140, '#776655', '#665544');
      fillGround(tCtx, 550, 350, 30, 90, '#776655', '#665544');
      addGrass(tCtx, 0, 440, 400);
      addGrass(tCtx, 520, 440, 440);
    }
  },
  {
    name: "Dig Down",
    description: "The exit is below. Dig your way through!",
    lemmingCount: 20,
    required: 15,
    spawnRate: 45,
    abilities: { climber:0, floater:5, exploder:0, blocker:2, builder:0, basher:0, miner:0, digger:5 },
    entry: { x:480, y:100 },
    exit: { x:480, y:480 },
    buildTerrain: function(tCtx) {
      fillGround(tCtx, 350, 140, 260, 18, '#778866', '#667755');
      addGrass(tCtx, 350, 140, 260);
      fillGround(tCtx, 200, 240, 560, 25, '#886644', '#775533');
      addGrass(tCtx, 200, 240, 560);
      fillGround(tCtx, 150, 340, 660, 25, '#886644', '#775533');
      addGrass(tCtx, 150, 340, 660);
      fillGround(tCtx, 250, 440, 460, 25, '#886644', '#775533');
      addGrass(tCtx, 250, 440, 460);
      fillGround(tCtx, 100, 510, 760, 30, '#886644', '#665533');
      addGrass(tCtx, 100, 510, 760);
    }
  },
  {
    name: "Bash Through",
    description: "Walls block your path. Bash or mine through!",
    lemmingCount: 20,
    required: 14,
    spawnRate: 40,
    abilities: { climber:2, floater:2, exploder:0, blocker:2, builder:3, basher:5, miner:3, digger:2 },
    entry: { x:80, y:280 },
    exit: { x:870, y:420 },
    buildTerrain: function(tCtx) {
      fillGround(tCtx, 0, 440, 960, 100, '#886644', '#665533');
      addGrass(tCtx, 0, 440, 960);
      fillGround(tCtx, 20, 320, 150, 16, '#778866', '#667755');
      addGrass(tCtx, 20, 320, 150);
      fillGround(tCtx, 250, 280, 30, 160, '#998877', '#887766');
      fillGround(tCtx, 450, 250, 30, 190, '#998877', '#887766');
      fillGround(tCtx, 650, 300, 30, 140, '#998877', '#887766');
      fillGround(tCtx, 450, 250, 180, 20, '#887766', '#776655');
      addGrass(tCtx, 450, 250, 180);
      fillGround(tCtx, 300, 380, 120, 14, '#778866', '#667755');
      addGrass(tCtx, 300, 380, 120);
    }
  },
  {
    name: "Climb & Float",
    description: "Use climbers and floaters to navigate the towers!",
    lemmingCount: 25,
    required: 18,
    spawnRate: 35,
    abilities: { climber:10, floater:10, exploder:2, blocker:3, builder:5, basher:2, miner:0, digger:2 },
    entry: { x:80, y:460 },
    exit: { x:870, y:120 },
    buildTerrain: function(tCtx) {
      fillGround(tCtx, 0, 500, 960, 40, '#886644', '#665533');
      addGrass(tCtx, 0, 500, 960);
      fillGround(tCtx, 200, 200, 60, 300, '#998877', '#887766');
      fillGround(tCtx, 180, 200, 100, 16, '#778866', '#667755');
      addGrass(tCtx, 180, 200, 100);
      fillGround(tCtx, 420, 280, 60, 220, '#998877', '#887766');
      fillGround(tCtx, 400, 280, 100, 16, '#778866', '#667755');
      addGrass(tCtx, 400, 280, 100);
      fillGround(tCtx, 620, 160, 60, 340, '#998877', '#887766');
      fillGround(tCtx, 600, 160, 100, 16, '#778866', '#667755');
      addGrass(tCtx, 600, 160, 100);
      fillGround(tCtx, 800, 150, 140, 16, '#778866', '#667755');
      addGrass(tCtx, 800, 150, 140);
    }
  },
  {
    name: "The Gauntlet",
    description: "Use everything you've learned! Save your friends!",
    lemmingCount: 30,
    required: 22,
    spawnRate: 30,
    abilities: { climber:5, floater:5, exploder:3, blocker:3, builder:8, basher:5, miner:3, digger:5 },
    entry: { x:80, y:100 },
    exit: { x:880, y:480 },
    buildTerrain: function(tCtx) {
      fillGround(tCtx, 20, 140, 180, 16, '#778866', '#667755');
      addGrass(tCtx, 20, 140, 180);
      fillGround(tCtx, 0, 260, 350, 22, '#886644', '#775533');
      addGrass(tCtx, 0, 260, 350);
      fillGround(tCtx, 250, 180, 28, 80, '#998877', '#887766');
      fillGround(tCtx, 400, 200, 200, 20, '#886644', '#775533');
      addGrass(tCtx, 400, 200, 200);
      fillGround(tCtx, 550, 200, 28, 100, '#998877', '#887766');
      fillGround(tCtx, 650, 300, 310, 20, '#886644', '#775533');
      addGrass(tCtx, 650, 300, 310);
      fillGround(tCtx, 650, 300, 28, 100, '#998877', '#887766');
      fillGround(tCtx, 300, 380, 400, 22, '#886644', '#775533');
      addGrass(tCtx, 300, 380, 400);
      fillGround(tCtx, 300, 380, 28, 60, '#998877', '#887766');
      fillGround(tCtx, 0, 510, 960, 30, '#886644', '#665533');
      addGrass(tCtx, 0, 510, 960);
      fillGround(tCtx, 150, 440, 28, 70, '#998877', '#887766');
      fillGround(tCtx, 800, 400, 160, 16, '#778866', '#667755');
      addGrass(tCtx, 800, 400, 160);
    }
  }
];

// ==================== TERRAIN HELPERS ====================
function fillGround(tCtx, x, y, w, h, color1, color2) {
  for (let row = 0; row < h; row++) {
    const t = row / h;
    const r1 = parseInt(color1.slice(1,3),16), g1 = parseInt(color1.slice(3,5),16), b1 = parseInt(color1.slice(5,7),16);
    const r2 = parseInt(color2.slice(1,3),16), g2 = parseInt(color2.slice(3,5),16), b2 = parseInt(color2.slice(5,7),16);
    const r = Math.round(r1 + (r2-r1)*t);
    const g = Math.round(g1 + (g2-g1)*t);
    const b = Math.round(b1 + (b2-b1)*t);
    tCtx.fillStyle = `rgb(${r},${g},${b})`;
    tCtx.fillRect(x, y + row, w, 1);
  }
  for (let i = 0; i < w * h * 0.05; i++) {
    const px = x + Math.random() * w;
    const py = y + Math.random() * h;
    tCtx.fillStyle = `rgba(0,0,0,${Math.random()*0.15})`;
    tCtx.fillRect(px, py, 1, 1);
  }
}

function addGrass(tCtx, x, y, w) {
  for (let gx = x; gx < x + w; gx += 2) {
    const gh = 2 + Math.random() * 4;
    const green = 100 + Math.random() * 80;
    tCtx.fillStyle = `rgb(${40+Math.random()*30},${green},${30+Math.random()*20})`;
    tCtx.fillRect(gx, y - gh, 2, gh);
  }
}

// ==================== TERRAIN PIXEL ACCESS ====================
let terrainData = null;

function syncTerrainData() {
  terrainData = terrainCtx.getImageData(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function isSolid(x, y) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= GAME_WIDTH || y < 0 || y >= GAME_HEIGHT) return false;
  const idx = (y * GAME_WIDTH + x) * 4;
  return terrainData.data[idx + 3] > 128;
}

function removeTerrain(x, y, w, h) {
  terrainCtx.clearRect(x, y, w, h);
  syncTerrainData();
}

function removeTerrainCircle(cx, cy, radius) {
  terrainCtx.save();
  terrainCtx.globalCompositeOperation = 'destination-out';
  terrainCtx.beginPath();
  terrainCtx.arc(cx, cy, radius, 0, Math.PI*2);
  terrainCtx.fill();
  terrainCtx.restore();
  syncTerrainData();
}

function addTerrainPixels(x, y, w, h, color) {
  terrainCtx.fillStyle = color;
  terrainCtx.fillRect(x, y, w, h);
  syncTerrainData();
}

// ==================== PARTICLES ====================
let particles = [];

function spawnParticles(x, y, count, color, speed) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = speed * (0.5 + Math.random());
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - speed * 0.5,
      life: 30 + Math.random() * 30,
      maxLife: 60,
      color,
      size: 1 + Math.random() * 2
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

// ==================== LEMMING CLASS ====================
class Lemming {
  constructor(x, y, typeIndex) {
    this.x = x;
    this.y = y;
    this.dx = 1;
    this.state = LEM.FALLING;
    this.typeIndex = typeIndex % CHARACTER_TYPES.length;
    this.climber = false;
    this.floater = false;
    this.animFrame = 0;
    this.animTimer = 0;
    this.fallDist = 0;
    this.buildCount = 0;
    this.explodeTimer = -1;
    this.alive = true;
    this.saved = false;
    this.exitAnimTimer = 0;
  }

  update() {
    if (!this.alive || this.saved) return;
    if (this.state === LEM.EXITING) {
      this.exitAnimTimer++;
      if (this.exitAnimTimer > 30) {
        this.saved = true;
        this.alive = false;
      }
      return;
    }

    if (this.explodeTimer > 0) {
      this.explodeTimer--;
      if (this.explodeTimer === 0) {
        this.explode();
        return;
      }
    }

    this.animTimer++;

    switch (this.state) {
      case LEM.WALKING:  this.updateWalking(); break;
      case LEM.FALLING:  this.updateFalling(); break;
      case LEM.DIGGING:  this.updateDigging(); break;
      case LEM.BUILDING: this.updateBuilding(); break;
      case LEM.BASHING:  this.updateBashing(); break;
      case LEM.MINING:   this.updateMining(); break;
      case LEM.BLOCKING: break;
      case LEM.CLIMBING: this.updateClimbing(); break;
      case LEM.FLOATING: this.updateFloating(); break;
    }

    if (this.x < -10 || this.x > GAME_WIDTH + 10 || this.y > GAME_HEIGHT + 10) {
      this.alive = false;
    }
  }

  updateWalking() {
    const speed = 0.8;
    const newX = this.x + this.dx * speed;
    const feetY = this.y;

    for (const lem of game.lemmings) {
      if (lem !== this && lem.alive && lem.state === LEM.BLOCKING) {
        if (Math.abs(this.x - lem.x) < 8 && Math.abs(this.y - lem.y) < 10) {
          this.dx = -this.dx;
          return;
        }
      }
    }

    let wallHeight = 0;
    for (let checkY = 0; checkY < 12; checkY++) {
      if (isSolid(newX + this.dx * 4, feetY - 1 - checkY)) {
        wallHeight++;
      }
    }

    if (wallHeight > 6) {
      if (this.climber) {
        this.state = LEM.CLIMBING;
        return;
      }
      this.dx = -this.dx;
      return;
    }

    let stepUp = 0;
    if (wallHeight > 0 && wallHeight <= 6) {
      for (let sy = 1; sy <= 6; sy++) {
        if (!isSolid(newX + this.dx * 4, feetY - sy)) {
          stepUp = sy;
          break;
        }
      }
    }

    this.x = newX;
    this.y -= stepUp;

    if (!isSolid(this.x, this.y) && !isSolid(this.x, this.y + 1)) {
      this.state = LEM.FALLING;
      this.fallDist = 0;
    } else {
      while (isSolid(this.x, this.y - 1) && this.y > 0) {
        this.y--;
      }
    }

    if (this.animTimer % 6 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  updateFalling() {
    const gravity = this.floater ? 0.8 : 2.0;
    this.y += gravity;
    this.fallDist += gravity;

    if (this.floater && this.fallDist > 20) {
      this.state = LEM.FLOATING;
      this.fallDist = 20;
      return;
    }

    if (isSolid(this.x, this.y)) {
      while (isSolid(this.x, this.y - 1)) this.y--;
      if (this.fallDist > 120) {
        this.alive = false;
        spawnParticles(this.x, this.y, 15, '#cc4444', 3);
        spawnParticles(this.x, this.y, 10, SKIN_COLOR, 2);
      } else {
        this.state = LEM.WALKING;
        this.fallDist = 0;
      }
    }
  }

  updateFloating() {
    this.y += 0.8;
    if (this.animTimer % 8 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }
    if (isSolid(this.x, this.y)) {
      while (isSolid(this.x, this.y - 1)) this.y--;
      this.state = LEM.WALKING;
      this.fallDist = 0;
    }
  }

  updateClimbing() {
    this.y -= 0.6;
    if (!isSolid(this.x + this.dx * 5, this.y) && !isSolid(this.x + this.dx * 5, this.y - 5)) {
      this.x += this.dx * 6;
      this.state = LEM.WALKING;
      this.fallDist = 0;
      return;
    }
    if (isSolid(this.x, this.y - 12)) {
      this.dx = -this.dx;
      this.state = LEM.FALLING;
      this.fallDist = 0;
    }
    if (this.animTimer % 6 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  updateDigging() {
    if (this.animTimer % 8 === 0) {
      removeTerrain(this.x - 8, this.y, 16, 3);
      spawnParticles(this.x, this.y + 2, 3, '#886644', 1.5);
      this.y += 2;
      if (!isSolid(this.x - 4, this.y + 1) && !isSolid(this.x, this.y + 1) && !isSolid(this.x + 4, this.y + 1)) {
        this.state = LEM.FALLING;
        this.fallDist = 0;
      }
    }
    if (this.animTimer % 4 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  updateBuilding() {
    if (this.animTimer % 12 === 0) {
      addTerrainPixels(this.x + this.dx * 2, this.y - 2, 8, 3, '#bbaa77');
      this.x += this.dx * 4;
      this.y -= 2;
      this.buildCount--;
      spawnParticles(this.x, this.y, 2, '#bbaa77', 0.5);
      if (this.buildCount <= 0) this.state = LEM.WALKING;
      if (isSolid(this.x, this.y - 14)) this.state = LEM.WALKING;
    }
    if (this.animTimer % 6 === 0) {
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  updateBashing() {
    if (this.animTimer % 6 === 0) {
      const bx = this.x + this.dx * 5;
      removeTerrain(bx - 2, this.y - 14, 6, 16);
      spawnParticles(bx, this.y - 7, 3, '#886644', 1.5);
      this.x += this.dx * 1.5;
      let hasWall = false;
      for (let cy = 0; cy < 10; cy++) {
        if (isSolid(this.x + this.dx * 8, this.y - 2 - cy)) {
          hasWall = true;
          break;
        }
      }
      if (!hasWall) this.state = LEM.WALKING;
      if (!isSolid(this.x, this.y) && !isSolid(this.x, this.y + 1)) {
        this.state = LEM.FALLING;
        this.fallDist = 0;
      }
    }
    if (this.animTimer % 4 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  updateMining() {
    if (this.animTimer % 8 === 0) {
      const mx = this.x + this.dx * 3;
      removeTerrain(mx - 4, this.y - 2, 10, 6);
      spawnParticles(mx, this.y, 3, '#886644', 1.5);
      this.x += this.dx * 2;
      this.y += 2;
      let hasGround = false;
      for (let cy = 0; cy < 4; cy++) {
        if (isSolid(this.x + this.dx * 6, this.y + cy)) {
          hasGround = true;
          break;
        }
      }
      if (!hasGround) {
        this.state = LEM.FALLING;
        this.fallDist = 0;
      }
    }
    if (this.animTimer % 4 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  explode() {
    removeTerrainCircle(this.x, this.y - 8, 20);
    spawnParticles(this.x, this.y - 8, 30, '#ff6644', 4);
    spawnParticles(this.x, this.y - 8, 20, '#ffaa22', 3);
    this.alive = false;
  }

  assignAbility(ability) {
    switch (ability) {
      case 'climber':
        if (this.climber) return false;
        this.climber = true;
        return true;
      case 'floater':
        if (this.floater) return false;
        this.floater = true;
        return true;
      case 'exploder':
        if (this.explodeTimer > 0) return false;
        this.explodeTimer = 50;
        return true;
      case 'blocker':
        if (this.state === LEM.WALKING) { this.state = LEM.BLOCKING; return true; }
        return false;
      case 'builder':
        if (this.state === LEM.WALKING) { this.state = LEM.BUILDING; this.buildCount = 12; this.animTimer = 0; return true; }
        return false;
      case 'basher':
        if (this.state === LEM.WALKING) { this.state = LEM.BASHING; this.animTimer = 0; return true; }
        return false;
      case 'miner':
        if (this.state === LEM.WALKING) { this.state = LEM.MINING; this.animTimer = 0; return true; }
        return false;
      case 'digger':
        if (this.state === LEM.WALKING || this.state === LEM.BUILDING) { this.state = LEM.DIGGING; this.animTimer = 0; return true; }
        return false;
    }
    return false;
  }
}

// ==================== SPRITE DRAWING ====================
function drawLemming(lem) {
  const type = CHARACTER_TYPES[lem.typeIndex];
  const x = Math.round(lem.x);
  const y = Math.round(lem.y);
  const dir = lem.dx;
  const frame = lem.animFrame;

  ctx.save();

  if (lem.state === LEM.EXITING) {
    const alpha = 1 - (lem.exitAnimTimer / 30);
    ctx.globalAlpha = alpha;
    const scale = 1 - (lem.exitAnimTimer / 60);
    ctx.translate(x, y - 10);
    ctx.scale(scale, scale);
    ctx.translate(-x, -(y - 10));
  }

  if (lem.explodeTimer > 0) {
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(lem.explodeTimer / 10), x, y - 26);
  }

  const legOffset = (lem.state === LEM.WALKING || lem.state === LEM.BASHING) ?
    Math.sin(frame * Math.PI / 2) * 3 : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 6, 2, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = type.pantsColor;
  ctx.fillRect(x - 3, y - 5, 2, 5 + (lem.state === LEM.WALKING ? legOffset : 0));
  ctx.fillRect(x + 1, y - 5, 2, 5 - (lem.state === LEM.WALKING ? legOffset : 0));

  ctx.fillStyle = type.shirtColor;
  ctx.fillRect(x - 5, y - 14, 10, 10);
  ctx.fillStyle = type.shirtColor2;
  ctx.fillRect(x - 5 + (dir > 0 ? 5 : 0), y - 14, 5, 10);

  if (type.tie) {
    ctx.fillStyle = type.tie;
    ctx.fillRect(x - 1, y - 13, 2, 7);
  }

  ctx.fillStyle = type.shirtColor;
  if (lem.state === LEM.BUILDING) {
    ctx.fillRect(x + dir * 5, y - 16, 3 * dir, 3);
  } else if (lem.state === LEM.BASHING) {
    ctx.fillRect(x + dir * 5, y - 12 + Math.sin(frame * Math.PI) * 2, 4 * dir, 3);
  } else if (lem.state === LEM.DIGGING || lem.state === LEM.MINING) {
    ctx.fillRect(x + dir * 4, y - 8, 3 * dir, 3);
    ctx.fillRect(x - dir * 4 - (dir > 0 ? 3 : 0), y - 8, 3, 3);
  } else if (lem.state === LEM.CLIMBING) {
    const armOff = Math.sin(frame * Math.PI) * 3;
    ctx.fillRect(x + dir * 5, y - 16 + armOff, 2, 4);
    ctx.fillRect(x + dir * 5, y - 10 - armOff, 2, 4);
  } else if (lem.state === LEM.BLOCKING) {
    ctx.fillRect(x - 7, y - 13, 3, 3);
    ctx.fillRect(x + 5, y - 13, 3, 3);
  } else {
    ctx.fillRect(x - 7, y - 12, 3, 3);
    ctx.fillRect(x + 5, y - 12, 3, 3);
  }

  if (lem.state === LEM.FLOATING) {
    ctx.strokeStyle = '#553322';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x, y - 30);
    ctx.stroke();
    ctx.fillStyle = '#4488cc';
    ctx.beginPath();
    ctx.arc(x, y - 30, 12, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#336699';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 30);
    ctx.lineTo(x, y - 30);
    ctx.lineTo(x + 8, y - 30);
    ctx.stroke();
  }

  ctx.fillStyle = SKIN_COLOR;
  ctx.fillRect(x - 4, y - 20, 8, 7);
  ctx.fillStyle = SKIN_SHADOW;
  ctx.fillRect(x + (dir > 0 ? 2 : -4), y - 18, 2, 3);

  ctx.fillStyle = '#222';
  const eyeX = x + dir * 1;
  ctx.fillRect(eyeX - 1, y - 18, 1, 1);
  ctx.fillRect(eyeX + 2, y - 18, 1, 1);

  if (type.glasses) {
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(eyeX - 2.5, y - 19.5, 3, 3);
    ctx.strokeRect(eyeX + 1, y - 19.5, 3, 3);
    ctx.beginPath();
    ctx.moveTo(eyeX + 0.5, y - 18);
    ctx.lineTo(eyeX + 1, y - 18);
    ctx.stroke();
  }

  if (!type.bald) {
    ctx.fillStyle = type.hairColor;
    switch (type.hairStyle) {
      case 'wavy':
        ctx.fillRect(x - 5, y - 22, 10, 3);
        ctx.fillRect(x - 5, y - 20, 2, 3);
        ctx.fillRect(x + 3, y - 20, 2, 3);
        for (let i = 0; i < 5; i++) ctx.fillRect(x - 5 + i * 2, y - 23 + (i % 2), 2, 2);
        break;
      case 'curly':
        ctx.fillRect(x - 5, y - 22, 10, 3);
        ctx.fillRect(x - 5, y - 20, 2, 4);
        ctx.fillRect(x + 3, y - 20, 2, 4);
        ctx.fillRect(x - 6, y - 21, 2, 3);
        ctx.fillRect(x + 4, y - 21, 2, 3);
        for (let i = 0; i < 3; i++) ctx.fillRect(x - 4 + i * 3, y - 24, 2, 2);
        break;
      case 'neat':
        ctx.fillRect(x - 4, y - 22, 8, 3);
        ctx.fillRect(x + (dir > 0 ? 3 : -5), y - 20, 2, 2);
        break;
      case 'thin':
        ctx.fillRect(x - 4, y - 21, 8, 2);
        break;
      case 'short':
      default:
        ctx.fillRect(x - 5, y - 22, 10, 3);
        ctx.fillRect(x - 5, y - 20, 1, 2);
        ctx.fillRect(x + 4, y - 20, 1, 2);
        break;
    }
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x - 1, y - 20, 3, 1);
  }

  if (lem.climber && lem.state !== LEM.CLIMBING) {
    ctx.fillStyle = ABILITY_COLORS.climber;
    ctx.fillRect(x - 5, y - 24, 2, 2);
  }
  if (lem.floater && lem.state !== LEM.FLOATING) {
    ctx.fillStyle = ABILITY_COLORS.floater;
    ctx.fillRect(x + 3, y - 24, 2, 2);
  }

  if (lem.state === LEM.DIGGING) {
    ctx.fillStyle = '#888';
    ctx.fillRect(x + dir * 3, y - 5, 2, 5);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(x + dir * 2, y, 4, 2);
  }
  if (lem.state === LEM.BASHING) {
    const pickAngle = Math.sin(frame * Math.PI) * 0.5;
    ctx.save();
    ctx.translate(x + dir * 6, y - 12);
    ctx.rotate(pickAngle * dir);
    ctx.fillStyle = '#777';
    ctx.fillRect(0, -1, 5 * dir, 2);
    ctx.fillStyle = '#999';
    ctx.fillRect(4 * dir, -2, 3 * dir, 4);
    ctx.restore();
  }
  if (lem.state === LEM.MINING) {
    ctx.fillStyle = '#777';
    ctx.fillRect(x + dir * 5, y - 6, 2, 4);
    ctx.fillStyle = '#999';
    ctx.fillRect(x + dir * 4, y - 2, 4, 2);
  }
  if (lem.state === LEM.BLOCKING) {
    ctx.fillStyle = SKIN_COLOR;
    ctx.fillRect(x - 8, y - 14, 2, 3);
    ctx.fillRect(x + 7, y - 14, 2, 3);
  }

  ctx.restore();
}

// ==================== DOOR DRAWING ====================
function drawEntryDoor(x, y) {
  ctx.fillStyle = '#556677';
  ctx.fillRect(x - 18, y - 35, 36, 30);
  ctx.fillStyle = '#445566';
  ctx.fillRect(x - 16, y - 33, 32, 26);
  ctx.fillStyle = '#334455';
  ctx.fillRect(x - 14, y - 10, 28, 5);
  ctx.fillStyle = '#111';
  ctx.fillRect(x - 10, y - 28, 20, 20);
  ctx.fillStyle = '#88aacc';
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x - 5, y - 20);
  ctx.lineTo(x + 5, y - 20);
  ctx.fill();
  ctx.fillStyle = '#aaccee';
  ctx.font = '8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('IN', x, y - 38);
}

function drawExitDoor(x, y) {
  ctx.fillStyle = '#448844';
  ctx.fillRect(x - 14, y - 28, 28, 28);
  ctx.fillStyle = '#336633';
  ctx.fillRect(x - 12, y - 26, 24, 24);
  ctx.fillStyle = '#225522';
  ctx.fillRect(x - 8, y - 22, 16, 20);
  ctx.fillStyle = '#66aa66';
  ctx.beginPath();
  ctx.arc(x, y - 22, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#aaffaa';
  ctx.font = 'bold 7px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('HOME', x, y - 24);
  ctx.strokeStyle = '#66aa66';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - 28);
  ctx.lineTo(x, y - 40);
  ctx.stroke();
  ctx.fillStyle = '#88cc88';
  ctx.fillRect(x, y - 40, 8, 5);
}

// ==================== UI LAYOUT HELPERS ====================
// Ability buttons: 2 rows of 4, sized for touch
function getAbilityBtnRect(index) {
  const cols = 4;
  const row = Math.floor(index / cols);
  const col = index % cols;
  const btnW = 105;
  const btnH = 52;
  const gap = 6;
  const startX = 12;
  const startY = GAME_HEIGHT + 8;
  return {
    x: startX + col * (btnW + gap),
    y: startY + row * (btnH + gap),
    w: btnW,
    h: btnH
  };
}

// Action buttons on right side of UI
function getActionButtons() {
  const baseX = 468;
  const baseY = GAME_HEIGHT + 8;
  const bw = 70;
  const bh = 38;
  const gap = 5;
  return [
    { id: 'pause',  label: 'PAUSE',  x: baseX,             y: baseY,           w: bw, h: bh },
    { id: 'retry',  label: 'RETRY',  x: baseX + bw + gap,  y: baseY,           w: bw, h: bh },
    { id: 'menu',   label: 'MENU',   x: baseX + (bw+gap)*2,y: baseY,           w: bw, h: bh },
    { id: 'fast',   label: 'SPEED+', x: baseX,             y: baseY + bh + gap, w: bw, h: bh },
    { id: 'slow',   label: 'SPEED-', x: baseX + bw + gap,  y: baseY + bh + gap, w: bw, h: bh },
    { id: 'nuke',   label: 'NUKE!',  x: baseX + (bw+gap)*2,y: baseY + bh + gap, w: bw, h: bh },
  ];
}

// Stats area
function getStatsRect() {
  return { x: 700, y: GAME_HEIGHT + 8, w: 250, h: 122 };
}

// ==================== GAME OBJECT ====================
const game = {
  state: STATES.MENU,
  level: 0,
  lemmings: [],
  spawned: 0,
  saved: 0,
  dead: 0,
  spawnTimer: 0,
  selectedAbility: 0,
  abilityCount: {},
  totalLemmings: 0,
  requiredSaves: 0,
  currentLevel: null,
  mouseX: -100,
  mouseY: -100,
  highlightedLemming: null,
  frameCount: 0,
  spawnRate: 50,
  menuAnimFrame: 0,

  init() {
    this.state = STATES.MENU;
    this.level = 0;
  },

  startLevel(idx) {
    if (idx >= LEVELS.length) {
      this.state = STATES.ALL_COMPLETE;
      return;
    }
    this.level = idx;
    this.currentLevel = LEVELS[idx];
    this.lemmings = [];
    this.spawned = 0;
    this.saved = 0;
    this.dead = 0;
    this.spawnTimer = 0;
    this.totalLemmings = this.currentLevel.lemmingCount;
    this.requiredSaves = this.currentLevel.required;
    this.spawnRate = this.currentLevel.spawnRate;
    this.abilityCount = {};
    for (const ab of ABILITIES) {
      this.abilityCount[ab] = this.currentLevel.abilities[ab] || 0;
    }
    this.selectedAbility = ABILITIES.findIndex(a => this.abilityCount[a] > 0);
    if (this.selectedAbility === -1) this.selectedAbility = 0;
    particles = [];
    terrainCtx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.currentLevel.buildTerrain(terrainCtx);
    syncTerrainData();
    this.state = STATES.PLAYING;
  },

  update() {
    if (this.state === STATES.MENU) {
      this.menuAnimFrame++;
      return;
    }
    if (this.state !== STATES.PLAYING) return;

    this.frameCount++;

    if (this.spawned < this.totalLemmings) {
      this.spawnTimer++;
      if (this.spawnTimer >= this.spawnRate) {
        this.spawnTimer = 0;
        const entry = this.currentLevel.entry;
        const lem = new Lemming(entry.x, entry.y, this.spawned);
        this.lemmings.push(lem);
        this.spawned++;
      }
    }

    for (const lem of this.lemmings) {
      lem.update();
      if (lem.alive && !lem.saved && lem.state !== LEM.EXITING) {
        const exit = this.currentLevel.exit;
        if (Math.abs(lem.x - exit.x) < 10 && Math.abs(lem.y - exit.y) < 12) {
          lem.state = LEM.EXITING;
          lem.exitAnimTimer = 0;
        }
      }
    }

    this.dead = 0;
    this.saved = 0;
    for (const lem of this.lemmings) {
      if (lem.saved) this.saved++;
      else if (!lem.alive) this.dead++;
    }

    if (this.spawned >= this.totalLemmings) {
      const allDone = this.lemmings.every(l => !l.alive || l.saved);
      if (allDone) {
        this.state = this.saved >= this.requiredSaves ? STATES.LEVEL_COMPLETE : STATES.LEVEL_FAIL;
      }
    }

    updateParticles();
    this.highlightedLemming = this.findLemmingAt(this.mouseX, this.mouseY);
  },

  render() {
    ctx.clearRect(0, 0, GAME_WIDTH, TOTAL_HEIGHT);

    if (this.state === STATES.MENU) {
      this.renderMenu();
      return;
    }

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyGrad.addColorStop(0, '#1a1a3a');
    skyGrad.addColorStop(0.5, '#2a3a5a');
    skyGrad.addColorStop(1, '#3a4a6a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 50; i++) {
      const sx = (i * 137 + 43) % GAME_WIDTH;
      const sy = (i * 89 + 17) % (GAME_HEIGHT / 2);
      ctx.fillRect(sx, sy, 1, 1);
    }

    ctx.drawImage(terrainCanvas, 0, 0);

    if (this.currentLevel) {
      drawEntryDoor(this.currentLevel.entry.x, this.currentLevel.entry.y);
      drawExitDoor(this.currentLevel.exit.x, this.currentLevel.exit.y);
    }

    for (const lem of this.lemmings) {
      if (lem.alive || lem.state === LEM.EXITING) {
        drawLemming(lem);
      }
    }

    if (this.highlightedLemming && this.state === STATES.PLAYING) {
      const hl = this.highlightedLemming;
      ctx.strokeStyle = '#ffff44';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hl.x - 8, hl.y - 25, 16, 28);
      ctx.fillStyle = '#ffff88';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(hl.state.toUpperCase(), hl.x, hl.y - 28);
    }

    drawParticles();
    this.renderUI();

    if (this.state === STATES.LEVEL_COMPLETE || this.state === STATES.LEVEL_FAIL) {
      this.renderEndOverlay();
    }
    if (this.state === STATES.ALL_COMPLETE) {
      this.renderAllComplete();
    }
    if (this.state === STATES.PAUSED) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', GAME_WIDTH/2, GAME_HEIGHT/2 - 10);
      ctx.font = '16px Arial';
      ctx.fillStyle = '#aabbcc';
      ctx.fillText('Tap PAUSE or press P to resume', GAME_WIDTH/2, GAME_HEIGHT/2 + 25);
    }
  },

  renderMenu() {
    const grad = ctx.createLinearGradient(0, 0, 0, TOTAL_HEIGHT);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#1a1a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, TOTAL_HEIGHT);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 80; i++) {
      const sx = (i * 137 + 43) % GAME_WIDTH;
      const sy = (i * 89 + 17) % TOTAL_HEIGHT;
      const blink = Math.sin(this.menuAnimFrame * 0.03 + i) * 0.3 + 0.7;
      ctx.globalAlpha = blink * 0.5;
      ctx.fillRect(sx, sy, 1 + (i % 2), 1 + (i % 2));
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#88ccff';
    ctx.font = 'bold 44px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEMMINGS', GAME_WIDTH/2, 100);

    ctx.fillStyle = '#aaddff';
    ctx.font = '18px Arial';
    ctx.fillText('Friends Edition', GAME_WIDTH/2, 130);

    // Walking characters
    const baseY = 230;
    for (let i = 0; i < CHARACTER_TYPES.length; i++) {
      const cx = 120 + i * 80;
      const walkFrame = Math.floor((this.menuAnimFrame + i * 7) / 10) % 4;
      const bobY = Math.sin((this.menuAnimFrame + i * 13) * 0.08) * 2;
      const tempLem = {
        x: cx, y: baseY + bobY, dx: 1,
        typeIndex: i, state: LEM.WALKING,
        animFrame: walkFrame, animTimer: 0,
        explodeTimer: -1, exitAnimTimer: 0,
        climber: false, floater: false
      };
      drawLemming(tempLem);
    }

    ctx.fillStyle = '#443322';
    ctx.fillRect(60, baseY + 2, GAME_WIDTH - 120, 8);
    ctx.fillStyle = '#556633';
    for (let gx = 60; gx < GAME_WIDTH - 60; gx += 4) {
      ctx.fillRect(gx, baseY - 1 + Math.random() * 2, 3, 3);
    }

    // Tap to start - bigger touch target
    ctx.fillStyle = '#ccddee';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('TAP TO START', GAME_WIDTH/2, 320);

    // Level buttons - bigger for touch
    ctx.fillStyle = '#8899bb';
    ctx.font = '15px Arial';
    ctx.fillText('Select Level:', GAME_WIDTH/2, 370);

    const btnW = 160;
    const btnH = 44;
    const cols = 3;
    for (let i = 0; i < LEVELS.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const lx = GAME_WIDTH/2 - (cols * (btnW + 10) - 10) / 2 + col * (btnW + 10);
      const ly = 390 + row * (btnH + 10);
      const hover = this.mouseX >= lx && this.mouseX < lx + btnW &&
                    this.mouseY >= ly && this.mouseY < ly + btnH;

      // Button bg
      ctx.fillStyle = hover ? '#334466' : '#1e2238';
      ctx.fillRect(lx, ly, btnW, btnH);
      ctx.strokeStyle = hover ? '#6688cc' : '#334';
      ctx.lineWidth = hover ? 2 : 1;
      ctx.strokeRect(lx, ly, btnW, btnH);

      ctx.fillStyle = hover ? '#ffdd44' : '#aabbdd';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${i+1}. ${LEVELS[i].name}`, lx + btnW/2, ly + btnH/2 + 5);
    }

    ctx.fillStyle = '#445566';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('A game featuring friends as lemmings!', GAME_WIDTH/2, TOTAL_HEIGHT - 30);
  },

  renderUI() {
    const uy = GAME_HEIGHT;

    // UI background
    ctx.fillStyle = '#12131e';
    ctx.fillRect(0, uy, GAME_WIDTH, UI_HEIGHT);
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, uy, GAME_WIDTH, 2);

    // Ability buttons (2 rows of 4)
    for (let i = 0; i < ABILITIES.length; i++) {
      const ab = ABILITIES[i];
      const btn = getAbilityBtnRect(i);
      const selected = i === this.selectedAbility;
      const count = this.abilityCount[ab] || 0;
      const hover = this.mouseX >= btn.x && this.mouseX < btn.x + btn.w &&
                    this.mouseY >= btn.y && this.mouseY < btn.y + btn.h;

      ctx.fillStyle = selected ? '#2a3355' : (hover ? '#1e2030' : '#161825');
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

      ctx.strokeStyle = selected ? ABILITY_COLORS[ab] : '#333348';
      ctx.lineWidth = selected ? 2.5 : 1;
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

      // Icon
      ctx.fillStyle = count > 0 ? ABILITY_COLORS[ab] : '#3a3a4a';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(ABILITY_ICONS[ab] || '', btn.x + 6, btn.y + 22);

      // Name
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(ab.toUpperCase(), btn.x + 24, btn.y + 20);

      // Count
      ctx.fillStyle = count > 0 ? '#ddeeff' : '#333348';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(count.toString(), btn.x + btn.w - 8, btn.y + 38);

      // Hotkey number (desktop)
      if (!isMobile) {
        ctx.fillStyle = '#3a3a4a';
        ctx.font = '9px Arial';
        ctx.textAlign = 'right';
        ctx.fillText((i + 1).toString(), btn.x + btn.w - 8, btn.y + 14);
      }
    }

    // Action buttons
    const actions = getActionButtons();
    for (const ab of actions) {
      const hover = this.mouseX >= ab.x && this.mouseX < ab.x + ab.w &&
                    this.mouseY >= ab.y && this.mouseY < ab.y + ab.h;
      let bgColor = hover ? '#2a2a40' : '#1a1a28';
      let textColor = '#8899aa';
      if (ab.id === 'nuke') { bgColor = hover ? '#442222' : '#2a1818'; textColor = '#cc6644'; }
      if (ab.id === 'pause' && this.state === STATES.PAUSED) { bgColor = '#334466'; textColor = '#88ccff'; }

      ctx.fillStyle = bgColor;
      ctx.fillRect(ab.x, ab.y, ab.w, ab.h);
      ctx.strokeStyle = '#333348';
      ctx.lineWidth = 1;
      ctx.strokeRect(ab.x, ab.y, ab.w, ab.h);

      ctx.fillStyle = textColor;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ab.label, ab.x + ab.w/2, ab.y + ab.h/2 + 4);
    }

    // Stats panel
    const stats = getStatsRect();
    ctx.fillStyle = '#161825';
    ctx.fillRect(stats.x, stats.y, stats.w, stats.h);
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(stats.x, stats.y, stats.w, stats.h);

    const sx = stats.x + 14;
    const sy = stats.y + 8;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#88aacc';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(`Level ${this.level + 1}: ${this.currentLevel ? this.currentLevel.name : ''}`, sx, sy + 16);

    // Progress bar
    const barX = sx;
    const barY = sy + 24;
    const barW = stats.w - 28;
    const barH = 10;
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY, barW, barH);
    const pct = this.totalLemmings > 0 ? this.saved / this.requiredSaves : 0;
    const fillW = Math.min(pct, 1) * barW;
    ctx.fillStyle = pct >= 1 ? '#44cc44' : '#4488cc';
    ctx.fillRect(barX, barY, fillW, barH);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#66cc66';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Saved: ${this.saved} / ${this.requiredSaves}`, sx, sy + 56);

    ctx.fillStyle = '#aabbcc';
    ctx.font = '12px Arial';
    const alive = this.spawned - this.saved - this.dead;
    ctx.fillText(`Walking: ${alive}   Dead: ${this.dead}`, sx, sy + 74);

    const remaining = this.totalLemmings - this.spawned;
    ctx.fillText(`Waiting: ${remaining}`, sx, sy + 90);

    ctx.fillStyle = '#667788';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Rate: ${Math.round(60 / this.spawnRate * 10) / 10}/s`, stats.x + stats.w - 14, sy + 90);
  },

  renderEndOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.textAlign = 'center';

    const isWin = this.state === STATES.LEVEL_COMPLETE;

    ctx.fillStyle = isWin ? '#44ff88' : '#ff6644';
    ctx.font = 'bold 38px Arial';
    ctx.fillText(isWin ? 'LEVEL COMPLETE!' : 'LEVEL FAILED', GAME_WIDTH/2, GAME_HEIGHT/2 - 60);

    ctx.fillStyle = isWin ? '#aaffcc' : '#ffaa88';
    ctx.font = '20px Arial';
    ctx.fillText(`Saved ${this.saved} of ${this.totalLemmings} (needed ${this.requiredSaves})`, GAME_WIDTH/2, GAME_HEIGHT/2 - 20);

    // Touch-friendly buttons
    const btnW = 180;
    const btnH = 50;
    const gap = 20;

    if (isWin) {
      // Next Level button
      const nx = GAME_WIDTH/2 - btnW - gap/2;
      const ny = GAME_HEIGHT/2 + 20;
      ctx.fillStyle = '#225533';
      ctx.fillRect(nx, ny, btnW, btnH);
      ctx.strokeStyle = '#44cc66';
      ctx.lineWidth = 2;
      ctx.strokeRect(nx, ny, btnW, btnH);
      ctx.fillStyle = '#66ff88';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('NEXT LEVEL', nx + btnW/2, ny + 32);

      // Retry button
      const rx = GAME_WIDTH/2 + gap/2;
      ctx.fillStyle = '#333344';
      ctx.fillRect(rx, ny, btnW, btnH);
      ctx.strokeStyle = '#6688aa';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ny, btnW, btnH);
      ctx.fillStyle = '#88bbdd';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('RETRY', rx + btnW/2, ny + 32);
    } else {
      // Retry button
      const rx = GAME_WIDTH/2 - btnW - gap/2;
      const ry = GAME_HEIGHT/2 + 20;
      ctx.fillStyle = '#443322';
      ctx.fillRect(rx, ry, btnW, btnH);
      ctx.strokeStyle = '#cc8844';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, btnW, btnH);
      ctx.fillStyle = '#ffaa66';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('RETRY', rx + btnW/2, ry + 32);

      // Menu button
      const mx = GAME_WIDTH/2 + gap/2;
      ctx.fillStyle = '#333344';
      ctx.fillRect(mx, ry, btnW, btnH);
      ctx.strokeStyle = '#6688aa';
      ctx.lineWidth = 2;
      ctx.strokeRect(mx, ry, btnW, btnH);
      ctx.fillStyle = '#88bbdd';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('MENU', mx + btnW/2, ry + 32);
    }
  },

  renderAllComplete() {
    ctx.fillStyle = 'rgba(0,0,10,0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, TOTAL_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 38px Arial';
    ctx.fillText('CONGRATULATIONS!', GAME_WIDTH/2, TOTAL_HEIGHT/2 - 80);
    ctx.fillStyle = '#aaddff';
    ctx.font = '20px Arial';
    ctx.fillText('All friends saved! Every level complete!', GAME_WIDTH/2, TOTAL_HEIGHT/2 - 40);

    for (let i = 0; i < CHARACTER_TYPES.length; i++) {
      const cx = 120 + i * 80;
      const bobY = Math.sin((this.frameCount + i * 17) * 0.1) * 4;
      const tempLem = {
        x: cx, y: TOTAL_HEIGHT/2 + 50 + bobY, dx: 1,
        typeIndex: i, state: LEM.WALKING,
        animFrame: Math.floor((this.frameCount + i * 5) / 8) % 4,
        animTimer: 0, explodeTimer: -1, exitAnimTimer: 0,
        climber: false, floater: false
      };
      drawLemming(tempLem);
    }

    // Touch button
    const btnW = 200;
    const btnH = 50;
    const bx = GAME_WIDTH/2 - btnW/2;
    const by = TOTAL_HEIGHT/2 + 100;
    ctx.fillStyle = '#224433';
    ctx.fillRect(bx, by, btnW, btnH);
    ctx.strokeStyle = '#44cc66';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, btnW, btnH);
    ctx.fillStyle = '#88ffaa';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('PLAY AGAIN', GAME_WIDTH/2, by + 32);
  },

  findLemmingAt(mx, my) {
    let closest = null;
    let closestDist = isMobile ? 25 : 15; // Bigger tap target on mobile
    for (const lem of this.lemmings) {
      if (!lem.alive || lem.saved) continue;
      const dx = mx - lem.x;
      const dy = my - (lem.y - 10);
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < closestDist) {
        closest = lem;
        closestDist = dist;
      }
    }
    return closest;
  },

  handleClick(mx, my) {
    // ---- MENU STATE ----
    if (this.state === STATES.MENU) {
      // Check level buttons
      const btnW = 160;
      const btnH = 44;
      const cols = 3;
      for (let i = 0; i < LEVELS.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const lx = GAME_WIDTH/2 - (cols * (btnW + 10) - 10) / 2 + col * (btnW + 10);
        const ly = 390 + row * (btnH + 10);
        if (mx >= lx && mx < lx + btnW && my >= ly && my < ly + btnH) {
          this.startLevel(i);
          return;
        }
      }
      // Tap anywhere else = start level 0
      this.startLevel(0);
      return;
    }

    // ---- END OVERLAYS ----
    if (this.state === STATES.LEVEL_COMPLETE || this.state === STATES.LEVEL_FAIL) {
      const btnW = 180;
      const btnH = 50;
      const gap = 20;
      const ny = GAME_HEIGHT/2 + 20;

      if (this.state === STATES.LEVEL_COMPLETE) {
        // Next level button (left)
        if (mx >= GAME_WIDTH/2 - btnW - gap/2 && mx < GAME_WIDTH/2 - gap/2 &&
            my >= ny && my < ny + btnH) {
          this.startLevel(this.level + 1);
          return;
        }
        // Retry button (right)
        if (mx >= GAME_WIDTH/2 + gap/2 && mx < GAME_WIDTH/2 + gap/2 + btnW &&
            my >= ny && my < ny + btnH) {
          this.startLevel(this.level);
          return;
        }
      } else {
        // Retry button (left)
        if (mx >= GAME_WIDTH/2 - btnW - gap/2 && mx < GAME_WIDTH/2 - gap/2 &&
            my >= ny && my < ny + btnH) {
          this.startLevel(this.level);
          return;
        }
        // Menu button (right)
        if (mx >= GAME_WIDTH/2 + gap/2 && mx < GAME_WIDTH/2 + gap/2 + btnW &&
            my >= ny && my < ny + btnH) {
          this.state = STATES.MENU;
          return;
        }
      }
      return;
    }

    if (this.state === STATES.ALL_COMPLETE) {
      const btnW = 200;
      const btnH = 50;
      const bx = GAME_WIDTH/2 - btnW/2;
      const by = TOTAL_HEIGHT/2 + 100;
      if (mx >= bx && mx < bx + btnW && my >= by && my < by + btnH) {
        this.startLevel(0);
        return;
      }
      // Tap anywhere
      this.startLevel(0);
      return;
    }

    // ---- PAUSED ----
    if (this.state === STATES.PAUSED) {
      // Check if tapped the pause action button to resume
      const actions = getActionButtons();
      for (const ab of actions) {
        if (mx >= ab.x && mx < ab.x + ab.w && my >= ab.y && my < ab.y + ab.h) {
          if (ab.id === 'pause') {
            this.state = STATES.PLAYING;
            return;
          }
          if (ab.id === 'retry') {
            this.startLevel(this.level);
            return;
          }
          if (ab.id === 'menu') {
            this.state = STATES.MENU;
            return;
          }
        }
      }
      // Tap game area to resume
      if (my < GAME_HEIGHT) {
        this.state = STATES.PLAYING;
      }
      return;
    }

    // ---- PLAYING ----
    if (this.state !== STATES.PLAYING) return;

    // Check ability buttons
    for (let i = 0; i < ABILITIES.length; i++) {
      const btn = getAbilityBtnRect(i);
      if (mx >= btn.x && mx < btn.x + btn.w && my >= btn.y && my < btn.y + btn.h) {
        this.selectedAbility = i;
        return;
      }
    }

    // Check action buttons
    const actions = getActionButtons();
    for (const ab of actions) {
      if (mx >= ab.x && mx < ab.x + ab.w && my >= ab.y && my < ab.y + ab.h) {
        switch (ab.id) {
          case 'pause':
            this.state = STATES.PAUSED;
            return;
          case 'retry':
            this.startLevel(this.level);
            return;
          case 'menu':
            this.state = STATES.MENU;
            return;
          case 'fast':
            this.spawnRate = Math.max(10, this.spawnRate - 5);
            return;
          case 'slow':
            this.spawnRate = Math.min(100, this.spawnRate + 5);
            return;
          case 'nuke':
            // Set all alive lemmings to explode
            for (const lem of this.lemmings) {
              if (lem.alive && !lem.saved && lem.explodeTimer < 0) {
                lem.explodeTimer = 30 + Math.random() * 40;
              }
            }
            return;
        }
      }
    }

    // Click on lemming in game area
    if (my < GAME_HEIGHT) {
      const lem = this.findLemmingAt(mx, my);
      if (lem) {
        const ability = ABILITIES[this.selectedAbility];
        if (this.abilityCount[ability] > 0) {
          if (lem.assignAbility(ability)) {
            this.abilityCount[ability]--;
          }
        }
      }
    }
  }
};

// ==================== INPUT: COORDINATES HELPER ====================
function canvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (GAME_WIDTH / rect.width),
    y: (clientY - rect.top) * (TOTAL_HEIGHT / rect.height)
  };
}

// ==================== INPUT: MOUSE ====================
canvas.addEventListener('mousemove', (e) => {
  const c = canvasCoords(e.clientX, e.clientY);
  game.mouseX = c.x;
  game.mouseY = c.y;
});

canvas.addEventListener('click', (e) => {
  const c = canvasCoords(e.clientX, e.clientY);
  game.handleClick(c.x, c.y);
});

// ==================== INPUT: TOUCH ====================
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (e.touches.length > 0) {
    const t = e.touches[0];
    const c = canvasCoords(t.clientX, t.clientY);
    game.mouseX = c.x;
    game.mouseY = c.y;
    game.handleClick(c.x, c.y);
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length > 0) {
    const t = e.touches[0];
    const c = canvasCoords(t.clientX, t.clientY);
    game.mouseX = c.x;
    game.mouseY = c.y;
  }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  game.mouseX = -100;
  game.mouseY = -100;
  game.highlightedLemming = null;
}, { passive: false });

// Prevent iOS overscroll / bounce
document.body.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

// ==================== INPUT: KEYBOARD ====================
document.addEventListener('keydown', (e) => {
  const key = e.key;

  if (key === ' ') {
    e.preventDefault();
    if (game.state === STATES.MENU) game.startLevel(0);
    else if (game.state === STATES.LEVEL_COMPLETE) game.startLevel(game.level + 1);
    else if (game.state === STATES.ALL_COMPLETE) game.startLevel(0);
  }

  if (key === 'p' || key === 'P') {
    if (game.state === STATES.PLAYING) game.state = STATES.PAUSED;
    else if (game.state === STATES.PAUSED) game.state = STATES.PLAYING;
  }

  if (key === 'r' || key === 'R') {
    if (game.state === STATES.LEVEL_COMPLETE || game.state === STATES.LEVEL_FAIL || game.state === STATES.PLAYING) {
      game.startLevel(game.level);
    }
  }

  if (key === 'Escape') game.state = STATES.MENU;

  const num = parseInt(key);
  if (num >= 1 && num <= 8) game.selectedAbility = num - 1;

  if (key === '+' || key === '=') game.spawnRate = Math.max(10, game.spawnRate - 5);
  if (key === '-' || key === '_') game.spawnRate = Math.min(100, game.spawnRate + 5);
});

// ==================== GAME LOOP ====================
function gameLoop() {
  game.update();
  game.render();
  requestAnimationFrame(gameLoop);
}

// ==================== START ====================
game.init();
gameLoop();

})();
