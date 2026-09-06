/* ============================================================
   БАЗА — форма заявки: мат-капча (анти-бот), валидация,
   временная отправка через mailto (до подключения сервера).
   Vanilla JS, без библиотек.
   ============================================================ */
(function () {
  'use strict';

  var form = document.querySelector('[data-lead-form]');
  if (!form) return;

  var qEl    = form.querySelector('[data-captcha-q]');
  var noteEl = form.querySelector('[data-form-note]');
  var nameEl = form.querySelector('input[name="name"]');
  var mailEl = form.querySelector('input[name="email"]');
  var msgEl  = form.querySelector('textarea[name="message"]');
  var capEl  = form.querySelector('input[name="captcha"]');
  var consEl = form.querySelector('[data-consent]');

  var answer = 0;

  // --- Генерация примера: числа до 20, сложение или вычитание ---
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function newCaptcha() {
    var a, b, op;
    if (Math.random() < 0.5) {           // вычитание, результат >= 0
      a = rand(6, 20); b = rand(1, a - 1); op = '−'; answer = a - b;
    } else {                              // сложение, сумма <= 20
      a = rand(2, 15); b = rand(1, 20 - a); op = '+'; answer = a + b;
    }
    if (qEl) qEl.textContent = a + ' ' + op + ' ' + b + ' =';
  }
  newCaptcha();

  function setNote(text, kind) {
    if (!noteEl) return;
    noteEl.textContent = text || '';
    noteEl.classList.remove('is-error', 'is-ok');
    if (kind) noteEl.classList.add(kind);
  }
  function markErr(el, on) { if (el) el.classList.toggle('is-error', !!on); }
  function clearErr() {
    [nameEl, mailEl, msgEl, capEl].forEach(function (e) { markErr(e, false); });
    var cw = form.querySelector('.b6form__consent');
    if (cw) cw.classList.remove('is-error');
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErr();

    var name = (nameEl.value || '').trim();
    var mail = (mailEl.value || '').trim();
    var msg  = (msgEl.value || '').trim();
    var cap  = (capEl.value || '').trim();

    if (!name) { markErr(nameEl, true); nameEl.focus(); return setNote('Пожалуйста, укажите имя.', 'is-error'); }
    if (!EMAIL_RE.test(mail)) { markErr(mailEl, true); mailEl.focus(); return setNote('Проверьте адрес e-mail.', 'is-error'); }
    if (!msg) { markErr(msgEl, true); msgEl.focus(); return setNote('Напишите пару слов о задаче.', 'is-error'); }

    // согласие на обработку персональных данных обязательно
    if (consEl && !consEl.checked) {
      var cw = consEl.closest('.b6form__consent');
      if (cw) cw.classList.add('is-error');
      consEl.focus();
      return setNote('Отметьте согласие на обработку персональных данных.', 'is-error');
    }

    // анти-бот: сверяем ответ на пример
    if (String(cap) !== String(answer)) {
      markErr(capEl, true);
      newCaptcha();                       // меняем пример при ошибке
      capEl.value = '';
      capEl.focus();
      return setNote('Неверный ответ на пример. Попробуйте ещё раз.', 'is-error');
    }

    // --- Временная отправка через почтовый клиент посетителя ---
    // (на этапе 3 заменим на прямую отправку через сервер Selectel)
    var subject = 'Заявка с сайта БАЗА — ' + name;
    var body =
      'Имя: ' + name + '\n' +
      'E-mail: ' + mail + '\n\n' +
      'Комментарий:\n' + msg + '\n';
    var href = 'mailto:go@bazaone.ru?subject=' + encodeURIComponent(subject) +
               '&body=' + encodeURIComponent(body);

    setNote('Открываем ваш почтовый клиент для отправки заявки…', 'is-ok');
    window.location.href = href;
  });
})();
