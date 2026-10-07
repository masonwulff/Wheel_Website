const Celebration = (() => {
  let audioCtx = null;
  let muted = false;
  try {
    muted = localStorage.getItem("caseMuted") === "1";
  } catch (e) {
    /* storage unavailable -- default to sound on */
  }

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Sound (synthesized with the Web Audio API) ----------

  // Browsers only allow audio after a user gesture, so this gets called
  // from the click that opens the case.
  function unlock() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playTone({ freq, start = 0, dur = 0.12, type = "sine", gain = 0.12, slideTo }) {
    if (muted) return;
    const ctx = unlock();
    if (!ctx) return;

    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);

    // Quick attack, exponential decay -- avoids the click you get from
    // starting/stopping an oscillator at full volume.
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(env);
    env.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function openSound() {
    playTone({ freq: 180, slideTo: 620, dur: 0.35, type: "sawtooth", gain: 0.05 });
  }

  function tick() {
    playTone({ freq: 850 + Math.random() * 120, dur: 0.035, type: "square", gain: 0.035 });
  }

  // level: 0 (most common item) .. 1 (rarest item)
  function winSound(level) {
    const base = 523.25; // C5
    const ratios = [1, 1.25, 1.5, 2, 2.5, 3, 4]; // major arpeggio climbing upward
    const count = 3 + Math.round(level * 4); // 3 notes for common, 7 for rarest

    for (let i = 0; i < count; i++) {
      playTone({
        freq: base * ratios[i],
        start: i * 0.09,
        dur: 0.4,
        type: i % 2 ? "triangle" : "sine",
        gain: 0.1,
      });
    }

    if (level > 0.6) {
      // Low thump under the arpeggio for the big pulls.
      playTone({ freq: 140, slideTo: 60, dur: 0.6, type: "sawtooth", gain: 0.07 });
    }
  }

  // ---------- Confetti ----------

  function confetti(originX, originY, color, level) {
    if (prefersReducedMotion) return;

    const canvas = document.createElement("canvas");
    canvas.className = "confetti-canvas";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const palette = [color, color, "#F2B705", "#F1EFE9", "#FFFFFF"];
    const count = Math.round(50 + level * 190);

    const particles = Array.from({ length: count }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9; // mostly upward fan
      const speed = 6 + Math.random() * (8 + level * 6);
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.35,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 0,
      };
    });

    const GRAVITY = 0.28;
    const DRAG = 0.992;
    const MAX_FRAMES = 200;
    let frame = 0;

    function step() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.vx *= DRAG;
        p.vy = p.vy * DRAG + GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.life++;

        const fade = Math.max(0, 1 - frame / MAX_FRAMES);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (frame < MAX_FRAMES) {
        requestAnimationFrame(step);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(step);
  }

  // ---------- Mute toggle ----------

  function renderMuteButton(btn) {
    btn.textContent = muted ? "🔇 Sound off" : "🔊 Sound on";
    btn.setAttribute("aria-pressed", muted ? "true" : "false");
  }

  function initMuteButton() {
    const btn = document.getElementById("muteBtn");
    if (!btn) return;
    renderMuteButton(btn);
    btn.addEventListener("click", () => {
      muted = !muted;
      try {
        localStorage.setItem("caseMuted", muted ? "1" : "0");
      } catch (e) {
        /* ignore */
      }
      renderMuteButton(btn);
    });
  }

  document.addEventListener("DOMContentLoaded", initMuteButton);

  return { unlock, openSound, tick, winSound, confetti };
})();

window.Celebration = Celebration;