/* ============================================================
   БАЗА — Блок 4: шаги процесса появляются со стаггером
   при въезде в зону видимости. Vanilla JS, без библиотек.
   ============================================================ */
(function () {
  'use strict';
  var steps = document.querySelectorAll('[data-b4step]');
  if (!steps.length) return;

  if (!('IntersectionObserver' in window)) {
    steps.forEach(function (s) { s.classList.add('b4step--in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('b4step--in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

  steps.forEach(function (s) { io.observe(s); });
})();
