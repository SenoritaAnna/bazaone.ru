/* ============================================================
   БАЗА — Hero scroll controller. Vanilla JS, без библиотек.
   Принцип enso (не копия): pin + scrub.
   Прогресс прокрутки трека 0..1 маппится на сцены:
     иконки Артём/Анна съезжают ВЛЕВО → «БАЗА» выезжает СПРАВА НАЛЕВО.
   prefers-reduced-motion: контроллер не запускается, сцены статичны (CSS).
   ============================================================ */
(function () {
  'use strict';

  var hero = document.querySelector('[data-hero]');
  if (!hero) return;

  var track = hero.querySelector('[data-hero-track]');
  var scenes = {
    icons: hero.querySelector('[data-scene="icons"]'),
    type:  hero.querySelector('[data-scene="type"]')
  };
  var lines = Array.prototype.slice.call(hero.querySelectorAll('[data-line]'));

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  // --- утилиты ---
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function span(p, s, e) { return clamp((p - s) / (e - s), 0, 1); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // «БАЗА» стартует за правым краем экрана и приходит по центру.
  var sweep = { start: 0, end: 0 };
  function measure() {
    var vw = window.innerWidth;
    sweep = { start: vw * 1.05, end: 0 };   // справа за экраном → центр
  }

  function render(p) {
    var vw = window.innerWidth;

    // --- Сцена 1: иконки съезжают ВЛЕВО и гаснут (p 0.05 → 0.40) ---
    var iconsOut = span(p, 0.05, 0.40);
    var e1 = easeInOutCubic(iconsOut);
    scenes.icons.style.setProperty('--icons-x', (-lerp(0, vw * 1.35, e1)).toFixed(1) + 'px');
    scenes.icons.style.setProperty('--icons-op', (1 - span(p, 0.20, 0.40)).toFixed(3));
    scenes.icons.style.setProperty('--amp-op', (0.85 * (1 - span(p, 0.05, 0.22))).toFixed(3));

    // --- Сцена 2: «БАЗА» выезжает СПРАВА НАЛЕВО (p 0.34 → 0.90), потом стоит ---
    scenes.type.style.setProperty('--type-op', span(p, 0.34, 0.46).toFixed(3));
    var tp = easeInOutCubic(span(p, 0.34, 0.90));    // scrub, привязан к скроллу
    var tx = lerp(sweep.start, sweep.end, tp);
    lines.forEach(function (line) {
      line.style.setProperty('--tx', tx.toFixed(1) + 'px');
    });
  }

  // --- цикл через requestAnimationFrame (плавно на desktop и mobile) ---
  var ticking = false;
  function progress() {
    var rect = track.getBoundingClientRect();
    var total = track.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-rect.top / total, 0, 1);
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      render(progress());
      ticking = false;
    });
  }

  var scrollBound = false;
  function enable() {
    measure();
    render(progress());
    if (!scrollBound) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () { measure(); render(progress()); });
      window.addEventListener('orientationchange', function () { measure(); render(progress()); });
      scrollBound = true;
    }
  }
  function disable() {
    if (scrollBound) window.removeEventListener('scroll', onScroll);
    scrollBound = false;
    // сбрасываем инлайновые переменные — CSS покажет статичные сцены
    [scenes.icons, scenes.type].forEach(function (el) { el.removeAttribute('style'); });
    lines.forEach(function (l) { l.style.removeProperty('--tx'); });
  }

  function apply() {
    if (reduceMQ.matches) disable();
    else enable();
  }

  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', apply);
  else if (reduceMQ.addListener) reduceMQ.addListener(apply);

  // ждём загрузки (иконки/шрифт) для точного промера
  window.addEventListener('load', apply);
  apply();
})();
