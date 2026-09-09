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

  const setActive = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
    railLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.rail === id);
    });
  };

  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle("is-scrolled", y > 12);
    if (filament) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      filament.style.height = `${max > 0 ? (y / max) * 100 : 0}%`;
    }

    let current = sections[0]?.id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 140) current = section.id;
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
            <span class="bar" aria-hidden="true"><span style="width:${row.pct}%"></span></span>
            <b>${row.pct}%</b>
          </li>
        `).join("")}
      </ul>
    `;
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

  const setPointer = (x, y) => {
    pointer.tx = x;
    pointer.ty = y;
    pointer.active = true;
    document.documentElement.style.setProperty("--px", `${x}px`);
    document.documentElement.style.setProperty("--py", `${y}px`);
  };

  if (!reduceMotion) {
    if (finePointer) document.body.classList.add("has-cursor");
    window.addEventListener("pointermove", (event) => {
      setPointer(event.clientX, event.clientY);
      cursor?.classList.add("is-on");
      if (Math.random() > 0.55) {
        sparks.push({
          x: event.clientX,
          y: event.clientY,
          vx: (Math.random() - 0.5) * 1.6,
          vy: (Math.random() - 0.5) * 1.6,
          life: 1,
          mint: Math.random() > 0.55,
        });
        if (sparks.length > 90) sparks.shift();
      }
    }, { passive: true });
    window.addEventListener("pointerdown", () => cursor?.classList.add("is-down"));
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
  }

  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const nodes = [];
  const count = 72;
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
      nodes.push({
        x: Math.random() * viewW,
        y: Math.random() * viewH,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 2.1 + 1,
        mint: i % 4 === 0,
      });
    }
  };

  const step = () => {
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
        if (dist < 280) {
          const pull = (1 - dist / 280) * 0.08;
          node.vx += (dx / dist) * pull;
          node.vy += (dy / dist) * pull;
          node.vx += (-dy / dist) * 0.012;
          node.vy += (dx / dist) * 0.012;
        }
      }
      node.vx *= 0.985;
      node.vy *= 0.985;
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > viewW) node.vx *= -1;
      if (node.y < 0 || node.y > viewH) node.vy *= -1;
      node.x = Math.max(0, Math.min(viewW, node.x));
      node.y = Math.max(0, Math.min(viewH, node.y));
    }

    if (pointer.active) {
      for (const node of nodes) {
        const dist = Math.hypot(pointer.x - node.x, pointer.y - node.y);
        if (dist < 240) {
          ctx.beginPath();
          ctx.strokeStyle = node.mint
            ? `rgba(110, 231, 183, ${0.42 - dist / 800})`
            : `rgba(226, 179, 74, ${0.4 - dist / 800})`;
          ctx.lineWidth = 1;
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(node.x, node.y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 128) {
          ctx.beginPath();
          ctx.strokeStyle = a.mint || b.mint
            ? `rgba(110, 231, 183, ${0.14 - dist / 1100})`
            : `rgba(226, 179, 74, ${0.14 - dist / 1100})`;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const node of nodes) {
      ctx.beginPath();
      ctx.fillStyle = node.mint ? "#6ee7b7" : "#e2b34a";
      ctx.globalAlpha = 0.9;
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
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
      ctx.fillStyle = spark.mint ? "#6ee7b7" : "#f0c86a";
      ctx.arc(spark.x, spark.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (pointer.active) {
      const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 90);
      glow.addColorStop(0, "rgba(226, 179, 74, 0.18)");
      glow.addColorStop(1, "rgba(226, 179, 74, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 90, 0, Math.PI * 2);
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
