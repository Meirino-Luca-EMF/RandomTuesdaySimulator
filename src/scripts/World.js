/* =====================================================
   WORLD.JS — Random Tuesday Simulator
   Logical shack layout · killable Kevin · improved anims
   ===================================================== */

const TILE  = 16;
const SCALE = 3;
const S     = TILE * SCALE;   // 48 px/tile on screen
const COLS  = 24;
const ROWS  = 18;

/* ─── PALETTE ─────────────────────────────────────── */
const C = {
  /* floors */
  floorA:'#6b4c2a',floorB:'#5a3e22',floorC:'#7a5535',
  floorDark:'#3d2810',floorCrack:'#2a1c0a',
  /* walls */
  wallTop:'#8c6840',wallMid:'#7a5c36',wallBot:'#5a3e22',
  wallShadow:'#2e1e0a',wallHole:'#080402',
  /* rug */
  rugA:'#7a1515',rugB:'#5c0e0e',rugBorder:'#9e2020',rugAccent:'#c0392b',
  /* bed */
  bedFrame:'#4a2808',bedMatt:'#8a6a40',bedMattD:'#6a5030',
  bedPillow:'#c8b88a',bedPillowD:'#a89870',bedStain:'#6a5030',
  bedBlanket:'#9a8860',bedBlanketD:'#7a6840',
  /* tv */
  tvBody:'#181818',tvScreenOn:'#1a3020',
  /* fridge */
  fridgeBody:'#c0c8c0',fridgeSeal:'#aab0aa',fridgeHandle:'#888',
  /* furniture */
  tableTop:'#7a5028',tableLeg:'#4a2c10',
  chairSeat:'#6a4228',chairBack:'#4a2c10',
  shelfBoard:'#7a5530',shelfWall:'#5a3c20',
  /* objects */
  boxBrown:'#8a5a28',boxTape:'#c8a040',
  bucketBody:'#5878a0',bucketHandle:'#3a5878',bucketDirt:'#5a4028',
  ratBody:'#4a3828',ratEar:'#7a5848',ratEye:'#ff2020',ratDead:'#5a4838',
  plungerStick:'#9a7040',plungerCup:'#c03020',plungerCupD:'#7a1c10',
  trashBag:'#252525',trashBagT:'#353535',
  sinkBody:'#b8c0b8',sinkBowl:'#808880',sinkTap:'#9898a0',
  toiletBody:'#c8cec8',toiletBowl:'#9098a0',toiletLid:'#b8c0b8',
  lampShade:'#d0a820',lampShadeD:'#a08010',lampBase:'#8a6820',
  clockFace:'#f0e0b0',clockBody:'#2a2018',
  bottleBody:'#2a6020',bottleCap:'#b0b0b0',
  posterBg:'#3a0000',posterText:'#ff4040',
  doorFrame:'#5c3810',doorOpen:'#080402',
  /* divider wall */
  divWall:'#6a5030',divWallD:'#4a3820',
  /* coin */
  coinGold:'#f0c020',coinGoldD:'#c09010',
  /* hit flash */
  hitFlash:'#ff4040',
  hintBg:'#ffe600',hintText:'#1a1200',
};

/* ─── MAP ─────────────────────────────────────────────
  Layout (top-down):
  ┌────────────────────────────────────────┐
  │  BEDROOM (left)  │  LIVING / KITCHEN   │
  │  bed rug         │  TV, table, chairs  │
  ├──────────────────┤  shelf, fridge      │
  │  BATHROOM (bot-L)│                     │
  │  toilet, sink    │  (open space)       │
  └────────────────────────────────────────┘
  door at bottom centre

  0=floor  1=dark-floor  2=crack-floor
  3=wall-H 4=wall-V  5=corner
  6=door   7=rug     8=wall-hole
  9=div-H  (internal divider horizontal)
  A=div-V  (internal divider vertical, same SOLID)
  B=div-corner
*/
const MAP = [
  [5,3,3,3,3,3,3,8,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,5],
  [4,7,7,7,7,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,7,7,7,7,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,7,7,7,7,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,7,7,7,7,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,2,0,'A',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,'A',0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,'A',0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,4],
  [4,0,0,0,0,0,'A',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,9,9,9,9,9,9,9,9,0,0,0,0,0,0,0,0,0,4],
  [4,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [5,3,3,3,3,3,3,3,3,3,3,6,6,3,3,3,3,3,3,3,3,3,3,5],
];

/* Treat 'A' (65) and 9 as solid */
const SOLID_TILES = new Set([3,4,5,9,65,'A']);

/* ─── PIXEL HELPER ───────────────────────────────── */
function px(ctx,c,r,w,h,col){ctx.fillStyle=col;ctx.fillRect(c*SCALE,r*SCALE,w*SCALE,h*SCALE);}

/* ─── OBJECTS ────────────────────────────────────── */
const OBJECTS = [];

/* ══════════════════════════════════════════
   BEDROOM  (left side, x=0..5)
   ══════════════════════════════════════════ */

/* BED — against top-left wall, headboard touching wall row 1 */
OBJECTS.push({
  tx:1,ty:1,w:5,h:4,
  hx:1,hy:2,hw:5,hh:3,
  label:'Matelas',
  lines:[
    '"Trouvé dans la rue en 2021. Tu n\'as pas cherché plus loin."',
    '"La tache à droite ressemble à la Bretagne. T\'es fier."',
    '"Ça grince, ça sent le renfermé. C\'est CHEZ TOI."',
  ],
  draw(ctx){
    // Footboard
    ctx.fillStyle=C.bedFrame; ctx.fillRect(0,3*S,5*S,S);
    ctx.fillStyle='#6a3810'; ctx.fillRect(SCALE,3*S+SCALE,5*S-2*SCALE,S-2*SCALE);
    // Legs
    ctx.fillStyle='#2a1808';
    ctx.fillRect(0,4*S-SCALE*3,SCALE*2,SCALE*3);
    ctx.fillRect(5*S-SCALE*2,4*S-SCALE*3,SCALE*2,SCALE*3);
    // Headboard
    ctx.fillStyle=C.bedFrame; ctx.fillRect(0,0,5*S,S);
    for(let i=0;i<5;i++){
      ctx.fillStyle=i%2===0?'#7a4818':'#5a3010';
      ctx.fillRect(i*S+SCALE,SCALE,S-SCALE*2,S-SCALE*2);
    }
    // Nails
    ctx.fillStyle='#c8a060';
    for(let i=0;i<5;i++){ctx.fillRect(i*S+SCALE*2,SCALE*2,SCALE,SCALE);}
    // Frame rails
    ctx.fillStyle=C.bedFrame;
    ctx.fillRect(0,S,SCALE*2,3*S); ctx.fillRect(5*S-SCALE*2,S,SCALE*2,3*S);
    // Mattress
    ctx.fillStyle=C.bedMatt; ctx.fillRect(SCALE*2,S+SCALE,5*S-SCALE*4,3*S-SCALE*2);
    ctx.fillStyle=C.bedMattD; ctx.fillRect(SCALE*2,S+SCALE,5*S-SCALE*4,SCALE*2);
    // Buttons on mattress
    ctx.fillStyle='#5a4020';
    for(let bx=0;bx<3;bx++) for(let by=0;by<2;by++)
      ctx.fillRect((bx*2+1)*S,(by*S)+S+SCALE*5,SCALE,SCALE);
    // Stain Bretagne
    ctx.fillStyle=C.bedStain;
    ctx.fillRect(3*S,S+S*0.5,18,12); ctx.fillRect(3*S+5,S+S*0.5+10,12,6);
    // Pillow
    ctx.fillStyle=C.bedPillow; ctx.fillRect(SCALE*3,S+SCALE*3,2*S,S-SCALE*4);
    ctx.fillStyle=C.bedPillowD; ctx.fillRect(SCALE*3,S+SCALE*3,2*S,SCALE*2);
    // Crease
    ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(SCALE*3,S+S/2,2*S,SCALE);
    // Blanket crumpled on right half
    ctx.fillStyle=C.bedBlanket; ctx.fillRect(2*S+SCALE*3,S+SCALE*3,2*S,2*S+SCALE);
    ctx.fillStyle=C.bedBlanketD; ctx.fillRect(3*S,S+SCALE*5,S+SCALE*2,S);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.fillRect(5*S-SCALE*2,S,SCALE*2,3*S); ctx.fillRect(SCALE*2,4*S-SCALE*2,5*S-SCALE*2,SCALE*2);
  }
});

/* NIGHTSTAND — right of bed head */
OBJECTS.push({
  tx:1,ty:5,w:2,h:2,
  label:'Table de nuit',
  lines:[
    '"Une table de nuit bancale. Pied calé avec une pièce de 2€."',
    '"Dessus : un verre d\'eau (?), une aspirine, et de la honte."',
  ],
  draw(ctx){
    // Cabinet
    ctx.fillStyle=C.tableTop; ctx.fillRect(0,0,2*S,2*S);
    ctx.fillStyle=C.tableLeg; ctx.fillRect(SCALE,SCALE,2*S-SCALE*2,2*S-SCALE*2);
    // Drawer handle
    ctx.fillStyle='#c8a060'; ctx.fillRect(S-SCALE,S-SCALE,SCALE*2,SCALE*2);
    ctx.fillStyle=C.tableTop; ctx.fillRect(SCALE,S,2*S-SCALE*2,SCALE);
    // Items on top
    ctx.fillStyle='rgba(160,200,220,0.6)'; ctx.fillRect(SCALE*3,SCALE*2,SCALE*3,SCALE*4); // glass
    ctx.fillStyle='rgba(160,200,220,0.3)'; ctx.fillRect(SCALE*3,SCALE*2,SCALE*3,SCALE);    // water
    ctx.fillStyle='#f0f0f0'; ctx.fillRect(SCALE*7,SCALE*3,SCALE*4,SCALE*2);               // aspirin box
    ctx.fillStyle='#c03020'; ctx.fillRect(SCALE*8,SCALE*3,SCALE*2,SCALE);
    // Coin wedge
    ctx.fillStyle=C.coinGold; ctx.fillRect(0,2*S-SCALE,SCALE*2,SCALE);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,2*S-SCALE,2*S,SCALE);
  }
});

