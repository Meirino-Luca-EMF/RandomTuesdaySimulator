/* =====================================================
   CINEMATIC.JS — Dream Sequence
   Called by startGame() in Main.js
   ===================================================== */

const DREAM_SCENES = [
  {
    bg: "s1",
    emoji: "🏰",
    label: "SCENE 1 — YOUR HOME",
    title: "THE MANSION",
    sub: "47 bedrooms. You use 1.",
    narration:
      '💭 "Last night, you fell asleep on your cardboard box... and dreamed of something better."',
    floaters: ["💰", "💎", "🪙", "✨", "💛", "🏆"],
  },
  {
    bg: "s2",
    emoji: "🛥️",
    label: "SCENE 2 — YOUR COMMUTE",
    title: "THE SUPERYACHT",
    sub: 'Named "Tax Write-Off".',
    narration:
      '💭 "You owned three yachts. One was just for storing the other two."',
    floaters: ["🌊", "⚓", "🐬", "🦞", "🍾", "💸"],
  },
  {
    bg: "s3",
    emoji: "🤵",
    label: "SCENE 3 — YOUR LOOK",
    title: "THE FIT",
    sub: "Solid gold cufflinks. Obviously.",
    narration:
      '💭 "Your suit cost more than a small country GDP. You wore it to buy groceries."',
    floaters: ["👑", "💍", "💎", "🪄", "✨", "🎩"],
  },
  {
    bg: "s4",
    emoji: "🦅",
    label: "SCENE 4 — YOUR VIBE",
    title: "THE EMPIRE",
    sub: "CEO of Everything, Inc.",
    narration:
      '💭 "You had a personal eagle. For no reason. It was named Gerald."',
    floaters: ["🦅", "📈", "🏦", "💼", "🌍", "🏅"],
  },
];

let cinematicRunning = false;

function launchCinematic(onComplete) {
  if (cinematicRunning) return;
  cinematicRunning = true;

  const overlay = document.createElement("div");
  overlay.id = "cinematic";
  overlay.className = "active phase-dream";
  overlay.innerHTML = buildCinematicHTML();
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      runDreamSequence(overlay, onComplete);
    });
  });
}

function buildCinematicHTML() {
  const scenes = DREAM_SCENES.map(
    (s, i) => `
    <div class="dream-scene ${s.bg}" id="scene-${i}">
      <div class="dream-floaters" id="dfloat-${i}"></div>
      <div class="scene-content">
        <span class="scene-emoji">${s.emoji}</span>
        <div class="scene-caption">
          <span class="caption-label">${s.label}</span>
          <span class="caption-text">${s.title}</span>
          <span class="caption-sub">${s.sub}</span>
        </div>
      </div>
    </div>
  `
  ).join("");

  const dots = DREAM_SCENES.map(
    (_, i) => `<div class="prog-dot" id="dot-${i}"></div>`
  ).join("");

  return `
    <div class="lbox-top"></div>
    <div class="lbox-bot"></div>
    ${scenes}
    <div class="dream-header">✦ &nbsp; Z Z Z . . . &nbsp; ✦ &nbsp; Z Z Z . . . &nbsp; ✦ &nbsp; Z Z Z . . . &nbsp; ✦</div>
    <div class="progress-dots">${dots}</div>
    <div class="narration-tape" id="narration-tape"></div>
    <div class="flash-layer" id="flash-layer"></div>
    <div class="explosion-emojis" id="explosion-emojis"></div>
    <div id="wakeup-screen">
      <div class="wakeup-card">
        <span class="wakeup-emoji">⏰</span>
        <span class="wakeup-title">WAKE UP,<br>BROKE BOY.</span>
        <span class="wakeup-sub">It was all a dream. Obviously.</span>
        <div class="wakeup-stats">
          BANK ACCOUNT .......... -$3.47<br>
          DIGNITY ............... NOT FOUND<br>
          GERALD THE EAGLE ....... NEVER EXISTED<br>
          VIBES .................. ROCK BOTTOM
        </div>
      </div>
      <div class="wakeup-continue" id="wakeup-continue">[ Press any key or click to continue ]</div>
    </div>
  `;
}

