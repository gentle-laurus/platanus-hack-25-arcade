// CIRCUIT BREAKER - Arcade Racing Game
// Navigate an energy pulse through a living circuit board!

// =============================================================================
// ARCADE CONTROLS
// =============================================================================
const ARCADE_CONTROLS = {
  'P1U': ['w', 'ArrowUp'],
  'P1D': ['s', 'ArrowDown'],
  'P1A': ['u', ' '],
  'START1': ['1', 'Enter', 'r'],
  'P2U': ['ArrowUp'],
  'P2D': ['ArrowDown']
};

const KEYBOARD_TO_ARCADE = {};
for (const [code, keys] of Object.entries(ARCADE_CONTROLS)) {
  if (keys) {
    (Array.isArray(keys) ? keys : [keys]).forEach(key => {
      KEYBOARD_TO_ARCADE[key] = code;
    });
  }
}

// =============================================================================
// CONFIGURATION
// =============================================================================
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#0a0a1a',
  scene: { create, update }
};

const game = new Phaser.Game(config);

// =============================================================================
// GAME STATE
// =============================================================================
let player, graphics, scoreText, speedText, comboText;
let tracks = [], segments = [], obstacles = [], powerups = [];
let currentTrack = 1;
let score = 0, combo = 0, speed = 1.5, baseSpeed = 1.5;
let gameOver = false, gameStarted = false;
let gridOffset = 0;
let titleText, instructText, startPrompt;
let lastSegmentX = 0, segmentCounter = 0;
let boostTimer = 0, boostActive = false;
let particles = [];
let playerFalling = false;
let playerVY = 0;

const TRACK_SPACING = 120;
const SEGMENT_WIDTH = 200;
const TRACK_WIDTH = 18;

// Score board
let scoreboard = [];
let nameEntryText, namePromptText;
let playerName = '';
let enteringName = false;

// =============================================================================
// CREATE
// =============================================================================
function create() {
  const scene = this;
  graphics = this.add.graphics();
  
  // Initialize tracks (3 horizontal lanes)
  for (let i = 0; i < 3; i++) {
    tracks.push({
      index: i,
      y: 200 + i * TRACK_SPACING,
      active: true
    });
  }
  
  // Player (energy pulse)
  player = {
    x: 200,
    y: tracks[1].y,
    targetY: tracks[1].y,
    size: 16,
    glowPhase: 0,
    trail: [],
    onTrack: true
  };
  
  // UI
  scoreText = scene.add.text(16, 16, 'SCORE: 0', {
    fontSize: '28px',
    fontFamily: 'monospace',
    color: '#00ffff',
    stroke: '#000',
    strokeThickness: 4
  }).setVisible(false);
  
  speedText = scene.add.text(16, 50, 'SPEED: 1.0x', {
    fontSize: '20px',
    fontFamily: 'monospace',
    color: '#ffaa00',
    stroke: '#000',
    strokeThickness: 3
  }).setVisible(false);
  
  comboText = scene.add.text(400, 16, '', {
    fontSize: '24px',
    fontFamily: 'monospace',
    color: '#ff00ff',
    stroke: '#000',
    strokeThickness: 4
  }).setOrigin(0.5, 0).setVisible(false);
  
  // Title screen
  titleText = scene.add.text(400, 140, 'CIRCUIT BREAKER', {
    fontSize: '72px',
    fontFamily: 'monospace',
    color: '#00ffff',
    stroke: '#ff6600',
    strokeThickness: 8
  }).setOrigin(0.5);
  
  instructText = scene.add.text(400, 320, 'Navigate the energy pulse!\n\nJoystick ↑↓: Switch tracks\nButton A: Jump gaps\n\nCollect ⚡ for speed boost\nAvoid ✱ explosions!', {
    fontSize: '22px',
    fontFamily: 'monospace',
    color: '#ffaa00',
    align: 'center',
    stroke: '#000',
    strokeThickness: 3
  }).setOrigin(0.5);
  
  startPrompt = scene.add.text(400, 500, 'Press Button A or START to begin', {
    fontSize: '26px',
    fontFamily: 'monospace',
    color: '#00ff00',
    stroke: '#000',
    strokeThickness: 4
  }).setOrigin(0.5);
  
  scene.tweens.add({
    targets: startPrompt,
    alpha: { from: 1, to: 0.3 },
    duration: 600,
    yoyo: true,
    repeat: -1
  });
  
  scene.tweens.add({
    targets: titleText,
    scale: { from: 1, to: 1.05 },
    duration: 800,
    yoyo: true,
    repeat: -1
  });
  
  // Initialize segments
  for (let i = 0; i < 8; i++) {
    spawnSegment();
  }
  
  // Input
  scene.input.keyboard.on('keydown', (e) => {
    const k = KEYBOARD_TO_ARCADE[e.key] || e.key;
    
    if (!gameStarted && (k === 'P1A' || k === 'START1')) {
      startGame(scene);
      return;
    }
    
    if (!gameStarted) return;
    
    if (gameOver && k === 'START1') {
      restartGame(scene);
      return;
    }
    
    if (gameOver) return;
    
    if (k === 'P1U' && currentTrack > 0 && !playerFalling) {
      currentTrack--;
      player.targetY = tracks[currentTrack].y;
      playTone(scene, 660, 0.05);
    } else if (k === 'P1D' && currentTrack < 2 && !playerFalling) {
      currentTrack++;
      player.targetY = tracks[currentTrack].y;
      playTone(scene, 660, 0.05);
    } else if (k === 'P1A' && !playerFalling) {
      // Boost jump
      player.x += 80;
      createParticles(player.x - 40, player.y, '#ffff00', 12);
      playTone(scene, 880, 0.08);
    }
  });
  
  playTone(scene, 440, 0.15);
}

