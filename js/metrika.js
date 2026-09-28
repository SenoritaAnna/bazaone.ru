/* ============================================================
   БАЗА — Яндекс Метрика, ТОЛЬКО после согласия на cookie.
   - согласие уже дано (localStorage) → грузим сразу
   - иначе ждём событие 'baza:cookie-consent' от cookie.js
   - «Отклонить» → счётчик не загружается вовсе
   Цели (настраиваются в интерфейсе Метрики как «JavaScript-событие»):
     lead_sent    — заявка ушла на сервер
     lead_failed  — сервер не ответил, показаны запасные варианты
     lead_resent  — неотправленная заявка дослана при следующем заходе
   Вебвизор выключен: он записывает ввод в формы (ПДн).
   Vanilla JS, без библиотек.
   ============================================================ */
(function () {
  'use strict';

  var ID = 112432279;
  var KEY = 'baza_cookie_consent';
  var loaded = false;

  function load() {
    if (loaded) return; loaded = true;
    /* официальный код Метрики */
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

    window.ym(ID, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false
    });
  }

  window.BAZA = window.BAZA || {};
  /* цель: безопасно вызывать откуда угодно — без согласия просто ничего не делает */
  window.BAZA.goal = function (name, params) {
    if (loaded && typeof window.ym === 'function') window.ym(ID, 'reachGoal', name, params);
  };

  var consent = null;
  try { consent = localStorage.getItem(KEY); } catch (e) {}

  if (consent === 'accepted') load();
  else document.addEventListener('baza:cookie-consent', function (e) {
    if (e.detail === 'accepted') load();
  });
})();
