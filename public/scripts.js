// Globally relevant
// =================

// Constants and globals
// ---------------------

// Constant DOM references
const L_SCENES = document.querySelectorAll(".scene");
const NAME_SCENE = document.getElementById("name-scene");
const MENU_SCENE = document.getElementById("menu-scene");
const GAME_SCENE = document.getElementById("game-scene");
const INSTRUCTIONS_SCENE = document.getElementById("instructions-scene");
const CONTROLS_SCENE = document.getElementById("controls-scene");

// Globals

// The previously loaded scene, as a target for any Back buttons
let lastScene = null;

// State locks
let gameLoading = false;

// Loaded info about all available character sets
let lCharsets = null;

// Info about and in the currently-loaded character set
let loadedCharset = null;
let charsetPath = null;
let lCharImageNames = null;
let lCharInfo = null;
let numImagesLoading = 0;

// The player's character for this game
let yourCharIndex = null;


// Functions
// ---------

/**
 * Switch to target scene
 * @param {Element} newScene 
 */
function switchScene(newScene = MENU_SCENE) {
  // Custom tasks to run on each scene being switched from
  if (lastScene === NAME_SCENE) {
    NAME_INPUT.setAttribute("disabled", "disabled");
  }

  L_SCENES.forEach((el) => {
    // Mark the current scene as the last scene
    if (!el.classList.contains("hidden"))
      lastScene = el;
    el.classList.add("hidden");
  });
  newScene.classList.remove("hidden");

  // Custom tasks to run on each scene being switched to
  switch (newScene) {
    case NAME_SCENE:
      NAME_INPUT.removeAttribute("disabled");
      setTimeout(() => NAME_INPUT.focus({ focusVisible: true }), 100);
      break;

    case MENU_SCENE:
      MENU_START_LINK.focus({ focusVisible: true });
      break;

    case INSTRUCTIONS_SCENE:
      INSTRUCTIONS_BACK_BUTTON.focus({ focusVisible: true });
      INSTRUCTIONS_SCENE_HEADER.scrollIntoView();
      break;

    case CONTROLS_SCENE:
      CONTROLS_BACK_BUTTON.focus({ focusVisible: true });
      CONTROLS_SCENE_HEADER.scrollIntoView();
      break;

    default:
      break;
  }
}

/**
 * Load a JSON file from its url as an object
 * @param {String} url 
 * @returns {Promise<Object>}
 */
async function loadJSON(url) {
  return fetch(url).then(blob => blob.json());
}

/**
 * Cycles through the selected option of a "select" element
 * @param {Element} selectEl 
 */
function cycleSelect(selectEl) {
  // Check this is indeed a select element
  if (selectEl.tagName !== "SELECT") {
    console.error("cycleSelect called on element not of 'select' type: " + selectEl);
    return;
  }

  // Find the selected option, then select the next one
  const lOptions = selectEl.querySelectorAll("option");
  let iSelected = -1;
  lOptions.forEach((optionEl, i) => {
    if (optionEl.hasAttribute("selected")) {
      optionEl.removeAttribute("selected");
      iSelected = i;
    }
  });

  // Select the next option. If by chance no option was selected, going from -1 to 0 here will select the first
  iSelected += 1
  if (iSelected >= lOptions.length) {
    iSelected = 0;
  }
  lOptions[iSelected].setAttribute("selected", "selected");

}


// Name scene
// ==========

// Constants and globals
// ---------------------

// Constant DOM references
const NAME_INPUT = document.getElementById("name-input");
const NAME_SUBMIT = document.getElementById("name-submit");

// Functions
// ---------

function setName(name) {
  sessionStorage["name"] = name;
  MENU_NAME.textContent = name;
  document.querySelectorAll(".player-name").forEach((el) => el.textContent = name);
}

function getName() {
  return sessionStorage["name"];
}

/**
 * Called when the user submits their name either through the button or enter/return
 * @param {Event} e 
 */