// =============================================================================
// UPDATE
// =============================================================================
function update(_time, delta) {
  const dt = delta / 1000;
  
  // Update grid animation
  gridOffset += speed * 2;
  if (gridOffset > 40) gridOffset = 0;
  
  if (!gameStarted) {
    drawTitleScreen();
    return;
  }
  
  if (gameOver) {
    updateParticles(dt);
    drawGame();
    return;
  }
  
  // Update boost
  if (boostActive) {
    boostTimer -= dt;
    if (boostTimer <= 0) {
      boostActive = false;
      speed = baseSpeed;
      speedText.setColor('#ffaa00');
    }
  }
  
  // Handle falling
  if (playerFalling) {
    playerVY += dt * 400; // Gravity
    player.y += playerVY * dt;
    
    // Check if landed on a track below
    let landed = false;
    for (let i = 0; i < tracks.length; i++) {
      if (Math.abs(player.y - tracks[i].y) < 20) {
        // Check if there's a segment at this position
        const onSegment = segments.some(seg => 
          seg.track === i && 
          player.x >= seg.x && 
          player.x <= seg.x + seg.width &&
          seg.type !== 'gap'
        );
        
        if (onSegment) {
          player.y = tracks[i].y;
          player.targetY = tracks[i].y;
          currentTrack = i;
          playerFalling = false;
          playerVY = 0;
          landed = true;
          playTone(this, 550, 0.1);
          break;
        }
      }
    }
    
    // Check if fell off screen
    if (player.y > 650) {
      endGame(this);
      return;
    }
  } else {
    // Smooth player movement when not falling
    player.y += (player.targetY - player.y) * 0.15;
  }
  
  // Update player trail
  player.trail.push({ x: player.x, y: player.y });
  if (player.trail.length > 8) player.trail.shift();
  
  player.glowPhase += dt * 5;
  
  // Move segments
  segments.forEach(seg => {
    seg.x -= speed;
  });
  
  obstacles.forEach(obs => {
    obs.x -= speed;
  });
  
  powerups.forEach(pow => {
    pow.x -= speed;
    pow.angle += dt * 3;
  });
  
  // Check if player is on a gap and not jumping
  if (!playerFalling) {
    const currentSegments = segments.filter(seg => 
      seg.track === currentTrack &&
      player.x >= seg.x && 
      player.x <= seg.x + seg.width
    );
    
    const onGap = currentSegments.length === 0 || currentSegments.some(seg => seg.type === 'gap');
    
    if (onGap) {
      playerFalling = true;
      playerVY = 0;
    }
  }
  
  // Remove off-screen elements
  segments = segments.filter(s => s.x > -SEGMENT_WIDTH);
  obstacles = obstacles.filter(o => o.x > -50);
  powerups = powerups.filter(p => p.x > -50);
  
  // Spawn new segments
  if (segments.length === 0 || segments[segments.length - 1].x < 1000) {
    spawnSegment();
  }
  
  // Check collisions with obstacles
  obstacles.forEach(obs => {
    const dx = obs.x - player.x;
    const dy = obs.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < player.size + obs.size) {
      endGame(this);
      createExplosion(player.x, player.y);
    }
  });
  
  // Check powerup collection
  powerups = powerups.filter(pow => {
    const dx = pow.x - player.x;
    const dy = pow.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < player.size + 15) {
      collectPowerup(pow, this);
      return false;
    }
    return true;
  });
  
  // Update particles
  updateParticles(dt);
  
  // Update score
  score += Math.floor(speed * dt * 8);
  scoreText.setText('SCORE: ' + score);
  speedText.setText('SPEED: ' + speed.toFixed(1) + 'x');
  
  if (combo > 0) {
    comboText.setText('COMBO x' + combo);
  } else {
    comboText.setText('');
  }
  
  // Increase difficulty
  if (score % 600 < 10 && baseSpeed < 4) {
    baseSpeed += 0.08;
    if (!boostActive) speed = baseSpeed;
  }
  
  drawGame();
}

