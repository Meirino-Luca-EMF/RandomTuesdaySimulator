/* =====================================================
   WORLD.JS — Top-down pixel RPG engine
   Shack starting area, WASD movement, E interact, Q inventory
   ===================================================== */

/* ──────────────────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────────────────── */
const TILE   = 32;      // px per tile
const COLS   = 18;      // map width in tiles
const ROWS   = 14;      // map height in tiles
const SCALE  = 2;       // pixel-art upscale

// Tile IDs
const T = {
  FLOOR_WOOD:  0,
  FLOOR_DIRT:  1,
  WALL_H:      2,
  WALL_V:      3,
  WALL_CORNER: 4,
  DOOR:        5,
  RUG:         6,
  FLOOR_CRACK: 7,
  WALL_HOLE:   8,
};

// Palette
const PAL = {
  woodFloor:   '#7a5c3a',
  woodFloorD:  '#5c4228',
  woodCrack:   '#3d2b16',
  dirt:        '#4a3520',
  dirtD:       '#38281a',
  wallLight:   '#8b6f47',
  wallDark:    '#6b5235',
  wallHole:    '#1a1008',
  doorFrame:   '#5c3d1e',
  doorOpen:    '#1a0e05',
  rug:         '#8b1a1a',
  rugPattern:  '#5c1010',
  rugBorder:   '#c0392b',
};

