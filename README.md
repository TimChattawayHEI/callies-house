# Callie's House

A small game for my daughter to help her learn words. Tap things to hear their names,
do jobs for the family, visit the park, school and shops, make new people and decorate their houses.

The game is a React web page drawn in SVG. [Capacitor](https://capacitorjs.com) wraps it as an
Android app so it installs on the Fire tablet, works offline and uses the tablet's own voice.

## How the app gets built

Every push to `main` runs **.github/workflows/android.yml** on GitHub's servers:

1. `scripts/build_app.py` bundles the game, React and the fonts into one offline page, `www/index.html`
2. Capacitor makes the Android project, adds the icon and splash screen, and copies the game in
3. Gradle builds the APK, signed with `keys/callies-house.keystore`
4. The APK is attached to the **latest** release on this repo

Nothing needs installing on your own computer. To rebuild without a code change, open the
**Actions** tab, pick *Build Android app* and press *Run workflow*.

## One-time setup: the signing password

The app is signed with the same key every time so updates install over the top and keep her
progress. The key file is in `keys/`; its password must be added as a repository secret:

*Settings → Secrets and variables → Actions → New repository secret*
- Name: `KEYSTORE_PASSWORD`
- Value: the password you were given (keep a copy in your password manager)

Without it the workflow still runs but makes a debug build, and debug builds can't update each other.
**If the key or password is lost, the app can only be updated by uninstalling it, which wipes her save.**

## Installing on the Fire tablet

1. On the tablet: *Settings → Security & Privacy → Apps from Unknown Sources* and allow **Silk Browser**
   (or **Files** if you copy the APK over by USB or from Google Drive)
2. Download the APK from the latest release (sign in to GitHub in Silk, since the repo is private)
3. Open it and tap **Install**. Updates install the same way, and her progress is kept

## Play together (two tablets, one world)

The game talks to a free Firebase project so two tablets can play in the same world at once.
One tablet shares its world (grown-ups menu, Play together, Share this world) and shows a 6-letter
code; the other types the code to join. After that, both reconnect by themselves whenever the game is opened.

Setting up Firebase (once):

1. Go to console.firebase.google.com, add a project (Google Analytics is not needed).
2. Build > Authentication > Get started > Sign-in method: turn on **Anonymous**.
3. Build > Realtime Database > Create database, location **europe-west1**, start in **locked mode**.
4. In the database's **Rules** tab, paste the contents of `firebase-rules.json` and publish.
5. Project settings > General > Your apps > add a **Web** app. Copy `apiKey` and `databaseURL`
   into `game/src/netcfg.js` and push. The next APK can play together.

The main tablet runs the world (people, clock, weather). The visiting tablet plays one person and has
its own coins, bag and stickers. Things, lights, new people, houses, shops and pets are shared both ways.

## Working on the game

- `game/src/`: the game code (`app.jsx` is the main screen; `homes.jsx` and `builder.jsx` are New Street houses and decorating)
- `game/rooms/`: scenes exported from Claude Design; `game/gen_rooms.py` turns them into `game/rooms.gen.jsx`
- `game/shell.html`: the page styles
- `vendor/`: React 18 and the Baloo 2 font, kept here so the app needs no internet

To try it in a browser: `npm install`, then `npm run build`, then open `www/index.html`.

To work in Android Studio: `npm install`, `npm run android:add`, `npm run android:icons`, `npm run android:sync`, `npm run android:open`.