/* LAMP ON NIGHTSTAND */
OBJECTS.push({
  tx:2,ty:4,w:1,h:2,
  hx:2,hy:4,hw:0,hh:0,
  label:'Lampe',
  lines:[
    '"Elle clignote toutes les 30s. C\'est pas prévu."',
    '"40W dans un abat-jour prévu pour 15W. Risqué."',
  ],
  draw(ctx){
    const glow=0.15+0.07*Math.sin(Date.now()/700);
    ctx.fillStyle=`rgba(255,240,180,${glow})`; ctx.fillRect(-S,-S,3*S,3*S);
    ctx.fillStyle=C.lampBase; ctx.fillRect(S/2-SCALE,S+SCALE,SCALE*2,SCALE*3);
    ctx.fillStyle=C.lampBase; ctx.fillRect(S/2-SCALE*3,S+SCALE*4,SCALE*6,SCALE*2);
    ctx.fillStyle=C.lampShade; ctx.fillRect(SCALE,0,S-SCALE*2,S+SCALE*2);
    ctx.fillStyle=C.lampShadeD; ctx.fillRect(SCALE*2,SCALE,S-SCALE*4,S);
    ctx.fillStyle='#ffffc0'; ctx.fillRect(S/2-SCALE,S-SCALE,SCALE*2,SCALE*2);
  }
});

/* POSTER — on wall above bed */
OBJECTS.push({
  tx:3,ty:1,w:2,h:2,
  hx:0,hy:0,hw:0,hh:0,
  label:'Poster WANTED',
  lines:[
    '"WANTED — Kevin Le Rat. Récompense : 1€."',
    '"Tu l\'as fait toi-même sur Word. Ça se voit."',
  ],
  draw(ctx){
    ctx.fillStyle=C.posterBg; ctx.fillRect(0,0,2*S,2*S);
    ctx.fillStyle='#600000'; ctx.fillRect(SCALE,SCALE,2*S-SCALE*2,2*S-SCALE*2);
    // Skull pixel art
    ctx.fillStyle='#f0e0b0';
    [[3,2,8,6],[2,3,2,4],[10,3,2,4],[2,8,10,2],[3,10,2,2],[9,10,2,2]].forEach(([c,r,w,h])=>px(ctx,c,r,w,h,'#f0e0b0'));
    // eye sockets
    px(ctx,3,4,2,3,'#400000'); px(ctx,9,4,2,3,'#400000');
    // Text bars
    ctx.fillStyle=C.posterText; ctx.fillRect(SCALE*2,S+SCALE*2,2*S-SCALE*4,SCALE*3);
    ctx.fillStyle='#ff8080'; ctx.fillRect(SCALE*3,S+SCALE*7,2*S-SCALE*6,SCALE*2);
    // Pin
    ctx.fillStyle='#c8c8c8'; ctx.fillRect(S-SCALE,0,SCALE*2,SCALE*2);
    // Torn corner
    ctx.fillStyle=C.wallMid;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(SCALE*4,0); ctx.lineTo(0,SCALE*4); ctx.fill();
    ctx.strokeStyle='#ff2d00'; ctx.lineWidth=1;
    ctx.strokeRect(SCALE,SCALE,2*S-SCALE*2,2*S-SCALE*2);
  }
});

/* ══════════════════════════════════════════
   BATHROOM  (bottom-left, x=0..5, y=7..10)
   ══════════════════════════════════════════ */

/* TOILET — corner of bathroom */
OBJECTS.push({
  tx:1,ty:7,w:2,h:3,
  label:'WC',
  lines:[
    '"Fonctionne à 60%. Les 40% restants, on n\'en parle pas."',
    '"L\'eau est d\'une couleur que l\'on qualifie de \'mystique\'."',
    '"Il y a des stries sur le mur : le calendrier."',
  ],
  draw(ctx){
    // Tank
    ctx.fillStyle=C.toiletBody; ctx.fillRect(SCALE*2,0,2*S-SCALE*4,S+SCALE*2);
    ctx.fillStyle=C.toiletLid; ctx.fillRect(SCALE*2,0,2*S-SCALE*4,SCALE*2);
    ctx.fillStyle='#d0d8d0'; ctx.fillRect(S-SCALE,SCALE*3,SCALE*2,SCALE*2);// button
    // Bowl
    ctx.fillStyle=C.toiletBody; ctx.fillRect(0,S+SCALE*2,2*S,2*S-SCALE*4);
    ctx.fillStyle=C.toiletLid; ctx.fillRect(0,S+SCALE*2,2*S,SCALE*2);
    ctx.fillStyle=C.toiletBowl; ctx.fillRect(SCALE*2,S+SCALE*4,2*S-SCALE*4,2*S-SCALE*8);
    ctx.fillStyle='rgba(60,80,100,0.65)'; ctx.fillRect(SCALE*3,S+SCALE*6,2*S-SCALE*6,2*S-SCALE*10);
    // Mystery colour
    ctx.fillStyle='rgba(80,120,60,0.35)'; ctx.fillRect(SCALE*4,S+SCALE*8,2*S-SCALE*8,SCALE*3);
    // Calendar marks
    ctx.fillStyle='#8a7060';
    for(let i=0;i<5;i++) ctx.fillRect(2*S+SCALE*2+i*SCALE*3,SCALE*2,SCALE,SCALE*4);
    ctx.fillRect(2*S+SCALE*2,SCALE*8,SCALE*12,SCALE);
  }
});

/* SINK — next to toilet */
OBJECTS.push({
  tx:3,ty:7,w:2,h:2,
  label:'Évier',
  lines:[
    '"L\'eau chaude est morte en 2020. L\'eau froide est tiède."',
    '"Jean-Pierre le cafard vit sous le robinet."',
    '"4 tasses. Dans l\'évier. Depuis lundi."',
  ],
  draw(ctx){
    // Cabinet
    ctx.fillStyle=C.tableTop; ctx.fillRect(0,S,2*S,S);
    ctx.fillStyle=C.tableLeg; ctx.fillRect(SCALE,S+SCALE*2,2*S-SCALE*2,S-SCALE*2);
    // Sink body
    ctx.fillStyle=C.sinkBody; ctx.fillRect(0,0,2*S,S);
    ctx.fillStyle=C.sinkBowl; ctx.fillRect(SCALE*2,SCALE*2,2*S-SCALE*4,S-SCALE*4);
    ctx.fillStyle='#5a6060'; ctx.fillRect(SCALE*3,SCALE*3,2*S-SCALE*6,S-SCALE*6);
    // Tap
    ctx.fillStyle=C.sinkTap;
    ctx.fillRect(S-SCALE,0,SCALE*2,SCALE*5);
    ctx.fillRect(S-SCALE*3,0,SCALE*2,SCALE*2);
    ctx.fillRect(S+SCALE,0,SCALE*2,SCALE*2);
    // Green water
    ctx.fillStyle='rgba(50,90,50,0.5)'; ctx.fillRect(SCALE*3,S-SCALE*4,2*S-SCALE*6,SCALE*3);
    // Jean-Pierre the cockroach
    ctx.fillStyle='#1a1008'; ctx.fillRect(SCALE,S-SCALE,SCALE*3,SCALE*2);
    ctx.fillRect(SCALE,S-SCALE,SCALE*6,SCALE); // antennae
    ctx.fillRect(SCALE*4,S-SCALE*2,SCALE,SCALE*3);
    // Crack
    ctx.strokeStyle='#2a1800'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(SCALE*5,S+SCALE); ctx.lineTo(SCALE*7,S+S-SCALE*2); ctx.stroke();
  }
});

/* TRASH BAG in bathroom corner */
OBJECTS.push({
  tx:5,ty:8,w:1,h:2,
  label:'Poubelle',
  lines:[
    '"Le sac poubelle de la semaine dernière. Toujours là."',
    '"Tu en as mis un nouveau par-dessus. Technique."',
  ],
  draw(ctx){
    ctx.fillStyle=C.trashBag; ctx.fillRect(SCALE,S,S-SCALE*2,S);
    ctx.fillStyle=C.trashBagT; ctx.fillRect(0,S,S,SCALE*2);
    ctx.fillStyle='#404040'; ctx.fillRect(S/2-SCALE,S-SCALE,SCALE*2,SCALE);
    // Old bag peeking below
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(SCALE*2,2*S-SCALE,S-SCALE*4,SCALE);
  }
});

/* ══════════════════════════════════════════
   LIVING ROOM (right side, x=7..23)
   ══════════════════════════════════════════ */

/* TV + STAND — top-right corner, against top wall */
OBJECTS.push({
  tx:16,ty:1,w:4,h:3,
  label:'Télé',
  lines:[
    '"CRT 1994. Une chaîne : météo du Kazakhstan."',
    '"L\'image clignote. C\'est pas la télé. C\'est toi."',
    '"Scotchée avec 4 bandes de ruban adhésif. Solide."',
  ],
  draw(ctx){
    // TV stand
    ctx.fillStyle=C.tableLeg; ctx.fillRect(S,2*S+SCALE*2,2*S,S-SCALE*2);
    ctx.fillStyle=C.tableTop; ctx.fillRect(0,2*S,4*S,SCALE*3);
    ctx.fillStyle=C.tableLeg; ctx.fillRect(SCALE*2,2*S+SCALE*3,4*S-SCALE*4,S-SCALE*3);
    // TV body
    ctx.fillStyle=C.tvBody; ctx.fillRect(SCALE*2,0,4*S-SCALE*4,2*S);
    // Bezel
    ctx.fillStyle='#111'; ctx.fillRect(SCALE*4,SCALE*3,4*S-SCALE*8,2*S-SCALE*6);
    // Screen
    ctx.fillStyle=C.tvScreenOn; ctx.fillRect(SCALE*5,SCALE*4,4*S-SCALE*10,2*S-SCALE*8);
    // Scanlines
    for(let sl=SCALE*4;sl<2*S-SCALE*7;sl+=SCALE*2){
      ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(SCALE*5,sl,4*S-SCALE*10,SCALE);
    }
    // Snow/flicker
    if(Math.floor(Date.now()/150)%7===0){
      ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(SCALE*5,SCALE*4,4*S-SCALE*10,2*S-SCALE*8);
    }
    // Antennas
    ctx.strokeStyle='#333'; ctx.lineWidth=SCALE;
    ctx.beginPath(); ctx.moveTo(1.5*S*SCALE,0); ctx.lineTo((1.5*S-14)*SCALE,-9*SCALE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2.5*S*SCALE,0); ctx.lineTo((2.5*S+10)*SCALE,-9*SCALE); ctx.stroke();
    // Speaker grille
    for(let d=0;d<5;d++){ctx.fillStyle='#2a2a2a'; ctx.fillRect(SCALE*3,(TILE+d*3)*SCALE,SCALE*2,SCALE);}
    // VHS slot + label
    ctx.fillStyle='#0a0a0a'; ctx.fillRect(SCALE*4,2*S-SCALE*5,S,SCALE*3);
    ctx.fillStyle='#ff2d00'; ctx.fillRect(SCALE*5,2*S-SCALE*5,S-SCALE*2,SCALE*2);
    ctx.fillStyle='#fff'; ctx.font=`${SCALE*2}px monospace`;
    ctx.textBaseline='top'; ctx.textAlign='left'; ctx.fillText('VHS',SCALE*6,(2*S-SCALE*4)*1);
    // Scotch tape strip
    ctx.fillStyle='rgba(200,200,160,0.3)'; ctx.fillRect(SCALE*2,2*S-SCALE,4*S-SCALE*4,SCALE*2);
    // Power indicator LED
    ctx.fillStyle=Math.floor(Date.now()/800)%2===0?'#00ff40':'#004010';
    ctx.fillRect(4*S-SCALE*5,2*S-SCALE*4,SCALE,SCALE);
  }
});