/* ──────────────────────────────────────────────────────
   MAP DEFINITION  (0=wood, 1=dirt, 2=wall-h, 3=wall-v, 4=corner, 5=door, 6=rug, 7=crack, 8=hole)
   Walls run around the perimeter, door at bottom centre
────────────────────────────────────────────────────── */
const MAP_TILES = [
  [4,2,2,2,2,2,2,8,2,2,2,2,2,2,2,2,2,4],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,6,6,6,0,0,0,0,0,0,0,7,0,0,0,0,3],
  [3,0,6,6,6,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,6,6,6,0,0,0,0,0,0,0,0,0,7,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [8,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,7,0,0,0,0,0,0,0,0,0,0,0,0,7,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [4,2,2,2,2,2,2,2,2,5,5,2,2,2,2,2,2,4],
];

// Solid tiles (can't walk through)
const SOLID = new Set([T.WALL_H, T.WALL_V, T.WALL_CORNER]);

/* ──────────────────────────────────────────────────────
   OBJECTS  { tx, ty, emoji, label, lines[] }
────────────────────────────────────────────────────── */
const OBJECTS = [
  // Mattress (rug area top-left)
  {
    tx: 2, ty: 2, w: 3, h: 3,
    emoji: '🛏️', label: 'Matelas',
    lines: [
      '"C\'est ton lit. Un matelas trouvé dans la rue."',
      '"Il y a une tache suspecte en forme de France."',
      '"Tu as dormi là-dessus 3 ans. Tu ne veux pas savoir pourquoi ça craque."',
    ]
  },
  // TV
  {
    tx: 15, ty: 1, w: 2, h: 1,
    emoji: '📺', label: 'Télé',
    lines: [
      '"Une télé 14 pouces de 1998. Elle capte 1 chaîne : météo du Kazakhstan."',
      '"L\'image est en noir et blanc. Tu penses que c\'est artistique."',
      '"Il y a du scotch partout. Tu ne sais plus si c\'est toi qui l\'as mis."',
    ]
  },
  // Fridge
  {
    tx: 15, ty: 3, w: 1, h: 1,
    emoji: '🧊', label: 'Frigo',
    lines: [
      '"Contenu : 1 moutarde périmée depuis Obama, et de l\'espoir."',
      '"La lumière intérieure est cassée. Le frigo non plus ne sait pas si tu t\'en sors."',
      '"Un bruit bizarre vient du frigo. Tu préfères ne pas vérifier."',
    ]
  },
  // Microwave
  {
    tx: 14, ty: 5, w: 1, h: 1,
    emoji: '📡', label: 'Micro-ondes',
    lines: [
      '"Il capte la WiFi du voisin. C\'est son seul usage."',
      '"Le minuteur est bloqué sur 6:66. C\'est physiquement impossible. Pourtant."',
      '"Tu as tenté de cuisiner un oeuf dedans. On n\'en parle plus."',
    ]
  },
  // Suspicious box
  {
    tx: 1, ty: 6, w: 1, h: 1,
    emoji: '📦', label: 'Boîte mystérieuse',
    lines: [
      '"Elle était là quand tu as emménagé. Tu n\'as jamais osé l\'ouvrir."',
      '"Elle fait un bruit d\'eau si tu l\'agites. Ce n\'est probablement pas de l\'eau."',
      '"Estampillée : \'PROPRIÉTÉ DE G. MOUTON — NE PAS TOUCHER\'. G. Mouton est mort en 2019."',
    ]
  },
  // Table with stuff
  {
    tx: 8, ty: 2, w: 2, h: 1,
    emoji: '🪑', label: 'Table bancale',
    lines: [
      '"Une table avec 3 pattes et un dictionnaire en guise de 4ème."',
      '"Il y a des dettes dessus. Littéralement : des papiers de dettes."',
      '"Quelqu\'un a gravé \'SORTEZ D\'ICI\' dans le bois. Sage conseil."',
    ]
  },
  // Rat
  {
    tx: 7, ty: 6, w: 1, h: 1,
    emoji: '🐀', label: 'Kevin',
    lines: [
      '"C\'est Kevin. Il paye pas de loyer mais il est là depuis plus longtemps que toi."',
      '"Kevin te regarde avec mépris. Kevin s\'en sort mieux que toi."',
      '"Kevin a l\'air d\'avoir un plan. Kevin ne le partage pas."',
    ]
  },
  // Toilet plunger
  {
    tx: 16, ty: 8, w: 1, h: 1,
    emoji: '🪠', label: 'Ventouse',
    lines: [
      '"LA ventouse. Ton seul outil. Ta seule arme."',
      '"Tu as réparé les toilettes, le plafond, et une relation avec ça."',
      '"Elle brille d\'une aura étrange. +1 en Débrouillardise."',
    ]
  },
  // Stash / pile of junk
  {
    tx: 1, ty: 10, w: 2, h: 2,
    emoji: '🗑️', label: 'Tas de trucs',
    lines: [
      '"Un tas de déchets organisés selon un système que toi seul comprends."',
      '"Il y a là-dedans : 3 télécommandes orphelines, 1 rolodex, et la vérité."',
      '"Fouiller ici pourrait te rendre RICHE. Ou tétanos. Probablement tétanos."',
    ]
  },
  // Window with cracked glass
  {
    tx: 8, ty: 0, w: 2, h: 1,
    emoji: '🪟', label: 'Fenêtre fissurée',
    lines: [
      '"Vue sur le mur du voisin. Il a peint \'VA BOSSER\' dessus. Pour toi."',
      '"La vitre est fissurée depuis le lancer de téléphone de 2022."',
      '"Par cette fenêtre entre le vent, la pluie, et les rêves brisés."',
    ]
  },
];

/* ──────────────────────────────────────────────────────
   PLAYER
────────────────────────────────────────────────────── */
let player = {
  tx: 9, ty: 7,          // tile position (float ok)
  px: 0, py: 0,          // pixel offset (lerp target)
  dx: 0, dy: 0,
  facing: 'down',
  frame: 0,
  frameTimer: 0,
  money: 0,
  dignity: 0,
  inventory: [],
};

/* ──────────────────────────────────────────────────────
   INPUT
────────────────────────────────────────────────────── */
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'e') tryInteract();
  if (e.key.toLowerCase() === 'q') toggleInventory();
  if (e.key === 'Escape') togglePause();
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

/* ──────────────────────────────────────────────────────
   GAME STATE
────────────────────────────────────────────────────── */
let gameState     = 'playing';  // 'playing' | 'dialog' | 'inventory' | 'paused'
let dialogQueue   = [];
let dialogIdx     = 0;
let dialogObj     = null;
let inventoryOpen = false;

/* ──────────────────────────────────────────────────────
   CANVAS SETUP
────────────────────────────────────────────────────── */
let canvas, ctx, uiCanvas, uiCtx;
let camX = 0, camY = 0;