function spawnDreamFloaters(containerId, emojis) {
  const el = document.getElementById(containerId);
  if (!el) return;
  for (let i = 0; i < 18; i++) {
    const f = document.createElement("div");
    f.className = "dream-floater";
    f.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    f.style.left = Math.random() * 100 + "%";
    f.style.animationDuration = 6 + Math.random() * 10 + "s";
    f.style.animationDelay = -Math.random() * 12 + "s";
    f.style.fontSize = 1.2 + Math.random() * 2 + "rem";
    el.appendChild(f);
  }
}

function runDreamSequence(overlay, onComplete) {
  setTimeout(() => overlay.classList.add("bars-open"), 50);

  const SCENE_DURATION = 4500;
  const NARRATION_DELAY = 800;
  const TOTAL_DREAM_TIME = DREAM_SCENES.length * SCENE_DURATION;

  let currentScene = -1;

  function showScene(idx) {
    if (currentScene >= 0) {
      document
        .getElementById("scene-" + currentScene)
        ?.classList.remove("visible");
      document.getElementById("dot-" + currentScene)?.classList.add("done");
    }
    currentScene = idx;

    const sceneEl = document.getElementById("scene-" + idx);
    const tape = document.getElementById("narration-tape");

    spawnDreamFloaters("dfloat-" + idx, DREAM_SCENES[idx].floaters);

    sceneEl.classList.add("visible");
    tape.classList.remove("visible");
    tape.textContent = "";

    setTimeout(() => {
      tape.textContent = DREAM_SCENES[idx].narration;
      tape.classList.add("visible");
    }, NARRATION_DELAY);
  }

  showScene(0);
  for (let i = 1; i < DREAM_SCENES.length; i++) {
    setTimeout(() => showScene(i), i * SCENE_DURATION);
  }

  setTimeout(() => {
    document
      .getElementById("dot-" + (DREAM_SCENES.length - 1))
      ?.classList.add("done");
  }, TOTAL_DREAM_TIME - 200);

  setTimeout(
    () => triggerExplosion(overlay, onComplete),
    TOTAL_DREAM_TIME + 400
  );
}

function triggerExplosion(overlay, onComplete) {
  const tape = document.getElementById("narration-tape");
  tape.classList.remove("visible");

  overlay.style.animation = "alarmShake 0.07s linear infinite";

  const flash = document.getElementById("flash-layer");
  flash.classList.add("bang");

  const expEl = document.getElementById("explosion-emojis");
  const expEmojis = [
    "💥",
    "🔥",
    "💣",
    "⚡",
    "🌪️",
    "😱",
    "👮",
    "📉",
    "💸",
    "🧾",
    "😤",
    "🪦",
    "💀",
    "🚔",
    "❌",
  ];
  for (let i = 0; i < 22; i++) {
    const e = document.createElement("div");
    e.className = "exp-emoji";
    e.textContent = expEmojis[Math.floor(Math.random() * expEmojis.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 200 + Math.random() * 400;
    e.style.setProperty("--dx", Math.cos(angle) * dist + "px");
    e.style.setProperty("--dy", Math.sin(angle) * dist + "px");
    e.style.setProperty("--dr", (Math.random() - 0.5) * 720 + "deg");
    e.style.left = 35 + Math.random() * 30 + "%";
    e.style.top = 35 + Math.random() * 30 + "%";
    e.style.animationDelay = Math.random() * 0.3 + "s";
    expEl.appendChild(e);
  }

  setTimeout(() => {
    flash.classList.remove("bang");
    void flash.offsetWidth;
    flash.classList.add("bang");
    overlay.style.animation = "none";
  }, 300);

  setTimeout(() => {
    overlay.style.transition = "background 0.4s ease";
    overlay.style.background = "#0A0A0A";
    expEl.innerHTML = "";
  }, 700);

  setTimeout(() => {
    const wakeup = document.getElementById("wakeup-screen");
    wakeup.classList.add("visible");

    let canContinue = false;
    setTimeout(() => {
      canContinue = true;
    }, 1200);

    function proceed() {
      if (!canContinue) return;
      canContinue = false;
      wakeup.style.transition = "opacity 0.5s";
      wakeup.style.opacity = "0";
      overlay.style.transition = "opacity 0.6s";
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
        cinematicRunning = false;
        if (typeof onComplete === "function") onComplete();
      }, 650);
    }

    document.addEventListener("keydown", proceed, { once: true });
    wakeup.addEventListener("click", proceed, { once: true });
  }, 1200);
}
