#!/usr/bin/env node
/* ============================================================
   БАЗА — сборка стилей главной в один файл css/site.css.

   Зачем: 13 отдельных CSS-файлов грузились по очереди и задерживали
   первую отрисовку на мобильных (~1,7 с по Lighthouse). Один файл — один запрос.

   Как работать:
     1. Правите исходники как раньше: css/hero.css, css/block1.css, …
     2. Запускаете:  node tools/build-css.mjs
     3. Скрипт пересобирает css/site.css и сам обновляет ?v=<хэш> в index.html.
   Проверка на GitHub (.github/workflows/site-check.yml) упадёт, если site.css
   не пересобран после правки исходников.

   Порядок файлов = порядок каскада, не меняйте без причины:
   light.css последним переопределяет тёмную тему.
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Стили главной страницы. Скрытые блоки (how, kit, result, story, grow, faq,
// block2, block3, block4) не включены: они не показываются (см. css/light.css).
// Возвращаете блок на сайт — добавьте его файл сюда, перед light.css.
export const SOURCES = [
  'webfonts.css',
  'fonts.css',
  'menu.css',
  'hero.css',
  'block1.css',
  'persn.css',
  'analytics.css',
  'block5.css',
  'block6.css',
  'footer.css',
  'cookie.css',
  'reveal.css',
  'light.css',
];

const OUT = 'css/site.css';
const PAGE = 'index.html';

const parts = SOURCES.map((f) => {
  const css = readFileSync(join(ROOT, 'css', f), 'utf8').trim();
  return `/* ===== ${f} ===== */\n${css}\n`;
});

// Лёгкая минификация без зависимостей: комментарии, переносы и лишние пробелы.
// Внутри значений схлопываются только повторные пробелы — url(), calc() и строки не ломаются.
function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')   // комментарии
    .replace(/\s+/g, ' ')                 // любые пробелы/переносы → один пробел
    .replace(/\s*([{};,>])\s*/g, '$1')    // пробелы вокруг { } ; , >
    .replace(/;}/g, '}')
    .trim();
}

const bundle =
  '/* СГЕНЕРИРОВАНО tools/build-css.mjs — НЕ РЕДАКТИРОВАТЬ.\n' +
  '   Правьте исходные файлы в css/ и запустите: node tools/build-css.mjs */\n' +
  SOURCES.map((f, i) => `/* ${f} */` + minify(parts[i].replace(/^\/\* =====.*\n/, ''))).join('\n') + '\n';

writeFileSync(join(ROOT, OUT), bundle);

const hash = createHash('sha1').update(bundle).digest('hex').slice(0, 8);
const pagePath = join(ROOT, PAGE);
const html = readFileSync(pagePath, 'utf8');
const re = /css\/site\.css\?v=[^"]*/;
if (!re.test(html)) {
  console.error(`В ${PAGE} нет подключения css/site.css?v=… — добавьте <link rel="stylesheet" href="css/site.css?v=0" />`);
  process.exit(1);
}
writeFileSync(pagePath, html.replace(re, `css/site.css?v=${hash}`));

console.log(`${OUT}: ${SOURCES.length} файлов, ${(bundle.length / 1024).toFixed(1)} КБ, v=${hash}`);
