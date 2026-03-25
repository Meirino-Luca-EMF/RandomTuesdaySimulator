/* =====================================================
   DIALOG SYSTEM JS — Undertale-style
   FIX: Speaker (NPC) is now on the LEFT, Player on the RIGHT
   Portraits drawn on canvas, typewriter text,
   choice menus, speaker-aware layout.

   Usage:
     DialogSystem.show({
       speaker: 'DEALER',
       speakerPortrait: 'dealer',
       playerPortrait: 'normal',
       lines: [
         { text: "Psst. Hey. YOU.", expr: 'smirk' },
         { text: "Got something special.", expr: 'normal' },
       ],
       choices: [
         { label: "Buy Strange Water (€3)", value: 'buy' },
         { label: "No thanks.", value: 'decline' },
       ],
       onChoice: (value) => { ... },
       onClose:  () => { ... },
     });
   ===================================================== */

const DialogSystem = (() => {
  "use strict";

  let overlay,
    box,
    leftPortraitEl,
    rightPortraitEl,
    leftCanvas,
    rightCanvas,
    leftCtx,
    rightCtx,
    leftNametag,
    rightNametag,
    textEl,
    arrowEl,
    dotsEl,
    choicesEl,
    speakerBarFill;

  let built = false;
  let typeTimer = null;
  let charIdx = 0;
  let currentText = "";
  let lineIdx = 0;
  let config = null;
  let choiceIdx = 0;
  let mode = "idle"; // 'typing' | 'waiting' | 'choices' | 'idle'

  const PORTRAIT_W = 168;
  const PORTRAIT_H = 168;
  const P = 3;

  function build() {
    if (built) return;
    built = true;

    overlay = document.createElement("div");
    overlay.id = "dialog-overlay";
    overlay.innerHTML = `
        <div class="dlg-box">
          <div class="dlg-portrait-left" id="dlg-pl">
            <div class="dlg-nametag" id="dlg-ln">???</div>
            <canvas id="dlg-lc" width="${PORTRAIT_W}" height="${PORTRAIT_H}"></canvas>
          </div>
          <div class="dlg-middle">
            <div class="dlg-speaker-bar"><div class="dlg-speaker-bar-fill" id="dlg-sbf"></div></div>
            <div class="dlg-text" id="dlg-text"></div>
            <div class="dlg-choices" id="dlg-choices"></div>
            <div class="dlg-dots" id="dlg-dots"></div>
            <div class="dlg-arrow" id="dlg-arrow">▼</div>
          </div>
          <div class="dlg-portrait-right" id="dlg-pr">
            <div class="dlg-nametag" id="dlg-rn">YOU</div>
            <canvas id="dlg-rc" width="${PORTRAIT_W}" height="${PORTRAIT_H}"></canvas>
          </div>
        </div>`;
    document.body.appendChild(overlay);

    leftPortraitEl = document.getElementById("dlg-pl");
    rightPortraitEl = document.getElementById("dlg-pr");
    leftCanvas = document.getElementById("dlg-lc");
    rightCanvas = document.getElementById("dlg-rc");
    leftCtx = leftCanvas.getContext("2d");
    rightCtx = rightCanvas.getContext("2d");
    leftNametag = document.getElementById("dlg-ln");
    rightNametag = document.getElementById("dlg-rn");
    textEl = document.getElementById("dlg-text");
    arrowEl = document.getElementById("dlg-arrow");
    dotsEl = document.getElementById("dlg-dots");
    choicesEl = document.getElementById("dlg-choices");
    speakerBarFill = document.getElementById("dlg-sbf");

    document.addEventListener("keydown", onKey);
    overlay.addEventListener("click", onClick);
  }

  function show(cfg) {
    build();
    config = cfg;
    lineIdx = 0;
    choiceIdx = 0;
    mode = "idle";

    // LEFT = NPC/Speaker, RIGHT = Player
    leftNametag.textContent = cfg.speaker || "???";
    rightNametag.textContent = "YOU";

    // Draw portraits: speaker on LEFT, player on RIGHT
    drawPortrait(leftCtx, cfg.speakerPortrait || "unknown", "normal");
    drawPortrait(rightCtx, "player", cfg.playerPortrait || "normal");

    dotsEl.innerHTML = (cfg.lines || [])
      .map(() => `<div class="dlg-dot"></div>`)
      .join("");

    choicesEl.classList.remove("open");
    choicesEl.innerHTML = "";
    arrowEl.style.display = "block";

    overlay.classList.add("open");
    showLine(0);
  }

  function showLine(idx) {
    if (!config || !config.lines || idx >= config.lines.length) {
      if (config?.choices?.length) {
        openChoices();
      } else {
        close();
      }
      return;
    }
    lineIdx = idx;
    const line = config.lines[idx];
    currentText = typeof line === "string" ? line : line.text;
    const expr = typeof line === "object" ? line.expr : "normal";
    const speaker = typeof line === "object" ? line.speaker || "left" : "left";

    // speaker='left' or 'right' or 'player'
    // 'left' = NPC is talking (highlight left portrait)
    // 'right' or 'player' = player is talking (highlight right portrait)
    if (speaker === "right" || speaker === "player") {
      // Player is talking — update right portrait
      drawPortrait(rightCtx, "player", expr);
      speakerBarFill.style.width = "100%"; // bar goes right
    } else {
      // NPC/narrator is talking — update left portrait
      drawPortrait(leftCtx, config.speakerPortrait || "unknown", expr);
      speakerBarFill.style.width = "0%"; // bar goes left
    }

    const dots = dotsEl.querySelectorAll(".dlg-dot");
    dots.forEach((d, i) => {
      d.className =
        "dlg-dot" + (i < idx ? " done" : i === idx ? " active" : "");
    });

    charIdx = 0;
    textEl.textContent = "";
    arrowEl.style.display = "none";
    mode = "typing";
    clearTimeout(typeTimer);
    typeNext();
  }

  const CHAR_SPEED = 28;
  function typeNext() {
    if (charIdx <= currentText.length) {
      textEl.textContent = currentText.slice(0, charIdx);
      charIdx++;
      typeTimer = setTimeout(typeNext, CHAR_SPEED);
    } else {
      mode = "waiting";
      arrowEl.style.display = "block";
    }
  }

  function skipTyping() {
    clearTimeout(typeTimer);
    textEl.textContent = currentText;
    charIdx = currentText.length + 1;
    mode = "waiting";
    arrowEl.style.display = "block";
  }

  function openChoices() {
    mode = "choices";
    arrowEl.style.display = "none";
    choiceIdx = 0;
    choicesEl.innerHTML = config.choices
      .map(
        (c, i) =>
          `<div class="dlg-choice${
            i === 0 ? " selected" : ""
          }" data-idx="${i}">${c.label}</div>`
      )
      .join("");
    choicesEl.classList.add("open");
  }

  function moveChoice(dir) {
    const items = choicesEl.querySelectorAll(".dlg-choice");
    items[choiceIdx]?.classList.remove("selected");
    choiceIdx =
      (choiceIdx + dir + config.choices.length) % config.choices.length;
    items[choiceIdx]?.classList.add("selected");
  }

  function confirmChoice() {
    const chosen = config.choices[choiceIdx];
    choicesEl.classList.remove("open");
    if (config.onChoice) config.onChoice(chosen.value);
    close();
  }

  function advance() {
    if (mode === "typing") {
      skipTyping();
      return;
    }
    if (mode === "waiting") {
      showLine(lineIdx + 1);
      return;
    }
    if (mode === "choices") {
      confirmChoice();
    }
  }

  function close() {
    clearTimeout(typeTimer);
    overlay.classList.remove("open");
    mode = "idle";
    const cb = config?.onClose;
    config = null;
    if (cb) cb();
  }

  function onKey(e) {
    if (!overlay.classList.contains("open")) return;
    if (e.key.toLowerCase() === "e" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      advance();
    }
    if (mode === "choices") {
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        e.preventDefault();
        moveChoice(-1);
      }
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        moveChoice(1);
      }
    }
  }
  function onClick(e) {
    if (e.target.closest(".dlg-choice")) {
      const idx = parseInt(e.target.closest(".dlg-choice").dataset.idx);
      choiceIdx = idx;
      confirmChoice();
    } else {
      advance();
    }
  }

  function isOpen() {
    return overlay?.classList.contains("open") ?? false;
  }

  /* ══════════════════════════════════════════
       PORTRAIT DRAWING ENGINE
    ══════════════════════════════════════════ */
  function drawPortrait(ctx, key, expr) {
    ctx.clearRect(0, 0, PORTRAIT_W, PORTRAIT_H);
    const fn = PORTRAITS[key];
    if (!fn) {
      drawUnknown(ctx, expr);
      return;
    }
    fn(ctx, expr);
  }

  const PORTRAITS = {};

  /* ── PLAYER ── */
  PORTRAITS.player = function (ctx, expr) {
    const cx = PORTRAIT_W / 2,
      cy = PORTRAIT_H / 2 + 20;
    const p = P;
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = "rgba(30,20,5,0.7)";
    ctx.fillRect(-PORTRAIT_W / 2, -PORTRAIT_H / 2, PORTRAIT_W, PORTRAIT_H);

    ctx.fillStyle = "#506030";
    ctx.fillRect(-12 * p, 2 * p, 24 * p, 18 * p);
    ctx.fillStyle = "#3a4a1a";
    ctx.fillRect(-12 * p, 2 * p, 7 * p, 10 * p);
    ctx.fillRect(5 * p, 2 * p, 7 * p, 10 * p);

    ctx.fillStyle = "#c8a070";
    ctx.fillRect(-2 * p, -2 * p, 4 * p, 4 * p);

    ctx.fillStyle = "#c8a070";
    ctx.fillRect(-7 * p, -18 * p, 14 * p, 16 * p);
    ctx.fillStyle = "rgba(255,200,120,0.18)";
    ctx.fillRect(-7 * p, -18 * p, 14 * p, 4 * p);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(-7 * p, -4 * p, 14 * p, 2 * p);

    ctx.fillStyle = "#231a0a";
    ctx.fillRect(-7 * p, -22 * p, 14 * p, 7 * p);
    ctx.fillRect(-9 * p, -18 * p, 3 * p, 8 * p);
    ctx.fillRect(6 * p, -18 * p, 3 * p, 6 * p);
    ctx.fillStyle = "#3a2a10";
    ctx.fillRect(-7 * p, -18 * p, 5 * p, 3 * p);

    const eyeY = -12 * p;
    if (expr === "surprised" || expr === "scared") {
      ctx.fillStyle = "#1a0a04";
      ctx.fillRect(-5 * p, eyeY - p, 4 * p, 5 * p);
      ctx.fillRect(1 * p, eyeY - p, 4 * p, 5 * p);
      ctx.fillStyle = "#fff";
      ctx.fillRect(-5 * p, eyeY - p, 4 * p, p);
      ctx.fillRect(1 * p, eyeY - p, 4 * p, p);
    } else if (expr === "angry") {
      ctx.fillStyle = "#1a0a04";
      ctx.fillRect(-5 * p, eyeY, 4 * p, 3 * p);
      ctx.fillRect(1 * p, eyeY, 4 * p, 3 * p);
      ctx.fillStyle = "#231a0a";
      ctx.fillRect(-5 * p, eyeY - 3 * p, 4 * p, 2 * p);
      ctx.fillRect(1 * p, eyeY - 2 * p, 4 * p, 2 * p);
    } else if (expr === "happy") {
      ctx.fillStyle = "#1a0a04";
      ctx.fillRect(-5 * p, eyeY, 4 * p, 2 * p);
      ctx.fillRect(1 * p, eyeY, 4 * p, 2 * p);
      ctx.fillStyle = "rgba(255,200,120,0.4)";
      ctx.fillRect(-5 * p, eyeY + 2 * p, 4 * p, p);
      ctx.fillRect(1 * p, eyeY + 2 * p, 4 * p, p);
    } else if (expr === "sad") {
      ctx.fillStyle = "#1a0a04";
      ctx.fillRect(-5 * p, eyeY, 4 * p, 4 * p);
      ctx.fillRect(1 * p, eyeY, 4 * p, 4 * p);
      ctx.fillStyle = "#231a0a";
      ctx.fillRect(-5 * p, eyeY - 2 * p, 2 * p, 2 * p);
      ctx.fillRect(3 * p, eyeY - 3 * p, 2 * p, 2 * p);
    } else {
      ctx.fillStyle = "#ecddc0";
      ctx.fillRect(-5 * p, eyeY, 4 * p, 4 * p);
      ctx.fillRect(1 * p, eyeY, 4 * p, 4 * p);
      ctx.fillStyle = "#1a0a04";
      ctx.fillRect(-4 * p, eyeY + p, 3 * p, 3 * p);
      ctx.fillRect(1 * p, eyeY + p, 3 * p, 3 * p);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(-4 * p, eyeY + p, p, p);
      ctx.fillRect(1 * p, eyeY + p, p, p);
    }

    const mouthY = -6 * p;
    if (expr === "happy") {
      ctx.fillStyle = "#6a4820";
      ctx.fillRect(-3 * p, mouthY, 6 * p, p);
      ctx.fillRect(-4 * p, mouthY + p, 2 * p, p);
      ctx.fillRect(2 * p, mouthY + p, 2 * p, p);
    } else if (expr === "surprised") {
      ctx.fillStyle = "#3a1a08";
      ctx.beginPath();
      ctx.ellipse(0, mouthY + p, p * 2, p * 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (expr === "angry") {
      ctx.fillStyle = "#6a4820";
      ctx.fillRect(-4 * p, mouthY + p, 8 * p, p);
      ctx.fillRect(-4 * p, mouthY, 2 * p, p);
      ctx.fillRect(2 * p, mouthY, 2 * p, p);
    } else if (expr === "sad") {
      ctx.fillStyle = "#6a4820";
      ctx.fillRect(-3 * p, mouthY + p, 6 * p, p);
      ctx.fillRect(-4 * p, mouthY, 2 * p, p);
      ctx.fillRect(2 * p, mouthY, 2 * p, p);
    } else {
      ctx.fillStyle = "#b09070";
      ctx.fillRect(-3 * p, mouthY, 3 * p, p);
      ctx.fillRect(0, mouthY, 3 * p, p);
      ctx.fillStyle = "#6a5038";
      ctx.fillRect(-2 * p, mouthY + p, 5 * p, p);
    }

    ctx.restore();
  };

  /* ── DEALER ── */
  PORTRAITS.dealer = function (ctx, expr) {
    const cx = PORTRAIT_W / 2,
      cy = PORTRAIT_H / 2 + 20;
    const p = P;
    ctx.save();
    ctx.translate(cx, cy);

    const bgGrad = ctx.createRadialGradient(0, -10 * p, 0, 0, -10 * p, 35 * p);
    bgGrad.addColorStop(0, "rgba(30,5,50,0.9)");
    bgGrad.addColorStop(1, "rgba(5,0,10,0.98)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-PORTRAIT_W / 2, -PORTRAIT_H / 2, PORTRAIT_W, PORTRAIT_H);

    ctx.fillStyle = "#1e0e2e";
    ctx.fillRect(-9 * p, 0, 18 * p, 22 * p);
    ctx.fillStyle = "#2a1240";
    ctx.fillRect(-9 * p, 0, 5 * p, 12 * p);
    ctx.fillRect(4 * p, 0, 5 * p, 12 * p);
    ctx.fillStyle = "#140828";
    ctx.fillRect(-8 * p, 0, 5 * p, 7 * p);
    ctx.fillRect(3 * p, 0, 5 * p, 7 * p);

    ctx.fillStyle = "#1e0e2e";
    ctx.fillRect(-13 * p, -4 * p, 5 * p, 14 * p);
    ctx.fillRect(8 * p, -4 * p, 5 * p, 14 * p);
    ctx.fillStyle = "#c0a878";
    ctx.fillRect(-13 * p, 9 * p, 5 * p, 4 * p);
    ctx.fillRect(8 * p, 9 * p, 5 * p, 4 * p);

    ctx.save();
    ctx.translate(-16 * p, 4 * p);
    const glowAmt = 0.4 + 0.3 * Math.sin(Date.now() / 300);
    ctx.globalAlpha = glowAmt * 0.5;
    ctx.fillStyle = "#40ff80";
    ctx.beginPath();
    ctx.arc(0, 0, p * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1a6028";
    ctx.fillRect(-p * 2, -p * 6, p * 4, p * 10);
    ctx.fillStyle = "#2a8838";
    ctx.fillRect(-p * 2, -p * 6, p * 2, p * 10);
    ctx.fillStyle = "#40cc60";
    ctx.fillRect(-p * 2, -p * 6, p * 4, p * 3);
    ctx.fillStyle = "#888";
    ctx.fillRect(-p, -p * 8, p * 2, p * 2);
    ctx.restore();

    ctx.fillStyle = "#c0a878";
    ctx.fillRect(-3 * p, -3 * p, 6 * p, 4 * p);

    ctx.fillStyle = "#b89868";
    ctx.fillRect(-7 * p, -22 * p, 14 * p, 19 * p);

    ctx.fillStyle = "#0e0818";
    ctx.fillRect(-10 * p, -26 * p, 20 * p, 4 * p);
    ctx.fillRect(-6 * p, -36 * p, 12 * p, 11 * p);
    ctx.fillStyle = "#2a1848";
    ctx.fillRect(-6 * p, -36 * p, 6 * p, 11 * p);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(-7 * p, -24 * p, 14 * p, 5 * p);

    const eyeY = -16 * p;
    if (expr === "angry" || expr === "threatening") {
      ctx.fillStyle = "#0a0418";
      ctx.fillRect(-6 * p, eyeY, 5 * p, 4 * p);
      ctx.fillRect(1 * p, eyeY, 5 * p, 4 * p);
      ctx.fillStyle = "rgba(255,40,0,0.9)";
      ctx.fillRect(-5 * p, eyeY + p, 3 * p, 2 * p);
      ctx.fillRect(1 * p, eyeY + p, 3 * p, 2 * p);
      ctx.fillStyle = "#0e0818";
      ctx.fillRect(-6 * p, eyeY - 3 * p, 6 * p, 2 * p);
      ctx.fillRect(0, eyeY - 2 * p, 6 * p, 2 * p);
    } else if (expr === "smirk" || expr === "sneaky") {
      ctx.fillStyle = "#0a0418";
      ctx.fillRect(-6 * p, eyeY + p, 5 * p, 3 * p);
      ctx.fillRect(1 * p, eyeY, 5 * p, 4 * p);
      ctx.fillStyle = "rgba(80,255,120,0.9)";
      ctx.fillRect(-5 * p, eyeY + 2 * p, 3 * p, 2 * p);
      ctx.fillRect(1 * p, eyeY + p, 3 * p, 2 * p);
    } else {
      ctx.fillStyle = "#0a0418";
      ctx.fillRect(-6 * p, eyeY, 5 * p, 4 * p);
      ctx.fillRect(1 * p, eyeY, 5 * p, 4 * p);
      ctx.fillStyle = "rgba(80,255,120,0.9)";
      ctx.fillRect(-5 * p, eyeY + p, 3 * p, 2 * p);
      ctx.fillRect(2 * p, eyeY + p, 3 * p, 2 * p);
    }

    const mY = -9 * p;
    if (expr === "smirk" || expr === "sneaky") {
      ctx.fillStyle = "#6a4820";
      ctx.fillRect(-4 * p, mY, 8 * p, p);
      ctx.fillRect(2 * p, mY + p, 3 * p, p);
    } else {
      ctx.fillStyle = "#6a4820";
      ctx.fillRect(-4 * p, mY, 8 * p, p);
    }

    const qa = 0.5 + 0.5 * Math.sin(Date.now() / 500);
    ctx.globalAlpha = qa;
    ctx.fillStyle = "#ffe600";
    ctx.font = `bold ${p * 5}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("?", 0, -40 * p);
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  /* ── OLD LADY ── */
  PORTRAITS.old_lady = function (ctx, expr) {
    const cx = PORTRAIT_W / 2,
      cy = PORTRAIT_H / 2 + 10;
    const p = P;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(20,10,30,0.8)";
    ctx.fillRect(-PORTRAIT_W / 2, -PORTRAIT_H / 2, PORTRAIT_W, PORTRAIT_H);
    ctx.fillStyle = "#7a4858";
    ctx.fillRect(-10 * p, 0, 20 * p, 20 * p);
    const dots = [
      [-5, -5],
      [2, -3],
      [-2, 5],
      [6, 8],
      [-7, 10],
      [3, 15],
    ];
    for (const [dx, dy] of dots) {
      ctx.fillStyle = "#f08080";
      ctx.fillRect(dx * p, dy * p, p * 2, p * 2);
      ctx.fillStyle = "#f0c0c0";
      ctx.fillRect((dx + 1) * p, dy * p, p, p);
    }
    ctx.fillStyle = "#c8a070";
    ctx.fillRect(-3 * p, -3 * p, 6 * p, 4 * p);
    ctx.fillStyle = "#c8a070";
    ctx.fillRect(-9 * p, -22 * p, 18 * p, 20 * p);
    ctx.fillStyle = "#e8e8e0";
    ctx.fillRect(-10 * p, -28 * p, 20 * p, 10 * p);
    ctx.fillRect(-11 * p, -24 * p, 4 * p, 8 * p);
    ctx.fillRect(7 * p, -24 * p, 4 * p, 8 * p);
    ctx.fillStyle = "#d0d0c8";
    ctx.fillRect(-10 * p, -28 * p, 10 * p, 5 * p);
    ctx.strokeStyle = "#604020";
    ctx.lineWidth = p;
    ctx.strokeRect(-8 * p, -14 * p, 6 * p, 4 * p);
    ctx.strokeRect(2 * p, -14 * p, 6 * p, 4 * p);
    ctx.beginPath();
    ctx.moveTo(-2 * p, -12 * p);
    ctx.lineTo(2 * p, -12 * p);
    ctx.stroke();
    if (expr === "angry") {
      ctx.fillStyle = "#3a1a08";
      ctx.fillRect(-7 * p, -13 * p, 4 * p, 2 * p);
      ctx.fillRect(3 * p, -13 * p, 4 * p, 2 * p);
      ctx.fillStyle = "#604020";
      ctx.fillRect(-8 * p, -16 * p, 4 * p, p);
      ctx.fillRect(3 * p, -17 * p, 4 * p, p);
    } else if (expr === "suspicious") {
      ctx.fillStyle = "#3a1a08";
      ctx.fillRect(-7 * p, -13 * p, 4 * p, 2 * p);
      ctx.fillRect(3 * p, -12 * p, 4 * p, 3 * p);
    } else {
      ctx.fillStyle = "#3a1a08";
      ctx.fillRect(-7 * p, -13 * p, 4 * p, 3 * p);
      ctx.fillRect(3 * p, -13 * p, 4 * p, 3 * p);
    }
    ctx.fillStyle = "#c09060";
    ctx.fillRect(-4 * p, -7 * p, 8 * p, p);
    ctx.restore();
  };

  /* ── COP ── */
  PORTRAITS.cop = function (ctx, expr) {
    const cx = PORTRAIT_W / 2,
      cy = PORTRAIT_H / 2 + 20;
    const p = P;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(5,10,25,0.9)";
    ctx.fillRect(-PORTRAIT_W / 2, -PORTRAIT_H / 2, PORTRAIT_W, PORTRAIT_H);
    ctx.fillStyle = "#1a2848";
    ctx.fillRect(-11 * p, 0, 22 * p, 20 * p);
    ctx.fillStyle = "#141e38";
    ctx.fillRect(-11 * p, 0, 5 * p, 12 * p);
    ctx.fillRect(6 * p, 0, 5 * p, 12 * p);
    ctx.fillStyle = "#c8a030";
    ctx.fillRect(-2 * p, 2 * p, 4 * p, 5 * p);
    ctx.fillStyle = "#1a2848";
    ctx.fillRect(-15 * p, -2 * p, 5 * p, 14 * p);
    ctx.fillRect(10 * p, -2 * p, 5 * p, 14 * p);
    ctx.fillStyle = "#d0a880";
    ctx.fillRect(-3 * p, -4 * p, 6 * p, 5 * p);
    ctx.fillStyle = "#d0a880";
    ctx.fillRect(-7 * p, -22 * p, 14 * p, 18 * p);
    ctx.fillStyle = "#1a2848";
    ctx.fillRect(-10 * p, -28 * p, 20 * p, 3 * p);
    ctx.fillRect(-6 * p, -36 * p, 12 * p, 9 * p);
    ctx.fillStyle = "#c8a030";
    ctx.fillRect(-6 * p, -28 * p, 12 * p, p);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(-7 * p, -25 * p, 14 * p, 5 * p);
    const eyeY = -15 * p;
    if (expr === "suspicious" || expr === "angry") {
      ctx.fillStyle = "#2a1808";
      ctx.fillRect(-5 * p, eyeY, 4 * p, 3 * p);
      ctx.fillRect(1 * p, eyeY, 4 * p, 3 * p);
      ctx.fillStyle = "#2a1808";
      ctx.fillRect(-5 * p, eyeY - 3 * p, 5 * p, 2 * p);
      ctx.fillRect(0, eyeY - 2 * p, 5 * p, 2 * p);
    } else {
      ctx.fillStyle = "#2a1808";
      ctx.fillRect(-5 * p, eyeY, 4 * p, 4 * p);
      ctx.fillRect(1 * p, eyeY, 4 * p, 4 * p);
    }
    ctx.fillStyle = "#3a2a18";
    ctx.fillRect(-5 * p, -9 * p, 10 * p, 3 * p);
    ctx.fillStyle = "#7a5030";
    ctx.fillRect(-3 * p, -6 * p, 6 * p, p);
    ctx.restore();
  };

  /* ── HOMELESS GUY ── */
  PORTRAITS.homeless = function (ctx, expr) {
    const cx = PORTRAIT_W / 2,
      cy = PORTRAIT_H / 2 + 15;
    const p = P;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(15,10,5,0.9)";
    ctx.fillRect(-PORTRAIT_W / 2, -PORTRAIT_H / 2, PORTRAIT_W, PORTRAIT_H);
    ctx.fillStyle = "#4a3820";
    ctx.fillRect(-9 * p, 0, 18 * p, 20 * p);
    ctx.fillStyle = "#3a2810";
    ctx.fillRect(-9 * p, 0, 4 * p, 14 * p);
    ctx.fillRect(5 * p, 0, 4 * p, 14 * p);
    ctx.fillStyle = "#4a3820";
    ctx.fillRect(-13 * p, -3 * p, 5 * p, 14 * p);
    ctx.fillRect(8 * p, -3 * p, 5 * p, 14 * p);
    ctx.fillStyle = "#c0a060";
    ctx.fillRect(-13 * p, 10 * p, 5 * p, 4 * p);
    ctx.fillRect(8 * p, 10 * p, 5 * p, 4 * p);
    ctx.fillStyle = "#b89050";
    ctx.fillRect(-2 * p, -4 * p, 5 * p, 5 * p);
    ctx.fillStyle = "#b89050";
    ctx.fillRect(-8 * p, -22 * p, 16 * p, 18 * p);
    ctx.fillStyle = "#3a2a10";
    ctx.fillRect(-9 * p, -26 * p, 18 * p, 8 * p);
    for (let sx = -7; sx <= 6; sx += 2)
      for (let sy = -12; sy <= -7; sy += 2) {
        ctx.fillStyle = "rgba(50,35,15,0.5)";
        ctx.fillRect(sx * p, sy * p, p, p);
      }
    const eyeY = -14 * p;
    if (expr === "sad") {
      ctx.fillStyle = "#2a1a08";
      ctx.fillRect(-5 * p, eyeY, 4 * p, 3 * p);
      ctx.fillRect(1 * p, eyeY, 4 * p, 3 * p);
      ctx.fillStyle = "#3a2a10";
      ctx.fillRect(-5 * p, eyeY - 3 * p, 2 * p, 2 * p);
      ctx.fillRect(3 * p, eyeY - 3 * p, 2 * p, 2 * p);
    } else {
      ctx.fillStyle = "#2a1a08";
      ctx.fillRect(-5 * p, eyeY, 4 * p, 4 * p);
      ctx.fillRect(1 * p, eyeY, 4 * p, 4 * p);
    }
    if (expr === "sad") {
      ctx.fillStyle = "#7a5030";
      ctx.fillRect(-3 * p, -8 * p, 6 * p, p);
      ctx.fillRect(-4 * p, -7 * p, 2 * p, p);
      ctx.fillRect(2 * p, -7 * p, 2 * p, p);
    } else {
      ctx.fillStyle = "#7a5030";
      ctx.fillRect(-3 * p, -8 * p, 6 * p, p);
    }
    ctx.restore();
  };

  /* ── BOUNCER ── */
  PORTRAITS.bouncer = function (ctx, expr) {
    const cx = 168 / 2,
      cy = 168 / 2 + 20,
      p = 3;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(5,0,12,0.95)";
    ctx.fillRect(-84, -84, 168, 168);
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(-11 * p, -20 * p, 22 * p, 28 * p);
    ctx.fillStyle = "rgba(255,64,192,0.05)";
    ctx.fillRect(-11 * p, -20 * p, 22 * p, 28 * p);
    ctx.fillStyle = "#050508";
    ctx.fillRect(-11 * p, -20 * p, 6 * p, 15 * p);
    ctx.fillRect(5 * p, -20 * p, 6 * p, 15 * p);
    ctx.fillStyle = "#ff2850";
    ctx.fillRect(-p, -20 * p, 2 * p, 14 * p);
    ctx.fillRect(-2 * p, -6 * p, 4 * p, 3 * p);
    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect(-12 * p, -10 * p, 2 * p, 3 * p);
    ctx.fillStyle = "#c8a070";
    ctx.fillRect(-4 * p, -22 * p, 8 * p, 4 * p);
    ctx.fillStyle = "#c8a070";
    ctx.fillRect(-8 * p, -37 * p, 16 * p, 16 * p);
    ctx.fillStyle = "#1a1008";
    ctx.fillRect(-8 * p, -42 * p, 16 * p, 7 * p);
    if (expr === "angry") {
      ctx.fillStyle = "#1a0a04";
      ctx.fillRect(-6 * p, -30 * p, 5 * p, 3 * p);
      ctx.fillRect(p, -30 * p, 5 * p, 3 * p);
      ctx.fillStyle = "#604030";
      ctx.fillRect(-5 * p, -29 * p, 3 * p, 2 * p);
      ctx.fillRect(2 * p, -29 * p, 3 * p, 2 * p);
      ctx.fillStyle = "#1a0808";
      ctx.fillRect(-6 * p, -33 * p, 6 * p, 2 * p);
      ctx.fillRect(0, -32 * p, 6 * p, 2 * p);
    } else {
      ctx.fillStyle = "#1a0a04";
      ctx.fillRect(-6 * p, -30 * p, 5 * p, 4 * p);
      ctx.fillRect(p, -30 * p, 5 * p, 4 * p);
      ctx.fillStyle = "#604030";
      ctx.fillRect(-5 * p, -29 * p, 3 * p, 2 * p);
      ctx.fillRect(2 * p, -29 * p, 3 * p, 2 * p);
    }
    ctx.fillStyle = "#8a6040";
    ctx.fillRect(-4 * p, -24 * p, 8 * p, p);
    ctx.restore();
  };

  /* ── PAWN ── */
  PORTRAITS.pawn = function (ctx, expr) {
    const cx = 168 / 2,
      cy = 168 / 2 + 18,
      p = 3;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(20,10,5,0.85)";
    ctx.fillRect(-84, -84, 168, 168);
    ctx.fillStyle = "#3a2828";
    ctx.fillRect(-9 * p, -4 * p, 18 * p, 20 * p);
    ctx.fillStyle = "#c8b070";
    ctx.fillRect(-7 * p, -4 * p, 14 * p, 18 * p);
    ctx.fillStyle = "#a89050";
    ctx.fillRect(-7 * p, -4 * p, 4 * p, 10 * p);
    ctx.fillStyle = "rgba(80,40,20,0.5)";
    ctx.fillRect(-2 * p, 0, 3 * p, 3 * p);
    ctx.fillRect(3 * p, 5 * p, 2 * p, 2 * p);
    ctx.fillStyle = "#c8a070";
    ctx.fillRect(-3 * p, -6 * p, 6 * p, 3 * p);
    ctx.fillStyle = "#c8a070";
    ctx.fillRect(-8 * p, -20 * p, 16 * p, 14 * p);
    ctx.fillStyle = "#2a1a08";
    ctx.fillRect(-8 * p, -24 * p, 6 * p, 7 * p);
    ctx.fillRect(2 * p, -24 * p, 6 * p, 7 * p);
    ctx.fillStyle = "#1a0808";
    ctx.fillRect(-5 * p, -10 * p, 10 * p, 2 * p);
    if (expr === "angry") {
      ctx.fillStyle = "#1a0a04";
      ctx.fillRect(-6 * p, -16 * p, 5 * p, 3 * p);
      ctx.fillRect(p, -16 * p, 5 * p, 3 * p);
      ctx.fillStyle = "#1a0808";
      ctx.fillRect(-6 * p, -19 * p, 6 * p, 2 * p);
      ctx.fillRect(0, -18 * p, 6 * p, 2 * p);
    } else {
      ctx.fillStyle = "#1a0a04";
      ctx.fillRect(-6 * p, -16 * p, 5 * p, 4 * p);
      ctx.fillRect(p, -16 * p, 5 * p, 4 * p);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(-5 * p, -16 * p, p, p);
      ctx.fillRect(2 * p, -16 * p, p, p);
    }
    ctx.fillStyle = "#c8a070";
    ctx.fillRect(-3 * p, -8 * p, 6 * p, p);
    const gt = 0.5 + 0.5 * Math.sin(Date.now() / 300);
    ctx.globalAlpha = gt;
    ctx.fillStyle = "#f0c020";
    ctx.fillRect(p, -8 * p, p, p);
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  /* ── BARTENDER ── */
  PORTRAITS.bartender = function (ctx, expr) {
    const cx = 168 / 2,
      cy = 168 / 2 + 16,
      p = 3;
    ctx.save();
    ctx.translate(cx, cy);
    const bg = ctx.createLinearGradient(0, -84, 0, 84);
    bg.addColorStop(0, "rgba(20,5,30,0.95)");
    bg.addColorStop(1, "rgba(40,5,15,0.98)");
    ctx.fillStyle = bg;
    ctx.fillRect(-84, -84, 168, 168);
    ctx.globalAlpha = 0.12 + 0.08 * Math.sin(Date.now() / 700);
    ctx.fillStyle = "#ff2850";
    ctx.fillRect(-84, -84, 168, 168);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#3a1828";
    ctx.fillRect(-9 * p, -4 * p, 18 * p, 20 * p);
    ctx.fillStyle = "#2a1a30";
    ctx.fillRect(-7 * p, -16 * p, 14 * p, 14 * p);
    ctx.fillStyle = "#c0c0b0";
    ctx.fillRect(7 * p, -1 * p, 8 * p, 4 * p);
    ctx.fillStyle = "#c0a070";
    ctx.fillRect(-2 * p, -18 * p, 4 * p, 3 * p);
    ctx.fillStyle = "#c0a070";
    ctx.fillRect(-7 * p, -32 * p, 14 * p, 14 * p);
    ctx.fillStyle = "#1a1020";
    ctx.fillRect(-8 * p, -38 * p, 16 * p, 9 * p);
    ctx.fillRect(-9 * p, -35 * p, 3 * p, 5 * p);
    ctx.fillStyle = "#8020c0";
    ctx.fillRect(2 * p, -38 * p, 5 * p, 8 * p);
    ctx.fillStyle = "#0a0610";
    ctx.fillRect(-5 * p, -27 * p, 4 * p, 4 * p);
    ctx.fillRect(p, -27 * p, 4 * p, 4 * p);
    ctx.fillStyle = "#8020c0";
    ctx.fillRect(-6 * p, -24 * p, 6 * p, p);
    ctx.fillRect(0, -24 * p, 6 * p, p);
    ctx.fillStyle = "#6a3848";
    ctx.fillRect(-4 * p, -26 * p, 2 * p, 3 * p);
    ctx.fillRect(2 * p, -26 * p, 2 * p, 3 * p);
    if (expr === "smirk") {
      ctx.fillStyle = "#c02030";
      ctx.fillRect(-3 * p, -21 * p, 6 * p, 2 * p);
      ctx.fillRect(2 * p, -20 * p, 2 * p, p);
    } else {
      ctx.fillStyle = "#c02030";
      ctx.fillRect(-3 * p, -21 * p, 6 * p, 2 * p);
    }
    ctx.fillStyle = "#8020c0";
    ctx.fillRect(-9 * p, -28 * p, 2 * p, 3 * p);
    ctx.fillRect(7 * p, -28 * p, 2 * p, 3 * p);
    ctx.restore();
  };

  /* ── LOANSHARK ── */
  PORTRAITS.loanshark = function (ctx, expr) {
    const cx = 168 / 2,
      cy = 168 / 2 + 18,
      p = 3;
    ctx.save();
    ctx.translate(cx, cy);
    const bg = ctx.createLinearGradient(0, -84, 0, 84);
    bg.addColorStop(0, "rgba(5,5,20,0.98)");
    bg.addColorStop(1, "rgba(10,8,25,0.98)");
    ctx.fillStyle = bg;
    ctx.fillRect(-84, -84, 168, 168);
    ctx.globalAlpha = 0.08 + 0.05 * Math.sin(Date.now() / 600);
    ctx.fillStyle = "#4050ff";
    ctx.fillRect(-84, -84, 168, 168);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#181828";
    ctx.fillRect(-9 * p, -16 * p, 18 * p, 24 * p);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let sx = -9; sx < 9; sx += 3) ctx.fillRect(sx * p, -16 * p, p, 24 * p);
    ctx.fillStyle = "#0e0e1e";
    ctx.fillRect(-9 * p, -16 * p, 5 * p, 12 * p);
    ctx.fillRect(4 * p, -16 * p, 5 * p, 12 * p);
    ctx.fillStyle = "#e0e0e8";
    ctx.fillRect(-3 * p, -16 * p, 6 * p, 12 * p);
    ctx.fillStyle = "#c02020";
    ctx.fillRect(-p, -16 * p, 2 * p, 12 * p);
    ctx.fillStyle = "#d0a888";
    ctx.fillRect(-3 * p, -18 * p, 6 * p, 3 * p);
    ctx.fillStyle = "#d0a888";
    ctx.fillRect(-7 * p, -32 * p, 14 * p, 14 * p);
    ctx.fillStyle = "#0a0810";
    ctx.fillRect(-7 * p, -38 * p, 14 * p, 8 * p);
    if (expr === "threatening" || expr === "angry") {
      ctx.fillStyle = "#1a1428";
      ctx.fillRect(-6 * p, -26 * p, 5 * p, 3 * p);
      ctx.fillRect(p, -26 * p, 5 * p, 3 * p);
      ctx.fillStyle = "#ff2020";
      ctx.fillRect(-5 * p, -25 * p, 3 * p, 2 * p);
      ctx.fillRect(2 * p, -25 * p, 3 * p, 2 * p);
    } else {
      ctx.fillStyle = "#1a1428";
      ctx.fillRect(-6 * p, -26 * p, 5 * p, 4 * p);
      ctx.fillRect(p, -26 * p, 5 * p, 4 * p);
      ctx.fillStyle = "#4a3868";
      ctx.fillRect(-5 * p, -25 * p, 3 * p, 2 * p);
      ctx.fillRect(2 * p, -25 * p, 3 * p, 2 * p);
    }
    ctx.strokeStyle = "rgba(200,80,60,0.6)";
    ctx.lineWidth = p * 0.8;
    ctx.beginPath();
    ctx.moveTo(-4 * p, -25 * p);
    ctx.lineTo(-6 * p, -21 * p);
    ctx.stroke();
    ctx.fillStyle = "#9a6848";
    ctx.fillRect(-3 * p, -21 * p, 7 * p, p);
    ctx.fillRect(2 * p, -20 * p, 2 * p, p);
    ctx.fillStyle = "#f0c020";
    ctx.fillRect(8 * p, 1 * p, 2 * p, 2 * p);
    ctx.restore();
  };

  /* ── GAMBLER ── */
  PORTRAITS.gambler = function (ctx, expr) {
    const cx = 168 / 2,
      cy = 168 / 2 + 16,
      p = 3;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(15,8,5,0.9)";
    ctx.fillRect(-84, -84, 168, 168);
    ctx.fillStyle = "#d8c090";
    ctx.fillRect(-9 * p, -14 * p, 18 * p, 22 * p);
    ctx.fillStyle = "#c04020";
    ctx.fillRect(-p, -14 * p, 2 * p, 12 * p);
    ctx.fillStyle = "#c8a870";
    ctx.fillRect(-3 * p, -16 * p, 6 * p, 3 * p);
    ctx.save();
    ctx.rotate(-0.08);
    ctx.fillStyle = "#c8a870";
    ctx.fillRect(-7 * p, -30 * p, 14 * p, 14 * p);
    ctx.fillStyle = "#4a3010";
    ctx.fillRect(-8 * p, -36 * p, 16 * p, 8 * p);
    if (expr === "happy") {
      ctx.fillStyle = "#2a1808";
      ctx.fillRect(-5 * p, -24 * p, 4 * p, 3 * p);
      ctx.fillRect(p, -24 * p, 4 * p, 2 * p);
    } else {
      ctx.fillStyle = "#2a1808";
      ctx.fillRect(-5 * p, -24 * p, 4 * p, 4 * p);
      ctx.fillRect(p, -24 * p, 4 * p, 3 * p);
    }
    ctx.fillStyle = "rgba(255,100,80,0.25)";
    ctx.fillRect(-5 * p, -24 * p, 4 * p, 4 * p);
    ctx.fillRect(p, -24 * p, 4 * p, 3 * p);
    ctx.fillStyle = "#7a5028";
    ctx.fillRect(-5 * p, -19 * p, 10 * p, 2 * p);
    ctx.fillRect(-6 * p, -18 * p, 2 * p, p);
    ctx.fillRect(4 * p, -18 * p, 2 * p, p);
    ctx.restore();
    ctx.restore();
  };

  /* ── SHADOW ── */
  PORTRAITS.shadow = function (ctx, expr) {
    const cx = 168 / 2,
      cy = 168 / 2 + 16,
      p = 3;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(2,1,5,0.98)";
    ctx.fillRect(-84, -84, 168, 168);
    const t = Date.now();
    const flicker = 0.6 + 0.4 * Math.sin(t / 250);
    ctx.globalAlpha = flicker;
    ctx.fillStyle = "#030208";
    ctx.fillRect(-10 * p, -38 * p, 20 * p, 52 * p);
    ctx.fillStyle = "rgba(120,50,255,0.3)";
    ctx.fillRect(-10 * p, -38 * p, 2 * p, 52 * p);
    ctx.fillRect(8 * p, -38 * p, 2 * p, 52 * p);
    ctx.fillRect(-10 * p, -38 * p, 20 * p, 2 * p);
    const eg = 0.7 + 0.3 * Math.sin(t / 350);
    ctx.globalAlpha = eg;
    ctx.fillStyle = "rgba(160,80,255,0.95)";
    ctx.fillRect(-3 * p, -24 * p, 2 * p, 2 * p);
    ctx.fillRect(p, -24 * p, 2 * p, 2 * p);
    for (let i = 0; i < 6; i++) {
      const ox = Math.sin(t / 500 + i * 0.9) * 3 * p;
      const oy = (Math.cos(t / 400 + i * 1.2) * 2 - i * 2.5) * p;
      ctx.globalAlpha = 0.05 * Math.abs(Math.sin(t / 600 + i));
      ctx.fillStyle = "#6020a0";
      ctx.fillRect(-10 * p + ox, -38 * p + oy, 20 * p, 4 * p);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  /* ── UNKNOWN / PLACEHOLDER ── */
  function drawUnknown(ctx, expr) {
    const cx = PORTRAIT_W / 2,
      cy = PORTRAIT_H / 2;
    ctx.save();
    ctx.fillStyle = "rgba(20,10,5,0.9)";
    ctx.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H);
    ctx.fillStyle = "rgba(255,230,0,0.25)";
    ctx.font = `bold ${P * 12}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", cx, cy);
    ctx.restore();
  }

  return { show, close, isOpen, drawPortrait, PORTRAITS };
})();
