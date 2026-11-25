/* ===========================================================
   Agentic Automation Professional workbook — shared behaviour
   1) Copy-to-clipboard buttons (reliable, with fallback)
   2) Interactive checklists (click / keyboard, progress saved)
   Loaded at the end of every page.
   =========================================================== */
(function () {
  'use strict';

  /* ---------- 1. Copy to clipboard ---------- */

  function textOf(el) {
    if (!el) return '';
    var t = (typeof el.innerText === 'string' && el.innerText) ? el.innerText : (el.textContent || '');
    return t.replace(/\r/g, '').replace(/\s+$/, '');
  }

  // Terminal blocks show "PS> command" followed by sample output.
  // Copy only the commands (without the "PS> " prompt) so they paste and run cleanly.
  function cleanForCopy(text) {
    var lines = text.split('\n');
    var cmds = [];
    for (var i = 0; i < lines.length; i++) {
      if (/^PS>\s/.test(lines[i]) || /^PS>$/.test(lines[i])) {
        cmds.push(lines[i].replace(/^PS>\s?/, ''));
      }
    }
    return cmds.length ? cmds.join('\n') : text;
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (e) {
      return false;
    }
  }

  function flash(btn, ok) {
    if (!btn) return;
    clearTimeout(btn._timer);
    btn.classList.toggle('copied', !!ok);
    btn.classList.toggle('copy-failed', !ok);
    btn.title = ok ? 'Copied!' : 'Copy failed - select the text and press Ctrl+C';
    btn.setAttribute('aria-label', btn.title);
    btn._timer = setTimeout(function () {
      btn.classList.remove('copied');
      btn.classList.remove('copy-failed');
      btn.title = 'Copy to clipboard';
      btn.setAttribute('aria-label', 'Copy to clipboard');
    }, 2000);
  }

  function copyFromElement(btn, id) {
    var el = document.getElementById(id);
    if (!el) { flash(btn, false); return; }
    var text = cleanForCopy(textOf(el));
    var done = function (ok) { flash(btn, ok); };
    if (navigator.clipboard && navigator.clipboard.writeText && (window.isSecureContext !== false)) {
      navigator.clipboard.writeText(text).then(
        function () { done(true); },
        function () { done(fallbackCopy(text)); }
      );
    } else {
      done(fallbackCopy(text));
    }
  }

  // Names used by the existing buttons in the pages
  window.copyCodeBlock = function (btn, id) { copyFromElement(btn, id); };
  window.copyText = function (btn, id) { copyFromElement(btn, id); };
  window.copySystemPrompt = function (btn) { copyFromElement(btn, 'system-prompt-text'); };
  window.copyAppHtml = function (btn) { copyFromElement(btn, 'app-html-text'); };

  /* ---------- 2. Interactive checklists ---------- */

  var store = {};
  var storageOk = true;
  var STORE_KEY = 'aap-workbook-checklists-v1';

  try {
    store = JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}') || {};
  } catch (e) {
    storageOk = false;
    store = {};
  }

  function save() {
    if (!storageOk) return;
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { storageOk = false; }
  }

  function moduleOf() {
    var m = (window.location.pathname || '').match(/\/(part\d)\//);
    return m ? m[1] : 'root';
  }

  function setChecked(row, on) {
    row.classList.toggle('checked', !!on);
    row.setAttribute('aria-checked', on ? 'true' : 'false');
  }

  function initChecklists() {
    var mod = moduleOf();
    var seen = {};
    var rows = document.querySelectorAll('.checklist .row');
    for (var i = 0; i < rows.length; i++) {
      (function (row) {
        var label = (row.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140);
        seen[label] = (seen[label] || 0) + 1;
        // Same step text in steps.html and lesson-*.html shares one saved state.
        var key = mod + '|' + label + '|' + seen[label];
        row.setAttribute('role', 'checkbox');
        row.setAttribute('tabindex', '0');
        setChecked(row, !!store[key]);

        function toggle() {
          var on = !row.classList.contains('checked');
          setChecked(row, on);
          if (on) store[key] = 1; else delete store[key];
          save();
        }
        row.addEventListener('click', function (ev) {
          var t = ev.target;
          while (t && t !== row) {
            if (t.tagName === 'A') return;   // let links inside a row work normally
            t = t.parentNode;
          }
          toggle();
        });
        row.addEventListener('keydown', function (ev) {
          if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); toggle(); }
        });
      })(rows[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChecklists);
  } else {
    initChecklists();
  }

  /* ---------- 3. Inline copy buttons (names, values, expressions) ---------- */
  function initInlineCopy() {
    var targets = [];
    var cells = document.querySelectorAll('.md-content td');
    for (var i = 0; i < cells.length; i++) {
      var codes = cells[i].querySelectorAll('code');
      if (codes.length === 1 && cells[i].textContent.trim() === codes[0].textContent.trim()) targets.push(codes[0]);
    }
    var marked = document.querySelectorAll('.md-content code.copyable');
    for (var j = 0; j < marked.length; j++) targets.push(marked[j]);
    targets.forEach(function (code) {
      if (code.nextSibling && code.nextSibling.className === 'copy-btn inline-copy') return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn inline-copy';
      btn.title = 'Copy to clipboard';
      btn.setAttribute('aria-label', 'Copy ' + code.textContent);
      btn.addEventListener('click', function () {
        var text = code.textContent;
        var done = function (ok) { flash(btn, ok); };
        if (navigator.clipboard && navigator.clipboard.writeText && (window.isSecureContext !== false)) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
        } else { done(fallbackCopy(text)); }
      });
      code.parentNode.insertBefore(btn, code.nextSibling);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInlineCopy);
  } else {
    initInlineCopy();
  }

  /* ---------- 4. Collapsible panels ---------- */
  var PANEL_KEY = 'aap-workbook-panels-v1';
  function loadPanels() { try { return JSON.parse(window.localStorage.getItem(PANEL_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function savePanels(p) { try { window.localStorage.setItem(PANEL_KEY, JSON.stringify(p)); } catch (e) {} }

  function initPanels() {
    var state = loadPanels();
    var body = document.body, main = document.querySelector('.md-main'), content = document.querySelector('.md-content');
    if (!main || !content) return;

    var header = document.querySelector('.md-header');
    if (header && !header.querySelector('.nav-toggle')) {
      var nb = document.createElement('button');
      nb.type = 'button'; nb.className = 'panel-btn nav-toggle'; nb.innerHTML = '&#9776;';
      header.insertBefore(nb, header.firstChild);
      var setNav = function (hidden) {
        body.classList.toggle('nav-hidden', hidden);
        nb.title = hidden ? 'Show lesson menu' : 'Hide lesson menu';
        nb.setAttribute('aria-label', nb.title);
        nb.setAttribute('aria-expanded', hidden ? 'false' : 'true');
      };
      setNav(!!state.navHidden);
      nb.addEventListener('click', function () {
        state.navHidden = !body.classList.contains('nav-hidden'); setNav(state.navHidden); savePanels(state);
      });
    }

    var heads = content.querySelectorAll('.step .body > h3, .md-content > h2, .md-content > h3');
    var items = [];
    for (var i = 0; i < heads.length; i++) {
      var h = heads[i], stepEl = h.closest ? h.closest('.step') : null;
      var target = stepEl || h;
      if (!target.id) target.id = 'sec-' + (i + 1);
      var numEl = stepEl ? stepEl.querySelector('.num') : null;
      items.push({ id: target.id, text: h.textContent, num: numEl ? numEl.textContent : '', el: target });
    }
    if (items.length < 2) return;
    var aside = document.createElement('aside');
    aside.className = 'md-sidebar md-sidebar--toc';
    aside.setAttribute('aria-label', 'On this page');
    var html = '<div class="toc-head"><span class="toc-title">On this page</span><button type="button" class="panel-btn toc-hide" title="Hide this panel" aria-label="Hide On this page panel">Hide &#8250;</button></div><ul class="toc-list">';
    items.forEach(function (it) {
      html += '<li><a href="#' + it.id + '"><span class="n">' + it.num + '</span><span>' + it.text.replace(/</g, '&lt;') + '</span></a></li>';
    });
    aside.innerHTML = html + '</ul>';
    main.appendChild(aside);
    main.classList.add('has-toc');
    var tab = document.createElement('button');
    tab.type = 'button'; tab.className = 'panel-btn toc-tab'; tab.innerHTML = '&#8249; On this page';
    tab.title = 'Show On this page panel'; tab.setAttribute('aria-label', tab.title);
    body.appendChild(tab);
    var setToc = function (hidden) { body.classList.toggle('toc-hidden', hidden); };
    setToc(!!state.tocHidden);
    aside.querySelector('.toc-hide').addEventListener('click', function () { state.tocHidden = true; setToc(true); savePanels(state); });
    tab.addEventListener('click', function () { state.tocHidden = false; setToc(false); savePanels(state); });

    var links = aside.querySelectorAll('.toc-list a');
    var onScroll = function () {
      var y = window.scrollY + 90, cur = 0;
      for (var k = 0; k < items.length; k++) { if (items[k].el.getBoundingClientRect().top + window.scrollY <= y) cur = k; }
      for (var m = 0; m < links.length; m++) links[m].classList.toggle('active', m === cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanels);
  } else {
    initPanels();
  }
})();
