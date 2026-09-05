/* ============================================================
   БАЗА — Блок 1: reveal по скроллу + меню + блоб из частиц.
   Vanilla JS, без библиотек. Не зависит от блока 0.
   ============================================================ */
(function () {
  'use strict';

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Reveal по скроллу (pin + scrub) ---------- */
  var track = document.querySelector('[data-b1-track]');
  var stage = track ? track.querySelector('.b1__stage') : null;

  function updateReveal() {
    if (!track || !stage) return;
    var rect = track.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var scrollable = rect.height - vh;
    var progress = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;

    var reveal = clamp(progress / 0.45, 0, 1);
    var eased = 1 - Math.pow(1 - reveal, 5);
    var labels = clamp((progress - 0.12) / 0.33, 0, 1);
    var labelsEased = 1 - Math.pow(1 - labels, 4);

    stage.style.setProperty('--reveal', eased.toFixed(4));
    stage.style.setProperty('--labels', labelsEased.toFixed(4));
    stage.style.setProperty('--progress', progress.toFixed(4));
  }

  if (!reduce && track && stage) {
    var ticking = false;
    var onScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { updateReveal(); ticking = false; }); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateReveal);
    updateReveal();
  }

  /* ---------- 2. Меню-плашка (разъезжается влево от кнопки) ---------- */
  var menu = document.querySelector('[data-menu]');
  var btn = document.querySelector('[data-menu-btn]');
  var nav = document.querySelector('.b1__nav');

  function setMenu(open) {
    if (!menu || !btn) return;
    menu.setAttribute('data-open', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.setAttribute('data-menu-open', open ? 'true' : 'false');
  }

  if (btn) btn.addEventListener('click', function (e) {
    e.stopPropagation();
    setMenu(menu.getAttribute('data-open') !== 'true');
  });
  // клик по пункту — закрыть
  if (menu) menu.querySelectorAll('.site-menu__row a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  // клик вне плашки — закрыть
  document.addEventListener('click', function (e) {
    if (menu && menu.getAttribute('data-open') === 'true' && nav && !nav.contains(e.target)) setMenu(false);
  });
  // ESC — закрыть
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu && menu.getAttribute('data-open') === 'true') setMenu(false);
  });

  /* ---------- 3. Блоб из частиц (бесформенное облако в движении) ---------- */
  var canvas = document.querySelector('[data-b1-blob]');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var N = 1600;                       // число частиц
    var pts = [];
    var GOLDEN = Math.PI * (3 - Math.sqrt(5));

    // распределяем точки по сфере (Fibonacci) + запоминаем направление для морфинга
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;    // -1..1
      var r = Math.sqrt(Math.max(0, 1 - y * y));
      var th = i * GOLDEN;
      pts.push({
        x: Math.cos(th) * r, y: y, z: Math.sin(th) * r,
        ph: Math.random() * Math.PI * 2 // фаза колебания
      });
    }

    function size() {
      var rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    }
    size();
    window.addEventListener('resize', size);

    var t = 0;
    function frame() {
      t += 0.006;
      var w = canvas.width, h = canvas.height;
      var cx = w / 2, cy = h / 2;
      var R = Math.min(w, h) * 0.40;    // радиус блоба
      var ay = t * 0.9, ax = Math.sin(t * 0.5) * 0.35;   // вращение
      var cosY = Math.cos(ay), sinY = Math.sin(ay);
      var cosX = Math.cos(ax), sinX = Math.sin(ax);

      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < N; i++) {
        var p = pts[i];
        // морфинг радиуса — делает форму «бесформенной» и живой
        var rad = 1 + 0.14 * Math.sin(t * 1.3 + p.ph) + 0.07 * Math.sin(t * 0.7 + p.x * 3);
        var vx = p.x * rad, vy = p.y * rad, vz = p.z * rad;
        // поворот вокруг Y
        var x1 = vx * cosY - vz * sinY;
        var z1 = vx * sinY + vz * cosY;
        // поворот вокруг X
        var y1 = vy * cosX - z1 * sinX;
        var z2 = vy * sinX + z1 * cosX;
        // перспектива
        var persp = 2.2 / (2.2 + z2);
        var sx = cx + x1 * R * persp;
        var sy = cy + y1 * R * persp;
        // глубина -> размер/яркость
        var depth = (z2 + 1) / 2;                 // 0..1
        var alpha = 0.28 + depth * 0.7;
        var rr = (0.65 + depth * 1.7) * dpr;
        ctx.beginPath();
        ctx.arc(sx, sy, rr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(238,236,231,' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    var raf;
    if (reduce) { frame(); cancelAnimationFrame(raf); }   // один статичный кадр
    else raf = requestAnimationFrame(frame);
  }
})();