function submitName(e) {
  // If this is a keyup event, check if the key is Enter or Return before triggering
  if (e.type === "keydown" && !(e.key === "Enter" || e.key === "Return"))
    return;
  setName(NAME_INPUT.value);
  switchScene(lastScene);
  e.stopPropagation();
}

// Setup
// -----

NAME_INPUT.addEventListener("keydown", submitName);
NAME_SUBMIT.addEventListener("click", submitName);
if (sessionStorage.getItem("name"))
  NAME_INPUT.value = getName();


// Menu scene
// ==========

// Constants and globals
// ---------------------

// Constant DOM references
const MENU_NAME = document.getElementById("menu-name");

const MENU_START_LINK = document.getElementById("menu-start");
const MENU_NAME_LINK = document.getElementById("menu-edit-name");
const MENU_INSTRUCTIONS_LINK = document.getElementById("menu-instructions");
const L_MENU_MAIN_OPTIONS = [MENU_START_LINK, MENU_NAME_LINK, MENU_INSTRUCTIONS_LINK];

const MENU_CHARSET_LABEL = document.getElementById("charset-label");
const MENU_CHARSET_SELECT = document.getElementById("charset-select");
const L_MENU_CONFIG_OPTIONS = [MENU_CHARSET_LABEL];

const L_MENU_OPTIONS = [...L_MENU_MAIN_OPTIONS, ...L_MENU_CONFIG_OPTIONS];

const CHARSET_SELECT = document.getElementById("charset-select");
const CHARSET_OPTION_TEMPLATE = document.getElementById("charset-option-template");

// Functions
// ---------

async function startGame() {
  // If the game is already loading, exit to avoid doubling up
  if (gameLoading)
    return;
  gameLoading = true;
  document.querySelectorAll(".game-loading-message").forEach(el => el.classList.remove("hidden"));

  // Load the selected character set
  const setName = CHARSET_SELECT.value;
  if (!setName) {
    alert("ERROR: No character set selected. Try reloading the page to see if the sets load properly.");
    gameLoading = false;
    return;
  }
  await loadCharacterSet(setName);

  // Store a list of all focusable character card frames
  lCharacterCardFrames = document.querySelectorAll(".character-card .character-img-frame");
  arrangeGameFocusableItems();

  // Set all characters to active
  document.querySelectorAll(".character-card").forEach((el) => {
    el.classList.remove("inactive");
    el.classList.add("active");
  });

  // Update the display of the number of active characters
  updateNumChars();

  // Randomly determine the player's character and set it up
  yourCharIndex = Math.floor(Math.random() * getNumChars());
  const yourCharInfo = lCharInfo[yourCharIndex];
  YOUR_CHAR_NAME.textContent = yourCharInfo.name;
  YOUR_CHAR_IMG.setAttribute("src", charsetPath + "/" + yourCharInfo.imageName);
  YOUR_CHAR_IMG.setAttribute("alt", yourCharInfo.name);

  // Set the image to be scaled based on its natural size
  ++numImagesLoading;
  YOUR_CHAR_IMG.onload = () => {
    --numImagesLoading;
    // Set the image to be scaled based on its natural size
    scaleImage(YOUR_CHAR_IMG, window.getComputedStyle(YOUR_CHAR_IMG).getPropertyValue('--your-char-scale'));
  }

  // Reset available guesses
  document.querySelectorAll(".guess-icon").forEach((el) => {
    el.classList.add("active");
    el.classList.remove("inactive");
  });

  // Wait until all images are loaded before we switch to the game scene
  const interval = setInterval(() => {
    if (numImagesLoading > 0)
      return;

    clearInterval(interval);

    // And finally switch to the game scene and mark loading as complete
    switchScene(GAME_SCENE);
    document.querySelectorAll(".game-loading-message").forEach(el => el.classList.add("hidden"));
    gameLoading = false;

  }, 50);
}

/**
 * Keyboard navigation for the menu scene
 * @param {KeyboardEvent} e 
 */
