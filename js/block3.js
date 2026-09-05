/* ============================================================
   БАЗА — Блок 3: карточки кейсов появляются со стаггером
   при въезде в зону видимости. Vanilla JS, без библиотек.
   ============================================================ */
(function () {
  'use strict';
  var cards = document.querySelectorAll('[data-b3card]');
  if (!cards.length) return;

  if (!('IntersectionObserver' in window)) {
    cards.forEach(function (c) { c.classList.add('b3card--in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      // лёгкий стаггер внутри строки (0..2), чтобы карточки въезжали волной
      var i = Number(el.getAttribute('data-i') || 0) % 3;
      el.style.transitionDelay = (i * 0.08) + 's';
      el.classList.add('b3card--in');
      io.unobserve(el);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });

  cards.forEach(function (c) { io.observe(c); });
})();
