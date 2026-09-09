(() => {
  const root = document.querySelector("[data-init]");
  if (!root) return;

  const arena = root.querySelector("[data-arena]");
  const intro = root.querySelector("[data-init-intro]");
  const hud = root.querySelector("[data-init-hud]");
  const ending = root.querySelector("[data-init-end]");
  const status = root.querySelector("[data-init-status]");
  const routedEl = root.querySelector("[data-init-routed]");
  const scoreEl = root.querySelector("[data-init-score]");
  const livesEl = root.querySelector("[data-init-lives]");
  const endTitle = root.querySelector("[data-init-end-title]");
  const endCopy = root.querySelector("[data-init-end-copy]");
  const bestEl = root.querySelector("[data-init-best]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const GOAL = 8;
  const MAX_LIVES = 3;
  const SEEN_KEY = "uj-mesh-init-seen";
  const BEST_KEY = "uj-mesh-init-best";
  const KINDS = [
    { id: "license", text: "Renew trade license", bay: "license" },
    { id: "health", text: "Book food inspection", bay: "health" },
    { id: "payment", text: "Pay municipality fee", bay: "payment" },
    { id: "engineering", text: "Villa extension permit", bay: "engineering" },
    { id: "review", text: "hello there", bay: "review" },
    { id: "review", text: "need help please", bay: "review" },
  ];

  const state = {
    phase: "closed",
    score: 0,
    routed: 0,
    lives: MAX_LIVES,
    packets: [],
    fx: [],
    carry: null,
    pointer: { x: 0, y: 0, on: false },
    spawnIn: 0,
    raf: 0,
    w: 0,
    h: 0,
  };

  let audioCtx = null;
  const ctx = arena?.getContext("2d", { alpha: true });

  const bays = () => {
    const pad = coarse ? 96 : 110;
    const top = 118;
    return [
      { id: "license", label: "License", x: pad, y: top, color: "#e2b34a" },
      { id: "health", label: "Health", x: state.w - pad, y: top, color: "#6ee7b7" },
      { id: "payment", label: "Pay", x: pad, y: state.h - 88, color: "#f0c86a" },
      { id: "engineering", label: "Build", x: state.w - pad, y: state.h - 88, color: "#d8cbb3" },
      { id: "review", label: "Review", x: state.w * 0.5, y: state.h * 0.52, color: "#e07a5f" },
    ];
  };

  const tone = (freq, ms = 90, gain = 0.03) => {
    if (reduceMotion) return;
    try {
      audioCtx = audioCtx || new AudioContext();
      const osc = audioCtx.createOscillator();
      const node = audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      node.gain.value = gain;
      osc.connect(node);
      node.connect(audioCtx.destination);
      osc.start();
      node.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
      osc.stop(audioCtx.currentTime + ms / 1000);
    } catch {
      /* audio is optional */
    }
  };

  const setStatus = (text) => {
    if (status) status.textContent = text;
  };

  const paintHud = () => {
    if (routedEl) routedEl.textContent = `${state.routed} / ${GOAL}`;
    if (scoreEl) scoreEl.textContent = String(state.score);
    if (livesEl) livesEl.textContent = String(state.lives);
  };

  const bestScore = () => Number(window.localStorage.getItem(BEST_KEY) || 0);

  const rememberBest = () => {
    const next = Math.max(bestScore(), state.score);
    window.localStorage.setItem(BEST_KEY, String(next));
    if (bestEl) bestEl.textContent = String(next);
  };

  const resize = () => {
    if (!arena || !ctx) return;
    state.w = root.clientWidth || window.innerWidth;
    state.h = root.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    arena.style.width = `${state.w}px`;
    arena.style.height = `${state.h}px`;
    arena.width = Math.max(1, Math.floor(state.w * dpr));
    arena.height = Math.max(1, Math.floor(state.h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const grabReach = () => (coarse ? 88 : 72);
  const dropReach = () => (coarse ? 70 : 58);

  const spawnPacket = (forced) => {
    if (state.packets.length >= 4) return;
    const reviews = KINDS.filter((row) => row.bay === "review");
    const kind = forced || (Math.random() > 0.78
      ? reviews[Math.floor(Math.random() * reviews.length)]
      : KINDS[Math.floor(Math.random() * 4)]);
    const side = Math.floor(Math.random() * 4);
    let x = state.w * 0.42;
    let y = state.h * 0.46;
    let vx = -0.18;
    let vy = -0.12;
    if (!forced) {
      vx = (Math.random() - 0.5) * 0.35;
      vy = (Math.random() - 0.5) * 0.35;
      if (side === 0) {
        x = 24;
        y = 160 + Math.random() * (state.h - 260);
        vx = 0.28 + Math.random() * 0.2;
      } else if (side === 1) {
        x = state.w - 24;
        y = 160 + Math.random() * (state.h - 260);
        vx = -(0.28 + Math.random() * 0.2);
      } else if (side === 2) {
        y = 130;
        x = 120 + Math.random() * (state.w - 240);
        vy = 0.24 + Math.random() * 0.16;
      } else {
        y = state.h - 40;
        x = 120 + Math.random() * (state.w - 240);
        vy = -(0.24 + Math.random() * 0.16);
      }
    }
    state.packets.push({
      ...kind,
      x,
      y,
      vx,
      vy,
      life: 1,
      ttl: 22,
    });
  };

  const nearestPacket = (x, y, reach) => {
    let found = null;
    let best = reach;
    for (const packet of state.packets) {
      const dist = Math.hypot(packet.x - x, packet.y - y);
      if (dist < best) {
        best = dist;
        found = packet;
      }
    }
    return found;
  };

  const grabPacket = (packet) => {
    if (!packet || state.carry) return;
    state.packets = state.packets.filter((row) => row !== packet);
    state.carry = packet;
    packet.ttl = Math.max(packet.ttl, 10);
    setStatus(`Carrying · ${packet.text}`);
    tone(520, 60, 0.025);
  };

  const burst = (x, y, color, n = 12) => {
    if (reduceMotion) return;
    for (let i = 0; i < n; i += 1) {
      const angle = ((Math.PI * 2) * i) / n;
      state.fx.push({
        x,
        y,
        vx: Math.cos(angle) * (1.2 + Math.random()),
        vy: Math.sin(angle) * (1.2 + Math.random()),
        life: 1,
        color,
      });
    }
  };

  const dropCarry = (reason) => {
    const packet = state.carry;
    if (!packet) return;
    if (reason === "expire") {
      state.lives -= 1;
      setStatus("Packet expired · request timed out");
      tone(140, 140, 0.04);
    }
    state.carry = null;
    paintHud();
    if (state.lives <= 0) finish(false);
  };

  const deliver = (packet, bay) => {
    const ok = packet.bay === bay.id;
    burst(bay.x, bay.y, bay.color, ok ? 16 : 8);
    if (ok) {
      state.routed += 1;
      state.score += packet.bay === "review" ? 140 : 100;
      setStatus(bay.id === "review"
        ? "Held for a clerk · human in the loop"
        : `Routed · ${bay.label}`);
      tone(bay.id === "review" ? 420 : 620, 80);
    } else {
      state.score = Math.max(0, state.score - 20);
      state.lives -= 1;
      setStatus("Wrong bay · do not call the write API");
      tone(180, 160, 0.045);
    }
    state.carry = null;
    paintHud();
    if (state.routed >= GOAL) finish(true);
    else if (state.lives <= 0) finish(false);
  };

  const nearestBay = (x, y, reach) => {
    let found = null;
    let best = reach;
    for (const bay of bays()) {
      const dist = Math.hypot(bay.x - x, bay.y - y);
      if (dist < best) {
        best = dist;
        found = bay;
      }
    }
    return found;
  };

  const step = () => {
    if (state.phase !== "play" || !ctx) return;
    const grab = grabReach();
    const drop = dropReach();

    state.spawnIn -= 1 / 60;
    if (state.spawnIn <= 0) {
      spawnPacket();
      state.spawnIn = state.routed > 4 ? 2.1 : 2.6;
    }

    if (state.carry) {
      state.carry.x += (state.pointer.x - state.carry.x) * 0.32;
      state.carry.y += (state.pointer.y - 28 - state.carry.y) * 0.32;
      state.carry.ttl -= 1 / 60;
      const bay = nearestBay(state.carry.x, state.carry.y, drop);
      if (bay) deliver(state.carry, bay);
      else if (state.carry.ttl <= 0) dropCarry("expire");
      if (state.phase !== "play") return;
    }

    const hot = state.pointer.on ? nearestPacket(state.pointer.x, state.pointer.y, grab) : null;
    if (hot && !state.carry) {
      hot.x += (state.pointer.x - hot.x) * 0.08;
      hot.y += (state.pointer.y - hot.y) * 0.08;
      if (Math.hypot(state.pointer.x - hot.x, state.pointer.y - hot.y) < grab * 0.7) {
        grabPacket(hot);
      }
    }

    for (let i = state.packets.length - 1; i >= 0; i -= 1) {
      const packet = state.packets[i];
      packet.x += packet.vx;
      packet.y += packet.vy;
      packet.ttl -= 1 / 60;
      if (packet.x < -40) packet.x = state.w - 40;
      if (packet.x > state.w + 40) packet.x = 40;
      if (packet.y < 110) packet.vy = Math.abs(packet.vy);
      if (packet.y > state.h - 24) packet.vy = -Math.abs(packet.vy);
      if (packet.ttl <= 0) {
        state.packets.splice(i, 1);
        state.lives -= 1;
        setStatus("Missed a request · citizen still waiting");
        paintHud();
        tone(150, 120, 0.03);
        if (state.lives <= 0) {
          finish(false);
          return;
        }
      }
    }

    for (let i = state.fx.length - 1; i >= 0; i -= 1) {
      const spark = state.fx[i];
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.life -= 0.04;
      if (spark.life <= 0) state.fx.splice(i, 1);
    }

    if (state.phase !== "play") return;
    draw();
    state.raf = window.requestAnimationFrame(step);
  };

  const markInitNav = (on) => {
    document.querySelectorAll('a[href="#init"]').forEach((link) => {
      link.classList.toggle("is-active", on);
    });
  };

  const drawPacket = (packet, glow) => {
    ctx.save();
    ctx.font = "600 12px Sora, sans-serif";
    const label = packet.text;
    const width = Math.min(220, ctx.measureText(label).width + 22);
    const x = packet.x - width / 2;
    const y = packet.y - 14;
    ctx.beginPath();
    ctx.fillStyle = glow ? "rgba(226, 179, 74, 0.95)" : "rgba(14, 16, 20, 0.92)";
    ctx.strokeStyle = packet.bay === "review" ? "#e07a5f" : "#e2b34a";
    ctx.lineWidth = 1.2;
    if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, width, 28, 14);
    else ctx.rect(x, y, width, 28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = glow ? "#16120a" : "#f3ead7";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, packet.x, packet.y);
    ctx.restore();
  };

  const draw = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, state.w, state.h);

    for (const bay of bays()) {
      ctx.beginPath();
      ctx.strokeStyle = bay.color;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.5;
      ctx.arc(bay.x, bay.y, coarse ? 42 : 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = bay.color;
      ctx.arc(bay.x, bay.y, coarse ? 42 : 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = bay.color;
      ctx.font = "500 11px IBM Plex Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(bay.label.toUpperCase(), bay.x, bay.y + (coarse ? 58 : 52));
    }

    if (state.carry) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(110, 231, 183, 0.55)";
      ctx.moveTo(state.pointer.x, state.pointer.y);
      ctx.lineTo(state.carry.x, state.carry.y);
      ctx.stroke();
      drawPacket(state.carry, true);
    }

    const hover = state.pointer.on && !state.carry
      ? nearestPacket(state.pointer.x, state.pointer.y, grabReach())
      : null;
    for (const packet of state.packets) {
      if (packet === hover) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(110, 231, 183, 0.7)";
        ctx.lineWidth = 1.2;
        ctx.arc(packet.x, packet.y, 34, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawPacket(packet, packet === hover);
    }

    for (const spark of state.fx) {
      ctx.beginPath();
      ctx.globalAlpha = spark.life;
      ctx.fillStyle = spark.color;
      ctx.arc(spark.x, spark.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (state.pointer.on) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(110, 231, 183, 0.85)";
      ctx.lineWidth = 1.4;
      ctx.arc(state.pointer.x, state.pointer.y, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "#e2b34a";
      ctx.arc(state.pointer.x, state.pointer.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const show = (panel) => {
    intro.hidden = panel !== "intro";
    hud.hidden = panel !== "play";
    ending.hidden = panel !== "end";
  };

  const open = (panel = "intro") => {
    root.hidden = false;
    document.body.classList.add("is-init-open");
    markInitNav(true);
    state.phase = panel === "play" ? "play" : panel;
    show(panel);
    resize();
    if (panel === "intro") {
      root.querySelector("[data-init-play]")?.focus();
    }
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const close = () => {
    window.cancelAnimationFrame(state.raf);
    state.phase = "closed";
    state.packets = [];
    state.fx = [];
    state.carry = null;
    root.hidden = true;
    document.body.classList.remove("is-init-open");
    markInitNav(false);
    show("intro");
    if (window.location.hash === "#init") {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}#top`);
    }
    const opener = document.querySelector("[data-init-open]");
    opener?.focus();
  };

  const resetRun = () => {
    state.score = 0;
    state.routed = 0;
    state.lives = MAX_LIVES;
    state.packets = [];
    state.fx = [];
    state.carry = null;
    state.spawnIn = 2.8;
    paintHud();
    setStatus("Gateway online · click a request or move onto it");
    spawnPacket(KINDS[0]);
  };

  const play = () => {
    resetRun();
    open("play");
    root.querySelector("[data-init-exit]")?.focus();
    window.cancelAnimationFrame(state.raf);
    if (!ctx) {
      setStatus("Canvas unavailable · skip to the portfolio");
      return;
    }
    state.raf = window.requestAnimationFrame(step);
    tone(300, 70, 0.02);
  };

  const finish = (won) => {
    window.cancelAnimationFrame(state.raf);
    state.phase = "end";
    rememberBest();
    show("end");
    if (endTitle) endTitle.textContent = won ? "Mesh online" : "Init paused";
    if (endCopy) {
      endCopy.textContent = won
        ? `Eight routes landed. Score ${state.score}. Same rule as the lab: low confidence still goes to a clerk.`
        : `The write path stayed closed. Score ${state.score}. Replay, or enter the portfolio.`;
    }
    ending.querySelector("[data-init-again]")?.focus();
    tone(won ? 680 : 220, 180, 0.035);
  };

  const trackPointer = (event) => {
    if (state.phase !== "play") return;
    if (event.target instanceof Element && event.target.closest("button, a")) return;
    const box = root.getBoundingClientRect();
    state.pointer.x = event.clientX - box.left;
    state.pointer.y = event.clientY - box.top;
    state.pointer.on = true;
  };

  root.addEventListener("pointermove", trackPointer);
  root.addEventListener("pointerdown", (event) => {
    trackPointer(event);
    if (state.phase !== "play" || state.carry) return;
    if (event.target instanceof Element && event.target.closest("button, a")) return;
    const packet = nearestPacket(state.pointer.x, state.pointer.y, grabReach() + 24);
    if (packet) grabPacket(packet);
  });

  root.addEventListener("pointerleave", () => {
    state.pointer.on = false;
  });

  document.querySelectorAll("[data-init-open]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      open("intro");
    });
  });

  root.querySelector("[data-init-play]")?.addEventListener("click", play);
  root.querySelector("[data-init-again]")?.addEventListener("click", play);
  root.querySelectorAll("[data-init-skip], [data-init-exit], [data-init-enter]").forEach((btn) => {
    btn.addEventListener("click", close);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.phase !== "closed") {
      event.preventDefault();
      close();
    }
  });

  window.addEventListener("resize", () => {
    if (state.phase === "closed") return;
    resize();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) window.cancelAnimationFrame(state.raf);
    else if (state.phase === "play") state.raf = window.requestAnimationFrame(step);
  });

  if (bestEl) bestEl.textContent = String(bestScore());

  const hash = window.location.hash;
  const deep = hash === "#init";
  const home = !hash || hash === "#" || hash === "#top";
  let seen = false;
  try {
    seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    seen = false;
  }
  if (deep) open("intro");
  else if (home && !seen && !reduceMotion) open("intro");
})();
