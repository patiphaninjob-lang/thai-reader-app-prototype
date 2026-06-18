# GitHub Pages Mobile App

This project is prepared as a Progressive Web App (PWA). The simplest publishing path is GitHub Pages: push this folder to a GitHub repository, let the included GitHub Actions workflow deploy it, then open the generated HTTPS link on a phone.

## Publish

1. Create a new GitHub repository.
2. Push this project folder to the repository's `main` branch.
3. In GitHub, open Settings, Pages, and set Source to GitHub Actions if it is not already selected.
4. Wait for the `Deploy to GitHub Pages` action to finish.
5. Open the Pages URL on the phone.

The workflow file is `.github/workflows/pages.yml`. It runs `npm ci`, builds the app, and publishes `dist/` automatically.

## Phone Install

- iPhone: open the Pages URL in Safari, tap Share, then Add to Home Screen.
- Android: open the Pages URL in Chrome, open the menu, then Install app or Add to Home screen.

## Local Mobile Test

Use this only for quick layout testing on a phone connected to the same Wi-Fi:

```bash
npm run dev:mobile
```

Then open `http://<your-computer-ip>:5173` on the phone. Full installation still requires the GitHub Pages HTTPS URL.

## PWA Files

- `public/manifest.webmanifest` defines the app name, display mode, colors, and icons.
- `public/sw.js` caches the app shell, covers, and all 8 manuscript files for offline reading after the first successful load.
- `public/icons/` contains the app icons for Android and iOS.

When app shell files change, bump `CACHE_NAME` in `public/sw.js` so phones receive the new version.
