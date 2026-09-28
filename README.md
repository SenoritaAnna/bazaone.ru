# БАЗА — сайт bazaone.ru

Корпоративный сайт «БАЗА — CRM и автоматизация под ваш бизнес».
Статика: чистый HTML/CSS/JS, **без фреймворков, библиотек и сборки**.

## Деплой

- Хостинг — **GitHub Pages** из ветки `main` (домен в `CNAME`, `.nojekyll` отключает Jekyll).
- Любой merge/push в `main` публикуется автоматически за ~1 минуту
  (Actions → «pages build and deployment»).
- Изменения делаются в отдельной ветке → pull request → merge.
- После правки CSS/JS **поднимайте `?v=N`** в подключении файла в HTML — иначе браузеры
  покажут старую версию из кэша.

## Страницы

| Путь | Файл | Что это |
|---|---|---|
| `/` | `index.html` | Главная (лендинг) |
| `/forum/` | `forum/index.html` | «Мой Бизнес Форум» 2026 — бесплатная экспресс-диагностика, своя форма |
| `/privacy.html` | `privacy.html` | Политика конфиденциальности |
| `/consent.html` | `consent.html` | Согласие на обработку ПДн |
| `/cookie.html` | `cookie.html` | Политика cookie |
| `/admin/` | `admin/index.html` | Только редирект на `https://api.bazaone.ru/admin.php` (noindex) |

## Главная: блоки

Каждый блок — `<section>` в `index.html` + свой CSS (и JS, если есть анимация).

| Блок | id / класс | CSS | JS |
|---|---|---|---|
| Шапка и мобильное меню | `.nav`, `.mmenu` | `menu.css` | `menu.js` |
| Hero: логотип, иконки Артем & Анна, заголовок | `.hero` | `hero.css` | `hero.js` |
| Продукт, счётчик до открытия 12.12.2026 | `#block1` | `block1.css` | `block1.js` + inline-скрипт |
| Персонализация | `#personalization` | `persn.css` | — |
| Аналитика и разведка (12 направлений, 2 страницы) | `#analytics` | `analytics.css` | inline-скрипт |
| О нас | `#block5` | `block5.css` | — |
| Контакты + форма заявки | `#block6` | `block6.css` | `form.js` |
| Футер, cookie-баннер | `.foot`, `[data-cookie]` | `footer.css`, `cookie.css` | `cookie.js` |

**Временно скрыты** (ещё в тёмной теме, вернутся после перевода в светлую):
`#how`, `#kit`, `#result`, `#story`, `#grow`, `#faq`, `#block2`, `#block3`, `#block4` —
скрыты одной строкой в `css/light.css`. Разметка и стили остаются в репо.

### Тема

Исходно сайт был тёмным. `css/light.css` подключается **последним** и переводит в светлую тему
шапку, Hero и блоки, которые уже переведены. Новый блок в светлой теме = правила в `light.css`
+ удалить его id из списка скрытых.

### Общие механики

- `data-reveal` (+ `data-reveal-delay="1..n"`) — плавное появление при скролле
  (`reveal.css` / `reveal.js`).
- `prefers-reduced-motion` уважается: анимации отключаются.

## Формы заявок

Главная (`js/form.js`) и форум (`js/forum.js`) работают одинаково:

1. Валидация на клиенте + мат-капча (пример до 20) + обязательное согласие на обработку ПДн.
2. `POST` JSON на адрес из `<meta name="form-endpoint">` — сейчас `https://api.bazaone.ru/send.php`.
3. Если сервер недоступен или адрес пуст — запасной вариант: `mailto:go@bazaone.ru`.

Бэкенд (`send.php`, админка `admin.php`) живёт на `api.bazaone.ru` и **в этом репозитории
отсутствует**. Капча клиентская, от ботов она не защищает — защиту от спама нужно делать
на стороне `send.php`.

## Структура

```
index.html            главная
forum/index.html      страница форума
privacy.html, consent.html, cookie.html   юридические страницы
admin/index.html      редирект в админку
css/                  стили: по файлу на блок + light.css (светлая тема), fonts.css
js/                   скрипты: по файлу на блок/механику
assets/               изображения, логотипы, шрифты
CNAME, .nojekyll      настройки GitHub Pages
```

Не публикуются (в `.gitignore`): `_agent_notes/` (черновики, макеты), `ИКОНКИ/` (исходники иконок).

## Ассеты и шрифты

| Файл | Где используется |
|---|---|
| `fon-baza.webp` + `fon-baza.jpg` | Фон страницы и мобильного меню (JPEG — фолбэк для старых браузеров) |
| `croco-skin.webp` + `croco-skin.jpg` | Текстура кожи: шапка в тёмной теме, страница форума |
| `black-suede.webp` + `black-suede.jpg` | Подложка тёмных блоков |
| `icon-artem-cut.png`, `icon-anna-cut.png` | Иконки в Hero и в «О нас» (прозрачный PNG, 800 px по высоте) |
| `logo-baza-black.svg`, `logo-baza-header.svg` | Логотипы: шапка, Hero, футер |

Правила для картинок:
- фоны — **WebP + JPEG-фолбэк** через `image-set()` (как в `css/hero.css`, `css/menu.css`);
- размер — не больше 2× максимального показа на экране (для retina), фон ≲ 150 КБ;
- новый файл сразу подключайте в код — неиспользуемые ассеты не храним.

Шрифты: локально в `assets/fonts/` (Playfair Display `pf-*`, PT Sans `pts-*` — через `css/fonts.css`)
и Google Fonts (Geist, Onest, Lora, Geist Mono, JetBrains Mono — в `<head>`).
Файлы `unbounded-*.woff2` и `playfair-cyr.woff2` сейчас нигде не подключены.

## Локальный предпросмотр

Из корня репозитория:

```bash
python3 -m http.server 5178
```

Открыть **http://127.0.0.1:5178/** — нужен http-сервер: при открытии файла напрямую
абсолютные пути (`/js/...` на форуме) не работают.