function startWorld() {
  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.id = 'game-wrapper';
  wrapper.style.cssText =
    'position:fixed;inset:0;z-index:300;background:#1a0e00;' +
    'display:flex;align-items:center;justify-content:center;overflow:hidden;';

  // Game canvas
  canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  canvas.style.cssText = 'image-rendering:pixelated;image-rendering:crisp-edges;display:block;';

  // UI canvas overlay
  uiCanvas = document.createElement('canvas');
  uiCanvas.id = 'ui-canvas';
  uiCanvas.style.cssText =
    'position:absolute;top:0;left:0;image-rendering:pixelated;pointer-events:none;';

  wrapper.appendChild(canvas);
  wrapper.appendChild(uiCanvas);
  document.body.appendChild(wrapper);

  ctx   = canvas.getContext('2d');
  uiCtx = uiCanvas.getContext('2d');

  ctx.imageSmoothingEnabled   = false;
  uiCtx.imageSmoothingEnabled = false;

  resizeGame();
  window.addEventListener('resize', resizeGame);

  // init player pixel pos
  player.px = player.tx * TILE * SCALE;
  player.py = player.ty * TILE * SCALE;

  // Show opening dialog
  setTimeout(() => {
    showDialog(null, [
      '📢 MARDI, 07H43.',
      '"Tu te réveilles sur ton matelas. Ou ce qui y ressemble."',
      '"Loyer dû dans 3 jours. Solde bancaire : -3,47€."',
      '"Aujourd\'hui, ça change. Aujourd\'hui tu deviens RICHE."',
      '"...ou pas. Mais au moins tu essaies."',
    ]);
  }, 300);

  requestAnimationFrame(gameLoop);
}

function resizeGame() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const mapW = COLS * TILE * SCALE;
  const mapH = ROWS * TILE * SCALE;
  canvas.width  = mapW;
  canvas.height = mapH;
  canvas.style.width  = mapW + 'px';
  canvas.style.height = mapH + 'px';
  // scale to fit screen
  const scaleX = W / mapW;
  const scaleY = H / mapH;
  const fitScale = Math.min(scaleX, scaleY, 1);
  canvas.style.transform = `scale(${fitScale})`;
  canvas.style.transformOrigin = 'top left';
  canvas.style.position = 'absolute';
  canvas.style.left = ((W - mapW * fitScale) / 2) + 'px';
  canvas.style.top  = ((H - mapH * fitScale) / 2) + 'px';
  uiCanvas.width  = W;
  uiCanvas.height = H;
  uiCanvas.style.width  = W + 'px';
  uiCanvas.style.height = H + 'px';
}

/* ──────────────────────────────────────────────────────
   GAME LOOP
────────────────────────────────────────────────────── */
let lastTime = 0;
function gameLoop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  if (gameState === 'playing') {
    updatePlayer(dt);
  }
  drawWorld();
  drawUI();

  requestAnimationFrame(gameLoop);
}

/* ──────────────────────────────────────────────────────
   UPDATE
────────────────────────────────────────────────────── */
const SPEED = 5; // tiles per second

function updatePlayer(dt) {
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup'])    dy = -1;
  if (keys['s'] || keys['arrowdown'])  dy =  1;
  if (keys['a'] || keys['arrowleft'])  dx = -1;
  if (keys['d'] || keys['arrowright']) dx =  1;

  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

  if (dx !== 0 || dy !== 0) {
    const nx = player.tx + dx * SPEED * dt;
    const ny = player.ty + dy * SPEED * dt;

    // collision per axis
    if (!isSolid(nx, player.ty) && !objectAt(Math.floor(nx), Math.floor(player.ty))) player.tx = nx;
    if (!isSolid(player.tx, ny) && !objectAt(Math.floor(player.tx), Math.floor(ny))) player.ty = ny;

    // facing
    if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? 'right' : 'left';
    else player.facing = dy > 0 ? 'down' : 'up';

    // animation
    player.frameTimer += dt;
    if (player.frameTimer > 0.15) { player.frameTimer = 0; player.frame = (player.frame + 1) % 4; }
  } else {
    player.frame = 0;
  }

  player.px = player.tx * TILE * SCALE;
  player.py = player.ty * TILE * SCALE;
}

function isSolid(tx, ty) {
  const col = Math.floor(tx);
  const row = Math.floor(ty);
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return true;
  return SOLID.has(MAP_TILES[row]?.[col]);
}

function objectAt(col, row) {
  return OBJECTS.some(o => col >= o.tx && col < o.tx + o.w && row >= o.ty && row < o.ty + o.h);
}

