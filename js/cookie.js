/* ============================================================
   БАЗА — баннер согласия на cookie: показать при первом заходе,
   запомнить выбор (принял / отклонил). Vanilla JS, без библиотек.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'baza_cookie_consent';   // 'accepted' | 'declined'
  var bar = document.querySelector('[data-cookie]');
  if (!bar) return;

  var choice;
  try { choice = localStorage.getItem(KEY); } catch (e) { choice = null; }
  if (choice === 'accepted' || choice === 'declined') return;   // выбор уже сделан

  // показать плашку
  bar.hidden = false;
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { bar.classList.add('is-show'); });
  });

  function decide(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
    bar.classList.remove('is-show');
    setTimeout(function () { bar.hidden = true; }, 400);
  }

  var acceptBtn = bar.querySelector('[data-cookie-accept]');
  var declineBtn = bar.querySelector('[data-cookie-decline]');
  if (acceptBtn) acceptBtn.addEventListener('click', function () { decide('accepted'); });
  if (declineBtn) declineBtn.addEventListener('click', function () { decide('declined'); });
})();
