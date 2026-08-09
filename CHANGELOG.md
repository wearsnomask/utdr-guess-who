# Changelog

## v1.3.0

### New Features

- Added "Deltarune Ch. 1-5" character set, contributed by TomatoRadio
- Added option in the settings to control the background animation, allowing the user to slow it down, disable the animation, or hide the background design entirely
- Added option in the settings to adjust the background flavor (color of lines in it) - can be used by streamers so each player has a different color for easy differentiation

### Styling/UX Changes

- Added links on main menu to report bugs or request features, and to the game's page on GameJolt

# Bugfixes

- Fixed a bug on the Settings page where keyboard navigation couldn't get to the Remember Settings box

### Optimisation Changes

- Implemented preloading of character sets to reduce wait time. A set will start loading as soon as it's selected in the main menu, without waiting for the user to start a game

### Documentation Changes

- Clarified some key instructions on how to set GitHub actions after forking the project

### Miscellaneous Changes

- The URL will now contain a search parameter which includes the selected character set. When this URL is loaded, that set will be initially selected. This allows linking to the game with a particular set initially loaded (e.g. when a new set is released, can link to the game with that set selected first)
- Updated versions of packages the Tauri build depends on
- Added issue templates to the GitHub repo

## v1.2.0

### New Features

- Added "Deltarune Ch. 5" character set
- Added ability to apply specific modifiers (CSS classes) to either a character set (via "cssClass" in `config.json`) or individual cards (via adding `+.class-name` to the filename before the extension). Added modifiers are:
  - `smooth-scaling` - The image(s) will use interpolated scaling when not appearing at native resolution, as opposed to pixel scaling which is normally the default for this app
  - `pixel-scaling` - The image(s) will use pixel scaling when not appearing at native resolution. This is the default behaviour, so will only have an effect if this is applied to an individual image while `smooth-scaling` is applied to the whole character set

## v1.1.0

### New Features

- Added settings menu (linked from main menu and game scene) with the following options:
  - Edit name (moved here from main menu)
  - Edit number of guesses in a game (requires game restart to take effect)
  - Edit the size of character cards
- Added keyboard navigation to the name input scene

### Styling/UX Changes

- Page elements should no longer be hidden by the navigation bar on mobile when the page can fit them
- Improved appearance on mobile in various ways
- Miscellaneous minor changes

### Bugfixes

- Fixed a bug where when using mixed mouse and keyboard controls, select boxes would occasionally enter a glitched state
- Fixed a bug where marked cards wouldn't appear marked when inspected
- Fixed a bug where right-clicking an image while inspecting it wouldn't mark it

## v1.0.3

### API/Modding Changes

- Added ability to define custom card widths and heights in a character set's `config.json` file

### Styling/UX Changes

- Adjusted display of top-row buttons to fit the window better in widths of ~800-900px
- If the set of character cards doesn't fully fill the available space, the "Cards left" display will now be positioned closer to it

## v1.0.2

### Styling/UX Changes

- Replaced previous logo with new custom logo, since the previous logo contained Seek's branding and it's probably best to not give the impression that this version is maintained by Seek

## v1.0.1

### Styling/UX Changes

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