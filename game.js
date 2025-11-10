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
// CONSTANTS
// =============================================================================
const TRACK_SPACING = 120;
const SEGMENT_WIDTH = 200;
const TRACK_WIDTH = 18;
const NUM_TRACKS = 3;
const GAP_INTERVAL = 5;

// =============================================================================
// GAME STATE
// =============================================================================
let player, graphics, scoreText, speedText, comboText;
let tracks = [], segments = [], obstacles = [], powerups = [];
let currentTrack = Math.floor(NUM_TRACKS / 2);
let score = 0, combo = 0, speed = 1.5, baseSpeed = 3.5;
let gameOver = false, gameStarted = false;
let gridOffset = 0;
let bgScrollOffset = 0; // Smooth background scrolling
let titleText, instructText, startPrompt;
let sceneRef = null;
let inputTexts = {};
let countdownText = null;
let countdownTimer = 0;
let gameActive = false;
let firstSegmentX = null;
let lastSegmentX = 0, segmentCounter = 0;
let lastGapTracks = []; // Track which tracks had gaps in the last segment
let boostTimer = 0, boostActive = false;
let particles = [];
let playerFalling = false;
let playerVY = 0;
let maxSpeed = 20.5;
let highScores = [];
let enteringName = false;
let playerName = ['A', 'A', 'A'];
let nameIndex = 0;
let nameInputText = null;
let nameCursor = null;
let showingGameOver = false;

