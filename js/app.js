(() => {
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const filament = document.querySelector(".filament__fill");
  const clock = document.querySelector("[data-uae-clock]");
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-form-status]");
  const canvas = document.querySelector("[data-field]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const closeMenu = () => {
    if (!toggle || !mobileNav) return;
    mobileNav.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-nav-open");
  };

  toggle?.addEventListener("click", () => {
    const open = mobileNav.hidden;
    mobileNav.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-nav-open", open);
    if (open) mobileNav.querySelector("a")?.focus();
  });

  mobileNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const sections = [...document.querySelectorAll("[data-section]")];
  const navLinks = [...document.querySelectorAll(".nav a")];
  const railLinks = [...document.querySelectorAll(".rail a")];

  const palettes = {
    top: { r: 226, g: 179, b: 74, r2: 110, g2: 231, b2: 183, mint: 0.22 },
    about: { r: 226, g: 179, b: 74, r2: 110, g2: 231, b2: 183, mint: 0.3 },
    work: { r: 226, g: 179, b: 74, r2: 240, g2: 200, b2: 106, mint: 0.08 },
    experience: { r: 226, g: 179, b: 74, r2: 232, g2: 168, b2: 96, mint: 0.12 },
    stack: { r: 226, g: 179, b: 74, r2: 110, g2: 231, b2: 183, mint: 0.48 },
    transition: { r: 110, g: 231, b: 183, r2: 226, g2: 179, b2: 74, mint: 0.76 },
    lab: { r: 110, g: 231, b: 183, r2: 90, g2: 200, b2: 160, mint: 0.9 },
    contact: { r: 226, g: 179, b: 74, r2: 110, g2: 231, b2: 183, mint: 0.36 },
  };
  const tone = { ...palettes.top };
  let targetTone = palettes.top;
  const labSection = document.querySelector("#lab");

  const setActive = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
    const railId = id === "lab" ? "transition" : id;
    railLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.rail === railId);
    });
    targetTone = palettes[id] || palettes.top;
    document.body.classList.toggle("is-mint", (targetTone.mint || 0) > 0.55);
  };

  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle("is-scrolled", y > 12);
    if (filament) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      filament.style.height = `${max > 0 ? (y / max) * 100 : 0}%`;
    }

    let current = y < 90 ? "top" : sections[0]?.id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 140) current = section.id;
    }
    if (labSection) {
      const labBox = labSection.getBoundingClientRect();
      if (labBox.top <= 160 && labBox.bottom > 220) current = "lab";
    }
    if (current) setActive(current);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const updateClock = () => {
    if (!clock) return;
    const now = new Date();
    const formatted = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dubai",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
    clock.dateTime = now.toISOString();
    clock.textContent = `${formatted} GST`;
  };

  updateClock();
  window.setInterval(updateClock, 30000);

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    form.querySelectorAll(".field").forEach((field) => field.classList.remove("is-invalid"));
    if (!name) form.querySelector("#name")?.closest(".field")?.classList.add("is-invalid");
    if (!emailOk) form.querySelector("#email")?.closest(".field")?.classList.add("is-invalid");
    if (!message) form.querySelector("#message")?.closest(".field")?.classList.add("is-invalid");

    if (!name || !emailOk || !message) {
      status.textContent = "Please complete name, a valid email, and a message.";
      status.classList.add("is-error");
      return;
    }

    status.classList.remove("is-error");
    const subject = `Portfolio note from ${name}`;
    const composed = `${message}\n\n— ${name}\n${email}`;
    status.textContent = "Opening your email client…";
    window.location.href = `mailto:ujjwal002@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(composed)}`;
  });

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand("copy");
    input.remove();
    if (!ok) throw new Error("copy failed");
  };

  const copyEmail = document.querySelector("[data-copy-email]");
  copyEmail?.addEventListener("click", async () => {
    const email = copyEmail.getAttribute("data-email") || "ujjwal002@gmail.com";
    try {
      await copyText(email);
      copyEmail.textContent = "Email copied";
    } catch {
      copyEmail.textContent = "Copy failed — use the address above";
    }
    window.setTimeout(() => {
      copyEmail.textContent = "Copy email";
    }, 2200);
  });

  const toTop = document.querySelector("[data-to-top]");
  const syncToTop = () => {
    if (!toTop) return;
    toTop.hidden = window.scrollY < 700;
  };
  window.addEventListener("scroll", syncToTop, { passive: true });
  syncToTop();

  if (!reduceMotion) {
    const revealer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach((node) => revealer.observe(node));
  } else {
    document.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
  }

  const routes = [
    {
      id: "license",
      label: "Trade license",
      service: "eService · Licensing",
      next: "DED validation + document generation",
      terms: ["license", "licence", "trade", "shop", "company", "commercial", "renew", "ded", "business", "permit"],
    },
    {
      id: "health",
      label: "Public health",
      service: "eService · Public Health",
      next: "Inspection schedule · Central Lab",
      terms: ["health", "food", "restaurant", "inspection", "hygiene", "cafe", "kitchen", "lab"],
    },
    {
      id: "engineering",
      label: "Engineering",
      service: "eService · Engineering",
      next: "Drawings review · Work Management",
      terms: ["building", "villa", "construction", "drawing", "extension", "engineer", "permit", "site"],
    },
    {
      id: "payment",
      label: "Payments",
      service: "Payment",
      next: "Receipt + ClosedXML / IronPdf",
      terms: ["pay", "fee", "fine", "invoice", "receipt", "payment", "amount"],
    },
    {
      id: "environment",
      label: "Environment",
      service: "eService · Environment",
      next: "Work order · field inspection",
      terms: ["waste", "dump", "sewage", "garbage", "environment", "pollution"],
    },
  ];

  const tokenize = (text) => text.toLowerCase().match(/[a-z0-9]+/g) || [];

  const classify = (text) => {
    const tokens = tokenize(text);
    const raw = routes.map((route) => {
      const hits = route.terms.filter((term) => tokens.includes(term) || text.toLowerCase().includes(term));
      return { ...route, score: hits.length, hits };
    });
    const total = raw.reduce((sum, row) => sum + row.score, 0);
    const ranked = raw
      .map((row) => ({ ...row, pct: total ? Math.round((row.score / total) * 100) : 0 }))
      .sort((a, b) => b.score - a.score);
    return { ranked, total };
  };

  const labForm = document.querySelector("[data-lab-form]");
  const labOut = document.querySelector("[data-lab-out]");
  const query = document.querySelector("#lab-query");

  const renderLab = (text) => {
    if (!labOut) return;
    const { ranked, total } = classify(text);
    const top = ranked[0];
    const low = total === 0 || top.pct < 55;
    labOut.hidden = false;
    labOut.innerHTML = `
      <div class="lab__result">
        <span class="lab__kicker">${low ? "Needs review" : "Suggested route"}</span>
        <strong>${low ? "Human in the loop" : top.label}</strong>
        <p class="lab__meta">${low
          ? "Confidence is too low to auto-route. A clerk should pick the service."
          : `${top.service} → ${top.next}`}</p>
        ${low ? '<p class="lab__warn">Production default: do not call the write API yet.</p>' : ""}
      </div>
      <ul class="scores">
        ${ranked.map((row) => `
          <li>
            <span>${row.label}</span>
            <span class="bar" aria-hidden="true"><span data-bar-w="${row.pct}"></span></span>
            <b>${row.pct}%</b>
          </li>
        `).join("")}
      </ul>
    `;
    const fillBars = () => {
      labOut.querySelectorAll("[data-bar-w]").forEach((bar) => {
        bar.style.width = `${bar.getAttribute("data-bar-w")}%`;
      });
    };
    if (reduceMotion) fillBars();
    else window.requestAnimationFrame(() => window.requestAnimationFrame(fillBars));
  };

  labForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = String(query?.value || "").trim();
    if (!text) {
      query?.focus();
      return;
    }
    renderLab(text);
  });

  document.querySelectorAll("[data-sample]").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("[data-sample]").forEach((node) => node.classList.remove("is-active"));
      chip.classList.add("is-active");
      if (query) query.value = chip.getAttribute("data-sample") || "";
      renderLab(query.value);
    });
  });

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const cursor = document.querySelector("[data-cursor]");
  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.4,
    tx: window.innerWidth * 0.5,
    ty: window.innerHeight * 0.4,
    active: false,
  };
  const sparks = [];
  const ripples = [];
  const lerp = (from, to, t) => from + (to - from) * t;
  const rgba = (r, g, b, a) => `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})`;

  const setPointer = (x, y) => {
    pointer.tx = x;
    pointer.ty = y;
    pointer.active = true;
    document.documentElement.style.setProperty("--px", `${x}px`);
    document.documentElement.style.setProperty("--py", `${y}px`);
  };

  const isHotTarget = (node) => {
    if (!(node instanceof Element)) return false;
    if (node.closest("input, textarea, select")) return false;
    return Boolean(node.closest("a, button, .btn, [data-sample], [data-copy-email], .nav-toggle"));
  };

  if (!reduceMotion) {
    if (finePointer) document.body.classList.add("has-cursor");
    window.addEventListener("pointermove", (event) => {
      setPointer(event.clientX, event.clientY);
      cursor?.classList.add("is-on");
      cursor?.classList.toggle("is-hot", isHotTarget(event.target));
      if (Math.random() > 0.58) {
        sparks.push({
          x: event.clientX,
          y: event.clientY,
          vx: (Math.random() - 0.5) * 1.6,
          vy: (Math.random() - 0.5) * 1.6,
          life: 1,
          mint: Math.random() > 0.5,
        });
        if (sparks.length > 100) sparks.shift();
      }
    }, { passive: true });
    window.addEventListener("pointerdown", (event) => {
      cursor?.classList.add("is-down");
      if (event.target instanceof Element && event.target.closest("input, textarea, select, label")) return;
      ripples.push({
        x: event.clientX,
        y: event.clientY,
        r: 10,
        life: 1,
        shock: true,
        mint: (targetTone.mint || 0) > 0.55,
      });
      if (ripples.length > 6) ripples.shift();
      for (let i = 0; i < 16; i += 1) {
        const angle = ((Math.PI * 2) * i) / 16 + Math.random() * 0.18;
        const speed = 1.5 + Math.random() * 2.4;
        sparks.push({
          x: event.clientX,
          y: event.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          mint: i % 2 === 0,
        });
      }
    });
    window.addEventListener("pointerup", () => cursor?.classList.remove("is-down"));

    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("pointermove", (event) => {
        const box = btn.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        btn.style.transform = `translate(${dx * 0.16}px, ${dy * 0.16}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });

    if (finePointer) {
      document.querySelectorAll("[data-tilt]").forEach((card) => {
        const strength = Number(card.getAttribute("data-tilt")) || 7;
        card.addEventListener("pointermove", (event) => {
          const box = card.getBoundingClientRect();
          const px = (event.clientX - box.left) / box.width - 0.5;
          const py = (event.clientY - box.top) / box.height - 0.5;
          card.style.setProperty("--rx", `${(-py * strength).toFixed(2)}deg`);
          card.style.setProperty("--ry", `${(px * strength).toFixed(2)}deg`);
        });
        card.addEventListener("pointerleave", () => {
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
        });
      });
    }
  }

  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const nodes = [];
  const count = 84;
  let raf = 0;
  let viewW = window.innerWidth;
  let viewH = window.innerHeight;

  const resize = () => {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${viewW}px`;
    canvas.style.height = `${viewH}px`;
    canvas.width = Math.max(1, Math.floor(viewW * dpr));
    canvas.height = Math.max(1, Math.floor(viewH * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const seed = () => {
    nodes.length = 0;
    for (let i = 0; i < count; i += 1) {
      const z = 0.42 + Math.random() * 1.2;
      nodes.push({
        x: Math.random() * viewW,
        y: Math.random() * viewH,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        z,
        r: (Math.random() * 1.5 + 0.7) * z,
        mint: i % 5 === 0,
      });
    }
  };

  const blendTone = () => {
    tone.r = lerp(tone.r, targetTone.r, 0.055);
    tone.g = lerp(tone.g, targetTone.g, 0.055);
    tone.b = lerp(tone.b, targetTone.b, 0.055);
    tone.r2 = lerp(tone.r2, targetTone.r2, 0.055);
    tone.g2 = lerp(tone.g2, targetTone.g2, 0.055);
    tone.b2 = lerp(tone.b2, targetTone.b2, 0.055);
    document.documentElement.style.setProperty("--spot-a", rgba(tone.r, tone.g, tone.b, 0.22));
    document.documentElement.style.setProperty("--spot-b", rgba(tone.r2, tone.g2, tone.b2, 0.08));
  };

  const step = () => {
    blendTone();
    pointer.x += (pointer.tx - pointer.x) * 0.16;
    pointer.y += (pointer.ty - pointer.y) * 0.13;
    if (cursor) {
      cursor.style.transform = `translate(${pointer.x}px, ${pointer.y}px)`;
    }

    ctx.clearRect(0, 0, viewW, viewH);

    for (const node of nodes) {
      if (pointer.active) {
        const dx = pointer.x - node.x;
        const dy = pointer.y - node.y;
        const dist = Math.hypot(dx, dy) || 1;
        const reach = 300 + node.z * 40;
        if (dist < reach) {
          const pull = (1 - dist / reach) * 0.145 * node.z;
          node.vx += (dx / dist) * pull;
          node.vy += (dy / dist) * pull;
          node.vx += (-dy / dist) * 0.018 * node.z;
          node.vy += (dx / dist) * 0.018 * node.z;
        }
      }
      node.vx *= 0.982;
      node.vy *= 0.982;
      node.x += node.vx * (0.7 + node.z * 0.4);
      node.y += node.vy * (0.7 + node.z * 0.4);
      if (node.x < 0 || node.x > viewW) node.vx *= -1;
      if (node.y < 0 || node.y > viewH) node.vy *= -1;
      node.x = Math.max(0, Math.min(viewW, node.x));
      node.y = Math.max(0, Math.min(viewH, node.y));
    }

    const drawX = (node) => {
      if (!pointer.active) return node.x;
      return node.x + ((pointer.x / viewW) - 0.5) * (node.z - 1) * 16;
    };
    const drawY = (node) => {
      if (!pointer.active) return node.y;
      return node.y + ((pointer.y / viewH) - 0.5) * (node.z - 1) * 10;
    };

    if (pointer.active) {
      for (const node of nodes) {
        const x = drawX(node);
        const y = drawY(node);
        const dist = Math.hypot(pointer.x - x, pointer.y - y);
        if (dist < 250) {
          ctx.beginPath();
          ctx.strokeStyle = node.mint
            ? rgba(tone.r2, tone.g2, tone.b2, 0.44 - dist / 800)
            : rgba(tone.r, tone.g, tone.b, 0.42 - dist / 800);
          ctx.lineWidth = 0.7 + node.z * 0.35;
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const ax = drawX(a);
        const ay = drawY(a);
        const bx = drawX(b);
        const by = drawY(b);
        const dist = Math.hypot(ax - bx, ay - by);
        if (dist < 118 + a.z * 10) {
          ctx.beginPath();
          ctx.strokeStyle = a.mint || b.mint
            ? rgba(tone.r2, tone.g2, tone.b2, 0.15 - dist / 1100)
            : rgba(tone.r, tone.g, tone.b, 0.15 - dist / 1100);
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
    }

    nodes.sort((a, b) => a.z - b.z);
    for (const node of nodes) {
      const x = drawX(node);
      const y = drawY(node);
      ctx.beginPath();
      ctx.fillStyle = node.mint ? rgba(tone.r2, tone.g2, tone.b2, 1) : rgba(tone.r, tone.g, tone.b, 1);
      ctx.globalAlpha = 0.55 + node.z * 0.32;
      ctx.arc(x, y, node.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      const ripple = ripples[i];
      if (ripple.shock) {
        ripple.shock = false;
        for (const node of nodes) {
          const dx = node.x - ripple.x;
          const dy = node.y - ripple.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 340) {
            const force = (1 - dist / 340) * 3.6 * node.z;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }
      }
      ripple.r += 7.2;
      ripple.life -= 0.017;
      if (ripple.life <= 0) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.globalAlpha = ripple.life * 0.55;
      ctx.strokeStyle = ripple.mint ? rgba(tone.r2, tone.g2, tone.b2, 1) : rgba(tone.r, tone.g, tone.b, 1);
      ctx.lineWidth = 1.35;
      ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.globalAlpha = ripple.life * 0.22;
      ctx.arc(ripple.x, ripple.y, ripple.r * 0.52, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.life -= 0.03;
      if (spark.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.globalAlpha = spark.life;
      ctx.fillStyle = spark.mint ? rgba(tone.r2, tone.g2, tone.b2, 1) : rgba(tone.r, tone.g, tone.b, 1);
      ctx.arc(spark.x, spark.y, 1.45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (pointer.active) {
      const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 110);
      glow.addColorStop(0, rgba(tone.r, tone.g, tone.b, 0.22));
      glow.addColorStop(0.45, rgba(tone.r2, tone.g2, tone.b2, 0.08));
      glow.addColorStop(1, rgba(tone.r, tone.g, tone.b, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 110, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = window.requestAnimationFrame(step);
  };

  resize();
  seed();
  step();

  window.addEventListener("resize", () => {
    resize();
    seed();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(raf);
    } else {
      raf = window.requestAnimationFrame(step);
    }
  });
})();
