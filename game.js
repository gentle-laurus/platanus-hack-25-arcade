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
let player, graphics, scoreText, speedText;
let tracks = [], segments = [], obstacles = [], powerups = [];
let currentTrack = Math.floor(NUM_TRACKS / 2);
let score = 0, speed = 4.0, baseSpeed = 4.0;
let gameOver = false, gameStarted = false;
let gridOffset = 0;
let bgScrollOffset = 0; // Smooth background scrolling
let titleText, instructText, startPrompt;
let sceneRef = null;
let titleOverlay = null;
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
let gameTime = 0; // Track elapsed game time for speed progression
let lastScoreTime = 0; // Track when last 5-second bonus was awarded
let highScores = [];
let enteringName = false;
let playerName = ['A', 'A', 'A'];
let nameIndex = 0;
let nameInputText = null;
let nameCursor = null;
let showingGameOver = false;
let showingScoreboard = false;
// Advanced Audio Engine
let audioCtx;
let masterGain;
let convolver;
let dryGain;
let wetGain;
let drumGain;
let sequencerInterval;
let bpm = 120;
let stepDuration;
let currentSequence = "sequence_0";
let sequencePlayCount = 0;
let sequenceMaxPlays = {
  sequence_0: 4,
  sequence_1: 4,
  sequence_2: 4,
  sequence_3: 4,
};
let menuMusicStartTime = null;
let menuMusicTimeout = null;
let droneOscillators = []; // Track drone oscillators for stopping

const sequences = {
  sequence_0: {
    kick: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bass: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    kalimba: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  sequence_1: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bass: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    kalimba: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  sequence_1_final: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bass: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    kalimba: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  sequence_2: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bass: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    kalimba: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  sequence_3: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bass: [55, 0, 0, 55, 0, 0, 55, 0, 65, 0, 0, 0, 55, 0, 55, 0],
    kalimba: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  sequence_3_final: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bass: [55, 0, 0, 55, 0, 0, 55, 0, 44, 0, 0, 0, 55, 0, 55, 0],
    kalimba: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
};

// =============================================================================
// CREATE
// =============================================================================
function create() {
  const scene = this;
  sceneRef = scene;
  graphics = this.add.graphics();
  titleOverlay = this.add.graphics();
  titleOverlay.setDepth(1); // Behind text but above background
  
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
  scoreText = scene.add.text(16, 16, 'TX DATA: 0', {
    fontSize: '20px',
    fontFamily: 'monospace',
    color: '#00ffff',
    stroke: '#000',
    strokeThickness: 4
  }).setVisible(false);
  
  speedText = scene.add.text(16, 50, 'TX RATE: 4.0x', {
    fontSize: '20px',
    fontFamily: 'monospace',
    color: '#ffaa00',
    stroke: '#000',
    strokeThickness: 3
  }).setVisible(false);
  
  // Title screen
  titleText = scene.add.text(400, 140, 'CIRCUIT BREAKER', {
    fontSize: '72px',
    fontFamily: 'monospace',
    color: '#00ffff',
    stroke: '#ff6600',
    strokeThickness: 8
  }).setOrigin(0.5).setDepth(10);
  
  instructText = scene.add.text(400, 320, 'Navigate a living circuit at light speed!\n\nW / S: Switch tracks\nSpace bar: Jump gaps\n\nCollect blue ⚡ for Tx Rate boost\nAvoid ✱ explosions and R/C!', {
    fontSize: '22px',
    fontFamily: 'monospace',
    color: '#ffaa00',
    align: 'center',
    stroke: '#000',
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(10);
  
  startPrompt = scene.add.text(400, 500, '<Press ENTER to begin>', {
    fontSize: '26px',
    fontFamily: 'monospace',
    color: '#00ff00',
    stroke: '#000',
    strokeThickness: 4
  }).setOrigin(0.5).setDepth(10);
  
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
      const next = currentTrack - 1;
      if (isLaneSafeAtX(next, player.x)) {
        currentTrack = next;
        player.targetY = tracks[next].y;
        playTone(scene, 660, 0.05);
      } else {
        playTone(scene, 220, 0.05);
      }
    } else if (k === 'P1D' && currentTrack < NUM_TRACKS - 1 && !playerFalling) {
      const next = currentTrack + 1;
      if (isLaneSafeAtX(next, player.x)) {
        currentTrack = next;
        player.targetY = tracks[next].y;
        playTone(scene, 660, 0.05);
      } else {
        playTone(scene, 220, 0.05);
      }
    } else if (k === 'P1A' && !playerFalling) {
      // Boost jump with upward velocity
      playerFalling = true;
      playerVY = -310; // Upward jump velocity
      createParticles(player.x - 40, player.y, '#ffff00', 12);
      playTone(scene, 880, 0.08);
    }
  });
  
  // Initialize advanced audio engine
  audioCtx = this.sound.context;
  
  convolver = audioCtx.createConvolver();
  convolver.buffer = createReverbIR(3, 2);

  dryGain = audioCtx.createGain();
  wetGain = audioCtx.createGain();
  drumGain = audioCtx.createGain();
  masterGain = audioCtx.createGain();

  dryGain.gain.value = 0.7;
  wetGain.gain.value = 0.5;
  drumGain.gain.value = 1;
  masterGain.gain.value = 0.6;

  dryGain.connect(masterGain);
  wetGain.connect(convolver);
  convolver.connect(masterGain);
  drumGain.connect(masterGain);
  masterGain.connect(audioCtx.destination);
  
  // Ensure audio context is unlocked by a user gesture before playing sounds
  const resumeAudio = () => {
    const ctx = scene.sound.context;
    if (ctx && ctx.state !== 'running') ctx.resume();
    playTone(scene, 440, 0.15);
    // startMenuMusic();  // Start title screen with menu music (commented out for now)
  };
  if (scene.sound.locked) {
    scene.input.once('pointerdown', resumeAudio);
    scene.input.keyboard.once('keydown', resumeAudio);
  } else {
    resumeAudio();
  }
}

// =============================================================================
// HELPERS
// =============================================================================
function isLaneSafeAtX(trackIndex, x) {
  const segs = segments.filter(s =>
    s.track === trackIndex &&
    x >= s.x && x <= s.x + s.width
  );
  
  const onGap = segs.length === 0 || segs.some(s => s.type === 'gap');
  if (!onGap) return true;
  
  const gapSeg = segs.find(s => s.type === 'gap');
  // Allow only if a gap obstacle (capacitor/resistor) bridges this gap
  return obstacles.some(o =>
    o.isGapObstacle &&
    o.y === tracks[trackIndex].y &&
    (gapSeg
      ? (o.x >= gapSeg.x && o.x <= gapSeg.x + gapSeg.width)
      : Math.abs(o.x - x) < SEGMENT_WIDTH / 2)
  );
}