// =============================================================================
// CREATE
// =============================================================================
function create() {
  const scene = this;
  sceneRef = scene;
  graphics = this.add.graphics();
  
  // Initialize tracks (3 horizontal lanes)
  for (let i = 0; i < NUM_TRACKS; i++) {
    tracks.push({
      index: i,
      y: 200 + i * TRACK_SPACING,
      active: true
    });
  }
  
  // Player (energy pulse)
  player = {
    x: 200,
    y: tracks[Math.floor(NUM_TRACKS / 2)].y,
    targetY: tracks[Math.floor(NUM_TRACKS / 2)].y,
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
  
  instructText = scene.add.text(400, 320, 'Navigate the energy pulse!\n\nW / S: Switch tracks\nSpace bar: Jump gaps\n\nCollect ⚡ for speed boost\nAvoid ✱ explosions!', {
    fontSize: '22px',
    fontFamily: 'monospace',
    color: '#ffaa00',
    align: 'center',
    stroke: '#000',
    strokeThickness: 3
  }).setOrigin(0.5);
  
  startPrompt = scene.add.text(400, 500, 'Press ENTER to begin', {
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
  
  // Track the first segment position for input circles
  if (segments.length > 0) {
    firstSegmentX = segments[0].x;
  }
  
  // Input
  scene.input.keyboard.on('keydown', (e) => {
    const k = KEYBOARD_TO_ARCADE[e.key] || e.key;
    
    if (!gameStarted && (k === 'P1A' || k === 'START1')) {
      startGame(scene);
      return;
    }
    
    if (!gameStarted) return;
    
    // Handle name entry
    if (enteringName) {
      if (k === 'P1U') {
        // Increment letter (A-Z, then wrap)
        const charCode = playerName[nameIndex].charCodeAt(0);
        playerName[nameIndex] = String.fromCharCode(charCode === 90 ? 65 : charCode + 1);
        updateNameDisplay();
        playTone(scene, 440, 0.05);
      } else if (k === 'P1D') {
        // Decrement letter (A-Z, then wrap)
        const charCode = playerName[nameIndex].charCodeAt(0);
        playerName[nameIndex] = String.fromCharCode(charCode === 65 ? 90 : charCode - 1);
        updateNameDisplay();
        playTone(scene, 440, 0.05);
      } else if (k === 'P1A') {
        // Move to next letter or submit
        nameIndex++;
        if (nameIndex >= 3) {
          submitScore(scene);
        } else {
          updateCursorPosition();
          playTone(scene, 660, 0.05);
        }
      }
      return;
    }
    
    if (gameOver) {
      if (showingGameOver && k === 'START1') {
        // Transition from game over screen to scoreboard
        scene.children.removeAll();
        graphics = scene.add.graphics();
        showingGameOver = false;
        showScoreboard(scene, false);
        return;
      } else if (!showingGameOver && k === 'START1') {
        restartGame(scene);
        return;
      }
      return;
    }
    
    if (!gameActive) return;
    
    if (k === 'P1U' && currentTrack > 0 && !playerFalling) {
      currentTrack--;
      player.targetY = tracks[currentTrack].y;
      playTone(scene, 660, 0.05);
    } else if (k === 'P1D' && currentTrack < NUM_TRACKS - 1 && !playerFalling) {
      currentTrack++;
      player.targetY = tracks[currentTrack].y;
      playTone(scene, 660, 0.05);
    } else if (k === 'P1A' && !playerFalling) {
      // Boost jump with upward velocity
      playerVX = -80;
      playerFalling = true;
      playerVY = -250; // Upward jump velocity
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
  
  // Update background scroll (smooth continuous scrolling)
  bgScrollOffset += speed * dt * 100;
  
  // Update grid animation
  gridOffset += speed * 2;
  if (gridOffset > 40) gridOffset = 0;
  
  if (!gameStarted) {
    drawTitleScreen();
    return;
  }
  
  // Handle countdown
  if (!gameActive && countdownTimer > 0) {
    const prevTime = countdownTimer;
    countdownTimer -= dt;
    
    if (countdownText) {
      let displayText = '';
      let showGo = false;
      
      if (countdownTimer > 0.75) {
        displayText = '3';
      } else if (countdownTimer > 0.5) {
        displayText = '2';
      } else if (countdownTimer > 0.25) {
        displayText = '1';
      } else if (countdownTimer > 0) {
        displayText = 'GO!';
        showGo = true;
      } else {
        countdownText.setVisible(false);
        gameActive = true;
        if (countdownText) {
          countdownText.destroy();
          countdownText = null;
        }
        drawGame();
        return;
      }
      
      const prevText = countdownText.text;
      countdownText.setText(displayText);
      countdownText.setVisible(true);
      
      // Play sound when count changes
      if (displayText !== prevText) {
        if (showGo) {
          playTone(this, 880, 0.2);
        } else {
          playTone(this, 440 + (3 - parseInt(displayText)) * 110, 0.15);
        }
      }
    }
    
    drawGame();
    return;
  }
  
  if (gameOver) {
    updateParticles(dt);
    // Only draw animated background if showing game over screen, not scoreboard
    if (showingGameOver) {
      drawGame();
    }
    return;
  }
  
  // Update boost
  if (boostActive) {
    boostTimer -= dt;
    if (boostTimer <= 0) {
      boostActive = false;
      speed = baseSpeed;

      boostActive = false;
      speedText.setColor('#ffaa00');
    }
  }
  
  // Handle falling
  if (playerFalling) {
    playerVY += dt * 400; // Gravity
    player.y += playerVY * dt;
    
    // Check if landed on a segment (check X position first, then Y)
    let landed = false;
    for (let i = 0; i < tracks.length; i++) {
      // Check if there's a segment at this X position
      const onSegment = segments.some(seg => 
        seg.track === i && 
        player.x >= seg.x && 
        player.x <= seg.x + seg.width &&
        seg.type !== 'gap'
      );
      
      if (onSegment) {
        // Check if player is descending and near the track Y
        if (playerVY >= 0 && Math.abs(player.y - tracks[i].y) < 30) {
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
  
  // Move segments (only if game is active)
  if (gameActive) {
    segments.forEach(seg => {
      seg.x -= speed;
    });
  }
  
  if (gameActive) {
    obstacles.forEach(obs => {
      obs.x -= speed;
    });
    
    powerups.forEach(pow => {
      pow.x -= speed;
      pow.angle += dt * 3;
    });
  }
  
  if (gameActive) {
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
    
    // Spawn new segments - find the rightmost segment position
    let rightmostX = 0;
    if (segments.length > 0) {
      rightmostX = Math.max(...segments.map(s => s.x + s.width));
    }
    
    if (segments.length === 0 || rightmostX < 1000) {
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
    if (score % 600 < 10 && baseSpeed < 8) {
      baseSpeed += 0.005;
      if (!boostActive) speed = baseSpeed;
    }
  }
  
  // Update particles
  updateParticles(dt);
  
  drawGame();
}

// =============================================================================
// SEGMENT GENERATION
// =============================================================================
function spawnSegment() {
  // Calculate next segment position based on actual rightmost segment
  let x;
  if (segments.length === 0) {
    x = lastSegmentX + SEGMENT_WIDTH;
  } else {
    const rightmostX = Math.max(...segments.map(s => s.x + s.width));
    x = rightmostX;
  }
  lastSegmentX = x;
  segmentCounter++;
  
  // Determine which tracks can have gaps (exclude tracks that had gaps last time)
  const availableForGap = [];
  for (let i = 0; i < NUM_TRACKS; i++) {
    if (!lastGapTracks.includes(i)) {
      availableForGap.push(i);
    }
  }
  
  // Decide if we should create gaps (only every GAP_INTERVAL segments)
  const shouldCreateGaps = segmentCounter % GAP_INTERVAL === 0 && availableForGap.length > 0;
  const currentGapTracks = [];
  
  if (shouldCreateGaps && Math.random() > 0.4) {
    // Create 1-2 gaps, but never all tracks
    const numGaps = Math.min(availableForGap.length, Math.floor(NUM_TRACKS / 2) + Math.floor(Math.random() * 2));
    
    // Shuffle and pick random tracks for gaps
    const shuffled = [...availableForGap].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numGaps; i++) {
      currentGapTracks.push(shuffled[i]);
    }
  }
  
  // Create segment on each track
  for (let i = 0; i < NUM_TRACKS; i++) {
    const isGap = currentGapTracks.includes(i);
    
    const seg = {
      x: x,
      y: tracks[i].y,
      track: i,
      width: SEGMENT_WIDTH,
      type: isGap ? 'gap' : 'plain'
    };
    
    segments.push(seg);
  }
  
  // Update tracking for next segment
  lastGapTracks = currentGapTracks;
  
  // Spawn obstacles (explosions) rarely
  if (Math.random() > 0.8) {
    const trackIdx = Math.floor(Math.random() * NUM_TRACKS);
    obstacles.push({
      x: x + SEGMENT_WIDTH / 2,
      y: tracks[trackIdx].y,
      size: 20,
      pulse: 0
    });
  }
  
  // Spawn powerups (lightning) occasionally
  if (Math.random() > 0.85) {
    const trackIdx = Math.floor(Math.random() * NUM_TRACKS);
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
// CIRCUIT BOARD BACKGROUND
// =============================================================================
function drawStaticCircuitBoard(g) {
  // Dark PCB green background
  g.fillStyle(0x2a4a2a, 1);
  g.fillRect(0, 0, 800, 600);
  
  // Static grid pattern - horizontal lines
  g.lineStyle(1, 0x4a6a4a, 0.6);
  for (let y = 0; y < 600; y += 40) {
    g.lineBetween(0, y, 800, y);
  }
  
  // Static grid pattern - vertical lines
  for (let x = 0; x < 800; x += 40) {
    g.lineBetween(x, 0, x, 600);
  }
  
  // Solder pads at grid intersections
  g.fillStyle(0x5a7a5a, 0.8);
  for (let y = 0; y < 600; y += 40) {
    for (let x = 0; x < 800; x += 40) {
      g.fillCircle(x, y, 2);
    }
  }
}

function drawCircuitBoard(g, offset) {
  // Dark PCB green background
  g.fillStyle(0x2a4a2a, 1);
  g.fillRect(0, 0, 800, 600);
  
  // Calculate horizontal offsets for smooth scrolling
  const traceOffsetX = offset % 60;
  const chipOffsetX = offset % 150;
  
  // Circuit traces (horizontal and vertical lines)
  g.lineStyle(2, 0x7a9a5a, 0.8);
  for (let y = 0; y < 600; y += 80) {
    g.lineBetween(0, y, 800, y);
    g.lineBetween(0, y + 20, 800, y + 20);
  }
  // Vertical traces scroll left
  for (let x = -traceOffsetX; x < 850; x += 60) {
    g.lineBetween(x, 0, x, 600);
  }
  
  // Add chips and components (scroll left)
  for (let y = 20; y < 600; y += 160) {
    for (let x = 50 - chipOffsetX; x < 900; x += 150) {
      // IC chip
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(x - 20, y - 15, 40, 30);
      g.lineStyle(1, 0x4a4a4a, 1);
      g.strokeRect(x - 20, y - 15, 40, 30);
      
      // Pins
      g.fillStyle(0x8a8a8a, 1);
      for (let i = 0; i < 6; i++) {
        g.fillRect(x - 25, y - 12 + i * 5, 5, 2);
        g.fillRect(x + 20, y - 12 + i * 5, 5, 2);
      }
    }
  }
  
  // Capacitors and resistors (scroll left)
  for (let y = 100; y < 600; y += 160) {
    for (let x = 120 - chipOffsetX; x < 900; x += 150) {
      // Capacitor
      g.fillStyle(0x3a3a1a, 1);
      g.fillCircle(x, y, 8);
      g.lineStyle(1, 0x8a8a4a, 1);
      g.strokeCircle(x, y, 8);
    }
  }
  
  // Solder pads (scroll left)
  g.fillStyle(0xaa8844, 0.6);
  for (let y = 10; y < 600; y += 80) {
    for (let x = 30 - traceOffsetX; x < 850; x += 60) {
      g.fillCircle(x, y, 3);
    }
  }
}

// =============================================================================
// DRAWING
// =============================================================================
function drawTitleScreen() {
  graphics.clear();
  drawCircuitBoard(graphics, bgScrollOffset);
}

function drawGame() {
  graphics.clear();
  
  // Draw circuit board background scrolling left
  drawCircuitBoard(graphics, bgScrollOffset);
  
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
  
  // Draw INPUT circles only on the first segment
  if (firstSegmentX !== null) {
    segments.forEach(seg => {
      // Only show input circles on the first segment (within a small tolerance)
      if (Math.abs(seg.x - firstSegmentX) < 10 && seg.x > -50 && seg.x < 100) {
        // Circle
        graphics.lineStyle(4, 0x00ffff, 1);
        graphics.strokeCircle(seg.x, seg.y, 30);
        graphics.fillStyle(0x001122, 1);
        graphics.fillCircle(seg.x, seg.y, 26);
        
        // Create or update text for "input"
        if (!inputTexts[seg.track]) {
          inputTexts[seg.track] = sceneRef.add.text(seg.x, seg.y, 'input', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00ffff',
            stroke: '#001122',
            strokeThickness: 2
          }).setOrigin(0.5);
        }
        // Update position
        inputTexts[seg.track].setPosition(seg.x, seg.y);
        inputTexts[seg.track].setVisible(true);
      } else if (inputTexts[seg.track]) {
        // Hide text when not on first segment
        inputTexts[seg.track].setVisible(false);
      }
    });
  }
  
  // Draw obstacles (pixel art explosions)
  obstacles.forEach(obs => {
    obs.pulse += 0.08;
    const px = 5; // Pixel size for blocky look
    const pulseScale = 0.8 + Math.sin(obs.pulse) * 0.2;
    const s = obs.size * pulseScale;
    const maxRad = Math.ceil(s);
    
    // Outer red layer - circular fill
    graphics.fillStyle(0xcc0000, 1);
    const outerRad = s * 0.95;
    for (let dy = -maxRad; dy <= maxRad; dy += px) {
      for (let dx = -maxRad; dx <= maxRad; dx += px) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > outerRad * 0.7 && dist <= outerRad) {
          const noise = Math.sin((dx + dy) * 0.5 + obs.pulse * 2) * 3;
          if (dist + noise <= outerRad) {
            graphics.fillRect(Math.floor(obs.x + dx - px/2), Math.floor(obs.y + dy - px/2), px, px);
          }
        }
      }
    }
    
    // Middle orange layer - circular fill
    graphics.fillStyle(0xff6600, 1);
    const midRad = s * 0.65;
    for (let dy = -maxRad; dy <= maxRad; dy += px) {
      for (let dx = -maxRad; dx <= maxRad; dx += px) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > midRad * 0.5 && dist <= midRad) {
          graphics.fillRect(Math.floor(obs.x + dx - px/2), Math.floor(obs.y + dy - px/2), px, px);
        }
      }
    }
    
    // Inner yellow layer - circular fill
    graphics.fillStyle(0xffff00, 1);
    const innerRad = s * 0.4;
    for (let dy = -maxRad; dy <= maxRad; dy += px) {
      for (let dx = -maxRad; dx <= maxRad; dx += px) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= innerRad) {
          graphics.fillRect(Math.floor(obs.x + dx - px/2), Math.floor(obs.y + dy - px/2), px, px);
        }
      }
    }
    
    // White hot center - 2x2 pixel block
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(Math.floor(obs.x - px), Math.floor(obs.y - px), px * 2, px * 2);
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
  
}

// =============================================================================
// GAME FLOW
// =============================================================================
function startGame(scene) {
  gameStarted = true;
  gameActive = false;
  titleText.destroy();
  instructText.destroy();
  startPrompt.destroy();
  scoreText.setVisible(true);
  speedText.setVisible(true);
  comboText.setVisible(true);
  
  // Start countdown
  countdownTimer = 1.0;
  countdownText = scene.add.text(400, 300, '3', {
    fontSize: '120px',
    fontFamily: 'monospace',
    color: '#00ffff',
    stroke: '#ff6600',
    strokeThickness: 8
  }).setOrigin(0.5);
  
  playTone(scene, 440, 0.1);
}

function endGame(scene) {
  gameOver = true;
  playTone(scene, 220, 0.5);
  
  // Check if score qualifies for top 5
  const isHighScore = (highScores.length < 5 || score > highScores[4].score) && score > 0;
  
  if (isHighScore) {
    showNameEntry(scene);
  } else {
    showGameOver(scene);
  }
}

function showGameOver(scene) {
  showingGameOver = true;
  
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 0.85);
  overlay.fillRect(0, 0, 800, 600);
  
  const gameOverTxt = scene.add.text(400, 250, 'GAME OVER', {
    fontSize: '72px',
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
  
  scene.add.text(400, 350, 'SCORE: ' + score, {
    fontSize: '36px',
    fontFamily: 'monospace',
    color: '#00ffff',
    stroke: '#000',
    strokeThickness: 4
  }).setOrigin(0.5);
  
  continuePrompt =scene.add.text(400, 420, 'Press ENTER to continue', {
    fontSize: '26px',
    fontFamily: 'monospace',
    color: '#00ff00',
    stroke: '#000',
    strokeThickness: 4
  }).setOrigin(0.5);
  scene.tweens.add({
    targets: continuePrompt,
    alpha: { from: 1, to: 0.3 },
    duration: 600,
    yoyo: true,
    repeat: -1
  });
}

function showNameEntry(scene) {
  enteringName = true;
  playerName = ['A', 'A', 'A'];
  nameIndex = 0;
  
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 0.85);
  overlay.fillRect(0, 0, 800, 600);
  
  scene.add.text(400, 150, 'NEW HIGH SCORE!', {
    fontSize: '56px',
    fontFamily: 'monospace',
    color: '#ffff00',
    stroke: '#ff6600',
    strokeThickness: 6
  }).setOrigin(0.5);
  
  scene.add.text(400, 230, 'SCORE: ' + score, {
    fontSize: '32px',
    fontFamily: 'monospace',
    color: '#00ffff',
    stroke: '#000',
    strokeThickness: 4
  }).setOrigin(0.5);
  
  scene.add.text(400, 290, 'Enter Your Name:', {
    fontSize: '28px',
    fontFamily: 'monospace',
    color: '#ffaa00',
    stroke: '#000',
    strokeThickness: 3
  }).setOrigin(0.5);
  
  nameInputText = scene.add.text(400, 360, playerName.join(''), {
    fontSize: '72px',
    fontFamily: 'monospace',
    color: '#00ff00',
    stroke: '#000',
    strokeThickness: 6
  }).setOrigin(0.5);
  
  scene.add.text(400, 490, 'W / S: Change letter\nSpace bar: Confirm', {
    fontSize: '22px',
    fontFamily: 'monospace',
    color: '#888888',
    align: 'center',
    stroke: '#000',
    strokeThickness: 3
  }).setOrigin(0.5);
  
  // Cursor indicator
  const cursorY = 420;
  const cursorX = 340 + nameIndex * 40;
  nameCursor = scene.add.text(cursorX, cursorY, '▲', {
    fontSize: '32px',
    fontFamily: 'monospace',
    color: '#ff00ff'
  }).setOrigin(0.5);
  
  scene.tweens.add({
    targets: nameCursor,
    alpha: { from: 1, to: 0.3 },
    duration: 400,
    yoyo: true,
    repeat: -1
  });
}

function updateNameDisplay() {
  if (nameInputText) {
    nameInputText.setText(playerName.join(''));
  }
}

function updateCursorPosition() {
  if (nameCursor) {
    const cursorX = 340 + nameIndex * 40;
    nameCursor.setX(cursorX);
  }
}

function submitScore(scene) {
  enteringName = false;
  showingGameOver = false;
  const name = playerName.join('');
  
  // Add score to high scores
  highScores.push({ name, score });
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 5);
  
  playTone(scene, 1000, 0.2);
  
  // Clear the name entry screen
  scene.children.removeAll();
  
  // Recreate graphics object for background drawing
  graphics = scene.add.graphics();
  
  // Show scoreboard without restarting
  showScoreboard(scene, true);
}

function showScoreboard(scene, justSubmitted) {
  // Draw static circuit board background
  const bgGraphics = scene.add.graphics();
  drawStaticCircuitBoard(bgGraphics);
  
  // Draw chip component at top center
  const chipGraphics = scene.add.graphics();
  const chipX = 400;
  const chipY = 300;
  const chipWidth = 700;
  const chipHeight = 520;
  
  // Chip body (dark grey/black)
  chipGraphics.fillStyle(0x1a1a1a, 1);
  chipGraphics.fillRect(chipX - chipWidth/2, chipY - chipHeight/2, chipWidth, chipHeight);
  chipGraphics.lineStyle(2, 0x4a4a4a, 1);
  chipGraphics.strokeRect(chipX - chipWidth/2, chipY - chipHeight/2, chipWidth, chipHeight);
  
  // Pins on all sides
  chipGraphics.fillStyle(0x8a8a8a, 1);
  const pinLength = 15;
  const pinSpacing = 15;
  
  // Top pins
  for (let i = 0; i < 47; i++) {
    const pinX = chipX - chipWidth/2 + 8 + i * pinSpacing;
    chipGraphics.fillRect(pinX - 2, chipY - chipHeight/2 - pinLength, 4, pinLength);
  }
  
  // Bottom pins
  for (let i = 0; i < 47; i++) {
    const pinX = chipX - chipWidth/2 + 8 + i * pinSpacing;
    chipGraphics.fillRect(pinX - 2, chipY + chipHeight/2, 4, pinLength);
  }
  
  // Left pins
  for (let i = 0; i < 35; i++) {
    const pinY = chipY - chipHeight/2 + 8 + i * pinSpacing;
    chipGraphics.fillRect(chipX - chipWidth/2 - pinLength, pinY - 2, pinLength, 4);
  }
  
  // Right pins
  for (let i = 0; i < 35; i++) {
    const pinY = chipY - chipHeight/2 + 8 + i * pinSpacing;
    chipGraphics.fillRect(chipX + chipWidth/2, pinY - 2, pinLength, 4);
  }
  
  // High Scores
  highScoreText = scene.add.text(400, 120, '═══ HIGH SCORES ═══', {
    fontSize: '54px',
    fontFamily: 'monospace',
    color: '#00ffff',
    stroke: '#ff6600',
    strokeThickness: 6
  }).setOrigin(0.5);
  
  if (highScores.length === 0) {
    scene.add.text(400, 300, 'No scores yet!\nBe the first!', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffaa00',
      align: 'center',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);
  } else {
    highScores.forEach((entry, i) => {
      const y = 210 + i * 50;
      const isNew = justSubmitted && entry.score === score && entry.name === playerName.join('');
      const nameColor = isNew ? '#ffff00' : '#ffaa00';
      const scoreColor = isNew ? '#ffff00' : '#ffaa00';
      const rank = '0x' + (i + 1).toString(16).toUpperCase();
      
      const rankText = scene.add.text(200, y, rank, {
        fontSize: '28px',
        fontFamily: 'monospace',
        color: '#00ffff',
        stroke: '#000',
        strokeThickness: 3
      });
      
      const nameText = scene.add.text(320, y, entry.name, {
        fontSize: '28px',
        fontFamily: 'monospace',
        color: nameColor,
        stroke: '#000',
        strokeThickness: 3
      });
      
      const scoreText = scene.add.text(600, y, entry.score.toString(), {
        fontSize: '28px',
        fontFamily: 'monospace',
        color: scoreColor,
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(1, 0);
    });
  }
  
  const restartTxt = scene.add.text(400, 515, 'Press ENTER to return to menu', {
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
  gameActive = false;
  enteringName = false;
  showingGameOver = false;
  nameInputText = null;
  nameCursor = null;
  score = 0;
  combo = 0;
  speed = 1.5;
  baseSpeed = 1.5;
  maxSpeed = 1.5;
  currentTrack = Math.floor(NUM_TRACKS / 2);
  segments = [];
  obstacles = [];
  powerups = [];
  particles = [];
  lastSegmentX = 0;
  segmentCounter = 0;
  lastGapTracks = [];
  boostTimer = 0;
  boostActive = false;
  playerFalling = false;
  playerVY = 0;
  inputTexts = {};
  countdownText = null;
  countdownTimer = 0;
  firstSegmentX = null;
  bgScrollOffset = 0;
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