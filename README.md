# Quran Reader

Created by **Dr Sohrab Ali**.

Read, listen and understand: all 114 surahs in Uthmani script with six translations (English, Hindi, Pashto, Persian, Urdu, Arabic), six reciters with offline saving, a Hadith library (9 collections, 36,000+ hadith), smart search and an optional AI helper. App languages: English, Hindi, Pashto, Persian, Arabic.

## Structure
- `www/` the app (HTML/JS/CSS, data under `www/data`, fonts under `www/fonts`)
- `android/` Android wrapper (WebView). The build copies `www/` into the app's assets.
- `scripts/fetch_data.py` downloads the Quran translations, hadith and fonts into `www/` (run by the *Fetch data* workflow)
- `scripts/verify_apk.py` opens the built APK offline and checks it works

## Get the APK
Push to `main` (or run the *Build APK* workflow). The APK appears under *Releases* as `app-debug.apk`.