// =============================================================================
// UPDATE
// =============================================================================
function update(_time, delta) {
  const dt = delta / 1000;
  
  // Update background scroll (smooth continuous scrolling)
  if (!gameStarted) {
    bgScrollOffset += speed * dt * 30; // Slower for title screen
  } else if (gameActive) {
    // Normal game speed
    bgScrollOffset += speed * dt * 100;
  } else {
    // During countdown, use slower speed to match visual appearance when segments are static
    bgScrollOffset += speed * dt * 50;
  }
  
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
      
      if (countdownTimer > 0.9) {
        displayText = '3';
      } else if (countdownTimer > 0.6) {
        displayText = '2';
      } else if (countdownTimer > 0.3) {
        displayText = '1';
      } else if (countdownTimer > 0) {
        displayText = 'GO!';
        showGo = true;
      } else {
        countdownText.setVisible(false);
        gameActive = true;
        lastScoreTime = 0; // Initialize scoring timer when game becomes active
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
  
  // Time-based speed increase (only when game is active)
  if (gameActive) {
    gameTime += dt;
    // Increase baseSpeed gradually over time: 0.15 units per second
    // This gives a smooth progression that gets harder but remains playable
    baseSpeed += dt * 0.15;
  }
  
  // Update boost and apply speed
  if (boostActive) {
    boostTimer -= dt;
    // Continuously update speed to be 10% above current baseSpeed
    speed = baseSpeed * 1.1;
    if (boostTimer <= 0) {
      boostActive = false;
      // Update baseSpeed to current boosted speed so speed never decreases
      baseSpeed = speed;
      speedText.setColor('#ffaa00');
    }
  } else if (gameActive) {
    // Apply baseSpeed when not in boost mode
    speed = baseSpeed;
  }
  
  // Handle falling
  if (playerFalling) {
    playerVY += dt * 650; // Gravity
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
        // Check if there's a gap obstacle blocking this gap
        const gapSegment = currentSegments.find(seg => seg.type === 'gap');
        let hasGapObstacle = false;
        
        if (gapSegment) {
          // Check if any gap obstacle exists in this gap's position
          hasGapObstacle = obstacles.some(obs => 
            obs.isGapObstacle &&
            obs.y === tracks[currentTrack].y &&
            obs.x >= gapSegment.x &&
            obs.x <= gapSegment.x + gapSegment.width
          );
        } else {
          // No segment found, check if obstacle is at player position
          hasGapObstacle = obstacles.some(obs => 
            obs.isGapObstacle &&
            Math.abs(obs.x - player.x) < SEGMENT_WIDTH / 2 &&
            obs.y === tracks[currentTrack].y
          );
        }
        
        // Only fall if there's no gap obstacle
        if (!hasGapObstacle) {
          playerFalling = true;
          playerVY = 0;
        }
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
      if (obs.isGapObstacle) {
        // Rectangular bounding box collision for gap obstacles
        const obsLeft = obs.x - obs.width / 2;
        const obsRight = obs.x + obs.width / 2;
        const obsTop = obs.y - obs.height / 2;
        const obsBottom = obs.y + obs.height / 2;
        
        const playerLeft = player.x - player.size;
        const playerRight = player.x + player.size;
        const playerTop = player.y - player.size;
        const playerBottom = player.y + player.size;
        
        if (playerRight > obsLeft && playerLeft < obsRight &&
            playerBottom > obsTop && playerTop < obsBottom) {
          endGame(this);
          createExplosion(player.x, player.y);
        }
      } else {
        // Circular collision for explosion obstacles
        const dx = obs.x - player.x;
        const dy = obs.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.size + obs.size) {
          endGame(this);
          createExplosion(player.x, player.y);
        }
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
    
    // Update score every 5 seconds: 5 + floor(speed/2)
    lastScoreTime += dt;
    if (lastScoreTime >= 5.0) {
      const bonus = 5 + Math.floor(speed / 2);
      score += bonus;
      lastScoreTime = 0; // Reset timer
    }
    
    scoreText.setText('TX DATA: ' + score + ' B');
    speedText.setText('TX RATE: ' + speed.toFixed(1) + 'x');
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
  
  // Track which tracks have gap obstacles (capacitors/resistors)
  const tracksWithGapObstacles = [];
  
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
    
    // Create gap obstacle 50% of the time for gaps
    if (isGap && Math.random() > 0.5) {
      const componentType = Math.random() > 0.5 ? 'resistor' : 'capacitor';
      obstacles.push({
        x: x + SEGMENT_WIDTH / 2,
        y: tracks[i].y,
        componentType: componentType,
        isGapObstacle: true,
        width: 60,
        height: componentType === 'resistor' ? 16 : 80
      });
      // Track that this track has a gap obstacle
      tracksWithGapObstacles.push(i);
    }
  }
  
  // Update tracking for next segment
  lastGapTracks = currentGapTracks;
  
  // Spawn objects: each track has independent 45% chance of object
  // If object spawns: 55% explosion, 45% boost
  // BUT: skip if there's a capacitor/resistor on this track
  for (let i = 0; i < NUM_TRACKS; i++) {
    // Skip if this track has a gap obstacle (capacitor or resistor)
    if (tracksWithGapObstacles.includes(i)) {
      continue;
    }
    
    if (Math.random() > 0.55) {
      // Decide type: 55% explosion, 45% boost
      if (Math.random() > 0.45) {
        // Spawn explosion
        obstacles.push({
          x: x + SEGMENT_WIDTH / 2,
          y: tracks[i].y,
          size: 20,
          pulse: 0
        });
      } else {
        // Spawn boost
        powerups.push({
          x: x + SEGMENT_WIDTH / 2,
          y: tracks[i].y,
          angle: 0
        });
      }
    }
  }
}

// =============================================================================
// POWERUP COLLECTION
// =============================================================================
function collectPowerup(pow, scene) {
  score += 30;
  boostActive = true;
  boostTimer = 1;
  speed = baseSpeed * 1.2; // 20% speed increase
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

function drawCircuitCables(g, chipX, chipY, chipWidth, chipHeight, chipScale = 1) {
  // Copper-colored traces (simulating PCB connections)
  // Aligned to the 40-pixel grid
  const GRID_SIZE = 40;
  g.lineStyle(2, 0xb87333, 0.7); // Copper color
  
  // Create a deterministic but random-looking pattern using seeded positions
  const seed = 12345; // Fixed seed for consistent pattern
  let r = seed;
  
  // Simple seeded random function
  function seededRandom() {
    r = (r * 1103515245 + 12345) & 0x7fffffff;
    return (r >>> 0) / 0x7fffffff;
  }
  
  // Helper to snap to grid
  function snapToGrid(val) {
    return Math.floor(val / GRID_SIZE) * GRID_SIZE;
  }
  
  // Calculate chip pin positions (matching drawChip logic)
  const pinLength = 15 * chipScale;
  const pinSpacing = 15 * chipScale;
  const pinWidth = 4 * chipScale;
  const pinOffset = 8 * chipScale;
  const topBottomPins = Math.floor((chipWidth - pinOffset * 2) / pinSpacing)+2;
  const leftRightPins = Math.floor((chipHeight - pinOffset * 2) / pinSpacing)+2;
  
  const chipPins = [];
  
  // Top pins
  for (let i = 0; i < topBottomPins; i++) {
    const pinX = chipX - chipWidth/2 + pinOffset + i * pinSpacing;
    const pinY = chipY - chipHeight/2 - pinLength;
    chipPins.push({ x: pinX, y: pinY, side: 'top' });
  }
  
  // Bottom pins
  for (let i = 0; i < topBottomPins; i++) {
    const pinX = chipX - chipWidth/2 + pinOffset + i * pinSpacing;
    const pinY = chipY + chipHeight/2 + pinLength;
    chipPins.push({ x: pinX, y: pinY, side: 'bottom' });
  }
  
  // Left pins
  for (let i = 0; i < leftRightPins; i++) {
    const pinX = chipX - chipWidth/2 - pinLength;
    const pinY = chipY - chipHeight/2 + pinOffset + i * pinSpacing;
    chipPins.push({ x: pinX, y: pinY, side: 'left' });
  }
  
  // Right pins
  for (let i = 0; i < leftRightPins; i++) {
    const pinX = chipX + chipWidth/2 + pinLength;
    const pinY = chipY - chipHeight/2 + pinOffset + i * pinSpacing;
    chipPins.push({ x: pinX, y: pinY, side: 'right' });
  }
  
  // Draw traces extending from each pin following the grid
  for (let i = 0; i < chipPins.length; i++) {
    const pin = chipPins[i];
    
    // Determine direction based on pin side
    let extendX = 0;
    let extendY = 0;
    let length = 0;
    
    if (pin.side === 'top') {
      // Extend upward (negative Y)
      extendY = -1;
      length = 40 + seededRandom() * 200; // Vary length
    } else if (pin.side === 'bottom') {
      // Extend downward (positive Y)
      extendY = 1;
      length = 40 + seededRandom() * 200;
    } else if (pin.side === 'left') {
      // Extend leftward (negative X)
      extendX = -1;
      length = 40 + seededRandom() * 200;
    } else if (pin.side === 'right') {
      // Extend rightward (positive X)
      extendX = 1;
      length = 40 + seededRandom() * 200;
    }
    
    // Calculate end point - keep the non-extending coordinate exactly the same for straight lines
    let endX, endY;
    
    if (extendX !== 0) {
      // Extending horizontally - keep Y exactly the same, snap X to grid
      endX = snapToGrid(pin.x + extendX * length);
      endY = pin.y; // Keep Y exactly the same as pin
    } else {
      // Extending vertically - keep X exactly the same, snap Y to grid
      endX = pin.x; // Keep X exactly the same as pin
      endY = snapToGrid(pin.y + extendY * length);
    }
    
    // Draw perfectly straight line from pin to grid point
    g.lineBetween(pin.x, pin.y, endX, endY);
    
    // Sometimes extend further with a turn (L-shaped)
    if (seededRandom() > 0.5) {
      let turnX, turnY;
      
      if (extendX !== 0) {
        // Was horizontal, now turn vertical - keep X exactly the same
        turnX = endX; // Keep X exactly the same
        const turnDir = seededRandom() > 0.5 ? 1 : -1;
        turnY = snapToGrid(endY + turnDir * (40 + seededRandom() * 120));
      } else {
        // Was vertical, now turn horizontal - keep Y exactly the same
        const turnDir = seededRandom() > 0.5 ? 1 : -1;
        turnX = snapToGrid(endX + turnDir * (40 + seededRandom() * 120));
        turnY = endY; // Keep Y exactly the same
      }
      
      // Draw perfectly straight second segment
      g.lineBetween(endX, endY, turnX, turnY);
      
      // Draw pad at end
      if (seededRandom() > 0.3) {
        g.fillStyle(0xaa8844, 0.8);
        g.fillCircle(turnX, turnY, 4);
      }
    } else {
      // Draw pad at straight end
      if (seededRandom() > 0.3) {
        g.fillStyle(0xaa8844, 0.8);
        g.fillCircle(endX, endY, 4);
      }
    }
  }
}

function drawCapacitor(g, x, y, scale = 1) {
  const w = 80 * scale;
  const h = 55 * scale;
  const r = w / 2;
  
  // Cylinder body (light blue-green)
  g.fillStyle(0x7dd3c0, 1);
  g.fillEllipse(x, y - h/2, w, h * 0.3);
  g.fillRect(x - r, y - h/2, w, h);
  g.fillEllipse(x, y + h/2, w, h * 0.3);
  
  // Orange stripe
  g.fillStyle(0xff6600, 1);
  const stripeWidth = w * 0.2;
  const stripeX = x - r + w * 0.15;
  g.fillRect(stripeX, y - h/2, stripeWidth, h);
  
  // White top
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(x, y - h/2, w * 0.9, h * 0.25);
  
  // Black cross on top
  g.lineStyle(3, 0x000000, 1);
  const crossSize = w * 0.3;
  g.lineBetween(x - crossSize/2, y - h/2, x + crossSize/2, y - h/2);
  g.lineBetween(x, y - h/2 - crossSize/2, x, y - h/2 + crossSize/2);
  
  // Silver leads
  g.fillStyle(0xc0c0c0, 1);
  const leadWidth = 3 * scale;
  const leadLength = 12 * scale;
  const leadSpacing = 12 * scale;
  g.fillRect(x - leadSpacing/2 - leadWidth/2, y + h/2+13, leadWidth, leadLength);
  g.fillRect(x + leadSpacing/2 - leadWidth/2, y + h/2+13, leadWidth, leadLength);
}

function drawResistor(g, x, y, scale = 1) {
  const bodyLength = 60 * scale;
  const bodyRadius = 8 * scale;
  const leadLength = 25 * scale;
  
  // Silver leads (left and right)
  g.fillStyle(0xc0c0c0, 1);
  g.fillRect(x - bodyLength/2 - leadLength, y - 1 * scale, leadLength, 2 * scale);
  g.fillRect(x + bodyLength/2, y - 1 * scale, leadLength, 2 * scale);
  
  // Resistor body (light beige/tan, slightly bulbous)
  // Draw as an ellipse to create the bulbous effect
  g.fillStyle(0xd4c4a8, 1);
  g.fillEllipse(x, y, bodyLength, bodyRadius * 2.2);
  
  // Subtle shading (darker on bottom-right)
  g.fillStyle(0xc4b498, 0.4);
  g.fillEllipse(x + bodyLength * 0.1, y + bodyRadius * 0.3, bodyLength * 0.8, bodyRadius * 1.8);
  
  // Color bands (from left to right)
  const bandWidth = 4 * scale;
  const bandSpacing = bodyLength / 5;
  
  // Second band: Purple/Violet
  g.fillStyle(0x800080, 1);
  g.fillRect(x - bodyLength/2 + bandSpacing * 1.2, y - bodyRadius, bandWidth, bodyRadius * 2);
  
  // Third band: Orange
  g.fillStyle(0xff6600, 1);
  g.fillRect(x - bodyLength/2 + bandSpacing * 1.9, y - bodyRadius, bandWidth, bodyRadius * 2);
}

function drawChip(g, x, y, width, height, scale = 1) {
  const pinLength = 15 * scale;
  const pinSpacing = 15 * scale;
  const pinWidth = 4 * scale;
  const pinOffset = 8 * scale;
  
  // Chip body (dark grey/black)
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(x - width/2, y - height/2, width, height);
  g.lineStyle(2 * scale, 0x4a4a4a, 1);
  g.strokeRect(x - width/2, y - height/2, width, height);
  
  // Calculate number of pins based on dimensions
  const topBottomPins = Math.floor((width - pinOffset * 2) / pinSpacing) + 2;
  const leftRightPins = Math.floor((height - pinOffset * 2) / pinSpacing) + 2;
  
  // Pins on all sidesdrawChip
  g.fillStyle(0x8a8a8a, 1);
  
  // Top pins
  for (let i = 0; i < topBottomPins; i++) {
    const pinX = x - width/2 + pinOffset + i * pinSpacing;
    g.fillRect(pinX - pinWidth/2, y - height/2 - pinLength, pinWidth, pinLength);
  }
  
  // Bottom pins
  for (let i = 0; i < topBottomPins; i++) {
    const pinX = x - width/2 + pinOffset + i * pinSpacing;
    g.fillRect(pinX - pinWidth/2, y + height/2, pinWidth, pinLength);
  }
  
  // Left pins
  for (let i = 0; i < leftRightPins; i++) {
    const pinY = y - height/2 + pinOffset + i * pinSpacing;
    g.fillRect(x - width/2 - pinLength, pinY - pinWidth/2, pinLength, pinWidth);
  }
  
  // Right pins
  for (let i = 0; i < leftRightPins; i++) {
    const pinY = y - height/2 + pinOffset + i * pinSpacing;
    g.fillRect(x + width/2, pinY - pinWidth/2, pinLength, pinWidth);
  }
}

// =============================================================================
// DRAWING
// =============================================================================
// Realistic neon green circuit board background for title screen
function drawCyberpunkCircuitTitle(g, offset, scale = 1) {
  // PCB substrate (dark green, like real circuit boards)
  g.fillStyle(0x0d2a1a, 1);
  g.fillRect(0, 0, 800, 600);
  
  const G = 24; // Grid size for component placement
  const snap = v => Math.round(v / G) * G;
  const t = offset * 0.01;
  const copper = 0xb87333; // Copper color for traces
  const centerX = 400;
  const centerY = 300;
  
  // Helper to scale coordinates relative to center (for zoom out effect)
  const scaleCoord = (x, y) => {
    return {
      x: centerX + (x - centerX) * scale,
      y: centerY + (y - centerY) * scale
    };
  };
  
  // Collect all chip bounding boxes for clipping traces
  const chipRects = [];
  
  // Helper: Check if a point is inside a rectangle
  function pointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }
  
  // Helper: Check if a point overlaps with any chip
  function pointOverlapsChip(x, y, radius = 0) {
    for (const rect of chipRects) {
      // Check if point (with optional radius) overlaps with chip rectangle
      const closestX = Math.max(rect.left, Math.min(x, rect.right));
      const closestY = Math.max(rect.top, Math.min(y, rect.bottom));
      const dx = x - closestX;
      const dy = y - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radius * radius) return true;
    }
    return false;
  }
  
  // Helper: Check if a line segment intersects a rectangle
  function lineIntersectsRect(x1, y1, x2, y2, rect) {
    // Check if either endpoint is inside
    if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true;
    
    // Check if line segment intersects any edge of the rectangle
    // Using Liang-Barsky algorithm for line-rectangle intersection
    const dx = x2 - x1;
    const dy = y2 - y1;
    let t0 = 0, t1 = 1;
    
    const p = [-dx, dx, -dy, dy];
    const q = [x1 - rect.left, rect.right - x1, y1 - rect.top, rect.bottom - y1];
    
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return false; // Line is parallel and outside
      } else {
        const r = q[i] / p[i];
        if (p[i] < 0) {
          if (r > t1) return false;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return false;
          if (r < t1) t1 = r;
        }
      }
    }
    
    return t0 < t1; // Line segment intersects if t0 < t1
  }
  
  // Helper: Clip a line segment against a rectangle, returning segments that don't intersect
  function clipLineAgainstRect(x1, y1, x2, y2, rect) {
    if (!lineIntersectsRect(x1, y1, x2, y2, rect)) {
      return [{x1, y1, x2, y2}]; // No intersection, return original segment
    }
    
    // If line intersects, split it into segments that avoid the chip
    const segments = [];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) return [];
    
    // Sample points along the line and find segments that don't intersect
    const step = 2; // Small step size for precision
    const steps = Math.ceil(len / step);
    let lastValidX = null, lastValidY = null;
    let inChip = false;
    let finalX = x2, finalY = y2; // Store final endpoint
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + dx * t;
      const y = y1 + dy * t;
      const inside = pointInRect(x, y, rect);
      
      if (!inside && !inChip) {
        // Starting a valid segment
        if (lastValidX === null) {
          lastValidX = x;
          lastValidY = y;
        }
      } else if (inside && lastValidX !== null) {
        // Entering chip, end current segment
        segments.push({x1: lastValidX, y1: lastValidY, x2: x, y2: y});
        lastValidX = null;
        lastValidY = null;
        inChip = true;
      } else if (!inside && inChip) {
        // Exiting chip, start new segment
        lastValidX = x;
        lastValidY = y;
        inChip = false;
      }
    }
    
    // Add final segment if we ended outside the chip
    if (lastValidX !== null) {
      segments.push({x1: lastValidX, y1: lastValidY, x2: finalX, y2: finalY});
    }
    
    return segments;
  }
  
  // Helper: Draw realistic PCB trace (copper trace with glow), clipping against chips
  function drawTrace(x1, y1, x2, y2, width = 3) {
    // Clip against all chips
    let segments = [{x1, y1, x2, y2}];
    for (const rect of chipRects) {
      const newSegments = [];
      for (const seg of segments) {
        newSegments.push(...clipLineAgainstRect(seg.x1, seg.y1, seg.x2, seg.y2, rect));
      }
      segments = newSegments;
    }
    
    // Draw each non-intersecting segment
    for (const seg of segments) {
      // Outer glow
      g.lineStyle(width + 6, copper, 0.12);
      g.lineBetween(seg.x1, seg.y1, seg.x2, seg.y2);
      // Core trace (copper)
      g.lineStyle(width, copper, 0.95);
      g.lineBetween(seg.x1, seg.y1, seg.x2, seg.y2);
      // Solder pad at start (only if not too close to chip)
      g.fillStyle(copper, 0.8);
      g.fillCircle(seg.x1, seg.y1, width + 2);
      // Solder pad at end (only if not too close to chip)
      g.fillCircle(seg.x2, seg.y2, width + 2);
    }
  }
  
  // Helper: Draw trace with 90-degree bends (realistic routing)
  function drawTracedPath(points, width = 3) {
    for (let i = 0; i < points.length - 1; i++) {
      drawTrace(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, width);
    }
  }
  
  // Subtle grid (like PCB design grid)
  g.lineStyle(1, 0x1a3a2a, 0.15);
  for (let x = 0; x < 800; x += G) {
    g.lineBetween(x, 0, x, 600);
  }
  for (let y = 0; y < 600; y += G) {
    g.lineBetween(0, y, 800, y);
  }
  
  // Main IC chip (center, realistic DIP package) - scaled
  const baseCx = 400, baseCy = 300;
  const baseIcW = 140, baseIcH = 100;
  const sc = scaleCoord(baseCx, baseCy);
  const cx = sc.x, cy = sc.y;
  const icW = baseIcW * scale, icH = baseIcH * scale;
  // Add main IC to chip rectangles for clipping
  chipRects.push({
    left: cx - icW/2,
    right: cx + icW/2,
    top: cy - icH/2,
    bottom: cy + icH/2
  });
  // IC body
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(cx - icW/2, cy - icH/2, icW, icH);
  g.lineStyle(2, 0x3a3a3a, 1);
  g.strokeRect(cx - icW/2, cy - icH/2, icW, icH);
  // IC marking (dot for pin 1)
  g.fillStyle(copper, 0.9);
  g.fillCircle(cx - icW/2 + 8 * scale, cy - icH/2 + 8 * scale, 3 * scale);
  // Pins (dual in-line package)
  const pinCount = 14;
  const pinSpacing = icH / (pinCount / 2 + 1);
  g.fillStyle(0x8a8a8a, 1);
  // Left side pins
  for (let i = 0; i < pinCount / 2; i++) {
    const py = cy - icH/2 + pinSpacing * (i + 1);
    g.fillRect(cx - icW/2 - 12 * scale, py - 1 * scale, 12 * scale, 2 * scale);
  }
  // Right side pins
  for (let i = 0; i < pinCount / 2; i++) {
    const py = cy - icH/2 + pinSpacing * (i + 1);
    g.fillRect(cx + icW/2, py - 1 * scale, 12 * scale, 2 * scale);
  }
  
  // Smaller ICs (realistic placement) - scaled
  const baseIcs = [
    {x: 180, y: 150, w: 80, h: 60, pins: 8},
    {x: 620, y: 150, w: 80, h: 60, pins: 8},
    {x: 180, y: 450, w: 80, h: 60, pins: 8},
    {x: 620, y: 450, w: 80, h: 60, pins: 8}
  ];
  
  const ics = baseIcs.map(baseIc => {
    const sc = scaleCoord(baseIc.x, baseIc.y);
    return {
      x: sc.x,
      y: sc.y,
      w: baseIc.w * scale,
      h: baseIc.h * scale,
      pins: baseIc.pins
    };
  });
  
  ics.forEach(ic => {
    // Add smaller IC to chip rectangles for clipping
    chipRects.push({
      left: ic.x - ic.w/2,
      right: ic.x + ic.w/2,
      top: ic.y - ic.h/2,
      bottom: ic.y + ic.h/2
    });
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(ic.x - ic.w/2, ic.y - ic.h/2, ic.w, ic.h);
    g.lineStyle(2, 0x3a3a3a, 1);
    g.strokeRect(ic.x - ic.w/2, ic.y - ic.h/2, ic.w, ic.h);
    // Pin 1 marker
    g.fillStyle(copper, 0.9);
    g.fillCircle(ic.x - ic.w/2 + 6, ic.y - ic.h/2 + 6, 2);
    // Pins
    g.fillStyle(0x8a8a8a, 1);
    const pSpacing = ic.h / (ic.pins / 2 + 1);
    for (let i = 0; i < ic.pins / 2; i++) {
      const py = ic.y - ic.h/2 + pSpacing * (i + 1);
      g.fillRect(ic.x - ic.w/2 - 8, py - 1, 8, 2);
      g.fillRect(ic.x + ic.w/2, py - 1, 8, 2);
    }
  });
  
  // Resistors (realistic axial resistors) - scaled
  const baseResistors = [
    {x: 120, y: 250, angle: 0},
    {x: 680, y: 250, angle: 0},
    {x: 300, y: 120, angle: Math.PI/2},
    {x: 500, y: 120, angle: Math.PI/2},
    {x: 300, y: 480, angle: Math.PI/2},
    {x: 500, y: 480, angle: Math.PI/2}
  ];
  
  baseResistors.forEach(baseR => {
    const sc = scaleCoord(baseR.x, baseR.y);
    const r = {x: sc.x, y: sc.y, angle: baseR.angle};
    // Skip if resistor overlaps with any chip
    if (pointOverlapsChip(r.x, r.y, 15 * scale)) return;
    
    const len = 30 * scale;
    const bodyLen = 20 * scale;
    const bodyRad = 4 * scale;
    const cos = Math.cos(r.angle);
    const sin = Math.sin(r.angle);
    
    // Leads
    g.lineStyle(2 * scale, copper, 0.9);
    g.lineBetween(r.x - cos * len/2, r.y - sin * len/2, r.x - cos * bodyLen/2, r.y - sin * bodyLen/2);
    g.lineBetween(r.x + cos * bodyLen/2, r.y + sin * bodyLen/2, r.x + cos * len/2, r.y + sin * len/2);
    
    // Body (beige/tan)
    g.fillStyle(0xd4c4a8, 1);
    g.fillEllipse(r.x, r.y, bodyLen, bodyRad * 2);
    // Color bands
    g.fillStyle(0x800080, 1);
    g.fillRect(r.x - bodyLen/2 + 4 * scale, r.y - bodyRad, 2 * scale, bodyRad * 2);
    g.fillStyle(0xff6600, 1);
    g.fillRect(r.x - bodyLen/2 + 8 * scale, r.y - bodyRad, 2 * scale, bodyRad * 2);
  });
  
  // Capacitors (realistic radial capacitors) - scaled
  const baseCapacitors = [
    {x: 100, y: 350},
    {x: 700, y: 350},
    {x: 250, y: 200},
    {x: 550, y: 200},
    {x: 250, y: 400},
    {x: 550, y: 400}
  ];
  
  baseCapacitors.forEach(baseC => {
    const sc = scaleCoord(baseC.x, baseC.y);
    const c = {x: sc.x, y: sc.y};
    const rad = 6 * scale;
    const height = 16 * scale;
    // Body (cylinder)
    g.fillStyle(0x7dd3c0, 1);
    g.fillEllipse(c.x, c.y - height/2, rad * 2, height * 0.4);
    g.fillRect(c.x - rad, c.y - height/2, rad * 2, height);
    g.fillEllipse(c.x, c.y + height/2, rad * 2, height * 0.4);
    // Leads
    g.lineStyle(2 * scale, copper, 0.9);
    g.lineBetween(c.x - 4 * scale, c.y + height/2, c.x - 4 * scale, c.y + height/2 + 12 * scale);
    g.lineBetween(c.x + 4 * scale, c.y + height/2, c.x + 4 * scale, c.y + height/2 + 12 * scale);
  });
  
  // Realistic trace routing (90-degree bends, like real PCBs)
  // Power traces (thicker) - use clipping to avoid chips - scaled
  g.lineStyle(5 * scale, copper, 0.7);
  const basePowerTraces = [
    {x1: 50, y1: 100, x2: 750, y2: 100},
    {x1: 50, y1: 500, x2: 750, y2: 500},
    {x1: 100, y1: 50, x2: 100, y2: 550},
    {x1: 700, y1: 50, x2: 700, y2: 550}
  ];
  const powerTraces = basePowerTraces.map(baseTrace => {
    const sc1 = scaleCoord(baseTrace.x1, baseTrace.y1);
    const sc2 = scaleCoord(baseTrace.x2, baseTrace.y2);
    return {x1: snap(sc1.x), y1: snap(sc1.y), x2: snap(sc2.x), y2: snap(sc2.y)};
  });
  powerTraces.forEach(trace => {
    let segments = [{x1: trace.x1, y1: trace.y1, x2: trace.x2, y2: trace.y2}];
    for (const rect of chipRects) {
      const newSegments = [];
      for (const seg of segments) {
        newSegments.push(...clipLineAgainstRect(seg.x1, seg.y1, seg.x2, seg.y2, rect));
      }
      segments = newSegments;
    }
    segments.forEach(seg => {
      g.lineBetween(seg.x1, seg.y1, seg.x2, seg.y2);
    });
  });
  
  // Signal traces from main IC
  const pulse = Math.sin(t * 2) * 0.15 + 0.85;
  
  // Top traces
  drawTracedPath([
    {x: cx - icW/2 + 20, y: cy - icH/2},
    {x: cx - icW/2 + 20, y: snap(cy - icH/2 - 40)},
    {x: snap(200), y: snap(cy - icH/2 - 40)},
    {x: snap(200), y: snap(120)}
  ], 3);
  
  drawTracedPath([
    {x: cx, y: cy - icH/2},
    {x: cx, y: snap(cy - icH/2 - 60)},
    {x: snap(400), y: snap(cy - icH/2 - 60)},
    {x: snap(400), y: snap(100)}
  ], 3);
  
  drawTracedPath([
    {x: cx + icW/2 - 20, y: cy - icH/2},
    {x: cx + icW/2 - 20, y: snap(cy - icH/2 - 40)},
    {x: snap(600), y: snap(cy - icH/2 - 40)},
    {x: snap(600), y: snap(120)}
  ], 3);
  
  // Bottom traces
  drawTracedPath([
    {x: cx - icW/2 + 20, y: cy + icH/2},
    {x: cx - icW/2 + 20, y: snap(cy + icH/2 + 40)},
    {x: snap(200), y: snap(cy + icH/2 + 40)},
    {x: snap(200), y: snap(480)}
  ], 3);
  
  drawTracedPath([
    {x: cx, y: cy + icH/2},
    {x: cx, y: snap(cy + icH/2 + 60)},
    {x: snap(400), y: snap(cy + icH/2 + 60)},
    {x: snap(400), y: snap(500)}
  ], 3);
  
  drawTracedPath([
    {x: cx + icW/2 - 20, y: cy + icH/2},
    {x: cx + icW/2 - 20, y: snap(cy + icH/2 + 40)},
    {x: snap(600), y: snap(cy + icH/2 + 40)},
    {x: snap(600), y: snap(480)}
  ], 3);
  
  // Side traces
  drawTracedPath([
    {x: cx - icW/2, y: cy - icH/2 + 20},
    {x: snap(cx - icW/2 - 40), y: cy - icH/2 + 20},
    {x: snap(cx - icW/2 - 40), y: snap(150)},
    {x: snap(100), y: snap(150)}
  ], 3);
  
  drawTracedPath([
    {x: cx - icW/2, y: cy},
    {x: snap(cx - icW/2 - 60), y: cy},
    {x: snap(cx - icW/2 - 60), y: snap(300)},
    {x: snap(100), y: snap(300)}
  ], 3);
  
  drawTracedPath([
    {x: cx - icW/2, y: cy + icH/2 - 20},
    {x: snap(cx - icW/2 - 40), y: cy + icH/2 - 20},
    {x: snap(cx - icW/2 - 40), y: snap(450)},
    {x: snap(100), y: snap(450)}
  ], 3);
  
  drawTracedPath([
    {x: cx + icW/2, y: cy - icH/2 + 20},
    {x: snap(cx + icW/2 + 40), y: cy - icH/2 + 20},
    {x: snap(cx + icW/2 + 40), y: snap(150)},
    {x: snap(700), y: snap(150)}
  ], 3);
  
  drawTracedPath([
    {x: cx + icW/2, y: cy},
    {x: snap(cx + icW/2 + 60), y: cy},
    {x: snap(cx + icW/2 + 60), y: snap(300)},
    {x: snap(700), y: snap(300)}
  ], 3);
  
  drawTracedPath([
    {x: cx + icW/2, y: cy + icH/2 - 20},
    {x: snap(cx + icW/2 + 40), y: cy + icH/2 - 20},
    {x: snap(cx + icW/2 + 40), y: snap(450)},
    {x: snap(700), y: snap(450)}
  ], 3);
  
  // Connect smaller ICs to main traces
  ics.forEach((ic, i) => {
    const connectPoints = [
      [{x: ic.x + ic.w/2, y: ic.y}, {x: snap(ic.x + ic.w/2 + 20), y: ic.y}, {x: snap(ic.x + ic.w/2 + 20), y: snap(300)}, {x: snap(700), y: snap(300)}],
      [{x: ic.x - ic.w/2, y: ic.y}, {x: snap(ic.x - ic.w/2 - 20), y: ic.y}, {x: snap(ic.x - ic.w/2 - 20), y: snap(300)}, {x: snap(100), y: snap(300)}],
      [{x: ic.x, y: ic.y - ic.h/2}, {x: ic.x, y: snap(ic.y - ic.h/2 - 20)}, {x: snap(400), y: snap(ic.y - ic.h/2 - 20)}, {x: snap(400), y: snap(100)}],
      [{x: ic.x, y: ic.y + ic.h/2}, {x: ic.x, y: snap(ic.y + ic.h/2 + 20)}, {x: snap(400), y: snap(ic.y + ic.h/2 + 20)}, {x: snap(400), y: snap(500)}]
    ];
    drawTracedPath(connectPoints[i % connectPoints.length], 2);
  });
  
  // Via holes (through-hole connections with pulsing)
  const vias = [
    {x: snap(200), y: snap(120)},
    {x: snap(400), y: snap(100)},
    {x: snap(600), y: snap(120)},
    {x: snap(200), y: snap(480)},
    {x: snap(400), y: snap(500)},
    {x: snap(600), y: snap(480)},
    {x: snap(100), y: snap(150)},
    {x: snap(100), y: snap(300)},
    {x: snap(100), y: snap(450)},
    {x: snap(700), y: snap(150)},
    {x: snap(700), y: snap(300)},
    {x: snap(700), y: snap(450)}
  ];
  
  vias.forEach((via, i) => {
    // Skip if via overlaps with any chip
    if (pointOverlapsChip(via.x, via.y, 6)) return;
    
    const pulse = Math.sin(t * 4 + i * 0.5) * 0.2 + 0.8;
    // Via ring (copper)
    g.lineStyle(2, copper, pulse);
    g.strokeCircle(via.x, via.y, 4);
    // Via hole (center)
    g.fillStyle(0x0d2a1a, 1);
    g.fillCircle(via.x, via.y, 2);
    // Glow
    g.fillStyle(copper, pulse * 0.3);
    g.fillCircle(via.x, via.y, 6);
  });
  
  // Solder pads at component connections
  const pads = [
    {x: cx - icW/2 + 20, y: cy - icH/2},
    {x: cx, y: cy - icH/2},
    {x: cx + icW/2 - 20, y: cy - icH/2},
    {x: cx - icW/2 + 20, y: cy + icH/2},
    {x: cx, y: cy + icH/2},
    {x: cx + icW/2 - 20, y: cy + icH/2}
  ];
  
  pads.forEach(pad => {
    // Skip if pad overlaps with any chip (excluding the chip it's connected to)
    if (pointOverlapsChip(pad.x, pad.y, 3)) return;
    
    g.fillStyle(copper, 0.9);
    g.fillCircle(pad.x, pad.y, 3);
    g.fillStyle(0x0d2a1a, 1);
    g.fillCircle(pad.x, pad.y, 1);
  });
  
  // Data flow animation (pulses along traces)
  const packetSpeed = offset * 0.2;
  const tracePaths = [
    [{x: cx - icW/2 + 20, y: cy - icH/2}, {x: cx - icW/2 + 20, y: snap(cy - icH/2 - 40)}, {x: snap(200), y: snap(cy - icH/2 - 40)}, {x: snap(200), y: snap(120)}],
    [{x: cx, y: cy + icH/2}, {x: cx, y: snap(cy + icH/2 + 60)}, {x: snap(400), y: snap(cy + icH/2 + 60)}, {x: snap(400), y: snap(500)}],
    [{x: cx - icW/2, y: cy}, {x: snap(cx - icW/2 - 60), y: cy}, {x: snap(cx - icW/2 - 60), y: snap(300)}, {x: snap(100), y: snap(300)}],
    [{x: cx + icW/2, y: cy}, {x: snap(cx + icW/2 + 60), y: cy}, {x: snap(cx + icW/2 + 60), y: snap(300)}, {x: snap(700), y: snap(300)}]
  ];
  
  tracePaths.forEach((path, i) => {
    const offset = (packetSpeed + i * 100) % 500;
    let totalDist = 0;
    let currentSeg = 0;
    let segDist = 0;
    
    for (let j = 0; j < path.length - 1; j++) {
      const dx = path[j + 1].x - path[j].x;
      const dy = path[j + 1].y - path[j].y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      
      if (offset <= totalDist + segLen) {
        currentSeg = j;
        segDist = offset - totalDist;
        break;
      }
      totalDist += segLen;
    }
    
    if (currentSeg < path.length - 1) {
      const dx = path[currentSeg + 1].x - path[currentSeg].x;
      const dy = path[currentSeg + 1].y - path[currentSeg].y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      const ratio = segLen > 0 ? segDist / segLen : 0;
      
      const px = path[currentSeg].x + dx * ratio;
      const py = path[currentSeg].y + dy * ratio;
      
      // Draw data pulse
      g.fillStyle(copper, 1);
      g.fillCircle(px, py, 3);
      g.fillStyle(copper, 0.4);
      g.fillCircle(px, py, 7);
    }
  });
  
  // ===== ADDITIONAL CIRCUIT ELEMENTS TO FILL SCREEN =====
  
  // Additional smaller ICs near edges - define before drawing traces so they can be clipped
  const edgeICs = [
    {x: 60, y: 80, w: 50, h: 40, pins: 6},
    {x: 740, y: 80, w: 50, h: 40, pins: 6},
    {x: 60, y: 520, w: 50, h: 40, pins: 6},
    {x: 740, y: 520, w: 50, h: 40, pins: 6},
    {x: 60, y: 300, w: 50, h: 40, pins: 6},
    {x: 740, y: 300, w: 50, h: 40, pins: 6},
    {x: 400, y: 40, w: 50, h: 40, pins: 6},
    {x: 400, y: 560, w: 50, h: 40, pins: 6}
  ];
  
  // Add edge ICs to chip rectangles for clipping (before drawing traces)
  edgeICs.forEach(ic => {
    chipRects.push({
      left: ic.x - ic.w/2,
      right: ic.x + ic.w/2,
      top: ic.y - ic.h/2,
      bottom: ic.y + ic.h/2
    });
  });
  
  // Edge traces (along borders) - use clipping to avoid chips
  g.lineStyle(4, copper, 0.6);
  const edgeTraces = [
    {x1: 0, y1: snap(20), x2: 800, y2: snap(20)},
    {x1: 0, y1: snap(40), x2: 800, y2: snap(40)},
    {x1: 0, y1: snap(560), x2: 800, y2: snap(560)},
    {x1: 0, y1: snap(580), x2: 800, y2: snap(580)},
    {x1: snap(20), y1: 0, x2: snap(20), y2: 600},
    {x1: snap(40), y1: 0, x2: snap(40), y2: 600},
    {x1: snap(760), y1: 0, x2: snap(760), y2: 600},
    {x1: snap(780), y1: 0, x2: snap(780), y2: 600}
  ];
  edgeTraces.forEach(trace => {
    let segments = [{x1: trace.x1, y1: trace.y1, x2: trace.x2, y2: trace.y2}];
    for (const rect of chipRects) {
      const newSegments = [];
      for (const seg of segments) {
        newSegments.push(...clipLineAgainstRect(seg.x1, seg.y1, seg.x2, seg.y2, rect));
      }
      segments = newSegments;
    }
    segments.forEach(seg => {
      g.lineBetween(seg.x1, seg.y1, seg.x2, seg.y2);
    });
  });
  
  edgeICs.forEach(ic => {
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(ic.x - ic.w/2, ic.y - ic.h/2, ic.w, ic.h);
    g.lineStyle(2, 0x3a3a3a, 1);
    g.strokeRect(ic.x - ic.w/2, ic.y - ic.h/2, ic.w, ic.h);
    g.fillStyle(copper, 0.9);
    g.fillCircle(ic.x - ic.w/2 + 4, ic.y - ic.h/2 + 4, 2);
    g.fillStyle(0x8a8a8a, 1);
    const pSpacing = ic.h / (ic.pins / 2 + 1);
    for (let i = 0; i < ic.pins / 2; i++) {
      const py = ic.y - ic.h/2 + pSpacing * (i + 1);
      g.fillRect(ic.x - ic.w/2 - 6, py - 1, 6, 2);
      g.fillRect(ic.x + ic.w/2, py - 1, 6, 2);
    }
  });
  
  // Additional resistors near edges
  const edgeResistors = [
    {x: 40, y: 180, angle: Math.PI/2},
    {x: 40, y: 420, angle: Math.PI/2},
    {x: 760, y: 180, angle: Math.PI/2},
    {x: 760, y: 420, angle: Math.PI/2},
    {x: 200, y: 30, angle: 0},
    {x: 400, y: 30, angle: 0},
    {x: 600, y: 30, angle: 0},
    {x: 200, y: 570, angle: 0},
    {x: 400, y: 570, angle: 0},
    {x: 600, y: 570, angle: 0}
  ];
  
  edgeResistors.forEach(r => {
    // Skip if resistor overlaps with any chip
    if (pointOverlapsChip(r.x, r.y, 12)) return;
    
    const len = 25;
    const bodyLen = 18;
    const bodyRad = 3;
    const cos = Math.cos(r.angle);
    const sin = Math.sin(r.angle);
    g.lineStyle(2, copper, 0.9);
    g.lineBetween(r.x - cos * len/2, r.y - sin * len/2, r.x - cos * bodyLen/2, r.y - sin * bodyLen/2);
    g.lineBetween(r.x + cos * bodyLen/2, r.y + sin * bodyLen/2, r.x + cos * len/2, r.y + sin * len/2);
    g.fillStyle(0xd4c4a8, 1);
    g.fillEllipse(r.x, r.y, bodyLen, bodyRad * 2);
    g.fillStyle(0x800080, 1);
    g.fillRect(r.x - bodyLen/2 + 3, r.y - bodyRad, 2, bodyRad * 2);
    g.fillStyle(0xff6600, 1);
    g.fillRect(r.x - bodyLen/2 + 7, r.y - bodyRad, 2, bodyRad * 2);
  });
  
  // Additional capacitors near edges
  const edgeCapacitors = [
    {x: 30, y: 250}, {x: 30, y: 350},
    {x: 770, y: 250}, {x: 770, y: 350},
    {x: 150, y: 30}, {x: 350, y: 30}, {x: 450, y: 30}, {x: 650, y: 30},
    {x: 150, y: 570}, {x: 350, y: 570}, {x: 450, y: 570}, {x: 650, y: 570}
  ];
  
  edgeCapacitors.forEach(c => {
    const rad = 5;
    const height = 14;
    g.fillStyle(0x7dd3c0, 1);
    g.fillEllipse(c.x, c.y - height/2, rad * 2, height * 0.4);
    g.fillRect(c.x - rad, c.y - height/2, rad * 2, height);
    g.fillEllipse(c.x, c.y + height/2, rad * 2, height * 0.4);
    g.lineStyle(2, copper, 0.9);
    g.lineBetween(c.x - 3, c.y + height/2, c.x - 3, c.y + height/2 + 10);
    g.lineBetween(c.x + 3, c.y + height/2, c.x + 3, c.y + height/2 + 10);
  });
  
  // Additional traces connecting to edges
  // Top area traces
  for (let i = 0; i < 8; i++) {
    const x = 100 + i * 90;
    if (x < 750) {
      drawTracedPath([
        {x: x, y: snap(60)},
        {x: x, y: snap(20)},
        {x: snap(x), y: snap(20)}
      ], 2);
    }
  }
  
  // Bottom area traces
  for (let i = 0; i < 8; i++) {
    const x = 100 + i * 90;
    if (x < 750) {
      drawTracedPath([
        {x: x, y: snap(540)},
        {x: x, y: snap(580)},
        {x: snap(x), y: snap(580)}
      ], 2);
    }
  }
  
  // Left area traces
  for (let i = 0; i < 6; i++) {
    const y = 100 + i * 80;
    if (y < 550) {
      drawTracedPath([
        {x: snap(60), y: y},
        {x: snap(20), y: y},
        {x: snap(20), y: snap(y)}
      ], 2);
    }
  }
  
  // Right area traces
  for (let i = 0; i < 6; i++) {
    const y = 100 + i * 80;
    if (y < 550) {
      drawTracedPath([
        {x: snap(740), y: y},
        {x: snap(780), y: y},
        {x: snap(780), y: snap(y)}
      ], 2);
    }
  }
  
  // Cross-connecting traces (horizontal)
  for (let y = 0; y < 600; y += 120) {
    if (y > 50 && y < 550) {
      drawTracedPath([
        {x: snap(50), y: snap(y)},
        {x: snap(750), y: snap(y)}
      ], 2);
    }
  }
  
  // Cross-connecting traces (vertical)
  for (let x = 0; x < 800; x += 120) {
    if (x > 50 && x < 750) {
      drawTracedPath([
        {x: snap(x), y: snap(50)},
        {x: snap(x), y: snap(550)}
      ], 2);
    }
  }
  
  // Additional vias distributed across screen
  const additionalVias = [];
  for (let x = 50; x < 800; x += 80) {
    for (let y = 50; y < 600; y += 80) {
      if (Math.abs(x - 400) > 100 || Math.abs(y - 300) > 100) {
        additionalVias.push({x: snap(x), y: snap(y)});
      }
    }
  }
  
  additionalVias.forEach((via, i) => {
    // Skip if via overlaps with any chip
    if (pointOverlapsChip(via.x, via.y, 5)) return;
    
    const pulse = Math.sin(t * 3 + i * 0.3) * 0.15 + 0.75;
    g.lineStyle(1.5, copper, pulse);
    g.strokeCircle(via.x, via.y, 3);
    g.fillStyle(0x0d2a1a, 1);
    g.fillCircle(via.x, via.y, 1.5);
    g.fillStyle(copper, pulse * 0.25);
    g.fillCircle(via.x, via.y, 5);
  });
  
  // Additional solder pads distributed
  const additionalPads = [];
  for (let x = 80; x < 800; x += 100) {
    for (let y = 80; y < 600; y += 100) {
      if (Math.abs(x - 400) > 120 || Math.abs(y - 300) > 120) {
        additionalPads.push({x: snap(x), y: snap(y)});
      }
    }
  }
  
  additionalPads.forEach(pad => {
    // Skip if pad overlaps with any chip
    if (pointOverlapsChip(pad.x, pad.y, 2.5)) return;
    
    g.fillStyle(copper, 0.7);
    g.fillCircle(pad.x, pad.y, 2.5);
    g.fillStyle(0x0d2a1a, 1);
    g.fillCircle(pad.x, pad.y, 0.8);
  });
  
  // Corner connection points
  const corners = [
    {x: 0, y: 0}, {x: 800, y: 0},
    {x: 0, y: 600}, {x: 800, y: 600}
  ];
  
  corners.forEach(corner => {
    g.fillStyle(copper, 0.8);
    g.fillCircle(corner.x, corner.y, 6);
    g.lineStyle(2, copper, 0.6);
    g.strokeCircle(corner.x, corner.y, 8);
  });
  
}

