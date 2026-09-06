/* ============================================================
   БАЗА — меню: липкая шапка (фон+логотип при скролле)
   + мобильное полноэкранное меню (бургер → крестик).
   Vanilla JS, без библиотек.
   ============================================================ */
(function () {
  'use strict';

  var nav = document.querySelector('[data-nav]');
  if (!nav) return;

  var burger = document.querySelector('[data-burger]');
  var menu = document.querySelector('[data-mobile-menu]');

  var toTop = document.querySelector('[data-totop]');

  /* --- Липкая шапка: тёмный фон + логотип после небольшого скролла --- */
  var ticking = false;
  function applyScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 10);
    // кнопка «наверх» — после прокрутки на ~пол-экрана
    if (toTop) toTop.classList.toggle('is-show', window.scrollY > window.innerHeight * 0.6);
    ticking = false;
  }

  /* --- Кнопка «наверх»: плавный подъём на главную «как лифт» --- */
  if (toTop) toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  });
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(applyScroll); }
  }, { passive: true });
  applyScroll();

  /* --- Мобильное меню --- */
  function setMenu(open) {
    document.body.setAttribute('data-menu-open', open ? 'true' : 'false');
    if (menu) menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (burger) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    }
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (burger) burger.addEventListener('click', function () {
    setMenu(document.body.getAttribute('data-menu-open') !== 'true');
  });

  // кнопка-крестик закрытия
  var closeBtn = document.querySelector('[data-mmenu-close]');
  if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });

  // клик по пункту — закрыть
  if (menu) menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  // ESC — закрыть
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  // если увеличили окно до десктопа при открытом меню — закрыть
  window.addEventListener('resize', function () {
    if (window.innerWidth > 860 && document.body.getAttribute('data-menu-open') === 'true') setMenu(false);
  });

  /* --- Scrollspy: подсветка активного пункта меню по секции на экране --- */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[data-spy]'));
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var navH = 69;
    var byEl = new Map();     // секция -> ссылка
    var sections = [];
    spyLinks.forEach(function (a) {
      var id = a.getAttribute('data-spy');
      var el = id === 'top' ? document.querySelector('.hero') : document.getElementById(id);
      if (el) { byEl.set(el, a); sections.push(el); }
    });

    function setActive(link) {
      spyLinks.forEach(function (a) {
        var on = a === link;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
    }

    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
      });
      var arr = Array.prototype.slice.call(visible);
      if (!arr.length) return;
      // самая верхняя из видимых в активной полосе под шапкой
      arr.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
      var chosen = arr[0];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].getBoundingClientRect().top <= navH + 80) chosen = arr[i];
      }
      setActive(byEl.get(chosen));
    }, { rootMargin: '-' + navH + 'px 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] });

    sections.forEach(function (s) { io.observe(s); });

    // мгновенная подсветка при клике
    spyLinks.forEach(function (a) {
      a.addEventListener('click', function () { setActive(a); });
    });
  }
})();
