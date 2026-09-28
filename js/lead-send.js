/* ============================================================
   БАЗА — общая отправка заявок (главная + форум).
   - POST JSON на endpoint из <meta name="form-endpoint">
   - таймаут 12 с, один повтор при сбое сети / 5xx
   - при неудаче: форма НЕ очищается, показываем понятное сообщение
     с кнопками «Написать на почту» и «Скопировать заявку»
     (почтовый клиент сам больше не открывается)
   - неотправленная заявка сохраняется в браузере и тихо
     досылается при следующем заходе на сайт
   Vanilla JS, без библиотек.
   ============================================================ */
(function () {
  'use strict';

  var MAIL = 'go@bazaone.ru';
  var PENDING_KEY = 'baza_pending_leads';
  var TIMEOUT_MS = 12000;
  var RETRY_DELAY_MS = 1500;
  var PENDING_MAX_AGE_MS = 14 * 24 * 3600 * 1000;

  function endpoint() {
    return window.BAZA_FORM_ENDPOINT ||
      ((document.querySelector('meta[name="form-endpoint"]') || {}).content || '');
  }

  function bodyText(data) {
    return Object.keys(data).map(function (k) {
      var v = data[k]; if (Array.isArray(v)) v = v.join(', ');
      return k + ': ' + v;
    }).join('\n');
  }

  function mailtoHref(data) {
    var subject = data['Форма'] || 'Заявка с сайта БАЗА';
    return 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(bodyText(data));
  }

  /* --- один запрос с таймаутом; ошибка = сеть, таймаут или не-2xx --- */
  function post(url, data) {
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
      return r.text();
    }).finally(function () { if (timer) clearTimeout(timer); });
  }

  /* --- повтор только для временных сбоев (сеть, таймаут, 5xx, 429) --- */
  function postWithRetry(url, data) {
    return post(url, data).catch(function (e) {
      var transient = !e.status || e.status >= 500 || e.status === 429;
      if (!transient) throw e;
      return new Promise(function (res) { setTimeout(res, RETRY_DELAY_MS); })
        .then(function () { return post(url, data); });
    });
  }

  /* --- очередь неотправленных заявок в localStorage --- */
  function readPending() {
    try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]') || []; }
    catch (e) { return []; }
  }
  function writePending(list) {
    try {
      if (list.length) localStorage.setItem(PENDING_KEY, JSON.stringify(list));
      else localStorage.removeItem(PENDING_KEY);
    } catch (e) { /* приватный режим / хранилище недоступно */ }
  }
  function savePending(data) {
    var list = readPending();
    list.push({ t: Date.now(), data: data });
    writePending(list.slice(-5));
  }
  function flushPending() {
    var url = endpoint(); if (!url) return;
    var now = Date.now();
    var list = readPending().filter(function (x) { return x && x.data && now - x.t < PENDING_MAX_AGE_MS; });
    writePending(list);
    list.reduce(function (chain, item) {
      return chain.then(function () {
        var data = Object.assign({}, item.data, { 'Повторная отправка': 'да (не ушла с первой попытки)' });
        return post(url, data).then(function () {
          writePending(readPending().filter(function (x) { return x.t !== item.t; }));
        });
      });
    }, Promise.resolve()).catch(function () { /* попробуем при следующем заходе */ });
  }

  /* --- блок с запасными вариантами под формой --- */
  function renderFallback(noteEl, data) {
    if (!noteEl) return;
    noteEl.textContent = '';
    noteEl.classList.remove('is-ok');
    noteEl.classList.add('is-error');

    var p = document.createElement('span');
    p.className = 'lead-fallback__text';
    p.textContent = 'Не получилось отправить заявку: сервер не ответил. Данные остались в форме — ' +
      'отправьте их нам на почту ' + MAIL + ', мы ответим так же быстро.';
    noteEl.appendChild(p);

    var row = document.createElement('span');
    row.className = 'lead-fallback__actions';

    var mail = document.createElement('a');
    mail.className = 'lead-fallback__btn';
    mail.href = mailtoHref(data);
    mail.textContent = 'Написать на почту';
    row.appendChild(mail);

    if (navigator.clipboard && window.isSecureContext) {
      var copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'lead-fallback__btn';
      copy.textContent = 'Скопировать заявку';
      copy.addEventListener('click', function () {
        navigator.clipboard.writeText('Кому: ' + MAIL + '\n\n' + bodyText(data)).then(function () {
          copy.textContent = 'Скопировано ✓';
        }, function () { copy.textContent = 'Не удалось скопировать'; });
      });
      row.appendChild(copy);
    }
    noteEl.appendChild(row);
  }

  /**
   * Отправить заявку.
   * opts: { form, data, noteEl, note(text, kind), onSuccess() }
   */
  function sendLead(opts) {
    var url = endpoint();
    var btn = opts.form && opts.form.querySelector('button[type="submit"]');

    if (!url) { renderFallback(opts.noteEl, opts.data); return; }

    if (btn) btn.disabled = true;
    opts.note('Отправляем заявку…');

    postWithRetry(url, opts.data)
      .then(function () {
        opts.note('Спасибо! Заявка отправлена — мы свяжемся с вами.', 'is-ok');
        if (opts.onSuccess) opts.onSuccess();
      })
      .catch(function () {
        savePending(opts.data);
        renderFallback(opts.noteEl, opts.data);
      })
      .finally(function () { if (btn) btn.disabled = false; });
  }

  window.BAZA = window.BAZA || {};
  window.BAZA.sendLead = sendLead;

  // досылаем то, что не ушло в прошлый раз (после загрузки, чтобы не мешать странице)
  if (document.readyState === 'complete') setTimeout(flushPending, 2000);
  else window.addEventListener('load', function () { setTimeout(flushPending, 2000); });
})();
