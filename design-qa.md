source visual truth path: conversation-approved direction, `layout-research.md`, and local book cover references in `public/covers/`
implementation screenshot path: `qa-screenshots/01-library.png`, `qa-screenshots/05-reader-after-layout-fix.png`, `qa-screenshots/06-reader-scroll-after-layout-fix.png`, `qa-screenshots/04-settings.png`, `qa-screenshots/11-bookmark-tooltip-custom.png`, `qa-screenshots/12-bookmark-feedback-custom.png`, `qa-screenshots/13-pwa-offline-reload.png`, `qa-screenshots/14-github-pages-offline-reload.png`, `qa-screenshots/21-book8-callout-final-clean.png`, `qa-screenshots/22-book8-table-final-clean.png`, `qa-screenshots/24-book8-matrix-final-readable.png`, `qa-screenshots/26-book8-checklist-fixed.png`, `qa-screenshots/27-book8-reading-guide.png`, `qa-screenshots/28-book8-guide-shortcut.png`
viewport: 390 x 844
state: library, reader top, reader scrolled, settings, bookmark tooltip, bookmark feedback, PWA offline reload, GitHub Pages subpath offline reload, Book 8 field-manual callouts/tables/matrix/checklists
full-view comparison evidence: implementation screenshots inspected after build; no standalone pixel-perfect ImageGen source file was available in the workspace
focused region comparison evidence: reader top/bottom chrome inspected after fixing content overlap; Thai text rendering checked in browser

**Findings**
- No P0/P1/P2 issues remain.

**Required Fidelity Surfaces**
- Fonts and typography: reader uses Thai serif text with adjustable 16-23px size and 1.55-2.0 line height. UI uses Thai sans. Letter spacing is zero.
- Spacing and layout rhythm: the reader viewport now stops above the reading controls and tab bar, so controls do not sit over the reading surface.
- Colors and visual tokens: palette follows the existing cover family: warm paper, deep green, muted brown/gold, and an optional night mode.
- Image quality and asset fidelity: all eight visible covers are real copied cover assets from the existing book folders, not placeholders or drawn approximations.
- Copy and content: manuscripts are copied byte-for-byte into `public/books/`; the renderer only turns Markdown markers into display blocks. Browser text check found no replacement/control characters.
- Interaction feedback: key controls include custom hover tooltips, focus rings, pressed motion, and status feedback. Bookmark state is visible through active styling plus a short action toast. Native browser `title` tooltips were removed to prevent unstyled overlays.
- Mobile app readiness: production build includes a web app manifest, app icons, iOS home-screen metadata, and a service worker that caches the shell, covers, and all 8 book manuscripts. Service worker cache is now `survivor-library-v6` so installed apps refresh this release.
- Book 8 field-manual blocks: ASCII boxes now render as designed callout components; Markdown tables render as styled mobile tables; checklist lines render as checklist cards; matrix-style boxed diagrams render as clean stacked manual rows.
- Book 8 reading guide layer: selected high-value sections now show a small "จับแก่น" card with core idea, memory hook, and self-check question. The layer is separate from manuscript files, can be turned off in Settings, and has a lightbulb shortcut in the Book 8 reader controls.

**Open Questions**
- Pixel-perfect comparison is limited because no selected mockup image file exists locally. The build follows the approved combined direction: Quiet Library plus Reader Sanctuary.

**Implementation Checklist**
- Library shows exactly eight books.
- Reader opens real Markdown content.
- Bookmark, progress, TOC, settings, font size, line height, and theme controls work.
- Hover descriptions and click feedback are present on reader actions, especially bookmark, TOC, typography, line height, and theme controls.
- PWA preview registers service worker `survivor-library-v5`; manifest, icons, and cached manuscripts respond during simulated offline mode. GitHub Pages subpath simulation also loads covers, manuscripts, and offline reload correctly.
- Book 8 renderer QA: 145 callouts, 33 tables, 14 checklists, and 179 matrix rows render as components. No box-drawing characters remain in the visible reader DOM and no encoding issues were detected.
- Book 8 checklist regression QA: all 96 checklist items render with one checkbox each; no narrow or over-tall checklist items were detected after fixing the selector collision.
- Book 8 reading guide QA: 7 guide cards render when enabled, 0 render after turning the setting off, and 7 return when re-enabled. TOC still jumps to the correct source heading after guide insertion. The lightbulb shortcut scrolls to the next guide card; if guides are off it turns them back on and scrolls to the first guide. Book 1 shows no guide shortcut and its TOC still opens normally.
- Build completes with `npm run build`.

**Follow-up Polish**
- Consider a native mobile wrapper later if this moves from prototype to production.
- Add search only if it becomes a real reader requirement.

patches made since previous QA pass: adjusted `.reader` top and bottom bounds so content is not obscured by fixed reader chrome.
patches made after interaction polish: added Apple-style subtle hover explanations, pressed states, focus rings, active bookmark styling, and short action feedback.
patches made for mobile app readiness: added PWA manifest, service worker cache, generated icons, production registration, mobile preview scripts, and `MOBILE_APP.md`.
patches made for GitHub Pages readiness: switched built asset paths to relative mode, scoped service worker caching to the Pages subpath, and added `.github/workflows/pages.yml`.
patches made for Book 8 layout polish: added field-manual parsing/rendering for callouts, tables, checklists, lists, matrix rows, and raw code fallbacks without changing manuscript files.
patches made after checklist regression: scoped checkbox styling to `.manual-checkmark` so text spans no longer inherit checkbox positioning.
patches made for reading guide layer: added optional Book 8 "จับแก่น" cards and a Settings toggle without changing manuscript files.
patches made after guide discoverability issue: added a Book 8 lightbulb shortcut, clearer Settings copy, a guide pulse, and bumped the PWA cache to v6 so installed mobile apps update.
final result: passed