// =============================================================================
// SEGMENT GENERATION
// =============================================================================
function spawnSegment() {
  const x = lastSegmentX + SEGMENT_WIDTH;
  lastSegmentX = x;
  segmentCounter++;
  
  // Create segment on each track
  for (let i = 0; i < 3; i++) {
    // Most segments are plain, some are gaps
    const isGap = segmentCounter % 12 === 0 && Math.random() > 0.6;
    
    const seg = {
      x: x,
      y: tracks[i].y,
      track: i,
      width: SEGMENT_WIDTH,
      type: isGap ? 'gap' : 'plain'
    };
    
    segments.push(seg);
  }
  
  // Spawn obstacles (explosions) rarely
  if (Math.random() > 0.8) {
    const trackIdx = Math.floor(Math.random() * 3);
    obstacles.push({
      x: x + SEGMENT_WIDTH / 2,
      y: tracks[trackIdx].y,
      size: 20,
      pulse: 0
    });
  }
  
  // Spawn powerups (lightning) occasionally
  if (Math.random() > 0.85) {
    const trackIdx = Math.floor(Math.random() * 3);
    powerups.push({
      x: x + SEGMENT_WIDTH / 2,
      y: tracks[trackIdx].y,
      angle: 0
    });
  }
}

// =============================================================================
// POWERUP COLLECTION
// =============================================================================
function collectPowerup(pow, scene) {
  score += 50;
  combo++;
  boostActive = true;
  boostTimer = 3;
  speed = baseSpeed * 1.6;
  speedText.setColor('#00ff00');
  
  createParticles(pow.x, pow.y, '#00ffff', 16);
  playTone(scene, 1200, 0.15);
}

// =============================================================================
// PARTICLES
// =============================================================================
function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 2 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 0.5 + Math.random() * 0.5,
      color,
      size: 3 + Math.random() * 3
    });
  }
}

function createExplosion(x, y) {
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const spd = 3 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 0.8 + Math.random() * 0.4,
      color: i % 2 === 0 ? '#ff6600' : '#ffff00',
      size: 4 + Math.random() * 4
    });
  }
}

function updateParticles(dt) {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt;
    p.vy += dt * 100;
  });
  particles = particles.filter(p => p.life > 0);
}

// =============================================================================
// DRAWING
// =============================================================================
function drawTitleScreen() {
  graphics.clear();
  
  // Draw only grid background
  graphics.lineStyle(1, 0x0066ff, 0.3);
  // "glitched effect vertical"
  for (let x = 0; x < 800; x += 40) {
    const ox = (x - gridOffset) % 40;
    if (ox >= 0) graphics.lineBetween(ox, 0, ox, 600);
  }
  for (let y = 0; y < 600; y += 40) {
    graphics.lineBetween(0, y, 800, y);
  }
}