function navigateMenu(e) {
  // Only execute if the menu scene is active
  if (MENU_SCENE.classList.contains("hidden"))
    return;

  let currentIndex = L_MENU_OPTIONS.findIndex((el) => document.activeElement === el);

  // Check the direction of navigation
  let dir;

  switch (e.key) {
    case "ArrowDown":
    case "s":
      dir = 1;
      break;

    case "ArrowUp":
    case "w":
      dir = -1;
      break;

    case "ArrowLeft":
    case "a":
      dir = -2;
      break;

    case "ArrowRight":
    case "d":
      dir = 2;
      break;

    case " ":
    case "z":
    case "Enter":
    case "Return":
      if (currentIndex === -1)
        return;
      const el = document.activeElement;
      if (el === MENU_CHARSET_LABEL) {
        cycleSelect(MENU_CHARSET_SELECT);
      } else {
        el.click();
      }
      return;

    default:
      return;
  }

  if (currentIndex == -1) {
    // Not in the options currently, so go to the first
    L_MENU_OPTIONS[0].focus({ focusVisible: true });
    return;
  }

  // If dir is 2 or -2, we're moving right or left between the subsections of the menu
  if (dir == 2 && currentIndex < L_MENU_MAIN_OPTIONS.length) {
    currentIndex += L_MENU_MAIN_OPTIONS.length;
    // If we're gone past the end of the config options, go to the last one
    if (currentIndex >= L_MENU_OPTIONS.length)
      currentIndex = L_MENU_OPTIONS.length - 1;
  } else if (dir == -2 && currentIndex >= L_MENU_MAIN_OPTIONS.length) {
    currentIndex -= L_MENU_MAIN_OPTIONS.length;
    // If we're still in the config options, go to the last main menu option
    if (currentIndex >= L_MENU_MAIN_OPTIONS.length)
      currentIndex = L_MENU_MAIN_OPTIONS.length - 1;
  } else {
    // dir is -1 or 1, so we're moving up or down
    currentIndex += dir;
    if (currentIndex < 0)
      currentIndex = 0;
    else if (currentIndex >= L_MENU_OPTIONS.length)
      currentIndex = L_MENU_OPTIONS.length - 1;
  }

  L_MENU_OPTIONS[currentIndex].focus({ focusVisible: true });
}

async function loadCharacterSetList() {
  // Fetch the sets from the meta file
  const charsetMetaUrl = "character-sets/charset-meta.json";
  const charsetMeta = await loadJSON(charsetMetaUrl)
    .catch((err) => alert("ERROR: Could not load character set information from " + charsetMetaUrl + ".\n" +
      "Try refreshing the page in case this is a temporary issue. The error message received was: \n" + err));
  lCharsets = charsetMeta.sets;

  // Fill the options for the character set select box
  lCharsets.forEach((setName) => {
    const newCharsetOption = document.importNode(CHARSET_OPTION_TEMPLATE.content, true).querySelector(".charset-option");
    newCharsetOption.value = newCharsetOption.textContent = setName;
    CHARSET_SELECT.appendChild(newCharsetOption);
  });
}

function fixMenuTabIndex() {
  // Check if we're above or below the breakpoint, and set the tabindex appropriately so tabbing will behave as
  // expected
  if (window.innerWidth <= 800) {
    L_MENU_MAIN_OPTIONS.forEach((e) => e.setAttribute("tabindex", "2"));
    L_MENU_CONFIG_OPTIONS.forEach((e) => e.setAttribute("tabindex", "1"));
  } else {
    L_MENU_MAIN_OPTIONS.forEach((e) => e.setAttribute("tabindex", "1"));
    L_MENU_CONFIG_OPTIONS.forEach((e) => e.setAttribute("tabindex", "2"));
  }
}

// Setup
// -----