function drawTitleScreen() {
  graphics.clear();
  drawCyberpunkCircuitTitle(graphics, bgScrollOffset);
  
  // Draw semi-translucent PCB green rectangle behind instructions
  if (titleOverlay) {
    titleOverlay.clear();
    titleOverlay.fillStyle(0x2a4a2a, 0.6); // PCB green with 60% opacity
    titleOverlay.fillRect(50, 80, 700, 460); // Rectangle behind instructions area
  }
}

function drawGame() {
  graphics.clear();
  
  // Draw circuit board background scrolling left (zoomed out)
  drawCyberpunkCircuitTitle(graphics, bgScrollOffset, 0.85);
  
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
  
  // Draw obstacles
  obstacles.forEach(obs => {
    if (obs.isGapObstacle) {
      // Draw gap obstacles (resistor or capacitor)
      if (obs.componentType === 'resistor') {
        drawResistor(graphics, obs.x, obs.y, 1.7);
      } else if (obs.componentType === 'capacitor') {
        drawCapacitor(graphics, obs.x, obs.y, 1.0);
      }
    } else {
      // Draw explosion obstacles (pixel art explosions)
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
    }
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
  if (titleOverlay) titleOverlay.clear();
  scoreText.setVisible(true);
  speedText.setVisible(true);
  
  // Stop title music and start gameplay music
  // stopMenuMusic();  // Menu music commented out for now
  startSequencer();
  
  // Start countdown
  countdownTimer = 1.2;
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
  stopSequencer();  // Stop all music when game ends
  
  // Check if score qualifies for top 5
  const isHighScore = (highScores.length < 5 || score > highScores[4].score) && score > 0;
  
  if (isHighScore) {
    playHighScoreSound(scene);
    showNameEntry(scene);
  } else {
    playGameOverSound(scene);
    showGameOver(scene);
  }
}

function showGameOver(scene) {
  showingGameOver = true;
  
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 0.85);
  overlay.fillRect(0, 0, 800, 600);
  
  const gameOverTxt = scene.add.text(400, 200, 'GAME OVER', {
    fontSize: '78px',
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
  
  scene.add.text(400, 340, 'TRANSFERED DATA: ' + score + ' B', {
    fontSize: '32px',
    fontFamily: 'monospace',
    color: '#00ffff',
    stroke: '#000',
    strokeThickness: 4
  }).setOrigin(0.5);
  
  const continuePrompt = scene.add.text(400, 470, '<Press ENTER to continue>', {
    fontSize: '24px',
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
  
  scene.add.text(400, 230, 'TRANSFERED DATA: ' + score + ' B', {
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
  
  // Cursor indicator - calculate position based on actual text bounds
  const cursorY = 420;
  // Measure character width using a temporary text object
  const tempChar = scene.add.text(0, 0, 'A', {
    fontSize: '72px',
    fontFamily: 'monospace'
  });
  const charWidth = tempChar.width;
  tempChar.destroy();
  
  // Calculate cursor position: text center (400) - half total width + (index + 0.5) * charWidth
  const totalWidth = charWidth * 3;
  const leftEdge = 400 - totalWidth / 2;
  const cursorX = leftEdge + (nameIndex + 0.5) * charWidth;
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
  if (nameCursor && nameInputText) {
    // Measure character width using a temporary text object
    const tempChar = sceneRef.add.text(0, 0, 'A', {
      fontSize: '72px',
      fontFamily: 'monospace'
    });
    const charWidth = tempChar.width;
    tempChar.destroy();
    
    // Calculate cursor position: text center (400) - half total width + (index + 0.5) * charWidth
    const totalWidth = charWidth * 3;
    const leftEdge = 400 - totalWidth / 2;
    const cursorX = leftEdge + (nameIndex + 0.5) * charWidth;
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
  showingScoreboard = true;
  stopSequencer();
  // startMenuMusic();  // Menu music commented out for now
  // Best effort: ensure audio context is running
  const _ctx = scene.sound.context;
  if (_ctx && _ctx.state !== 'running' && _ctx.resume) {
    _ctx.resume();
  }
  // Draw static circuit board background
  const bgGraphics = scene.add.graphics();
  drawStaticCircuitBoard(bgGraphics);
  
  // Draw chip component at top center
  const chipGraphics = scene.add.graphics();
  const chipX = 400;
  const chipY = 300;
  const chipWidth = 700;
  const chipHeight = 520;
  const chipScale = 1;
  
  // Draw circuit cables connecting from chip pins
  drawCircuitCables(bgGraphics, chipX, chipY, chipWidth, chipHeight, chipScale);
  
  // Draw chip on top
  drawChip(chipGraphics, chipX, chipY, chipWidth, chipHeight, chipScale);
  
  // High Scores
  scene.add.text(400, 120, '═══ HIGH SCORES ═══', {
    fontSize: '54px',
    fontFamily: 'monospace',
    color: '#00ffff',
    stroke: '#ff6600',
    strokeThickness: 6
  }).setOrigin(0.5).setDepth(1000);
  
  if (highScores.length === 0) {
    scene.add.text(400, 300, 'No scores yet!\nBe the first!', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffaa00',
      align: 'center',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(1000);
  } else {
    let newEntryTexts = null;
    
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
      }).setDepth(1000);
      
      const nameText = scene.add.text(320, y, entry.name, {
        fontSize: '28px',
        fontFamily: 'monospace',
        color: nameColor,
        stroke: '#000',
        strokeThickness: 3
      }).setDepth(1000);
      
      const scoreText = scene.add.text(600, y, entry.score.toString() + ' B', {
        fontSize: '28px',
        fontFamily: 'monospace',
        color: scoreColor,
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(1, 0).setDepth(1000);
      
      if (isNew) {
        newEntryTexts = [rankText, nameText, scoreText];
      }
    });

    if (newEntryTexts) {
      scene.tweens.add({
        targets: newEntryTexts,
        scale: { from: 1, to: 1.1 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }
    
  }
  
  const restartTxt = scene.add.text(400, 515, '<Press ENTER to return to menu>', {
    fontSize: '24px',
    fontFamily: 'monospace',
    color: '#00ff00',
    stroke: '#000',
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(1000);
  
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
  showingScoreboard = false;
  enteringName = false;
  showingGameOver = false;
  nameInputText = null;
  nameCursor = null;
  score = 0;
  speed = 4.0;
  baseSpeed = 4.0;
  gameTime = 0;
  lastScoreTime = 0;
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
  stopSequencer();
  // stopMenuMusic();  // Menu music commented out for now
}

// =============================================================================
// ADVANCED AUDIO SYNTHESIS ENGINE
// =============================================================================
function createReverbIR(duration, decay) {
  const length = duration * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(2, length, audioCtx.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const envelope = Math.exp((-decay * i) / audioCtx.sampleRate);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
  }
  return buffer;
}

function makeDistortionCurve(amount) {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function dissonantSynth(freq, time, duration, detuneOffset, pan) {
  const baseDetunes = [0, -3, 3, -6, 6, -9, 9, -12, 12];
  const detunes = baseDetunes.map((d) => d + detuneOffset);
  const oscs = [];

  const distortion = audioCtx.createWaveShaper();
  distortion.curve = makeDistortionCurve(100);
  distortion.oversample = "4x";

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  filter.Q.value = 4;

  const panner = audioCtx.createStereoPanner();
  panner.pan.value = pan;

  const g = audioCtx.createGain();
  g.gain.value = 0.3;

  for (let i = 0; i < detunes.length; i++) {
    const osc = audioCtx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = detunes[i];

    const oscGain = audioCtx.createGain();
    oscGain.gain.value = 1 / detunes.length;

    osc.connect(oscGain);
    oscGain.connect(distortion);
    oscs.push(osc);
  }

  distortion.connect(filter);
  filter.connect(g);
  g.connect(panner);
  panner.connect(dryGain);

  oscs.forEach((osc) => {
    osc.start(time);
    osc.stop(time + duration);
  });
  
  return oscs; // Return oscillators so they can be stopped
}

function kickDrum(time) {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);

  g.gain.setValueAtTime(1, time);
  g.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

  osc.connect(g);
  g.connect(drumGain);

  osc.start(time);
  osc.stop(time + 0.3);
}

function snareDrum(time) {
  const noise = audioCtx.createBufferSource();
  const buffer = audioCtx.createBuffer(
    1,
    audioCtx.sampleRate * 0.2,
    audioCtx.sampleRate
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2000;
  filter.Q.value = 1;

  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.6, time);
  g.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

  noise.connect(filter);
  filter.connect(g);
  g.connect(drumGain);

  noise.start(time);
  noise.stop(time + 0.15);
}

function hiHat(time) {
  const noise = audioCtx.createBufferSource();
  const buffer = audioCtx.createBuffer(
    1,
    audioCtx.sampleRate * 0.1,
    audioCtx.sampleRate
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 8000;

  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.2, time);
  g.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

  noise.connect(filter);
  filter.connect(g);
  g.connect(drumGain);

  noise.start(time);
  noise.stop(time + 0.05);
}

function fatBass(freq, time, duration) {
  const oscs = [];

  for (let i = 0; i < 3; i++) {
    const osc = audioCtx.createOscillator();
    osc.type = i === 0 ? "sine" : "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = i * 2;
    oscs.push(osc);
  }

  const preGain = audioCtx.createGain();
  preGain.gain.value = 3;

  const distortion = audioCtx.createWaveShaper();
  distortion.curve = makeDistortionCurve(150);
  distortion.oversample = "4x";

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 80;
  filter.Q.value = 15;

  const g = audioCtx.createGain();
  g.gain.value = 1.2;

  oscs.forEach((osc) => {
    osc.connect(preGain);
  });

  preGain.connect(distortion);
  distortion.connect(filter);
  filter.connect(g);
  g.connect(drumGain);

  oscs.forEach((osc) => {
    osc.start(time);
    osc.stop(time + duration);
  });
}

function kalimba(freq, time) {
  const detune = (Math.random() - 0.5) * 4;
  const ratio = 2.9 + Math.random() * 0.3;

  const carrier = audioCtx.createOscillator();
  carrier.type = "sine";
  carrier.frequency.value = freq;
  carrier.detune.value = detune;

  const modulator = audioCtx.createOscillator();
  modulator.type = "sine";
  modulator.frequency.value = freq * ratio;

  const modIndex = audioCtx.createGain();
  modIndex.gain.setValueAtTime(freq * 2.8, time);
  modIndex.gain.exponentialRampToValueAtTime(freq * 0.3, time + 0.4);
  modIndex.gain.exponentialRampToValueAtTime(0.01, time + 1.2);

  modulator.connect(modIndex);
  modIndex.connect(carrier.frequency);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(7000, time);
  filter.frequency.exponentialRampToValueAtTime(3000, time + 1);
  filter.Q.value = 1;

  const noise = audioCtx.createBufferSource();
  const noiseBuf = audioCtx.createBuffer(
    1,
    audioCtx.sampleRate * 0.005,
    audioCtx.sampleRate
  );
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.1;
  }
  noise.buffer = noiseBuf;

  const amp = audioCtx.createGain();
  amp.gain.setValueAtTime(0, time);
  amp.gain.linearRampToValueAtTime(0.4, time + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.2, time + 0.05);
  amp.gain.exponentialRampToValueAtTime(0.01, time + 1.2);

  carrier.connect(filter);
  filter.connect(amp);
  noise.connect(amp);
  amp.connect(drumGain);

  carrier.start(time);
  modulator.start(time);
  noise.start(time);
  carrier.stop(time + 1.5);
  modulator.stop(time + 1.5);
}

function choir(freq, time, duration = 0.6) {
  const numVoices = 4;
  const detuneAmounts = [-8, -4, 4, 8];
  const panPositions = [-0.4, -0.2, 0.2, 0.4];

  for (let v = 0; v < numVoices; v++) {
    const voiceDetune = detuneAmounts[v];
    const pan = panPositions[v];

    const oscs = [];
    const oscMixer = audioCtx.createGain();
    oscMixer.gain.value = 0.2;

    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = voiceDetune + (Math.random() - 0.5) * 3;

      const vibratoLFO = audioCtx.createOscillator();
      vibratoLFO.frequency.value = 5.5 + Math.random() * 0.5;
      const vibratoGain = audioCtx.createGain();
      vibratoGain.gain.value = 12;
      vibratoLFO.connect(vibratoGain);
      vibratoGain.connect(osc.detune);

      const driftLFO = audioCtx.createOscillator();
      driftLFO.frequency.value = 0.1 + Math.random() * 0.1;
      const driftGain = audioCtx.createGain();
      driftGain.gain.value = 3;
      driftLFO.connect(driftGain);
      driftGain.connect(osc.detune);

      osc.connect(oscMixer);
      oscs.push(osc);

      vibratoLFO.start(time);
      vibratoLFO.stop(time + duration);
      driftLFO.start(time);
      driftLFO.stop(time + duration);
    }

    const formant1 = audioCtx.createBiquadFilter();
    formant1.type = "bandpass";
    formant1.Q.value = 4;

    const formant2 = audioCtx.createBiquadFilter();
    formant2.type = "bandpass";
    formant2.Q.value = 3;

    const formant3 = audioCtx.createBiquadFilter();
    formant3.type = "bandpass";
    formant3.Q.value = 5;

    const vowelMorph = duration / 3;
    formant1.frequency.setValueAtTime(700, time);
    formant1.frequency.linearRampToValueAtTime(400, time + vowelMorph);
    formant1.frequency.linearRampToValueAtTime(500, time + vowelMorph * 2);
    formant1.frequency.setValueAtTime(500, time + duration);

    formant2.frequency.setValueAtTime(1200, time);
    formant2.frequency.linearRampToValueAtTime(800, time + vowelMorph);
    formant2.frequency.linearRampToValueAtTime(1700, time + vowelMorph * 2);
    formant2.frequency.setValueAtTime(1700, time + duration);

    formant3.frequency.setValueAtTime(2500, time);
    formant3.frequency.linearRampToValueAtTime(2600, time + vowelMorph);
    formant3.frequency.linearRampToValueAtTime(2500, time + vowelMorph * 2);
    formant3.frequency.setValueAtTime(2500, time + duration);

    const formantMix1 = audioCtx.createGain();
    formantMix1.gain.value = 1.5;
    const formantMix2 = audioCtx.createGain();
    formantMix2.gain.value = 1.2;
    const formantMix3 = audioCtx.createGain();
    formantMix3.gain.value = 0.8;

    const formantMixer = audioCtx.createGain();
    formantMixer.gain.value = 1;

    oscMixer.connect(formant1);
    oscMixer.connect(formant2);
    oscMixer.connect(formant3);
    formant1.connect(formantMix1);
    formant2.connect(formantMix2);
    formant3.connect(formantMix3);
    formantMix1.connect(formantMixer);
    formantMix2.connect(formantMixer);
    formantMix3.connect(formantMixer);

    const breathNoise = audioCtx.createBufferSource();
    const noiseBuf = audioCtx.createBuffer(
      1,
      audioCtx.sampleRate * duration,
      audioCtx.sampleRate
    );
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.01;
    }
    breathNoise.buffer = noiseBuf;

    const breathFilter = audioCtx.createBiquadFilter();
    breathFilter.type = "highpass";
    breathFilter.frequency.value = 4000;

    const breathGain = audioCtx.createGain();
    breathGain.gain.setValueAtTime(0, time);
    breathGain.gain.linearRampToValueAtTime(0.03, time + 0.02);
    breathGain.gain.setValueAtTime(0.03, time + duration - 0.1);
    breathGain.gain.linearRampToValueAtTime(0.01, time + duration);

    breathNoise.connect(breathFilter);
    breathFilter.connect(breathGain);

    const warmthLPF = audioCtx.createBiquadFilter();
    warmthLPF.type = "lowpass";
    warmthLPF.frequency.value = 8000;
    warmthLPF.Q.value = 0.5;

    const chorusDelay1 = audioCtx.createDelay();
    chorusDelay1.delayTime.value = 0.022;
    const chorusLFO1 = audioCtx.createOscillator();
    chorusLFO1.frequency.value = 0.4 + v * 0.1;
    const chorusDepth1 = audioCtx.createGain();
    chorusDepth1.gain.value = 0.005;
    chorusLFO1.connect(chorusDepth1);
    chorusDepth1.connect(chorusDelay1.delayTime);

    const chorusDelay2 = audioCtx.createDelay();
    chorusDelay2.delayTime.value = 0.028;
    const chorusLFO2 = audioCtx.createOscillator();
    chorusLFO2.frequency.value = 0.5 + v * 0.15;
    const chorusDepth2 = audioCtx.createGain();
    chorusDepth2.gain.value = 0.006;
    chorusLFO2.connect(chorusDepth2);
    chorusDepth2.connect(chorusDelay2.delayTime);

    const chorusMix = audioCtx.createGain();
    chorusMix.gain.value = 1;

    const panner = audioCtx.createStereoPanner();
    panner.pan.value = pan;

    const envelope = audioCtx.createGain();
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(1, time + 0.03);
    envelope.gain.setValueAtTime(1, time + duration - 0.4);
    envelope.gain.exponentialRampToValueAtTime(0.01, time + duration);

    formantMixer.connect(warmthLPF);
    breathGain.connect(warmthLPF);
    warmthLPF.connect(chorusDelay1);
    warmthLPF.connect(chorusDelay2);
    warmthLPF.connect(chorusMix);
    chorusDelay1.connect(chorusMix);
    chorusDelay2.connect(chorusMix);
    chorusMix.connect(panner);
    panner.connect(envelope);
    envelope.connect(dryGain);
    envelope.connect(wetGain);

    oscs.forEach((osc) => {
      osc.start(time + Math.random() * 0.02);
      osc.stop(time + duration);
    });

    breathNoise.start(time);
    breathNoise.stop(time + duration);

    chorusLFO1.start(time);
    chorusLFO1.stop(time + duration);
    chorusLFO2.start(time);
    chorusLFO2.stop(time + duration);
  }
}

function startMenuMusic() {
  const now = audioCtx.currentTime;
  const noteDuration = 1.5;
  const droneFreq = 110;
  const chantMelody = [220, 246.94, 220, 196, 220, 246.94, 277, 246.94];
  const phraseLength = chantMelody.length * noteDuration;

  if (!menuMusicStartTime) {
    menuMusicStartTime = now;
  }

  const elapsed = now - menuMusicStartTime;
  const loopNumber = Math.floor(elapsed / phraseLength);
  const loopStart = menuMusicStartTime + loopNumber * phraseLength;
  const nextLoopStart = loopStart + phraseLength;

  const scheduleTime = now < loopStart + 0.1 ? loopStart : nextLoopStart;

  choir(droneFreq, scheduleTime, phraseLength);

  chantMelody.forEach((freq, i) => {
    choir(freq, scheduleTime + i * noteDuration, noteDuration * 1.2);
  });

  const nextCallTime = (scheduleTime + phraseLength - now) * 1000 - 300;
  menuMusicTimeout = setTimeout(() => {
    startMenuMusic();
  }, nextCallTime);
}

function stopMenuMusic() {
  menuMusicStartTime = null;
  if (menuMusicTimeout) {
    clearTimeout(menuMusicTimeout);
    menuMusicTimeout = null;
  }
}

function scheduleDrums() {
  let seqName = currentSequence;
  if (currentSequence === "sequence_1" && sequencePlayCount === 3) {
    seqName = "sequence_1_final";
  }
  if (currentSequence === "sequence_3" && sequencePlayCount === 3) {
    seqName = "sequence_3_final";
  }

  const seq = sequences[seqName];
  const now = audioCtx.currentTime;
  const lookahead = 0.1;

  for (let i = 0; i < seq.kick.length; i++) {
    const t = now + i * stepDuration + lookahead;

    if (seq.kick[i]) kickDrum(t);
    if (seq.snare[i]) snareDrum(t);
    if (seq.hihat[i]) hiHat(t);
    if (seq.bass[i]) fatBass(seq.bass[i], t, stepDuration * 2);
    if (seq.kalimba[i]) kalimba(seq.kalimba[i], t);
    if (seq.choir && seq.choir[i]) choir(seq.choir[i], t, stepDuration * 3.5);
  }

  sequencePlayCount++;
  const maxPlays = sequenceMaxPlays[currentSequence];
  if (maxPlays > 0 && sequencePlayCount >= maxPlays) {
    if (currentSequence === "sequence_0") {
      currentSequence = "sequence_1";
      sequencePlayCount = 0;
      clearInterval(sequencerInterval);
      sequencerInterval = null;
      const newSeq = sequences[currentSequence];
      const newPatternDuration = stepDuration * newSeq.kick.length * 1000;
      sequencerInterval = setInterval(scheduleDrums, newPatternDuration);
    } else if (currentSequence === "sequence_1") {
      currentSequence = "sequence_2";
      sequencePlayCount = 0;
      clearInterval(sequencerInterval);
      sequencerInterval = null;
      const newSeq = sequences[currentSequence];
      const newPatternDuration = stepDuration * newSeq.kick.length * 1000;
      sequencerInterval = setInterval(scheduleDrums, newPatternDuration);
    } else if (currentSequence === "sequence_2") {
      currentSequence = "sequence_3";
      sequencePlayCount = 0;
      clearInterval(sequencerInterval);
      sequencerInterval = null;
      const newSeq = sequences[currentSequence];
      const newPatternDuration = stepDuration * newSeq.kick.length * 1000;
      sequencerInterval = setInterval(scheduleDrums, newPatternDuration);
    } else if (currentSequence === "sequence_3") {
      sequencePlayCount = 0;
    }
  }
}

function startSequencer() {
  const now = audioCtx.currentTime;
  // Store drone oscillators so we can stop them later
  const drone1 = dissonantSynth(55, now + 0.1, 999999, 0, -0.7);
  const drone2 = dissonantSynth(55, now + 0.1, 999999, 2, 0.7);
  droneOscillators = [...drone1, ...drone2];

  if (sequencerInterval) return;
  stepDuration = 60 / bpm / 4;
  const seq = sequences[currentSequence];
  const patternDuration = stepDuration * seq.kick.length * 1000;
  scheduleDrums();
  sequencerInterval = setInterval(scheduleDrums, patternDuration);
}

function stopSequencer() {
  if (sequencerInterval) {
    clearInterval(sequencerInterval);
    sequencerInterval = null;
  }
  
  // Stop all drone oscillators immediately
  const now = audioCtx.currentTime;
  droneOscillators.forEach((osc) => {
    try {
      osc.stop(now);
    } catch (e) {
      // Oscillator may already be stopped
    }
  });
  droneOscillators = [];
  
  currentSequence = "sequence_0";
  sequencePlayCount = 0;
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

function playGameOverSound(scene) {
  const ctx = scene.sound.context;
  const now = ctx.currentTime;
  
  // Classic game over jingle: descending notes (G-E-C)
  // Frequencies: G4=392, E4=330, C4=262
  const notes = [392, 330, 262];
  const noteDuration = 0.25;
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = freq;
    osc.type = 'square';
    
    const startTime = now + i * noteDuration;
    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
    
    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

function playHighScoreSound(scene) {
  const ctx = scene.sound.context;
  const now = ctx.currentTime;
  
  // Salutation/fanfare: ascending notes (C-E-G-C) - a positive, celebratory sound
  // Frequencies: C4=262, E4=330, G4=392, C5=523
  const notes = [262, 330, 392, 523];
  const noteDuration = 0.15;
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = freq;
    osc.type = 'square';
    
    const startTime = now + i * noteDuration;
    gain.gain.setValueAtTime(0.18, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
    
    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}
