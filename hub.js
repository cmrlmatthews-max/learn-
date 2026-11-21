/* Hub page script. Classic script. The page works as plain links when SharedUI is missing. */
(function () {
  'use strict';

  var UI = window.SharedUI || null;
  var $ = function (id) { return document.getElementById(id); };

  var cards = Array.prototype.slice.call(document.querySelectorAll('#cards .card'));

  /* ---------- Search ---------- */
  var q = $('q');
  var countEl = $('count');
  var emptyEl = $('empty');

  function plural(n) { return n + (n === 1 ? ' module' : ' modules'); }

  function filter() {
    var terms = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var shown = 0;
    cards.forEach(function (card) {
      var text = (card.textContent || '').toLowerCase();
      var match = terms.every(function (t) { return text.indexOf(t) !== -1; });
      card.hidden = !match;
      if (match) shown += 1;
    });
    countEl.textContent = terms.length ? shown + ' of ' + plural(cards.length) : plural(cards.length);
    emptyEl.hidden = shown !== 0;
  }
  q.addEventListener('input', filter);
  filter();

  if (!UI) return; // Degrade: cards stay plain links; Continue and Data stay hidden.

  /* ---------- Continue ---------- */
  var contSection = $('continue');
  var contList = $('continue-list');

  function safeUrl(url) {
    try {
      var u = new URL(url, location.href);
      return u.origin === location.origin ? u.pathname + u.search + u.hash : null;
    } catch (e) { return null; }
  }

  function validRecords() {
    var all = [];
    try { all = UI.resume.all() || []; } catch (e) { all = []; }
    return all.filter(function (r) {
      return r && typeof r.title === 'string' && r.title && safeUrl(r.url);
    });
  }

  function renderContinue() {
    var records = validRecords();
    contList.textContent = '';
    records.slice(0, 3).forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'continue-item';
      var a = document.createElement('a');
      a.href = safeUrl(r.url);
      var main = document.createElement('span');
      main.textContent = 'Continue: ' + r.title + (r.label ? ' — ' + r.label : '');
      a.appendChild(main);
      li.appendChild(a);
      contList.appendChild(li);
    });
    contSection.hidden = records.length === 0;

    cards.forEach(function (card) {
      var link = card.querySelector('.card-continue');
      var rec = null;
      try { rec = UI.resume.get(card.getAttribute('data-id')); } catch (e) { rec = null; }
      var href = rec && safeUrl(rec.url);
      if (rec && href && rec.label) {
        link.href = href;
        link.textContent = 'Continue: ' + rec.label;
        link.hidden = false;
      } else {
        link.hidden = true;
        link.textContent = '';
      }
    });
  }
  renderContinue();
  window.addEventListener('pageshow', renderContinue);
  window.addEventListener('storage', renderContinue);

  /* ---------- Data: export and import ---------- */
  var dataEl = $('data');
  var statusEl = $('data-status');
  var confirmEl = $('confirm');
  var confirmText = $('confirm-text');
  var confirmGo = $('confirm-go');
  var fileInput = $('file');
  var pending = null;

  dataEl.hidden = false;

  function say(msg, isError) {
    statusEl.textContent = msg;
    statusEl.classList.toggle('is-error', !!isError);
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  $('export').addEventListener('click', function () {
    var data;
    try { data = UI.exportData(['']); } catch (e) { say('Export failed.', true); return; }
    var n = Object.keys(data || {}).length;
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'learn-progress-' + today() + '.json';
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    say('Exported ' + n + (n === 1 ? ' entry.' : ' entries.'));
  });

  function closeConfirm() {
    confirmEl.hidden = true;
    pending = null;
    fileInput.value = '';
  }

  $('import').addEventListener('click', function () {
    closeConfirm();
    say('');
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onerror = function () { say('The file could not be read.', true); };
    reader.onload = function () {
      var obj;
      try { obj = JSON.parse(String(reader.result)); } catch (e) { obj = null; }
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        say('That file is not a progress export. Nothing was changed.', true);
        return;
      }
      var n = Object.keys(obj).length;
      if (n === 0) { say('That file holds no entries. Nothing was changed.', true); return; }
      pending = obj;
      confirmText.textContent = 'This file holds ' + n + (n === 1 ? ' entry' : ' entries') +
        '. Importing replaces any saved progress with the same names on this device.';
      confirmGo.textContent = 'Import ' + n + (n === 1 ? ' entry' : ' entries');
      confirmEl.hidden = false;
      say('');
      try { UI.focusTo(confirmText); } catch (e) { confirmText.focus(); }
    };
    reader.readAsText(file);
  });

  confirmGo.addEventListener('click', function () {
    if (!pending) return;
    var count = 0;
    try { count = UI.importData(pending); } catch (e) { count = -1; }
    closeConfirm();
    if (count < 0) { say('Import failed. Nothing was changed.', true); }
    else { say('Imported ' + count + (count === 1 ? ' entry.' : ' entries.')); renderContinue(); }
    statusEl.focus();
  });

  $('confirm-cancel').addEventListener('click', function () {
    closeConfirm();
    say('Import canceled. Nothing was changed.');
    $('import').focus();
  });
})();
