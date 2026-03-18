/* =====================================================
   WORLD.JS — Random Tuesday Simulator
   Single open room · no inner walls · correct top-down
   Proper hitboxes · Kevin killable · persistent money
   ===================================================== */
'use strict';

const TILE  = 16;
const SCALE = 3;
const S     = TILE * SCALE;
const COLS  = 22;
const ROWS  = 18;

/* ── MONEY ── */
function loadMoney(){ return parseInt(localStorage.getItem('rts_money')||'0',10); }
function saveMoney(v){ localStorage.setItem('rts_money',String(v)); }

/* ══════ PALETTE ══════ */
const C = {
  flA:'#6b4c2a',flB:'#5a3e22',flC:'#7a5535',flDark:'#3d2810',flCrack:'#2a1c0a',
  rugA:'#7a1515',rugB:'#5c0e0e',rugBrd:'#9e2020',rugAcc:'#c0392b',
  /* walls */
  wTop:'#b08850',wFace:'#8c6840',wSide:'#5a3e22',
  doorFr:'#5c3810',doorOpen:'#0a0604',
  /* hole */
  holeDk:'#030100',holeMd:'#0a0604',holeRm:'#1e1008',
  /* bed */
  bdFr:'#3a1e06',bdMt:'#8a6a40',bdMtD:'#6a5030',
  bdPl:'#c8b88a',bdPlD:'#a89870',bdSt:'#5a4020',bdBl:'#9a8860',bdBlD:'#7a6840',
  /* wardrobe — against north wall: top = narrow lit strip, front = wide body */
  wdTop:'#7a5c30',wdFr:'#4a3018',wdSd:'#2a1808',wdKn:'#c8a060',
  /* bookshelf — against east wall: right strip lit, body to left */
  bsTop:'#6a4828',bsBd:'#3a2810',bsShf:'#2a1808',
  /* tv stand — against north wall */
  tvSt:'#2a1808',tvBd:'#181818',tvSc:'#0a1a10',
  /* table/chairs */
  tbTop:'#8a6030',tbLeg:'#4a2c10',
  chBk:'#3a2010',chSt:'#6a4228',
  /* sofa — against west wall: left strip lit, body to right */
  sfBk:'#2a1808',sfAm:'#3a2010',sfSt:'#7a5535',sfCu:'#8a6a40',
  /* fridge — against east wall: right strip lit */
  frBd:'#c0c8c0',frHd:'#707878',frSl:'#9a9ea0',
  /* stove — against north wall */
  stBd:'#2a2a2a',stBr:'#181818',stOn:'#ff4020',
  /* counter — against north wall */
  ctBd:'#b0a888',ctTl:'#c8c0a0',
  /* sink — against north wall */
  skBd:'#b8c0b8',skBw:'#707870',skTp:'#909898',
  /* toilet — against east wall right side: right strip lit */
  toTk:'#c8cec8',toLd:'#b0b8b0',toBw:'#9098a0',
  /* nightstand */
  nsT:'#7a5028',nsDk:'#4a2c10',
  /* lamp */
  lmB:'#8a6820',lmS:'#d0a820',lmSD:'#a08010',
  /* clock */
  ckBd:'#2a2018',ckFc:'#f0e0b0',
  /* bottle */
  btGr:'#2a6020',btCp:'#b0b0b0',
  /* trash */
  trBg:'#252525',trBgT:'#353535',
  /* box */
  bxBr:'#8a5a28',bxTp:'#c8a040',
  /* bucket */
  buBd:'#5878a0',buHd:'#3a5878',buDt:'#5a4028',
  /* rat */
  ratBd:'#4a3828',ratEr:'#8a5848',ratEy:'#ff2020',ratDd:'#3a2818',
  /* plunger */
  plSt:'#9a7040',plCp:'#c03020',plCpD:'#7a1c10',
  /* poster */
  posBg:'#3a0000',posRd:'#ff4040',
  /* coin */
  coinG:'#f0c020',coinD:'#c09010',
  hit:'rgba(255,60,60,0.55)',
  hintBg:'#ffe600',hintTx:'#1a1200',
};

/* ══════ MAP (24×18) — simple open room, outer walls only ══════
   0=floor  2=floor-crack  3=rug  4=void  5=hole-rim
   N=north-wall  S=south-wall  W=west-wall  E=east-wall
   NW/NE/SW/SE=corners  D=door
*/
const _=0,CK=2,RG=3;
const N=10,Sv=11,Wl=12,Er=13,NW=20,NE=21,SW=22,SE=23,DR=30;

const MAP = [
//  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16   17   18   19   20   21
  [NW,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,   N,  NE],// 0
  [Wl,  RG,  RG,  RG,  RG,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],// 1
  [Wl,  RG,  RG,  RG,  RG,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],// 2
  [Wl,  RG,  RG,  RG,  RG,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],// 3
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],// 4
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],// 5
  [Wl,   _,   _,   CK,  _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],// 6
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],// 7
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],// 8
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   CK,  _,   _,   _,  Er],// 9
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],//10
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],//11
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],//12
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],//13
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],//14
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   CK,  _,   _,   _,   _,   _,   _,  Er],//15
  [Wl,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,   _,  Er],//16
  [SW,   Sv,  Sv,  Sv,  Sv,  Sv,  Sv,  Sv,  Sv,  Sv,  Sv,  DR,  DR,  Sv,  Sv,  Sv,  Sv,  Sv,  Sv,  Sv,  Sv, SE],//17
];

const SOLID_T = new Set([N,Sv,Wl,Er,NW,NE,SW,SE]);

/* ══════ PIXEL HELPER ══════ */
function px(ctx,c,r,w,h,col){ ctx.fillStyle=col; ctx.fillRect(c*SCALE,r*SCALE,w*SCALE,h*SCALE); }

/* ══════════════════════════════════════════════════
   TOP-DOWN ANGLE RULES (applied consistently):

   Object against NORTH wall (ty=1):
   → You see the TOP face (thin lit strip, row 0 of object)
   → Then the FRONT face below (rest of object height)
   → Shadow strip at very bottom

   Object against EAST wall (tx=20 or 21):
   → You see the RIGHT face (thin lit strip on RIGHT side of object)
   → Then the BODY to the LEFT
   → Shadow strip on left side

   Object against WEST wall (tx=1):
   → You see the LEFT face (thin lit strip on LEFT side)
   → Then the BODY to the RIGHT
   → Shadow on right side

   Object against SOUTH wall (ty=14):
   → You see mostly the TOP surface + thin bottom strip
   → Shadow at very top

   Freestanding objects: lit from top-left, shadow bottom-right.
══════════════════════════════════════════════════ */

const OBJECTS = [];

/* ──────────────────────────────────────────────
   NORTH WALL objects (ty=1, strip at top = wall-face)
────────────────────────────────────────────────── */

/* BED — north wall, cols 1-4 */
OBJECTS.push({
  tx:1,ty:1,w:4,h:3,
  hx:1,hy:2,hw:4,hh:2,   // player can walk on row 1 (headboard tile) but not rows 2-3
  label:'Matelas',
  lines:['"Trouvé dans la rue. La tache ressemble à la Bretagne."','"Ça grince. Ça sent. C\'est CHEZ TOI."','"3 ans que tu y dors. Tu préfères ne pas savoir pourquoi ça craque."'],
  draw(ctx){
    const W=4*S,H=3*S;
    // Headboard = top face of bed (against north wall) — lit strip
    ctx.fillStyle='#5a3010'; ctx.fillRect(0,0,W,SCALE*6);
    for(let i=0;i<4;i++){
      ctx.fillStyle=i%2===0?'#6a3a18':'#3a1e06';
      ctx.fillRect(i*S+SCALE,SCALE,S-SCALE*2,SCALE*4);
    }
    // Nail dots on headboard
    ctx.fillStyle='#c8a060';
    for(let i=0;i<4;i++) ctx.fillRect(i*S+SCALE*3,SCALE*2,SCALE,SCALE);
    // Headboard → mattress shadow
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,SCALE*5,W,SCALE*2);
    // Side rails (thin strips on left/right)
    ctx.fillStyle=C.bdFr; ctx.fillRect(0,SCALE*7,SCALE*3,H-SCALE*7); ctx.fillRect(W-SCALE*3,SCALE*7,SCALE*3,H-SCALE*7);
    // Mattress
    ctx.fillStyle=C.bdMt; ctx.fillRect(SCALE*3,SCALE*7,W-SCALE*6,H-SCALE*10);
    ctx.fillStyle=C.bdMtD; ctx.fillRect(SCALE*3,SCALE*7,W-SCALE*6,SCALE*2);
    // Mattress buttons
    ctx.fillStyle='#4a3010';
    for(let bx2=0;bx2<3;bx2++) for(let by2=0;by2<2;by2++) ctx.fillRect(SCALE*(6+bx2*10),SCALE*(10+by2*8),SCALE*2,SCALE*2);
    // Pillow (left)
    ctx.fillStyle=C.bdPl; ctx.fillRect(SCALE*4,SCALE*8,S+SCALE*4,S-SCALE*3);
    ctx.fillStyle=C.bdPlD; ctx.fillRect(SCALE*4,SCALE*8,S+SCALE*4,SCALE*2);
    ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=1;
    ctx.strokeRect(SCALE*4,SCALE*8,S+SCALE*4,S-SCALE*3);
    // Pillow crease
    ctx.strokeStyle='rgba(0,0,0,0.08)'; ctx.beginPath(); ctx.moveTo(SCALE*4,SCALE*11); ctx.lineTo(SCALE*4+S+SCALE*4,SCALE*11); ctx.stroke();
    // Blanket crumpled right
    ctx.fillStyle=C.bdBl; ctx.fillRect(S*2,SCALE*8,W-S*2-SCALE*3,H-SCALE*10);
    ctx.fillStyle=C.bdBlD; ctx.fillRect(S*2+SCALE*4,SCALE*12,S-SCALE*2,S-SCALE*6);
    // Stain (Bretagne)
    ctx.fillStyle=C.bdSt; ctx.fillRect(S+SCALE*8,SCALE*14,SCALE*8,SCALE*5); ctx.fillRect(S+SCALE*10,SCALE*19,SCALE*5,SCALE*3);
    // Footboard
    ctx.fillStyle=C.bdFr; ctx.fillRect(0,H-SCALE*3,W,SCALE*3);
    // Bottom shadow
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,H-SCALE,W,SCALE); ctx.fillRect(W-SCALE*2,SCALE*7,SCALE*2,H-SCALE*7);
  }
});

