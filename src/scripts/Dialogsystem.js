/* =====================================================
   DIALOG SYSTEM JS — Undertale-style
   Portraits drawn on canvas, typewriter text,
   choice menus, speaker-aware layout.

   Usage:
     DialogSystem.show({
       speaker: 'DEALER',           // right-side NPC name
       speakerPortrait: 'dealer',   // key into PORTRAITS
       playerPortrait: 'player',    // player expression
       lines: [
         { text: "Psst. Hey. YOU.", expr: 'smirk' },
         { text: "Got something special.", expr: 'normal' },
       ],
       choices: [                   // optional — shown after last line
         { label: "Buy Strange Water (€3)", value: 'buy' },
         { label: "No thanks, I'm already broke.", value: 'decline' },
       ],
       onChoice: (value) => { ... },
       onClose:  () => { ... },
     });
   ===================================================== */

   const DialogSystem = (() => {
    'use strict';
  
    /* ── DOM ── */
    let overlay, box, leftPortraitEl, rightPortraitEl,
        leftCanvas, rightCanvas, leftCtx, rightCtx,
        leftNametag, rightNametag,
        textEl, arrowEl, dotsEl, choicesEl, speakerBarFill;
  
    let built = false;
    let typeTimer = null;
    let charIdx = 0;
    let currentText = '';
    let lineIdx = 0;
    let config = null;
    let choiceIdx = 0;
    let mode = 'idle'; // 'typing' | 'waiting' | 'choices' | 'idle'
  
    const PORTRAIT_W = 168;
    const PORTRAIT_H = 168;
    const P = 3; // pixel scale
  
    /* ── BUILD DOM ── */
    function build() {
      if (built) return;
      built = true;
  
      overlay = document.createElement('div');
      overlay.id = 'dialog-overlay';
      overlay.innerHTML = `
        <div class="dlg-box">
          <div class="dlg-portrait-left" id="dlg-pl">
            <div class="dlg-nametag" id="dlg-ln">YOU</div>
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
            <div class="dlg-nametag" id="dlg-rn">???</div>
            <canvas id="dlg-rc" width="${PORTRAIT_W}" height="${PORTRAIT_H}"></canvas>
          </div>
        </div>`;
      document.body.appendChild(overlay);
  
      leftPortraitEl  = document.getElementById('dlg-pl');
      rightPortraitEl = document.getElementById('dlg-pr');
      leftCanvas  = document.getElementById('dlg-lc');
      rightCanvas = document.getElementById('dlg-rc');
      leftCtx  = leftCanvas.getContext('2d');
      rightCtx = rightCanvas.getContext('2d');
      leftNametag  = document.getElementById('dlg-ln');
      rightNametag = document.getElementById('dlg-rn');
      textEl       = document.getElementById('dlg-text');
      arrowEl      = document.getElementById('dlg-arrow');
      dotsEl       = document.getElementById('dlg-dots');
      choicesEl    = document.getElementById('dlg-choices');
      speakerBarFill = document.getElementById('dlg-sbf');
  
      document.addEventListener('keydown', onKey);
      overlay.addEventListener('click', onClick);
    }
  
    /* ── SHOW ── */
    function show(cfg) {
      build();
      config = cfg;
      lineIdx = 0;
      choiceIdx = 0;
      mode = 'idle';
  
      // Nametags
      leftNametag.textContent = 'YOU';
      rightNametag.textContent = cfg.speaker || '???';
  
      // Draw portraits
      drawPortrait(leftCtx,  'player',  cfg.playerPortrait || 'normal');
      drawPortrait(rightCtx, cfg.speakerPortrait || 'unknown', 'normal');
  
      // Build dots
      dotsEl.innerHTML = (cfg.lines || []).map(() => `<div class="dlg-dot"></div>`).join('');
  
      // Hide choices
      choicesEl.classList.remove('open');
      choicesEl.innerHTML = '';
      arrowEl.style.display = 'block';
  
      overlay.classList.add('open');
      showLine(0);
    }
  
    /* ── LINE ── */
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
      currentText = typeof line === 'string' ? line : line.text;
      const expr   = typeof line === 'object' ? line.expr : 'normal';
      const speaker = typeof line === 'object' ? (line.speaker || 'right') : 'right';
  
      // Update portrait expression
      if (speaker === 'left' || speaker === 'player') {
        drawPortrait(leftCtx, 'player', expr);
        speakerBarFill.style.width = '0%';
      } else {
        drawPortrait(rightCtx, config.speakerPortrait || 'unknown', expr);
        speakerBarFill.style.width = '100%';
      }
  
      // Dots
      const dots = dotsEl.querySelectorAll('.dlg-dot');
      dots.forEach((d, i) => {
        d.className = 'dlg-dot' + (i < idx ? ' done' : i === idx ? ' active' : '');
      });
  
      // Typewriter
      charIdx = 0;
      textEl.textContent = '';
      arrowEl.style.display = 'none';
      mode = 'typing';
      clearTimeout(typeTimer);
      typeNext();
    }
  
    const CHAR_SPEED = 28; // ms per char
    function typeNext() {
      if (charIdx <= currentText.length) {
        textEl.textContent = currentText.slice(0, charIdx);
        charIdx++;
        typeTimer = setTimeout(typeNext, CHAR_SPEED);
      } else {
        mode = 'waiting';
        arrowEl.style.display = 'block';
      }
    }
  
    function skipTyping() {
      clearTimeout(typeTimer);
      textEl.textContent = currentText;
      charIdx = currentText.length + 1;
      mode = 'waiting';
      arrowEl.style.display = 'block';
    }
  
    /* ── CHOICES ── */
    function openChoices() {
      mode = 'choices';
      arrowEl.style.display = 'none';
      choiceIdx = 0;
      choicesEl.innerHTML = config.choices.map((c, i) =>
        `<div class="dlg-choice${i === 0 ? ' selected' : ''}" data-idx="${i}">${c.label}</div>`
      ).join('');
      choicesEl.classList.add('open');
    }
  
    function moveChoice(dir) {
      const items = choicesEl.querySelectorAll('.dlg-choice');
      items[choiceIdx]?.classList.remove('selected');
      choiceIdx = (choiceIdx + dir + config.choices.length) % config.choices.length;
      items[choiceIdx]?.classList.add('selected');
    }
  
    function confirmChoice() {
      const chosen = config.choices[choiceIdx];
      choicesEl.classList.remove('open');
      if (config.onChoice) config.onChoice(chosen.value);
      close();
    }
  
    /* ── ADVANCE ── */
    function advance() {
      if (mode === 'typing') {
        skipTyping();
        return;
      }
      if (mode === 'waiting') {
        showLine(lineIdx + 1);
        return;
      }
      if (mode === 'choices') {
        confirmChoice();
      }
    }
  
    /* ── CLOSE ── */
    function close() {
      clearTimeout(typeTimer);
      overlay.classList.remove('open');
      mode = 'idle';
      const cb = config?.onClose;
      config = null;
      if (cb) cb();
    }
  
    /* ── INPUT ── */
    function onKey(e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key.toLowerCase() === 'e' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
      if (mode === 'choices') {
        if (e.key === 'ArrowUp'   || e.key.toLowerCase() === 'w') { e.preventDefault(); moveChoice(-1); }
        if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') { e.preventDefault(); moveChoice(1); }
      }
    }
    function onClick(e) {
      if (e.target.closest('.dlg-choice')) {
        const idx = parseInt(e.target.closest('.dlg-choice').dataset.idx);
        choiceIdx = idx;
        confirmChoice();
      } else {
        advance();
      }
    }
  
    function isOpen() { return overlay?.classList.contains('open') ?? false; }
  
    /* ══════════════════════════════════════════
       PORTRAIT DRAWING ENGINE
       Each portrait key has a draw function.
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
    PORTRAITS.player = function(ctx, expr) {
      const cx = PORTRAIT_W / 2, cy = PORTRAIT_H / 2 + 20;
      const p = P;
      ctx.save();
      ctx.translate(cx, cy);
  
      // BG tint
      ctx.fillStyle = 'rgba(30,20,5,0.7)';
      ctx.fillRect(-PORTRAIT_W/2, -PORTRAIT_H/2, PORTRAIT_W, PORTRAIT_H);
  
      // Shoulders / body
      ctx.fillStyle = '#506030';
      ctx.fillRect(-12*p, 2*p, 24*p, 18*p);
      ctx.fillStyle = '#3a4a1a';
      ctx.fillRect(-12*p, 2*p, 7*p, 10*p);
      ctx.fillRect(5*p, 2*p, 7*p, 10*p);
  
      // Neck
      ctx.fillStyle = '#c8a070';
      ctx.fillRect(-2*p, -2*p, 4*p, 4*p);
  
      // Head
      ctx.fillStyle = '#c8a070';
      ctx.fillRect(-7*p, -18*p, 14*p, 16*p);
      ctx.fillStyle = 'rgba(255,200,120,0.18)';
      ctx.fillRect(-7*p, -18*p, 14*p, 4*p);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(-7*p, -4*p, 14*p, 2*p);
  
      // Hair
      ctx.fillStyle = '#231a0a';
      ctx.fillRect(-7*p, -22*p, 14*p, 7*p);
      ctx.fillRect(-9*p, -18*p, 3*p, 8*p);
      ctx.fillRect(6*p, -18*p, 3*p, 6*p);
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(-7*p, -18*p, 5*p, 3*p);
  
      // Eyes
      const eyeY = -12*p;
      if (expr === 'surprised' || expr === 'scared') {
        ctx.fillStyle = '#1a0a04';
        ctx.fillRect(-5*p, eyeY-p, 4*p, 5*p);
        ctx.fillRect(1*p, eyeY-p, 4*p, 5*p);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-5*p, eyeY-p, 4*p, p);
        ctx.fillRect(1*p, eyeY-p, 4*p, p);
      } else if (expr === 'angry') {
        ctx.fillStyle = '#1a0a04';
        ctx.fillRect(-5*p, eyeY, 4*p, 3*p);
        ctx.fillRect(1*p, eyeY, 4*p, 3*p);
        // eyebrows angled
        ctx.fillStyle = '#231a0a';
        ctx.fillRect(-5*p, eyeY-3*p, 4*p, 2*p);
        ctx.fillRect(1*p, eyeY-2*p, 4*p, 2*p);
      } else if (expr === 'happy') {
        ctx.fillStyle = '#1a0a04';
        ctx.fillRect(-5*p, eyeY, 4*p, 2*p);
        ctx.fillRect(1*p, eyeY, 4*p, 2*p);
        ctx.fillStyle = 'rgba(255,200,120,0.4)';
        ctx.fillRect(-5*p, eyeY+2*p, 4*p, p);
        ctx.fillRect(1*p, eyeY+2*p, 4*p, p);
      } else {
        // normal
        ctx.fillStyle = '#ecddc0';
        ctx.fillRect(-5*p, eyeY, 4*p, 4*p);
        ctx.fillRect(1*p, eyeY, 4*p, 4*p);
        ctx.fillStyle = '#1a0a04';
        ctx.fillRect(-4*p, eyeY+p, 3*p, 3*p);
        ctx.fillRect(1*p, eyeY+p, 3*p, 3*p);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(-4*p, eyeY+p, p, p);
        ctx.fillRect(1*p, eyeY+p, p, p);
      }
  
      // Mouth
      const mouthY = -6*p;
      if (expr === 'happy') {
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(-3*p, mouthY, 6*p, p);
        ctx.fillRect(-4*p, mouthY+p, 2*p, p);
        ctx.fillRect(2*p, mouthY+p, 2*p, p);
      } else if (expr === 'surprised') {
        ctx.fillStyle = '#3a1a08';
        ctx.beginPath();
        ctx.ellipse(0, mouthY+p, p*2, p*2.5, 0, 0, Math.PI*2);
        ctx.fill();
      } else if (expr === 'angry') {
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(-4*p, mouthY+p, 8*p, p);
        ctx.fillRect(-4*p, mouthY, 2*p, p);
        ctx.fillRect(2*p, mouthY, 2*p, p);
      } else {
        ctx.fillStyle = '#b09070';
        ctx.fillRect(-3*p, mouthY, 3*p, p);
        ctx.fillRect(0, mouthY, 3*p, p);
        ctx.fillStyle = '#6a5038';
        ctx.fillRect(-2*p, mouthY+p, 5*p, p);
      }
  
      ctx.restore();
    };
  
    /* ── DEALER ── */
    PORTRAITS.dealer = function(ctx, expr) {
      const cx = PORTRAIT_W / 2, cy = PORTRAIT_H / 2 + 20;
      const p = P;
      ctx.save();
      ctx.translate(cx, cy);
  
      // Eerie BG
      const bgGrad = ctx.createRadialGradient(0, -10*p, 0, 0, -10*p, 35*p);
      bgGrad.addColorStop(0, 'rgba(30,5,50,0.9)');
      bgGrad.addColorStop(1, 'rgba(5,0,10,0.98)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-PORTRAIT_W/2, -PORTRAIT_H/2, PORTRAIT_W, PORTRAIT_H);
  
      // Coat
      ctx.fillStyle = '#1e0e2e';
      ctx.fillRect(-9*p, 0, 18*p, 22*p);
      ctx.fillStyle = '#2a1240';
      ctx.fillRect(-9*p, 0, 5*p, 12*p);
      ctx.fillRect(4*p, 0, 5*p, 12*p);
      // Collar
      ctx.fillStyle = '#140828';
      ctx.fillRect(-8*p, 0, 5*p, 7*p);
      ctx.fillRect(3*p, 0, 5*p, 7*p);
      // Lapel shine
      ctx.fillStyle = 'rgba(255,200,255,0.06)';
      ctx.fillRect(-9*p, 0, 2*p, 18*p);
  
      // Arms
      ctx.fillStyle = '#1e0e2e';
      ctx.fillRect(-13*p, -4*p, 5*p, 14*p);
      ctx.fillRect(8*p, -4*p, 5*p, 14*p);
      ctx.fillStyle = '#c0a878';
      ctx.fillRect(-13*p, 9*p, 5*p, 4*p);
      ctx.fillRect(8*p, 9*p, 5*p, 4*p);
  
      // Glowing bottle
      ctx.save(); ctx.translate(-16*p, 4*p);
      const glowAmt = 0.4 + 0.3*Math.sin(Date.now()/300);
      ctx.globalAlpha = glowAmt * 0.5;
      ctx.fillStyle = '#40ff80';
      ctx.beginPath(); ctx.arc(0, 0, p*5, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#1a6028'; ctx.fillRect(-p*2, -p*6, p*4, p*10);
      ctx.fillStyle = '#2a8838'; ctx.fillRect(-p*2, -p*6, p*2, p*10);
      ctx.fillStyle = '#40cc60'; ctx.fillRect(-p*2, -p*6, p*4, p*3);
      ctx.fillStyle = 'rgba(100,255,120,0.6)'; ctx.fillRect(-p*2, -p*5, p*2, p*3);
      ctx.fillStyle = '#888'; ctx.fillRect(-p, -p*8, p*2, p*2);
      ctx.restore();
  
      // Neck
      ctx.fillStyle = '#c0a878';
      ctx.fillRect(-3*p, -3*p, 6*p, 4*p);
  
      // Head
      ctx.fillStyle = '#b89868';
      ctx.fillRect(-7*p, -22*p, 14*p, 19*p);
      ctx.fillStyle = 'rgba(255,200,120,0.18)';
      ctx.fillRect(-7*p, -22*p, 14*p, 5*p);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(-7*p, -4*p, 14*p, 2*p);
  
      // Hat brim + crown
      ctx.fillStyle = '#0e0818';
      ctx.fillRect(-10*p, -26*p, 20*p, 4*p);
      ctx.fillRect(-6*p, -36*p, 12*p, 11*p);
      ctx.fillStyle = '#2a1848';
      ctx.fillRect(-6*p, -36*p, 6*p, 11*p);
      ctx.fillStyle = 'rgba(255,200,80,0.22)';
      ctx.fillRect(-6*p, -26*p, 12*p, p);
  
      // Shadow under hat
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(-7*p, -24*p, 14*p, 5*p);
  
      // Eyes
      const eyeY = -16*p;
      if (expr === 'angry' || expr === 'threatening') {
        ctx.fillStyle = '#0a0418';
        ctx.fillRect(-6*p, eyeY, 5*p, 4*p);
        ctx.fillRect(1*p, eyeY, 5*p, 4*p);
        ctx.fillStyle = 'rgba(255,40,0,0.9)';
        ctx.fillRect(-5*p, eyeY+p, 3*p, 2*p);
        ctx.fillRect(1*p, eyeY+p, 3*p, 2*p);
        // Angry brows
        ctx.fillStyle = '#0e0818';
        ctx.fillRect(-6*p, eyeY-3*p, 6*p, 2*p);
        ctx.fillRect(0, eyeY-2*p, 6*p, 2*p);
      } else if (expr === 'smirk' || expr === 'sneaky') {
        ctx.fillStyle = '#0a0418';
        ctx.fillRect(-6*p, eyeY+p, 5*p, 3*p);
        ctx.fillRect(1*p, eyeY, 5*p, 4*p);
        ctx.fillStyle = 'rgba(80,255,120,0.9)';
        ctx.fillRect(-5*p, eyeY+2*p, 3*p, 2*p);
        ctx.fillRect(1*p, eyeY+p, 3*p, 2*p);
        ctx.fillStyle = 'rgba(200,255,200,0.7)';
        ctx.fillRect(-5*p, eyeY+2*p, p, p);
        ctx.fillRect(1*p, eyeY+p, p, p);
      } else {
        // normal glowing eyes
        ctx.fillStyle = '#0a0418';
        ctx.fillRect(-6*p, eyeY, 5*p, 4*p);
        ctx.fillRect(1*p, eyeY, 5*p, 4*p);
        ctx.fillStyle = 'rgba(80,255,120,0.9)';
        ctx.fillRect(-5*p, eyeY+p, 3*p, 2*p);
        ctx.fillRect(2*p, eyeY+p, 3*p, 2*p);
        ctx.fillStyle = 'rgba(200,255,200,0.7)';
        ctx.fillRect(-5*p, eyeY+p, p, p);
        ctx.fillRect(2*p, eyeY+p, p, p);
      }
  
      // Mouth
      const mY = -9*p;
      if (expr === 'smirk' || expr === 'sneaky') {
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(-4*p, mY, 8*p, p);
        ctx.fillRect(2*p, mY+p, 3*p, p);
      } else if (expr === 'angry' || expr === 'threatening') {
        ctx.fillStyle = '#3a1208';
        ctx.fillRect(-5*p, mY, 10*p, p*2);
        ctx.fillStyle = '#f0e0c0';
        ctx.fillRect(-4*p, mY, 2*p, 2*p);
        ctx.fillRect(2*p, mY, 2*p, 2*p);
      } else {
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(-4*p, mY, 8*p, p);
        ctx.fillRect(2*p, mY+p, 2*p, p);
      }
  
      // Floating ? above head
      const qa = 0.5 + 0.5*Math.sin(Date.now()/500);
      ctx.globalAlpha = qa;
      ctx.fillStyle = '#ffe600';
      ctx.font = `bold ${p*5}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('?', 0, -40*p);
      ctx.globalAlpha = 1;
  
      ctx.restore();
    };
  
    /* ── OLD LADY ── */
    PORTRAITS.old_lady = function(ctx, expr) {
      const cx = PORTRAIT_W/2, cy = PORTRAIT_H/2 + 10;
      const p = P;
      ctx.save(); ctx.translate(cx, cy);
  
      ctx.fillStyle = 'rgba(20,10,30,0.8)';
      ctx.fillRect(-PORTRAIT_W/2, -PORTRAIT_H/2, PORTRAIT_W, PORTRAIT_H);
  
      // Body — floral cardigan
      ctx.fillStyle = '#7a4858';
      ctx.fillRect(-10*p, 0, 20*p, 20*p);
      // Floral pattern dots
      const dots = [[-5,-5],[2,-3],[-2,5],[6,8],[-7,10],[3,15]];
      for (const [dx,dy] of dots) {
        ctx.fillStyle = '#f08080';
        ctx.fillRect(dx*p, dy*p, p*2, p*2);
        ctx.fillStyle = '#f0c0c0';
        ctx.fillRect((dx+1)*p, dy*p, p, p);
      }
  
      // Neck + head — wide
      ctx.fillStyle = '#c8a070';
      ctx.fillRect(-3*p, -3*p, 6*p, 4*p);
      ctx.fillStyle = '#c8a070';
      ctx.fillRect(-9*p, -22*p, 18*p, 20*p);
  
      // White fluffy hair
      ctx.fillStyle = '#e8e8e0';
      ctx.fillRect(-10*p, -28*p, 20*p, 10*p);
      ctx.fillRect(-11*p, -24*p, 4*p, 8*p);
      ctx.fillRect(7*p, -24*p, 4*p, 8*p);
      ctx.fillStyle = '#d0d0c8';
      ctx.fillRect(-10*p, -28*p, 10*p, 5*p);
      // Curls
      ctx.fillStyle = '#e8e8e0';
      ctx.fillRect(-11*p, -26*p, p*3, p*4);
      ctx.fillRect(8*p, -24*p, p*3, p*3);
  
      // Glasses
      ctx.strokeStyle = '#604020';
      ctx.lineWidth = p;
      ctx.strokeRect(-8*p, -14*p, 6*p, 4*p);
      ctx.strokeRect(2*p, -14*p, 6*p, 4*p);
      ctx.beginPath(); ctx.moveTo(-2*p, -12*p); ctx.lineTo(2*p, -12*p); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8*p, -12*p); ctx.lineTo(-11*p, -11*p); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8*p, -12*p); ctx.lineTo(11*p, -11*p); ctx.stroke();
  
      // Eyes through glasses
      if (expr === 'angry') {
        ctx.fillStyle = '#3a1a08';
        ctx.fillRect(-7*p, -13*p, 4*p, 2*p);
        ctx.fillRect(3*p, -13*p, 4*p, 2*p);
        // Angry brows
        ctx.fillStyle = '#604020';
        ctx.fillRect(-8*p, -16*p, 4*p, p);
        ctx.fillRect(3*p, -17*p, 4*p, p);
      } else if (expr === 'suspicious') {
        ctx.fillStyle = '#3a1a08';
        ctx.fillRect(-7*p, -13*p, 4*p, 2*p);
        ctx.fillRect(3*p, -12*p, 4*p, 3*p);
      } else {
        ctx.fillStyle = '#3a1a08';
        ctx.fillRect(-7*p, -13*p, 4*p, 3*p);
        ctx.fillRect(3*p, -13*p, 4*p, 3*p);
        ctx.fillStyle = '#8a5038';
        ctx.fillRect(-6*p, -12*p, 2*p, 2*p);
        ctx.fillRect(4*p, -12*p, 2*p, 2*p);
      }
  
      // Mouth + wrinkles
      ctx.fillStyle = '#c09060';
      ctx.fillRect(-4*p, -7*p, 8*p, p);
      // Wrinkles
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(-8*p, -10*p, 3*p, p);
      ctx.fillRect(5*p, -10*p, 3*p, p);
      ctx.fillRect(-6*p, -8*p, 2*p, p);
      ctx.fillRect(4*p, -8*p, 2*p, p);
  
      ctx.restore();
    };
  
    /* ── COP ── */
    PORTRAITS.cop = function(ctx, expr) {
      const cx = PORTRAIT_W/2, cy = PORTRAIT_H/2 + 20;
      const p = P;
      ctx.save(); ctx.translate(cx, cy);
  
      ctx.fillStyle = 'rgba(5,10,25,0.9)';
      ctx.fillRect(-PORTRAIT_W/2, -PORTRAIT_H/2, PORTRAIT_W, PORTRAIT_H);
  
      // Body — dark blue uniform
      ctx.fillStyle = '#1a2848';
      ctx.fillRect(-11*p, 0, 22*p, 20*p);
      ctx.fillStyle = '#141e38';
      ctx.fillRect(-11*p, 0, 5*p, 12*p);
      ctx.fillRect(6*p, 0, 5*p, 12*p);
      // Badge
      ctx.fillStyle = '#c8a030';
      ctx.fillRect(-2*p, 2*p, 4*p, 5*p);
      ctx.fillStyle = '#a07818';
      ctx.fillRect(-p, 3*p, 2*p, 3*p);
      // Belt
      ctx.fillStyle = '#0a0a18';
      ctx.fillRect(-11*p, 12*p, 22*p, 3*p);
      ctx.fillStyle = '#c8a030';
      ctx.fillRect(-2*p, 12*p, 4*p, 3*p);
  
      // Arms
      ctx.fillStyle = '#1a2848';
      ctx.fillRect(-15*p, -2*p, 5*p, 14*p);
      ctx.fillRect(10*p, -2*p, 5*p, 14*p);
      ctx.fillStyle = '#d0a880';
      ctx.fillRect(-15*p, 11*p, 5*p, 4*p);
      ctx.fillRect(10*p, 11*p, 5*p, 4*p);
  
      // Neck
      ctx.fillStyle = '#d0a880';
      ctx.fillRect(-3*p, -4*p, 6*p, 5*p);
  
      // Head
      ctx.fillStyle = '#d0a880';
      ctx.fillRect(-7*p, -22*p, 14*p, 18*p);
      ctx.fillStyle = 'rgba(255,200,120,0.15)';
      ctx.fillRect(-7*p, -22*p, 14*p, 4*p);
  
      // Cop hat
      ctx.fillStyle = '#1a2848';
      ctx.fillRect(-10*p, -28*p, 20*p, 3*p);
      ctx.fillRect(-6*p, -36*p, 12*p, 9*p);
      ctx.fillStyle = '#c8a030';
      ctx.fillRect(-6*p, -28*p, 12*p, p);
      ctx.fillStyle = '#0a0a18';
      ctx.fillRect(-6*p, -28*p, 12*p, 3*p);
      ctx.fillStyle = '#c8a030';
      ctx.fillRect(-2*p, -33*p, 4*p, 4*p);
  
      // Shadow under brim
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(-7*p, -25*p, 14*p, 5*p);
  
      // Eyes
      const eyeY = -15*p;
      if (expr === 'suspicious' || expr === 'angry') {
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(-5*p, eyeY, 4*p, 3*p);
        ctx.fillRect(1*p, eyeY, 4*p, 3*p);
        ctx.fillStyle = '#c8a030';
        ctx.fillRect(-4*p, eyeY+p, 2*p, 2*p);
        ctx.fillRect(2*p, eyeY+p, 2*p, 2*p);
        // Frowning brows
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(-5*p, eyeY-3*p, 5*p, 2*p);
        ctx.fillRect(0, eyeY-2*p, 5*p, 2*p);
      } else {
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(-5*p, eyeY, 4*p, 4*p);
        ctx.fillRect(1*p, eyeY, 4*p, 4*p);
        ctx.fillStyle = '#806040';
        ctx.fillRect(-4*p, eyeY+p, 2*p, 2*p);
        ctx.fillRect(2*p, eyeY+p, 2*p, 2*p);
      }
  
      // Moustache
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(-5*p, -9*p, 10*p, 3*p);
      ctx.fillStyle = '#2a1a08';
      ctx.fillRect(-5*p, -8*p, 5*p, 2*p);
  
      // Mouth
      const mY = -6*p;
      if (expr === 'angry') {
        ctx.fillStyle = '#7a5030';
        ctx.fillRect(-3*p, mY, 6*p, p);
        ctx.fillRect(-3*p, mY-p, 2*p, p);
        ctx.fillRect(1*p, mY-p, 2*p, p);
      } else {
        ctx.fillStyle = '#7a5030';
        ctx.fillRect(-3*p, mY, 6*p, p);
      }
  
      ctx.restore();
    };
  
    /* ── HOMELESS GUY ── */
    PORTRAITS.homeless = function(ctx, expr) {
      const cx = PORTRAIT_W/2, cy = PORTRAIT_H/2 + 15;
      const p = P;
      ctx.save(); ctx.translate(cx, cy);
  
      ctx.fillStyle = 'rgba(15,10,5,0.9)';
      ctx.fillRect(-PORTRAIT_W/2, -PORTRAIT_H/2, PORTRAIT_W, PORTRAIT_H);
  
      // Body — torn coat
      ctx.fillStyle = '#4a3820';
      ctx.fillRect(-9*p, 0, 18*p, 20*p);
      ctx.fillStyle = '#3a2810';
      ctx.fillRect(-9*p, 0, 4*p, 14*p);
      ctx.fillRect(5*p, 0, 4*p, 14*p);
      // Torn edges
      ctx.fillStyle = '#2a1808';
      ctx.fillRect(-9*p, 14*p, 3*p, 6*p);
      ctx.fillRect(-5*p, 16*p, 3*p, 4*p);
      ctx.fillRect(3*p, 15*p, 3*p, 5*p);
      ctx.fillRect(7*p, 13*p, 2*p, 7*p);
      // Patches
      ctx.fillStyle = '#6a4820';
      ctx.fillRect(-2*p, 5*p, 5*p, 4*p);
      ctx.fillStyle = '#2a1808';
      ctx.fillRect(-2*p, 5*p, 5*p, p);
  
      // Arms
      ctx.fillStyle = '#4a3820';
      ctx.fillRect(-13*p, -3*p, 5*p, 14*p);
      ctx.fillRect(8*p, -3*p, 5*p, 14*p);
      ctx.fillStyle = '#c0a060';
      ctx.fillRect(-13*p, 10*p, 5*p, 4*p);
      ctx.fillRect(8*p, 10*p, 5*p, 4*p);
  
      // Neck
      ctx.fillStyle = '#b89050';
      ctx.fillRect(-2*p, -4*p, 5*p, 5*p);
  
      // Head — unshaven
      ctx.fillStyle = '#b89050';
      ctx.fillRect(-8*p, -22*p, 16*p, 18*p);
  
      // Messy hair
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(-9*p, -26*p, 18*p, 8*p);
      ctx.fillRect(-10*p, -24*p, 4*p, 6*p);
      ctx.fillRect(6*p, -23*p, 5*p, 5*p);
      ctx.fillStyle = '#4a3820';
      ctx.fillRect(-9*p, -22*p, 5*p, 3*p);
      ctx.fillRect(5*p, -21*p, 4*p, 2*p);
  
      // Stubble
      for (let sx = -7; sx <= 6; sx += 2) {
        for (let sy = -12; sy <= -7; sy += 2) {
          if (Math.abs(sx) < 5 || sy > -9) {
            ctx.fillStyle = 'rgba(50,35,15,0.5)';
            ctx.fillRect(sx*p, sy*p, p, p);
          }
        }
      }
  
      // Eyes
      const eyeY = -14*p;
      if (expr === 'sad') {
        ctx.fillStyle = '#2a1a08';
        ctx.fillRect(-5*p, eyeY, 4*p, 3*p);
        ctx.fillRect(1*p, eyeY, 4*p, 3*p);
        ctx.fillStyle = '#8a6040';
        ctx.fillRect(-4*p, eyeY+p, 2*p, 2*p);
        ctx.fillRect(2*p, eyeY+p, 2*p, 2*p);
        // Drooping brows
        ctx.fillStyle = '#3a2a10';
        ctx.fillRect(-5*p, eyeY-3*p, 2*p, 2*p);
        ctx.fillRect(-3*p, eyeY-2*p, 3*p, 2*p);
        ctx.fillRect(0, eyeY-2*p, 3*p, 2*p);
        ctx.fillRect(3*p, eyeY-3*p, 2*p, 2*p);
      } else {
        ctx.fillStyle = '#2a1a08';
        ctx.fillRect(-5*p, eyeY, 4*p, 4*p);
        ctx.fillRect(1*p, eyeY, 4*p, 4*p);
        ctx.fillStyle = '#8a6040';
        ctx.fillRect(-4*p, eyeY+p, 2*p, 2*p);
        ctx.fillRect(2*p, eyeY+p, 2*p, 2*p);
      }
  
      // Mouth
      if (expr === 'sad') {
        ctx.fillStyle = '#7a5030';
        ctx.fillRect(-3*p, -8*p, 6*p, p);
        ctx.fillRect(-4*p, -7*p, 2*p, p);
        ctx.fillRect(2*p, -7*p, 2*p, p);
      } else {
        ctx.fillStyle = '#7a5030';
        ctx.fillRect(-3*p, -8*p, 6*p, p);
      }
  
      ctx.restore();
    };
  
    /* ── UNKNOWN / PLACEHOLDER ── */
    function drawUnknown(ctx, expr) {
      const cx = PORTRAIT_W/2, cy = PORTRAIT_H/2;
      ctx.save();
      ctx.fillStyle = 'rgba(20,10,5,0.9)';
      ctx.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H);
      ctx.fillStyle = 'rgba(255,230,0,0.25)';
      ctx.font = `bold ${P*12}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', cx, cy);
      ctx.restore();
    }
  
    return { show, close, isOpen, drawPortrait, PORTRAITS };
  })();