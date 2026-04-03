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
  if (newScene === NAME_SCENE) {
    NAME_INPUT.removeAttribute("disabled");
    setTimeout(() => NAME_INPUT.focus(), 100);
  } else if (newScene === MENU_SCENE) {
    MENU_START_LINK.focus();
  } else if (newScene === INSTRUCTIONS_SCENE) {
    INSTRUCTIONS_BACK_BUTTON.focus();
    INSTRUCTIONS_SCENE_HEADER.scrollIntoView();
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
  querySelectorAll(".player-name").forEach((el) => el.textContent = name);
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

  // Load the selected character set
  const setName = CHARSET_SELECT.value;
  if (!setName) {
    alert("ERROR: No character set selected. Try reloading the page to see if the sets load properly.");
    gameLoading = false;
    return;
  }
  await loadCharacterSet(setName);

  // Set all characters to active
  querySelectorAll(".character-card").forEach((el) => {
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

  // And finally switch to the game scene and mark loading as complete
  switchScene(GAME_SCENE);
  gameLoading = false;
}

function navigateMenu(e) {
  // Only execute if the menu scene is active
  if (MENU_SCENE.classList.contains("hidden"))
    return;

  let currentIndex = L_MENU_OPTIONS.findIndex((el) => document.activeElement === el);

  // Check if we're navigating forwards or backwards
  let dir;
  if (e.key === "ArrowDown") {
    dir = 1;
  } else if (e.key === "ArrowUp") {
    dir = -1;
  } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    dir = 0;
  } else if (e.key === " " || e.key === "z" && currentIndex !== -1) {
    const el = document.activeElement;
    e.stopPropagation();
    if (el === MENU_CHARSET_LABEL) {
      cycleSelect(MENU_CHARSET_SELECT);
    } else {
      el.click();
    }
    return;
  } else {
    return;
  }

  if (currentIndex == -1) {
    // Not in the options currently, so go to the first
    L_MENU_OPTIONS[0].focus();
    return;
  }

  // If dir==0, we're moving right or left between the subsections of the menu
  if (dir === 0) {
    if (currentIndex < L_MENU_MAIN_OPTIONS.length) {
      // We're in the main menu options, so jump to the config options
      currentIndex += L_MENU_MAIN_OPTIONS.length;
      // If we're gone past the end of the config options, go to the last one
      if (currentIndex >= L_MENU_OPTIONS.length)
        currentIndex = L_MENU_OPTIONS.length - 1;
    } else {
      // We're in the main menu options, so jump to the main menu options
      currentIndex -= L_MENU_MAIN_OPTIONS.length;
      // If we're still in the config options, go to the last main menu option
      if (currentIndex >= L_MENU_MAIN_OPTIONS.length)
        currentIndex = L_MENU_MAIN_OPTIONS.length - 1;
    }
  } else {
    // dir is -1 or 1, so we're moving up or down
    currentIndex += dir;
    if (currentIndex < 0)
      currentIndex = L_MENU_OPTIONS.length - 1;
    else if (currentIndex >= L_MENU_OPTIONS.length)
      currentIndex = 0;
  }

  L_MENU_OPTIONS[currentIndex].focus();
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
YOUR_CHAR_NAME = getElementById("your-char-name");
YOUR_CHAR_IMG = getElementById("your-char-img");

// Functions
// ---------

/**
 * Get the total number of possible characters
 * @returns {Number}
 */
function getNumChars() {
  return querySelectorAll(".character-card").length;
}

/**
 * Get the number of characters whose cards are still active
 * @returns {Number}
 */
function getNumActiveChars() {
  return querySelectorAll(".character-card.active").length;
}

/**
 * Updates the displayed number of active and total characters
 */
function updateNumChars() {
  querySelectorAll(".cards-left-count").forEach((el) => {
    el.textContent = getNumActiveChars() + "/" + getNumChars();
  });
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

  // TODO: Clear the game scene

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

  // TODO: Add cards to the game scene

  // Mark this set as loaded
  loadedCharset = setName;
}

// Setup
// -----


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


// Final setup
// ===========
window.onload = function () {
  lastScene = MENU_SCENE;
  NAME_INPUT.focus();

  fixMenuTabIndex();
  loadCharacterSetList();
}