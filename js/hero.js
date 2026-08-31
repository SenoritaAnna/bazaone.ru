/* ============================================================
   БАЗА — Hero (Блок 0). Vanilla JS, без библиотек.
   Раскладка по скроллу (как в эталоне enso, не копия):
   1) мужчина и женщина немного расходятся;
   2) мужчина → «&» → женщина уходят влево (внахлёст);
   3) мужчина скрылся: видно «&», женщину и букву «Б»;
   4) женщина скрылась: видно «А», за ней «З»;
   5) завершает последняя «А»;
   6) буквы полностью уходят → появляется текст-описание.
   Дальше (после трека) поднимается Блок 1.
   prefers-reduced-motion: не запускается, сцены статичны (CSS).
   ============================================================ */
(function () {
  'use strict';

  var hero = document.querySelector('[data-hero]');
  if (!hero) return;

  var track = hero.querySelector('[data-hero-track]');
  var typeScene = hero.querySelector('[data-scene="type"]');
  var textScene = hero.querySelector('[data-scene="text"]');
  var logo  = hero.querySelector('.hero-logo');
  var man   = hero.querySelector('.figure--man');
  var amp   = hero.querySelector('.icons__amp');
  var woman = hero.querySelector('.figure--woman');
  var baza  = hero.querySelector('.baza');

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function span(p, s, e) { return clamp((p - s) / (e - s), 0, 1); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function px(v) { return v.toFixed(1) + 'px'; }

  // Гигантское слово: заходит справа (первой «Б»), полностью уходит за левый край.
  var startX = 0, endX = 0;
  function measure() {
    var vw = window.innerWidth;
    var W = baza.getBoundingClientRect().width || vw * 3;
    startX = (vw + W) / 2 + vw * 0.02;   // «Б» полностью за правым краем → въезжает движением
    endX   = -(vw + W) / 2 - vw * 0.05;  // целиком ушло за левый край
  }

  function render(p) {
    var vw = window.innerWidth;
    var travel = vw * 1.35;

    // --- Иконки: сначала расходятся, потом уходят влево БЕЗ наложения ---
    // шаг 1: лёгкое расхождение (мужчина влево, женщина вправо)
    var spread = lerp(0, vw * 0.05, span(p, 0.00, 0.07));
    // КАСКАД (как в эталоне): все едут влево ОДНОВРЕМЕННО, но с РАЗНОЙ скоростью
    // и старт со сдвигом — мужчина трогается первым и быстрее (уходит первым),
    // «&» следом медленнее, женщина самая медленная (уходит последней). И все ГАСНУТ.
    // БОДРО и РАНО: мужчина первый и быстрый, «&» средний, женщина последняя
    var mX = -spread - lerp(0, vw * 1.00, ease(span(p, 0.02, 0.20)));   // мужчина: первый, быстрый
    var aX =          -lerp(0, vw * 1.05, ease(span(p, 0.06, 0.26)));   // «&»: следом
    var wX =  spread - lerp(0, vw * 1.15, ease(span(p, 0.10, 0.32)));   // женщина: последняя

    man.style.setProperty('--man-x', px(mX));
    amp.style.setProperty('--amp-x', px(aX));
    woman.style.setProperty('--woman-x', px(wX));
    // гаснут по мере ухода — ключ к отсутствию «наезда»
    man.style.setProperty('--man-op',     (1 - span(p, 0.10, 0.20)).toFixed(3));
    amp.style.setProperty('--amp-op',     (1 - span(p, 0.16, 0.26)).toFixed(3));
    woman.style.setProperty('--woman-op', (1 - span(p, 0.22, 0.32)).toFixed(3));
    logo.style.setProperty('--logo-op',   (1 - span(p, 0.02, 0.10)).toFixed(3));

    // --- Буквы: «Б» ВЫЕЗЖАЕТ справа РАНО (пока женщина у левого края) и бодро ---
    var typeOp = Math.min(span(p, 0.14, 0.18), 1 - span(p, 0.80, 0.85));
    typeScene.style.setProperty('--type-op', typeOp.toFixed(3));
    var tp = span(p, 0.16, 0.76);         // ЛИНЕЙНО: ранний ровный проезд; в центр ~0.27
    baza.style.setProperty('--tx', px(lerp(startX, endX, tp)));

    // --- Текст-описание: ВЫЕЗЖАЕТ справа и встаёт на место (не просто проявляется) ---
    var tIn = span(p, 0.78, 0.94);
    textScene.style.setProperty('--text-op', span(p, 0.78, 0.86).toFixed(3));
    textScene.style.setProperty('--text-x', px(lerp(vw * 0.6, 0, ease(tIn))));
  }

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
    window.requestAnimationFrame(function () { render(progress()); ticking = false; });
  }

  var bound = false;
  function enable() {
    measure(); render(progress());
    if (!bound) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () { measure(); render(progress()); });
      window.addEventListener('orientationchange', function () { measure(); render(progress()); });
      bound = true;
    }
  }
  function disable() {
    if (bound) window.removeEventListener('scroll', onScroll);
    bound = false;
    [man, amp, woman, logo, typeScene, textScene].forEach(function (el) { el.removeAttribute('style'); });
    baza.style.removeProperty('--tx');
  }
  function apply() { reduceMQ.matches ? disable() : enable(); }

  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', apply);
  else if (reduceMQ.addListener) reduceMQ.addListener(apply);

  window.addEventListener('load', apply);
  apply();
})();