/* MAIN TABLE + CHAIRS (centre of living room) */
OBJECTS.push({
  tx:10,ty:5,w:4,h:2,
  hx:10,hy:5,hw:4,hh:2,
  label:'Table à manger',
  lines:[
    '"Une table avec 3 pattes et 1 encyclopédie Larousse."',
    '"Gravé dessus : \'SORTEZ D\'ICI\'. Quelqu\'un savait."',
    '"Dessus : cendrier plein, bouteille vide, espoir néant."',
  ],
  draw(ctx){
    // Legs (3 + book)
    ctx.fillStyle=C.tableLeg;
    ctx.fillRect(0,S+SCALE*2,SCALE*2,S-SCALE*2);
    ctx.fillRect(4*S-SCALE*2,S+SCALE*2,SCALE*2,S-SCALE*2);
    ctx.fillRect(S*2,S+SCALE*2,SCALE*2,S-SCALE*4); // short leg
    // Encyclopedia
    ctx.fillStyle='#4a2060'; ctx.fillRect(S*2-SCALE*2,2*S-SCALE*3,S+SCALE*2,SCALE*3);
    ctx.fillStyle='#6a3080'; ctx.fillRect(S*2-SCALE*2,2*S-SCALE*3,S+SCALE*2,SCALE);
    // Tabletop
    ctx.fillStyle=C.tableTop; ctx.fillRect(0,SCALE*2,4*S,S);
    ctx.fillStyle='#9a6838'; ctx.fillRect(0,SCALE*2,4*S,SCALE*2);
    // Engraving
    ctx.strokeStyle='#3a1800'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(S,SCALE*4); ctx.lineTo(3*S,SCALE*4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(S,SCALE*7); ctx.lineTo(3*S,SCALE*7); ctx.stroke();
    // Ashtray
    ctx.fillStyle='#444'; ctx.fillRect(SCALE*3,0,SCALE*5,SCALE*3);
    ctx.fillStyle='#2a2a2a'; ctx.fillRect(SCALE*4,SCALE,SCALE*3,SCALE);
    ctx.fillStyle='rgba(80,80,80,0.4)'; ctx.fillRect(SCALE*3,-SCALE*2,SCALE*5,SCALE*2);// smoke
    // Bottle
    ctx.fillStyle=C.bottleBody; ctx.fillRect(S*2+SCALE*2,0,SCALE*3,SCALE*5);
    ctx.fillStyle=C.bottleCap; ctx.fillRect(S*2+SCALE*2,0,SCALE*3,SCALE);
    ctx.fillStyle='rgba(255,255,200,0.25)'; ctx.fillRect(S*2+SCALE*3,SCALE,SCALE,SCALE*3);
    // Papers
    ctx.fillStyle='#c8c090'; ctx.fillRect(S*3+SCALE,0,S-SCALE,SCALE*2);
    ctx.fillStyle='#a8a070'; ctx.fillRect(S*3+SCALE*2,0,S-SCALE*2,SCALE);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,2*S-SCALE,4*S,SCALE);
  }
});

/* CHAIR LEFT of table */
OBJECTS.push({
  tx:9,ty:5,w:2,h:2,
  label:'Chaise',
  lines:['"Pied fissuré. S\'asseoir c\'est de la roulette russe."'],
  draw(ctx){
    ctx.fillStyle=C.chairBack; ctx.fillRect(SCALE,0,2*S-SCALE*2,S+SCALE*2);
    ctx.fillStyle=C.chairSeat; ctx.fillRect(SCALE,0,SCALE*2,S+SCALE*2);
    ctx.fillRect(2*S-SCALE*3,0,SCALE*2,S+SCALE*2);
    ctx.fillStyle=C.chairSeat; ctx.fillRect(0,S+SCALE*2,2*S,S-SCALE*4);
    ctx.fillStyle=C.chairBack; ctx.fillRect(0,S+SCALE*2,2*S,SCALE*2);
    ctx.fillStyle=C.tableLeg;
    ctx.fillRect(0,2*S-SCALE*4,SCALE*2,SCALE*4);
    ctx.fillRect(2*S-SCALE*2,2*S-SCALE*4,SCALE*2,SCALE*4);
    ctx.strokeStyle='#1a0800'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,2*S); ctx.lineTo(SCALE*3,(2*S-SCALE*4)*1); ctx.stroke();
  }
});

/* CHAIR RIGHT of table */
OBJECTS.push({
  tx:14,ty:5,w:2,h:2,
  label:'Chaise',
  lines:['"Chaise de récupération. Elle a vécu."'],
  draw(ctx){
    ctx.fillStyle=C.chairBack; ctx.fillRect(SCALE,0,2*S-SCALE*2,S+SCALE*2);
    ctx.fillStyle=C.chairSeat; ctx.fillRect(SCALE,0,SCALE*2,S+SCALE*2);
    ctx.fillRect(2*S-SCALE*3,0,SCALE*2,S+SCALE*2);
    ctx.fillStyle=C.chairSeat; ctx.fillRect(0,S+SCALE*2,2*S,S-SCALE*4);
    ctx.fillStyle=C.chairBack; ctx.fillRect(0,S+SCALE*2,2*S,SCALE*2);
    ctx.fillStyle=C.tableLeg;
    ctx.fillRect(0,2*S-SCALE*4,SCALE*2,SCALE*4);
    ctx.fillRect(2*S-SCALE*2,2*S-SCALE*4,SCALE*2,SCALE*4);
  }
});

/* SHELF — on right wall */
OBJECTS.push({
  tx:20,ty:4,w:3,h:2,
  hx:20,hy:4,hw:3,hh:1,
  label:'Étagère',
  lines:[
    '"Clouée de travers. Tout penche à gauche."',
    '"Photo encadrée de quelqu\'un que tu ne connais pas."',
    '"Boîtes de conserve vides. Art contemporain."',
  ],
  draw(ctx){
    ctx.fillStyle=C.shelfWall; ctx.fillRect(SCALE,0,SCALE*2,2*S);
    ctx.fillRect(3*S-SCALE*3,0,SCALE*2,2*S);
    ctx.fillStyle=C.shelfBoard; ctx.fillRect(0,S-SCALE*2,3*S,SCALE*3);
    ctx.fillStyle='#9a7038'; ctx.fillRect(0,S-SCALE*3,3*S,SCALE);
    // Can 1
    ctx.fillStyle='#6080a0'; ctx.fillRect(SCALE*2,0,S-SCALE*4,S-SCALE*3);
    ctx.fillStyle='#8090c0'; ctx.fillRect(SCALE*2,0,S-SCALE*4,SCALE*2);
    ctx.fillStyle='#c8c0a0'; ctx.fillRect(SCALE*3,SCALE*3,S-SCALE*6,SCALE);
    // Can 2
    ctx.fillStyle='#a06040'; ctx.fillRect(S+SCALE*2,0,S-SCALE*4,S-SCALE*3);
    ctx.fillStyle='#c08060'; ctx.fillRect(S+SCALE*2,0,S-SCALE*4,SCALE*2);
    // Photo frame
    ctx.fillStyle=C.tableTop; ctx.fillRect(2*S+SCALE,0,S-SCALE*2,S-SCALE*3);
    ctx.fillStyle='#d0c8a0'; ctx.fillRect(2*S+SCALE*2,SCALE,S-SCALE*4,S-SCALE*5);
    ctx.fillStyle='#a0b8d0'; ctx.fillRect(2*S+SCALE*3,SCALE*2,S/2,S/2);
    ctx.fillStyle='#7a8898'; ctx.fillRect(2*S+SCALE*3,SCALE*4,S/2,S/4);
  }
});

/* FRIDGE — kitchen zone, top-right */
OBJECTS.push({
  tx:21,ty:6,w:2,h:4,
  label:'Frigo',
  lines:[
    '"Moutarde périmée depuis Obama, et de l\'espoir."',
    '"Un bruit bizarre sort du frigo. Tu ne cherches pas."',
    '"La jointure est verdâtre. Écologique."',
  ],
  draw(ctx){
    ctx.fillStyle=C.fridgeBody; ctx.fillRect(0,0,2*S,4*S);
    // Freezer seam
    ctx.fillStyle=C.fridgeSeal; ctx.fillRect(0,S+SCALE*2,2*S,SCALE*2);
    // Handle freezer
    ctx.fillStyle=C.fridgeHandle; ctx.fillRect(S+SCALE*3,SCALE*3,SCALE*2,S-SCALE*6);
    // Handle fridge
    ctx.fillRect(S+SCALE*3,S+SCALE*5,SCALE*2,2*S);
    // Rust patch
    ctx.fillStyle='#a06040'; ctx.fillRect(SCALE*2,3*S+SCALE*2,SCALE*4,SCALE*3);
    ctx.fillRect(S-SCALE,3*S+SCALE*6,SCALE*2,SCALE*2);
    // Green mould on seal
    ctx.fillStyle='rgba(40,120,40,0.4)'; ctx.fillRect(0,S+SCALE*2,S,SCALE*2);
    // Dent
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(SCALE*4,SCALE*6,SCALE*6,SCALE);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(2*S-SCALE*2,0,SCALE*2,4*S);
    ctx.fillRect(0,4*S-SCALE*2,2*S,SCALE*2);
    // Fridge note (sticky)
    ctx.fillStyle='#ffe080'; ctx.fillRect(SCALE*3,2*S+SCALE*3,S,S-SCALE*3);
    ctx.fillStyle='#8a6020';
    ctx.font=`${SCALE}px monospace`; ctx.textBaseline='top'; ctx.textAlign='left';
    ctx.fillText('LOYER!!!',(SCALE*4)*1,(2*S+SCALE*4)*1);
  }
});

