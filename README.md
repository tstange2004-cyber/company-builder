# HIGHEST & FUTURY Company Builder — homepage concept

This is a static, self-contained homepage concept. It runs without a build process, package manager or web server.

## Start

Open `index.html` with a double-click. All fonts, images and animation libraries required at runtime are stored locally; the page makes no automatic external requests. External websites only open after a user clicks a link.

## Structure

```text
index.html                  Homepage markup and all readable fallback content
assets/css/styles.css       Visual system, layouts and responsive states
assets/js/main.js           Initialisation, language, audience lens and UI behaviour
assets/js/i18n.js           English/German and lens-dependent copy
assets/js/hero.js           Canvas particle formations
assets/js/timeline.js       Program path and five checkpoints
assets/js/network.js        Network layout, filters and canvas connections
assets/js/vendor/           Local GSAP, ScrollTrigger and Lenis files
assets/fonts/               Locally hosted WOFF2 fonts
assets/img/                 Local image assets
CREDITS.md                  Sources and rights status
```

The existing subpages are left untouched. The three portal cards use the equivalent filenames already present in this folder: `startups.html`, `investoren.html` and `mentorinnen.html`.

## Replace images

1. Replace the file in `assets/img/` while retaining its filename, or update the corresponding `src` in `index.html`.
2. Keep a useful `alt` description and accurate `width` and `height` values.
3. Compress gallery images to approximately 1,400 px maximum width and ideally below 250 KB.
4. Record the source, creator and licence in `CREDITS.md`.

If a gallery image cannot load, the page hides the broken image and displays a labelled local fallback automatically.

## Edit text and translations

Static English fallback text lives in `index.html`. English and German UI strings live in `assets/js/i18n.js` under `CB_I18N`. Elements are connected by matching `data-i18n` keys.

Audience-dependent texts live in `CB_LENS_COPY`. Each language contains the three keys `startup`, `investor` and `mentor`. Timeline descriptions are ordered from SCOUT to NEXT.

## Edit the audience lens

- The global state and controls are managed in `assets/js/main.js`.
- Lens-specific timeline highlights are in `FOCUS_BY_LENS` at the top of `assets/js/timeline.js`.
- Network highlighting is in `applyLens()` in `assets/js/network.js`.
- The matching portal card uses `data-portal="startup|investor|mentor"`.

## Motion and accessibility

With `prefers-reduced-motion: reduce`, smooth scrolling, pinned scenes, looping ticker motion, parallax and moving particles are disabled. All content remains readable without JavaScript. Keyboard users can operate both lens controls, timeline nodes, network filters and links.

## Application deadline

The countdown target is defined in `assets/js/main.js` as `2026-10-18T23:59:59+02:00`. After the deadline the countdown and application button are replaced by the closed state.

## Publication note

This is marked as an internal draft. Before publishing, verify image and brand usage rights, final copy, investment/legal wording, destination links and application dates.
