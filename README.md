# Quran Reader

A simple Quran reading app: all 114 surahs in Arabic (Uthmani script) with the Sahih International English translation, search, bookmarks, "continue reading", adjustable text size, dark mode, and an offline mode.

## What's in this folder

| Folder | What it is |
|---|---|
| `www/` | The app itself (HTML + JavaScript). Works in any browser. |
| `android/` | An Android Studio project that wraps `www/` into an APK. |

## Get the APK (on a computer, about 10 minutes)

1. Install **Android Studio** (free): https://developer.android.com/studio
2. Open Android Studio → **Open** → choose the `android` folder. Wait for the Gradle sync to finish (it downloads what it needs).
3. Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. Click **locate** in the popup. The file is `app/build/outputs/apk/debug/app-debug.apk`.
5. Copy it to your phone and open it. Android will ask you to allow installs from this source.

Or from a terminal inside `android/`: `./gradlew assembleDebug`

## No computer? Install it from the phone instead

1. Upload the `www` folder to a free static host (Netlify Drop, GitHub Pages, Cloudflare Pages).
2. Open the link in Chrome on Android → menu (⋮) → **Install app**. It then behaves like a normal app with its own icon.
3. If you specifically need an `.apk` file from that link, https://www.pwabuilder.com can package it.

## How the text works

- The Quran text is **not typed into the app**. It is fetched from the Al Quran Cloud API (`api.alquran.cloud`, Tanzil Uthmani text) the first time you open each surah, then saved on the phone.
- In **Aa → Offline → Download the whole Quran** (about 2 MB) you can save everything once, and the app then works with no internet. The app checks that it received 114 surahs and 6,236 verses.
- Please verify anything important against a printed mushaf.

## Notes

- The debug APK is for your own use. Publishing on Google Play needs a signed release build (**Build → Generate Signed App Bundle**).
- To change the app name, edit `android/app/src/main/res/values/strings.xml`. To change the package id, edit `applicationId` in `android/app/build.gradle`.
- If you edit anything in `www/`, copy the changed files into `android/app/src/main/assets/` before building.