window.addEventListener("keydown", navigateMenu);
window.addEventListener("resize", fixMenuTabIndex);
MENU_START_LINK.addEventListener("click", startGame);
MENU_NAME_LINK.addEventListener("click", () => switchScene(NAME_SCENE));
MENU_INSTRUCTIONS_LINK.addEventListener("click", () => switchScene(INSTRUCTIONS_SCENE));


// Game scene
// ==========

// Constants and globals
// ---------------------

// Constant DOM references
const CHARACTER_CARD_TEMPLATE = document.getElementById("character-card-template");

const GAME_NOTES_DIALOG = document.getElementById("game-notes-dialog");
const GAME_NOTES_INPUT = document.getElementById("game-notes");
const GAME_NOTES_CLOSE = document.getElementById("game-notes-close");

const QUIT_GAME_BUTTON = document.getElementById("game-quit");
const RESTART_GAME_BUTTON = document.getElementById("game-restart");
const L_NOTES_BUTTONS = document.querySelectorAll(".game-notes");
const L_CONTROLS_BUTTONS = document.querySelectorAll(".game-controls");
const L_INSTRUCTIONS_BUTTONS = document.querySelectorAll(".game-instructions");

const YOUR_CHAR_NAME = document.getElementById("your-char-name");
const YOUR_CHAR_IMG = document.getElementById("your-char-img");
const L_GUESS_ICONS = document.querySelectorAll(".guess-icon");

const CARD_GRID = document.getElementById("card-grid");

// Globals
let cardScaleInfo = null;
let lCharacterCardFrames = null;
let lGameButtonsBeforePlayArea = null;
let lGameButtonsAfterPlayArea = null;
let lGameFocusableItems = null;

// Functions
// ---------

/**
 * Open the notes dialog
 */
function openNotes() {
  GAME_NOTES_DIALOG.showModal();
}

/**
 * Close the notes dialog
 */
function closeNotes() {
  GAME_NOTES_DIALOG.close();
}


/**
 * Get the total number of possible characters
 * @returns {Number}
 */
function getNumChars() {
  return document.querySelectorAll(".character-card").length;
}

/**
 * Get the number of characters whose cards are still active
 * @returns {Number}
 */
function getNumActiveChars() {
  return document.querySelectorAll(".character-card.active").length;
}

/**
 * Updates the displayed number of active and total characters
 */
function updateNumChars() {
  document.querySelectorAll(".cards-left-count").forEach((el) => {
    el.textContent = getNumActiveChars() + "/" + getNumChars();
  });
}

/**
 * Scale an image with the optimal scaling factor to fit in the provided frame
 * @param {HTMLImageElement} img 
 */
function scaleImage(img, frameScale = 1) {
  // Determine card scale info if not already determined
  if (!cardScaleInfo) {
    const style = window.getComputedStyle(CARD_GRID);
    const scale = style.getPropertyValue('--card-scale');
    function getPxVal(x) {
      return +(style.getPropertyValue(x).replace("px", ""));
    }
    cardScaleInfo = {
      width: scale * getPxVal('--card-base-img-width'),
      height: scale * getPxVal('--card-base-img-height'),
      borderWidth: scale * getPxVal('--card-base-border-width')
    }
    cardScaleInfo.totalWidth = cardScaleInfo.width + 2 * cardScaleInfo.borderWidth;
    cardScaleInfo.totalHeight = cardScaleInfo.height + 2 * cardScaleInfo.borderWidth;
  }

  // The maximum size we want the scaled image to be is the width of the frame, so we find the integer scale factor that
  // makes it as big as possible while still less than this size

  let width;
  let naturalWidth = img.naturalWidth, totalWidth = cardScaleInfo.totalWidth * frameScale;

  if (naturalWidth == 0) {
    // Something went wrong with loading the image and we don't know its size, so size to the default image size
    width = cardScaleInfo.width;
  } else if (naturalWidth > totalWidth) {
    // We'll need to scale it down
    let scaleDownFactor = Math.ceil(naturalWidth / totalWidth);
    width = Math.round(naturalWidth / scaleDownFactor);
  } else {
    // We'll need to either leave it alone or scale it up
    let scaleUpFactor = Math.floor(totalWidth / naturalWidth);
    width = naturalWidth * scaleUpFactor;
  }

  img.setAttribute("style", `width: ${width}px;`);
}