/* ──────────────────────────────────────────────────────
   INTERACTIONS
────────────────────────────────────────────────────── */
function tryInteract() {
  if (gameState === 'dialog') { advanceDialog(); return; }
  if (gameState !== 'playing') return;

  // check facing tile
  const offsets = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
  const [ox, oy] = offsets[player.facing];
  const checkX = Math.floor(player.tx) + ox;
  const checkY = Math.floor(player.ty) + oy;
  // also check player's own tile
  const px = Math.floor(player.tx);
  const py = Math.floor(player.ty);

  for (const obj of OBJECTS) {
    const inRange =
      (checkX >= obj.tx && checkX < obj.tx + obj.w && checkY >= obj.ty && checkY < obj.ty + obj.h) ||
      (px     >= obj.tx && px     < obj.tx + obj.w && py     >= obj.ty && py     < obj.ty + obj.h);
    if (inRange) {
      showDialog(obj, obj.lines);
      return;
    }
  }

  // Door interaction
  const doorTiles = [[9,13],[10,13]];
  const onDoor = doorTiles.some(([dx,dy]) =>
    (checkX === dx && checkY === dy) || (px === dx && py === dy)
  );
  if (onDoor) {
    showDialog(null, [
      '"La porte. L\'extérieur. Le MONDE."',
      '"Tu n\'es pas encore prêt(e). Il te faut d\'abord un plan."',
      '"(Le monde arrive dans la prochaine mise à jour...)"',
    ]);
  }
}

/* ──────────────────────────────────────────────────────
   DIALOG SYSTEM
────────────────────────────────────────────────────── */
function showDialog(obj, lines) {
  if (gameState === 'dialog') return;
  dialogObj   = obj;
  dialogQueue = lines;
  dialogIdx   = 0;
  gameState   = 'dialog';
}

function advanceDialog() {
  dialogIdx++;
  if (dialogIdx >= dialogQueue.length) {
    gameState = 'playing';
    dialogObj = null;
  }
}

/* ──────────────────────────────────────────────────────
   INVENTORY
────────────────────────────────────────────────────── */
function toggleInventory() {
  if (gameState === 'dialog') return;
  inventoryOpen = !inventoryOpen;
  gameState     = inventoryOpen ? 'inventory' : 'playing';
}

/* ──────────────────────────────────────────────────────
   PAUSE
────────────────────────────────────────────────────── */
function togglePause() {
  if (gameState === 'dialog' || gameState === 'inventory') return;
  gameState = gameState === 'paused' ? 'playing' : 'paused';
}

/* ──────────────────────────────────────────────────────
   DRAW WORLD
────────────────────────────────────────────────────── */
function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Tiles
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      drawTile(col, row, MAP_TILES[row][col]);
    }
  }

  // Objects (sorted by y so overlap looks right)
  const sorted = [...OBJECTS].sort((a, b) => a.ty - b.ty);
  for (const obj of sorted) {
    drawObject(obj);
  }

  // Player
  drawPlayer();

  // Interaction hint (floating E above nearby object)
  drawInteractHint();
}

