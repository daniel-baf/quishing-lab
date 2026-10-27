/* Fictitious "Empresa Ficticia" brand layer, injected by the theme proxy.
   Educational demo only. Nothing is stored, captured or sent anywhere. */
(function () {
  'use strict';

  var BRAND = 'Empresa Ficticia';

  // Text replacements. Word-bounded to avoid mangling markup/JSON.
  var REPLACEMENTS = [
    [/\bOWASP\s+Juice\s+Shop\b/gi, BRAND],
    [/\bJuice\s+Shop\s*[-–]\s*OWASP\b/gi, BRAND],
    [/\bJuice\s+Shop\b/gi, BRAND],
    // Localize prices to the Guatemalan quetzal: Juice Shop renders amounts
    // with the generic currency sign (e.g. "1.99¤"); show "Q1.99" instead.
    [/(\d+(?:[.,]\d+)?)\s*¤/g, 'Q$1'],
    // Any stray currency sign (bare "¤", not preceded by a number) -> "Q".
    [/¤/g, 'Q'],
  ];

  function replaceText(node) {
    if (!node || node.nodeType !== 3) return;
    var text = node.nodeValue;
    if (!text || !/[A-Za-z¤]/.test(text)) return;
    var next = text;
    for (var i = 0; i < REPLACEMENTS.length; i++) {
      next = next.replace(REPLACEMENTS[i][0], REPLACEMENTS[i][1]);
    }
    if (next !== text) node.nodeValue = next;
  }

  function walk(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var tag = n.parentNode && n.parentNode.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var n;
    while ((n = walker.nextNode())) replaceText(n);
  }

  function injectLogo() {
    var bar = document.querySelector('mat-toolbar, .mat-toolbar');
    if (!bar || bar.querySelector('.theme-faux-logo')) return;
    var span = document.createElement('span');
    span.className = 'theme-faux-logo';
    span.textContent = BRAND;
    bar.insertBefore(span, bar.firstChild);
  }

  // Juice Shop caps the profile photo at 200000 bytes (multer, baked into the
  // image). Stay safely under that after re-encoding.
  var MAX_UPLOAD_BYTES = 190000;

  // Downscale/compress an image File to a JPEG Blob under MAX_UPLOAD_BYTES,
  // entirely in the browser. Lowers quality first, then dimensions, until it
  // fits. Calls cb(blob) on success or cb(null) if it can't be processed.
  function resizeImage(file, cb) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      function attempt(maxDim, quality) {
        var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        // White backdrop so transparent PNGs don't turn black as JPEG.
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          if (!blob) { cb(null); return; }
          if (blob.size <= MAX_UPLOAD_BYTES) { cb(blob); return; }
          if (quality > 0.5) { attempt(maxDim, quality - 0.1); return; }
          if (maxDim > 320) { attempt(Math.round(maxDim * 0.8), 0.8); return; }
          cb(blob); // give up shrinking; this is as small as we'll get
        }, 'image/jpeg', quality);
      }
      attempt(1024, 0.9);
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }

  // Server-rendered /profile page: the "Upload Picture" form POSTs the whole
  // page. Two rough edges we smooth over, client-side only (no backend change):
  //   1. Submitting with no file makes Juice Shop answer with a raw
  //      {"error":"File is not passed"} JSON page — so keep the button disabled
  //      until a file is chosen, and block an empty submit as a backstop.
  //   2. Images over ~195 KB hit Juice Shop's multer cap (500 "File too large").
  //      Downscale them here and upload the smaller version instead; files
  //      already under the cap submit through untouched.
  function guardProfileUpload() {
    var form = document.querySelector('form[action*="profile/image/file"]');
    if (!form || form.dataset.efGuarded) return;
    var input = form.querySelector('input[type="file"]');
    var btn = form.querySelector('button[type="submit"]');
    if (!input || !btn) return;
    form.dataset.efGuarded = '1';
    function hasFile() { return input.files && input.files.length > 0; }
    function sync() { btn.disabled = !hasFile(); }
    input.addEventListener('change', sync);
    sync();

    form.addEventListener('submit', function (e) {
      if (!hasFile()) { e.preventDefault(); input.focus(); return; }
      var file = input.files[0];
      // Small enough already: let the native form submit through unchanged.
      if (file.size <= MAX_UPLOAD_BYTES) return;
      // Too big: downscale in the browser, then upload the resized blob.
      e.preventDefault();
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Procesando imagen…';
      resizeImage(file, function (blob) {
        if (!blob) { btn.textContent = label; btn.disabled = false; form.submit(); return; }
        var fd = new FormData();
        fd.append('file', blob, 'profile.jpg');
        fetch(form.action, { method: 'POST', body: fd, credentials: 'include' })
          .then(function (res) {
            if (res.ok || res.redirected) { window.location.href = '/profile'; }
            else { btn.textContent = label; btn.disabled = false; }
          })
          .catch(function () { btn.textContent = label; btn.disabled = false; });
      });
    });
  }

  // Replace the native file input's browser-rendered button with one we fully
  // control. Styling ::file-selector-button proved unreliable across browsers,
  // so instead hide the native input (kept functional + accessible) and add our
  // own "Select image" button that opens the picker, plus a filename label.
  function enhanceFilePicker() {
    var input = document.querySelector('form[action*="profile/image/file"] input[type="file"]');
    if (!input || input.dataset.efEnhanced) return;
    input.dataset.efEnhanced = '1';
    input.classList.add('ef-file-native');

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'ef-file-trigger';
    trigger.textContent = 'Select image';

    var name = document.createElement('span');
    name.className = 'ef-file-name';
    name.textContent = 'No file selected';

    input.parentNode.insertBefore(trigger, input.nextSibling);
    trigger.parentNode.insertBefore(name, trigger.nextSibling);

    trigger.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () {
      name.textContent = (input.files && input.files.length)
        ? input.files[0].name
        : 'No file selected';
    });
  }

  function apply() {
    walk(document.body);
    injectLogo();
    enhanceFilePicker();
    guardProfileUpload();
    document.title = BRAND + ' | Portal en línea';
  }

  var pending = null;

  var observer = new MutationObserver(function () {
    if (pending) return;
    pending = setTimeout(function () {
      pending = null;
      apply();
    }, 120);
  });

  document.addEventListener('DOMContentLoaded', function () {
    apply();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
})();