/**
 * Loads all characters in a character set
 * @param {String} setName 
 */
async function loadCharacterSet(setName) {

  // If this set is already loaded, do nothing
  if (setName === loadedCharset)
    return;

  charsetPath = "character-sets/" + setName.replaceAll(" ", "%20");

  // Fetch the characters in the set from the meta file
  const charMetaUrl = charsetPath + "/char-meta.json";
  const charsetMeta = await loadJSON(charMetaUrl)
    .catch((err) => alert("ERROR: Could not load character information from " + charMetaUrl + ".\n" +
      "Try refreshing the page in case this is a temporary issue. The error message received was: \n" + err));
  lCharImageNames = charsetMeta.chars;
  const dCharInfo = {};

  // Clear any present character cards
  document.querySelectorAll(".character-card").forEach((el) => el.remove());

  // Get the info for each character
  let maxCharIndex = -1;
  lCharImageNames.forEach((charImageName) => {
    let charIndex = +(charImageName.split("-")[0]);
    if (charIndex > maxCharIndex)
      maxCharIndex = charIndex

    let charName = charImageName.replace(charIndex + "-", "").replace(".png", "");
    dCharInfo[charIndex] = { name: charName, imageName: charImageName };
  });

  // Sort into a list, in case there are gaps in indices for any reason
  lCharInfo = [];
  for (let i = 0; i <= maxCharIndex; ++i) {
    if (!dCharInfo[i])
      continue;
    lCharInfo.push(dCharInfo[i]);
  }

  // Add cards to the game scene
  lCharInfo.forEach((charInfo) => {
    const newCard = document.importNode(CHARACTER_CARD_TEMPLATE.content, true).querySelector(".character-card");

    newCard.querySelector(".character-name").textContent = charInfo.name;

    const imgEl = newCard.querySelector(".character-img");
    imgEl.setAttribute("src", charsetPath + "/" + charInfo.imageName);
    imgEl.setAttribute("alt", charInfo.name);

    ++numImagesLoading;
    imgEl.onload = () => {
      --numImagesLoading;
      // Set the image to be scaled based on its natural size
      scaleImage(imgEl);
    }

    const frameEl = newCard.querySelector(".character-img-frame");
    frameEl.addEventListener("click", flipCard);
    frameEl.addEventListener("dblclick", markCard);
    frameEl.addEventListener("contextmenu", markCard, false);

    CARD_GRID.appendChild(newCard);
  });

  // Mark this set as loaded
  loadedCharset = setName;
}

/**
 * Flips a guess between available and unavailable states
 * @param {Event} e 
 */
function flipGuess(e) {
  const guessClassList = e.currentTarget.closest(".guess-icon").classList;

  if (guessClassList.contains("active")) {
    guessClassList.remove("active");
    guessClassList.add("inactive");
  } else {
    guessClassList.add("active");
    guessClassList.remove("inactive");
  }

  updateNumChars();
}

/**
 * Flips a card between active and inactive states
 * @param {Event} e 
 */
function flipCard(e) {
  let frameEl;
  if (e.currentTarget)
    frameEl = e.currentTarget;
  else
    frameEl = e;
  const cardClassList = frameEl.closest(".character-card").classList;

  if (cardClassList.contains("active")) {
    cardClassList.remove("active");
    cardClassList.add("inactive");
  } else {
    cardClassList.add("active");
    cardClassList.remove("inactive");
  }

  updateNumChars();
}

/**
 * Marks a card or unmarks it
 * @param {Event} e 
 */