/* NIGHTSTAND — north wall, col 5 */
OBJECTS.push({
  tx:5,ty:1,w:1,h:2,
  hx:5,hy:2,hw:1,hh:1,
  label:'Table de nuit',
  lines:['"Pied calé avec une pièce de 2€. Ingénieux."','"Verre d\'eau (?), aspirine, téléphone mort."'],
  draw(ctx){
    // Top face (north wall strip)
    ctx.fillStyle=C.wdTop; ctx.fillRect(0,0,S,SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,SCALE*4,S,SCALE);
    // Surface
    ctx.fillStyle=C.nsT; ctx.fillRect(0,SCALE*5,S,2*S-SCALE*6);
    // Drawer line + knob
    ctx.fillStyle=C.nsDk; ctx.fillRect(SCALE,S,S-SCALE*2,SCALE);
    ctx.fillStyle=C.wdKn; ctx.beginPath(); ctx.arc(S/2,S+SCALE*4,SCALE*2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(S/2,S+SCALE*4,SCALE,0,Math.PI*2); ctx.fill();
    // Items: water glass (circle)
    ctx.fillStyle='rgba(160,210,230,0.6)'; ctx.beginPath(); ctx.arc(SCALE*5,SCALE*8,SCALE*3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(SCALE*5,SCALE*8,SCALE*1.5,0,Math.PI*2); ctx.fill();
    // Dead phone
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(SCALE*9,SCALE*7,SCALE*4,SCALE*7);
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(SCALE*10,SCALE*8,SCALE*2,SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,2*S-SCALE*2,S,SCALE*2);
  }
});

/* LAMP on nightstand — decorative only */
OBJECTS.push({
  tx:5,ty:1,w:1,h:1,
  hx:0,hy:0,hw:0,hh:0,
  label:'Lampe de chevet',
  lines:['"Elle clignote toutes les 30s. Pas prévu."'],
  draw(ctx){
    const g=0.14+0.07*Math.sin(Date.now()/700);
    ctx.fillStyle=`rgba(255,240,160,${g})`; ctx.fillRect(-S,-S,3*S,3*S);
    // Base (top-down = small circle)
    ctx.fillStyle=C.lmB; ctx.beginPath(); ctx.arc(S/2,SCALE*11,SCALE*2.5,0,Math.PI*2); ctx.fill();
    // Shade (top-down = larger circle with darker inside)
    ctx.fillStyle=C.lmS; ctx.beginPath(); ctx.arc(S/2,SCALE*7,SCALE*5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.lmSD; ctx.beginPath(); ctx.arc(S/2,SCALE*7,SCALE*3.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffffc0'; ctx.beginPath(); ctx.arc(S/2,SCALE*7,SCALE*1.5,0,Math.PI*2); ctx.fill();
  }
});

/* TV + STAND — north wall, cols 7-9 */
OBJECTS.push({
  tx:7,ty:1,w:3,h:2,
  hx:7,hy:1,hw:3,hh:2,
  label:'Télé',
  lines:['"CRT 1994. Une chaîne : météo Kazakhstan."','"4 bandes de scotch. Solide comme l\'espoir."','"LED verte clignotante = problème non résolu."'],
  draw(ctx){
    // Stand back strip (north wall face)
    ctx.fillStyle=C.tvSt; ctx.fillRect(0,0,3*S,SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,SCALE*4,3*S,SCALE);
    // Stand pedestal
    ctx.fillStyle='#1a1008'; ctx.fillRect(S,SCALE*5,S,2*S-SCALE*6);
    // TV body (top-down: you see the top surface)
    ctx.fillStyle=C.tvBd; ctx.fillRect(SCALE*2,SCALE*3,3*S-SCALE*4,SCALE*10);
    // Screen (darker inset)
    ctx.fillStyle=C.tvSc; ctx.fillRect(SCALE*4,SCALE*4,3*S-SCALE*8,SCALE*8);
    // Scanlines
    for(let l=4;l<12;l+=2){ ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(SCALE*4,l*SCALE,3*S-SCALE*8,SCALE); }
    // Flicker
    if(Math.floor(Date.now()/180)%7===0){ ctx.fillStyle='rgba(80,180,80,0.15)'; ctx.fillRect(SCALE*4,SCALE*4,3*S-SCALE*8,SCALE*8); }
    // Antenna (two dots seen from above)
    ctx.fillStyle='#888'; ctx.fillRect(SCALE*7,SCALE*2,SCALE,SCALE); ctx.fillRect(SCALE*11,SCALE*2,SCALE,SCALE);
    // Power LED
    ctx.fillStyle=Math.floor(Date.now()/900)%2===0?'#00ff40':'#003010';
    ctx.fillRect(3*S-SCALE*5,SCALE*12,SCALE,SCALE);
    // VHS sticker
    ctx.fillStyle='#ff2d00'; ctx.fillRect(SCALE*4,SCALE*13,S,SCALE*3);
    ctx.fillStyle='#fff'; ctx.font=`${SCALE*2}px monospace`; ctx.textBaseline='top'; ctx.textAlign='left'; ctx.fillText('VHS',SCALE*5*1,SCALE*13.5*1);
    // Bottom shadow
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(0,2*S-SCALE*2,3*S,SCALE*2);
  }
});

/* CLOCK — decorative, on north wall between TV and stove */
OBJECTS.push({
  tx:12,ty:1,w:1,h:1,
  hx:0,hy:0,hw:0,hh:0,
  label:'Horloge cassée',
  lines:['"4h23 depuis 6 mois. Piles mortes. Flemme."'],
  draw(ctx){
    ctx.fillStyle=C.ckBd; ctx.fillRect(SCALE,SCALE,S-SCALE*2,S-SCALE*2);
    ctx.fillStyle=C.ckFc; ctx.fillRect(SCALE*3,SCALE*3,S-SCALE*6,S-SCALE*6);
    // Hour marks
    for(let i=0;i<12;i++){
      const a=-Math.PI/2+i*Math.PI*2/12, r=S/2-SCALE*4;
      ctx.fillStyle='#2a1800'; ctx.fillRect(S/2+Math.cos(a)*r-0.5,S/2+Math.sin(a)*r-0.5,SCALE,SCALE);
    }
    const cx=S/2,cy=S/2;
    ctx.strokeStyle='#1a1200'; ctx.lineWidth=SCALE;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(-Math.PI/2+2*Math.PI*4/12)*SCALE*4,cy+Math.sin(-Math.PI/2+2*Math.PI*4/12)*SCALE*4); ctx.stroke();
    ctx.lineWidth=SCALE*0.6;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(-Math.PI/2+2*Math.PI*23/60)*SCALE*5,cy+Math.sin(-Math.PI/2+2*Math.PI*23/60)*SCALE*5); ctx.stroke();
    ctx.fillStyle='#1a1200'; ctx.fillRect(cx-SCALE,cy-SCALE,SCALE*2,SCALE*2);
  }
});

/* STOVE — north wall, cols 13-14 */
OBJECTS.push({
  tx:13,ty:1,w:2,h:2,
  hx:13,hy:1,hw:2,hh:2,
  label:'Cuisinière',
  lines:['"Le feu fonctionne. Seulement le feu."','"Le four bloqué depuis 2018. Un mystère."','"Brûleur gauche met le feu. Pour de vrai."'],
  draw(ctx){
    // North face strip
    ctx.fillStyle='#3a3a3a'; ctx.fillRect(0,0,2*S,SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,SCALE*4,2*S,SCALE);
    // Top surface
    ctx.fillStyle=C.stBd; ctx.fillRect(0,SCALE*5,2*S,2*S-SCALE*5);
    // 4 burners
    [[SCALE*5,SCALE*8],[SCALE*5,SCALE*15],[SCALE*13,SCALE*8],[SCALE*13,SCALE*15]].forEach(([bx2,by2],i)=>{
      ctx.fillStyle=i===0?'#4a2010':C.stBr;
      ctx.beginPath(); ctx.arc(bx2,by2,SCALE*3.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=i===0?C.stOn:'#0a0a0a';
      ctx.beginPath(); ctx.arc(bx2,by2,SCALE*2,0,Math.PI*2); ctx.fill();
      if(i===0){
        const gl=0.3+0.2*Math.sin(Date.now()/180);
        ctx.globalAlpha=gl; ctx.fillStyle='#ff8040'; ctx.beginPath(); ctx.arc(bx2,by2,SCALE*3,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
      }
    });
    // Knobs row
    for(let k=0;k<4;k++){ ctx.fillStyle='#555'; ctx.beginPath(); ctx.arc(SCALE*(4+k*5),SCALE*18,SCALE*2,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#888'; ctx.beginPath(); ctx.arc(SCALE*(4+k*5),SCALE*18,SCALE,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(0,2*S-SCALE*2,2*S,SCALE*2);
  }
});

/* COUNTER — north wall, cols 15-17 */
OBJECTS.push({
  tx:15,ty:1,w:3,h:2,
  hx:15,hy:1,hw:3,hh:2,
  label:'Plan de travail',
  lines:['"De la farine partout. Tu n\'as pas de farine."','"Couteau, 4 tasses, le désespoir."'],
  draw(ctx){
    ctx.fillStyle='#c0b898'; ctx.fillRect(0,0,3*S,SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,SCALE*4,3*S,SCALE);
    ctx.fillStyle=C.ctBd; ctx.fillRect(0,SCALE*5,3*S,2*S-SCALE*5);
    // Tile pattern
    for(let tc=0;tc<3*TILE;tc+=4) for(let tr=5;tr<2*TILE;tr+=4)
      if((tc+tr)%8===0){ ctx.fillStyle='rgba(0,0,0,0.05)'; ctx.fillRect(tc*SCALE,tr*SCALE,SCALE*4,SCALE*4); }
    // Cutting board
    ctx.fillStyle='#8a6030'; ctx.fillRect(SCALE*3,SCALE*6,S+SCALE*4,S-SCALE*3);
    ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(SCALE*4,SCALE*7,S+SCALE*2,S-SCALE*5);
    // Knife
    ctx.fillStyle='#c0c0c0'; ctx.fillRect(SCALE*3,SCALE*10,S+SCALE*4,SCALE*2);
    ctx.fillStyle='#7a5020'; ctx.fillRect(SCALE*3,SCALE*10,SCALE*4,SCALE*2);
    // Cups (top-down circles)
    ['#c8b090','#909090','#c03020'].forEach((col,i)=>{
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc((S*2+SCALE*4+i*SCALE*7)*1,SCALE*9,SCALE*3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc((S*2+SCALE*4+i*SCALE*7)*1,SCALE*9,SCALE*1.5,0,Math.PI*2); ctx.fill();
    });
    // Flour
    ctx.fillStyle='rgba(240,240,230,0.15)'; ctx.fillRect(0,SCALE*5,3*S,SCALE*4);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,2*S-SCALE*2,3*S,SCALE*2);
  }
});

/* SINK — north wall, cols 18-19 */
OBJECTS.push({
  tx:18,ty:1,w:2,h:2,
  hx:18,hy:1,hw:2,hh:2,
  label:'Évier',
  lines:['"Eau chaude morte en 2020."','"Jean-Pierre le cafard habite sous le robinet."','"4 tasses dedans depuis lundi."'],
  draw(ctx){
    ctx.fillStyle='#c8d0c8'; ctx.fillRect(0,0,2*S,SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(0,SCALE*4,2*S,SCALE);
    ctx.fillStyle=C.skBd; ctx.fillRect(0,SCALE*5,2*S,2*S-SCALE*5);
    // Bowl
    ctx.fillStyle=C.skBw; ctx.fillRect(SCALE*3,SCALE*7,2*S-SCALE*6,2*S-SCALE*11);
    ctx.fillStyle='#4a5858'; ctx.fillRect(SCALE*4,SCALE*8,2*S-SCALE*8,2*S-SCALE*13);
    ctx.fillStyle='rgba(50,80,50,0.5)'; ctx.fillRect(SCALE*4,2*S-SCALE*7,2*S-SCALE*8,SCALE*3);
    // Tap
    ctx.fillStyle=C.skTp; ctx.fillRect(S-SCALE,SCALE*5,SCALE*2,SCALE*5);
    ctx.fillRect(S-SCALE*3,SCALE*6,SCALE*2,SCALE*2); ctx.fillRect(S+SCALE,SCALE*6,SCALE*2,SCALE*2);
    // Jean-Pierre
    ctx.fillStyle='#0a0806'; ctx.fillRect(SCALE*5,2*S-SCALE*5,SCALE*4,SCALE*2); ctx.fillRect(SCALE*4,2*S-SCALE*5,SCALE*7,SCALE);
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,2*S-SCALE*2,2*S,SCALE*2);
  }
});

/* FRIDGE — north wall, col 20 */
OBJECTS.push({
  tx:20,ty:1,w:1,h:3,
  hx:20,hy:1,hw:1,hh:3,
  label:'Frigo',
  lines:['"Moutarde périmée depuis Obama, et de l\'espoir."','"Bruit bizarre. Tu n\'enquêtes pas."','"Sticky : \'LOYER!!!\'. Tu l\'as mis toi-même."'],
  draw(ctx){
    ctx.fillStyle='#d8e0d8'; ctx.fillRect(0,0,S,SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(0,SCALE*4,S,SCALE);
    ctx.fillStyle=C.frBd; ctx.fillRect(0,SCALE*5,S,3*S-SCALE*5);
    // Freezer seam
    ctx.fillStyle=C.frSl; ctx.fillRect(0,S+SCALE*3,S,SCALE*2);
    // Handle (right edge = thin strip since we see front face)
    ctx.fillStyle=C.frHd; ctx.fillRect(S-SCALE*3,SCALE*7,SCALE*2,S-SCALE*4); ctx.fillRect(S-SCALE*3,S+SCALE*5,SCALE*2,S+SCALE*2);
    // Rust
    ctx.fillStyle='rgba(140,80,40,0.35)'; ctx.fillRect(SCALE*2,2*S+SCALE*3,SCALE*4,SCALE*3);
    // Note
    ctx.fillStyle='#ffe080'; ctx.fillRect(SCALE*2,S+SCALE,S-SCALE*4,S/2);
    ctx.fillStyle='#a08020'; ctx.font=`${SCALE}px monospace`; ctx.textBaseline='top'; ctx.textAlign='left'; ctx.fillText('LOYER!',SCALE*3*1,(S+SCALE*2)*1);
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(0,3*S-SCALE*2,S,SCALE*2); ctx.fillRect(S-SCALE*2,SCALE*5,SCALE*2,3*S-SCALE*5);
  }
});

/* ──────────────────────────────────────────────
   EAST WALL objects (tx=20 or 21: right strip lit)
────────────────────────────────────────────────── */

/* BOOKSHELF — east wall, rows 5-9 */
OBJECTS.push({
  tx:20,ty:5,w:1,h:4,
  hx:20,hy:5,hw:1,hh:4,
  label:'Bibliothèque',
  lines:['"3 livres et 9 bières vides. Culturel."','"\'Devenir riche en 30 jours\'. Page 1. Jamais terminé."'],
  draw(ctx){
    // Right face strip (east wall side — lit)
    ctx.fillStyle=C.wdTop; ctx.fillRect(S-SCALE*5,0,SCALE*5,5*S);
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(S-SCALE*6,0,SCALE,5*S);
    // Body
    ctx.fillStyle=C.bsBd; ctx.fillRect(0,0,S-SCALE*5,5*S);
    // Shelf dividers (horizontal lines)
    ctx.fillStyle=C.bsShf; [S,2*S,3*S,4*S].forEach(sy=>ctx.fillRect(0,sy,S-SCALE*5,SCALE*2));
    // Books (vertical colored strips = book spines seen side-on)
    const bc=['#c03020','#2060a0','#806020','#208040','#c0a020','#602080','#c8a060','#4080c0','#803020','#20a060','#a04020','#2040c0'];
    bc.forEach((col,i)=>{
      const shelf=Math.floor(i/3), pos=i%3;
      ctx.fillStyle=col; ctx.fillRect(SCALE*(pos*3+2),shelf*S+SCALE*3,SCALE*2.5,S-SCALE*5);
    });
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,0,SCALE*2,5*S);
  }
});

/* TOILET — east wall, rows 11-13 */
/* Toilet against east wall: tank on right (against wall), bowl to left */
OBJECTS.push({
  tx:20,ty:11,w:2,h:3,
  hx:20,hy:11,hw:2,hh:3,
  label:'WC',
  lines:['"Fonctionne à 60%. Les 40% restants, on n\'en parle pas."','"L\'eau est d\'une couleur mystique."','"Stries sur le mur : le calendrier."'],
  draw(ctx){
    // Tank = right strip (against east wall)
    ctx.fillStyle=C.toTk; ctx.fillRect(S+SCALE*4,0,S-SCALE*4,3*S);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(S+SCALE*3,0,SCALE,3*S);
    // Flush button (top of tank)
    ctx.fillStyle='#d0d8d0'; ctx.beginPath(); ctx.arc(S+SCALE*(4+(12-4)/2)*1,SCALE*3,SCALE*2,0,Math.PI*2); ctx.fill();
    // Lid
    ctx.fillStyle=C.toLd; ctx.fillRect(0,SCALE*2,S+SCALE*4,3*S-SCALE*4);
    // Bowl inset
    ctx.fillStyle=C.toBw; ctx.fillRect(SCALE*3,SCALE*5,S-SCALE*3,3*S-SCALE*10);
    ctx.fillStyle='rgba(60,80,100,0.7)'; ctx.fillRect(SCALE*5,SCALE*8,S-SCALE*7,3*S-SCALE*14);
    // Mystic water
    ctx.fillStyle='rgba(50,100,60,0.3)'; ctx.fillRect(SCALE*5,2*S+SCALE*2,S-SCALE*7,SCALE*4);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,3*S-SCALE*2,S+SCALE*4,SCALE*2);
  }
});

/* SINK BATHROOM — east wall, rows 8-9 */
OBJECTS.push({
  tx:20,ty:9,w:2,h:2,
  hx:20,hy:9,hw:2,hh:2,
  label:'Lavabo',
  lines:['"Eau froide uniquement depuis 2019."','"Trace de rouge à lèvres sur le miroir. Tu n\'as pas de rouge à lèvres."'],
  draw(ctx){
    // Right strip (east wall)
    ctx.fillStyle=C.wdTop; ctx.fillRect(2*S-SCALE*5,0,SCALE*5,2*S);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(2*S-SCALE*6,0,SCALE,2*S);
    // Counter surface
    ctx.fillStyle=C.skBd; ctx.fillRect(0,0,2*S-SCALE*5,2*S);
    // Bowl
    ctx.fillStyle=C.skBw; ctx.fillRect(SCALE*2,SCALE*3,2*S-SCALE*9,2*S-SCALE*6);
    ctx.fillStyle='#4a5858'; ctx.fillRect(SCALE*3,SCALE*4,2*S-SCALE*11,2*S-SCALE*8);
    ctx.fillStyle='rgba(50,70,60,0.4)'; ctx.fillRect(SCALE*3,2*S-SCALE*6,2*S-SCALE*11,SCALE*3);
    // Tap
    ctx.fillStyle=C.skTp; ctx.fillRect(S-SCALE,SCALE*2,SCALE*2,SCALE*5);
    ctx.fillRect(S-SCALE*3,SCALE*3,SCALE*2,SCALE*2); ctx.fillRect(S+SCALE,SCALE*3,SCALE*2,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,2*S-SCALE*2,2*S-SCALE*5,SCALE*2);
  }
});

/* ──────────────────────────────────────────────
   WEST WALL objects (left strip lit)
────────────────────────────────────────────────── */

/* WARDROBE — west wall, rows 1-4 */
OBJECTS.push({
  tx:1,ty:5,w:2,h:3,
  hx:1,hy:5,hw:2,hh:3,
  label:'Armoire',
  lines:['"Deux portes. Une ne ferme pas."','"Veste de 2007, regrets, slip mystère."','"L\'odeur qui en sort ne ressemble à rien."'],
  draw(ctx){
    // Left face strip (west wall side — lit)
    ctx.fillStyle=C.wdTop; ctx.fillRect(0,0,SCALE*5,3*S);
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(SCALE*4,0,SCALE,3*S);
    // Front face
    ctx.fillStyle=C.wdFr; ctx.fillRect(SCALE*5,0,2*S-SCALE*5,3*S);
    // Horizontal seam between top/bottom door
    ctx.fillStyle=C.wdSd; ctx.fillRect(SCALE*5,S+SCALE,2*S-SCALE*5,SCALE*2);
    // Handles
    ctx.fillStyle=C.wdKn;
    ctx.fillRect(SCALE*6,S*0.4,SCALE*2,SCALE*4);
    ctx.fillRect(SCALE*6,S*1.5,SCALE*2,SCALE*4);
    // Clothes peeking (door slightly ajar)
    ctx.fillStyle='#5a3080'; ctx.fillRect(SCALE*5,SCALE*2,SCALE*3,S-SCALE*3);
    ctx.fillStyle='#c03020'; ctx.fillRect(SCALE*5,SCALE*4,SCALE*2,S-SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(SCALE*5,3*S-SCALE*2,2*S-SCALE*5,SCALE*2);
  }
});

/* SOFA — west wall, rows 7-10 */
OBJECTS.push({
  tx:1,ty:7,w:2,h:4,
  hx:1,hy:7,hw:2,hh:4,
  label:'Canapé',
  lines:['"Récupéré sur le trottoir. Comme le reste."','"3€47 dans les coussins. Ton budget repas."','"Tache Italie sur le coussin du milieu."'],
  draw(ctx){
    // Left face (west wall strip — lit)
    ctx.fillStyle=C.sfBk; ctx.fillRect(0,0,SCALE*5,4*S);
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(SCALE*4,0,SCALE,4*S);
    // Armrests (top + bottom)
    ctx.fillStyle=C.sfAm; ctx.fillRect(SCALE*5,0,2*S-SCALE*5,SCALE*6);
    ctx.fillRect(SCALE*5,4*S-SCALE*6,2*S-SCALE*5,SCALE*6);
    // Backrest
    ctx.fillStyle=C.sfBk; ctx.fillRect(SCALE*5,SCALE*6,SCALE*5,4*S-SCALE*12);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(SCALE*9,SCALE*6,SCALE,4*S-SCALE*12);
    // 3 cushions
    const cH=Math.floor((4*S-SCALE*12)/3);
    for(let i=0;i<3;i++){
      const cy=SCALE*6+i*cH;
      ctx.fillStyle=C.sfSt; ctx.fillRect(SCALE*10,cy,2*S-SCALE*10,cH);
      ctx.fillStyle=C.sfCu; ctx.fillRect(SCALE*11,cy+SCALE,2*S-SCALE*12,cH-SCALE*2);
      ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(SCALE*10,cy+cH-SCALE,2*S-SCALE*10,SCALE);
    }
    // Italy stain
    ctx.fillStyle='rgba(100,70,30,0.45)'; ctx.fillRect(SCALE*12,SCALE*6+cH+SCALE*3,SCALE*6,SCALE*5);
    // Coins
    ctx.fillStyle=C.coinG; ctx.fillRect(SCALE*11,SCALE*6+cH-SCALE,SCALE,SCALE); ctx.fillRect(SCALE*14,SCALE*6+cH*2-SCALE,SCALE,SCALE);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(SCALE*5,4*S-SCALE*2,2*S-SCALE*5,SCALE*2);
  }
});

/* ──────────────────────────────────────────────
   FREESTANDING objects (lit top-left, shadow bottom-right)
────────────────────────────────────────────────── */

/* DINING TABLE — centre room, rows 6-8, cols 8-12 */
OBJECTS.push({
  tx:8,ty:6,w:4,h:3,
  hx:8,hy:6,hw:4,hh:3,
  label:'Table à manger',
  lines:['"3 pattes + 1 Larousse. Tu appelles ça stable."','"Cendrier plein, bouteille vide, factures impayées."','"Gravé : \'SORTEZ D\'ICI\'. Sage."'],
  draw(ctx){
    // Shadow under table
    ctx.fillStyle='rgba(0,0,0,0.14)'; ctx.fillRect(SCALE*2,SCALE*2,4*S-SCALE*4,3*S-SCALE*4);
    // Legs (corner squares)
    ctx.fillStyle=C.tbLeg;
    [[SCALE,SCALE],[4*S-SCALE*3,SCALE],[SCALE,3*S-SCALE*3],[4*S-SCALE*3,3*S-SCALE*3]].forEach(([lx,ly])=>ctx.fillRect(lx,ly,SCALE*2,SCALE*2));
    // Tabletop
    ctx.fillStyle=C.tbTop; ctx.fillRect(SCALE*2,SCALE*2,4*S-SCALE*4,3*S-SCALE*4);
    // Edge highlight (top-left lit)
    ctx.fillStyle='#9a7040'; ctx.fillRect(SCALE*2,SCALE*2,4*S-SCALE*4,SCALE*2);
    ctx.fillRect(SCALE*2,SCALE*2,SCALE*2,3*S-SCALE*4);
    // Edge shadow (bottom-right)
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(SCALE*2,3*S-SCALE*4,4*S-SCALE*4,SCALE*2);
    ctx.fillRect(4*S-SCALE*4,SCALE*2,SCALE*2,3*S-SCALE*4);
    // Engraving
    ctx.strokeStyle='#4a2808'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(S,SCALE*5); ctx.lineTo(3*S,SCALE*5); ctx.stroke();
    // Larousse
    ctx.fillStyle='#4a2060'; ctx.fillRect(4*S-SCALE*2,3*S-SCALE*4,SCALE*4,SCALE*3);
    ctx.fillStyle='#6a3080'; ctx.fillRect(4*S-SCALE*2,3*S-SCALE*4,SCALE*4,SCALE);
    // Ashtray
    ctx.fillStyle='#3a3a3a'; ctx.beginPath(); ctx.arc(S*0.8,S*0.8,SCALE*4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#555'; ctx.beginPath(); ctx.arc(S*0.8,S*0.8,SCALE*2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#c8a070'; ctx.fillRect(S*0.65,S*0.72,SCALE*2,SCALE); ctx.fillRect(S*0.78,S*0.88,SCALE*2,SCALE);
    // Bottle (top-down = circle)
    ctx.fillStyle=C.btGr; ctx.beginPath(); ctx.arc(S*1.3,S*0.7,SCALE*2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.btCp; ctx.beginPath(); ctx.arc(S*1.3,S*0.7,SCALE*1.5,0,Math.PI*2); ctx.fill();
    // Papers
    ctx.fillStyle='#c8c090'; ctx.fillRect(S*2,SCALE*4,S+SCALE*4,S-SCALE*4);
    ctx.fillStyle='#ff4040'; ctx.fillRect(S*2+SCALE*3,SCALE*6,SCALE*5,SCALE);
  }
});

/* CHAIR left of table */
OBJECTS.push({
  tx:6,ty:7,w:2,h:2,
  hx:6,hy:7,hw:2,hh:2,
  label:'Chaise',
  lines:['"Pied fissuré. S\'asseoir = roulette russe."'],
  draw(ctx){
    // Backrest (top strip — back of chair)
    ctx.fillStyle=C.chBk; ctx.fillRect(0,0,2*S,SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,SCALE*4,2*S,SCALE);
    // Seat
    ctx.fillStyle=C.chSt; ctx.fillRect(0,SCALE*5,2*S,2*S-SCALE*6);
    // Crack
    ctx.strokeStyle='#2a1808'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(SCALE*3,SCALE*8); ctx.lineTo(SCALE*8,SCALE*14); ctx.stroke();
    // Legs (corner dots)
    ctx.fillStyle=C.tbLeg;
    ctx.fillRect(0,0,SCALE*2,SCALE*2); ctx.fillRect(2*S-SCALE*2,0,SCALE*2,SCALE*2);
    ctx.fillRect(0,2*S-SCALE*2,SCALE*2,SCALE*2); ctx.fillRect(2*S-SCALE*2,2*S-SCALE*2,SCALE*2,SCALE*2);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,2*S-SCALE*2,2*S,SCALE*2); ctx.fillRect(2*S-SCALE*2,0,SCALE*2,2*S);
  }
});

/* CHAIR right of table */
OBJECTS.push({
  tx:13,ty:7,w:2,h:2,
  hx:13,hy:7,hw:2,hh:2,
  label:'Chaise',
  lines:['"Récupérée sur le trottoir. Elle a vécu."'],
  draw(ctx){
    ctx.fillStyle=C.chBk; ctx.fillRect(0,0,2*S,SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,SCALE*4,2*S,SCALE);
    ctx.fillStyle=C.chSt; ctx.fillRect(0,SCALE*5,2*S,2*S-SCALE*6);
    ctx.fillStyle=C.tbLeg;
    ctx.fillRect(0,0,SCALE*2,SCALE*2); ctx.fillRect(2*S-SCALE*2,0,SCALE*2,SCALE*2);
    ctx.fillRect(0,2*S-SCALE*2,SCALE*2,SCALE*2); ctx.fillRect(2*S-SCALE*2,2*S-SCALE*2,SCALE*2,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,2*S-SCALE*2,2*S,SCALE*2); ctx.fillRect(2*S-SCALE*2,0,SCALE*2,2*S);
  }
});

/* BUCKET under drip — freestanding */
OBJECTS.push({
  tx:4,ty:11,w:1,h:2,
  hx:4,hy:11,hw:1,hh:2,
  label:'Seau',
  lines:['"Soupe du plafond. Pas vidé depuis mardi."','"Quelque chose nage dedans. Tu t\'en fous."'],
  draw(ctx){
    ctx.fillStyle='rgba(100,130,160,0.5)'; ctx.fillRect(S/2-SCALE/2,-S*0.4,SCALE,S*0.4);
    ctx.strokeStyle=C.buHd; ctx.lineWidth=SCALE;
    ctx.beginPath(); ctx.arc(S/2,S*0.5,S*0.27,Math.PI,0); ctx.stroke();
    ctx.fillStyle='#3858a0'; ctx.fillRect(SCALE*2,S*0.5+SCALE*2,S-SCALE*4,S+SCALE);
    ctx.fillStyle=C.buBd; ctx.fillRect(SCALE,S*0.5,S-SCALE*2,S);
    ctx.fillStyle='#80a0c0'; ctx.fillRect(SCALE,S*0.5,S-SCALE*2,SCALE*2);
    ctx.fillStyle=C.buDt; ctx.fillRect(SCALE*2,2*S-SCALE*5,S-SCALE*4,SCALE*4);
    ctx.fillStyle='rgba(80,60,30,0.5)'; ctx.fillRect(SCALE*2,2*S-SCALE*5,S-SCALE*4,SCALE);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(SCALE,2*S-SCALE,S-SCALE*2,SCALE); ctx.fillRect(S-SCALE*2,S*0.5,SCALE*2,S*1.5);
  }
});

/* TRASH PILE — south-west corner */
OBJECTS.push({
  tx:1,ty:12,w:2,h:3,
  hx:1,hy:12,hw:2,hh:3,
  label:'Tas de déchets',
  lines:['"Un système d\'organisation que toi seul comprends."','"3 télécommandes orphelines, 1 rolodex, la vérité."'],
  draw(ctx){
    ctx.fillStyle=C.trBg; ctx.fillRect(0,S,2*S,S);
    ctx.fillStyle=C.trBgT; ctx.fillRect(0,S,2*S,SCALE*2);
    ctx.fillStyle='#484848'; ctx.fillRect(S-SCALE*3,S-SCALE,SCALE*5,SCALE); ctx.fillRect(S+SCALE*3,S-SCALE,SCALE*4,SCALE);
    ctx.fillStyle=C.trBg; ctx.fillRect(SCALE*2,SCALE*2,S+SCALE*4,S-SCALE*2);
    ctx.fillStyle=C.trBgT; ctx.fillRect(SCALE*2,SCALE*2,S+SCALE*4,SCALE*2);
    ctx.fillStyle='#484848'; ctx.fillRect(S-SCALE,SCALE*2,SCALE*4,SCALE);
    ctx.fillStyle='#7a5020'; ctx.fillRect(SCALE,0,S+SCALE*4,SCALE*4);
    ctx.fillStyle=C.btGr; ctx.beginPath(); ctx.arc(S*1.5,SCALE*6,SCALE*2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.btCp; ctx.beginPath(); ctx.arc(S*1.5,SCALE*6,SCALE*1.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,3*S-SCALE,2*S,SCALE);
  }
});

/* MYSTERIOUS BOX — south area, freestanding */
OBJECTS.push({
  tx:6,ty:12,w:2,h:2,
  hx:6,hy:12,hw:2,hh:2,
  label:'Boîte de G. Mouton',
  lines:['"\'NE PAS TOUCHER — G. MOUTON\'. Il est mort en 2019."','"Elle fait un bruit d\'eau. Ce n\'est pas de l\'eau."','"La boîte te regarde."'],
  draw(ctx){
    ctx.fillStyle=C.bxBr; ctx.fillRect(0,0,2*S,2*S);
    ctx.fillStyle=C.bxTp; ctx.fillRect(S-SCALE,0,SCALE*2,2*S); ctx.fillRect(0,S-SCALE,2*S,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.fillRect(0,0,SCALE*5,SCALE*4); ctx.fillRect(2*S-SCALE*5,0,SCALE*5,SCALE*4);
    ctx.fillRect(0,2*S-SCALE*4,SCALE*5,SCALE*4); ctx.fillRect(2*S-SCALE*5,2*S-SCALE*4,SCALE*5,SCALE*4);
    ctx.fillStyle='rgba(200,0,0,0.35)'; ctx.fillRect(SCALE*3,SCALE*4,S+SCALE*2,S/2);
    ctx.fillStyle='#c04040'; ctx.font=`${SCALE*4}px monospace`; ctx.textBaseline='top'; ctx.textAlign='left'; ctx.fillText('!',SCALE*4*1,SCALE*5*1);
    ctx.fillStyle='rgba(0,30,0,0.18)'; ctx.fillRect(SCALE,S+SCALE*2,SCALE*6,SCALE*4);
    // Top-left lit, bottom-right dark
    ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(0,0,2*S,SCALE*2); ctx.fillRect(0,0,SCALE*2,2*S);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,2*S-SCALE,2*S,SCALE); ctx.fillRect(2*S-SCALE*2,0,SCALE*2,2*S);
  }
});

/* POSTER — decorative, on north wall */
OBJECTS.push({
  tx:6,ty:1,w:1,h:1,
  hx:0,hy:0,hw:0,hh:0,
  label:'Poster WANTED',
  lines:['"WANTED — Kevin. Récompense : 1€. Fait sur Word."','"Dessous : \'AUSSI WANTED : le proprio\'."'],
  draw(ctx){
    ctx.fillStyle=C.posBg; ctx.fillRect(0,0,S,S);
    ctx.fillStyle='#500000'; ctx.fillRect(SCALE,SCALE,S-SCALE*2,S-SCALE*2);
    // Skull (8×8 pixel art grid, scaled to ~8 logical px each row)
    const skull=[[0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[1,1,0,1,1,0,1,1],[1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,0],[0,1,0,1,1,0,1,0],[0,0,1,1,1,1,0,0]];
    skull.forEach((row,r)=>row.forEach((v,c)=>{
      if(v){ ctx.fillStyle='#f0e0b0'; ctx.fillRect((c+4)*SCALE,(r+2)*SCALE,SCALE,SCALE); }
    }));
    ctx.fillStyle=C.posRd; ctx.fillRect(SCALE*3,SCALE*11,S-SCALE*6,SCALE*2);
    ctx.fillStyle='rgba(200,200,200,0.6)'; ctx.fillRect(S/2-SCALE,0,SCALE*2,SCALE*2);
    ctx.strokeStyle='#ff2d00'; ctx.lineWidth=1; ctx.strokeRect(SCALE,SCALE,S-SCALE*2,S-SCALE*2);
  }
});

/* ══════ KEVIN — MOB ══════ */
let kevinAlive=true, kevinHitTimer=0, kevinDeathTimer=-1;
/* Kevin at tx:11,ty:11 — coin drops at tx:12,ty:11 (adjacent, never overlaps) */
OBJECTS.push({
  tx:11,ty:11,w:1,h:1,
  isMob:true,mobId:'kevin',
  get alive(){ return kevinAlive; },
  label:'Kevin',
  lines:[
    '"C\'est Kevin. Pas de loyer. Là depuis plus longtemps que toi."',
    '"Kevin te regarde avec mépris. Kevin s\'en sort mieux."',
    '"Kevin a un plan. Kevin ne partage pas."',
  ],
  linesArmed:[
    '"Kevin sent le danger."',
    '"Il te regarde. Il regarde la ventouse."',
    '"Kevin sait ce qui va arriver. Kevin a tort."',
  ],
  draw(ctx){
    if(!kevinAlive){
      // Fade out dead Kevin
      const alpha=Math.max(0,1-(kevinDeathTimer-20)/50);
      if(alpha<=0) return;
      ctx.globalAlpha=alpha;
      ctx.fillStyle=C.ratDd;
      ctx.fillRect(SCALE*2,SCALE*5,S-SCALE*4,S-SCALE*6);
      ctx.fillRect(SCALE*3,SCALE*3,S-SCALE*6,S-SCALE*4);
      ctx.fillStyle='#2a1808';
      ctx.fillRect(SCALE*2,0,SCALE*2,SCALE*4);
      ctx.fillRect(S-SCALE*4,0,SCALE*2,SCALE*4);
      ctx.strokeStyle='#ff4040'; ctx.lineWidth=SCALE;
      [[SCALE*3,SCALE*3],[S-SCALE*6,SCALE*3]].forEach(([ex,ey])=>{
        ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(ex+SCALE*2,ey+SCALE*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex+SCALE*2,ey); ctx.lineTo(ex,ey+SCALE*2); ctx.stroke();
      });
      ctx.fillStyle='#ffe600';
      ctx.font=`${SCALE*3}px serif`; ctx.textBaseline='top'; ctx.textAlign='center';
      ctx.fillText('★',S/2,-SCALE*5);
      ctx.globalAlpha=1; return;
    }
    if(kevinHitTimer>0){
      ctx.globalAlpha=0.45; ctx.fillStyle=C.hit;
      ctx.fillRect(-SCALE,-SCALE,S+SCALE*2,S+SCALE*2); ctx.globalAlpha=1;
    }
    const wb=Math.sin(Date.now()/400)*SCALE*0.6;
    ctx.save(); ctx.translate(0,wb);
    ctx.globalAlpha=0.15; ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(S/2,S*0.9,S*0.28,S*0.06,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    ctx.fillStyle=C.ratBd;
    ctx.fillRect(SCALE*4,SCALE*5,S-SCALE*8,S-SCALE*7);
    ctx.fillRect(SCALE,SCALE*3,S-SCALE*8,S-SCALE*9);
    ctx.fillStyle=C.ratEr;
    ctx.fillRect(SCALE,0,SCALE*4,SCALE*4); ctx.fillRect(SCALE*6,0,SCALE*3,SCALE*4);
    ctx.fillStyle='#c08080';
    ctx.fillRect(SCALE*2,SCALE,SCALE*2,SCALE*2); ctx.fillRect(SCALE*6,SCALE,SCALE,SCALE*2);
    ctx.fillStyle=C.ratEy; ctx.fillRect(SCALE*3,SCALE*4,SCALE*2,SCALE*2);
    ctx.fillStyle='#ff8080'; ctx.fillRect(SCALE*4,SCALE*4,SCALE,SCALE);
    ctx.fillStyle='#ff8080'; ctx.fillRect(SCALE,SCALE*6,SCALE*2,SCALE);
    ctx.strokeStyle='#2a1a10'; ctx.lineWidth=SCALE*0.8;
    ctx.beginPath();
    ctx.moveTo((S-SCALE*2)*1,SCALE*10*1);
    ctx.quadraticCurveTo(S*1.2,SCALE*15*1,(S+SCALE*5)*1,SCALE*12*1);
    ctx.stroke();
    ctx.strokeStyle='#c8b090'; ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo(SCALE,SCALE*6); ctx.lineTo(-SCALE*4,SCALE*5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(SCALE,SCALE*7); ctx.lineTo(-SCALE*4,SCALE*8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(SCALE,SCALE*5); ctx.lineTo(-SCALE*3,SCALE*4); ctx.stroke();
    ctx.restore();
  }
});

/* COIN reward — on a DIFFERENT tile than Kevin (tx:12,ty:11) */
let coinVisible=false;
OBJECTS.push({
  tx:12,ty:11,w:1,h:1,
  isCoin:true,
  hx:0,hy:0,hw:0,hh:0,       // no collision
  get _skip(){ return !coinVisible; },
  label:'1€',
  lines:['★ +1€ ramassé ! Kevin n\'aurait pas dû.'],
  draw(ctx){
    if(!coinVisible) return;
    const b=Math.sin(Date.now()/250)*SCALE;
    ctx.save(); ctx.translate(0,b);
    ctx.fillStyle=C.coinG; ctx.beginPath(); ctx.arc(S/2,S/2,SCALE*5.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.coinD; ctx.beginPath(); ctx.arc(S/2,S/2,SCALE*4.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.coinG; ctx.beginPath(); ctx.arc(S/2,S/2,SCALE*3.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffffa0';
    ctx.font=`bold ${SCALE*5}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('€',S/2,S/2);
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillRect(S/2-SCALE*4,S/2-SCALE,SCALE,SCALE);
    ctx.restore();
  }
});

/* PLUNGER — pickable weapon, south-east area */
OBJECTS.push({
  tx:17,ty:13,w:1,h:2,
  hx:17,hy:13,hw:1,hh:2,
  label:'Ventouse Sacrée ★',
  pickable:true,itemId:'plunger',
  itemName:'Ventouse Sacrée',
  itemDesc:'ATK +1 | Certifiée sur rongeurs et créanciers.',
  lines:['"LA ventouse. Ton seul outil. Ta seule arme."','"Elle brille d\'une aura étrange. +1 Débrouillardise."','"[ E pour RAMASSER ]"'],
  draw(ctx){
    const g=0.1+0.07*Math.sin(Date.now()/400);
    ctx.fillStyle=`rgba(255,220,0,${g})`; ctx.fillRect(-SCALE*3,-SCALE*3,S+SCALE*6,2*S+SCALE*6);
    // Stick (vertical — top-down)
    ctx.fillStyle=C.plSt; ctx.fillRect(S/2-SCALE,0,SCALE*2,2*S-SCALE*5);
    ctx.fillStyle='#6a4020'; ctx.fillRect(S/2-SCALE,0,SCALE,2*S-SCALE*5);
    // Cup (wider base)
    ctx.fillStyle=C.plCp; ctx.fillRect(SCALE*2,2*S-SCALE*6,S-SCALE*4,SCALE*5); ctx.fillRect(0,2*S-SCALE*4,S,SCALE*3);
    ctx.fillStyle=C.plCpD; ctx.fillRect(0,2*S-SCALE*2,S,SCALE*2);
    // Highlight
    ctx.fillStyle='rgba(255,100,80,0.4)'; ctx.fillRect(SCALE*2,2*S-SCALE*5,SCALE*3,SCALE*3);
    // Sparkles
    const t=Date.now()/300;
    ctx.fillStyle='#ffe600';
    [0,1,2].forEach(i=>{ ctx.fillRect(Math.cos(t+i*2.1)*SCALE*5+S/2-SCALE/2,Math.sin(t+i*2.1)*SCALE*4+S*0.6-SCALE/2,SCALE,SCALE); });
  }
});

/* ══════════════════════════════════════════════════
   PLAYER
══════════════════════════════════════════════════ */
let player={
  tx:3.0,ty:4.5,
  facing:'down',frame:0,frameTimer:0,attackTimer:0,
  money:loadMoney(),dignity:0,inventory:[],weapon:null,
};

/* ══════════════════════════════════════════════════
   INPUT / STATE
══════════════════════════════════════════════════ */
const keys={};
let pendingPickup=null,pendingCoin=false;
document.addEventListener('keydown',e=>{
  keys[e.key.toLowerCase()]=true;
  if(e.key.toLowerCase()==='e'){
    if(gameState==='dialog') advanceDialog();
    else tryInteract();
  }
  if(e.key.toLowerCase()==='q') toggleInventory();
  if(e.key==='Escape') togglePause();
});
document.addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; });

let gameState='playing';
let dialogQueue=[],dialogIdx=0,dialogObj=null;

/* ══════════════════════════════════════════════════
   CANVAS
══════════════════════════════════════════════════ */
let canvas,ctx,uiCanvas,uiCtx;

function startWorld(){
  const wrapper=document.createElement('div');
  wrapper.id='game-wrapper';
  wrapper.style.cssText='position:fixed;inset:0;z-index:300;background:#0e0800;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'><text y=\'24\' font-size=\'24\'>💸</text></svg>") 16 16, auto;';
  canvas=document.createElement('canvas');
  canvas.style.cssText='image-rendering:pixelated;image-rendering:crisp-edges;position:absolute;';
  uiCanvas=document.createElement('canvas');
  uiCanvas.style.cssText='position:absolute;top:0;left:0;image-rendering:pixelated;pointer-events:none;';
  wrapper.appendChild(canvas); wrapper.appendChild(uiCanvas);
  document.body.appendChild(wrapper);
  ctx=canvas.getContext('2d'); uiCtx=uiCanvas.getContext('2d');
  ctx.imageSmoothingEnabled=uiCtx.imageSmoothingEnabled=false;
  resizeGame(); window.addEventListener('resize',resizeGame);
  setTimeout(()=>showDialog(null,[
    '📢 MARDI, 07H43.',`"Loyer dû dans 3 jours. Solde : ${player.money}€."`,
    '"La ventouse est dans le coin sud. Kevin traîne quelque part."',
    '"Évite le trou dans le plancher."',
  ]),400);
  requestAnimationFrame(gameLoop);
}

function resizeGame(){
  const W=window.innerWidth,H=window.innerHeight,mW=COLS*S,mH=ROWS*S;
  canvas.width=mW; canvas.height=mH;
  // Fit entire map in screen with small padding
  const fit=Math.min((W-16)/mW,(H-56)/mH); // 56px for HUD top bar
  const dW=Math.round(mW*fit), dH=Math.round(mH*fit);
  canvas.style.width=dW+'px'; canvas.style.height=dH+'px';
  canvas.style.left=((W-dW)/2)+'px'; canvas.style.top=((H-dH+56)/2)+'px';
  uiCanvas.width=W; uiCanvas.height=H; uiCanvas.style.width=W+'px'; uiCanvas.style.height=H+'px';
}

/* ══════ LOOP ══════ */
let lastTime=0;
function gameLoop(ts){
  const dt=Math.min((ts-lastTime)/1000,0.05); lastTime=ts;
  if(gameState==='playing') updatePlayer(dt);
  if(kevinHitTimer>0) kevinHitTimer=Math.max(0,kevinHitTimer-dt*8);
  if(kevinDeathTimer>=0) kevinDeathTimer+=dt*60;
  if(player.attackTimer>0) player.attackTimer=Math.max(0,player.attackTimer-dt*8);
  drawWorld(); drawUI(); requestAnimationFrame(gameLoop);
}

/* ══════ UPDATE ══════ */
const SPEED=5.5;
function updatePlayer(dt){
  let dx=0,dy=0;
  if(keys['w']||keys['arrowup'])    dy=-1;
  if(keys['s']||keys['arrowdown'])  dy= 1;
  if(keys['a']||keys['arrowleft'])  dx=-1;
  if(keys['d']||keys['arrowright']) dx= 1;
  if(dx&&dy){dx*=0.707;dy*=0.707;}
  if(dx||dy){
    const nx=player.tx+dx*SPEED*dt,ny=player.ty+dy*SPEED*dt;
    if(!isSolid(nx,player.ty)) player.tx=nx;
    if(!isSolid(player.tx,ny)) player.ty=ny;
    if(Math.abs(dx)>Math.abs(dy)) player.facing=dx>0?'right':'left';
    else player.facing=dy>0?'down':'up';
    player.frameTimer+=dt;
    if(player.frameTimer>0.12){player.frameTimer=0;player.frame=(player.frame+1)%4;}
  } else player.frame=0;
}

function isSolid(tx,ty){
  const c=Math.floor(tx),r=Math.floor(ty);
  if(c<0||r<0||c>=COLS||r>=ROWS) return true;
  if(SOLID_T.has(MAP[r]?.[c])) return true;
  for(const obj of OBJECTS){
    if(obj._skip||obj.isCoin) continue;
    if(obj.isMob&&!obj.alive) continue;
    const hx=obj.hx!==undefined?obj.hx:obj.tx;
    const hy=obj.hy!==undefined?obj.hy:obj.ty;
    const hw=obj.hx!==undefined?obj.hw:obj.w;
    const hh=obj.hy!==undefined?obj.hh:obj.h;
    if(hw===0||hh===0) continue;
    // Player bounding box: 0.4 wide, 0.4 tall centred on (tx+0.5, ty+0.5)
    const pL=tx+0.15, pR=tx+0.85, pT=ty+0.15, pB=ty+0.85;
    const oR=hx+hw, oB=hy+hh;
    if(pR>hx&&pL<oR&&pB>hy&&pT<oB) return true;
  }
  return false;
}

function triggerDeath(){ /* removed — no more holes */ }

/* ══════ INTERACT ══════ */
function tryInteract(){
  if(gameState!=='playing') return;
  const off={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const [ox,oy]=off[player.facing];
  const cx=Math.floor(player.tx)+ox,cy=Math.floor(player.ty)+oy;
  const px2=Math.floor(player.tx),py2=Math.floor(player.ty);

  for(const obj of OBJECTS){
    // coins: skip if not visible, but still check if visible
    if(obj._skip) continue;
    const hit=(cx>=obj.tx&&cx<obj.tx+obj.w&&cy>=obj.ty&&cy<obj.ty+obj.h)
           ||(px2>=obj.tx&&px2<obj.tx+obj.w&&py2>=obj.ty&&py2<obj.ty+obj.h);
    if(!hit) continue;
    if(obj.isCoin){ showDialog(obj,obj.lines); pendingCoin=true; return; }
    if(obj.isMob&&obj.mobId==='kevin'){
      if(!obj.alive) continue;   // Kevin mort = on continue, la pièce peut être trouvée
      if(!player.weapon) showDialog(obj,obj.lines);
      else showDialog(obj,obj.linesArmed);
      return;
    }
    if(obj.pickable){
      if(player.inventory.find(i=>i.id===obj.itemId)) showDialog(obj,['"Tu l\'as déjà."']);
      else{ showDialog(obj,obj.lines); pendingPickup=obj; }
      return;
    }
    showDialog(obj,obj.lines); return;
  }
  if((cx===11||cx===12)&&cy===17||(px2===11||px2===12)&&py2===17)
    showDialog(null,['"La porte. Le MONDE."','"(Bientôt...)"']);
}

function showDialog(obj,lines){
  if(gameState==='dialog') return;
  dialogObj=obj; dialogQueue=lines; dialogIdx=0; gameState='dialog';
}

function advanceDialog(){
  // Snapshot before advancing — needed to detect kevin armed
  const wasKevinArmed = dialogObj && dialogObj.isMob && dialogObj.mobId==='kevin' && player.weapon;
  const wasPendingPickup = pendingPickup;
  const wasPendingCoin   = pendingCoin;
  dialogIdx++;
  if(dialogIdx < dialogQueue.length) return; // more lines to show
  // Dialog finished
  gameState='playing'; dialogObj=null;
  if(wasKevinArmed){ attackKevin(); return; }
  if(wasPendingPickup){ pendingPickup=null; doPickup(wasPendingPickup); return; }
  if(wasPendingCoin){ pendingCoin=false; collectCoin(); return; }
}

function attackKevin(){
  player.attackTimer=1; kevinHitTimer=1; kevinAlive=false; kevinDeathTimer=0;
  setTimeout(()=>{coinVisible=true;},800);
  showDialog(null,[
    '★ KEVIN VAINCU par la Ventouse Sacrée !',
    '"Kevin n\'aurait pas dû traîner là."',
    '"[ Récupère la récompense : 1€ ]"',
  ]);
}

function collectCoin(){
  coinVisible=false; player.money+=1; saveMoney(player.money);
  gameState='playing'; dialogObj=null;
  showDialog(null,[`★ +1€ ! Solde : ${player.money}€.`,'"Kevin est mort pour ça. C\'est du business."']);
}

function doPickup(obj){
  player.inventory.push({id:obj.itemId,name:obj.itemName,desc:obj.itemDesc,isWeapon:true,atk:1});
  player.weapon=obj.itemId;
  const idx=OBJECTS.indexOf(obj); if(idx>-1) OBJECTS.splice(idx,1);
  dialogObj=null;
  dialogQueue=['★ RAMASSÉ : '+obj.itemName,obj.itemDesc,'"Tu brandis la ventouse. Kevin est nerveux."'];
  dialogIdx=0; gameState='dialog';
}

function toggleInventory(){ if(gameState==='dialog') return; gameState=gameState==='inventory'?'playing':'inventory'; }
function togglePause(){ if(gameState==='dialog'||gameState==='inventory') return; gameState=gameState==='paused'?'playing':'paused'; }

/* ══════ DRAW WORLD ══════ */
function drawWorld(){
  ctx.fillStyle='#0a0604'; ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) drawTile(c,r);
  // Sort objects by bottom edge (painter's algorithm)
  [...OBJECTS].filter(o=>!o._skip).sort((a,b)=>(a.ty+a.h)-(b.ty+b.h)).forEach(obj=>{
    ctx.save(); ctx.translate(obj.tx*S,obj.ty*S); obj.draw(ctx); ctx.restore();
  });
  drawPlayer();
  drawHint();
  if(player.attackTimer>0.3) drawSlash();
}

/* ══════ TILE RENDERER ══════ */
const WT=5*SCALE; // wall face height

function drawTile(col,row){
  ctx.save(); ctx.translate(col*S,row*S);
  const t=MAP[row]?.[col];
  switch(t){
    case _:  drawFloor(col,row); break;
    case CK: drawFloor(col,row); drawCrack(); break;
    case RG: drawFloor(col,row); drawRug(); break;
    case N:  drawWallN(); break;
    case Sv: drawWallS(); break;
    case Wl: drawWallW(); break;
    case Er: drawWallE(); break;
    case NW: drawCorner('NW'); break; case NE: drawCorner('NE'); break;
    case SW: drawCorner('SW'); break; case SE: drawCorner('SE'); break;
    case DR: drawFloor(col,row); drawDoor(); break;
    default: drawFloor(col,row); break;
  }
  ctx.restore();
}

function drawFloor(col,row){
  const v=(col*3+row*7)%3;
  ctx.fillStyle=v===0?C.flA:v===1?C.flB:C.flC;
  ctx.fillRect(0,0,S,S);
  ctx.fillStyle=C.flDark;
  for(let p=4;p<TILE;p+=4) ctx.fillRect(0,p*SCALE,S,1);
  if((col+row*2)%5===0){ ctx.globalAlpha=0.08; ctx.fillStyle=C.flCrack; ctx.fillRect(Math.floor(S*0.3),0,1,S); ctx.globalAlpha=1; }
}
function drawCrack(){
  ctx.strokeStyle=C.flCrack; ctx.lineWidth=SCALE*0.5;
  ctx.beginPath(); ctx.moveTo(S*0.2,S*0.1); ctx.lineTo(S*0.5,S*0.55); ctx.lineTo(S*0.3,S*0.9); ctx.stroke();
}
function drawRug(){
  const p=SCALE;
  ctx.fillStyle=C.rugA; ctx.fillRect(p,p,S-2*p,S-2*p);
  ctx.fillStyle=C.rugB; ctx.fillRect(3*p,3*p,S-6*p,S-6*p);
  ctx.fillStyle=C.rugBrd; ctx.fillRect(p,p,S-2*p,p); ctx.fillRect(p,S-2*p,S-2*p,p); ctx.fillRect(p,p,p,S-2*p); ctx.fillRect(S-2*p,p,p,S-2*p);
  ctx.fillStyle=C.rugAcc; ctx.fillRect(S/2-p,S/2-p,2*p,2*p);
}
function drawVoid(){
  ctx.fillStyle=C.holeDk; ctx.fillRect(0,0,S,S);
  ctx.fillStyle=C.holeMd; ctx.fillRect(SCALE,SCALE,S-SCALE*2,S-SCALE*2);
  ctx.fillStyle='#060302'; ctx.fillRect(SCALE*2,SCALE*2,S-SCALE*4,S-SCALE*4);
  ctx.fillStyle='#020100'; ctx.fillRect(SCALE*3,SCALE*3,S-SCALE*6,S-SCALE*6);
  ctx.strokeStyle=C.holeRm; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(SCALE*3,SCALE*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(S,0); ctx.lineTo(S-SCALE*2,SCALE*3); ctx.stroke();
}
function drawHoleRim(){
  ctx.fillStyle=C.holeRm; ctx.fillRect(SCALE,SCALE,S-SCALE*2,S-SCALE*2);
  ctx.fillStyle='#1a1008'; ctx.fillRect(SCALE*2,SCALE*2,S-SCALE*4,S-SCALE*4);
}
/* North wall: thin lit top + tall front face + bottom shadow */
function drawWallN(){
  ctx.fillStyle=C.wTop; ctx.fillRect(0,0,S,SCALE*3);
  ctx.fillStyle=C.wFace; ctx.fillRect(0,SCALE*3,S,S-SCALE*3);
  for(let p=3;p<TILE;p+=3){ ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(0,p*SCALE,S,SCALE); }
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(S/3,S*0.55,SCALE*1.5,SCALE,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,S-SCALE*4,S,SCALE*4);
}
/* South wall */
function drawWallS(){
  ctx.fillStyle=C.wFace; ctx.fillRect(0,0,S,S-SCALE*3);
  for(let p=0;p<TILE-3;p+=3){ ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(0,p*SCALE,S,SCALE); }
  ctx.fillStyle=C.wTop; ctx.fillRect(0,S-SCALE*3,S,SCALE*3);
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,0,S,SCALE*3);
}
/* West wall: lit right strip + dark body */
function drawWallW(){
  ctx.fillStyle=C.wFace; ctx.fillRect(0,0,S,S);
  ctx.fillStyle=C.wTop; ctx.fillRect(0,0,SCALE*5,S);
  for(let p=0;p<TILE;p+=3){ ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(SCALE*5,p*SCALE,S-SCALE*5,SCALE); }
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(S-SCALE*4,0,SCALE*4,S);
}
/* East wall: lit right strip + dark body */
function drawWallE(){
  ctx.fillStyle=C.wFace; ctx.fillRect(0,0,S,S);
  ctx.fillStyle=C.wTop; ctx.fillRect(S-SCALE*5,0,SCALE*5,S);
  for(let p=0;p<TILE;p+=3){ ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(0,p*SCALE,S-SCALE*5,SCALE); }
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,0,SCALE*4,S);
}
function drawCorner(type){
  ctx.fillStyle=C.wFace; ctx.fillRect(0,0,S,S);
  if(type==='NW'||type==='NE') ctx.fillStyle=C.wTop,ctx.fillRect(0,0,S,SCALE*5);
  if(type==='SW'||type==='SE') ctx.fillStyle=C.wTop,ctx.fillRect(0,S-SCALE*5,S,SCALE*5);
  if(type==='NW'||type==='SW') ctx.fillStyle=C.wTop,ctx.fillRect(0,0,SCALE*5,S);
  if(type==='NE'||type==='SE') ctx.fillStyle=C.wTop,ctx.fillRect(S-SCALE*5,0,SCALE*5,S);
  ctx.fillStyle='rgba(0,0,0,0.35)';
  if(type==='NW') ctx.fillRect(S-SCALE*4,SCALE*5,SCALE*4,S-SCALE*5);
  if(type==='NE') ctx.fillRect(0,SCALE*5,SCALE*4,S-SCALE*5);
  if(type==='SW') ctx.fillRect(S-SCALE*4,0,SCALE*4,S-SCALE*5);
  if(type==='SE') ctx.fillRect(0,0,SCALE*4,S-SCALE*5);
}
function drawDoor(){
  ctx.fillStyle=C.doorFr; ctx.fillRect(0,0,S,SCALE*4); ctx.fillRect(0,0,SCALE*2,S); ctx.fillRect(S-SCALE*2,0,SCALE*2,S);
  ctx.fillStyle=C.doorOpen; ctx.fillRect(SCALE*2,0,S-SCALE*4,SCALE*4);
  ctx.fillStyle='#2a1800'; ctx.fillRect(0,SCALE*3,S,SCALE);
}

/* ══════ PLAYER ══════ */
function drawPlayer(){
  const x=player.tx*S+S/2,y=player.ty*S+S/2;
  const bob=(player.frame===1||player.frame===3)?-SCALE:0;
  const loff=player.frame===1?2:player.frame===3?-2:0;
  const aoff=player.frame===1?-2:player.frame===3?2:0;
  const p=SCALE,atk=player.attackTimer>0.3;
  ctx.save(); ctx.translate(x,y+bob);
  ctx.globalAlpha=0.2; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(0,S*0.38,S*0.22,S*0.062,0,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
  const fl=player.facing==='left';
  if(fl) ctx.scale(-1,1);

  // Legs
  ctx.fillStyle='#252018';
  ctx.fillRect(-5*p,4*p,4*p,8*p+loff*p); ctx.fillRect(1*p,4*p,4*p,8*p-loff*p);
  ctx.fillStyle='#353028'; ctx.fillRect(-4*p,7*p+loff*p,2*p,2*p);
  // Shoes
  ctx.fillStyle='#101008';
  ctx.fillRect(-7*p,12*p+loff*p,7*p,3*p); ctx.fillRect(1*p,12*p-loff*p,7*p,3*p);
  ctx.fillStyle='#1e1c10'; ctx.fillRect(-7*p,12*p+loff*p,7*p,SCALE); ctx.fillRect(1*p,12*p-loff*p,7*p,SCALE);

  // Arms
  if(atk){
    ctx.fillStyle='#4a5a2a'; ctx.fillRect(-11*p,-7*p,4*p,11*p); ctx.fillRect(7*p,-11*p,4*p,11*p);
    ctx.fillStyle='#c8a070'; ctx.fillRect(-11*p,3*p,4*p,3*p); ctx.fillRect(7*p,-11*p,4*p,3*p);
  } else {
    ctx.fillStyle='#4a5a2a'; ctx.fillRect(-9*p,-5*p+aoff*p,4*p,10*p); ctx.fillRect(5*p,-5*p-aoff*p,4*p,10*p);
    ctx.fillStyle='#c8a070'; ctx.fillRect(-9*p,4*p+aoff*p,4*p,3*p); ctx.fillRect(5*p,4*p-aoff*p,4*p,3*p);
  }

  // Weapon
  if(player.weapon==='plunger'){
    ctx.save();
    if(atk){ctx.translate(13*p,-13*p);ctx.rotate(-0.85);}
    else ctx.translate(10*p,-4*p-aoff*p);
    ctx.fillStyle=C.plSt; ctx.fillRect(-p,0,p*2,13*p); ctx.fillStyle='#6a4020'; ctx.fillRect(-p,0,p,13*p);
    ctx.fillStyle=C.plCp; ctx.fillRect(-p*3,12*p,p*6,p*4); ctx.fillRect(-p*2,14*p,p*4,p*2);
    ctx.fillStyle=C.plCpD; ctx.fillRect(-p*3,15*p,p*6,p);
    if(atk){ctx.globalAlpha=0.55;ctx.fillStyle='#ff6040';ctx.fillRect(-p*4,11*p,p*8,p*7);ctx.globalAlpha=1;}
    ctx.restore();
  }

  // Coat
  ctx.fillStyle='#4a5a2a'; ctx.fillRect(-6*p,-8*p,12*p,13*p);
  ctx.fillStyle='#3a4a1a'; ctx.fillRect(-6*p,-8*p,3*p,6*p); ctx.fillRect(3*p,-8*p,3*p,6*p);
  ctx.fillStyle='#7a6040'; ctx.fillRect(-1*p,-2*p,3*p,4*p);
  ctx.fillStyle='#2a3a10'; ctx.fillRect(2*p,0,2*p,6*p);
  ctx.fillStyle='#1a1008'; ctx.fillRect(-6*p,3*p,12*p,2*p);
  ctx.fillStyle='#c8a060'; ctx.fillRect(-p,3*p,2*p,2*p);

  // Neck + head
  ctx.fillStyle='#c8a070'; ctx.fillRect(-2*p,-9*p,4*p,2*p); ctx.fillRect(-5*p,-18*p,10*p,9*p);
  ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(-5*p,-10*p,10*p,2*p);

  // Hair
  ctx.fillStyle='#231a0a';
  ctx.fillRect(-5*p,-19*p,10*p,3*p); ctx.fillRect(-6*p,-18*p,2*p,5*p); ctx.fillRect(4*p,-18*p,3*p,4*p);
  ctx.fillRect(-3*p,-20*p,2*p,2*p); ctx.fillRect(1*p,-20*p,3*p,2*p);

  // Face
  if(player.facing==='up'){
    ctx.fillStyle='#231a0a'; ctx.fillRect(-3*p,-15*p,6*p,2*p);
  } else {
    ctx.fillStyle='#ecddc0'; ctx.fillRect(-4*p,-16*p,3*p,3*p); ctx.fillRect(1*p,-16*p,3*p,3*p);
    ctx.fillStyle='#1a0a04'; ctx.fillRect(-3*p,-15*p,2*p,2*p); ctx.fillRect(1*p,-15*p,2*p,2*p);
    ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.fillRect(-3*p,-16*p,p,p); ctx.fillRect(1*p,-16*p,p,p);
    ctx.fillStyle='#a08068'; ctx.fillRect(-4*p,-13*p,3*p,p); ctx.fillRect(1*p,-13*p,3*p,p);
    ctx.fillStyle='#b08060'; ctx.fillRect(-p,-14*p,2*p,2*p);
    ctx.fillStyle='#6a5038'; ctx.fillRect(-3*p,-12*p,2*p,p); ctx.fillRect(0,-12*p,2*p,p); ctx.fillRect(-2*p,-11*p,5*p,p);
  }
  ctx.restore();
}

function drawSlash(){
  const off={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const [ox,oy]=off[player.facing];
  const x=(player.tx+ox+0.5)*S,y=(player.ty+oy+0.5)*S,a=player.attackTimer;
  ctx.save(); ctx.globalAlpha=a*0.85;
  ctx.strokeStyle='#ff6020'; ctx.lineWidth=SCALE*2;
  ctx.beginPath(); ctx.moveTo(x-S*0.5,y-S*0.5); ctx.lineTo(x+S*0.5,y+S*0.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+S*0.5,y-S*0.5); ctx.lineTo(x-S*0.5,y+S*0.5); ctx.stroke();
  ctx.strokeStyle='#ffe600'; ctx.lineWidth=SCALE;
  ctx.beginPath(); ctx.moveTo(x-S*0.4,y); ctx.lineTo(x+S*0.4,y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x,y-S*0.4); ctx.lineTo(x,y+S*0.4); ctx.stroke();
  ctx.restore();
}

/* ══════ HINT ══════ */
function drawHint(){
  if(gameState!=='playing') return;
  const off={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const [ox,oy]=off[player.facing];
  const cx=Math.floor(player.tx)+ox,cy=Math.floor(player.ty)+oy;
  let nearObj=null;
  for(const obj of OBJECTS){
    if(obj._skip) continue;
    if(cx>=obj.tx&&cx<obj.tx+obj.w&&cy>=obj.ty&&cy<obj.ty+obj.h){nearObj=obj;break;}
  }
  const nearDoor=(cx===11||cx===12)&&cy===17;
  if(!nearObj&&!nearDoor) return;
  const tx2=nearObj?(nearObj.tx+nearObj.w/2)*S:11.5*S;
  const ty2=nearObj?nearObj.ty*S-SCALE*6:17*S-SCALE*6;
  let label='E',col=C.hintBg;
  if(nearObj?.isMob&&nearObj.alive&&player.weapon){label='E  ATTAQUER';col='#ff4040';}
  else if(nearObj?.pickable&&!player.inventory.find(i=>i.id===nearObj.itemId)) label='E  PRENDRE';
  else if(nearObj?.isCoin){label='E  +1€';col='#ffe600';}
  const bw=label.length>1?S*2.4:S*0.82;
  const pulse=0.82+0.18*Math.sin(Date.now()/250);
  ctx.save(); ctx.globalAlpha=pulse;
  ctx.fillStyle=col; ctx.strokeStyle=C.hintTx; ctx.lineWidth=SCALE;
  rRect(ctx,tx2-bw/2,ty2-S*0.35,bw,S*0.56,SCALE*2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle=C.hintTx; ctx.font=`bold ${SCALE*4}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,tx2,ty2-S*0.08);
  ctx.restore();
}
function rRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();}

/* ══════ DEATH SCREEN ══════ */
function drawDeathScreen(){
  const W=uiCanvas.width,H=uiCanvas.height,al=Math.min(1,deathTimer*2);
  uiCtx.clearRect(0,0,W,H);
  uiCtx.fillStyle=`rgba(0,0,0,${al*0.88})`; uiCtx.fillRect(0,0,W,H);
  if(al<0.5) return;
  const a2=Math.min(1,(al-0.5)*3),bw=Math.min(500,W-40),bh=320,bx=(W-bw)/2,by=(H-bh)/2;
  uiCtx.globalAlpha=a2;
  uiCtx.fillStyle='#0e0800'; uiCtx.strokeStyle='#ff2d00'; uiCtx.lineWidth=3;
  uiCtx.beginPath(); uiCtx.roundRect(bx,by,bw,bh,10); uiCtx.fill(); uiCtx.stroke();
  uiCtx.fillStyle='#ff2d00'; uiCtx.fillRect(bx+3,by+3,bw-6,3);
  uiCtx.font='bold 52px "Bebas Neue",sans-serif'; uiCtx.fillStyle='#ff2d00'; uiCtx.textAlign='center'; uiCtx.textBaseline='top'; uiCtx.fillText('T\'ES MORT(E)',W/2,by+22);
  uiCtx.font='18px "Permanent Marker",cursive'; uiCtx.fillStyle='#f2e8c9';
  uiCtx.fillText('Tu es tombé dans le trou.',W/2,by+90); uiCtx.fillText('Le sol n\'était pas là. Classique.',W/2,by+122);
  uiCtx.strokeStyle='rgba(255,45,0,0.3)'; uiCtx.lineWidth=1; uiCtx.beginPath(); uiCtx.moveTo(bx+24,by+158); uiCtx.lineTo(bx+bw-24,by+158); uiCtx.stroke();
  uiCtx.font='14px "IBM Plex Mono",monospace'; uiCtx.fillStyle='#ffe600'; uiCtx.fillText(`💰 Argent sauvegardé : ${player.money}€`,W/2,by+174);
  uiCtx.fillStyle='rgba(255,255,255,0.4)'; uiCtx.font='12px "IBM Plex Mono",monospace'; uiCtx.fillText('☠ Dignité : partie intégrale',W/2,by+198);
  if(deathTimer>1.5){const blk=Math.floor(Date.now()/600)%2===0;uiCtx.fillStyle=blk?'#ffe600':'rgba(255,230,0,0.4)';uiCtx.font='bold 14px "IBM Plex Mono",monospace';uiCtx.fillText('[ ESPACE ou CLIC pour recommencer ]',W/2,by+246);}
  uiCtx.fillStyle='rgba(255,255,255,0.2)'; uiCtx.font='10px "IBM Plex Mono",monospace'; uiCtx.fillText('© 2025 Nobody Studios • la vie continue (à peine)',W/2,by+bh-18);
  uiCtx.globalAlpha=1;
  if(deathTimer>1.5&&!window._dha){
    window._dha=true;
    const restart=()=>{window._dha=false;restartGame();};
    document.addEventListener('keydown',function h(e){if(e.code==='Space'||e.key==='Enter'){document.removeEventListener('keydown',h);restart();}});
    uiCanvas.addEventListener('click',function h(){uiCanvas.removeEventListener('click',h);restart();},{once:true});
  }
}

function restartGame(){
  isDead=false;deathTimer=0;kevinAlive=true;kevinHitTimer=0;kevinDeathTimer=-1;coinVisible=false;
  player.tx=3.0;player.ty=4.5;player.facing='down';player.frame=0;player.attackTimer=0;
  player.dignity=0;player.inventory=[];player.weapon=null;
  pendingPickup=null;pendingCoin=false;
  gameState='playing';dialogObj=null;dialogQueue=[];dialogIdx=0;
  if(!OBJECTS.find(o=>o.pickable&&o.itemId==='plunger')){
    OBJECTS.push({tx:17,ty:13,w:1,h:2,hx:17,hy:13,hw:1,hh:2,label:'Ventouse Sacrée ★',pickable:true,itemId:'plunger',itemName:'Ventouse Sacrée',itemDesc:'ATK +1 | Certifiée sur rongeurs.',
      lines:['"LA ventouse."','"[ E pour RAMASSER ]"'],
      draw(ctx){const g=0.1+0.07*Math.sin(Date.now()/400);ctx.fillStyle=`rgba(255,220,0,${g})`;ctx.fillRect(-SCALE*3,-SCALE*3,S+SCALE*6,2*S+SCALE*6);ctx.fillStyle=C.plSt;ctx.fillRect(S/2-SCALE,0,SCALE*2,2*S-SCALE*5);ctx.fillStyle=C.plCp;ctx.fillRect(SCALE*2,2*S-SCALE*6,S-SCALE*4,SCALE*5);ctx.fillRect(0,2*S-SCALE*4,S,SCALE*3);ctx.fillStyle=C.plCpD;ctx.fillRect(0,2*S-SCALE*2,S,SCALE*2);const t=Date.now()/300;ctx.fillStyle='#ffe600';[0,1,2].forEach(i=>ctx.fillRect(Math.cos(t+i*2.1)*SCALE*5+S/2-SCALE/2,Math.sin(t+i*2.1)*SCALE*4+S*0.6-SCALE/2,SCALE,SCALE));}
    });
  }
  showDialog(null,['"Tu te réveilles. Encore."',`"Solde : ${player.money}€."`,'"Kevin est quelque part."']);
}

/* ══════ UI ══════ */
function drawUI(){uiCtx.clearRect(0,0,uiCanvas.width,uiCanvas.height);drawHUD();if(gameState==='dialog')drawDialog();if(gameState==='inventory')drawInventory();if(gameState==='paused')drawPause();}

function drawHUD(){
  const W=uiCanvas.width,pad=14;
  uiCtx.fillStyle='rgba(10,6,0,0.9)';uiCtx.fillRect(0,0,W,48);
  uiCtx.fillStyle='#ffe600';uiCtx.fillRect(0,46,W,2);
  uiCtx.font='bold 14px "IBM Plex Mono",monospace';uiCtx.fillStyle='#ffe600';uiCtx.textBaseline='middle';
  uiCtx.textAlign='left';
  uiCtx.fillText(`💰 ${player.money}€`,pad,24);
  uiCtx.fillText(`☠ DIGNITY: ${player.dignity}%`,pad+150,24);
  if(player.weapon){uiCtx.fillStyle='#ff6040';uiCtx.fillText(`⚔ ${player.inventory.find(i=>i.id===player.weapon)?.name||''}`,pad+360,24);}
  if(!kevinAlive){uiCtx.fillStyle='rgba(255,80,40,0.65)';uiCtx.font='10px "IBM Plex Mono",monospace';uiCtx.fillText('☠ Kevin: VAINCU',pad+580,24);}
  uiCtx.textAlign='right';uiCtx.fillStyle='rgba(255,255,255,0.28)';uiCtx.font='10px "IBM Plex Mono",monospace';
  uiCtx.fillText('[E] Interagir  [Q] Inventaire  [ESC] Pause',W-pad,24);
}

function drawDialog(){
  if(!dialogQueue.length) return;
  const W=uiCanvas.width,H=uiCanvas.height,bh=155,bw=W-48,bx=24,by=H-bh-24;
  uiCtx.save();
  uiCtx.fillStyle='rgba(8,5,0,0.94)';uiCtx.strokeStyle='#ffe600';uiCtx.lineWidth=3;
  uiCtx.beginPath();uiCtx.roundRect(bx,by,bw,bh,8);uiCtx.fill();uiCtx.stroke();
  uiCtx.fillStyle='#ffe600';uiCtx.fillRect(bx+3,by+3,bw-6,3);
  if(dialogObj?.label){const lw=Math.min(uiCtx.measureText(dialogObj.label).width+40,260);uiCtx.fillStyle='#ffe600';uiCtx.beginPath();uiCtx.roundRect(bx+16,by-18,lw,26,4);uiCtx.fill();uiCtx.fillStyle='#1a1200';uiCtx.font='bold 12px "IBM Plex Mono",monospace';uiCtx.textAlign='left';uiCtx.textBaseline='middle';uiCtx.fillText(dialogObj.label,bx+24,by-5);}
  uiCtx.fillStyle='#f2e8c9';uiCtx.font='17px "Permanent Marker",cursive';uiCtx.textAlign='left';uiCtx.textBaseline='top';
  wrapText(uiCtx,dialogQueue[dialogIdx]||'',bx+20,by+18,bw-48,26);
  for(let i=0;i<dialogQueue.length;i++){uiCtx.fillStyle=i===dialogIdx?'#ffe600':'rgba(255,230,0,0.18)';uiCtx.beginPath();uiCtx.arc(bx+22+i*16,by+bh-16,5,0,Math.PI*2);uiCtx.fill();}
  if(Math.floor(Date.now()/500)%2===0){uiCtx.fillStyle='#ffe600';uiCtx.font='20px monospace';uiCtx.textAlign='right';uiCtx.textBaseline='bottom';uiCtx.fillText('▶',bx+bw-14,by+bh-10);}
  uiCtx.restore();
}

function drawInventory(){
  const W=uiCanvas.width,H=uiCanvas.height,bw=Math.min(580,W-40),bh=420,bx=(W-bw)/2,by=(H-bh)/2;
  uiCtx.save();uiCtx.fillStyle='rgba(0,0,0,0.75)';uiCtx.fillRect(0,0,W,H);
  uiCtx.fillStyle='#0e0800';uiCtx.strokeStyle='#ffe600';uiCtx.lineWidth=3;
  uiCtx.beginPath();uiCtx.roundRect(bx,by,bw,bh,10);uiCtx.fill();uiCtx.stroke();
  uiCtx.fillStyle='#ffe600';uiCtx.fillRect(bx+3,by+3,bw-6,3);
  uiCtx.font='bold 20px "Permanent Marker",cursive';uiCtx.textAlign='center';uiCtx.textBaseline='top';uiCtx.fillText('📦 INVENTAIRE DE MAGOUILLES',W/2,by+18);
  uiCtx.strokeStyle='rgba(255,230,0,0.2)';uiCtx.lineWidth=1;uiCtx.beginPath();uiCtx.moveTo(bx+20,by+56);uiCtx.lineTo(bx+bw-20,by+56);uiCtx.stroke();
  if(player.inventory.length===0){uiCtx.fillStyle='rgba(255,255,255,0.28)';uiCtx.font='15px "IBM Plex Mono",monospace';uiCtx.textAlign='center';uiCtx.textBaseline='middle';uiCtx.fillText('Vide. Comme ton frigo. Et ton âme.',W/2,by+bh/2);}
  else{player.inventory.forEach((item,i)=>{const iy=by+70+i*90;uiCtx.fillStyle='rgba(255,230,0,0.07)';uiCtx.strokeStyle='rgba(255,230,0,0.22)';uiCtx.lineWidth=1;uiCtx.beginPath();uiCtx.roundRect(bx+20,iy,bw-40,80,6);uiCtx.fill();uiCtx.stroke();if(item.isWeapon){uiCtx.fillStyle='#c03020';uiCtx.beginPath();uiCtx.roundRect(bx+30,iy+12,70,20,3);uiCtx.fill();uiCtx.fillStyle='#fff';uiCtx.font='bold 9px monospace';uiCtx.textAlign='center';uiCtx.textBaseline='middle';uiCtx.fillText('⚔ ARME',bx+65,iy+22);}uiCtx.fillStyle='#ffe600';uiCtx.font='bold 15px "Permanent Marker",cursive';uiCtx.textAlign='left';uiCtx.textBaseline='top';uiCtx.fillText(item.name,bx+108,iy+14);uiCtx.fillStyle='#c8b090';uiCtx.font='12px "IBM Plex Mono",monospace';uiCtx.fillText(item.desc,bx+108,iy+40);if(item.atk){uiCtx.fillStyle='#ff6040';uiCtx.font='bold 11px monospace';uiCtx.fillText(`ATK: +${item.atk}`,bx+32,iy+46);}});}
  uiCtx.fillStyle='#f2e8c9';uiCtx.font='12px "IBM Plex Mono",monospace';uiCtx.textAlign='left';uiCtx.textBaseline='bottom';uiCtx.fillText(`💰 ${player.money}€  |  ☠ ${player.dignity}%  |  📦 ${player.inventory.length} objet(s)`,bx+20,by+bh-14);
  uiCtx.fillStyle='rgba(255,230,0,0.4)';uiCtx.textAlign='right';uiCtx.fillText('[Q] Fermer',bx+bw-16,by+bh-14);uiCtx.restore();
}

function drawPause(){
  const W=uiCanvas.width,H=uiCanvas.height;uiCtx.save();uiCtx.fillStyle='rgba(0,0,0,0.65)';uiCtx.fillRect(0,0,W,H);
  uiCtx.fillStyle='#ffe600';uiCtx.font='bold 48px "Bebas Neue",sans-serif';uiCtx.textAlign='center';uiCtx.textBaseline='middle';uiCtx.fillText('EN PAUSE',W/2,H/2-24);
  uiCtx.fillStyle='rgba(255,255,255,0.4)';uiCtx.font='15px "IBM Plex Mono",monospace';uiCtx.fillText('( ESC pour reprendre )',W/2,H/2+20);uiCtx.restore();
}

function wrapText(ctx,text,x,y,maxW,lineH){
  const words=text.split(' ');let line='',curY=y;
  for(const w of words){const t=line+w+' ';if(ctx.measureText(t).width>maxW&&line!==''){ctx.fillText(line.trim(),x,curY);line=w+' ';curY+=lineH;}else line=t;}
  if(line.trim()) ctx.fillText(line.trim(),x,curY);
}