/* COUNTER/KITCHEN — between sink area and fridge */
OBJECTS.push({
  tx:19,ty:6,w:2,h:2,
  label:'Plan de travail',
  lines:[
    '"Le plan de travail cuisine. Il y a de la farine partout."',
    '"Pourquoi il y a de la farine ? Tu n\'as pas de farine."',
  ],
  draw(ctx){
    // Counter
    ctx.fillStyle='#b0a888'; ctx.fillRect(0,0,2*S,2*S);
    ctx.fillStyle='#d0c8a0'; ctx.fillRect(0,0,2*S,SCALE*2);
    // Dirty cutting board
    ctx.fillStyle='#8a6030'; ctx.fillRect(SCALE*2,SCALE*3,S+SCALE*2,S-SCALE*4);
    ctx.fillStyle='#6a4020'; ctx.fillRect(SCALE*3,SCALE*4,S,S-SCALE*6);
    // Knife
    ctx.fillStyle='#c0c0c0'; ctx.fillRect(SCALE*3,S/2,S+SCALE,SCALE);
    ctx.fillStyle='#8a6030'; ctx.fillRect(SCALE*3,S/2-SCALE,SCALE*4,SCALE*3);
    // Flour powder
    ctx.fillStyle='rgba(240,240,230,0.3)'; ctx.fillRect(0,0,2*S,SCALE*3);
    // Stain
    ctx.fillStyle='rgba(100,80,40,0.4)'; ctx.fillRect(S+SCALE*3,SCALE*5,SCALE*4,SCALE*3);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,2*S-SCALE,2*S,SCALE);
  }
});

/* COUCH — centre-left of living room */
OBJECTS.push({
  tx:8,ty:9,w:5,h:3,
  hx:8,hy:10,hw:5,hh:2,
  label:'Canapé',
  lines:[
    '"Un canapé récupéré sur le trottoir. Comme le reste."',
    '"Il y a 3€47 coincés dans les coussins. C\'est ton budget repas."',
    '"Une tache en forme d\'Italie sur l\'accoudoir gauche."',
  ],
  draw(ctx){
    // Armrests
    ctx.fillStyle='#5a3820'; ctx.fillRect(0,S,S,2*S); ctx.fillRect(4*S,S,S,2*S);
    ctx.fillStyle='#4a2c10'; ctx.fillRect(0,S,S,SCALE*2); ctx.fillRect(4*S,S,S,SCALE*2);
    // Backrest
    ctx.fillStyle='#7a5030'; ctx.fillRect(S,0,3*S,S+SCALE*2);
    ctx.fillStyle='#9a6840'; ctx.fillRect(S,0,3*S,SCALE*3);
    ctx.fillStyle='#8a5828'; ctx.fillRect(S+SCALE*2,0,S-SCALE*2,S+SCALE*2);
    ctx.fillRect(2*S+SCALE*2,0,S-SCALE*2,S+SCALE*2);
    // Seat cushions
    ctx.fillStyle='#8a6035'; ctx.fillRect(S,S+SCALE*2,3*S,2*S-SCALE*3);
    ctx.fillStyle='#6a4820'; ctx.fillRect(S,S+SCALE*2,3*S,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(2*S-SCALE,S+SCALE*2,SCALE*2,2*S-SCALE*3); // cushion seam
    ctx.fillRect(3*S-SCALE,S+SCALE*2,SCALE*2,2*S-SCALE*3);
    // Italy stain
    ctx.fillStyle='rgba(120,80,40,0.45)';
    ctx.fillRect(SCALE*2,S+SCALE*3,SCALE*5,SCALE*4);
    ctx.fillRect(SCALE*3,S+SCALE*7,SCALE*3,SCALE*2);
    // Coins between cushions
    ctx.fillStyle=C.coinGold; ctx.fillRect(2*S+SCALE,S+SCALE*4,SCALE,SCALE);
    ctx.fillRect(2*S+SCALE*3,S+SCALE*6,SCALE,SCALE);
    // Leg marks
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(S,3*S-SCALE,S,SCALE); ctx.fillRect(3*S,3*S-SCALE,S,SCALE);
  }
});

/* BUCKET under drip (ceiling leak) */
OBJECTS.push({
  tx:15,ty:10,w:1,h:2,
  label:'Seau',
  lines:[
    '"Soupe du plafond. Tu l\'as pas vidé depuis mardi."',
    '"Il y a quelque chose qui nage dedans. Tu t\'en fous."',
  ],
  draw(ctx){
    ctx.strokeStyle=C.bucketHandle; ctx.lineWidth=SCALE;
    ctx.beginPath(); ctx.arc(S/2,S*0.55,S*0.28,Math.PI,0); ctx.stroke();
    ctx.fillStyle='#3858a0'; ctx.fillRect(SCALE,S*0.5+SCALE,S-SCALE*2,S+SCALE);
    ctx.fillStyle=C.bucketBody; ctx.fillRect(0,S*0.5,S,S);
    ctx.fillStyle='#80a0c0'; ctx.fillRect(0,S*0.5,S,SCALE*2);
    ctx.fillStyle=C.bucketDirt; ctx.fillRect(SCALE,2*S-SCALE*5,S-SCALE*2,SCALE*4);
    ctx.fillStyle='rgba(100,80,40,0.5)'; ctx.fillRect(SCALE,2*S-SCALE*5,S-SCALE*2,SCALE);
    // drip from ceiling
    ctx.fillStyle='rgba(100,130,160,0.7)';
    ctx.fillRect(S/2-SCALE/2,-S*0.3,SCALE,S*0.3);
  }
});

/* MYSTERIOUS BOX */
OBJECTS.push({
  tx:1,ty:12,w:2,h:2,
  label:'Boîte de G. Mouton',
  lines:[
    '"\'NE PAS TOUCHER — G. MOUTON\'. G. Mouton est mort en 2019."',
    '"Elle fait un bruit d\'eau. Ce n\'est pas de l\'eau."',
    '"La boîte te regarde. Ou c\'est toi."',
  ],
  draw(ctx){
    ctx.fillStyle=C.boxBrown; ctx.fillRect(0,SCALE*2,2*S,2*S-SCALE*2);
    ctx.fillStyle=C.boxTape;
    ctx.fillRect(S-SCALE,SCALE*2,SCALE*2,2*S-SCALE*2); // vertical tape
    ctx.fillRect(0,S,2*S,SCALE*2); // horizontal tape
    // Top flaps
    ctx.fillStyle='#7a4a20';
    ctx.fillRect(0,0,S-SCALE*3,SCALE*3); ctx.fillRect(S+SCALE*3,0,S-SCALE*3,SCALE*3);
    // Stamp
    ctx.fillStyle='rgba(180,0,0,0.4)'; ctx.fillRect(SCALE*3,S+SCALE,S+SCALE,S/2);
    ctx.fillStyle='#c04040'; ctx.font=`${SCALE*3}px monospace`;
    ctx.textBaseline='top'; ctx.textAlign='left';
    ctx.fillText('!',(SCALE*4)*1,(S+SCALE*2)*1);
    // Moisture stain
    ctx.fillStyle='rgba(60,80,60,0.25)'; ctx.fillRect(SCALE,S+SCALE*4,S/2,S/2);
  }
});

/* TRASH PILE */
OBJECTS.push({
  tx:1,ty:14,w:3,h:2,
  label:'Tas de déchets',
  lines:[
    '"Un système d\'organisation que toi seul comprends."',
    '"3 télécommandes orphelines, 1 rolodex, et la vérité."',
    '"RICHE ou tétanos. Probablement tétanos."',
  ],
  draw(ctx){
    // Bags
    ctx.fillStyle=C.trashBag; ctx.fillRect(0,S,3*S,S);
    ctx.fillStyle=C.trashBagT; ctx.fillRect(0,S,3*S,SCALE*2);
    // Knots
    ctx.fillStyle='#484848';
    ctx.fillRect(S-SCALE*3,S-SCALE,SCALE*5,SCALE); ctx.fillRect(2*S+SCALE,S-SCALE,SCALE*4,SCALE);
    // Junk: plank, bottle, can, remote
    ctx.fillStyle='#7a5020'; ctx.fillRect(SCALE,S-SCALE*5,S+SCALE*2,SCALE*4);
    ctx.fillStyle=C.bottleBody; ctx.fillRect(2*S-SCALE,S-SCALE*6,SCALE*3,SCALE*6);
    ctx.fillStyle=C.bottleCap; ctx.fillRect(2*S-SCALE,S-SCALE*6,SCALE*3,SCALE);
    ctx.fillStyle='#6080a0'; ctx.fillRect(2*S+SCALE*4,S-SCALE*4,SCALE*5,SCALE*4);
    // Remote
    ctx.fillStyle='#2a2a2a'; ctx.fillRect(SCALE*2,S-SCALE*3,SCALE*3,SCALE*5);
    ctx.fillStyle='#c03020'; ctx.fillRect(SCALE*3,S-SCALE*2,SCALE,SCALE);
  }
});

/* CLOCK on wall */
OBJECTS.push({
  tx:11,ty:1,w:1,h:1,
  hx:0,hy:0,hw:0,hh:0,
  label:'Horloge cassée',
  lines:[
    '"4h23 depuis 6 mois. Piles mortes. Flemme."',
    '"\'Il est toujours l\'heure quelque part.\' Toi tu t\'en fous."',
  ],
  draw(ctx){
    ctx.fillStyle=C.clockBody; ctx.fillRect(SCALE,SCALE,S-SCALE*2,S-SCALE*2);
    ctx.fillStyle=C.clockFace; ctx.fillRect(SCALE*3,SCALE*3,S-SCALE*6,S-SCALE*6);
    // Hour marks
    ctx.fillStyle='#2a1800';
    for(let i=0;i<12;i++){
      const a=-Math.PI/2+i*Math.PI*2/12;
      const r=(S/2-SCALE*4);
      ctx.fillRect(S/2+Math.cos(a)*r-0.5,S/2+Math.sin(a)*r-0.5,SCALE,SCALE);
    }
    const cx=S/2,cy=S/2;
    ctx.strokeStyle='#1a1200'; ctx.lineWidth=SCALE;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx+Math.cos(-Math.PI/2+2*Math.PI*4/12)*SCALE*5,cy+Math.sin(-Math.PI/2+2*Math.PI*4/12)*SCALE*5);
    ctx.stroke();
    ctx.lineWidth=SCALE*0.6;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx+Math.cos(-Math.PI/2+2*Math.PI*23/60)*SCALE*6,cy+Math.sin(-Math.PI/2+2*Math.PI*23/60)*SCALE*6);
    ctx.stroke();
    ctx.fillStyle='#1a1200'; ctx.fillRect(cx-SCALE,cy-SCALE,SCALE*2,SCALE*2);
  }
});

