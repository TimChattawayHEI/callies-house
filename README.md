# Callie's House

A small game for my daughter to help her learn words. Tap things to hear their names,
do jobs for the family, visit the park, school and shops, make new people and decorate their houses.

The game is a React web page drawn in SVG. [Capacitor](https://capacitorjs.com) wraps it as an
Android app so it installs on the Fire tablet, works offline and uses the tablet's own voice.

## Features

**Reading at the heart of it**
- Tap anything to hear its name. Speech bubbles, letters, news headlines, song words and the sorry
  letter are read aloud with each word lighting up as it is said.
- Word games built into play: shop orders ("Can I have bread, please?"), find-the-word, sorry letters
  with the words in order, choosing song words, picking names.

**Callie's House**
- Callie's real house, room by room, with Mum, Dad, Chloe and Connor going about their day.
- Tidy-up and treasure hunts, family jobs and quests, books to read, a fridge with magnets,
  sandwiches and burgers, dressing up, a camera and photo album.
- Time of day, weather, lights, bedtime and seasons (Halloween pumpkins, a Christmas tree).
- A town to drive around: park, cafe, school, supermarket, clothes shop, pet shop and Nanny's.

**Build your own world**
- Start new worlds from scratch. Make characters with looks, a voice, personality sliders and likes.
- Say who is related to whom (mum, dad, best friend...); families live together.
- Decorate every house: furniture, walls, floors, windows and lighting.
- Build shops on the high street from 44 types; the town grows as it fills up. Move houses and shops.
- Characters wander off to the park, the cafe, her shops and each other's houses.

**Tomodachi-style life**
- Everyone has a happiness meter and a level. Thought bubbles when they are hungry, want new clothes,
  a new friend or a game. Level up and pick them a present.
- Secret favourite and worst foods with big reactions.
- Friends fall out and need help to make up (a sorry letter or a present).
- Crushes, sweethearts, weddings and babies (grown-ups she has made only).
- Town News on the TV, and a concert where characters sing the words she chooses.
- Daily presents from happy characters, and at night a peek at what they are dreaming about.
- Visitors: send someone you made to another tablet's world; they can stay for good.

**Minigames and special places**
- Pop the word (balloons), Picture match, Catch the fruit and a Duck race. Play with anyone,
  or at the funfair.
- Special places unlock as more people move in: a funfair, a concert hall and an apartment block.

**Jobs, coins and stickers**
- Deliveries, things people want, lost things, chores, visits, birthday parties and shop shifts.
- Shop tills to collect, lucky coins, letters on the mat.
- Pets to adopt, feed, walk and clean up after.
- Dozens of stickers to collect.

**Grown-ups**
- Several worlds per tablet, a world picker, and Play together: two tablets in one world, each with
  their own coins, bag and stickers.
- Back up and restore, with a daily copy in the tablet's Documents folder.

## Patch notes

Each push to `main` builds a new APK, numbered 1.0.*build*.

- **1.0.23** New worlds no longer show Callie's House jobs, tips or stories (Connor's controller,
  Chloe's tablet, the spooky box, bread for the ducks, family errands).
- **1.0.22** Minigames (Pop the word, Picture match, Catch the fruit, Duck race). Special places that
  unlock as the town grows: funfair, concert hall and apartment block. Daily presents, dreams at night,
  and visitors between tablets (postbox codes). Features and patch notes in this README.
- **1.0.21** Crushes, sweethearts, weddings and babies.
- **1.0.20** Town News on the TV. The concert: pick singers, a kind of song and the words.
- **1.0.19** Happiness meters and levels, thought-bubble needs, favourite and worst foods, falling out
  and making up.
- **1.0.18** Each build gets its own published release (fixes releases stuck as drafts).
- **1.0.17** New worlds: Callie's and Nanny's houses taken off the map; going home means your own house.
- **1.0.16** Play together connected to Firebase; connection problems shown on screen.
- **1.0.15** Play together: share a world with a code, two tablets play in it at once.
- **1.0.14** Backups work in the web version too.
- **1.0.13** Back up and restore, plus a daily copy in Documents on the tablet.
- **1.0.12** Bigger bag: 20 slots, a scrolling tray and a count.
- **1.0.11** New-world jobs, characters going out about town, and family relationships.
- **1.0.10** Worlds: keep Callie's House and start new worlds from scratch.
- **1.0.9** The town builder: build shops, place houses, and the town grows.
- **1.0.8** Pets: a pet shop to adopt from, and pets to look after at home.
- **1.0.7** Personality sliders, friendships, and characters chatting to each other.
- **1.0.6** Family jobs, animals, letters and visiting friends.
- **1.0.5** Fix people drawn on top of furniture they are behind.
- **1.0.1 to 1.0.4** The first app: the game, the app icon and the opening animation.

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
4. In the database's **Rules** tab, paste the contents of `firebase-rules.json` and publish
   (it has two parts: `rooms` for playing together and `post` for visitors).
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
