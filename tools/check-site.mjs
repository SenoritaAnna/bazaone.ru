#!/usr/bin/env node
/* ============================================================
   БАЗА — автоматическая проверка сайта (запускается на GitHub
   в каждом pull request и при публикации в main, см.
   .github/workflows/site-check.yml; можно и локально).

   Что проверяет на каждой странице из sitemap.xml + 404.html,
   на десктопе и на телефоне:
     - ответы 4xx/5xx и неудачные запросы к своим файлам;
     - битые картинки;
     - ошибки JavaScript;
     - запросы на чужие серверы (Google и т. п. — 152-ФЗ);
     - внутренние ссылки и якоря (#block6 и т. д.) ведут на существующее;
     - один <h1> на странице.
   И отдельно на главной:
     - Яндекс Метрика не грузится до согласия и грузится после «Принять»;
     - форма заявки: успешная отправка и поведение при отказе сервера
       (запросы к api.bazaone.ru перехватываются — настоящие заявки НЕ уходят).

   Локально:
     python3 -m http.server 8080 &
     BASE_URL=http://127.0.0.1:8080 node tools/check-site.mjs
   ============================================================ */
import { readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const HOST = new URL(BASE).host;
const LEAD_ENDPOINT = 'https://api.bazaone.ru/send.php';
const VIEWPORTS = [
  { name: 'десктоп', width: 1440, height: 900 },
  { name: 'телефон', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
];

const errors = [];
const fail = (where, msg) => { errors.push(`${where}: ${msg}`); console.log(`  ✗ ${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);

/* ---------- список страниц: sitemap.xml + 404 ---------- */
const sitemap = readFileSync('sitemap.xml', 'utf8');
const pages = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
pages.push('/404.html');

/* ---------- файлы-переходы должны существовать ---------- */
for (const f of ['admin/index.html', 'forum/index.html', 'robots.txt', 'CNAME']) {
  if (!existsSync(f)) fail('репозиторий', `нет файла ${f}`);
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);

async function newPage(vp, { consent = null, lead = 'block' } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1,
  });
  if (consent) {
    await ctx.addInitScript((v) => { try { localStorage.setItem('baza_cookie_consent', v); } catch (e) {} }, consent);
  }
  const page = await ctx.newPage();
  const log = { bad: [], failed: [], external: [], jsErrors: [], yandex: 0 };

  // внешние запросы не выпускаем из CI: Метрика — пустой скрипт, заявки — по сценарию
  await page.route((url) => url.host !== HOST, (route) => {
    const u = new URL(route.request().url());
    if (u.host === 'mc.yandex.ru') { log.yandex++; return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }); }
    if (u.href.startsWith(LEAD_ENDPOINT)) {
      if (lead === 'ok') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      if (lead === 'fail') return route.fulfill({ status: 500, body: 'error' });
      return route.abort();
    }
    log.external.push(u.host);
    return route.abort();
  });
  page.on('response', (r) => { if (new URL(r.url()).host === HOST && r.status() >= 400) log.bad.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => {
    const u = new URL(r.url());
    if (u.host === HOST) log.failed.push(`${r.failure()?.errorText} ${r.url()}`);
  });
  page.on('pageerror', (e) => log.jsErrors.push(e.message));
  return { ctx, page, log };
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

/* ---------- 1. все страницы × устройства ---------- */
const linkTargets = new Set();
for (const path of pages) {
  for (const vp of VIEWPORTS) {
    const where = `${path} (${vp.name})`;
    console.log(`\n${where}`);
    const { ctx, page, log } = await newPage(vp);
    const resp = await page.goto(BASE + path, { waitUntil: 'networkidle' });
    if (!resp || resp.status() >= 400) { fail(where, `страница не открылась: ${resp && resp.status()}`); await ctx.close(); continue; }
    await scrollThrough(page);

    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')));
    const h1 = await page.evaluate(() => document.querySelectorAll('h1').length);
    const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
    const ids = await page.evaluate(() => [...document.querySelectorAll('[id]')].map((e) => e.id));

    log.bad.length ? log.bad.forEach((b) => fail(where, `ошибка загрузки ${b}`)) : ok('все файлы загрузились');
    log.failed.forEach((b) => fail(where, `запрос не выполнен ${b}`));
    broken.length ? broken.forEach((s) => fail(where, `битая картинка ${s}`)) : ok('картинки на месте');
    log.jsErrors.length ? log.jsErrors.forEach((e) => fail(where, `ошибка JS: ${e}`)) : ok('ошибок JavaScript нет');
    const ext = [...new Set(log.external)];
    ext.length ? fail(where, `запросы на чужие серверы: ${ext.join(', ')}`) : ok('запросов на чужие серверы нет');
    if (log.yandex) fail(where, 'Метрика загрузилась без согласия на cookie');
    h1 === 1 ? ok('один <h1>') : fail(where, `<h1> на странице: ${h1} (нужен ровно один)`);

    // ссылки: якоря на этой странице + адреса для проверки ниже
    for (const href of links) {
      if (/^(mailto:|tel:|javascript:)/.test(href)) continue;
      const abs = new URL(href, BASE + path);
      if (abs.host !== HOST) continue;
      if (abs.hash && abs.pathname === new URL(BASE + path).pathname) {
        const id = decodeURIComponent(abs.hash.slice(1));
        if (id && id !== 'top' && !ids.includes(id)) fail(where, `якорь ${href} ведёт в никуда`);
      }
      linkTargets.add(abs.pathname);
    }
    await ctx.close();
  }
}

/* ---------- 2. внутренние ссылки ведут на существующие страницы ---------- */
console.log('\nВнутренние ссылки');
for (const p of linkTargets) {
  const r = await fetch(BASE + p);
  r.ok ? ok(`${p} → ${r.status}`) : fail('ссылки', `${p} → ${r.status}`);
}

/* ---------- 3. Метрика только после согласия ---------- */
console.log('\nЯндекс Метрика и cookie-баннер');
{
  const { ctx, page, log } = await newPage(VIEWPORTS[0]);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  if (log.yandex) fail('Метрика', 'загрузилась до нажатия «Принять»'); else ok('до согласия не загружается');
  await page.click('[data-cookie-accept]');
  await page.waitForTimeout(800);
  log.yandex ? ok('после «Принять» загружается') : fail('Метрика', 'не загрузилась после «Принять»');
  await ctx.close();
}
{
  const { ctx, page, log } = await newPage(VIEWPORTS[0]);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.click('[data-cookie-decline]');
  await page.reload({ waitUntil: 'networkidle' });
  log.yandex ? fail('Метрика', 'загрузилась после «Отклонить»') : ok('после «Отклонить» не загружается');
  await ctx.close();
}

/* ---------- 4. форма заявки ---------- */
async function fillLeadForm(page) {
  const q = (await page.textContent('[data-captcha-q]')).replace('=', '').trim().split(/\s+/);
  const ans = q[1] === '+' ? +q[0] + +q[2] : +q[0] - +q[2];
  await page.fill('input[name="name"]', 'Проверка CI');
  await page.fill('input[name="email"]', 'ci@example.com');
  await page.fill('textarea[name="message"]', 'Автоматическая проверка формы');
  await page.check('[data-consent]');
  await page.fill('input[name="captcha"]', String(ans));
  await page.click('#block6 button[type="submit"]');
}

console.log('\nФорма заявки');
{
  const { ctx, page } = await newPage(VIEWPORTS[0], { consent: 'declined', lead: 'ok' });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await fillLeadForm(page);
  await page.waitForTimeout(1500);
  const note = await page.textContent('[data-form-note]');
  /Спасибо/.test(note) ? ok('успешная отправка: «Спасибо»') : fail('форма', `после успешной отправки: «${note}»`);
  await ctx.close();
}
{
  const { ctx, page } = await newPage(VIEWPORTS[0], { consent: 'declined', lead: 'fail' });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await fillLeadForm(page);
  await page.waitForTimeout(4000);
  const buttons = await page.locator('#block6 .lead-fallback__btn').count();
  const kept = await page.inputValue('input[name="name"]');
  buttons >= 1 ? ok('сервер не ответил: показаны запасные кнопки') : fail('форма', 'при отказе сервера нет кнопок «Написать на почту»');
  kept ? ok('данные остались в форме') : fail('форма', 'при отказе сервера форма очистилась');
  await ctx.close();
}

await browser.close();

/* ---------- итог ---------- */
console.log('\n' + '='.repeat(60));
if (errors.length) {
  console.log(`НАЙДЕНО ПРОБЛЕМ: ${errors.length}`);
  for (const e of errors) {
    console.log(`  - ${e}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error title=Проверка сайта::${e}`);
  }
  process.exit(1);
}
console.log('Всё в порядке: проблем не найдено.');
