# HIGHEST & FUTURY Company Builder

This is a static, self-contained website with an animated homepage and classic audience pages. It runs without a build process or package manager.

## Start

Open `index.html` with a double-click. All fonts, images and animation libraries required at runtime are stored locally; the page makes no automatic external requests. External websites only open after a user clicks a link.

## Structure

```text
index.html                  Animated homepage and readable fallback content
startups.html               Information for start-ups
investoren.html             Information for investors and VCs
mentorinnen.html            Information for mentors
contact.html                Team and direct contacts
impressum.html              Imprint
datenschutz.html            Privacy information
assets/css/homepage.css     Homepage design and responsive states
assets/css/subpages.css     Shared design for all classic subpages
assets/js/main.js           Initialisation, language and UI behaviour
assets/js/subpages.js       Header, mobile navigation and reveals on subpages
assets/js/i18n.js           English and German homepage copy
assets/js/hero.js           Canvas particle formations
assets/js/timeline.js       Program path and five checkpoints
assets/js/network.js        Network layout, filters and canvas connections
assets/js/vendor/           Local GSAP, ScrollTrigger and Lenis files
assets/fonts/               Locally hosted WOFF2 fonts
assets/img/                 Local image assets
CREDITS.md                  Sources and rights status
scripts/validate-site.mjs   Local consistency check
```

## Replace images

1. Replace the file in `assets/img/` while retaining its filename, or update the corresponding `src` in `index.html`.
2. Keep a useful `alt` description and accurate `width` and `height` values.
3. Compress gallery images to approximately 1,400 px maximum width and ideally below 250 KB.
4. Record the source, creator and licence in `CREDITS.md`.

If a gallery image cannot load, the page hides the broken image and displays a labelled local fallback automatically.

## Edit text and translations

Static English fallback text lives in `index.html`. English and German UI strings live in `assets/js/i18n.js` under `CB_I18N`. Elements are connected by matching `data-i18n` keys.

Timeline descriptions live in `CB_PROGRAM_COPY` and are ordered from SCOUT to NEXT.

## Motion and accessibility

With `prefers-reduced-motion: reduce`, smooth scrolling, pinned scenes, looping ticker motion, parallax, video playback and moving particles are disabled. All content remains readable without JavaScript. Keyboard users can operate timeline nodes, network filters and links.

## Application deadline

The countdown target is defined in `assets/js/main.js` as `2026-10-18T23:59:59+02:00`. After the deadline the countdown and application button are replaced by the closed state.

## Publication note

This is marked as an internal draft. Before publishing, verify image and brand usage rights, final copy, investment/legal wording, destination links and application dates.