/* ── PLUNGER — PICKABLE WEAPON (19,12) ── */
OBJECTS.push({
  tx:19,ty:12,w:1,h:2,
  label:'Ventouse Sacrée ★',
  pickable:true, itemId:'plunger',
  itemName:'Ventouse Sacrée',
  itemDesc:'ATK +1 | Dégâts certifiés sur rongeurs et créanciers.',
  lines:[
    '"LA ventouse. Ton seul outil. Ta seule arme."',
    '"Elle brille d\'une aura étrange. +1 Débrouillardise."',
    '"[ E pour RAMASSER ]"',
  ],
  draw(ctx){
    const glow=0.12+0.08*Math.sin(Date.now()/400);
    ctx.fillStyle=`rgba(255,220,0,${glow})`; ctx.fillRect(-SCALE*3,-SCALE*3,S+SCALE*6,2*S+SCALE*6);
    // Stick
    ctx.fillStyle=C.plungerStick; ctx.fillRect(S/2-SCALE,0,SCALE*2,2*S-SCALE*5);
    ctx.fillStyle='#6a4020'; ctx.fillRect(S/2-SCALE,0,SCALE,2*S-SCALE*5);
    // Cup
    ctx.fillStyle=C.plungerCup;
    ctx.fillRect(SCALE*2,2*S-SCALE*6,S-SCALE*4,SCALE*5);
    ctx.fillRect(0,2*S-SCALE*4,S,SCALE*3);
    ctx.fillStyle=C.plungerCupD; ctx.fillRect(0,2*S-SCALE*2,S,SCALE*2);
    // Highlight on cup
    ctx.fillStyle='rgba(255,100,80,0.4)'; ctx.fillRect(SCALE*2,2*S-SCALE*5,SCALE*3,SCALE*3);
    // Sparkles
    const t=Date.now()/300;
    ctx.fillStyle='#ffe600';
    [[0,0],[2.1,0],[4.2,0]].forEach(([a],i)=>{
      const sx=Math.cos(t+i*2.1)*SCALE*5+S/2;
      const sy=Math.sin(t+i*2.1)*SCALE*4+S*0.6;
      ctx.fillRect(sx-SCALE/2,sy-SCALE/2,SCALE,SCALE);
    });
  }
});

/* ── RAT KEVIN — MOB (14,13) — KILLABLE ── */
let kevinAlive = true;
let kevinHitTimer = 0;       // flash timer when hit
let kevinDeathTimer = -1;    // counts up after kill

OBJECTS.push({
  tx:14, ty:13, w:1, h:1,
  isMob: true, mobId:'kevin',
  label:'Kevin',
  get alive(){ return kevinAlive; },
  lines:[
    '"C\'est Kevin. Pas de loyer. Là depuis plus longtemps."',
    '"Kevin te regarde avec mépris. Kevin s\'en sort mieux."',
    '"Kevin a un plan. Kevin ne partage pas."',
  ],
  draw(ctx){
    if(!kevinAlive){
      // Dead Kevin — on his back, Xs for eyes
      ctx.globalAlpha = Math.max(0, 1 - (kevinDeathTimer-30)/60);
      // Body on back
      ctx.fillStyle=C.ratDead; ctx.fillRect(SCALE,SCALE*5,S-SCALE*2,S-SCALE*6);
      ctx.fillRect(SCALE*2,SCALE*3,S-SCALE*4,S-SCALE*2);
      // Legs up
      ctx.fillStyle='#3a2818';
      ctx.fillRect(SCALE*2,0,SCALE*2,SCALE*4);
      ctx.fillRect(S-SCALE*4,0,SCALE*2,SCALE*4);
      // X eyes
      ctx.strokeStyle='#ff4040'; ctx.lineWidth=SCALE;
      const ex1=SCALE*4, ey=SCALE*4;
      ctx.beginPath(); ctx.moveTo(ex1,ey); ctx.lineTo(ex1+SCALE*2,ey+SCALE*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex1+SCALE*2,ey); ctx.lineTo(ex1,ey+SCALE*2); ctx.stroke();
      const ex2=S-SCALE*6;
      ctx.beginPath(); ctx.moveTo(ex2,ey); ctx.lineTo(ex2+SCALE*2,ey+SCALE*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex2+SCALE*2,ey); ctx.lineTo(ex2,ey+SCALE*2); ctx.stroke();
      // Stars
      ctx.fillStyle='#ffe600';
      ctx.font=`${SCALE*3}px serif`;
      ctx.textBaseline='top'; ctx.textAlign='center';
      ctx.fillText('★',S/2,-SCALE*5);
      ctx.globalAlpha=1;
      return;
    }

    // Alive Kevin — pixel art rat with wander animation
    const wobble = Math.sin(Date.now()/400)*SCALE*0.5;

    // Hit flash overlay
    const isFlashing = kevinHitTimer>0;
    if(isFlashing){ ctx.globalAlpha=0.5; ctx.fillStyle=C.hitFlash; ctx.fillRect(0,0,S,S); ctx.globalAlpha=1; }

    ctx.save(); ctx.translate(0, wobble);

    // Shadow
    ctx.globalAlpha=0.2; ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(S/2,S*0.92,S*0.28,S*0.07,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;

    // Body
    ctx.fillStyle=C.ratBody;
    ctx.fillRect(SCALE*4,SCALE*4,S-SCALE*8,S-SCALE*7);
    // Head
    ctx.fillRect(0,SCALE*2,S-SCALE*7,S-SCALE*8);
    // Ears
    ctx.fillStyle=C.ratEar; ctx.fillRect(0,0,SCALE*4,SCALE*4);
    ctx.fillRect(SCALE*5,0,SCALE*3,SCALE*3);
    ctx.fillStyle='#c08080'; ctx.fillRect(SCALE,SCALE,SCALE*2,SCALE*2);
    ctx.fillRect(SCALE*5+SCALE/2,SCALE/2,SCALE,SCALE);
    // Eye
    ctx.fillStyle=C.ratEye; ctx.fillRect(SCALE*2,SCALE*4,SCALE*2,SCALE*2);
    ctx.fillStyle='#ff8080'; ctx.fillRect(SCALE*3,SCALE*4,SCALE,SCALE); // glint
    // Nose
    ctx.fillStyle='#ff8080'; ctx.fillRect(0,SCALE*6,SCALE*2,SCALE);
    // Mouth
    ctx.strokeStyle='#2a1808'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,SCALE*7*1); ctx.lineTo(SCALE*2,SCALE*8*1); ctx.stroke();
    // Tail
    ctx.strokeStyle='#2a1a10'; ctx.lineWidth=SCALE*0.8;
    ctx.beginPath();
    ctx.moveTo((S-SCALE*2)*1,(SCALE*10)*1);
    ctx.quadraticCurveTo(S*1,(SCALE*15)*1,(S+SCALE*5)*1,(SCALE*12)*1);
    ctx.stroke();
    // Whiskers
    ctx.strokeStyle='#c8b090'; ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo(0,SCALE*6*1); ctx.lineTo(-SCALE*5,SCALE*5*1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,SCALE*7*1); ctx.lineTo(-SCALE*5,SCALE*8*1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,SCALE*6*1); ctx.lineTo(-SCALE*4,SCALE*6*1); ctx.stroke();

    ctx.restore();
  }
});