function drawGame() {
  graphics.clear();
  
  // Draw grid background (starting from x=0, not negative)
  graphics.lineStyle(1, 0x0066ff, 0.3);
  const tile = 40;
  let startX = -((gridOffset % tile) + tile) % tile; // normalized into [0, tile)
  for (let x = startX; x <= 800; x += tile) {
    graphics.lineBetween(x, 0, x, 600);
  }
  for (let y = 0; y < 600; y += 40) {
    graphics.lineBetween(0, y, 800, y);
  }
  
  // Draw circuit tracks with rounded cable style
  segments.forEach(seg => {
    if (seg.type === 'plain') {
      // Outer glow
      graphics.lineStyle(TRACK_WIDTH + 8, 0xff6600, 0.15);
      graphics.lineBetween(seg.x, seg.y, seg.x + seg.width, seg.y);
      
      // Main cable with rounded caps
      graphics.lineStyle(TRACK_WIDTH, 0xff6600, 1);
      graphics.beginPath();
      graphics.moveTo(seg.x, seg.y);
      graphics.lineTo(seg.x + seg.width, seg.y);
      graphics.strokePath();
      
      // Rounded ends
      graphics.fillStyle(0xff6600, 1);
      graphics.fillCircle(seg.x, seg.y, TRACK_WIDTH / 2);
      graphics.fillCircle(seg.x + seg.width, seg.y, TRACK_WIDTH / 2);
      
      // Inner highlight for 3D cable effect
      graphics.lineStyle(TRACK_WIDTH * 0.3, 0xffaa44, 0.6);
      graphics.lineBetween(seg.x, seg.y - 4, seg.x + seg.width, seg.y - 4);
    }
  });
  
  // Draw INPUT circles at the start of visible tracks
  const leftmostSegments = {};
  segments.forEach(seg => {
    if (!leftmostSegments[seg.track] || seg.x < leftmostSegments[seg.track].x) {
      if (seg.x < 100 && seg.x > -50) {
        leftmostSegments[seg.track] = seg;
      }
    }
  });
  
  Object.values(leftmostSegments).forEach(seg => {
    // Circle
    graphics.lineStyle(4, 0x00ffff, 1);
    graphics.strokeCircle(seg.x, seg.y, 30);
    graphics.fillStyle(0x001122, 1);
    graphics.fillCircle(seg.x, seg.y, 26);
  });
  
  // Draw obstacles (solid boom star explosions)
  obstacles.forEach(obs => {
    obs.pulse += 0.08;
    
    // Solid red star explosion
    graphics.fillStyle(0xff0000, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + obs.pulse;
      const outerDist = obs.size * 1.2;
      const innerDist = obs.size * 0.5;
      
      const x1 = obs.x + Math.cos(angle) * outerDist;
      const y1 = obs.y + Math.sin(angle) * outerDist;
      const x2 = obs.x + Math.cos(angle + Math.PI / 8) * innerDist;
      const y2 = obs.y + Math.sin(angle + Math.PI / 8) * innerDist;
      const x3 = obs.x + Math.cos(angle + Math.PI / 4) * outerDist;
      const y3 = obs.y + Math.sin(angle + Math.PI / 4) * outerDist;
      
      graphics.fillTriangle(obs.x, obs.y, x1, y1, x2, y2);
      graphics.fillTriangle(obs.x, obs.y, x2, y2, x3, y3);
    }
    
    // Yellow center
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(obs.x, obs.y, obs.size * 0.4);
    
    // White hot center
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(obs.x, obs.y, obs.size * 0.2);
  });
  
  // Draw powerups (lightning)
  powerups.forEach(pow => {
    // Lightning bolt
    graphics.lineStyle(4, 0x00ffff, 1);
    const pts = [
      { x: pow.x, y: pow.y - 15 },
      { x: pow.x + 5, y: pow.y - 5 },
      { x: pow.x - 2, y: pow.y },
      { x: pow.x + 5, y: pow.y + 5 },
      { x: pow.x, y: pow.y + 15 }
    ];
    for (let i = 0; i < pts.length - 1; i++) {
      graphics.lineBetween(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    }
    
    // Glow
    graphics.fillStyle(0x00ffff, 0.3);
    graphics.fillCircle(pow.x, pow.y, 25);
  });
  
  // Draw player trail
  player.trail.forEach((t, i) => {
    const alpha = (i + 1) / player.trail.length;
    graphics.fillStyle(0xffff00, alpha * 0.4);
    graphics.fillCircle(t.x, t.y, player.size * 0.8);
  });
  
  // Draw player (energy pulse)
  const glowSize = player.size + Math.sin(player.glowPhase) * 4;
  
  // Outer glow
  graphics.fillStyle(0xff6600, 0.3);
  graphics.fillCircle(player.x, player.y, glowSize * 2);
  
  // Mid glow
  graphics.fillStyle(0xffaa00, 0.6);
  graphics.fillCircle(player.x, player.y, glowSize * 1.3);
  
  // Core
  graphics.fillStyle(0xffff00, 1);
  graphics.fillCircle(player.x, player.y, player.size);
  
  // Inner highlight
  graphics.fillStyle(0xffffff, 0.8);
  graphics.fillCircle(player.x - 4, player.y - 4, player.size * 0.4);
  
  // Draw particles
  particles.forEach(p => {
    const alpha = p.life;
    graphics.fillStyle(parseInt(p.color.slice(1), 16), alpha);
    graphics.fillCircle(p.x, p.y, p.size * alpha);
  });
  
  // Draw INPUT text on circles
  Object.values(leftmostSegments).forEach(seg => {
    graphics.fillStyle(0x00ffff, 1);
  });
}

// =============================================================================
// GAME FLOW
// =============================================================================
function startGame(scene) {
  gameStarted = true;
  titleText.destroy();
  instructText.destroy();
  startPrompt.destroy();
  scoreText.setVisible(true);
  speedText.setVisible(true);
  comboText.setVisible(true);
  playTone(scene, 880, 0.2);
}

function endGame(scene) {
  gameOver = true;
  combo = 0;
  playTone(scene, 220, 0.5);
  
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 0.75);
  overlay.fillRect(0, 0, 800, 600);
  
  const gameOverTxt = scene.add.text(400, 250, 'BROKEN CIRCUIT', {
    fontSize: '64px',
    fontFamily: 'monospace',
    color: '#ff0000',
    stroke: '#ffff00',
    strokeThickness: 8
  }).setOrigin(0.5);
  
  scene.tweens.add({
    targets: gameOverTxt,
    scale: { from: 1, to: 1.1 },
    alpha: { from: 1, to: 0.7 },
    duration: 700,
    yoyo: true,
    repeat: -1
  });
  
  scene.add.text(400, 350, 'FINAL SCORE: ' + score, {
    fontSize: '36px',
    fontFamily: 'monospace',
    color: '#00ffff',
    stroke: '#000',
    strokeThickness: 4
  }).setOrigin(0.5);
  
  const restartTxt = scene.add.text(400, 450, 'Press START to restart', {
    fontSize: '24px',
    fontFamily: 'monospace',
    color: '#00ff00',
    stroke: '#000',
    strokeThickness: 3
  }).setOrigin(0.5);
  
  scene.tweens.add({
    targets: restartTxt,
    alpha: { from: 1, to: 0.3 },
    duration: 600,
    yoyo: true,
    repeat: -1
  });
}

function restartGame(scene) {
  scene.scene.restart();
  gameOver = false;
  gameStarted = false;
  score = 0;
  combo = 0;
  speed = 1.5;
  baseSpeed = 1.5;
  currentTrack = 1;
  segments = [];
  obstacles = [];
  powerups = [];
  particles = [];
  lastSegmentX = 0;
  segmentCounter = 0;
  boostTimer = 0;
  boostActive = false;
  playerFalling = false;
  playerVY = 0;
}

// =============================================================================
// AUDIO
// =============================================================================
function playTone(scene, freq, dur) {
  const ctx = scene.sound.context;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.frequency.value = freq;
  osc.type = 'square';
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}