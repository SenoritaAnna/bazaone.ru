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

  /* --- Липкая шапка: тёмный фон + логотип после небольшого скролла --- */
  var ticking = false;
  function applyScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 10);
    ticking = false;
  }
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
})();
