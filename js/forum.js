/* ============================================================
   БАЗА — страница /forum: выбор диагностики карточками,
   валидация форм, мат-капча (анти-бот), отправка на бэкенд
   (window.BAZA_FORM_ENDPOINT) с запасным mailto. Vanilla JS.
   ============================================================ */
(function () {
  'use strict';

  function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

  var freeForm = document.querySelector('[data-lead-form="Форум — бесплатная диагностика"]');

  /* --- Карточки диагностик → выбор в форме + скролл --- */
  document.querySelectorAll('.fx-card[data-diag]').forEach(function (card) {
    card.addEventListener('click', function () {
      var val = card.getAttribute('data-diag');
      var radio = freeForm && freeForm.querySelector('input[name="Диагностика"][value="' + val + '"]');
      if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
      var target = document.getElementById('free-form');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* --- Подсветка выбранного радио + синхронизация карточек --- */
  document.querySelectorAll('.fx-choose').forEach(function (group) {
    group.addEventListener('change', function () {
      group.querySelectorAll('.fx-choice').forEach(function (ch) {
        var r = ch.querySelector('input'); ch.classList.toggle('is-active', !!(r && r.checked));
      });
      group.classList.remove('is-error');
      var checked = group.querySelector('input:checked');
      document.querySelectorAll('.fx-card').forEach(function (c) {
        c.classList.toggle('is-selected', !!checked && c.getAttribute('data-diag') === checked.value);
      });
    });
  });

  /* --- Обработка каждой формы --- */
  document.querySelectorAll('[data-lead-form]').forEach(function (form) {
    var qEl = form.querySelector('[data-captcha-q]');
    var capEl = form.querySelector('input[name="captcha"]');
    var noteEl = form.querySelector('[data-form-note]');
    var consEl = form.querySelector('[data-consent]');
    var answer = 0;

    function newCaptcha() {
      var a, b, op;
      if (Math.random() < 0.5) { a = rand(6, 20); b = rand(1, a - 1); op = '−'; answer = a - b; }
      else { a = rand(2, 15); b = rand(1, 20 - a); op = '+'; answer = a + b; }
      if (qEl) qEl.textContent = a + ' ' + op + ' ' + b + ' =';
    }
    newCaptcha();

    function note(t, k) { if (!noteEl) return; noteEl.textContent = t || ''; noteEl.classList.remove('is-error', 'is-ok'); if (k) noteEl.classList.add(k); }
    function err(el, on) { if (el) el.classList.toggle('is-error', !!on); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.querySelectorAll('.is-error').forEach(function (el) { el.classList.remove('is-error'); });

      // обязательные текстовые поля
      var firstBad = null;
      form.querySelectorAll('input[required], textarea[required]').forEach(function (el) {
        if (el.type === 'radio' || el.type === 'checkbox') return;
        if (!(el.value || '').trim()) { err(el, true); if (!firstBad) firstBad = el; }
      });
      if (firstBad) { firstBad.focus(); return note('Заполните обязательные поля.', 'is-error'); }

      // обязательная радио-группа (выбор диагностики)
      var reqRadio = form.querySelector('input[type="radio"][required]');
      if (reqRadio && !form.querySelector('input[name="' + reqRadio.name + '"]:checked')) {
        var grp = reqRadio.closest('.fx-choose'); if (grp) grp.classList.add('is-error');
        return note('Выберите одну диагностику.', 'is-error');
      }

      // согласие
      if (consEl && !consEl.checked) {
        var cw = consEl.closest('.fx-consent'); if (cw) cw.classList.add('is-error');
        consEl.focus(); return note('Отметьте согласие на обработку персональных данных.', 'is-error');
      }

      // анти-бот
      if (String((capEl.value || '').trim()) !== String(answer)) {
        err(capEl, true); newCaptcha(); capEl.value = ''; capEl.focus();
        return note('Неверный ответ на пример. Попробуйте ещё раз.', 'is-error');
      }

      // сбор данных
      var data = {};
      form.querySelectorAll('input, textarea, select').forEach(function (el) {
        if (!el.name || el.name === 'captcha') return;
        if (el.type === 'checkbox') { if (el.checked) { (data[el.name] = data[el.name] || []).push(el.value); } }
        else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
        else { var v = (el.value || '').trim(); if (v) data[el.name] = v; }
      });
      data['Форма'] = form.getAttribute('data-lead-form');

      send(form, data, note);
    });
  });

  function bodyText(data) {
    return Object.keys(data).map(function (k) {
      var v = data[k]; if (Array.isArray(v)) v = v.join(', ');
      return k + ': ' + v;
    }).join('\n');
  }

  function mailtoFallback(data) {
    var subject = data['Форма'] || 'Заявка с сайта БАЗА';
    window.location.href = 'mailto:go@bazaone.ru?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(bodyText(data));
  }

  function send(form, data, note) {
    var endpoint = window.BAZA_FORM_ENDPOINT ||
      ((document.querySelector('meta[name="form-endpoint"]') || {}).content || '');
    if (!endpoint) { mailtoFallback(data); return note('Открываем ваш почтовый клиент для отправки заявки…', 'is-ok'); }

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    note('Отправляем заявку…');
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error('bad status'); return r.text(); })
      .then(function () {
        note('Спасибо! Заявка отправлена — мы свяжемся с вами.', 'is-ok');
        form.reset();
        form.querySelectorAll('.is-active, .is-selected').forEach(function (el) { el.classList.remove('is-active', 'is-selected'); });
        document.querySelectorAll('.fx-card.is-selected').forEach(function (c) { c.classList.remove('is-selected'); });
      })
      .catch(function () { mailtoFallback(data); note('Открываем ваш почтовый клиент для отправки заявки…', 'is-ok'); })
      .finally(function () { if (btn) btn.disabled = false; });
  }
})();
