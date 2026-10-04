# README

# NoomiClone prototype

This project is a small mobile-friendly NoomiClone-inspired browser game with:

- a custom regrab setting with a maximum of 100000000000
- an `Unlock all skins` toggle
- multiple skin choices
- touch interaction for quick play on mobile
- local storage persistence for settings

## Run locally

```bash
npm install
npm run dev
```

Then open the dev URL in your browser.

## Build for production

```bash
npm run build
```

## Notes

This is a browser prototype designed to be portable and easy to wrap into Android/iOS packaging tools later. It does not produce a signed APK/IPA binary by itself. Real app signing still requires Android Studio / Gradle and a Mac with Xcode.

## Settings behavior

- `regrabLimit` is capped at `100000000000`
- `unlockAllSkins` unlocks all skins instantly
- existing values persist in local storage

## Legal note

This is a fan-made original recreation inspired by the gameplay style of NoomiClone and is not an official app or asset copy.
