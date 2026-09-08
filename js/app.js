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

  if (!canvas || reduceMotion) return;

  const field = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  const nodes = [];
  const count = 42;
  let raf = 0;
  const pointer = { x: 0, y: 0, active: false };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * window.devicePixelRatio);
    canvas.height = Math.floor(rect.height * window.devicePixelRatio);
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  };

  const seed = () => {
    nodes.length = 0;
    const viewW = canvas.clientWidth;
    const viewH = canvas.clientHeight;
    for (let i = 0; i < count; i += 1) {
      nodes.push({
        x: Math.random() * viewW,
        y: Math.random() * viewH,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.8,
        mint: i % 5 === 0,
      });
    }
  };

  const step = () => {
    const viewW = canvas.clientWidth;
    const viewH = canvas.clientHeight;
    ctx.clearRect(0, 0, viewW, viewH);

    for (const node of nodes) {
      if (pointer.active) {
        const dx = pointer.x - node.x;
        const dy = pointer.y - node.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 160) {
          node.vx -= (dx / dist) * 0.012;
          node.vy -= (dy / dist) * 0.012;
        }
      }
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > viewW) node.vx *= -1;
      if (node.y < 0 || node.y > viewH) node.vy *= -1;
    }

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = a.mint || b.mint
            ? `rgba(110, 231, 183, ${0.16 - dist / 900})`
            : `rgba(226, 179, 74, ${0.16 - dist / 900})`;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const node of nodes) {
      ctx.beginPath();
      ctx.fillStyle = node.mint ? "#6ee7b7" : "#e2b34a";
      ctx.globalAlpha = 0.85;
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
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

  field?.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });

  field?.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(raf);
    } else {
      raf = window.requestAnimationFrame(step);
    }
  });
})();
