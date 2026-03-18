/* =====================================================
   WORLD.JS — Random Tuesday Simulator
   Enhanced visuals · English · Working door exit
   ===================================================== */
'use strict';

const TILE  = 16;
const SCALE = 3;
const S     = TILE * SCALE;
const COLS  = 22;
const ROWS  = 18;

/* ══════ PERSISTENCE ══════ */
function saveGameState(){
  // Preserve any keys already in storage we don't own (e.g. streetCoinCollected)
  let existing = {};
  try { existing = JSON.parse(localStorage.getItem('rts_state') || '{}'); } catch(e){}
  const state = Object.assign(existing, {
    money: player.money,
    inventory: player.inventory,
    weapon: player.weapon,
    kevinAlive,
    coinVisible,
    plungerPickedUp: !OBJECTS.find(o=>o.pickable&&o.itemId==='plunger'),
  });
  localStorage.setItem('rts_state', JSON.stringify(state));
  localStorage.setItem('rts_money', String(player.money));
}

function loadGameState(){
  try {
    const raw = localStorage.getItem('rts_state');
    if(!raw) return;
    const s = JSON.parse(raw);
    if(s.money !== undefined) player.money = s.money;
    if(s.inventory) player.inventory = s.inventory;
    if(s.weapon !== undefined) player.weapon = s.weapon;
    if(s.kevinAlive !== undefined) kevinAlive = s.kevinAlive;
    if(s.coinVisible !== undefined) coinVisible = s.coinVisible;
    if(s.plungerPickedUp){
      const idx = OBJECTS.findIndex(o=>o.pickable&&o.itemId==='plunger');
      if(idx>-1) OBJECTS.splice(idx,1);
    }
    if(!kevinAlive) kevinDeathTimer = 999;
  } catch(e){ /* corrupt state — ignore */ }
}

function clearGameState(){
  localStorage.removeItem('rts_state');
  localStorage.removeItem('rts_money');
}

function loadMoney(){ return parseInt(localStorage.getItem('rts_money')||'0',10); }
function saveMoney(v){ localStorage.setItem('rts_money',String(v)); }

/* ══════ ENHANCED PALETTE ══════ */
const C = {
  /* floor — warmer, richer wood tones with more variation */
  flA:'#7a5830',flB:'#6b4e28',flC:'#8a6438',flD:'#5e4020',flDark:'#3a2410',flCrack:'#2a1a08',
  flGrain:'rgba(255,200,100,0.07)',flShadow:'rgba(0,0,0,0.18)',
  /* rug — deeper crimson with gold border detail */
  rugA:'#8a1818',rugB:'#6a0a0a',rugBrd:'#c04040',rugAcc:'#e04040',rugGold:'#c8a030',rugPat:'#aa2020',
  /* walls — richer stone/plaster tones */
  wTop:'#c09860',wFace:'#9a7848',wSide:'#6a4830',wMortar:'rgba(0,0,0,0.12)',wHighlight:'rgba(255,230,160,0.08)',
  doorFr:'#6a4010',doorOpen:'#080402',doorFrame:'#3a2008',
  /* bed — more detailed wood + linen */
  bdFr:'#3a1e06',bdFrLit:'#5a3010',bdFrDk:'#1e0e04',
  bdMt:'#9a7a50',bdMtD:'#7a5a38',bdMtL:'#b08a60',
  bdPl:'#d8c8a0',bdPlD:'#b8a880',bdPlS:'rgba(0,0,0,0.08)',
  bdBl:'#a89870',bdBlD:'#887850',bdBlL:'#c8b890',
  /* wardrobe */
  wdTop:'#8a6838',wdFr:'#523820',wdFrLit:'#6a4828',wdSd:'#2e1a0a',wdKn:'#d8b070',wdKnD:'#a87840',
  /* bookshelf */
  bsTop:'#7a5830',bsBd:'#3a2810',bsShf:'#241808',bsLit:'#5a3a20',
  /* tv stand */
  tvSt:'#2e1a0a',tvBd:'#181818',tvSc:'#081408',tvScOn:'#0f2818',
  /* table/chairs */
  tbTop:'#9a6838',tbTopLit:'#b07848',tbTopDk:'#6a4020',tbLeg:'#4a2c10',tbGrain:'rgba(0,0,0,0.06)',
  chBk:'#3a2010',chBkLit:'#5a3828',chSt:'#7a4a30',chStLit:'#9a6248',
  /* sofa */
  sfBk:'#2e1a0a',sfBkLit:'#4a2818',sfAm:'#3e2212',sfSt:'#8a6545',sfStLit:'#aa8565',sfCu:'#9a7858',sfCuLit:'#ba9878',
  /* fridge */
  frBd:'#c8d0c8',frBdLit:'#e0e8e0',frHd:'#707878',frHdLit:'#909898',frSl:'#a0a8a0',
  /* stove */
  stBd:'#2e2e2e',stBr:'#1a1a1a',stOn:'#ff5030',stOnGlow:'rgba(255,80,30,0.35)',
  /* counter */
  ctBd:'#bab090',ctTl:'#d0c8a8',ctTlDk:'rgba(0,0,0,0.06)',
  /* sink */
  skBd:'#b8c0b8',skBdLit:'#d0d8d0',skBw:'#707870',skTp:'#989898',skTpLit:'#b0b0b0',
  /* toilet */
  toTk:'#d0d8d0',toLd:'#c0c8c0',toBw:'#9098a0',toWater:'rgba(40,120,80,0.5)',
  /* nightstand */
  nsT:'#8a5c30',nsDk:'#523810',nsLit:'#aa7840',
  /* lamp */
  lmB:'#9a7828',lmS:'#e0b828',lmSD:'#b09018',lmBulb:'#ffffc0',
  /* clock */
  ckBd:'#2e2418',ckFc:'#f8e8c0',ckHands:'#1a1200',
  /* bottle */
  btGr:'#2a6820',btGrLit:'#3a8830',btCp:'#b8b8b8',
  /* trash */
  trBg:'#282828',trBgT:'#383838',trTop:'rgba(255,255,255,0.04)',
  /* box */
  bxBr:'#9a6830',bxBrLit:'#ba8850',bxTp:'#d8b048',bxTpLit:'#f0c860',
  /* bucket */
  buBd:'#6080a8',buBdLit:'#80a0c8',buHd:'#3a5878',buWater:'rgba(60,100,140,0.7)',buDt:'#5a4028',
  /* rat */
  ratBd:'#4a3828',ratBdLit:'#6a5040',ratEr:'#9a6858',ratEy:'#ff2020',ratDd:'#3a2818',
  /* plunger */
  plSt:'#a87848',plStLit:'#c89858',plCp:'#d03828',plCpLit:'#f04838',plCpD:'#881a10',
  /* poster */
  posBg:'#3a0000',posRd:'#ff4040',
  /* coin */
  coinG:'#f0c020',coinGLit:'#ffd840',coinD:'#c09010',coinDk:'#a07808',
  /* effects */
  hit:'rgba(255,60,60,0.55)',
  hintBg:'#ffe600',hintTx:'#1a1200',
  /* ambient shadow/light */
  ambShadow:'rgba(0,0,0,0.22)',ambLight:'rgba(255,220,160,0.06)',
};

/* ══════ MAP ══════ */
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

function px(ctx,c,r,w,h,col){ ctx.fillStyle=col; ctx.fillRect(c*SCALE,r*SCALE,w*SCALE,h*SCALE); }

const OBJECTS = [];

/* ══════════════════════════════════════════════════
   NORTH WALL OBJECTS
══════════════════════════════════════════════════ */

/* BED — north wall, cols 1-4 */
OBJECTS.push({
  tx:1,ty:1,w:4,h:3,
  hx:1,hy:2,hw:4,hh:2,
  label:'Mattress',
  lines:['"Found on the street. The stain looks like Brittany."','"It creaks. It smells. But it\'s HOME."','"3 years sleeping here. You\'d rather not know why it cracks."'],
  draw(ctx){
    const W=4*S,H=3*S;
    // Headboard — north-wall top-face strip with rich wood detail
    for(let i=0;i<4;i++){
      ctx.fillStyle=i%2===0?C.bdFrLit:C.bdFr;
      ctx.fillRect(i*S,0,S,SCALE*7);
    }
    // Headboard carved panel insets
    for(let i=0;i<4;i++){
      ctx.fillStyle='rgba(0,0,0,0.15)';
      ctx.fillRect(i*S+SCALE*2,SCALE*2,S-SCALE*4,SCALE*4);
      ctx.fillStyle='rgba(255,200,120,0.1)';
      ctx.fillRect(i*S+SCALE*2,SCALE*2,S-SCALE*4,SCALE);
    }
    // Brass nails
    ctx.fillStyle=C.lmS;
    for(let i=0;i<4;i++){
      ctx.fillRect(i*S+SCALE*3,SCALE*3,SCALE*2,SCALE*2);
      ctx.fillStyle='rgba(255,255,200,0.5)'; ctx.fillRect(i*S+SCALE*3,SCALE*3,SCALE,SCALE);
      ctx.fillStyle=C.lmS;
    }
    // Shadow under headboard
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,SCALE*6,W,SCALE*3);
    // Side rails
    ctx.fillStyle=C.bdFr; ctx.fillRect(0,SCALE*9,SCALE*4,H-SCALE*9); ctx.fillRect(W-SCALE*4,SCALE*9,SCALE*4,H-SCALE*9);
    ctx.fillStyle=C.bdFrLit; ctx.fillRect(0,SCALE*9,SCALE*2,H-SCALE*12);
    // Mattress surface
    ctx.fillStyle=C.bdMt; ctx.fillRect(SCALE*4,SCALE*9,W-SCALE*8,H-SCALE*12);
    ctx.fillStyle=C.bdMtL; ctx.fillRect(SCALE*4,SCALE*9,W-SCALE*8,SCALE*3);
    ctx.fillStyle=C.bdMtD; ctx.fillRect(SCALE*4,SCALE*9,SCALE*3,H-SCALE*12);
    // Mattress tufting buttons
    ctx.fillStyle='#4a3010';
    for(let bx2=0;bx2<4;bx2++) for(let by2=0;by2<2;by2++){
      ctx.fillRect(SCALE*(6+bx2*9),SCALE*(12+by2*9),SCALE*2,SCALE*2);
      ctx.fillStyle='rgba(255,200,120,0.3)'; ctx.fillRect(SCALE*(6+bx2*9),SCALE*(12+by2*9),SCALE,SCALE);
      ctx.fillStyle='#4a3010';
    }
    // Pillow — left
    ctx.fillStyle=C.bdPl; ctx.fillRect(SCALE*5,SCALE*10,S+SCALE*5,S-SCALE*2);
    ctx.fillStyle=C.bdPlD; ctx.fillRect(SCALE*5,SCALE*10,S+SCALE*5,SCALE*2);
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(SCALE*5,SCALE*10,S+SCALE*5,SCALE);
    // Pillow crease
    ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(SCALE*5,SCALE*13); ctx.lineTo(SCALE*5+S+SCALE*5,SCALE*13); ctx.stroke();
    // Blanket — right side, crumpled
    ctx.fillStyle=C.bdBl; ctx.fillRect(S*2+SCALE*2,SCALE*10,W-S*2-SCALE*6,H-SCALE*12);
    ctx.fillStyle=C.bdBlL; ctx.fillRect(S*2+SCALE*2,SCALE*10,W-S*2-SCALE*6,SCALE*2);
    ctx.fillStyle=C.bdBlD; ctx.fillRect(S*2+SCALE*5,SCALE*14,S-SCALE*3,S-SCALE*5);
    // Fold lines on blanket
    ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.lineWidth=1;
    for(let f=0;f<3;f++){ ctx.beginPath(); ctx.moveTo(S*2+SCALE*2,SCALE*(13+f*3)); ctx.lineTo(W-SCALE*4,SCALE*(13+f*3)); ctx.stroke(); }
    // Bretagne stain
    ctx.fillStyle='rgba(80,50,20,0.4)'; ctx.fillRect(S+SCALE*9,SCALE*16,SCALE*8,SCALE*5); ctx.fillRect(S+SCALE*11,SCALE*21,SCALE*5,SCALE*3);
    // Footboard
    ctx.fillStyle=C.bdFr; ctx.fillRect(0,H-SCALE*3,W,SCALE*3);
    ctx.fillStyle=C.bdFrLit; ctx.fillRect(0,H-SCALE*3,SCALE*2,SCALE*2);
    // Final shadow
    ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(0,H-SCALE*2,W,SCALE*2); ctx.fillRect(W-SCALE*3,SCALE*9,SCALE*3,H-SCALE*9);
  }
});