/* ── COIN REWARD — appears after Kevin death ── */
let coinVisible = false;
let coinTx = 14, coinTy = 13;
OBJECTS.push({
  tx:14, ty:13, w:1, h:1,
  isCoin:true,
  hx:0, hy:0, hw:0, hh:0,
  label:'1€',
  lines:['★ +1€ ramassé ! Kevin n\'aurait pas dû.'  ],
  get _skip(){ return !coinVisible; },
  draw(ctx){
    if(!coinVisible) return;
    const bob=Math.sin(Date.now()/250)*SCALE;
    ctx.save(); ctx.translate(0,bob);
    ctx.fillStyle=C.coinGold;
    ctx.beginPath(); ctx.ellipse(S/2,S/2,SCALE*4,SCALE*4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.coinGoldD;
    ctx.beginPath(); ctx.ellipse(S/2,S/2,SCALE*3,SCALE*3,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.coinGold;
    ctx.beginPath(); ctx.ellipse(S/2,S/2,SCALE*2,SCALE*2,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffffa0';
    ctx.font=`bold ${SCALE*4}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('€',S/2,S/2);
    // sparkle
    ctx.fillStyle='#ffe600'; ctx.fillRect(S/2-SCALE*6,S/2-SCALE,SCALE,SCALE);
    ctx.fillRect(S/2+SCALE*5,S/2-SCALE,SCALE,SCALE);
    ctx.restore();
  }
});

/* ─── PLAYER ─────────────────────────────────────── */
let player = {
  tx:3.0, ty:5.5,   // spawn in front of bed
  facing:'down',
  frame:0, frameTimer:0,
  attackTimer:0,     // attack flash
  money:0, dignity:0,
  inventory:[],
  weapon:null,
};

/* ─── INPUT ──────────────────────────────────────── */
const keys={};
document.addEventListener('keydown',e=>{
  keys[e.key.toLowerCase()]=true;
  if(e.key.toLowerCase()==='e') tryInteract();
  if(e.key.toLowerCase()==='q') toggleInventory();
  if(e.key==='Escape') togglePause();
});
document.addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; });

/* ─── STATE ──────────────────────────────────────── */
let gameState='playing';
let dialogQueue=[],dialogIdx=0,dialogObj=null;
let pendingPickup=null;

/* ─── CANVAS ─────────────────────────────────────── */
let canvas,ctx,uiCanvas,uiCtx;

function startWorld(){
  const wrapper=document.createElement('div');
  wrapper.id='game-wrapper';
  wrapper.style.cssText=
    'position:fixed;inset:0;z-index:300;background:#0e0800;'+
    'display:flex;align-items:center;justify-content:center;overflow:hidden;'+
    'cursor:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'><text y=\'24\' font-size=\'24\'>💸</text></svg>") 16 16, auto;';
  canvas=document.createElement('canvas');
  canvas.style.cssText='image-rendering:pixelated;image-rendering:crisp-edges;position:absolute;';
  uiCanvas=document.createElement('canvas');
  uiCanvas.style.cssText='position:absolute;top:0;left:0;image-rendering:pixelated;pointer-events:none;';
  wrapper.appendChild(canvas); wrapper.appendChild(uiCanvas);
  document.body.appendChild(wrapper);
  ctx=canvas.getContext('2d'); uiCtx=uiCanvas.getContext('2d');
  ctx.imageSmoothingEnabled=uiCtx.imageSmoothingEnabled=false;
  resizeGame();
  window.addEventListener('resize',resizeGame);
  setTimeout(()=>{
    showDialog(null,[
      '📢 MARDI, 07H43.',
      '"Loyer dû dans 3 jours. Solde : -3,47€."',
      '"La ventouse est dans la cuisine. Kevin traîne dans le salon."',
      '"Aujourd\'hui ça change. Peut-être."',
    ]);
  },400);
  requestAnimationFrame(gameLoop);
}

function resizeGame(){
  const W=window.innerWidth,H=window.innerHeight;
  const mapW=COLS*S,mapH=ROWS*S;
  canvas.width=mapW; canvas.height=mapH;
  const fit=Math.min(W/mapW,H/mapH);
  canvas.style.width=mapW*fit+'px'; canvas.style.height=mapH*fit+'px';
  canvas.style.left=((W-mapW*fit)/2)+'px'; canvas.style.top=((H-mapH*fit)/2)+'px';
  uiCanvas.width=W; uiCanvas.height=H;
  uiCanvas.style.width=W+'px'; uiCanvas.style.height=H+'px';
}

/* ─── LOOP ───────────────────────────────────────── */
let lastTime=0;
function gameLoop(ts){
  const dt=Math.min((ts-lastTime)/1000,0.05); lastTime=ts;
  if(gameState==='playing') updatePlayer(dt);
  // Timers
  if(kevinHitTimer>0) kevinHitTimer=Math.max(0,kevinHitTimer-dt*8);
  if(kevinDeathTimer>=0) kevinDeathTimer+=dt*60;
  if(player.attackTimer>0) player.attackTimer=Math.max(0,player.attackTimer-dt*8);
  drawWorld(); drawUI();
  requestAnimationFrame(gameLoop);
}

/* ─── UPDATE ─────────────────────────────────────── */
const SPEED=6;
function updatePlayer(dt){
  let dx=0,dy=0;
  if(keys['w']||keys['arrowup'])    dy=-1;
  if(keys['s']||keys['arrowdown'])  dy= 1;
  if(keys['a']||keys['arrowleft'])  dx=-1;
  if(keys['d']||keys['arrowright']) dx= 1;
  if(dx&&dy){dx*=0.707;dy*=0.707;}
  if(dx||dy){
    const nx=player.tx+dx*SPEED*dt, ny=player.ty+dy*SPEED*dt;
    if(!isSolid(nx,player.ty)) player.tx=nx;
    if(!isSolid(player.tx,ny)) player.ty=ny;
    if(Math.abs(dx)>Math.abs(dy)) player.facing=dx>0?'right':'left';
    else player.facing=dy>0?'down':'up';
    player.frameTimer+=dt;
    if(player.frameTimer>0.12){player.frameTimer=0;player.frame=(player.frame+1)%4;}
  } else player.frame=0;
}

function isSolid(tx,ty){
  const col=Math.floor(tx),row=Math.floor(ty);
  if(col<0||row<0||col>=COLS||row>=ROWS) return true;
  const t=MAP[row]?.[col];
  if(SOLID_TILES.has(t)) return true;
  for(const obj of OBJECTS){
    if(obj.isCoin) continue;
    if(obj._skip) continue;
    if(!obj.alive&&obj.isMob) continue;
    const hx=obj.hx!==undefined?obj.hx:obj.tx;
    const hy=obj.hy!==undefined?obj.hy:obj.ty;
    const hw=obj.hx!==undefined?obj.hw:obj.w;
    const hh=obj.hy!==undefined?obj.hh:obj.h;
    if(hw===0||hh===0) continue;
    if(tx+0.3>hx&&tx+0.7<hx+hw&&ty+0.3>hy&&ty+0.7<hy+hh) return true;
  }
  return false;
}

/* ─── INTERACT ───────────────────────────────────── */
function tryInteract(){
  if(gameState==='dialog'){
    dialogIdx++;
    if(dialogIdx>=dialogQueue.length){
      if(pendingPickup){
        doPickup(pendingPickup); pendingPickup=null;
      } else if(pendingCoin){
        collectCoin(); pendingCoin=false;
      } else {
        gameState='playing'; dialogObj=null;
      }
    }
    return;
  }
  if(gameState!=='playing') return;

  const off={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const [ox,oy]=off[player.facing];
  const cx=Math.floor(player.tx)+ox, cy=Math.floor(player.ty)+oy;
  const px_=Math.floor(player.tx), py_=Math.floor(player.ty);

  for(const obj of OBJECTS){
    if(obj._skip) continue;
    const inRange=
      (cx>=obj.tx&&cx<obj.tx+obj.w&&cy>=obj.ty&&cy<obj.ty+obj.h)||
      (px_>=obj.tx&&px_<obj.tx+obj.w&&py_>=obj.ty&&py_<obj.ty+obj.h);
    if(!inRange) continue;

    // Coin collect
    if(obj.isCoin && coinVisible){
      showDialog(obj,obj.lines);
      pendingCoin=true;
      return;
    }

    // Kevin: attack if weapon
    if(obj.isMob && obj.mobId==='kevin'){
      if(!obj.alive) return;
      if(!player.weapon){
        showDialog(obj,[
          '"Kevin t\'ignore royalement."',
          '"Il te faudrait une arme pour en finir avec lui."',
          '"La ventouse est quelque part dans la maison..."',
        ]);
      } else {
        attackKevin();
      }
      return;
    }

    // Pickable item
    if(obj.pickable){
      if(player.inventory.find(i=>i.id===obj.itemId)){
        showDialog(obj,['"Tu l\'as déjà. Elle est dans ton inventaire."']);
      } else {
        showDialog(obj,obj.lines);
        pendingPickup=obj;
      }
      return;
    }

    showDialog(obj,obj.lines);
    return;
  }

  // Door
  const onDoor=(cx===11||cx===12)&&cy===17||(px_===11||px_===12)&&py_===17;
  if(onDoor) showDialog(null,['"La porte. Le MONDE."','"(L\'extérieur arrive bientôt...)"']);
}

let pendingCoin=false;
function collectCoin(){
  coinVisible=false;
  player.money+=1;
  gameState='playing'; dialogObj=null;
  showDialog(null,[
    '★ +1€ collecté !',
    '"1 euro. Tu es officiellement en train de monter."',
    '"Kevin est mort pour ça. C\'est ce qu\'on appelle le business."',
  ]);
}

/* ─── ATTACK KEVIN ───────────────────────────────── */
function attackKevin(){
  player.attackTimer=1;
  kevinHitTimer=1;
  kevinAlive=false;
  kevinDeathTimer=0;
  // Remove Kevin collision by flagging
  setTimeout(()=>{
    coinVisible=true;
  },800);
  showDialog(null,[
    '★ KEVIN VAINCU avec la Ventouse Sacrée !',
    '"Kevin n\'aurait pas dû traîner là."',
    '"Il laisse tomber quelque chose en mourant..."',
    '"[ Récupère la récompense : 1€ ]"',
  ]);
}

/* ─── PICKUP ─────────────────────────────────────── */
function doPickup(obj){
  player.inventory.push({id:obj.itemId,name:obj.itemName,desc:obj.itemDesc,isWeapon:true,atk:1});
  player.weapon=obj.itemId;
  const idx=OBJECTS.indexOf(obj); if(idx>-1) OBJECTS.splice(idx,1);
  dialogObj=null;
  dialogQueue=[
    '★ RAMASSÉ : '+obj.itemName,
    obj.itemDesc,
    '"Tu brandis la ventouse. Un frisson de pouvoir."',
    '"Kevin a l\'air nerveux. Kevin a raison."',
  ];
  dialogIdx=0; gameState='dialog';
}

function showDialog(obj,lines){
  if(gameState==='dialog') return;
  dialogObj=obj; dialogQueue=lines; dialogIdx=0; gameState='dialog';
}
function toggleInventory(){ if(gameState==='dialog') return; gameState=gameState==='inventory'?'playing':'inventory'; }
function togglePause(){ if(gameState==='dialog'||gameState==='inventory') return; gameState=gameState==='paused'?'playing':'paused'; }

/* ─── DRAW WORLD ─────────────────────────────────── */
function drawWorld(){
  ctx.fillStyle='#0a0604'; ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) drawTile(c,r,MAP[r][c]);
  // Draw objects sorted painter's order (by bottom edge)
  const sorted=[...OBJECTS].sort((a,b)=>(a.ty+a.h)-(b.ty+b.h));
  for(const obj of sorted){
    if(obj._skip) continue;
    ctx.save(); ctx.translate(obj.tx*S,obj.ty*S); obj.draw(ctx); ctx.restore();
  }
  drawPlayer();
  drawHint();
  // Attack slash effect
  if(player.attackTimer>0) drawAttackSlash();
}

function drawAttackSlash(){
  const off={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const [ox,oy]=off[player.facing];
  const x=(player.tx+ox+0.5)*S, y=(player.ty+oy+0.5)*S;
  const a=player.attackTimer;
  ctx.save();
  ctx.globalAlpha=a*0.9;
  ctx.strokeStyle='#ff8040'; ctx.lineWidth=SCALE*2;
  ctx.beginPath();
  ctx.moveTo(x-S*0.5,y-S*0.5); ctx.lineTo(x+S*0.5,y+S*0.5);
  ctx.moveTo(x+S*0.5,y-S*0.5); ctx.lineTo(x-S*0.5,y+S*0.5);
  ctx.stroke();
  ctx.strokeStyle='#ffe600'; ctx.lineWidth=SCALE;
  ctx.beginPath();
  ctx.moveTo(x-S*0.4,y); ctx.lineTo(x+S*0.4,y);
  ctx.moveTo(x,y-S*0.4); ctx.lineTo(x,y+S*0.4);
  ctx.stroke();
  ctx.restore();
}

/* ─── TILES ──────────────────────────────────────── */
function drawTile(col,row,id){
  ctx.save(); ctx.translate(col*S,row*S);
  // Internal divider walls
  if(id===9){  drawDivWallH(); }
  else if(id===65||id==='A'){ drawDivWallV(); }
  else if(id===3||id===8){ drawWallH(); if(id===8) drawHole(); }
  else if(id===4){ drawWallV(); }
  else if(id===5){ drawCorner(); }
  else if(id===6){ drawDoor(col); }
  else if(id===7){ drawWoodFloor(col,row); drawRug(); }
  else if(id===2){ drawWoodFloor(col,row); drawCrack(); }
  else if(id===1){ drawDarkFloor(); }
  else { drawWoodFloor(col,row); }
  ctx.restore();
}

function drawWoodFloor(col,row){
  const v=(col*3+row*7)%3;
  ctx.fillStyle=v===0?C.floorA:v===1?C.floorB:C.floorC;
  ctx.fillRect(0,0,S,S);
  ctx.fillStyle=C.floorDark;
  for(let p=4;p<TILE;p+=4) ctx.fillRect(0,p*SCALE,S,1);
  if((col+row*2)%4===0){
    ctx.globalAlpha=0.1; ctx.fillStyle=C.floorCrack; ctx.fillRect(S*0.3,0,1,S); ctx.globalAlpha=1;
  }
  if((col*5+row*3)%7===0){
    ctx.globalAlpha=0.08; ctx.fillStyle='#2a1800'; ctx.fillRect(0,S*0.6,S,1); ctx.globalAlpha=1;
  }
}
function drawDarkFloor(){
  ctx.fillStyle=C.floorDark; ctx.fillRect(0,0,S,S);
  ctx.fillStyle=C.floorCrack;
  for(let p=4;p<TILE;p+=4) ctx.fillRect(0,p*SCALE,S,1);
}
function drawCrack(){
  ctx.strokeStyle=C.floorCrack; ctx.lineWidth=SCALE*0.5;
  ctx.beginPath(); ctx.moveTo(S*0.2,S*0.1); ctx.lineTo(S*0.45,S*0.5); ctx.lineTo(S*0.35,S*0.85); ctx.stroke();
}
function drawRug(){
  const p=SCALE;
  ctx.fillStyle=C.rugA; ctx.fillRect(p,p,S-2*p,S-2*p);
  ctx.fillStyle=C.rugB; ctx.fillRect(p*3,p*3,S-p*6,S-p*6);
  ctx.fillStyle=C.rugBorder;
  ctx.fillRect(p,p,S-2*p,p); ctx.fillRect(p,S-2*p,S-2*p,p);
  ctx.fillRect(p,p,p,S-2*p); ctx.fillRect(S-2*p,p,p,S-2*p);
  ctx.fillStyle=C.rugAccent; ctx.fillRect(S/2-p,S/2-p,p*2,p*2);
}
function drawWallH(){
  for(let r=0;r<TILE;r+=4){
    ctx.fillStyle=r%8===0?C.wallTop:C.wallMid; ctx.fillRect(0,r*SCALE,S,4*SCALE);
  }
  ctx.fillStyle=C.wallShadow;
  ctx.fillRect(S/3,S*0.5,SCALE,SCALE); ctx.fillRect(S*0.7,S*0.3,SCALE,SCALE);
  ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.fillRect(0,S-SCALE*3,S,SCALE*3);
}
function drawWallV(){
  for(let r=0;r<TILE;r+=4){
    ctx.fillStyle=r%8===0?C.wallMid:C.wallBot; ctx.fillRect(0,r*SCALE,S,4*SCALE);
  }
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(S-SCALE*3,0,SCALE*3,S);
}
function drawCorner(){
  ctx.fillStyle=C.wallBot; ctx.fillRect(0,0,S,S);
  ctx.fillStyle='rgba(0,0,0,0.5)';
  ctx.fillRect(0,S-SCALE*3,S,SCALE*3); ctx.fillRect(S-SCALE*3,0,SCALE*3,S);
}
function drawHole(){
  ctx.fillStyle=C.wallHole;
  ctx.beginPath(); ctx.ellipse(S/2,S/2,S*0.25,S*0.17,0.15,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=C.wallShadow; ctx.lineWidth=SCALE; ctx.stroke();
}
function drawDivWallH(){
  // Thin internal partition — horizontal
  ctx.fillStyle=C.divWall; ctx.fillRect(0,0,S,SCALE*4);
  ctx.fillStyle=C.divWallD; ctx.fillRect(0,SCALE*3,S,SCALE);
}
function drawDivWallV(){
  // Thin internal partition — vertical
  ctx.fillStyle=C.divWall; ctx.fillRect(0,0,SCALE*4,S);
  ctx.fillStyle=C.divWallD; ctx.fillRect(SCALE*3,0,SCALE,S);
}
function drawDoor(col){
  // Floor under door
  drawWoodFloor(col,ROWS-1);
  // Door frame
  ctx.fillStyle=C.doorFrame;
  ctx.fillRect(0,0,S,SCALE*4);
  ctx.fillRect(0,0,SCALE*2,S); ctx.fillRect(S-SCALE*2,0,SCALE*2,S);
  // Opening
  ctx.fillStyle=C.doorOpen; ctx.fillRect(SCALE*2,0,S-SCALE*4,SCALE*4);
  // Threshold line
  ctx.fillStyle='#2a1800'; ctx.fillRect(0,SCALE*3,S,SCALE);
}

/* ─── PLAYER PIXEL ART ───────────────────────────── */
function drawPlayer(){
  const x=player.tx*S+S/2, y=player.ty*S+S/2;
  const bob=(player.frame===1||player.frame===3)?-SCALE:0;
  const loff=player.frame===1?2:player.frame===3?-2:0;
  const aoff=player.frame===1?-2:player.frame===3?2:0;
  const p=SCALE;
  const isAttacking=player.attackTimer>0.3;

  ctx.save(); ctx.translate(x,y+bob);

  // Shadow
  ctx.globalAlpha=0.25; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(0,S*0.4,S*0.22,S*0.06,0,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;

  const fl=player.facing==='left';
  if(fl) ctx.scale(-1,1);

  // ── LEGS ──
  ctx.fillStyle='#2a2018';
  ctx.fillRect(-5*p,4*p,4*p,8*p+loff*p);   // left leg
  ctx.fillRect( 1*p,4*p,4*p,8*p-loff*p);   // right leg
  // Knee patch left
  ctx.fillStyle='#3a3028'; ctx.fillRect(-4*p,7*p+loff*p,2*p,2*p);
  // Shoes
  ctx.fillStyle='#1a1008';
  ctx.fillRect(-6*p,12*p+loff*p,6*p,3*p);
  ctx.fillRect( 1*p,12*p-loff*p,6*p,3*p);
  // Shoe highlight
  ctx.fillStyle='#2a2018';
  ctx.fillRect(-6*p,12*p+loff*p,6*p,SCALE);
  ctx.fillRect( 1*p,12*p-loff*p,6*p,SCALE);

  // ── ARMS ──
  if(isAttacking){
    // Attack pose: both arms swung forward
    ctx.fillStyle='#4a5a2a';
    ctx.fillRect(-10*p,-4*p,4*p,8*p);   // left arm swung
    ctx.fillRect(  6*p,-8*p,4*p,8*p);   // right arm raised
    ctx.fillStyle='#c8a070';
    ctx.fillRect(-10*p, 3*p,4*p,3*p);
    ctx.fillRect(  6*p,-9*p,4*p,3*p);
  } else {
    ctx.fillStyle='#4a5a2a';
    ctx.fillRect(-9*p,-5*p+aoff*p,4*p,10*p);
    ctx.fillRect( 5*p,-5*p-aoff*p,4*p,10*p);
    ctx.fillStyle='#c8a070';
    ctx.fillRect(-9*p, 4*p+aoff*p,4*p,3*p);
    ctx.fillRect( 5*p, 4*p-aoff*p,4*p,3*p);
  }

  // ── WEAPON ── (plunger held in right hand)
  if(player.weapon==='plunger'){
    ctx.save();
    if(isAttacking){
      ctx.translate(12*p,-10*p);
      ctx.rotate(-0.7);
    } else {
      ctx.translate(10*p,-3*p-aoff*p);
    }
    // Stick
    ctx.fillStyle=C.plungerStick; ctx.fillRect(-p,0,p*2,12*p);
    ctx.fillStyle='#6a4020'; ctx.fillRect(-p,0,p,12*p);
    // Cup
    ctx.fillStyle=C.plungerCup;
    ctx.fillRect(-p*3,11*p,p*6,p*4);
    ctx.fillRect(-p*2,13*p,p*4,p*2);
    ctx.fillStyle=C.plungerCupD; ctx.fillRect(-p*3,14*p,p*6,p);
    // Glow if attacking
    if(isAttacking){
      ctx.globalAlpha=0.5;
      ctx.fillStyle='#ff6040'; ctx.fillRect(-p*4,10*p,p*8,p*6);
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }

  // ── COAT BODY ──
  ctx.fillStyle='#4a5a2a';
  ctx.fillRect(-6*p,-8*p,12*p,13*p);
  // Tear / worn patch
  ctx.fillStyle='#2a3a10'; ctx.fillRect(2*p,0*p,2*p,6*p);
  // Inner collar / shirt
  ctx.fillStyle='#7a6040'; ctx.fillRect(-2*p,0,4*p,5*p);
  // Belt
  ctx.fillStyle='#2a1808'; ctx.fillRect(-6*p,3*p,12*p,p*2);
  ctx.fillStyle='#c8a060'; ctx.fillRect(-p,3*p,p*2,p*2);

  // ── NECK ──
  ctx.fillStyle='#c8a070'; ctx.fillRect(-2*p,-9*p,4*p,2*p);

  // ── HEAD ──
  ctx.fillStyle='#c8a070'; ctx.fillRect(-5*p,-18*p,10*p,9*p);
  // Cheekbone shadow
  ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(-5*p,-11*p,3*p,2*p);
  ctx.fillRect( 2*p,-11*p,3*p,2*p);

  // ── HAIR ──
  ctx.fillStyle='#2a1a0a';
  ctx.fillRect(-5*p,-19*p,10*p,3*p);
  ctx.fillRect(-6*p,-18*p,2*p,5*p);  // side tuft L
  ctx.fillRect( 4*p,-18*p,3*p,4*p);  // side tuft R
  ctx.fillRect(-3*p,-20*p,2*p,2*p);  // top spiky
  ctx.fillRect( 1*p,-20*p,3*p,2*p);

  // ── FACE ──
  if(player.facing==='up'){
    ctx.fillStyle='#2a1a0a'; ctx.fillRect(-3*p,-14*p,6*p,2*p);
  } else {
    // Eyes with white + dark iris
    ctx.fillStyle='#f0e0c0'; ctx.fillRect(-4*p,-15*p,3*p,3*p); ctx.fillRect(1*p,-15*p,3*p,3*p);
    ctx.fillStyle='#1a1008'; ctx.fillRect(-3*p,-14*p,2*p,2*p); ctx.fillRect(1*p,-14*p,2*p,2*p);
    ctx.fillStyle='#fff'; ctx.fillRect(-3*p,-15*p,p,p); ctx.fillRect(1*p,-15*p,p,p); // glints
    // Eyebags (tired)
    ctx.fillStyle='#a08070'; ctx.fillRect(-4*p,-12*p,3*p,p); ctx.fillRect(1*p,-12*p,3*p,p);
    // Stubble
    ctx.fillStyle='#6a5040';
    ctx.fillRect(-3*p,-11*p,2*p,p); ctx.fillRect(0,-11*p,2*p,p); ctx.fillRect(-1*p,-10*p,5*p,p);
    // Nose
    ctx.fillStyle='#b08060'; ctx.fillRect(-p,-13*p,2*p,2*p);
  }

  ctx.restore();
}

/* ─── HINT ───────────────────────────────────────── */
function drawHint(){
  if(gameState!=='playing') return;
  const off={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const [ox,oy]=off[player.facing];
  const cx=Math.floor(player.tx)+ox, cy=Math.floor(player.ty)+oy;
  let nearObj=null;
  for(const obj of OBJECTS){
    if(obj._skip) continue;
    if(cx>=obj.tx&&cx<obj.tx+obj.w&&cy>=obj.ty&&cy<obj.ty+obj.h){nearObj=obj;break;}
  }
  const nearDoor=(cx===11||cx===12)&&cy===17;
  if(!nearObj&&!nearDoor) return;

  const tx=nearObj?(nearObj.tx+nearObj.w/2)*S:11.5*S;
  const ty=nearObj?nearObj.ty*S-SCALE*6:17*S-SCALE*6;

  let label='E';
  let labelColor=C.hintBg;
  if(nearObj?.isMob&&nearObj.alive&&player.weapon) { label='E  ATTAQUER'; labelColor='#ff4040'; }
  else if(nearObj?.pickable&&!player.inventory.find(i=>i.id===nearObj.itemId)) { label='E  PRENDRE'; }
  else if(nearObj?.isCoin&&coinVisible) { label='E  +1€'; labelColor='#ffe600'; }

  const bw=label.length>1?S*2.4:S*0.75;
  const pulse=0.8+0.2*Math.sin(Date.now()/250);

  ctx.save(); ctx.globalAlpha=pulse;
  ctx.fillStyle=labelColor; ctx.strokeStyle=C.hintText; ctx.lineWidth=SCALE;
  roundRect(ctx,tx-bw/2,ty-S*0.35,bw,S*0.55,SCALE*2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle=C.hintText;
  ctx.font=`bold ${SCALE*4}px monospace`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(label,tx,ty-S*0.08);
  ctx.restore();
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r);
  ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r);
  ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}

/* ─── UI ─────────────────────────────────────────── */
function drawUI(){
  uiCtx.clearRect(0,0,uiCanvas.width,uiCanvas.height);
  drawHUD();
  if(gameState==='dialog')    drawDialog();
  if(gameState==='inventory') drawInventory();
  if(gameState==='paused')    drawPause();
}

function drawHUD(){
  const W=uiCanvas.width,pad=14;
  uiCtx.fillStyle='rgba(10,6,0,0.9)'; uiCtx.fillRect(0,0,W,48);
  uiCtx.fillStyle='#ffe600'; uiCtx.fillRect(0,46,W,2);
  uiCtx.font='bold 14px "IBM Plex Mono",monospace';
  uiCtx.fillStyle='#ffe600'; uiCtx.textBaseline='middle';
  uiCtx.textAlign='left';
  uiCtx.fillText(`💰 ${player.money}€`,pad,24);
  uiCtx.fillText(`☠ DIGNITY: ${player.dignity}%`,pad+150,24);
  if(player.weapon){
    uiCtx.fillStyle='#ff6040';
    uiCtx.fillText(`⚔ ${player.inventory.find(i=>i.id===player.weapon)?.name||''}`,pad+360,24);
  }
  // Kevin status
  if(!kevinAlive){
    uiCtx.fillStyle='rgba(255,80,40,0.7)'; uiCtx.font='11px "IBM Plex Mono",monospace';
    uiCtx.fillText('☠ Kevin : VAINCU',pad+580,24);
  }
  uiCtx.textAlign='right'; uiCtx.fillStyle='rgba(255,255,255,0.3)';
  uiCtx.font='10px "IBM Plex Mono",monospace';
  uiCtx.fillText('[E] Interagir  [Q] Inventaire  [ESC] Pause',W-pad,24);
}

function drawDialog(){
  if(!dialogQueue.length) return;
  const W=uiCanvas.width,H=uiCanvas.height;
  const bh=152,bw=W-48,bx=24,by=H-bh-24;
  uiCtx.save();
  uiCtx.fillStyle='rgba(8,5,0,0.94)'; uiCtx.strokeStyle='#ffe600'; uiCtx.lineWidth=3;
  uiCtx.beginPath(); uiCtx.roundRect(bx,by,bw,bh,8); uiCtx.fill(); uiCtx.stroke();
  uiCtx.fillStyle='#ffe600'; uiCtx.fillRect(bx+3,by+3,bw-6,3);
  if(dialogObj&&dialogObj.label){
    const lw=Math.min(uiCtx.measureText('  '+dialogObj.label+'  ').width+28,240);
    uiCtx.fillStyle='#ffe600'; uiCtx.beginPath();
    uiCtx.roundRect(bx+16,by-16,lw,26,4); uiCtx.fill();
    uiCtx.fillStyle='#1a1200'; uiCtx.font='bold 12px "IBM Plex Mono",monospace';
    uiCtx.textAlign='left'; uiCtx.textBaseline='middle';
    uiCtx.fillText(dialogObj.label,bx+24,by-3);
  }
  uiCtx.fillStyle='#f2e8c9'; uiCtx.font='17px "Permanent Marker",cursive';
  uiCtx.textAlign='left'; uiCtx.textBaseline='top';
  wrapText(uiCtx,dialogQueue[dialogIdx]||'',bx+20,by+18,bw-48,26);
  for(let i=0;i<dialogQueue.length;i++){
    uiCtx.fillStyle=i===dialogIdx?'#ffe600':'rgba(255,230,0,0.18)';
    uiCtx.beginPath(); uiCtx.arc(bx+22+i*16,by+bh-16,5,0,Math.PI*2); uiCtx.fill();
  }
  if(Math.floor(Date.now()/500)%2===0){
    uiCtx.fillStyle='#ffe600'; uiCtx.font='20px monospace';
    uiCtx.textAlign='right'; uiCtx.textBaseline='bottom';
    uiCtx.fillText('▶',bx+bw-14,by+bh-10);
  }
  uiCtx.restore();
}

function drawInventory(){
  const W=uiCanvas.width,H=uiCanvas.height;
  uiCtx.save();
  uiCtx.fillStyle='rgba(0,0,0,0.75)'; uiCtx.fillRect(0,0,W,H);
  const bw=Math.min(580,W-40),bh=420,bx=(W-bw)/2,by=(H-bh)/2;
  uiCtx.fillStyle='#0e0800'; uiCtx.strokeStyle='#ffe600'; uiCtx.lineWidth=3;
  uiCtx.beginPath(); uiCtx.roundRect(bx,by,bw,bh,10); uiCtx.fill(); uiCtx.stroke();
  uiCtx.fillStyle='#ffe600'; uiCtx.fillRect(bx+3,by+3,bw-6,3);
  uiCtx.font='bold 20px "Permanent Marker",cursive';
  uiCtx.textAlign='center'; uiCtx.textBaseline='top';
  uiCtx.fillText('📦 INVENTAIRE DE MAGOUILLES',W/2,by+18);
  uiCtx.strokeStyle='rgba(255,230,0,0.2)'; uiCtx.lineWidth=1;
  uiCtx.beginPath(); uiCtx.moveTo(bx+20,by+56); uiCtx.lineTo(bx+bw-20,by+56); uiCtx.stroke();
  if(player.inventory.length===0){
    uiCtx.fillStyle='rgba(255,255,255,0.28)'; uiCtx.font='15px "IBM Plex Mono",monospace';
    uiCtx.textAlign='center'; uiCtx.textBaseline='middle';
    uiCtx.fillText('Vide. Comme ton frigo. Et ton âme.',W/2,by+bh/2);
  } else {
    player.inventory.forEach((item,i)=>{
      const iy=by+72+i*90;
      uiCtx.fillStyle='rgba(255,230,0,0.07)'; uiCtx.strokeStyle='rgba(255,230,0,0.22)'; uiCtx.lineWidth=1;
      uiCtx.beginPath(); uiCtx.roundRect(bx+20,iy,bw-40,80,6); uiCtx.fill(); uiCtx.stroke();
      if(item.isWeapon){
        uiCtx.fillStyle='#c03020'; uiCtx.beginPath(); uiCtx.roundRect(bx+30,iy+12,70,20,3); uiCtx.fill();
        uiCtx.fillStyle='#fff'; uiCtx.font='bold 9px monospace';
        uiCtx.textAlign='center'; uiCtx.textBaseline='middle'; uiCtx.fillText('⚔ ARME',bx+65,iy+22);
      }
      uiCtx.fillStyle='#ffe600'; uiCtx.font='bold 15px "Permanent Marker",cursive';
      uiCtx.textAlign='left'; uiCtx.textBaseline='top'; uiCtx.fillText(item.name,bx+108,iy+14);
      uiCtx.fillStyle='#c8b090'; uiCtx.font='12px "IBM Plex Mono",monospace';
      uiCtx.fillText(item.desc,bx+108,iy+40);
      if(item.atk){ uiCtx.fillStyle='#ff6040'; uiCtx.font='bold 11px monospace'; uiCtx.fillText(`ATK: +${item.atk}`,bx+32,iy+46); }
    });
  }
  uiCtx.fillStyle='#f2e8c9'; uiCtx.font='12px "IBM Plex Mono",monospace';
  uiCtx.textAlign='left'; uiCtx.textBaseline='bottom';
  uiCtx.fillText(`💰 ${player.money}€  |  ☠ ${player.dignity}%  |  📦 ${player.inventory.length} objet(s)`,bx+20,by+bh-14);
  uiCtx.fillStyle='rgba(255,230,0,0.4)'; uiCtx.textAlign='right';
  uiCtx.fillText('[Q] Fermer',bx+bw-16,by+bh-14);
  uiCtx.restore();
}

function drawPause(){
  const W=uiCanvas.width,H=uiCanvas.height;
  uiCtx.save();
  uiCtx.fillStyle='rgba(0,0,0,0.65)'; uiCtx.fillRect(0,0,W,H);
  uiCtx.fillStyle='#ffe600'; uiCtx.font='bold 48px "Bebas Neue",sans-serif';
  uiCtx.textAlign='center'; uiCtx.textBaseline='middle';
  uiCtx.fillText('EN PAUSE',W/2,H/2-24);
  uiCtx.fillStyle='rgba(255,255,255,0.4)'; uiCtx.font='15px "IBM Plex Mono",monospace';
  uiCtx.fillText('( ESC pour reprendre )',W/2,H/2+20);
  uiCtx.restore();
}

function wrapText(ctx,text,x,y,maxW,lineH){
  const words=text.split(' '); let line='',curY=y;
  for(const w of words){
    const t=line+w+' ';
    if(ctx.measureText(t).width>maxW&&line!==''){ctx.fillText(line.trim(),x,curY);line=w+' ';curY+=lineH;}
    else line=t;
  }
  if(line.trim()) ctx.fillText(line.trim(),x,curY);
}
