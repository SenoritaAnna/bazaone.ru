/* ============================================================
   БАЗА — новая главная (HOME_FINAL_V1): сюжет одного рабочего дня.
   Всё движение привязано к скроллу; без библиотек и внешних ресурсов.
   prefers-reduced-motion → сразу финальные кадры, без анимаций.
   ============================================================ */
(function () {
  'use strict';

  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var doc = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* --- прогресс элемента: 0 — верх элемента на линии start (доля экрана), 1 — на линии end --- */
  function progress(el, start, end) {
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    var from = vh * start, to = vh * end;
    return clamp((from - r.top) / ((from - to) || 1), 0, 1);
  }
  function stickyProgress(track) {
    var r = track.getBoundingClientRect(), vh = window.innerHeight;
    var total = r.height - vh;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
  }

  /* --- шапка и мобильное меню --- */
  var top = $('[data-top]');
  var menuBtn = $('[data-menu]'), mnav = $('[data-mnav]');
  if (menuBtn && mnav) {
    menuBtn.addEventListener('click', function () {
      var open = !mnav.classList.contains('is-open');
      mnav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', mnav).forEach(function (a) {
      a.addEventListener('click', function () { mnav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* --- появление блоков --- */
  var inEls = $$('[data-in]');
  if (RM || !('IntersectionObserver' in window)) {
    inEls.forEach(function (e) { e.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    inEls.forEach(function (e) { io.observe(e); });
  }

  /* --- досчёт чисел на Пульте --- */
  function countUp(el) {
    var to = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (RM) { el.textContent = to; return; }
    var t0 = null, dur = 650;
    function step(t) {
      if (!t0) t0 = t;
      var k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
    }, { threshold: .6 });
    counters.forEach(function (c) { c.textContent = RM ? c.getAttribute('data-count') : '0'; cio.observe(c); });
  } else counters.forEach(function (c) { c.textContent = c.getAttribute('data-count'); });

  /* --- лента «Последние изменения»: новые строки, пока Пульт на экране --- */
  var feed = $('[data-feed]');
  // только типы, которые реально попадают в «Изменилось» (дела, решения, сверки, входящие, клиенты)
  var feedQueue = [
    ['8:52', 'Дело «Звонок» отмечено выполненным', 'Дела · ООО «Северный ветер»'],
    ['8:55', 'Сверка подтверждена человеком', 'Сверки · ООО «Лесная гавань»'],
    ['9:01', 'Ответственный клиента назначен', 'Клиенты · ИП Орлова']
  ];
  if (feed && !RM && 'IntersectionObserver' in window) {
    var feedTimer = null, feedVisible = false;
    var pushLine = function () {
      if (!feedVisible || !feedQueue.length) return;
      var d = feedQueue.shift();
      var li = document.createElement('li');
      li.className = 'is-new';
      li.innerHTML = '<time>' + d[0] + '</time><span><b>' + d[1] + '</b><span class="src">' + d[2] + '</span></span>';
      feed.insertBefore(li, feed.firstChild);
      if (feed.children.length > 5) feed.removeChild(feed.lastElementChild);
    };
    new IntersectionObserver(function (es) {
      feedVisible = es[0].isIntersecting;
      if (feedVisible && !feedTimer) feedTimer = setInterval(pushLine, 5200);
      if (!feedVisible && feedTimer) { clearInterval(feedTimer); feedTimer = null; }
    }, { threshold: .4 }).observe(feed);
  }

  /* --- нити и граф: длина пути → CSS-переменная --- */
  var draws = $$('[data-draw]');
  draws.forEach(function (svg) {
    $$('path', svg).forEach(function (p) {
      try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch (e) {}
    });
  });

  /* --- Ба́зика выглядывает, когда сигнал на экране --- */
  var bz = $('[data-bz]');
  if (bz) {
    if (RM || !('IntersectionObserver' in window)) bz.classList.add('is-on');
    else new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) bz.classList.add('is-on');
    }, { threshold: .45 }).observe(bz);
  }

  /* --- масштаб 2–30: «места за столом» --- */
  var seats = $('[data-seats]');
  if (seats) {
    var grid = $('[data-seat-grid]', seats);
    for (var i = 0; i < 30; i++) { var s = document.createElement('i'); s.className = 'seat'; grid.appendChild(s); }
    $$('[data-seat-mode]', seats).forEach(function (b) {
      var on = function () {
        seats.setAttribute('data-mode', b.getAttribute('data-seat-mode'));
        $$('[data-seat-mode]', seats).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      };
      b.addEventListener('click', on);
      b.addEventListener('mouseenter', on);
      b.addEventListener('focus', on);
    });
  }

  /* --- часы дня: время активной главы --- */
  var clock = $('[data-clock]'), clockT = $('[data-clock-t]'), clockL = $('[data-clock-l]'), clockDot = $('[data-clock-dot]');
  var chapters = $$('[data-time]');
  function setClock(t, label) {
    if (!clock || clockT.textContent === t) return;
    clockT.textContent = t; clockL.textContent = label || '';
    var hm = t.split(':'), h = (+hm[0] % 12) + (+hm[1] / 60);
    clockDot.style.setProperty('--a', (h * 30) + 'deg');
  }

  /* --- сцены дня (sticky): какая сцена активна --- */
  var day = $('[data-day]');
  var dayTrack = day && $('[data-day-track]', day);
  var scenes = day ? $$('[data-scene]', day) : [];
  var visCards = day ? $$('[data-vis]', day) : [];
  var frags = day && $('[data-frags]', day);
  var desktopDay = function () { return window.innerWidth > 1024; };
  var lastScene = -1;
  // на узких экранах кадр продукта стоит под текстом своей сцены
  scenes.forEach(function (sc, i) {
    var ui = visCards[i] && visCards[i].querySelector('.ui');
    if (!ui) return;
    var box = document.createElement('div');
    box.className = 'scene__ui';
    box.setAttribute('aria-hidden', 'true');
    box.appendChild(ui.cloneNode(true));
    sc.appendChild(box);
  });
  function setScene(n) {
    if (n === lastScene) return; lastScene = n;
    scenes.forEach(function (s, i) { s.classList.toggle('is-on', i === n); s.setAttribute('aria-hidden', i === n ? 'false' : 'true'); });
    visCards.forEach(function (v, i) { v.classList.toggle('is-on', i === n); });
  }

  /* --- главный цикл скролла --- */
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    if (top) top.classList.toggle('is-solid', y > 24);

    // наклон Пульта на первом экране ложится при скролле
    var hs = $('[data-hero-stage]');
    if (hs && !RM) hs.style.setProperty('--tilt', clamp(1 - y / (window.innerHeight * .55), 0, 1).toFixed(3));

    // часы: последняя глава, чей верх выше середины экрана
    var mid = window.innerHeight * .5, cur = null;
    chapters.forEach(function (c) { if (c.getBoundingClientRect().top < mid) cur = c; });
    if (clock) clock.classList.toggle('is-on', y > window.innerHeight * .6);
    if (cur) setClock(cur.getAttribute('data-time'), cur.getAttribute('data-time-l'));

    // сцены дня
    var inDay = day && dayTrack.getBoundingClientRect().top < mid && dayTrack.getBoundingClientRect().bottom > mid;
    if (day && desktopDay()) {
      var p = stickyProgress(dayTrack);
      var n = clamp(Math.floor(p * scenes.length * .999), 0, scenes.length - 1);
      setScene(n);
      if (frags) frags.classList.toggle('is-gathered', p > .12);
      var st = scenes[n] && scenes[n].getAttribute('data-time');
      if (st && inDay) setClock(st, scenes[n].getAttribute('data-time-l'));
    }

    // нити / граф / стрелки сопоставления
    draws.forEach(function (svg) { svg.style.setProperty('--p', RM ? 1 : progress(svg, .95, .35).toFixed(3)); });
    $$('[data-pulse]').forEach(function (el) { el.style.setProperty('--pv', RM ? 1 : clamp((progress(el.ownerSVGElement || el, .9, .3) - .7) / .3, 0, 1).toFixed(2)); });
    $$('[data-match]').forEach(function (m) {
      var p2 = RM ? 1 : progress(m, .9, .45);
      $$('.match__arr', m).forEach(function (a, i) { a.style.setProperty('--p', (clamp(p2 * 2 - i, 0, 1) * 100).toFixed(0) + '%'); });
    });

    // вечер: тёмные часы
    var dusk = $('[data-dusk]');
    if (dusk) doc.classList.toggle('is-dusk', dusk.getBoundingClientRect().top < window.innerHeight * .35);
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', function () { lastScene = -1; if (!desktopDay()) scenes.forEach(function (s) { s.classList.add('is-on'); s.removeAttribute('aria-hidden'); }); req(); });
  if (!desktopDay()) scenes.forEach(function (s) { s.classList.add('is-on'); });
  onScroll();
})();