/* NIGHTSTAND */
OBJECTS.push({
  tx:5,ty:1,w:1,h:2,
  hx:5,hy:2,hw:1,hh:1,
  label:'Nightstand',
  lines:['"Leg shimmed with a 2€ coin. Ingenious."','"Water glass (?), aspirin, dead phone."'],
  draw(ctx){
    ctx.fillStyle=C.wdTop; ctx.fillRect(0,0,S,SCALE*5);
    ctx.fillStyle='rgba(255,220,120,0.12)'; ctx.fillRect(0,0,S,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,SCALE*4,S,SCALE);
    ctx.fillStyle=C.nsT; ctx.fillRect(0,SCALE*5,S,2*S-SCALE*6);
    ctx.fillStyle=C.nsLit; ctx.fillRect(0,SCALE*5,SCALE*2,2*S-SCALE*8);
    ctx.fillStyle=C.nsDk; ctx.fillRect(SCALE,S,S-SCALE*2,SCALE);
    // Knob with highlight
    ctx.fillStyle=C.wdKn; ctx.beginPath(); ctx.arc(S/2,S+SCALE*4,SCALE*2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.wdKnD; ctx.beginPath(); ctx.arc(S/2,S+SCALE*4,SCALE,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,200,0.6)'; ctx.fillRect(S/2-SCALE,S+SCALE*3,SCALE,SCALE);
    // Water glass — multi-layer
    ctx.fillStyle='rgba(120,180,210,0.25)'; ctx.beginPath(); ctx.arc(SCALE*5,SCALE*8,SCALE*3.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(160,220,250,0.5)'; ctx.beginPath(); ctx.arc(SCALE*5,SCALE*8,SCALE*3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(SCALE*5,SCALE*8,SCALE*1.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(SCALE*3,SCALE*6,SCALE,SCALE*2);
    // Dead phone
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(SCALE*9,SCALE*7,SCALE*4,SCALE*7);
    ctx.fillStyle='#0a0a14'; ctx.fillRect(SCALE*10,SCALE*8,SCALE*2,SCALE*5);
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(SCALE*10,SCALE*8,SCALE,SCALE*2);
    // Table shadow
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(0,2*S-SCALE*2,S,SCALE*2); ctx.fillRect(S-SCALE*2,SCALE*5,SCALE*2,2*S-SCALE*6);
  }
});

/* LAMP */
OBJECTS.push({
  tx:5,ty:1,w:1,h:1,
  hx:0,hy:0,hw:0,hh:0,
  label:'Bedside Lamp',
  lines:['"Flickers every 30 seconds. Unintentional."'],
  draw(ctx){
    const t=Date.now();
    const g=0.16+0.08*Math.sin(t/700);
    ctx.fillStyle=`rgba(255,240,160,${g})`; ctx.fillRect(-S,-S,3*S,3*S);
    // Base
    ctx.fillStyle=C.lmB; ctx.beginPath(); ctx.arc(S/2,SCALE*11,SCALE*2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.lmSD; ctx.beginPath(); ctx.arc(S/2+SCALE,SCALE*11+SCALE,SCALE*1.5,0,Math.PI*2); ctx.fill();
    // Shade
    ctx.fillStyle=C.lmS; ctx.beginPath(); ctx.arc(S/2,SCALE*7,SCALE*5.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.lmSD; ctx.beginPath(); ctx.arc(S/2,SCALE*7,SCALE*4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.lmBulb; ctx.beginPath(); ctx.arc(S/2,SCALE*7,SCALE*1.8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(S/2-SCALE,SCALE*6,SCALE*0.8,0,Math.PI*2); ctx.fill();
  }
});

/* TV + STAND */
OBJECTS.push({
  tx:7,ty:1,w:3,h:2,
  hx:7,hy:1,hw:3,hh:2,
  label:'TV',
  lines:['"CRT 1994. One channel: Kazakhstan weather."','"4 strips of tape. Solid as hope."','"Blinking green LED = unresolved issue."'],
  draw(ctx){
    const t=Date.now();
    ctx.fillStyle=C.tvSt; ctx.fillRect(0,0,3*S,SCALE*5);
    ctx.fillStyle='rgba(255,200,100,0.08)'; ctx.fillRect(0,0,3*S,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,SCALE*4,3*S,SCALE);
    // Stand pedestal with better shaping
    ctx.fillStyle='#1e1208'; ctx.fillRect(S,SCALE*5,S,2*S-SCALE*6);
    ctx.fillStyle='#2e1e10'; ctx.fillRect(S,SCALE*5,SCALE*2,2*S-SCALE*8);
    // TV body
    ctx.fillStyle=C.tvBd; ctx.fillRect(SCALE*2,SCALE*3,3*S-SCALE*4,SCALE*11);
    ctx.fillStyle='#202020'; ctx.fillRect(SCALE*2,SCALE*3,SCALE*2,SCALE*11);
    // Screen bezel
    ctx.fillStyle='#141414'; ctx.fillRect(SCALE*3,SCALE*4,3*S-SCALE*6,SCALE*9);
    // Screen content
    const flicker=Math.floor(t/180)%7;
    ctx.fillStyle=flicker===0?'#0a2018':(flicker===3?'#181808':C.tvSc);
    ctx.fillRect(SCALE*4,SCALE*5,3*S-SCALE*8,SCALE*7);
    // Scanlines
    for(let l=0;l<7;l+=2){ ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(SCALE*4,(SCALE*5+l*SCALE*1),3*S-SCALE*8,SCALE); }
    // Screen glow
    if(flicker<3){ ctx.fillStyle='rgba(80,160,80,0.08)'; ctx.fillRect(SCALE*4,SCALE*5,3*S-SCALE*8,SCALE*7); }
    // Antennas
    ctx.fillStyle='#787878'; ctx.fillRect(SCALE*7,SCALE*2,SCALE,SCALE*2); ctx.fillRect(SCALE*11,SCALE*2,SCALE,SCALE*2);
    ctx.fillStyle='#888'; ctx.fillRect(SCALE*7,SCALE,SCALE,SCALE); ctx.fillRect(SCALE*11,SCALE,SCALE,SCALE);
    // Power LED
    ctx.fillStyle=Math.floor(t/900)%2===0?'#00ff40':'#003010';
    ctx.fillRect(3*S-SCALE*5,SCALE*13,SCALE*2,SCALE*2);
    // VHS sticker
    ctx.fillStyle='#cc2800'; ctx.fillRect(SCALE*4,SCALE*14,S,SCALE*3);
    ctx.fillStyle='#ff3000'; ctx.fillRect(SCALE*4,SCALE*14,S,SCALE);
    ctx.fillStyle='#fff'; ctx.font=`${SCALE*2}px monospace`; ctx.textBaseline='top'; ctx.textAlign='left'; ctx.fillText('VHS',SCALE*5,SCALE*14.5);
    // Tape strips
    ctx.fillStyle='rgba(200,200,150,0.5)'; ctx.fillRect(SCALE*3,SCALE*4,SCALE,SCALE*9); ctx.fillRect(3*S-SCALE*4,SCALE*4,SCALE,SCALE*9);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,2*S-SCALE*3,3*S,SCALE*3);
  }
});

/* CLOCK */
OBJECTS.push({
  tx:12,ty:1,w:1,h:1,
  hx:0,hy:0,hw:0,hh:0,
  label:'Broken Clock',
  lines:['"4:23 for 6 months. Dead batteries. Can\'t be bothered."'],
  draw(ctx){
    // Frame with depth
    ctx.fillStyle=C.ckBd; ctx.fillRect(SCALE,SCALE,S-SCALE*2,S-SCALE*2);
    ctx.fillStyle='#1e1410'; ctx.fillRect(SCALE*2,SCALE*2,S-SCALE*4,S-SCALE*4);
    ctx.fillStyle=C.ckFc; ctx.fillRect(SCALE*3,SCALE*3,S-SCALE*6,S-SCALE*6);
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(SCALE*3,SCALE*3,S-SCALE*6,SCALE);
    for(let i=0;i<12;i++){
      const a=-Math.PI/2+i*Math.PI*2/12, r=S/2-SCALE*4;
      ctx.fillStyle=i%3===0?'#2a1800':'rgba(42,24,0,0.5)';
      ctx.fillRect(S/2+Math.cos(a)*r-0.5,S/2+Math.sin(a)*r-0.5,SCALE,SCALE);
    }
    const cx=S/2,cy=S/2;
    ctx.strokeStyle=C.ckHands; ctx.lineWidth=SCALE;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(-Math.PI/2+2*Math.PI*4/12)*SCALE*4,cy+Math.sin(-Math.PI/2+2*Math.PI*4/12)*SCALE*4); ctx.stroke();
    ctx.lineWidth=SCALE*0.6;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(-Math.PI/2+2*Math.PI*23/60)*SCALE*5,cy+Math.sin(-Math.PI/2+2*Math.PI*23/60)*SCALE*5); ctx.stroke();
    ctx.fillStyle=C.ckHands; ctx.fillRect(cx-SCALE,cy-SCALE,SCALE*2,SCALE*2);
    // Wall hook
    ctx.fillStyle='rgba(200,180,100,0.6)'; ctx.fillRect(S/2-SCALE/2,0,SCALE,SCALE*2);
  }
});

/* STOVE */
OBJECTS.push({
  tx:13,ty:1,w:2,h:2,
  hx:13,hy:1,hw:2,hh:2,
  label:'Stove',
  lines:['"Fire works. Only the fire."','"Oven stuck since 2018. A mystery."','"Left burner sets things ON FIRE. For real."'],
  draw(ctx){
    const t=Date.now();
    ctx.fillStyle='#404040'; ctx.fillRect(0,0,2*S,SCALE*5);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(0,0,2*S,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.fillRect(0,SCALE*4,2*S,SCALE);
    ctx.fillStyle=C.stBd; ctx.fillRect(0,SCALE*5,2*S,2*S-SCALE*5);
    ctx.fillStyle='#383838'; ctx.fillRect(0,SCALE*5,SCALE*2,2*S-SCALE*7);
    // Burner grates
    [[SCALE*5,SCALE*8],[SCALE*5,SCALE*15],[SCALE*13,SCALE*8],[SCALE*13,SCALE*15]].forEach(([bx2,by2],i)=>{
      // Outer ring
      ctx.fillStyle='#3a3a3a'; ctx.beginPath(); ctx.arc(bx2,by2,SCALE*4.5,0,Math.PI*2); ctx.fill();
      // Ring detail
      ctx.strokeStyle='#252525'; ctx.lineWidth=SCALE*0.5;
      ctx.beginPath(); ctx.arc(bx2,by2,SCALE*3.8,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle=i===0?'#5a2010':C.stBr;
      ctx.beginPath(); ctx.arc(bx2,by2,SCALE*3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=i===0?C.stOn:'#0c0c0c';
      ctx.beginPath(); ctx.arc(bx2,by2,SCALE*2,0,Math.PI*2); ctx.fill();
      if(i===0){
        const gl=0.3+0.25*Math.sin(t/180);
        ctx.globalAlpha=gl; ctx.fillStyle='#ff8040'; ctx.beginPath(); ctx.arc(bx2,by2,SCALE*3.5,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=gl*0.5; ctx.fillStyle='#ffcc40'; ctx.beginPath(); ctx.arc(bx2,by2,SCALE*1.5,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1;
      }
    });
    // Knob row with improved detail
    for(let k=0;k<4;k++){
      ctx.fillStyle='#484848'; ctx.beginPath(); ctx.arc(SCALE*(4+k*5),SCALE*19,SCALE*2.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#686868'; ctx.beginPath(); ctx.arc(SCALE*(4+k*5),SCALE*19,SCALE*1.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(SCALE*(4+k*5)-SCALE*0.5,SCALE*19-SCALE*0.5,SCALE*0.5,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,2*S-SCALE*2,2*S,SCALE*2);
  }
});

/* COUNTER */
OBJECTS.push({
  tx:15,ty:1,w:3,h:2,
  hx:15,hy:1,hw:3,hh:2,
  label:'Kitchen Counter',
  lines:['"Flour everywhere. You have no flour."','"Knife, 4 cups, despair."'],
  draw(ctx){
    ctx.fillStyle='#c8c0a0'; ctx.fillRect(0,0,3*S,SCALE*5);
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(0,0,3*S,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.32)'; ctx.fillRect(0,SCALE*4,3*S,SCALE);
    ctx.fillStyle=C.ctBd; ctx.fillRect(0,SCALE*5,3*S,2*S-SCALE*5);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(0,SCALE*5,SCALE*2,2*S-SCALE*7);
    // Tile pattern with grout lines
    for(let tc=0;tc<3*TILE;tc+=4) for(let tr=5;tr<2*TILE;tr+=4){
      if((tc/4+tr/4)%2===0){ ctx.fillStyle='rgba(0,0,0,0.04)'; ctx.fillRect(tc*SCALE,tr*SCALE,SCALE*4,SCALE*4); }
      // Grout
      ctx.strokeStyle='rgba(0,0,0,0.08)'; ctx.lineWidth=0.5;
      ctx.strokeRect(tc*SCALE,tr*SCALE,SCALE*4,SCALE*4);
    }
    // Cutting board with grain
    ctx.fillStyle=C.tbTop; ctx.fillRect(SCALE*3,SCALE*6,S+SCALE*5,S-SCALE*2);
    ctx.fillStyle=C.tbTopLit; ctx.fillRect(SCALE*3,SCALE*6,S+SCALE*5,SCALE*2);
    for(let g=0;g<4;g++){ ctx.strokeStyle='rgba(0,0,0,0.08)'; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(SCALE*3,SCALE*(7+g*2)); ctx.lineTo(SCALE*3+S+SCALE*5,SCALE*(7+g*2)); ctx.stroke(); }
    ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(SCALE*4,SCALE*7,S+SCALE*3,S-SCALE*4);
    // Knife with blade shine
    ctx.fillStyle='#a0a0a0'; ctx.fillRect(SCALE*3,SCALE*11,S+SCALE*5,SCALE*2);
    ctx.fillStyle='#c8c8c8'; ctx.fillRect(SCALE*3,SCALE*11,S+SCALE*5,SCALE);
    ctx.fillStyle=C.tbLeg; ctx.fillRect(SCALE*3,SCALE*11,SCALE*5,SCALE*2);
    ctx.fillStyle='#6a4020'; ctx.fillRect(SCALE*3,SCALE*11,SCALE*5,SCALE);
    // Cups with rims
    ['#c8b090','#888890','#c03020'].forEach((col,i)=>{
      const cx=(S*2+SCALE*5+i*SCALE*8)*1, cy=SCALE*9;
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(cx,cy,SCALE*3.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(cx,cy,SCALE*3.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(cx,cy,SCALE*2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(cx-SCALE*3,cy-SCALE*3,SCALE,SCALE);
    });
    // Flour dust
    ctx.fillStyle='rgba(245,245,235,0.12)'; ctx.fillRect(0,SCALE*5,3*S,SCALE*3);
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(0,2*S-SCALE*2,3*S,SCALE*2);
  }
});

/* SINK */
OBJECTS.push({
  tx:18,ty:1,w:2,h:2,
  hx:18,hy:1,hw:2,hh:2,
  label:'Sink',
  lines:['"Hot water dead since 2020."','"Jean-Pierre the cockroach lives under the faucet."','"4 cups in there since Monday."'],
  draw(ctx){
    ctx.fillStyle=C.skBdLit; ctx.fillRect(0,0,2*S,SCALE*5);
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(0,0,2*S,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,SCALE*4,2*S,SCALE);
    ctx.fillStyle=C.skBd; ctx.fillRect(0,SCALE*5,2*S,2*S-SCALE*5);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(0,SCALE*5,SCALE*2,2*S-SCALE*7);
    // Bowl with inner depth
    ctx.fillStyle=C.skBw; ctx.fillRect(SCALE*3,SCALE*7,2*S-SCALE*6,2*S-SCALE*10);
    ctx.fillStyle='#484858'; ctx.fillRect(SCALE*4,SCALE*8,2*S-SCALE*8,2*S-SCALE*12);
    ctx.fillStyle='#30383a'; ctx.fillRect(SCALE*5,SCALE*9,2*S-SCALE*10,2*S-SCALE*14);
    // Stagnant water
    ctx.fillStyle='rgba(40,70,50,0.55)'; ctx.fillRect(SCALE*4,2*S-SCALE*8,2*S-SCALE*8,SCALE*4);
    ctx.fillStyle='rgba(60,100,70,0.3)'; ctx.fillRect(SCALE*4,2*S-SCALE*8,2*S-SCALE*8,SCALE);
    // Faucet
    ctx.fillStyle=C.skTpLit; ctx.fillRect(S-SCALE,SCALE*5,SCALE*2,SCALE*2);
    ctx.fillStyle=C.skTp; ctx.fillRect(S-SCALE,SCALE*7,SCALE*2,SCALE*4);
    ctx.fillStyle=C.skTpLit; ctx.fillRect(S-SCALE*3,SCALE*6,SCALE*2,SCALE*3); ctx.fillRect(S+SCALE,SCALE*6,SCALE*2,SCALE*3);
    ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(S-SCALE*3,SCALE*6,SCALE,SCALE); ctx.fillRect(S+SCALE,SCALE*6,SCALE,SCALE);
    // Jean-Pierre
    ctx.fillStyle='#080604'; ctx.fillRect(SCALE*5,2*S-SCALE*5,SCALE*4,SCALE*2); ctx.fillRect(SCALE*4,2*S-SCALE*5,SCALE*7,SCALE);
    ctx.fillStyle='#220808'; ctx.fillRect(SCALE*5,2*S-SCALE*5,SCALE*2,SCALE);
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(0,2*S-SCALE*2,2*S,SCALE*2);
  }
});

/* FRIDGE */
OBJECTS.push({
  tx:20,ty:1,w:1,h:3,
  hx:20,hy:1,hw:1,hh:3,
  label:'Fridge',
  lines:['"Expired mustard from the Obama era, and hope."','"Weird noise. You don\'t investigate."','"Sticky note: \'RENT!!!\'. You put it there yourself."'],
  draw(ctx){
    ctx.fillStyle=C.frBdLit; ctx.fillRect(0,0,S,SCALE*5);
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(0,0,S,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,SCALE*4,S,SCALE);
    ctx.fillStyle=C.frBd; ctx.fillRect(0,SCALE*5,S,3*S-SCALE*5);
    ctx.fillStyle=C.frBdLit; ctx.fillRect(0,SCALE*5,SCALE*3,3*S-SCALE*7);
    // Freezer seam
    ctx.fillStyle=C.frSl; ctx.fillRect(0,S+SCALE*3,S,SCALE*3);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,S+SCALE*4,S,SCALE);
    // Handle
    ctx.fillStyle=C.frHd; ctx.fillRect(S-SCALE*4,SCALE*7,SCALE*3,S-SCALE*4);
    ctx.fillStyle=C.frHdLit; ctx.fillRect(S-SCALE*4,SCALE*7,SCALE,S-SCALE*4);
    ctx.fillRect(S-SCALE*4,S+SCALE*5,SCALE*3,S+SCALE*2);
    ctx.fillStyle=C.frHdLit; ctx.fillRect(S-SCALE*4,S+SCALE*5,SCALE,S+SCALE*2);
    // Rust patch
    ctx.fillStyle='rgba(140,70,30,0.4)'; ctx.fillRect(SCALE*2,2*S+SCALE*3,SCALE*5,SCALE*4);
    ctx.fillStyle='rgba(160,90,40,0.25)'; ctx.fillRect(SCALE*2,2*S+SCALE*3,SCALE*5,SCALE*2);
    // Sticky note
    ctx.fillStyle='#ffe080'; ctx.fillRect(SCALE*2,S+SCALE,S-SCALE*5,S*0.55);
    ctx.fillStyle='#e8c840'; ctx.fillRect(SCALE*2,S+SCALE,S-SCALE*5,SCALE*2);
    ctx.fillStyle='#a07820'; ctx.font=`${SCALE*1.5}px monospace`; ctx.textBaseline='top'; ctx.textAlign='left';
    ctx.fillText('RENT',SCALE*3,S+SCALE*2); ctx.fillText('!!!',SCALE*3,S+SCALE*4);
    ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(0,3*S-SCALE*2,S,SCALE*2); ctx.fillRect(S-SCALE*3,SCALE*5,SCALE*3,3*S-SCALE*5);
  }
});

/* ══════ EAST WALL OBJECTS ══════ */

/* BOOKSHELF */
OBJECTS.push({
  tx:20,ty:5,w:1,h:4,
  hx:20,hy:5,hw:1,hh:4,
  label:'Bookshelf',
  lines:['"3 books and 9 empty beer bottles. Cultural."','"\'Get Rich in 30 Days\'. Page 1. Never finished."'],
  draw(ctx){
    ctx.fillStyle=C.wdTop; ctx.fillRect(S-SCALE*5,0,SCALE*5,4*S);
    ctx.fillStyle='rgba(255,220,120,0.12)'; ctx.fillRect(S-SCALE*5,0,SCALE*2,4*S);
    ctx.fillStyle='rgba(0,0,0,0.38)'; ctx.fillRect(S-SCALE*6,0,SCALE,4*S);
    ctx.fillStyle=C.bsBd; ctx.fillRect(0,0,S-SCALE*5,4*S);
    ctx.fillStyle=C.bsLit; ctx.fillRect(0,0,SCALE*2,4*S);
    // Shelf boards
    [S,2*S,3*S].forEach(sy=>{
      ctx.fillStyle=C.bsShf; ctx.fillRect(0,sy,S-SCALE*5,SCALE*3);
      ctx.fillStyle='rgba(255,200,100,0.08)'; ctx.fillRect(0,sy,S-SCALE*5,SCALE);
      ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(0,sy+SCALE*2,S-SCALE*5,SCALE);
    });
    // Books with varied heights and spine details
    const bc=['#c03020','#2060a0','#806020','#208040','#c0a020','#602080','#c8a060','#4080c0','#803020','#20a060','#a04020','#2040c0'];
    const bh=[S-SCALE*6,S-SCALE*4,S-SCALE*7,S-SCALE*5,S-SCALE*4,S-SCALE*8,S-SCALE*5,S-SCALE*6,S-SCALE*4,S-SCALE*7,S-SCALE*5,S-SCALE*4];
    bc.forEach((col,i)=>{
      const shelf=Math.floor(i/3), pos=i%3;
      const by2=shelf*S+SCALE*3, bh2=bh[i];
      ctx.fillStyle=col; ctx.fillRect(SCALE*(pos*4+2),by2,SCALE*3,bh2);
      ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(SCALE*(pos*4+2),by2,SCALE,SCALE*3);
      ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(SCALE*(pos*4+4),by2,SCALE,bh2);
    });
    // Beer bottles on top shelf
    [SCALE*2,SCALE*7].forEach(bx2=>{
      ctx.fillStyle='#1a4010'; ctx.fillRect(bx2,3*S+SCALE*3,SCALE*2,S-SCALE*4);
      ctx.fillStyle='#2a6020'; ctx.fillRect(bx2,3*S+SCALE*3,SCALE,S-SCALE*6);
      ctx.fillStyle='#808080'; ctx.fillRect(bx2,3*S+SCALE*2,SCALE*2,SCALE*2);
    });
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,0,SCALE*2,4*S);
  }
});

/* TOILET */
OBJECTS.push({
  tx:20,ty:11,w:2,h:3,
  hx:20,hy:11,hw:2,hh:3,
  label:'Toilet',
  lines:['"Works at 60%. The other 40%, we don\'t talk about."','"The water is a mystical color."','"Wall marks: a calendar."'],
  draw(ctx){
    // Tank
    ctx.fillStyle=C.toTk; ctx.fillRect(S+SCALE*4,0,S-SCALE*4,3*S);
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(S+SCALE*4,0,SCALE*2,3*S);
    ctx.fillStyle='rgba(0,0,0,0.32)'; ctx.fillRect(S+SCALE*3,0,SCALE,3*S);
    // Tank top detail
    ctx.fillStyle='#d8e0d8'; ctx.fillRect(S+SCALE*4,0,S-SCALE*4,SCALE*4);
    ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(S+SCALE*4,0,S-SCALE*4,SCALE);
    // Flush button
    ctx.fillStyle='#c8d0c8'; ctx.beginPath(); ctx.arc(S+SCALE*10,SCALE*3,SCALE*2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(S+SCALE*9,SCALE*2.5,SCALE*0.8,0,Math.PI*2); ctx.fill();
    // Lid
    ctx.fillStyle=C.toLd; ctx.fillRect(0,SCALE*2,S+SCALE*4,3*S-SCALE*4);
    ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(0,SCALE*2,S+SCALE*4,SCALE*2);
    // Bowl
    ctx.fillStyle=C.toBw; ctx.fillRect(SCALE*3,SCALE*5,S-SCALE*3,3*S-SCALE*10);
    ctx.fillStyle='#808890'; ctx.fillRect(SCALE*5,SCALE*8,S-SCALE*7,3*S-SCALE*14);
    // Mystical water
    ctx.fillStyle='rgba(50,120,70,0.6)'; ctx.fillRect(SCALE*5,S+SCALE*8,S-SCALE*7,SCALE*5);
    ctx.fillStyle='rgba(80,160,100,0.25)'; ctx.fillRect(SCALE*5,S+SCALE*8,S-SCALE*7,SCALE*2);
    // Wall calendar marks
    ctx.strokeStyle='rgba(60,40,20,0.3)'; ctx.lineWidth=0.5;
    for(let m=0;m<4;m++){ ctx.beginPath(); ctx.moveTo(S+SCALE*5+m*SCALE*2,SCALE*6); ctx.lineTo(S+SCALE*5+m*SCALE*2,SCALE*10); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(S+SCALE*5,SCALE*6); ctx.lineTo(S+SCALE*5+SCALE*8,SCALE*10); ctx.stroke();
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,3*S-SCALE*2,S+SCALE*4,SCALE*2);
  }
});

/* BATHROOM SINK */
OBJECTS.push({
  tx:20,ty:9,w:2,h:2,
  hx:20,hy:9,hw:2,hh:2,
  label:'Bathroom Sink',
  lines:['"Cold water only since 2019."','"Lipstick trace on the mirror. You don\'t own lipstick."'],
  draw(ctx){
    ctx.fillStyle=C.wdTop; ctx.fillRect(2*S-SCALE*5,0,SCALE*5,2*S);
    ctx.fillStyle='rgba(255,220,120,0.12)'; ctx.fillRect(2*S-SCALE*5,0,SCALE*2,2*S);
    ctx.fillStyle='rgba(0,0,0,0.32)'; ctx.fillRect(2*S-SCALE*6,0,SCALE,2*S);
    ctx.fillStyle=C.skBd; ctx.fillRect(0,0,2*S-SCALE*5,2*S);
    ctx.fillStyle=C.skBdLit; ctx.fillRect(0,0,SCALE*2,2*S);
    ctx.fillStyle=C.skBw; ctx.fillRect(SCALE*2,SCALE*3,2*S-SCALE*9,2*S-SCALE*6);
    ctx.fillStyle='#484858'; ctx.fillRect(SCALE*3,SCALE*4,2*S-SCALE*11,2*S-SCALE*8);
    ctx.fillStyle='rgba(40,70,60,0.45)'; ctx.fillRect(SCALE*3,2*S-SCALE*6,2*S-SCALE*11,SCALE*3);
    ctx.fillStyle='rgba(60,100,80,0.25)'; ctx.fillRect(SCALE*3,2*S-SCALE*6,2*S-SCALE*11,SCALE);
    // Faucet
    ctx.fillStyle=C.skTpLit; ctx.fillRect(S-SCALE,SCALE*2,SCALE*2,SCALE*2);
    ctx.fillStyle=C.skTp; ctx.fillRect(S-SCALE,SCALE*4,SCALE*2,SCALE*3);
    ctx.fillStyle=C.skTpLit; ctx.fillRect(S-SCALE*3,SCALE*3,SCALE*2,SCALE*2); ctx.fillRect(S+SCALE,SCALE*3,SCALE*2,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,2*S-SCALE*2,2*S-SCALE*5,SCALE*2);
  }
});

/* ══════ WEST WALL OBJECTS ══════ */

/* WARDROBE */
OBJECTS.push({
  tx:1,ty:5,w:2,h:3,
  hx:1,hy:5,hw:2,hh:3,
  label:'Wardrobe',
  lines:['"Two doors. One won\'t close."','"2007 jacket, regrets, mystery underwear."','"The smell coming from it resembles nothing."'],
  draw(ctx){
    ctx.fillStyle=C.wdTop; ctx.fillRect(0,0,SCALE*5,3*S);
    ctx.fillStyle='rgba(255,220,120,0.14)'; ctx.fillRect(0,0,SCALE*2,3*S);
    ctx.fillStyle='rgba(0,0,0,0.38)'; ctx.fillRect(SCALE*4,0,SCALE,3*S);
    ctx.fillStyle=C.wdFrLit; ctx.fillRect(SCALE*5,0,SCALE*3,3*S);
    ctx.fillStyle=C.wdFr; ctx.fillRect(SCALE*8,0,2*S-SCALE*8,3*S);
    // Panel insets per door
    [[S*0.6,S*0.1,S*0.7,S*0.75],[S*0.6,S*1.2,S*0.7,S*0.65]].forEach(([dx,dy,dw,dh])=>{
      ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(SCALE*5+dx,dy,dw,dh);
      ctx.fillStyle='rgba(255,200,100,0.05)'; ctx.fillRect(SCALE*5+dx,dy,dw,SCALE*2);
    });
    ctx.fillStyle=C.wdSd; ctx.fillRect(SCALE*5,S+SCALE,2*S-SCALE*5,SCALE*2);
    // Handles with shine
    [S*0.4,S*1.5].forEach(hy2=>{
      ctx.fillStyle=C.wdKn; ctx.fillRect(SCALE*7,hy2,SCALE*2,SCALE*5);
      ctx.fillStyle=C.wdKnD; ctx.fillRect(SCALE*8,hy2,SCALE,SCALE*5);
      ctx.fillStyle='rgba(255,255,200,0.5)'; ctx.fillRect(SCALE*7,hy2,SCALE,SCALE*2);
    });
    // Clothes peeking out (ajar)
    ctx.fillStyle='#6a3898'; ctx.fillRect(SCALE*5,SCALE*3,SCALE*4,S-SCALE*4);
    ctx.fillStyle='#8a48b8'; ctx.fillRect(SCALE*5,SCALE*3,SCALE*2,S-SCALE*4);
    ctx.fillStyle='#c83828'; ctx.fillRect(SCALE*5,SCALE*5,SCALE*3,S-SCALE*6);
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(SCALE*5,3*S-SCALE*2,2*S-SCALE*5,SCALE*2);
  }
});

/* SOFA */
OBJECTS.push({
  tx:1,ty:7,w:2,h:4,
  hx:1,hy:7,hw:2,hh:4,
  label:'Sofa',
  lines:['"Found on the sidewalk. Like everything else."','"€3.47 in the cushions. Your meal budget."','"Italy-shaped stain on the middle cushion."'],
  draw(ctx){
    ctx.fillStyle=C.sfBkLit; ctx.fillRect(0,0,SCALE*5,4*S);
    ctx.fillStyle='rgba(255,200,100,0.1)'; ctx.fillRect(0,0,SCALE*2,4*S);
    ctx.fillStyle='rgba(0,0,0,0.38)'; ctx.fillRect(SCALE*4,0,SCALE,4*S);
    // Armrests
    ctx.fillStyle=C.sfAm; ctx.fillRect(SCALE*5,0,2*S-SCALE*5,SCALE*7);
    ctx.fillRect(SCALE*5,4*S-SCALE*7,2*S-SCALE*5,SCALE*7);
    ctx.fillStyle='rgba(255,200,120,0.1)'; ctx.fillRect(SCALE*5,0,2*S-SCALE*5,SCALE*2);
    ctx.fillRect(SCALE*5,4*S-SCALE*7,2*S-SCALE*5,SCALE*2);
    // Backrest
    ctx.fillStyle=C.sfBk; ctx.fillRect(SCALE*5,SCALE*7,SCALE*6,4*S-SCALE*14);
    ctx.fillStyle=C.sfBkLit; ctx.fillRect(SCALE*5,SCALE*7,SCALE*3,4*S-SCALE*14);
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(SCALE*10,SCALE*7,SCALE,4*S-SCALE*14);
    // 3 cushions with stitching
    const cH=Math.floor((4*S-SCALE*14)/3);
    for(let i=0;i<3;i++){
      const cy=SCALE*7+i*cH;
      ctx.fillStyle=C.sfSt; ctx.fillRect(SCALE*11,cy,2*S-SCALE*11,cH);
      ctx.fillStyle=C.sfCuLit; ctx.fillRect(SCALE*11,cy,2*S-SCALE*11,SCALE*2);
      ctx.fillStyle=C.sfCu; ctx.fillRect(SCALE*12,cy+SCALE*2,2*S-SCALE*13,cH-SCALE*3);
      // Stitch lines
      ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(SCALE*11,cy+cH-SCALE); ctx.lineTo(2*S-SCALE,cy+cH-SCALE); ctx.stroke();
      ctx.strokeStyle='rgba(255,200,120,0.15)'; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(SCALE*12,cy+SCALE*3); ctx.lineTo(2*S-SCALE*2,cy+SCALE*3); ctx.stroke();
      ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(SCALE*11,cy+cH-SCALE*2,2*S-SCALE*11,SCALE*2);
    }
    // Italy stain
    ctx.fillStyle='rgba(90,60,25,0.5)'; ctx.fillRect(SCALE*13,SCALE*7+cH+SCALE*4,SCALE*7,SCALE*6); ctx.fillRect(SCALE*15,SCALE*7+cH+SCALE*2,SCALE*4,SCALE*4);
    // Coins
    ctx.fillStyle=C.coinGLit; ctx.fillRect(SCALE*12,SCALE*7+cH-SCALE,SCALE*2,SCALE*2); ctx.fillRect(SCALE*15,SCALE*7+cH*2-SCALE,SCALE*2,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(SCALE*5,4*S-SCALE*2,2*S-SCALE*5,SCALE*2);
  }
});

/* ══════ FREESTANDING OBJECTS ══════ */

/* DINING TABLE */
OBJECTS.push({
  tx:8,ty:6,w:4,h:3,
  hx:8,hy:6,hw:4,hh:3,
  label:'Dining Table',
  lines:['"3 legs + 1 Larousse. You call that stable."','"Full ashtray, empty bottle, unpaid bills."','"Engraved: \'GET OUT OF HERE\'. Wise."'],
  draw(ctx){
    // Drop shadow
    ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(SCALE*3,SCALE*3,4*S-SCALE*4,3*S-SCALE*4);
    // Legs
    ctx.fillStyle=C.tbLeg;
    [[SCALE,SCALE],[4*S-SCALE*3,SCALE],[SCALE,3*S-SCALE*3],[4*S-SCALE*3,3*S-SCALE*3]].forEach(([lx,ly])=>{
      ctx.fillRect(lx,ly,SCALE*2,SCALE*2);
      ctx.fillStyle='rgba(255,200,100,0.12)'; ctx.fillRect(lx,ly,SCALE,SCALE);
      ctx.fillStyle=C.tbLeg;
    });
    // Tabletop
    ctx.fillStyle=C.tbTop; ctx.fillRect(SCALE*2,SCALE*2,4*S-SCALE*4,3*S-SCALE*4);
    ctx.fillStyle=C.tbTopLit; ctx.fillRect(SCALE*2,SCALE*2,4*S-SCALE*4,SCALE*3);
    ctx.fillRect(SCALE*2,SCALE*2,SCALE*3,3*S-SCALE*4);
    ctx.fillStyle=C.tbTopDk; ctx.fillRect(SCALE*2,3*S-SCALE*4,4*S-SCALE*4,SCALE*2);
    ctx.fillRect(4*S-SCALE*4,SCALE*2,SCALE*2,3*S-SCALE*4);
    // Wood grain
    for(let g=0;g<6;g++){ ctx.strokeStyle='rgba(0,0,0,0.04)'; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(SCALE*2,SCALE*(4+g*4)); ctx.lineTo(4*S-SCALE*2,SCALE*(4+g*4)); ctx.stroke(); }
    // Engraving
    ctx.strokeStyle='#4a2808'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(S,SCALE*6); ctx.lineTo(3*S,SCALE*6); ctx.stroke();
    // Larousse book
    ctx.fillStyle='#5a2878'; ctx.fillRect(4*S-SCALE*2,3*S-SCALE*5,SCALE*4,SCALE*4);
    ctx.fillStyle='#7a3898'; ctx.fillRect(4*S-SCALE*2,3*S-SCALE*5,SCALE*4,SCALE*2);
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(4*S-SCALE*2,3*S-SCALE*5,SCALE,SCALE*4);
    // Ashtray
    ctx.fillStyle='#3a3a3a'; ctx.beginPath(); ctx.arc(S*0.8,S*0.8,SCALE*4.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#555'; ctx.beginPath(); ctx.arc(S*0.8,S*0.8,SCALE*3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#686868'; ctx.beginPath(); ctx.arc(S*0.8,S*0.8,SCALE*1.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.arc(S*0.7,S*0.7,SCALE*0.8,0,Math.PI*2); ctx.fill();
    // Cigarette
    ctx.fillStyle='#c8a070'; ctx.fillRect(S*0.62,S*0.72,SCALE*3,SCALE); ctx.fillRect(S*0.75,S*0.88,SCALE*3,SCALE);
    ctx.fillStyle='#ff4020'; ctx.fillRect(S*0.62,S*0.72,SCALE,SCALE);
    // Bottle
    ctx.fillStyle=C.btGrLit; ctx.beginPath(); ctx.arc(S*1.3,S*0.7,SCALE*3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.btGr; ctx.beginPath(); ctx.arc(S*1.35,S*0.75,SCALE*2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.btCp; ctx.beginPath(); ctx.arc(S*1.3,S*0.7,SCALE*1.8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(S*1.22,S*0.62,SCALE,SCALE*2);
    // Papers
    ctx.fillStyle='#ccc898'; ctx.fillRect(S*2,SCALE*4,S+SCALE*5,S-SCALE*3);
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(S*2,SCALE*4,S+SCALE*5,SCALE);
    ctx.fillStyle='#ff4040'; ctx.fillRect(S*2+SCALE*3,SCALE*6,SCALE*6,SCALE*2);
    ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(S*2+SCALE*2,SCALE*5,S+SCALE*3,S-SCALE*5);
  }
});

/* CHAIR LEFT */
OBJECTS.push({
  tx:6,ty:7,w:2,h:2,
  hx:6,hy:7,hw:2,hh:2,
  label:'Chair',
  lines:['"Cracked leg. Sitting down = Russian roulette."'],
  draw(ctx){
    ctx.fillStyle=C.chBkLit; ctx.fillRect(0,0,SCALE*3,2*S);
    ctx.fillStyle=C.chBk; ctx.fillRect(SCALE*3,0,2*S-SCALE*3,SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,SCALE*4,2*S,SCALE);
    ctx.fillStyle=C.chStLit; ctx.fillRect(0,SCALE*5,2*S,SCALE*2);
    ctx.fillStyle=C.chSt; ctx.fillRect(0,SCALE*7,2*S,2*S-SCALE*8);
    // Worn seat highlight
    ctx.fillStyle='rgba(255,200,120,0.1)'; ctx.fillRect(SCALE*2,SCALE*6,S+SCALE*2,SCALE*3);
    // Crack
    ctx.strokeStyle='#221408'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(SCALE*3,SCALE*8); ctx.lineTo(SCALE*8,SCALE*15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(SCALE*6,SCALE*8); ctx.lineTo(SCALE*9,SCALE*14); ctx.stroke();
    // Legs
    ctx.fillStyle=C.tbLeg;
    [[0,0],[2*S-SCALE*2,0],[0,2*S-SCALE*2],[2*S-SCALE*2,2*S-SCALE*2]].forEach(([lx,ly])=>{
      ctx.fillRect(lx,ly,SCALE*2,SCALE*2);
      ctx.fillStyle='rgba(255,200,100,0.1)'; ctx.fillRect(lx,ly,SCALE,SCALE); ctx.fillStyle=C.tbLeg;
    });
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,2*S-SCALE*2,2*S,SCALE*2); ctx.fillRect(2*S-SCALE*2,0,SCALE*2,2*S);
  }
});

/* CHAIR RIGHT */
OBJECTS.push({
  tx:13,ty:7,w:2,h:2,
  hx:13,hy:7,hw:2,hh:2,
  label:'Chair',
  lines:['"Picked up from the sidewalk. It\'s lived."'],
  draw(ctx){
    ctx.fillStyle=C.chBkLit; ctx.fillRect(0,0,SCALE*3,2*S);
    ctx.fillStyle=C.chBk; ctx.fillRect(SCALE*3,0,2*S-SCALE*3,SCALE*5);
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,SCALE*4,2*S,SCALE);
    ctx.fillStyle=C.chStLit; ctx.fillRect(0,SCALE*5,2*S,SCALE*2);
    ctx.fillStyle=C.chSt; ctx.fillRect(0,SCALE*7,2*S,2*S-SCALE*8);
    ctx.fillStyle='rgba(255,200,120,0.08)'; ctx.fillRect(SCALE*2,SCALE*6,S+SCALE*2,SCALE*3);
    ctx.fillStyle=C.tbLeg;
    [[0,0],[2*S-SCALE*2,0],[0,2*S-SCALE*2],[2*S-SCALE*2,2*S-SCALE*2]].forEach(([lx,ly])=>{
      ctx.fillRect(lx,ly,SCALE*2,SCALE*2);
    });
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,2*S-SCALE*2,2*S,SCALE*2); ctx.fillRect(2*S-SCALE*2,0,SCALE*2,2*S);
  }
});

/* BUCKET */
OBJECTS.push({
  tx:4,ty:11,w:1,h:2,
  hx:4,hy:11,hw:1,hh:2,
  label:'Bucket',
  lines:['"Ceiling soup. Not emptied since Tuesday."','"Something is swimming in it. You don\'t care."'],
  draw(ctx){
    // Drip
    ctx.fillStyle='rgba(100,130,160,0.6)'; ctx.fillRect(S/2-SCALE/2,-S*0.5,SCALE,S*0.5);
    // Drip drop
    const dd=Math.floor(Date.now()/1200)%8;
    if(dd<4){ ctx.fillStyle='rgba(120,160,200,0.7)'; ctx.beginPath(); ctx.arc(S/2,SCALE*(3-dd*2),SCALE*(0.5+dd*0.3),0,Math.PI*2); ctx.fill(); }
    // Handle
    ctx.strokeStyle=C.buHd; ctx.lineWidth=SCALE;
    ctx.beginPath(); ctx.arc(S/2,S*0.5,S*0.28,Math.PI,0); ctx.stroke();
    // Bucket body
    ctx.fillStyle=C.buWater; ctx.fillRect(SCALE*2,S*0.5+SCALE*3,S-SCALE*4,S+SCALE);
    ctx.fillStyle=C.buBdLit; ctx.fillRect(SCALE,S*0.5,S-SCALE*2,S);
    ctx.fillStyle=C.buBd; ctx.fillRect(SCALE*2,S*0.5+SCALE*2,S-SCALE*4,S-SCALE*2);
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(SCALE,S*0.5,SCALE*2,S);
    // Water surface
    ctx.fillStyle='rgba(80,120,160,0.7)'; ctx.fillRect(SCALE*2,S*0.5,S-SCALE*4,SCALE*3);
    ctx.fillStyle='rgba(140,180,220,0.4)'; ctx.fillRect(SCALE*2,S*0.5,S-SCALE*4,SCALE);
    // Rim
    ctx.fillStyle=C.buBdLit; ctx.fillRect(SCALE,S*0.5,S-SCALE*2,SCALE*2);
    // Muck
    ctx.fillStyle='rgba(60,40,20,0.45)'; ctx.fillRect(SCALE*2,2*S-SCALE*5,S-SCALE*4,SCALE*4);
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(SCALE,2*S-SCALE,S-SCALE*2,SCALE); ctx.fillRect(S-SCALE*2,S*0.5,SCALE*2,S*1.5);
  }
});

/* TRASH PILE */
OBJECTS.push({
  tx:1,ty:12,w:2,h:3,
  hx:1,hy:12,hw:2,hh:3,
  label:'Trash Pile',
  lines:['"An organizational system only you understand."','"3 orphaned remotes, 1 rolodex, the truth."'],
  draw(ctx){
    // Main bag
    ctx.fillStyle=C.trBg; ctx.fillRect(0,S,2*S,S);
    ctx.fillStyle='#383838'; ctx.fillRect(0,S,2*S,SCALE*3);
    ctx.fillStyle=C.trBgT; ctx.fillRect(0,S,2*S,SCALE*2);
    ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(0,S,SCALE*3,S);
    // Tie
    ctx.fillStyle='#484848'; ctx.fillRect(S-SCALE*3,S-SCALE,SCALE*5,SCALE);
    // Second bag
    ctx.fillStyle='#323232'; ctx.fillRect(SCALE*2,SCALE*2,S+SCALE*4,S-SCALE*2);
    ctx.fillStyle='#404040'; ctx.fillRect(SCALE*2,SCALE*2,S+SCALE*4,SCALE*3);
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(SCALE*2,SCALE*2,SCALE*3,S-SCALE*2);
    ctx.fillStyle='#484848'; ctx.fillRect(S-SCALE,SCALE*2,SCALE*3,SCALE);
    // Cardboard piece
    ctx.fillStyle='#7a5020'; ctx.fillRect(SCALE,0,S+SCALE*4,SCALE*4);
    ctx.fillStyle='#9a6830'; ctx.fillRect(SCALE,0,S+SCALE*4,SCALE*2);
    for(let f=0;f<3;f++){ ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(SCALE*(2+f*5),0); ctx.lineTo(SCALE*(2+f*5),SCALE*4); ctx.stroke(); }
    // Bottle
    ctx.fillStyle=C.btGrLit; ctx.beginPath(); ctx.arc(S*1.5,SCALE*6,SCALE*3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.btGr; ctx.beginPath(); ctx.arc(S*1.55,SCALE*6.5,SCALE*2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.btCp; ctx.beginPath(); ctx.arc(S*1.5,SCALE*6,SCALE*1.8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,3*S-SCALE,2*S,SCALE);
  }
});

/* MYSTERIOUS BOX */
OBJECTS.push({
  tx:6,ty:12,w:2,h:2,
  hx:6,hy:12,hw:2,hh:2,
  label:'G. Mouton\'s Box',
  lines:['"\'DO NOT TOUCH — G. MOUTON\'. He died in 2019."','"It makes a water sound. It\'s not water."','"The box is watching you."'],
  draw(ctx){
    // Main body with gradient-like shading
    ctx.fillStyle=C.bxBrLit; ctx.fillRect(0,0,2*S,SCALE*3);
    ctx.fillStyle=C.bxBr; ctx.fillRect(0,SCALE*3,2*S,2*S-SCALE*3);
    // Cardboard grain lines
    for(let g=0;g<5;g++){ ctx.strokeStyle='rgba(0,0,0,0.07)'; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(0,SCALE*(3+g*5)); ctx.lineTo(2*S,SCALE*(3+g*5)); ctx.stroke(); }
    // Tape strips
    ctx.fillStyle=C.bxTp; ctx.fillRect(S-SCALE,0,SCALE*2,2*S); ctx.fillRect(0,S-SCALE,2*S,SCALE*2);
    ctx.fillStyle=C.bxTpLit; ctx.fillRect(S-SCALE,0,SCALE,2*S); ctx.fillRect(0,S-SCALE,2*S,SCALE);
    // Corner darkening
    ctx.fillStyle='rgba(0,0,0,0.22)';
    ctx.fillRect(0,0,SCALE*5,SCALE*4); ctx.fillRect(2*S-SCALE*5,0,SCALE*5,SCALE*4);
    ctx.fillRect(0,2*S-SCALE*4,SCALE*5,SCALE*4); ctx.fillRect(2*S-SCALE*5,2*S-SCALE*4,SCALE*5,SCALE*4);
    // Warning label
    ctx.fillStyle='rgba(200,30,30,0.4)'; ctx.fillRect(SCALE*3,SCALE*5,S+SCALE*2,S/2+SCALE*2);
    ctx.fillStyle='rgba(220,60,40,0.3)'; ctx.fillRect(SCALE*3,SCALE*5,S+SCALE*2,SCALE*2);
    ctx.fillStyle='#cc5050'; ctx.font=`${SCALE*3}px monospace`; ctx.textBaseline='top'; ctx.textAlign='left'; ctx.fillText('!',SCALE*4,SCALE*5.5);
    // Damp stain
    ctx.fillStyle='rgba(0,25,0,0.2)'; ctx.fillRect(SCALE,S+SCALE*2,SCALE*6,SCALE*4);
    // Highlight
    ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(0,0,2*S,SCALE*2); ctx.fillRect(0,0,SCALE*2,2*S);
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(0,2*S-SCALE,2*S,SCALE); ctx.fillRect(2*S-SCALE*2,0,SCALE*2,2*S);
  }
});

/* POSTER */
OBJECTS.push({
  tx:6,ty:1,w:1,h:1,
  hx:0,hy:0,hw:0,hh:0,
  label:'WANTED Poster',
  lines:['"WANTED — Kevin. Reward: €1. Made in Word."','"Below: \'ALSO WANTED: the landlord\'."'],
  draw(ctx){
    // Frame
    ctx.fillStyle='#1a0808'; ctx.fillRect(0,0,S,S);
    ctx.fillStyle=C.posBg; ctx.fillRect(SCALE,SCALE,S-SCALE*2,S-SCALE*2);
    ctx.fillStyle='#600000'; ctx.fillRect(SCALE*2,SCALE*2,S-SCALE*4,S-SCALE*4);
    // Skull pixel art
    const skull=[[0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[1,1,0,1,1,0,1,1],[1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,0],[0,1,0,1,1,0,1,0],[0,0,1,1,1,1,0,0]];
    skull.forEach((row,r)=>row.forEach((v,c)=>{
      if(v){
        ctx.fillStyle='#f8e8c0'; ctx.fillRect((c+4)*SCALE,(r+2)*SCALE,SCALE,SCALE);
        if(r===0&&c===3){ ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect((c+4)*SCALE,(r+2)*SCALE,SCALE/2,SCALE/2); }
      }
    }));
    // WANTED text bar
    ctx.fillStyle=C.posRd; ctx.fillRect(SCALE*2,SCALE*11,S-SCALE*4,SCALE*3);
    ctx.fillStyle='#ff6060'; ctx.fillRect(SCALE*2,SCALE*11,S-SCALE*4,SCALE);
    ctx.fillStyle='#fff8f0'; ctx.font=`${SCALE*2}px monospace`; ctx.textBaseline='top'; ctx.textAlign='center'; ctx.fillText('WANTED',S/2,SCALE*11.5);
    // Pin
    ctx.fillStyle='rgba(200,180,100,0.7)'; ctx.beginPath(); ctx.arc(S/2,SCALE,SCALE*1.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,200,0.8)'; ctx.beginPath(); ctx.arc(S/2-SCALE*0.5,SCALE*0.5,SCALE*0.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#ff2d00'; ctx.lineWidth=0.5; ctx.strokeRect(SCALE,SCALE,S-SCALE*2,S-SCALE*2);
  }
});

/* ══════ KEVIN ══════ */
let kevinAlive=true, kevinHitTimer=0, kevinDeathTimer=-1;
OBJECTS.push({
  tx:11,ty:11,w:1,h:1,
  isMob:true,mobId:'kevin',
  get alive(){ return kevinAlive; },
  label:'Kevin',
  lines:[
    '"It\'s Kevin. No rent. Been here longer than you."',
    '"Kevin looks at you with contempt. Kevin\'s doing fine."',
    '"Kevin has a plan. Kevin doesn\'t share."',
  ],
  linesArmed:[
    '"Kevin senses danger."',
    '"He\'s watching you. He\'s watching the plunger."',
    '"Kevin knows what\'s coming. Kevin is wrong."',
  ],
  draw(ctx){
    if(!kevinAlive){
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
    const wb=Math.sin(Date.now()/380)*SCALE*0.7;
    ctx.save(); ctx.translate(0,wb);
    // Shadow
    ctx.globalAlpha=0.18; ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(S/2,S*0.92,S*0.3,S*0.07,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    // Body — richer browns
    ctx.fillStyle=C.ratBdLit;
    ctx.fillRect(SCALE*4,SCALE*5,S-SCALE*8,S-SCALE*7);
    ctx.fillRect(SCALE*1,SCALE*3,S-SCALE*8,S-SCALE*9);
    ctx.fillStyle=C.ratBd;
    ctx.fillRect(SCALE*3,SCALE*6,S-SCALE*8,S-SCALE*8);
    // Ears
    ctx.fillStyle='#2a1808'; ctx.fillRect(SCALE*1,0,SCALE*4,SCALE*5); ctx.fillRect(SCALE*6,0,SCALE*3,SCALE*5);
    ctx.fillStyle=C.ratEr; ctx.fillRect(SCALE*2,SCALE,SCALE*2,SCALE*3); ctx.fillRect(SCALE*6,SCALE,SCALE*2,SCALE*3);
    ctx.fillStyle='#c08888'; ctx.fillRect(SCALE*2,SCALE,SCALE,SCALE*2); ctx.fillRect(SCALE*6,SCALE,SCALE,SCALE*2);
    // Eyes with highlight
    ctx.fillStyle=C.ratEy; ctx.fillRect(SCALE*3,SCALE*4,SCALE*2,SCALE*2);
    ctx.fillStyle='#ff6060'; ctx.fillRect(SCALE*4,SCALE*4,SCALE,SCALE);
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillRect(SCALE*3,SCALE*4,SCALE,SCALE);
    // Whiskers
    ctx.strokeStyle='#c8b090'; ctx.lineWidth=0.5;
    [[SCALE,SCALE*6,SCALE*-4,SCALE*5],[SCALE,SCALE*7,SCALE*-4,SCALE*8],[SCALE,SCALE*5,SCALE*-3,SCALE*4]].forEach(([x1,y1,x2,y2])=>{
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });
    // Tail
    ctx.strokeStyle='#3a2010'; ctx.lineWidth=SCALE*0.9;
    ctx.beginPath();
    ctx.moveTo((S-SCALE*2)*1,SCALE*10); ctx.quadraticCurveTo(S*1.2,SCALE*15,(S+SCALE*5),SCALE*12); ctx.stroke();
    // Fur detail lines
    ctx.strokeStyle='rgba(60,40,20,0.2)'; ctx.lineWidth=0.5;
    for(let f=0;f<3;f++){ ctx.beginPath(); ctx.moveTo(SCALE*(3+f*2),SCALE*6); ctx.lineTo(SCALE*(2+f*2),SCALE*11); ctx.stroke(); }
    ctx.restore();
  }
});

/* COIN */
let coinVisible=false;
OBJECTS.push({
  tx:12,ty:11,w:1,h:1,
  isCoin:true,
  hx:0,hy:0,hw:0,hh:0,
  get _skip(){ return !coinVisible; },
  label:'€1',
  lines:['★ +€1 picked up! Kevin shouldn\'t have.'],
  draw(ctx){
    if(!coinVisible) return;
    const b=Math.sin(Date.now()/250)*SCALE*1.2;
    const r=0.5+0.5*Math.sin(Date.now()/400);
    ctx.save(); ctx.translate(0,b);
    // Glow
    ctx.globalAlpha=0.25*r; ctx.fillStyle='#ffe600';
    ctx.beginPath(); ctx.arc(S/2,S/2,SCALE*9,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    // Coin body
    ctx.fillStyle=C.coinDk; ctx.beginPath(); ctx.arc(S/2+SCALE*0.5,S/2+SCALE*0.5,SCALE*6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.coinD; ctx.beginPath(); ctx.arc(S/2,S/2,SCALE*6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.coinG; ctx.beginPath(); ctx.arc(S/2,S/2,SCALE*5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.coinGLit; ctx.beginPath(); ctx.arc(S/2,S/2,SCALE*4,0,Math.PI*2); ctx.fill();
    // Symbol
    ctx.fillStyle='#c09010';
    ctx.font=`bold ${SCALE*5}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('€',S/2,S/2);
    // Shine
    ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.fillRect(S/2-SCALE*4,S/2-SCALE*2,SCALE*1.5,SCALE*1.5);
    ctx.restore();
  }
});

/* PLUNGER */
OBJECTS.push({
  tx:17,ty:13,w:1,h:2,
  hx:17,hy:13,hw:1,hh:2,
  label:'Sacred Plunger ★',
  pickable:true,itemId:'plunger',
  itemName:'Sacred Plunger',
  itemDesc:'ATK +1 | Certified against rodents and creditors.',
  lines:['"THE plunger. Your only tool. Your only weapon."','"It glows with a strange aura. +1 Resourcefulness."','"[ E to PICK UP ]"'],
  draw(ctx){
    const t=Date.now();
    const g=0.12+0.08*Math.sin(t/400);
    ctx.fillStyle=`rgba(255,220,0,${g})`; ctx.fillRect(-SCALE*4,-SCALE*4,S+SCALE*8,2*S+SCALE*8);
    // Stick
    ctx.fillStyle=C.plStLit; ctx.fillRect(S/2-SCALE,0,SCALE,2*S-SCALE*5);
    ctx.fillStyle=C.plSt; ctx.fillRect(S/2,0,SCALE,2*S-SCALE*5);
    ctx.fillStyle='#6a4020'; ctx.fillRect(S/2+SCALE,0,SCALE*0.5,2*S-SCALE*5);
    // Cup with sheen
    ctx.fillStyle=C.plCpLit; ctx.fillRect(SCALE*2,2*S-SCALE*7,S-SCALE*4,SCALE*2);
    ctx.fillStyle=C.plCp; ctx.fillRect(SCALE*2,2*S-SCALE*5,S-SCALE*4,SCALE*4); ctx.fillRect(0,2*S-SCALE*4,S,SCALE*3);
    ctx.fillStyle=C.plCpD; ctx.fillRect(0,2*S-SCALE*2,S,SCALE*2);
    ctx.fillStyle='rgba(255,120,90,0.35)'; ctx.fillRect(SCALE*2,2*S-SCALE*6,SCALE*3,SCALE*4);
    // Sparkles
    [0,1,2,3].forEach(i=>{
      const a=t/300+i*1.57;
      const sx=Math.cos(a)*SCALE*6+S/2, sy=Math.sin(a)*SCALE*4+S*0.6;
      ctx.fillStyle='#ffe600'; ctx.fillRect(sx-SCALE/2,sy-SCALE/2,SCALE,SCALE);
      ctx.fillStyle='rgba(255,255,200,0.7)'; ctx.fillRect(sx-SCALE/4,sy-SCALE/4,SCALE/2,SCALE/2);
    });
  }
});

/* ══════ PLAYER ══════ */
let player={
  tx:3.0,ty:4.5,
  facing:'down',frame:0,frameTimer:0,attackTimer:0,
  money:loadMoney(),dignity:0,inventory:[],weapon:null,
};

/* ══════ TRIP STATE ══════ */
let tripActive=false, tripTimer=0;
const TRIP_DURATION=15;
const TRIP_MESSAGES=[
  '"kevin...?"','"the floor is breathing"','"am i the rat"',
  '"RENT IS A SOCIAL CONSTRUCT"','"the walls know your name"',
  '"gerald was real"','"tuesday. always tuesday."',
  '"kevin sees you too"','"the coin... it was never real"',
  '"i can taste the wallpaper"',
];
let tripMsgTimer=0, tripMsgIdx=0, tripMsgVisible=false;

/* ══════ INPUT / STATE ══════ */
const keys={};
let pendingPickup=null,pendingCoin=false;
document.addEventListener('keydown',e=>{
  keys[e.key.toLowerCase()]=true;
  if(e.key.toLowerCase()==='e'){
    if(gameState==='dialog') advanceDialog();
    else tryInteract();
  }
  if(e.key.toLowerCase()==='q') toggleInventory();
  if(e.key.toLowerCase()==='f'){
    if(gameState==='inventory'||gameState==='playing') tryConsumeItem();
  }
  if(e.key==='Escape') togglePause();
});
document.addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; });

let gameState='playing';
let dialogQueue=[],dialogIdx=0,dialogObj=null;
let isDead=false,deathTimer=0;

/* ══════ CANVAS ══════ */
let canvas,ctx,uiCanvas,uiCtx;

function startWorld(fresh=false){
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
  if(fresh) clearGameState();
  loadGameState();
  const returning=new URLSearchParams(window.location.search).get('from')==='street';
  if(returning){ player.tx=11.5; player.ty=15.5; player.facing='up'; }
  setTimeout(()=>showDialog(null, returning ? [
    `"Back inside. Smells the same."`,
    `"Balance: €${player.money}."`,
    '"Kevin\'s still here. He never left."',
  ] : [
    '📢 TUESDAY, 07:43 AM.',
    `"Rent due in 3 days. Balance: €${player.money}."`,
    '"The plunger is in the south corner. Kevin\'s around somewhere."',
    '"Head to the door to go outside."',
  ]),400);
  requestAnimationFrame(gameLoop);
}

function resizeGame(){
  const W=window.innerWidth,H=window.innerHeight,mW=COLS*S,mH=ROWS*S;
  canvas.width=mW; canvas.height=mH;
  const fit=Math.min((W-16)/mW,(H-56)/mH);
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
  if(tripActive){
    tripTimer+=dt; tripMsgTimer+=dt;
    if(tripMsgTimer>2.2){ tripMsgTimer=0; tripMsgVisible=true; tripMsgIdx=Math.floor(Math.random()*TRIP_MESSAGES.length); }
    if(tripTimer>=TRIP_DURATION){ tripActive=false; tripTimer=0; tripMsgVisible=false; }
  }
  if(isDead){ deathTimer+=dt; }
  drawWorld(); drawUI();
  if(isDead) drawDeathScreen();
  requestAnimationFrame(gameLoop);
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

  // Door exit trigger — walk into door tiles
  if(player.ty>=16.6 && (player.tx>=10.5 && player.tx<=13.5)){
    triggerExit();
  }
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
    const pL=tx+0.15, pR=tx+0.85, pT=ty+0.15, pB=ty+0.85;
    const oR=hx+hw, oB=hy+hh;
    if(pR>hx&&pL<oR&&pB>hy&&pT<oB) return true;
  }
  return false;
}

/* ══════ DOOR EXIT ══════ */
let exitTriggered=false;
function triggerExit(){
  if(exitTriggered||gameState==='exiting') return;
  exitTriggered=true;
  gameState='exiting';
  saveMoney(player.money);
  saveGameState();
  // Fade out and navigate to street
  const fade=document.createElement('div');
  fade.style.cssText='position:fixed;inset:0;background:#0a0a0a;z-index:9999;opacity:0;transition:opacity 0.8s ease;pointer-events:none;';
  document.body.appendChild(fade);
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{ fade.style.opacity='1'; });
  });
  setTimeout(()=>{
    // Navigate to street page — adjust path as needed
    window.location.href='Street.html';
  },900);
}

/* ══════ INTERACT ══════ */
function tryInteract(){
  if(gameState!=='playing') return;
  const off={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const [ox,oy]=off[player.facing];
  const cx=Math.floor(player.tx)+ox,cy=Math.floor(player.ty)+oy;
  const px2=Math.floor(player.tx),py2=Math.floor(player.ty);

  for(const obj of OBJECTS){
    if(obj._skip) continue;
    const hit=(cx>=obj.tx&&cx<obj.tx+obj.w&&cy>=obj.ty&&cy<obj.ty+obj.h)
           ||(px2>=obj.tx&&px2<obj.tx+obj.w&&py2>=obj.ty&&py2<obj.ty+obj.h);
    if(!hit) continue;
    if(obj.isCoin){ showDialog(obj,obj.lines); pendingCoin=true; return; }
    if(obj.isMob&&obj.mobId==='kevin'){
      if(!obj.alive) continue;
      if(!player.weapon) showDialog(obj,obj.lines);
      else showDialog(obj,obj.linesArmed);
      return;
    }
    if(obj.pickable){
      if(player.inventory.find(i=>i.id===obj.itemId)) showDialog(obj,['"You already have it."']);
      else{ showDialog(obj,obj.lines); pendingPickup=obj; }
      return;
    }
    showDialog(obj,obj.lines); return;
  }
  if((cx===11||cx===12)&&cy===17||(px2===11||px2===12)&&py2===17)
    showDialog(null,['"The door. The OUTSIDE."','"Walk into it to leave."']);
}

function tryConsumeItem(){
  const idx=player.inventory.findIndex(i=>i.id==='strange_water');
  if(idx===-1) return;
  player.inventory.splice(idx,1);
  player.weapon=player.inventory.find(i=>i.isWeapon)?.id||null;
  saveGameState();
  if(gameState==='inventory') gameState='playing';
  tripActive=true; tripTimer=0; tripMsgTimer=0; tripMsgIdx=0; tripMsgVisible=false;
  showDialog(null,[
    '"You drink the Strange Water."',
    '"It tastes like battery acid and nostalgia."',
    '"Something shifts in the apartment."',
  ]);
}

function showDialog(obj,lines){
  if(gameState==='dialog') return;
  dialogObj=obj; dialogQueue=lines; dialogIdx=0; gameState='dialog';
}

function advanceDialog(){
  const wasKevinArmed = dialogObj&&dialogObj.isMob&&dialogObj.mobId==='kevin'&&player.weapon;
  const wasPendingPickup = pendingPickup;
  const wasPendingCoin = pendingCoin;
  dialogIdx++;
  if(dialogIdx < dialogQueue.length) return;
  gameState='playing'; dialogObj=null;
  if(wasKevinArmed){ attackKevin(); return; }
  if(wasPendingPickup){ pendingPickup=null; doPickup(wasPendingPickup); return; }
  if(wasPendingCoin){ pendingCoin=false; collectCoin(); return; }
}

function attackKevin(){
  player.attackTimer=1; kevinHitTimer=1; kevinAlive=false; kevinDeathTimer=0; saveGameState();
  setTimeout(()=>{coinVisible=true;},800);
  showDialog(null,[
    '★ KEVIN DEFEATED by the Sacred Plunger!',
    '"Kevin shouldn\'t have been hanging around."',
    '"[ Pick up the reward: €1 ]"',
  ]);
}

function collectCoin(){
  coinVisible=false; player.money+=1; saveMoney(player.money); saveGameState();
  gameState='playing'; dialogObj=null;
  showDialog(null,[`★ +€1! Balance: €${player.money}.`,'"Kevin died for this. It\'s called business."']);
}

function doPickup(obj){
  player.inventory.push({id:obj.itemId,name:obj.itemName,desc:obj.itemDesc,isWeapon:true,atk:1});
  player.weapon=obj.itemId;
  const idx=OBJECTS.indexOf(obj); if(idx>-1) OBJECTS.splice(idx,1);
  saveGameState();
  dialogObj=null;
  dialogQueue=['★ PICKED UP: '+obj.itemName,obj.itemDesc,'"You brandish the plunger. Kevin is nervous."'];
  dialogIdx=0; gameState='dialog';
}

function toggleInventory(){ if(gameState==='dialog') return; gameState=gameState==='inventory'?'playing':'inventory'; }
function togglePause(){ if(gameState==='dialog'||gameState==='inventory') return; gameState=gameState==='paused'?'playing':'paused'; }

/* ══════ DRAW WORLD ══════ */
function drawWorld(){
  ctx.fillStyle='#0a0604'; ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) drawTile(c,r);
  [...OBJECTS].filter(o=>!o._skip).sort((a,b)=>(a.ty+a.h)-(b.ty+b.h)).forEach(obj=>{
    ctx.save(); ctx.translate(obj.tx*S,obj.ty*S); obj.draw(ctx); ctx.restore();
  });
  drawPlayer();
  drawHint();
  if(player.attackTimer>0.3) drawSlash();
  // Door glow pulse
  drawDoorGlow();
  if(tripActive) drawRoomTripEffect();
}

function drawRoomTripEffect(){
  const t=Date.now()/1000;
  const prog=tripTimer/TRIP_DURATION;
  const intensity=prog<0.15?(prog/0.15):(prog>0.8?((1-prog)/0.2):1);
  const W=canvas.width, H=canvas.height;

  ctx.save();

  // Chromatic aberration overlay
  const offX=Math.sin(t*2.1)*SCALE*3*intensity;
  const offY=Math.cos(t*1.7)*SCALE*2*intensity;
  ctx.globalCompositeOperation='screen';
  ctx.globalAlpha=0.15*intensity;
  ctx.fillStyle='#ff0040'; ctx.fillRect(offX,offY,W,H);
  ctx.fillStyle='#0040ff'; ctx.fillRect(-offX,-offY,W,H);
  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=1;

  // Colour wave bands
  for(let y=0;y<H;y+=SCALE*4){
    const shift=Math.sin(t*3+y*0.04)*SCALE*2*intensity;
    ctx.globalAlpha=0.035*intensity;
    ctx.fillStyle=`hsl(${(y*2+t*60)%360},80%,60%)`;
    ctx.fillRect(shift,y,W,SCALE*2);
  }
  ctx.globalAlpha=1;

  // Ghost Kevins drifting through the room
  const numGhosts=Math.floor(3*intensity)+1;
  for(let g=0;g<numGhosts;g++){
    const gx=(Math.sin(t*0.7+g*2.4)*0.4+0.5)*W;
    const gy=(Math.cos(t*0.5+g*1.9)*0.35+0.5)*H;
    const gs=SCALE*(2+Math.sin(t*0.9+g)*1);
    ctx.save(); ctx.translate(gx,gy); ctx.scale(gs,gs);
    ctx.globalAlpha=0.2*intensity;
    ctx.fillStyle='#80ff80';
    ctx.fillRect(-5,-8,10,9); ctx.fillRect(-8,-12,4,5);
    ctx.fillRect(-9,-14,2,4); ctx.fillRect(-6,-14,2,4);
    ctx.fillRect(-8,-11,2,2);
    ctx.restore();
  }
  ctx.globalAlpha=1;

  // Green vignette pulse
  const vig=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.85);
  const vigAlpha=(0.35+0.25*Math.sin(t*1.5))*intensity;
  vig.addColorStop(0,'rgba(0,80,0,0)');
  vig.addColorStop(1,`rgba(0,40,20,${vigAlpha})`);
  ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

  // Creepy floating message
  if(tripMsgVisible){
    const msgAlpha=Math.min(1,(1-Math.abs(tripMsgTimer-1.1)/1.1))*intensity;
    ctx.globalAlpha=msgAlpha;
    ctx.font=`bold ${SCALE*5}px "Permanent Marker",cursive`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(0,255,80,0.9)';
    ctx.fillText(TRIP_MESSAGES[tripMsgIdx],W/2,H/2+Math.sin(t*2)*SCALE*8);
    ctx.globalAlpha=1;
  }

  // Progress bar
  ctx.fillStyle='rgba(0,255,80,0.3)';
  ctx.fillRect(0,0,(1-prog)*W,SCALE);

  ctx.restore();
}

function drawDoorGlow(){
  const t=Date.now();
  const pulse=0.08+0.05*Math.sin(t/800);
  ctx.save();
  ctx.globalAlpha=pulse;
  ctx.fillStyle='#ffe600';
  ctx.fillRect(11*S,16*S,2*S,2*S);
  ctx.globalAlpha=1;
  // Arrow hint above door
  const a=0.6+0.4*Math.sin(t/500);
  ctx.globalAlpha=a*0.7;
  ctx.fillStyle='#ffe600';
  ctx.font=`bold ${SCALE*4}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('▼',11.5*S+S/2,15.2*S);
  ctx.globalAlpha=1;
  ctx.restore();
}

/* ══════ TILE RENDERER ══════ */
const WT=5*SCALE;

function drawTile(col,row){
  ctx.save(); ctx.translate(col*S,row*S);
  const t=MAP[row]?.[col];
  switch(t){
    case _:  drawFloor(col,row); break;
    case CK: drawFloor(col,row); drawCrack(); break;
    case RG: drawFloor(col,row); drawRug(); break;
    case N:  drawWallN(col,row); break;
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
  // 4-color wood floor with more varied grain
  const v=(col*5+row*11+col*row)%4;
  ctx.fillStyle=v===0?C.flA:v===1?C.flB:v===2?C.flC:C.flD;
  ctx.fillRect(0,0,S,S);
  // Plank lines (horizontal, simulating boards running east-west)
  const plankRow=row%2;
  const offset=plankRow===0?0:TILE/2;
  ctx.fillStyle=C.flDark;
  // Board edge lines
  if(col===0||(col*TILE+offset)%TILE===0){
    ctx.fillStyle='rgba(30,15,0,0.25)'; ctx.fillRect(0,0,1,S);
  }
  ctx.fillStyle='rgba(30,15,0,0.18)'; ctx.fillRect(0,0,S,1);
  // Grain lines within board
  for(let p=3;p<TILE;p+=4){
    ctx.fillStyle='rgba(0,0,0,0.07)'; ctx.fillRect(0,p*SCALE,S,SCALE);
  }
  // Subtle highlight on leading edge
  ctx.fillStyle='rgba(255,200,100,0.05)'; ctx.fillRect(0,0,S,SCALE);
  // Occasional knot
  if((col*7+row*13)%11===0){
    ctx.fillStyle='rgba(30,15,0,0.22)';
    ctx.beginPath(); ctx.ellipse(S*0.5,S*0.5,SCALE*2,SCALE,0,0,Math.PI*2); ctx.fill();
  }
}

function drawCrack(){
  ctx.strokeStyle=C.flCrack; ctx.lineWidth=SCALE*0.6;
  ctx.beginPath(); ctx.moveTo(S*0.2,S*0.1); ctx.lineTo(S*0.5,S*0.55); ctx.lineTo(S*0.3,S*0.9); ctx.stroke();
  // Sub-cracks
  ctx.lineWidth=SCALE*0.3; ctx.globalAlpha=0.6;
  ctx.beginPath(); ctx.moveTo(S*0.4,S*0.35); ctx.lineTo(S*0.6,S*0.45); ctx.stroke();
  ctx.globalAlpha=1;
}

function drawRug(){
  const p=SCALE;
  // Rug base with richer pattern
  ctx.fillStyle=C.rugA; ctx.fillRect(p,p,S-2*p,S-2*p);
  ctx.fillStyle=C.rugB; ctx.fillRect(3*p,3*p,S-6*p,S-6*p);
  // Inner pattern diamond
  ctx.fillStyle=C.rugPat; ctx.fillRect(S/2-p,S/2-p,p*2,p*2);
  ctx.fillStyle=C.rugPat;
  [[S/2-p*3,S/2],[S/2+p*2,S/2],[S/2,S/2-p*3],[S/2,S/2+p*2]].forEach(([rx,ry])=>{
    ctx.fillRect(rx,ry,p,p);
  });
  // Border
  ctx.fillStyle=C.rugBrd; ctx.fillRect(p,p,S-2*p,p); ctx.fillRect(p,S-2*p,S-2*p,p);
  ctx.fillRect(p,p,p,S-2*p); ctx.fillRect(S-2*p,p,p,S-2*p);
  // Gold accent line inside border
  ctx.fillStyle=C.rugGold; ctx.fillRect(p*2,p*2,S-4*p,p/2); ctx.fillRect(p*2,S-p*2,S-4*p,p/2);
  ctx.fillRect(p*2,p*2,p/2,S-4*p); ctx.fillRect(S-p*2,p*2,p/2,S-4*p);
}

function drawWallN(col,row){
  // Top lit strip
  ctx.fillStyle=C.wTop; ctx.fillRect(0,0,S,SCALE*4);
  ctx.fillStyle='rgba(255,230,160,0.12)'; ctx.fillRect(0,0,S,SCALE*2);
  // Wall face with mortar lines
  ctx.fillStyle=C.wFace; ctx.fillRect(0,SCALE*4,S,S-SCALE*4);
  // Brick/plaster texture rows
  for(let p=4;p<TILE;p+=3){
    ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(0,p*SCALE,S,SCALE);
  }
  // Mortar spots
  if(col%3===0){ ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(S/3,S*0.5,SCALE,SCALE*2); }
  // Ambient occlusion at base
  ctx.fillStyle='rgba(0,0,0,0.38)'; ctx.fillRect(0,S-SCALE*5,S,SCALE*5);
}

function drawWallS(){
  ctx.fillStyle=C.wFace; ctx.fillRect(0,0,S,S-SCALE*4);
  for(let p=0;p<TILE-3;p+=3){ ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(0,p*SCALE,S,SCALE); }
  ctx.fillStyle=C.wTop; ctx.fillRect(0,S-SCALE*4,S,SCALE*4);
  ctx.fillStyle='rgba(255,230,160,0.12)'; ctx.fillRect(0,S-SCALE*2,S,SCALE*2);
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,0,S,SCALE*4);
}

function drawWallW(){
  ctx.fillStyle=C.wFace; ctx.fillRect(0,0,S,S);
  ctx.fillStyle=C.wTop; ctx.fillRect(0,0,SCALE*5,S);
  ctx.fillStyle='rgba(255,230,160,0.12)'; ctx.fillRect(0,0,SCALE*2,S);
  for(let p=0;p<TILE;p+=3){ ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(SCALE*5,p*SCALE,S-SCALE*5,SCALE); }
  ctx.fillStyle='rgba(0,0,0,0.32)'; ctx.fillRect(S-SCALE*4,0,SCALE*4,S);
}

function drawWallE(){
  ctx.fillStyle=C.wFace; ctx.fillRect(0,0,S,S);
  ctx.fillStyle=C.wTop; ctx.fillRect(S-SCALE*5,0,SCALE*5,S);
  ctx.fillStyle='rgba(255,230,160,0.12)'; ctx.fillRect(S-SCALE*2,0,SCALE*2,S);
  for(let p=0;p<TILE;p+=3){ ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(0,p*SCALE,S-SCALE*5,SCALE); }
  ctx.fillStyle='rgba(0,0,0,0.32)'; ctx.fillRect(0,0,SCALE*4,S);
}

function drawCorner(type){
  ctx.fillStyle=C.wFace; ctx.fillRect(0,0,S,S);
  if(type==='NW'||type==='NE'){ ctx.fillStyle=C.wTop; ctx.fillRect(0,0,S,SCALE*5); ctx.fillStyle='rgba(255,230,160,0.1)'; ctx.fillRect(0,0,S,SCALE*2); }
  if(type==='SW'||type==='SE'){ ctx.fillStyle=C.wTop; ctx.fillRect(0,S-SCALE*5,S,SCALE*5); }
  if(type==='NW'||type==='SW'){ ctx.fillStyle=C.wTop; ctx.fillRect(0,0,SCALE*5,S); ctx.fillStyle='rgba(255,230,160,0.1)'; ctx.fillRect(0,0,SCALE*2,S); }
  if(type==='NE'||type==='SE'){ ctx.fillStyle=C.wTop; ctx.fillRect(S-SCALE*5,0,SCALE*5,S); ctx.fillStyle='rgba(255,230,160,0.1)'; ctx.fillRect(S-SCALE*2,0,SCALE*2,S); }
  ctx.fillStyle='rgba(0,0,0,0.38)';
  if(type==='NW') ctx.fillRect(S-SCALE*5,SCALE*5,SCALE*5,S-SCALE*5);
  if(type==='NE') ctx.fillRect(0,SCALE*5,SCALE*5,S-SCALE*5);
  if(type==='SW') ctx.fillRect(S-SCALE*5,0,SCALE*5,S-SCALE*5);
  if(type==='SE') ctx.fillRect(0,0,SCALE*5,S-SCALE*5);
}

function drawDoor(){
  // Door frame
  ctx.fillStyle=C.doorFrame; ctx.fillRect(0,0,S,S);
  ctx.fillStyle=C.doorFr;
  ctx.fillRect(0,0,SCALE*3,S); ctx.fillRect(S-SCALE*3,0,SCALE*3,S);
  ctx.fillRect(0,0,S,SCALE*3);
  // Door opening
  ctx.fillStyle=C.doorOpen; ctx.fillRect(SCALE*3,0,S-SCALE*6,S);
  // Light coming from outside — warm glow strip
  const t=Date.now();
  const gl=0.12+0.06*Math.sin(t/1200);
  ctx.fillStyle=`rgba(255,220,140,${gl})`; ctx.fillRect(SCALE*3,0,S-SCALE*6,S);
  // Threshold
  ctx.fillStyle=C.doorFr; ctx.fillRect(0,S-SCALE*3,S,SCALE*3);
  ctx.fillStyle='rgba(255,200,80,0.25)'; ctx.fillRect(0,S-SCALE*2,S,SCALE*2);
}

/* ══════ PLAYER ══════ */
function drawPlayer(){
  const x=player.tx*S+S/2,y=player.ty*S+S/2;
  const bob=(player.frame===1||player.frame===3)?-SCALE:0;
  const loff=player.frame===1?2:player.frame===3?-2:0;
  const aoff=player.frame===1?-2:player.frame===3?2:0;
  const p=SCALE,atk=player.attackTimer>0.3;
  ctx.save(); ctx.translate(x,y+bob);
  // Shadow
  ctx.globalAlpha=0.22; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(0,S*0.38,S*0.24,S*0.065,0,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;
  const fl=player.facing==='left';
  if(fl) ctx.scale(-1,1);

  // Legs
  ctx.fillStyle='#252018'; ctx.fillRect(-5*p,4*p,4*p,8*p+loff*p); ctx.fillRect(1*p,4*p,4*p,8*p-loff*p);
  ctx.fillStyle='#353028'; ctx.fillRect(-4*p,7*p+loff*p,2*p,2*p); ctx.fillRect(2*p,7*p-loff*p,2*p,2*p);
  // Shoes
  ctx.fillStyle='#101008'; ctx.fillRect(-7*p,12*p+loff*p,7*p,3*p); ctx.fillRect(1*p,12*p-loff*p,7*p,3*p);
  ctx.fillStyle='#282618'; ctx.fillRect(-7*p,12*p+loff*p,7*p,SCALE); ctx.fillRect(1*p,12*p-loff*p,7*p,SCALE);
  ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(-6*p,12*p+loff*p,3*p,SCALE); ctx.fillRect(2*p,12*p-loff*p,3*p,SCALE);

  // Arms
  if(atk){
    ctx.fillStyle='#506030'; ctx.fillRect(-11*p,-7*p,4*p,11*p); ctx.fillRect(7*p,-11*p,4*p,11*p);
    ctx.fillStyle='#d0a880'; ctx.fillRect(-11*p,3*p,4*p,3*p); ctx.fillRect(7*p,-11*p,4*p,3*p);
  } else {
    ctx.fillStyle='#506030'; ctx.fillRect(-9*p,-5*p+aoff*p,4*p,10*p); ctx.fillRect(5*p,-5*p-aoff*p,4*p,10*p);
    ctx.fillStyle='#d0a880'; ctx.fillRect(-9*p,4*p+aoff*p,4*p,3*p); ctx.fillRect(5*p,4*p-aoff*p,4*p,3*p);
    ctx.fillStyle='rgba(255,200,120,0.25)'; ctx.fillRect(-9*p,-5*p+aoff*p,2*p,4*p); ctx.fillRect(5*p,-5*p-aoff*p,2*p,4*p);
  }

  // Weapon
  if(player.weapon==='plunger'){
    ctx.save();
    if(atk){ctx.translate(13*p,-13*p);ctx.rotate(-0.85);}
    else ctx.translate(10*p,-4*p-aoff*p);
    ctx.fillStyle=C.plStLit; ctx.fillRect(-p,0,p,13*p);
    ctx.fillStyle=C.plSt; ctx.fillRect(0,0,p*2,13*p);
    ctx.fillStyle=C.plCpLit; ctx.fillRect(-p*3,12*p,p*6,p*2);
    ctx.fillStyle=C.plCp; ctx.fillRect(-p*3,14*p,p*6,p*3); ctx.fillRect(-p*2,14*p,p*4,p*2);
    ctx.fillStyle=C.plCpD; ctx.fillRect(-p*3,16*p,p*6,p);
    if(atk){ctx.globalAlpha=0.55;ctx.fillStyle='#ff6040';ctx.fillRect(-p*4,11*p,p*8,p*7);ctx.globalAlpha=1;}
    ctx.restore();
  }

  // Coat body
  ctx.fillStyle='#506030'; ctx.fillRect(-6*p,-8*p,12*p,13*p);
  ctx.fillStyle='#3a4a1a'; ctx.fillRect(-6*p,-8*p,3*p,6*p); ctx.fillRect(3*p,-8*p,3*p,6*p);
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(-5*p,-8*p,10*p,2*p);
  // Lapels
  ctx.fillStyle='#404828'; ctx.fillRect(-4*p,-6*p,3*p,5*p); ctx.fillRect(1*p,-6*p,3*p,5*p);
  // Shirt
  ctx.fillStyle='#8a7050'; ctx.fillRect(-1*p,-2*p,3*p,4*p);
  ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(-1*p,-2*p,3*p,2*p);
  // Belt
  ctx.fillStyle='#1a1008'; ctx.fillRect(-6*p,3*p,12*p,2*p);
  ctx.fillStyle='#c8a060'; ctx.fillRect(-p,3*p,2*p,2*p);
  ctx.fillStyle='rgba(255,255,200,0.5)'; ctx.fillRect(-p,3*p,p,SCALE);
  // Coat shadow
  ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(3*p,-8*p,3*p,13*p); ctx.fillRect(-6*p,5*p,12*p,3*p);

  // Neck
  ctx.fillStyle='#c8a070'; ctx.fillRect(-2*p,-9*p,4*p,2*p);
  // Head base
  ctx.fillStyle='#c8a070'; ctx.fillRect(-5*p,-18*p,10*p,9*p);
  ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(-5*p,-10*p,10*p,2*p);
  // Head highlight
  ctx.fillStyle='rgba(255,200,120,0.2)'; ctx.fillRect(-5*p,-18*p,10*p,3*p);

  // Hair
  ctx.fillStyle='#231a0a';
  ctx.fillRect(-5*p,-20*p,10*p,4*p);
  ctx.fillRect(-6*p,-18*p,2*p,6*p);
  ctx.fillRect(4*p,-18*p,3*p,5*p);
  ctx.fillRect(-3*p,-21*p,2*p,3*p);
  ctx.fillRect(1*p,-21*p,3*p,3*p);
  // Hair highlight
  ctx.fillStyle='rgba(80,60,20,0.4)'; ctx.fillRect(-4*p,-20*p,8*p,2*p);

  // Face
  if(player.facing==='up'){
    ctx.fillStyle='#231a0a'; ctx.fillRect(-3*p,-15*p,6*p,2*p);
  } else {
    // Eye whites
    ctx.fillStyle='#ecddc0'; ctx.fillRect(-4*p,-16*p,3*p,3*p); ctx.fillRect(1*p,-16*p,3*p,3*p);
    // Pupils
    ctx.fillStyle='#1a0a04'; ctx.fillRect(-3*p,-15*p,2*p,2*p); ctx.fillRect(1*p,-15*p,2*p,2*p);
    // Eye shine
    ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.fillRect(-3*p,-16*p,p,p); ctx.fillRect(1*p,-16*p,p,p);
    // Nose
    ctx.fillStyle='#b09070'; ctx.fillRect(-4*p,-13*p,3*p,p); ctx.fillRect(1*p,-13*p,3*p,p);
    ctx.fillStyle='#c09070'; ctx.fillRect(-p,-14*p,2*p,2*p);
    // Mouth
    ctx.fillStyle='#6a5038'; ctx.fillRect(-3*p,-12*p,2*p,p); ctx.fillRect(0,-12*p,2*p,p); ctx.fillRect(-2*p,-11*p,5*p,p);
    // Stubble
    ctx.fillStyle='rgba(40,28,12,0.25)';
    [[-4*p,-12*p],[-2*p,-11*p],[2*p,-12*p],[3*p,-11*p]].forEach(([sx,sy])=>ctx.fillRect(sx,sy,p,p));
  }
  ctx.restore();
}

function drawSlash(){
  const off={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const [ox,oy]=off[player.facing];
  const x=(player.tx+ox+0.5)*S,y=(player.ty+oy+0.5)*S,a=player.attackTimer;
  ctx.save();
  // Outer glow
  ctx.globalAlpha=a*0.4; ctx.strokeStyle='#ffaa40'; ctx.lineWidth=SCALE*6;
  ctx.beginPath(); ctx.moveTo(x-S*0.5,y-S*0.5); ctx.lineTo(x+S*0.5,y+S*0.5); ctx.stroke();
  ctx.globalAlpha=a*0.85;
  ctx.strokeStyle='#ff6020'; ctx.lineWidth=SCALE*2;
  ctx.beginPath(); ctx.moveTo(x-S*0.5,y-S*0.5); ctx.lineTo(x+S*0.5,y+S*0.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+S*0.5,y-S*0.5); ctx.lineTo(x-S*0.5,y+S*0.5); ctx.stroke();
  ctx.strokeStyle='#ffe600'; ctx.lineWidth=SCALE;
  ctx.beginPath(); ctx.moveTo(x-S*0.4,y); ctx.lineTo(x+S*0.4,y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x,y-S*0.4); ctx.lineTo(x,y+S*0.4); ctx.stroke();
  ctx.globalAlpha=1; ctx.restore();
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
  const tx2=nearObj?(nearObj.tx+nearObj.w/2)*S:11.5*S+S/2;
  const ty2=nearObj?nearObj.ty*S-SCALE*6:16*S-SCALE*6;
  let label='E',col=C.hintBg;
  if(nearObj?.isMob&&nearObj.alive&&player.weapon){label='E  ATTACK';col='#ff4040';}
  else if(nearObj?.pickable&&!player.inventory.find(i=>i.id===nearObj.itemId)) label='E  TAKE';
  else if(nearObj?.isCoin){label='E  +€1';col='#ffe600';}
  else if(nearDoor){label='WALK IN';col='#ffe600';}
  const bw=label.length>1?S*2.6:S*0.9;
  const pulse=0.82+0.18*Math.sin(Date.now()/250);
  ctx.save(); ctx.globalAlpha=pulse;
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.3)'; rRect(ctx,tx2-bw/2+SCALE,ty2-S*0.35+SCALE,bw,S*0.58,SCALE*2); ctx.fill();
  ctx.fillStyle=col; ctx.strokeStyle=C.hintTx; ctx.lineWidth=SCALE;
  rRect(ctx,tx2-bw/2,ty2-S*0.35,bw,S*0.56,SCALE*2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle=C.hintTx; ctx.font=`bold ${SCALE*4}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(label,tx2,ty2-S*0.08);
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
  uiCtx.font='bold 52px "Bebas Neue",sans-serif'; uiCtx.fillStyle='#ff2d00'; uiCtx.textAlign='center'; uiCtx.textBaseline='top'; uiCtx.fillText('YOU DIED',W/2,by+22);
  uiCtx.font='18px "Permanent Marker",cursive'; uiCtx.fillStyle='#f2e8c9';
  uiCtx.fillText('You fell into a hole.',W/2,by+90); uiCtx.fillText('The floor wasn\'t there. Classic.',W/2,by+122);
  uiCtx.strokeStyle='rgba(255,45,0,0.3)'; uiCtx.lineWidth=1; uiCtx.beginPath(); uiCtx.moveTo(bx+24,by+158); uiCtx.lineTo(bx+bw-24,by+158); uiCtx.stroke();
  uiCtx.font='14px "IBM Plex Mono",monospace'; uiCtx.fillStyle='#ffe600'; uiCtx.fillText(`💰 Saved balance: €${player.money}`,W/2,by+174);
  uiCtx.fillStyle='rgba(255,255,255,0.4)'; uiCtx.font='12px "IBM Plex Mono",monospace'; uiCtx.fillText('☠ Dignity: fully gone',W/2,by+198);
  if(deathTimer>1.5){const blk=Math.floor(Date.now()/600)%2===0;uiCtx.fillStyle=blk?'#ffe600':'rgba(255,230,0,0.4)';uiCtx.font='bold 14px "IBM Plex Mono",monospace';uiCtx.fillText('[ SPACE or CLICK to restart ]',W/2,by+246);}
  uiCtx.fillStyle='rgba(255,255,255,0.2)'; uiCtx.font='10px "IBM Plex Mono",monospace'; uiCtx.fillText('© 2025 Nobody Studios • life goes on (barely)',W/2,by+bh-18);
  uiCtx.globalAlpha=1;
  if(deathTimer>1.5&&!window._dha){
    window._dha=true;
    const restart=()=>{window._dha=false;restartGame();};
    document.addEventListener('keydown',function h(e){if(e.code==='Space'||e.key==='Enter'){document.removeEventListener('keydown',h);restart();}});
    uiCanvas.addEventListener('click',function h(){uiCanvas.removeEventListener('click',h);restart();},{once:true});
  }
}

function restartGame(){
  clearGameState();
  isDead=false;deathTimer=0;exitTriggered=false;kevinAlive=true;kevinHitTimer=0;kevinDeathTimer=-1;coinVisible=false;
  player.tx=3.0;player.ty=4.5;player.facing='down';player.frame=0;player.attackTimer=0;
  player.money=0;player.dignity=0;player.inventory=[];player.weapon=null;
  pendingPickup=null;pendingCoin=false;
  gameState='playing';dialogObj=null;dialogQueue=[];dialogIdx=0;
  if(!OBJECTS.find(o=>o.pickable&&o.itemId==='plunger')){
    OBJECTS.push({tx:17,ty:13,w:1,h:2,hx:17,hy:13,hw:1,hh:2,label:'Sacred Plunger ★',pickable:true,itemId:'plunger',
      itemName:'Sacred Plunger',itemDesc:'ATK +1 | Certified against rodents.',
      lines:['"THE plunger."','"[ E to PICK UP ]"'],
      draw(ctx){const g=0.1+0.07*Math.sin(Date.now()/400);ctx.fillStyle=`rgba(255,220,0,${g})`;ctx.fillRect(-SCALE*3,-SCALE*3,S+SCALE*6,2*S+SCALE*6);ctx.fillStyle=C.plSt;ctx.fillRect(S/2-SCALE,0,SCALE*2,2*S-SCALE*5);ctx.fillStyle=C.plCp;ctx.fillRect(SCALE*2,2*S-SCALE*6,S-SCALE*4,SCALE*5);ctx.fillRect(0,2*S-SCALE*4,S,SCALE*3);ctx.fillStyle=C.plCpD;ctx.fillRect(0,2*S-SCALE*2,S,SCALE*2);}
    });
  }
  // Write a clean state immediately so next page load doesn't restore dead Kevin etc.
  saveGameState();
  showDialog(null,['"You wake up. Again."',`"Balance: €${player.money}."`,'"Kevin is somewhere."']);
}

/* ══════ UI ══════ */
function drawUI(){uiCtx.clearRect(0,0,uiCanvas.width,uiCanvas.height);drawHUD();if(gameState==='dialog')drawDialog();if(gameState==='inventory')drawInventory();if(gameState==='paused')drawPause();}

function drawHUD(){
  const W=uiCanvas.width,pad=14;
  // HUD bar with gradient-like effect
  uiCtx.fillStyle='rgba(10,6,0,0.92)';uiCtx.fillRect(0,0,W,50);
  uiCtx.fillStyle='rgba(255,230,0,0.8)';uiCtx.fillRect(0,48,W,2);
  uiCtx.fillStyle='rgba(255,230,0,0.1)';uiCtx.fillRect(0,46,W,2);
  uiCtx.font='bold 14px "IBM Plex Mono",monospace';uiCtx.fillStyle='#ffe600';uiCtx.textBaseline='middle';
  uiCtx.textAlign='left';
  uiCtx.fillText(`💰 €${player.money}`,pad,25);
  uiCtx.fillText(`☠ DIGNITY: ${player.dignity}%`,pad+150,25);
  if(player.weapon){uiCtx.fillStyle='#ff6040';uiCtx.fillText(`⚔ ${player.inventory.find(i=>i.id===player.weapon)?.name||''}`,pad+360,25);}
  if(!kevinAlive){uiCtx.fillStyle='rgba(255,80,40,0.7)';uiCtx.font='10px "IBM Plex Mono",monospace';uiCtx.fillText('☠ Kevin: DEFEATED',pad+580,25);}
  if(tripActive){
    const trem=Math.ceil(TRIP_DURATION-tripTimer);
    uiCtx.fillStyle=`hsl(${Date.now()/20%360},80%,65%)`;
    uiCtx.font='bold 13px "IBM Plex Mono",monospace';
    uiCtx.textAlign='left';
    uiCtx.fillText(`👁 SEEING THINGS (${trem}s)`,pad+700,25);
  }
  uiCtx.textAlign='right';uiCtx.fillStyle='rgba(255,255,255,0.3)';uiCtx.font='10px "IBM Plex Mono",monospace';
  uiCtx.fillText('[E] Interact  [Q] Inventory  [ESC] Pause',W-pad,25);
}

function drawDialog(){
  if(!dialogQueue.length) return;
  const W=uiCanvas.width,H=uiCanvas.height,bh=155,bw=W-48,bx=24,by=H-bh-24;
  uiCtx.save();
  // Shadow
  uiCtx.fillStyle='rgba(0,0,0,0.5)'; uiCtx.beginPath(); uiCtx.roundRect(bx+4,by+4,bw,bh,8); uiCtx.fill();
  uiCtx.fillStyle='rgba(8,5,0,0.96)';uiCtx.strokeStyle='#ffe600';uiCtx.lineWidth=3;
  uiCtx.beginPath();uiCtx.roundRect(bx,by,bw,bh,8);uiCtx.fill();uiCtx.stroke();
  uiCtx.fillStyle='#ffe600';uiCtx.fillRect(bx+3,by+3,bw-6,3);
  uiCtx.fillStyle='rgba(255,230,0,0.04)';uiCtx.fillRect(bx+3,by+6,bw-6,bh-9);
  if(dialogObj?.label){const lw=Math.min(uiCtx.measureText(dialogObj.label).width+40,260);uiCtx.fillStyle='#ffe600';uiCtx.beginPath();uiCtx.roundRect(bx+16,by-20,lw,28,4);uiCtx.fill();uiCtx.fillStyle='#1a1200';uiCtx.font='bold 12px "IBM Plex Mono",monospace';uiCtx.textAlign='left';uiCtx.textBaseline='middle';uiCtx.fillText(dialogObj.label,bx+24,by-6);}
  uiCtx.fillStyle='#f2e8c9';uiCtx.font='17px "Permanent Marker",cursive';uiCtx.textAlign='left';uiCtx.textBaseline='top';
  wrapText(uiCtx,dialogQueue[dialogIdx]||'',bx+20,by+18,bw-48,26);
  for(let i=0;i<dialogQueue.length;i++){uiCtx.fillStyle=i===dialogIdx?'#ffe600':'rgba(255,230,0,0.2)';uiCtx.beginPath();uiCtx.arc(bx+22+i*16,by+bh-16,5,0,Math.PI*2);uiCtx.fill();}
  if(Math.floor(Date.now()/500)%2===0){uiCtx.fillStyle='#ffe600';uiCtx.font='20px monospace';uiCtx.textAlign='right';uiCtx.textBaseline='bottom';uiCtx.fillText('▶',bx+bw-14,by+bh-10);}
  uiCtx.restore();
}

function drawInventory(){
  const W=uiCanvas.width,H=uiCanvas.height,bw=Math.min(580,W-40),bh=420,bx=(W-bw)/2,by=(H-bh)/2;
  uiCtx.save();uiCtx.fillStyle='rgba(0,0,0,0.78)';uiCtx.fillRect(0,0,W,H);
  uiCtx.fillStyle='rgba(0,0,0,0.5)'; uiCtx.beginPath(); uiCtx.roundRect(bx+5,by+5,bw,bh,10); uiCtx.fill();
  uiCtx.fillStyle='#0e0800';uiCtx.strokeStyle='#ffe600';uiCtx.lineWidth=3;
  uiCtx.beginPath();uiCtx.roundRect(bx,by,bw,bh,10);uiCtx.fill();uiCtx.stroke();
  uiCtx.fillStyle='#ffe600';uiCtx.fillRect(bx+3,by+3,bw-6,3);
  uiCtx.font='bold 20px "Permanent Marker",cursive';uiCtx.textAlign='center';uiCtx.textBaseline='top';uiCtx.fillText('📦 INVENTORY OF SCHEMES',W/2,by+18);
  uiCtx.strokeStyle='rgba(255,230,0,0.2)';uiCtx.lineWidth=1;uiCtx.beginPath();uiCtx.moveTo(bx+20,by+56);uiCtx.lineTo(bx+bw-20,by+56);uiCtx.stroke();
  if(player.inventory.length===0){uiCtx.fillStyle='rgba(255,255,255,0.3)';uiCtx.font='15px "IBM Plex Mono",monospace';uiCtx.textAlign='center';uiCtx.textBaseline='middle';uiCtx.fillText('Empty. Like your fridge. And your soul.',W/2,by+bh/2);}
  else{player.inventory.forEach((item,i)=>{const iy=by+70+i*90;uiCtx.fillStyle='rgba(255,230,0,0.07)';uiCtx.strokeStyle='rgba(255,230,0,0.22)';uiCtx.lineWidth=1;uiCtx.beginPath();uiCtx.roundRect(bx+20,iy,bw-40,80,6);uiCtx.fill();uiCtx.stroke();if(item.isWeapon){uiCtx.fillStyle='#c03020';uiCtx.beginPath();uiCtx.roundRect(bx+30,iy+12,70,20,3);uiCtx.fill();uiCtx.fillStyle='#fff';uiCtx.font='bold 9px monospace';uiCtx.textAlign='center';uiCtx.textBaseline='middle';uiCtx.fillText('⚔ WEAPON',bx+65,iy+22);}uiCtx.fillStyle='#ffe600';uiCtx.font='bold 15px "Permanent Marker",cursive';uiCtx.textAlign='left';uiCtx.textBaseline='top';uiCtx.fillText(item.name,bx+108,iy+14);uiCtx.fillStyle='#c8b090';uiCtx.font='12px "IBM Plex Mono",monospace';uiCtx.fillText(item.desc,bx+108,iy+40);if(item.atk){uiCtx.fillStyle='#ff6040';uiCtx.font='bold 11px monospace';uiCtx.fillText(`ATK: +${item.atk}`,bx+32,iy+46);}});}
  uiCtx.fillStyle='#f2e8c9';uiCtx.font='12px "IBM Plex Mono",monospace';uiCtx.textAlign='left';uiCtx.textBaseline='bottom';uiCtx.fillText(`💰 €${player.money}  |  ☠ ${player.dignity}%  |  📦 ${player.inventory.length} item(s)`,bx+20,by+bh-14);
  uiCtx.fillStyle='rgba(255,230,0,0.4)';uiCtx.textAlign='right';uiCtx.fillText('[Q] Close',bx+bw-16,by+bh-14);uiCtx.restore();
}

function drawPause(){
  const W=uiCanvas.width,H=uiCanvas.height;uiCtx.save();uiCtx.fillStyle='rgba(0,0,0,0.68)';uiCtx.fillRect(0,0,W,H);
  uiCtx.fillStyle='#ffe600';uiCtx.font='bold 48px "Bebas Neue",sans-serif';uiCtx.textAlign='center';uiCtx.textBaseline='middle';uiCtx.fillText('PAUSED',W/2,H/2-24);
  uiCtx.fillStyle='rgba(255,255,255,0.4)';uiCtx.font='15px "IBM Plex Mono",monospace';uiCtx.fillText('( ESC to resume )',W/2,H/2+20);uiCtx.restore();
}

function wrapText(ctx,text,x,y,maxW,lineH){
  const words=text.split(' ');let line='',curY=y;
  for(const w of words){const t=line+w+' ';if(ctx.measureText(t).width>maxW&&line!==''){ctx.fillText(line.trim(),x,curY);line=w+' ';curY+=lineH;}else line=t;}
  if(line.trim()) ctx.fillText(line.trim(),x,curY);
}