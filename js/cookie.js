/* ============================================================
   БАЗА — уведомление о cookie: показать один раз, запомнить согласие.
   Vanilla JS, без библиотек.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'baza_cookie_ok';
  var bar = document.querySelector('[data-cookie]');
  if (!bar) return;

  var accepted;
  try { accepted = localStorage.getItem(KEY) === '1'; } catch (e) { accepted = false; }
  if (accepted) return;                      // уже принято — не показываем

  // показать плашку
  bar.hidden = false;
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { bar.classList.add('is-show'); });
  });

  var btn = bar.querySelector('[data-cookie-accept]');
  if (btn) btn.addEventListener('click', function () {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
    bar.classList.remove('is-show');
    setTimeout(function () { bar.hidden = true; }, 400);
  });
})();