/* ──────────────────────────────────────────────────────
   TILE RENDERER
────────────────────────────────────────────────────── */
function drawTile(col, row, id) {
  const x = col * TILE * SCALE;
  const y = row * TILE * SCALE;
  const S = TILE * SCALE;

  ctx.save();
  ctx.translate(x, y);

  switch (id) {
    case T.FLOOR_WOOD:
      // Base planks
      ctx.fillStyle = PAL.woodFloor;
      ctx.fillRect(0, 0, S, S);
      // Plank lines
      ctx.strokeStyle = PAL.woodFloorD;
      ctx.lineWidth = SCALE;
      // Horizontal planks every 8px (before scale)
      for (let p = 8; p < TILE; p += 8) {
        ctx.beginPath();
        ctx.moveTo(0, p * SCALE);
        ctx.lineTo(S, p * SCALE);
        ctx.stroke();
      }
      // Occasional vertical grain
      if ((col + row) % 3 === 0) {
        ctx.strokeStyle = PAL.woodCrack;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(S * 0.3, 0);
        ctx.lineTo(S * 0.35, S);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      break;

    case T.FLOOR_DIRT:
      ctx.fillStyle = PAL.dirt;
      ctx.fillRect(0, 0, S, S);
      // Noise dots
      ctx.fillStyle = PAL.dirtD;
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(((col * 7 + i * 11) % S), ((row * 13 + i * 7) % S), SCALE, SCALE);
      }
      break;

    case T.WALL_H:
      ctx.fillStyle = PAL.wallLight;
      ctx.fillRect(0, 0, S, S);
      // Horizontal planks
      for (let p = 0; p < TILE; p += 6) {
        ctx.fillStyle = p % 12 === 0 ? PAL.wallDark : PAL.wallLight;
        ctx.fillRect(0, p * SCALE, S, 6 * SCALE);
      }
      // Shadow bottom
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, S - SCALE * 4, S, SCALE * 4);
      break;

    case T.WALL_V:
      ctx.fillStyle = PAL.wallDark;
      ctx.fillRect(0, 0, S, S);
      for (let p = 0; p < TILE; p += 6) {
        ctx.fillStyle = p % 12 === 0 ? PAL.wallLight : PAL.wallDark;
        ctx.fillRect(0, p * SCALE, S, 6 * SCALE);
      }
      break;

    case T.WALL_CORNER:
      ctx.fillStyle = PAL.wallDark;
      ctx.fillRect(0, 0, S, S);
      // Corner detail
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(S - SCALE * 3, 0, SCALE * 3, S);
      ctx.fillRect(0, S - SCALE * 3, S, SCALE * 3);
      break;

    case T.DOOR:
      // Door frame
      ctx.fillStyle = PAL.doorFrame;
      ctx.fillRect(0, 0, S, S);
      // Door opening
      ctx.fillStyle = PAL.doorOpen;
      ctx.fillRect(SCALE * 2, 0, S - SCALE * 4, S);
      // Frame edges
      ctx.fillStyle = PAL.woodFloorD;
      ctx.fillRect(0, 0, SCALE * 2, S);
      ctx.fillRect(S - SCALE * 2, 0, SCALE * 2, S);
      break;

    case T.RUG:
      // Draw floor under rug
      ctx.fillStyle = PAL.woodFloor;
      ctx.fillRect(0, 0, S, S);
      // Rug
      ctx.fillStyle = PAL.rug;
      ctx.fillRect(SCALE, SCALE, S - SCALE * 2, S - SCALE * 2);
      // Rug pattern
      ctx.fillStyle = PAL.rugPattern;
      ctx.fillRect(SCALE * 4, SCALE * 4, S - SCALE * 8, S - SCALE * 8);
      ctx.fillStyle = PAL.rugBorder;
      ctx.fillRect(SCALE * 2, SCALE * 2, S - SCALE * 4, SCALE);
      ctx.fillRect(SCALE * 2, S - SCALE * 3, S - SCALE * 4, SCALE);
      break;

    case T.FLOOR_CRACK:
      ctx.fillStyle = PAL.woodFloor;
      ctx.fillRect(0, 0, S, S);
      for (let p = 8; p < TILE; p += 8) {
        ctx.strokeStyle = PAL.woodFloorD;
        ctx.lineWidth = SCALE;
        ctx.beginPath();
        ctx.moveTo(0, p * SCALE);
        ctx.lineTo(S, p * SCALE);
        ctx.stroke();
      }
      // Crack
      ctx.strokeStyle = PAL.woodCrack;
      ctx.lineWidth = SCALE * 1.5;
      ctx.beginPath();
      ctx.moveTo(S * 0.2, S * 0.1);
      ctx.lineTo(S * 0.5, S * 0.5);
      ctx.lineTo(S * 0.3, S * 0.9);
      ctx.stroke();
      break;

    case T.WALL_HOLE:
      ctx.fillStyle = PAL.wallLight;
      ctx.fillRect(0, 0, S, S);
      for (let p = 0; p < TILE; p += 6) {
        ctx.fillStyle = p % 12 === 0 ? PAL.wallDark : PAL.wallLight;
        ctx.fillRect(0, p * SCALE, S, 6 * SCALE);
      }
      // Hole
      ctx.fillStyle = PAL.wallHole;
      ctx.beginPath();
      ctx.ellipse(S / 2, S / 2, S * 0.3, S * 0.2, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PAL.wallDark;
      ctx.lineWidth = SCALE;
      ctx.stroke();
      break;
  }

  ctx.restore();
}

