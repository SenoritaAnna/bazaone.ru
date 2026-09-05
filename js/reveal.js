/* ============================================================
   БАЗА — Общий reveal: элементы с [data-reveal] появляются
   при въезде в зону видимости. Vanilla JS, без библиотек.
   ============================================================ */
(function () {
  'use strict';
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  // нет IntersectionObserver — просто показать всё
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('reveal-in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('reveal-in');
      io.unobserve(e.target);   // один раз
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

  els.forEach(function (el) { io.observe(el); });
})();