function markCard(e) {
  e.preventDefault();

  const cardClassList = e.currentTarget.closest(".character-card").classList;

  if (cardClassList.contains("marked")) {
    cardClassList.remove("marked");
    cardClassList.add("unmarked");
  } else {
    cardClassList.add("marked");
    cardClassList.remove("unmarked");
  }

  return false;
}

/**
 * Sets up the list of all focusable items in the game scene, in the order they'll appear with the current window width
 */
function arrangeGameFocusableItems() {
  if (window.innerWidth <= 800) {
    lGameButtonsBeforePlayArea = [QUIT_GAME_BUTTON, RESTART_GAME_BUTTON,
      L_NOTES_BUTTONS[0], L_CONTROLS_BUTTONS[0], L_INSTRUCTIONS_BUTTONS[0]];
    lGameButtonsAfterPlayArea = [];
  } else {
    lGameButtonsBeforePlayArea = [QUIT_GAME_BUTTON, RESTART_GAME_BUTTON, L_NOTES_BUTTONS[1]];
    lGameButtonsAfterPlayArea = [L_CONTROLS_BUTTONS[1], L_INSTRUCTIONS_BUTTONS[1]];
  }
  lGameFocusableItems = [...lGameButtonsBeforePlayArea, ...L_GUESS_ICONS, ...lCharacterCardFrames,
  ...lGameButtonsAfterPlayArea];
}

/**
 * Keyboard navigation for the game scene
 * @param {KeyboardEvent} e 
 */
function navigateGame(e) {
  // Only execute if the game scene is active
  if (GAME_SCENE.classList.contains("hidden"))
    return;

  // Get current position
  let currentIndex = lGameFocusableItems.findIndex((el) => document.activeElement === el);

  const numButtonsBeforePlayArea = lGameButtonsBeforePlayArea.length;
  const numGuessIcons = L_GUESS_ICONS.length;
  const numCharacterCards = lCharacterCardFrames.length;
  const numFocusable = lGameFocusableItems.length;

  // Check the direction of navigation
  let dir;
  switch (e.key) {
    case "ArrowDown":
    case "s":
      dir = 2;
      break;

    case "ArrowUp":
    case "w":
      dir = -2;
      break;

    case "ArrowRight":
    case "d":
      dir = 1;
      break;

    case "ArrowLeft":
    case "a":
      dir = -1;
      break;

    case " ":
    case "z":
    case "Enter":
    case "Return":
      if (currentIndex === -1)
        return;
      e.stopPropagation();
      e.preventDefault();
      // Simulate a click event
      document.activeElement.click();
      return;

    case "x":
      if (currentIndex < numButtonsBeforePlayArea + numGuessIcons ||
        currentIndex >= numButtonsBeforePlayArea + numGuessIcons + numCharacterCards)
        return;
      e.stopPropagation();
      e.preventDefault();
      // Simulate a right-click event, which will trigger marking the card if a card is selected
      document.activeElement.dispatchEvent(new MouseEvent('contextmenu',
        { bubbles: true, cancelable: true, view: window }));
      return;

    case "c":
      // Flip all cards
      lCharacterCardFrames.forEach((el) => flipCard(el));
      return;

    default:
      return;
  }

  if (currentIndex == -1) {
    // Not in the options currently, so go to the first character card
    lCharacterCardFrames[0].focus({ focusVisible: true });
    return;
  }

  if (Math.abs(dir) > 1) {
    // If dir is 2 or -2, we're moving down or up respectively
    if (currentIndex < numButtonsBeforePlayArea) {
      // We're currently on one of the buttons at the start, so go either to the first button or to the guess icons
      if (dir > 0) {
        currentIndex = numButtonsBeforePlayArea;
      } else {
        currentIndex = 0;
      }
    } else if (currentIndex < numButtonsBeforePlayArea + numGuessIcons) {
      // We're currently on a guess icon, so go to either the beginning buttons or the character cards
      if (dir > 0) {
        currentIndex = numButtonsBeforePlayArea + numGuessIcons;
      } else {
        currentIndex = 0;
      }
    } else if (currentIndex < numButtonsBeforePlayArea + numGuessIcons + numCharacterCards) {
      // We're in the card grid, so either move to the guess icons, a different line in the grid, or the after buttons

      // Count how many columns there currently are in the grid
      const numCols = window.getComputedStyle(CARD_GRID).getPropertyValue("grid-template-columns").split(" ").length;

      // Check if we're moving back from the first row or forward from the last row, in which case go to the guess icons
      if (currentIndex < numButtonsBeforePlayArea + numGuessIcons + numCols && dir < 0) {
        currentIndex = numButtonsBeforePlayArea;
      } else if (currentIndex >= numButtonsBeforePlayArea + numGuessIcons + numCharacterCards - numCols && dir > 0) {
        currentIndex = numButtonsBeforePlayArea + numGuessIcons + numCharacterCards;
      } else {
        currentIndex += Math.sign(dir) * numCols;
      }
    } else {
      // We're in the buttons after the play area, so either go back to the last row of the character grid, or the end
      // of these buttons
      if (dir > 0) {
        currentIndex = numFocusable - 1;
      } else {
        // The grid might not be perfectly rectangular, so we can't simply count back from the end to get to the
        // beginning of the last row. Instead we need to count from the beginning
        const numCols = window.getComputedStyle(CARD_GRID).getPropertyValue("grid-template-columns").split(" ").length;
        const numRows = window.getComputedStyle(CARD_GRID).getPropertyValue("grid-template-rows").split(" ").length;
        currentIndex = numButtonsBeforePlayArea + numGuessIcons + numCols * (numRows - 1);
      }
    }
  } else {
    // dir is -1 or 1, so we're moving right or left
    currentIndex += dir;
  }
  if (currentIndex < 0)
    currentIndex = 0;
  else if (currentIndex >= numFocusable)
    currentIndex = numFocusable - 1;

  lGameFocusableItems[currentIndex].focus({ focusVisible: true });

}