/* ──────────────────────────────────────────────────────
   OBJECT RENDERER
────────────────────────────────────────────────────── */
function drawObject(obj) {
  const x = obj.tx * TILE * SCALE;
  const y = obj.ty * TILE * SCALE;
  const S = TILE * SCALE;

  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x + (obj.w * S) / 2, y + obj.h * S - SCALE * 2, (obj.w * S) * 0.4, SCALE * 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Emoji
  const fontSize = Math.max(obj.w, obj.h) * TILE * SCALE * 0.7;
  ctx.font = `${fontSize}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(obj.emoji, x + (obj.w * S) / 2, y + (obj.h * S) / 2);
}

/* ──────────────────────────────────────────────────────
   PLAYER RENDERER  (pixel-art character, top-down)
────────────────────────────────────────────────────── */
function drawPlayer() {
  const x = player.px;
  const y = player.py;
  const S = TILE * SCALE;

  // Bob offset
  const bobY = (player.frame === 1 || player.frame === 3) ? -SCALE * 1 : 0;

  ctx.save();
  ctx.translate(x + S / 2, y + S / 2 + bobY);

  // Shadow
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, S * 0.4, S * 0.28, S * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Sprite: pixel art character in a torn jacket
  const p = SCALE; // 1 pixel unit
  const flip = player.facing === 'left';
  if (flip) ctx.scale(-1, 1);

  // Body (jacket — olive green torn coat)
  ctx.fillStyle = '#4a5a2a';   // coat
  ctx.fillRect(-6*p, -8*p, 12*p, 14*p);
  // Jacket tear
  ctx.fillStyle = '#2a3a10';
  ctx.fillRect(2*p, -2*p, 2*p, 6*p);
  // Collar / neck
  ctx.fillStyle = '#c8a070';
  ctx.fillRect(-2*p, -8*p, 4*p, 3*p);
  // Head
  ctx.fillStyle = '#c8a070';
  ctx.fillRect(-5*p, -16*p, 10*p, 9*p);
  // Hair (messy)
  ctx.fillStyle = '#3a2510';
  ctx.fillRect(-5*p, -17*p, 10*p, 3*p);
  ctx.fillRect(-6*p, -16*p, 2*p, 5*p);
  ctx.fillRect( 4*p, -16*p, 2*p, 4*p);
  // Eyes
  ctx.fillStyle = '#fff';
  if (player.facing === 'up') {
    // back of head
    ctx.fillStyle = '#3a2510';
    ctx.fillRect(-3*p, -14*p, 6*p, 2*p);
  } else {
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(-3*p, -12*p, 2*p, 2*p);
    ctx.fillRect( 1*p, -12*p, 2*p, 2*p);
    // stubble
    ctx.fillStyle = '#7a6050';
    ctx.fillRect(-2*p, -9*p, 4*p, p);
  }
  // Legs
  const legOff = (player.frame === 1) ? 2 : (player.frame === 3) ? -2 : 0;
  ctx.fillStyle = '#2a2018';  // dark pants
  ctx.fillRect(-5*p, 6*p, 4*p, 8*p + legOff*p);
  ctx.fillRect( 1*p, 6*p, 4*p, 8*p - legOff*p);
  // Shoes
  ctx.fillStyle = '#1a1008';
  ctx.fillRect(-6*p, 14*p + legOff*p, 5*p, 3*p);
  ctx.fillRect( 1*p, 14*p - legOff*p, 5*p, 3*p);
  // Arms
  const armOff = (player.frame === 1) ? -2 : (player.frame === 3) ? 2 : 0;
  ctx.fillStyle = '#4a5a2a';
  ctx.fillRect(-9*p, -6*p + armOff*p, 4*p, 10*p);
  ctx.fillRect( 5*p, -6*p - armOff*p, 4*p, 10*p);
  // Hands
  ctx.fillStyle = '#c8a070';
  ctx.fillRect(-9*p, 4*p + armOff*p, 4*p, 3*p);
  ctx.fillRect( 5*p, 4*p - armOff*p, 4*p, 3*p);

  ctx.restore();
}

/* ──────────────────────────────────────────────────────
   INTERACT HINT
────────────────────────────────────────────────────── */
function drawInteractHint() {
  if (gameState !== 'playing') return;
  const offsets = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
  const [ox, oy] = offsets[player.facing];
  const checkX = Math.floor(player.tx) + ox;
  const checkY = Math.floor(player.ty) + oy;

  for (const obj of OBJECTS) {
    if (checkX >= obj.tx && checkX < obj.tx + obj.w &&
        checkY >= obj.ty && checkY < obj.ty + obj.h) {
      // Draw floating E key above object
      const cx = (obj.tx + obj.w / 2) * TILE * SCALE;
      const cy = obj.ty * TILE * SCALE - SCALE * 6;
      const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 300);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ffe600';
      ctx.strokeStyle = '#1a1200';
      ctx.lineWidth = SCALE;
      const bw = TILE * SCALE * 0.7;
      const bh = TILE * SCALE * 0.55;
      roundRect(ctx, cx - bw/2, cy - bh/2, bw, bh, SCALE * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1a1200';
      ctx.font = `bold ${TILE * SCALE * 0.4}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E', cx, cy);
      ctx.restore();
      break;
    }
  }

  // Door hint
  const doorTiles = [[9,13],[10,13]];
  if (doorTiles.some(([dx,dy]) => checkX === dx && checkY === dy)) {
    const cx = 9.5 * TILE * SCALE;
    const cy = 13 * TILE * SCALE - SCALE * 4;
    const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 300);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffe600';
    ctx.strokeStyle = '#1a1200';
    ctx.lineWidth = SCALE;
    const bw = TILE * SCALE * 0.7;
    const bh = TILE * SCALE * 0.55;
    roundRect(ctx, cx - bw/2, cy - bh/2, bw, bh, SCALE * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1a1200';
    ctx.font = `bold ${TILE * SCALE * 0.4}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', cx, cy);
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/* ──────────────────────────────────────────────────────
   DRAW UI  (dialog box, HUD, inventory)
────────────────────────────────────────────────────── */
function drawUI() {
  uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
  drawHUD();
  if (gameState === 'dialog')    drawDialogBox();
  if (gameState === 'inventory') drawInventoryScreen();
  if (gameState === 'paused')    drawPauseScreen();
}

/* ---- HUD ---- */
function drawHUD() {
  const W = uiCanvas.width;
  const pad = 12;
  uiCtx.save();
  // HUD bar bg
  uiCtx.fillStyle = 'rgba(10,8,0,0.75)';
  uiCtx.fillRect(0, 0, W, 44);
  uiCtx.strokeStyle = '#ffe600';
  uiCtx.lineWidth = 2;
  uiCtx.strokeRect(0, 0, W, 44);

  uiCtx.font = 'bold 15px "IBM Plex Mono", monospace';
  uiCtx.fillStyle = '#ffe600';
  uiCtx.textBaseline = 'middle';

  uiCtx.textAlign = 'left';
  uiCtx.fillText(`💰 ${player.money}€`, pad, 22);
  uiCtx.fillText(`☠ DIGNITY: ${player.dignity}%`, pad + 140, 22);

  uiCtx.textAlign = 'right';
  uiCtx.fillStyle = 'rgba(255,255,255,0.4)';
  uiCtx.font = '11px "IBM Plex Mono", monospace';
  uiCtx.fillText('[E] Interagir   [Q] Inventaire   [ESC] Pause', W - pad, 22);

  uiCtx.restore();
}

/* ---- DIALOG BOX ---- */
function drawDialogBox() {
  if (!dialogQueue.length) return;
  const W  = uiCanvas.width;
  const H  = uiCanvas.height;
  const bh = 140;
  const bw = W - 40;
  const bx = 20;
  const by = H - bh - 20;

  uiCtx.save();

  // Box
  uiCtx.fillStyle = 'rgba(10,8,2,0.92)';
  uiCtx.strokeStyle = '#ffe600';
  uiCtx.lineWidth = 3;
  uiCtx.beginPath();
  uiCtx.roundRect(bx, by, bw, bh, 8);
  uiCtx.fill();
  uiCtx.stroke();

  // Title strip if has object
  if (dialogObj) {
    uiCtx.fillStyle = '#ffe600';
    uiCtx.beginPath();
    uiCtx.roundRect(bx + 12, by - 14, 140, 26, 4);
    uiCtx.fill();
    uiCtx.fillStyle = '#1a1200';
    uiCtx.font = 'bold 13px "IBM Plex Mono", monospace';
    uiCtx.textAlign = 'left';
    uiCtx.textBaseline = 'middle';
    uiCtx.fillText(dialogObj.emoji + ' ' + dialogObj.label, bx + 20, by - 1);
  }

  // Text
  const line = dialogQueue[dialogIdx] || '';
  uiCtx.fillStyle = '#f2e8c9';
  uiCtx.font = '16px "Permanent Marker", cursive';
  uiCtx.textAlign = 'left';
  uiCtx.textBaseline = 'top';
  wrapText(uiCtx, line, bx + 20, by + 20, bw - 40, 24);

  // Progress dots
  for (let i = 0; i < dialogQueue.length; i++) {
    uiCtx.fillStyle = i === dialogIdx ? '#ffe600' : 'rgba(255,230,0,0.25)';
    uiCtx.beginPath();
    uiCtx.arc(bx + 20 + i * 14, by + bh - 18, 4, 0, Math.PI * 2);
    uiCtx.fill();
  }

  // Blink arrow
  if (Math.floor(Date.now() / 500) % 2 === 0) {
    uiCtx.fillStyle = '#ffe600';
    uiCtx.font = '18px monospace';
    uiCtx.textAlign = 'right';
    uiCtx.textBaseline = 'bottom';
    uiCtx.fillText('▶', bx + bw - 16, by + bh - 10);
  }

  uiCtx.restore();
}

/* ---- INVENTORY ---- */
function drawInventoryScreen() {
  const W = uiCanvas.width, H = uiCanvas.height;
  uiCtx.save();

  // Backdrop
  uiCtx.fillStyle = 'rgba(0,0,0,0.7)';
  uiCtx.fillRect(0, 0, W, H);

  const bw = Math.min(500, W - 40);
  const bh = 380;
  const bx = (W - bw) / 2;
  const by = (H - bh) / 2;

  uiCtx.fillStyle = '#1a1200';
  uiCtx.strokeStyle = '#ffe600';
  uiCtx.lineWidth = 3;
  uiCtx.beginPath();
  uiCtx.roundRect(bx, by, bw, bh, 10);
  uiCtx.fill();
  uiCtx.stroke();

  // Title
  uiCtx.fillStyle = '#ffe600';
  uiCtx.font = 'bold 22px "Permanent Marker", cursive';
  uiCtx.textAlign = 'center';
  uiCtx.textBaseline = 'top';
  uiCtx.fillText('📦 INVENTAIRE DE MAGOUILLES', W / 2, by + 16);

  uiCtx.strokeStyle = 'rgba(255,230,0,0.3)';
  uiCtx.lineWidth = 1;
  uiCtx.beginPath();
  uiCtx.moveTo(bx + 20, by + 52);
  uiCtx.lineTo(bx + bw - 20, by + 52);
  uiCtx.stroke();

  if (player.inventory.length === 0) {
    uiCtx.fillStyle = 'rgba(255,255,255,0.4)';
    uiCtx.font = '16px "IBM Plex Mono", monospace';
    uiCtx.textAlign = 'center';
    uiCtx.textBaseline = 'middle';
    uiCtx.fillText('Vide. Comme ton frigo. Et ton âme.', W / 2, by + bh / 2);
  }

  // Stats
  uiCtx.fillStyle = '#f2e8c9';
  uiCtx.font = '14px "IBM Plex Mono", monospace';
  uiCtx.textAlign = 'left';
  uiCtx.textBaseline = 'bottom';
  uiCtx.fillText(`💰 Argent : ${player.money}€  |  ☠ Dignité : ${player.dignity}%  |  📦 Objets : ${player.inventory.length}`, bx + 20, by + bh - 14);

  // Close hint
  uiCtx.fillStyle = 'rgba(255,230,0,0.5)';
  uiCtx.font = '12px "IBM Plex Mono", monospace';
  uiCtx.textAlign = 'right';
  uiCtx.fillText('[Q] Fermer', bx + bw - 16, by + bh - 14);

  uiCtx.restore();
}

/* ---- PAUSE ---- */
function drawPauseScreen() {
  const W = uiCanvas.width, H = uiCanvas.height;
  uiCtx.save();
  uiCtx.fillStyle = 'rgba(0,0,0,0.6)';
  uiCtx.fillRect(0, 0, W, H);
  uiCtx.fillStyle = '#ffe600';
  uiCtx.font = 'bold 40px "Bebas Neue", sans-serif';
  uiCtx.textAlign = 'center';
  uiCtx.textBaseline = 'middle';
  uiCtx.fillText('EN PAUSE', W / 2, H / 2 - 24);
  uiCtx.fillStyle = 'rgba(255,255,255,0.5)';
  uiCtx.font = '16px "IBM Plex Mono", monospace';
  uiCtx.fillText('( appuie sur ESC pour reprendre )', W / 2, H / 2 + 18);
  uiCtx.restore();
}

/* ──────────────────────────────────────────────────────
   UTILS
────────────────────────────────────────────────────── */
function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line !== '') {
      ctx.fillText(line.trim(), x, curY);
      line = word + ' ';
      curY += lineH;
    } else {
      line = test;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, curY);
}
