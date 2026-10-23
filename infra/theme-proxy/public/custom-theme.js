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

  function apply() {
    walk(document.body);
    injectLogo();
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