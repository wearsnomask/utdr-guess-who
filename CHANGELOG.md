# Changelog

## v1.0.1

## Styling/UX Changes

- Added custom icon for site

### Miscellaneous Changes

- Added ability to build the game for installation via [Tauri](https://github.com/tauri-apps/tauri), with a new "Publish" workflow to publish it as a Release on GitHub
  - This required some changes to the code for the game, none of which should affect the web version. The Tauri version will have some minor stylistic differences where necessary

## v1.0.0

Initial public release. New features compared to the original game by Seek:

- New character sets:
  - Undertale
  - Undertale Yellow
- Support for basically any device that can run a web browser
- Flexible scaling and rearrangement of items to fit the size of your browser window
- Keyboard controls (WASD/arrow keys to move, space/enter/Z to select)
- Support for multiple character sets (making it as easy as possible to mod and add more)
- Ability to remember the user's name and skip the name-entry screen
- Ability to inspect character images to look more closely at them (by pressing the I key or middle-clicking, then +/- keys or mousewheel to scale the size). These controls may not work on mobile devices, but you can use pinch-to-zoom there to achieve the same effect
- Ability to look up a character on the game's wiki by using the L button or clicking the "Look up character" button then the character you want to look up

Features present in the original game but not in this version:

- The ability to press a button to reset all cards, which I judged wasn't worth the drawback of risking it being pressed accidentally and losing all progress
- Sounds, since this functions as a website and people may not be expecting sounds from a website that doesn't obviously play music or audio (I may add this back in as an option at some point)