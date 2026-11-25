// ACEFA branded slides: adds the logo and layout wrappers for sections with
// an acefa class, so each slide is plain markdown.
//
//   ## Title {.acefa-title}         title slide with the full logo
//   ## Part name {.acefa-section}   navy section divider
//   ## Heading {.acefa-content}     heading and body, optional `::: side` column
//   ## Heading {.acefa-split}       text and figure in halves, figure in `::: side`
//   ## Heading {.acefa-numbers}     key figures from a `::: numbers` list
//
// Add `eyebrow="..."` for the small text above the heading. An image with
// `{.image-left}` or `{.image-right}` gives any layout a full-bleed photo half.

(function () {
  const LOGO = "theme/acefa-lockup.png";
  const LOGO_WHITE = "theme/acefa-lockup-white.png";
  const KINDS = ["acefa-title", "acefa-section", "acefa-content", "acefa-split", "acefa-numbers"];
  const SKIP = "aside.notes, .background-image-div, .background-iframe-div, .background-color-div, .background-video-div";

  const kind = s => KINDS.find(k => s.classList.contains(k));

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function logo(src, cls) {
    const img = el("img", cls);
    img.src = src;
    img.alt = "ACEFA";
    return img;
  }

  function build(section) {
    const k = kind(section);
    const frame = el("div", "acefa-frame");
    const head = el("div", "acefa-head");
    const main = el("div", "acefa-main");
    const body = el("div", "acefa-body");

    const side = section.querySelector(":scope > .side");
    const photo = section.querySelector(":scope img.image-left, :scope img.image-right");
    if (photo) section.classList.add(photo.classList.contains("image-left") ? "has-image-left" : "has-image-right");

    [...section.childNodes].forEach(n => {
      if (n === side) return;
      if (n.nodeType === 1 && (n.matches(SKIP) || (photo && n.contains(photo)))) return;
      if (n.nodeType === 1 && n.tagName === "H2") head.appendChild(n);
      else body.appendChild(n);
    });

    // Quarto stretches lone images to the slide; let the layout size them
    [body, side].forEach(c => c && c.querySelectorAll("img.r-stretch").forEach(img => {
      img.classList.remove("r-stretch");
      img.removeAttribute("style");
    }));

    const h = head.querySelector("h2");
    if (section.dataset.eyebrow) head.insertBefore(el("div", "acefa-eyebrow", section.dataset.eyebrow), h);
    if (k === "acefa-title") {
      head.insertBefore(logo(LOGO_WHITE, "acefa-lockup"), head.firstChild);
      if (h) h.after(el("div", "acefa-rule"));
    } else {
      section.appendChild(logo(k === "acefa-section" ? LOGO_WHITE : LOGO, "acefa-corner"));
    }
    if (k === "acefa-section" || k === "acefa-title") section.prepend(el("div", "acefa-bg"));

    main.appendChild(body);
    if (side) {
      main.appendChild(side);
      section.classList.add("has-side");
    }
    frame.append(head, main);
    section.classList.add("acefa");
    section.appendChild(frame);
  }

  document.querySelectorAll(".reveal .slides section").forEach(s => { if (kind(s)) build(s); });
  if (window.Reveal && Reveal.isReady()) Reveal.sync();
})();
