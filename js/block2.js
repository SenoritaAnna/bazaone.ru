/* ============================================================
   БАЗА — Блок 2: появление карточек и запуск схем при въезде
   в зону видимости. Vanilla JS, без библиотек.
   ============================================================ */
(function () {
  'use strict';
  var cards = document.querySelectorAll('[data-b2card]');
  if (!cards.length) return;

  // если IntersectionObserver недоступен — просто показать всё
  if (!('IntersectionObserver' in window)) {
    cards.forEach(function (c) { c.classList.add('b2card--in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('b2card--in');
        io.unobserve(e.target);   // один раз
      }
    });
  }, { threshold: 0.3, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (c) { io.observe(c); });
})();
