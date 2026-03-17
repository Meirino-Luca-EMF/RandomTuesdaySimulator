// ---- FLOATERS ----
const emojis = ['💸','🤑','💰','🪙','💵','🏦','🚔','🎰','🎲','🐔','🧅','🪤','📦','🔧','🧨','🪝','💎','🦜','🏚️','🚗','🤡','👮','📋','🧾','🍕','🎭','🐀','🧲','🪣','🦺'];
const floatersEl = document.getElementById('floaters');
for (let i = 0; i < 30; i++) {
  const el = document.createElement('div');
  el.className = 'floater';
  el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  el.style.left = Math.random() * 100 + '%';
  el.style.animationDuration = (8 + Math.random() * 14) + 's';
  el.style.animationDelay = (-Math.random() * 20) + 's';
  el.style.fontSize = (1 + Math.random() * 2) + 'rem';
  floatersEl.appendChild(el);
}

// ---- TITLE GLITCH (JS-driven to avoid clip-path visibility bug) ----
const titleEl = document.querySelector('.title-main');
titleEl.addEventListener('mouseenter', () => {
  titleEl.classList.remove('glitching');
  // Force reflow so animation restarts every hover
  void titleEl.offsetWidth;
  titleEl.classList.add('glitching');
});
titleEl.addEventListener('animationend', () => {
  titleEl.classList.remove('glitching');
});

// ---- MODALS ----
function openModal(name) {
  document.getElementById('modal-' + name).classList.add('open');
}
function closeModal(name) {
  document.getElementById('modal-' + name).classList.remove('open');
}
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ---- START GAME ----
const LOAD_TIPS = [
  "Calculating your desperation level...",
  "Generating local scammers...",
  "Loading plausible excuses...",
  "Corrupting the tax system...",
  "Preparing the pigeons...",
  "Simulating credibility...",
  "Calibrating the BS detector...",
  "Game ready — Good luck. You'll need it.",
];

let loadPct = 0;

function startGame() {
  const r = document.querySelector('.receipt');
  r.style.transition = 'transform 0.4s, opacity 0.4s';
  r.style.transform = 'rotate(-0.4deg) scale(1.03)';
  setTimeout(() => {
    r.style.transform = 'rotate(-0.4deg) scale(0) translateY(-40px)';
    r.style.opacity = '0';
  }, 120);
  setTimeout(() => {
    r.innerHTML = `
      <div style="text-align:center;padding:2rem 0">
        <div style="font-family:'VT323',monospace;font-size:3.5rem;color:var(--ink)">LOADING...</div>
        <div style="font-family:'Permanent Marker',cursive;font-size:1rem;color:var(--red);margin-top:1rem">Please wait while we prepare your scams</div>
        <div id="loadbar" style="margin-top:1.5rem;height:18px;border:2px solid var(--ink);background:transparent;border-radius:2px;overflow:hidden">
          <div id="loadfill" style="height:100%;width:0%;background:var(--yellow);transition:width 0.2s"></div>
        </div>
        <div id="loadtip" style="font-family:'IBM Plex Mono',monospace;font-size:0.75rem;margin-top:0.75rem;opacity:0.6">Calculating your desperation level...</div>
      </div>`;
    r.style.transform = 'rotate(-0.4deg) scale(1)';
    r.style.opacity = '1';
    loadPct = 0;
    animateLoad();
  }, 500);
}

function animateLoad() {
  const fill = document.getElementById('loadfill');
  const tip  = document.getElementById('loadtip');
  const step = () => {
    loadPct += Math.random() * 12 + 3;
    if (loadPct > 100) loadPct = 100;
    if (fill) fill.style.width = loadPct + '%';
    if (tip)  tip.textContent = LOAD_TIPS[Math.floor(loadPct / 13)] || LOAD_TIPS[LOAD_TIPS.length - 1];
    if (loadPct < 100) setTimeout(step, 200 + Math.random() * 250);
  };
  step();
}

// ---- QUIT ----
function openQuit() {
  document.getElementById('quit-overlay').classList.add('open');
}
function closeQuit() {
  document.getElementById('quit-overlay').classList.remove('open');
}
document.getElementById('quit-overlay').addEventListener('click', closeQuit);
document.addEventListener('keydown', () => {
  if (document.getElementById('quit-overlay').classList.contains('open')) {
    closeQuit();
  }
});