/* ==========================================================================
   QR scanner (/qr-scanner)
   Reads QR codes from the camera or from an image (pick, drop or paste), all
   in the browser. Uses the browser's own BarcodeDetector where it reads QR
   codes, and loads jsQR (assets/jsqr.js) only where it doesn't. What the code
   holds is explained by assets/qr-parse.js; decoded text is only ever set as
   textContent, and links open only when the person taps Open.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const els = {
    view: $("qsView"), video: $("qsVideo"), still: $("qsStill"), preview: $("qsPreview"),
    start: $("btnCamera"), stop: $("btnStop"), upload: $("btnUpload"), file: $("qsFile"),
    flip: $("btnFlip"), torch: $("btnTorch"), err: $("scanErr"), live: $("qsLive"),
    result: $("qsResult"), empty: $("qsEmpty"), body: $("qsBody"),
    type: $("qsType"), title: $("qsTitle"), subtitle: $("qsSubtitle"),
    fields: $("qsFields"), notes: $("qsNotes"), raw: $("qsRaw"), rawWrap: $("qsRawWrap"),
    copy: $("btnCopy"), open: $("btnOpen"), save: $("btnSaveContact"), again: $("btnAgain"),
    copyRaw: $("btnCopyRaw"), status: $("qsStatus"),
    mcc: $("qsMcc"), mccCode: $("qsMccCode"), mccName: $("qsMccName"), mccNote: $("qsMccNote"),
  };
  if (!els.view || !window.QR_PARSE) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const work = document.createElement("canvas");
  const ctx = work.getContext("2d", { willReadFrequently: true });

  let stream = null;
  let track = null;
  let timer = 0;
  let busy = false;
  let facing = "environment";
  let torchOn = false;
  let detector;        // undefined: not checked yet; null: unavailable
  let jsqrLoad = null;
  let previewUrl = "";
  let current = null;
  let lastSource = "camera";

  /* ---------- Decoders ---------- */
  async function getDetector() {
    if (detector !== undefined) return detector;
    detector = null;
    try {
      if ("BarcodeDetector" in window) {
        const formats = await window.BarcodeDetector.getSupportedFormats();
        if (formats.includes("qr_code")) detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      }
    } catch { detector = null; }
    return detector;
  }

  function loadJsqr() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    if (!jsqrLoad) {
      jsqrLoad = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = els.view.dataset.jsqr;
        s.onload = () => (window.jsQR ? resolve(window.jsQR) : reject(new Error("jsQR missing")));
        s.onerror = () => { jsqrLoad = null; reject(new Error("jsQR failed to load")); };
        document.head.append(s);
      });
    }
    return jsqrLoad;
  }

  // Draws the source onto a white canvas (with a quiet zone for screenshots cropped tight to the code) and runs jsQR.
  function jsqrRead(source, w, h, max, inversion, pad) {
    const scale = Math.min(1, max / Math.max(w, h));
    const dw = Math.max(1, Math.round(w * scale));
    const dh = Math.max(1, Math.round(h * scale));
    const m = pad ? Math.round(Math.max(dw, dh) * 0.06) : 0;
    work.width = dw + m * 2;
    work.height = dh + m * 2;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, work.width, work.height);
    ctx.drawImage(source, m, m, dw, dh);
    const img = ctx.getImageData(0, 0, work.width, work.height);
    const out = window.jsQR(img.data, work.width, work.height, { inversionAttempts: inversion });
    return out && (out.data || out.binaryData.length) ? out.data : null;
  }

  async function readFrame() {
    const d = await getDetector();
    if (d) {
      const codes = await d.detect(els.video);
      return codes.length ? codes[0].rawValue : null;
    }
    await loadJsqr();
    return jsqrRead(els.video, els.video.videoWidth, els.video.videoHeight, 720, "dontInvert", false);
  }

  async function readImage(img) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const d = await getDetector();
    if (d) {
      try {
        const codes = await d.detect(img);
        if (codes.length) return codes[0].rawValue;
      } catch { /* fall through to jsQR */ }
    }
    try { await loadJsqr(); } catch { return null; }
    const longest = Math.max(w, h);
    const sizes = [...new Set([1200, 800, 1800, 500, 2600].map((s) => Math.min(s, longest)))];
    for (const size of sizes) {
      const text = jsqrRead(img, w, h, size, "attemptBoth", true);
      if (text !== null) return text;
    }
    return null;
  }

  /* ---------- Camera ---------- */
  function cameraError(err) {
    const name = err && err.name;
    if (name === "NotAllowedError" || name === "SecurityError") return "Camera access is blocked. Allow the camera for this site in your browser’s settings, or upload a photo of the code instead.";
    if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found on this device. Upload a photo or screenshot of the code instead.";
    if (name === "NotReadableError" || name === "AbortError") return "The camera is busy in another app or tab. Close it there and try again, or upload a photo.";
    return "The camera couldn’t start. Upload a photo or screenshot of the code instead.";
  }

  function setMode(mode) {
    els.view.dataset.mode = mode;
    const live = mode === "live" || mode === "starting";
    els.start.hidden = live;
    els.stop.hidden = !live;
    if (!live) { els.flip.hidden = true; els.torch.hidden = true; }
  }

  async function startCamera() {
    clearError();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError(window.isSecureContext ? "This browser can’t use the camera here. Upload a photo or screenshot of the code instead." : "The camera only works on a secure (https) page. Upload a photo of the code instead.");
      return;
    }
    stopCamera();
    hideStills();
    setMode("starting");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (err) {
      stream = null;
      setMode(current ? "done" : "idle");
      showError(cameraError(err));
      return;
    }
    track = stream.getVideoTracks()[0];
    els.video.srcObject = stream;
    try { await els.video.play(); } catch { /* autoplay is allowed for muted inline video; ignore a stray rejection */ }
    const settings = track.getSettings ? track.getSettings() : {};
    els.view.classList.toggle("is-mirrored", settings.facingMode === "user" || (!settings.facingMode && facing === "user"));
    setMode("live");
    announce("Camera on. Point it at a QR code.");

    const caps = track.getCapabilities ? track.getCapabilities() : {};
    els.torch.hidden = !caps.torch;
    els.torch.setAttribute("aria-pressed", "false");
    torchOn = false;
    try {
      const cams = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
      els.flip.hidden = cams.length < 2;
    } catch { els.flip.hidden = true; }
    loop();
  }

  function stopCamera() {
    clearTimeout(timer);
    timer = 0;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    track = null;
    els.video.srcObject = null;
  }

  function loop() {
    if (!stream) return;
    timer = setTimeout(async () => {
      if (!stream) return;
      if (!busy && els.video.readyState >= 2 && els.video.videoWidth) {
        busy = true;
        let text = null;
        try { text = await readFrame(); } catch { /* a frame can fail while the stream resizes; try the next one */ }
        busy = false;
        if (text !== null && stream) { found(text, "camera"); return; }
      }
      loop();
    }, 110);
  }

  async function toggleTorch() {
    if (!track) return;
    torchOn = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: torchOn }] });
      els.torch.setAttribute("aria-pressed", String(torchOn));
    } catch {
      torchOn = false;
      els.torch.hidden = true;
    }
  }

  /* ---------- Images ---------- */
  function hideStills() {
    els.still.hidden = true;
    els.preview.hidden = true;
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = ""; }
    els.preview.removeAttribute("src");
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  async function scanFile(file) {
    clearError();
    if (!file) return;
    if (!/^image\//.test(file.type)) { showError("That file isn’t an image. Pick a photo or screenshot (PNG, JPG or WebP)."); return; }
    stopCamera();
    hideStills();
    previewUrl = URL.createObjectURL(file);
    let img;
    try { img = await loadImage(previewUrl); } catch {
      hideStills();
      setMode(current ? "done" : "idle");
      showError("This image couldn’t be opened here. Try a PNG or JPG screenshot.");
      return;
    }
    els.preview.src = previewUrl;
    els.preview.hidden = false;
    setMode("reading");
    announce("Reading the image.");
    const text = await readImage(img);
    if (text === null) {
      setMode("image");
      showError("No QR code found in this image. Crop closer to the code, or use a sharper, well-lit photo.");
      return;
    }
    found(text, "image");
  }

  /* ---------- Result ---------- */
  function found(text, source) {
    lastSource = source;
    if (source === "camera") {
      const v = els.video;
      els.still.width = v.videoWidth;
      els.still.height = v.videoHeight;
      els.still.getContext("2d").drawImage(v, 0, 0);
      els.still.hidden = false;
      stopCamera();
    }
    setMode("done");
    if (navigator.vibrate && touch) navigator.vibrate(30);
    current = window.QR_PARSE.parse(text);
    render(current);
    announce(`QR code found: ${current.label}. ${current.title}`);
    const rect = els.result.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.7 || rect.bottom < 0) {
      els.result.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    }
  }

  // Changes a button's words without touching the glass layers the button mount adds around them.
  function setText(btn, text) {
    const span = btn.querySelector(".qs-btn-text");
    if (span) span.textContent = text;
  }

  function render(r) {
    els.result.dataset.type = r.type;
    els.result.toggleAttribute("data-warn", r.notes.some((n) => n.tone === "warn"));
    els.empty.hidden = true;
    els.body.hidden = false;
    els.type.textContent = r.label;
    els.title.textContent = r.title;
    els.subtitle.textContent = r.subtitle || "";
    els.subtitle.hidden = !r.subtitle;
    renderMcc(r.mcc);

    els.fields.replaceChildren(...r.fields.map((f) => {
      const row = document.createElement("div");
      row.className = "qs-field";
      const dt = document.createElement("dt");
      dt.textContent = f.label;
      const dd = document.createElement("dd");
      dd.textContent = f.value;
      if (f.mono) dd.classList.add("is-mono");
      row.append(dt, dd);
      return row;
    }));
    els.fields.hidden = !r.fields.length;

    els.notes.replaceChildren(...r.notes.map((n) => {
      const li = document.createElement("li");
      li.className = `qs-note is-${n.tone}`;
      li.textContent = n.text;
      return li;
    }));
    els.notes.hidden = !r.notes.length;

    els.raw.textContent = r.raw;
    els.rawWrap.open = r.type === "text";

    els.copy.hidden = !r.copy;
    if (r.copy) setText(els.copy, r.copy.label);

    const open = r.open && (!r.open.phoneOnly || touch) ? r.open : null;
    els.open.hidden = !open;
    if (open) {
      els.open.href = open.href;
      setText(els.open, open.label);
      if (open.external) {
        els.open.target = "_blank";
        els.open.rel = "noopener noreferrer";
      } else {
        els.open.removeAttribute("target");
        els.open.rel = "noreferrer";
      }
    } else {
      els.open.removeAttribute("href");
    }
    els.save.hidden = !r.vcard;
    els.status.textContent = "";

    if (!reduceMotion.matches) {
      els.body.classList.remove("is-in");
      void els.body.offsetWidth;
      els.body.classList.add("is-in");
    }
  }

  // Payment codes: the merchant category code is the headline fact, so it gets its own block.
  function renderMcc(m) {
    els.mcc.hidden = !m;
    if (!m) return;
    els.mcc.dataset.state = m.missing ? "missing" : m.unknown ? "unknown" : "ok";
    els.mccCode.textContent = m.missing === "none" ? "None" : m.code;
    if (m.missing === "none") {
      els.mccName.textContent = "Not in this code";
      els.mccNote.textContent = "Many static UPI QRs (Paytm’s, for example) leave the MCC out. When you pay with a credit card on UPI, the merchant’s bank sets the MCC at the time of payment, so check your card statement for the real one.";
    } else if (m.missing === "placeholder") {
      els.mccName.textContent = "Placeholder, not a real category";
      els.mccNote.textContent = "0000 is used for person-to-person UPI IDs and by many shop QRs (PhonePe’s, for example). The real MCC is set by the merchant’s bank when you pay, so check your card statement for it.";
    } else if (m.missing === "invalid") {
      els.mccName.textContent = "Not a valid MCC";
      els.mccNote.textContent = "An MCC is four digits. This code carries something else, so the category can’t be read from it.";
    } else {
      els.mccName.textContent = m.name;
      els.mccNote.textContent = m.unknown
        ? "This code isn’t in the standard MCC list this page uses. Your card statement will show how the network names it."
        : `Category: ${m.groupLabel}. This is the MCC the QR declares; the merchant’s bank can still send a different one when you pay, and your card statement shows the final one.`;
    }
  }

  let flashTimer = 0;
  function flash(msg) {
    clearTimeout(flashTimer);
    els.status.textContent = msg;
    flashTimer = setTimeout(() => { els.status.textContent = ""; }, 2600);
  }

  async function copyText(value, done) {
    try {
      await navigator.clipboard.writeText(value);
      flash(done);
    } catch {
      flash("Couldn’t copy here. Select the text and copy it instead.");
    }
  }

  function saveContact() {
    if (!current || !current.vcard) return;
    const blob = new Blob([current.vcard], { type: "text/vcard" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(current.title || "contact").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "contact"}.vcf`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    flash("Contact file saved. Open it to add the contact.");
  }

  /* ---------- Messages ---------- */
  function showError(msg) {
    els.err.textContent = msg;
  }
  function clearError() {
    els.err.textContent = "";
  }
  function announce(msg) {
    els.live.textContent = msg;
  }

  /* ---------- Wiring ---------- */
  els.start.addEventListener("click", startCamera);
  els.stop.addEventListener("click", () => {
    stopCamera();
    setMode(current ? "done" : "idle");
    announce("Camera off.");
  });
  els.flip.addEventListener("click", () => {
    facing = facing === "environment" ? "user" : "environment";
    startCamera();
  });
  els.torch.addEventListener("click", toggleTorch);
  els.upload.addEventListener("click", () => els.file.click());
  els.file.addEventListener("change", () => {
    scanFile(els.file.files && els.file.files[0]);
    els.file.value = "";
  });
  els.again.addEventListener("click", () => {
    if (lastSource === "image") { els.file.click(); return; }
    els.view.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "center" });
    startCamera();
  });
  els.copy.addEventListener("click", () => current && current.copy && copyText(current.copy.value, "Copied."));
  els.copyRaw.addEventListener("click", () => current && copyText(current.raw, "Full text copied."));
  els.save.addEventListener("click", saveContact);

  // Drop an image on the viewfinder, or paste a screenshot anywhere on the page.
  ["dragenter", "dragover"].forEach((t) => els.view.addEventListener(t, (e) => {
    if (!e.dataTransfer || ![...e.dataTransfer.types].includes("Files")) return;
    e.preventDefault();
    els.view.classList.add("is-drop");
  }));
  ["dragleave", "drop"].forEach((t) => els.view.addEventListener(t, () => els.view.classList.remove("is-drop")));
  els.view.addEventListener("drop", (e) => {
    const file = e.dataTransfer && e.dataTransfer.files[0];
    if (!file) return;
    e.preventDefault();
    scanFile(file);
  });
  document.addEventListener("paste", (e) => {
    const items = e.clipboardData ? [...e.clipboardData.items] : [];
    const item = items.find((i) => i.kind === "file" && i.type.startsWith("image/"));
    if (!item) return;
    e.preventDefault();
    scanFile(item.getAsFile());
  });

  // Never leave the camera running in a background tab.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && stream) {
      stopCamera();
      setMode(current ? "done" : "idle");
    }
  });
  window.addEventListener("pagehide", stopCamera);

  if (!touch) els.view.classList.add("can-paste");
  setMode("idle");
})();
