/* =====================================================
   MAIN.JS — Random Tuesday Simulator
   ===================================================== */

// ---- COCONUT GUARD ----
(function coconutGuard() {
  const img = new Image();
  img.onload = function () {
    // coconut exists → boot the app
    initApp();
  };
  img.onerror = function () {
    // coconut missing → nuke everything
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    document.body.style.cssText =
      "margin:0;background:#0a0a0a;display:flex;align-items:center;" +
      "justify-content:center;height:100vh;flex-direction:column;gap:1.5rem;" +
      "font-family:monospace;";
    document.body.innerHTML =
      '<div style="font-size:5rem;animation:spin 2s linear infinite;">🥥</div>' +
      '<div style="color:#ff2d00;font-size:2rem;text-align:center;text-shadow:3px 3px 0 #000;">' +
      "COCONUT.JPG NOT FOUND<br>" +
      '<span style="font-size:1rem;color:#ffe600;display:block;margin-top:.5rem">' +
      "The simulator cannot run without the sacred coconut." +
      "</span>" +
      "</div>" +
      '<div style="color:rgba(255,255,255,.3);font-size:.75rem;letter-spacing:.15em;">' +
      "[ RESTORE Coconut.jpg TO RESUME ]" +
      "</div>" +
      "<style>" +
      "@keyframes spin{to{transform:rotate(360deg)}}" +
      "@keyframes blink{50%{opacity:0}}" +
      "</style>";
  };
  // cache-bust so removal is detected immediately on reload
  img.src = "../../Coconut.jpg?_cb=" + Date.now();
})();

// ---- APP BOOT ----
function initApp() {
  // ---- FLOATERS ----
  const emojis = [
    "💸",
    "🤑",
    "💰",
    "🪙",
    "💵",
    "🏦",
    "🚔",
    "🎰",
    "🎲",
    "🐔",
    "🧅",
    "🪤",
    "📦",
    "🔧",
    "🧨",
    "🪝",
    "💎",
    "🦜",
    "🏚️",
    "🚗",
    "🤡",
    "👮",
    "📋",
    "🧾",
    "🍕",
    "🎭",
    "🐀",
    "🧲",
    "🪣",
    "🦺",
  ];
  const floatersEl = document.getElementById("floaters");
  if (floatersEl) {
    for (let i = 0; i < 30; i++) {
      const el = document.createElement("div");
      el.className = "floater";
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = Math.random() * 100 + "%";
      el.style.animationDuration = 8 + Math.random() * 14 + "s";
      el.style.animationDelay = -Math.random() * 20 + "s";
      el.style.fontSize = 1 + Math.random() * 2 + "rem";
      el.style.userSelect = "none";
      floatersEl.appendChild(el);
    }
  }

  // ---- TITLE GLITCH ----
  const titleEl = document.querySelector(".title-main");
  if (titleEl) {
    titleEl.addEventListener("mouseenter", () => {
      titleEl.classList.remove("glitching");
      void titleEl.offsetWidth;
      titleEl.classList.add("glitching");
    });
    titleEl.addEventListener("animationend", () =>
      titleEl.classList.remove("glitching")
    );
  }

  // ---- MODALS ----
  window.openModal = function (name) {
    document.getElementById("modal-" + name).classList.add("open");
  };
  window.closeModal = function (name) {
    document.getElementById("modal-" + name).classList.remove("open");
  };
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });

  // ---- START GAME ----
  window.startGame = function () {
    const r = document.querySelector(".receipt");
    if (r) {
      r.style.transition = "transform 0.35s ease, opacity 0.35s ease";
      r.style.transform = "rotate(-0.4deg) scale(0.9) translateY(-30px)";
      r.style.opacity = "0";
    }
    setTimeout(() => {
      launchCinematic(() => {
        // hide title screen layers
        document.querySelector(".screen")?.remove();
        document.querySelector(".tape-top")?.remove();
        document.querySelector(".tape-bottom")?.remove();
        // launch game world
        startWorld(true); // fresh=true wipes any previous save
      });
    }, 400);
  };

  // ---- QUIT ----
  window.openQuit = function () {
    document.getElementById("quit-overlay").classList.add("open");
  };
  window.closeQuit = function () {
    document.getElementById("quit-overlay").classList.remove("open");
  };
  const quitOverlay = document.getElementById("quit-overlay");
  if (quitOverlay) {
    quitOverlay.addEventListener("click", closeQuit);
  }
  document.addEventListener("keydown", () => {
    if (document.getElementById("quit-overlay")?.classList.contains("open"))
      closeQuit();
  });
}