// Setup
// -----

window.addEventListener("keydown", navigateGame);
window.addEventListener("resize", arrangeGameFocusableItems);

QUIT_GAME_BUTTON.addEventListener("click", () => switchScene(MENU_SCENE));
RESTART_GAME_BUTTON.addEventListener("click", startGame);

L_NOTES_BUTTONS.forEach((el) => el.addEventListener("click", openNotes));
GAME_NOTES_CLOSE.addEventListener("click", closeNotes);

L_CONTROLS_BUTTONS.forEach((el) => el.addEventListener("click", () => switchScene(CONTROLS_SCENE)));
L_INSTRUCTIONS_BUTTONS.forEach((el) => el.addEventListener("click", () => switchScene(INSTRUCTIONS_SCENE)));

L_GUESS_ICONS.forEach((el) => el.addEventListener("click", flipGuess));
// Character cards are added dynamically, so the click event to flip them has to be added when they're added

// Instructions scene
// ==================

// Constants and globals
// ---------------------

// Constant DOM references
const INSTRUCTIONS_SCENE_HEADER = document.getElementById("instructions-scene");
const INSTRUCTIONS_BACK_BUTTON = document.getElementById("instructions-back");

// Functions
// ---------

// Setup
// -----

INSTRUCTIONS_BACK_BUTTON.addEventListener("click", () => switchScene(lastScene));


// Controls scene
// ==================

// Constants and globals
// ---------------------

// Constant DOM references
const CONTROLS_SCENE_HEADER = document.getElementById("controls-scene");
const CONTROLS_BACK_BUTTON = document.getElementById("controls-back");

// Functions
// ---------

// Setup
// -----

CONTROLS_BACK_BUTTON.addEventListener("click", () => switchScene(lastScene));


// Final setup
// ===========
window.onload = function () {
  lastScene = MENU_SCENE;
  NAME_INPUT.focus({ focusVisible: true });

  fixMenuTabIndex();
  loadCharacterSetList();
}