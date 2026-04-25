// Globally relevant
// =================

// Class definitions
// -----------------

/**
 * A class to watch a scene for when it's entered or exited and trigger callbacks on each, so that
 * we can define tasks we want to run whenever a scene is entered or exited
 */
class SceneSwitchWatcher {

  /**
   * @param {Element} targetNode 
   * @param {Function} sceneEntryCallback 
   * @param {Function} sceneExitCallback 
   */
  constructor(targetNode, sceneEntryCallback, sceneExitCallback) {
    this.targetNode = targetNode

    // If entry or exit callbacks aren't provided, define them as dummy functions
    if (typeof sceneEntryCallback === "function")
      this.sceneEntryCallback = sceneEntryCallback
    else
      this.sceneEntryCallback = () => { return; };
    if (typeof sceneExitCallback === "function")
      this.sceneExitCallback = sceneExitCallback
    else
      this.sceneExitCallback = () => { return; };
    this.observer = null
    this.lastClassState = targetNode.classList.contains("hidden")

    this.init()
  }

  init() {
    this.observer = new MutationObserver(this.mutationCallback);
    this.observe();
  }

  observe() {
    this.observer.observe(this.targetNode, { attributes: true });
  }

  disconnect() {
    this.observer.disconnect();
  }

  mutationCallback = mutationsList => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        let currentClassState = mutation.target.classList.contains("hidden");
        if (this.lastClassState !== currentClassState) {
          this.lastClassState = currentClassState;
          if (currentClassState)
            this.sceneExitCallback();
          else
            this.sceneEntryCallback();
        }
      }
    }
  }
}

// Constants and globals
// ---------------------

// Constant DOM references
const L_SCENES = document.querySelectorAll(".scene");
const NAME_SCENE = document.getElementById("name-scene");
const MENU_SCENE = document.getElementById("menu-scene");
const GAME_SCENE = document.getElementById("game-scene");
const INSTRUCTIONS_SCENE = document.getElementById("instructions-scene");
const CONTROLS_SCENE = document.getElementById("controls-scene");
const CREDITS_SCENE = document.getElementById("credits-scene");

// Other constants
const SCREEN_SIZE_BREAKPOINT = 800;

// Globals

// The previously loaded scene, as a target for any Back buttons
let lastScene = null;

// State locks
let sceneSwitching = false;
let gameLoading = false;

// Loaded info about all available character sets
let lCharsets = null;

// Functions
// ---------

/**
 * Stores a cookie with the provided information
 * @param {Object} oItems 
 * @param {Number} daysToExpire 
 */
function setCookie(oItems, daysToExpire = 365) {

  // Craft a string to define the expiry date of the cookie
  const expTime = new Date();
  expTime.setTime(expTime.getTime() + (daysToExpire * 24 * 60 * 60 * 1000));
  let sExpiry = "expires=" + expTime.toUTCString();

  // Craft a string containing all the keys and values to be in the cookie
  let sItems = "";
  for (const [key, value] of Object.entries(oItems)) {
    sItems += `${key}=${value};`
  }

  document.cookie = sItems + sExpiry + ";path=/";
}

/**
 * Deletes the currently-stored cookie for this page
 */
function deleteCookie() {

  // Craft a string to define the expiry date as being in the past
  const expTime = new Date();
  expTime.setTime(expTime.getTime() - (24 * 60 * 60 * 1000));
  let sExpiry = "expires=" + expTime.toUTCString();

  document.cookie = "name=;" + sExpiry + ";path=/";
}

/**
 * Get an object provided all information stored in the cookie for this page
 * @returns {Object}
 */
function getCookie() {
  let oItems = {};
  let decodedCookie = decodeURIComponent(document.cookie);
  let lItemStrings = decodedCookie.split(';');
  for (let i = 0; i < lItemStrings.length; i++) {
    let key, value;
    [key, value] = lItemStrings[i].split("=");
    oItems[key.trim()] = value;
  }
  return oItems;
}

/**
 * Switch to target scene
 * @param {Element} newScene 
 */
function switchScene(newScene = MENU_SCENE) {

  // Check for scene switch lock so we don't overlap scene switches
  if (sceneSwitching)
    return;
  sceneSwitching = true;

  // Find the current scene, deactivate it, and mark it as the last scene
  for (let el of L_SCENES) {
    if (!el.classList.contains("hidden")) {
      el.classList.add("hidden");

      // Failsafe in case something goes wrong - we don't want the lastScene to ever be the current scene, so we check
      // to make sure this won't somehow happen
      if (el !== newScene)
        lastScene = el;

      break;
    }
  }

  // Activate the new scene
  newScene.classList.remove("hidden");

  setTimeout(() => sceneSwitching = false, 250);
}

/**
 * Keyboard navigation for scenes with only text in them
 * @param {KeyboardEvent} e
 */
function navigateTextScenes(e) {
  // Only execute in appropriate scenes
  if (INSTRUCTIONS_SCENE.classList.contains("hidden") && CONTROLS_SCENE.classList.contains("hidden") &&
    NAME_SCENE.classList.contains("hidden"))
    return;

  switch (e.key) {
    case "z":
    case " ":
    case "Enter":
    case "Escape":
      switchScene(lastScene);
      return;

    default:
      return;
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
  lOptions[iSelected].setAttribute("selected", "true");

}

/**
 * Simple implementation of an ease-out interpolation to a target value
 * @param {Number} cur 
 * @param {Number} target 
 * @param {Number} frac 
 * @param {Number} minChange 
 */
function approach(cur, target, frac = 0.2, minChange = 0.01) {
  let change = frac * (target - cur);
  if (minChange > Math.abs(change)) {
    change = Math.sign(change) * minChange;
    // Check if this causes us to surpass the target
    if ((target - cur) * (target - cur - change) < 0)
      return target;
  }
  return cur + change;
}

// Setup
// -----

const cookieData = getCookie();


// Name scene
// ==========

// Constants and globals
// ---------------------

// Constant DOM references
const NAME_INPUT = document.getElementById("name-input");
const NAME_SUBMIT = document.getElementById("name-submit");
const NAME_REMEMBER = document.getElementById("remember-name");

// Functions
// ---------

function initNameScene() {
  NAME_INPUT.removeAttribute("disabled");
  setTimeout(() => NAME_INPUT.focus({ focusVisible: true }), 100);
}

function exitNameScene() {
  NAME_INPUT.setAttribute("disabled", "disabled");
}

function setName(name) {
  sessionStorage["name"] = name;
  MENU_NAME.textContent = name;
  document.querySelectorAll(".player-name").forEach((el) => el.textContent = name);

  // If the user desires, store the name in a cookie to remember it
  if (NAME_REMEMBER.checked) {
    setCookie({ name: name });
  } else {
    // Otherwise delete any previously-set cookie
    deleteCookie();
  }
}

function getName() {
  return sessionStorage["name"];
}

/**
 * Called when the user submits their name either through the button or enter/return
 * @param {Event} e 
 */
function submitName(e) {
  // If this is a keyup event, check if the key is Enter before triggering
  if (e.type === "keydown" && e.key !== "Enter")
    return;
  setName(NAME_INPUT.value);
  switchScene(lastScene);
  e.stopPropagation();
}

// Setup
// -----

NAME_INPUT.addEventListener("keydown", submitName);
NAME_SUBMIT.addEventListener("click", submitName);

// Check if the user's name is saved, and set the name entry scene to be skipped if so
let initName = null;
if (cookieData.name) {
  // The user's name is stored in their cookie
  initName = cookieData.name;
  NAME_REMEMBER.checked = true;
} else if (sessionStorage.getItem("name")) {
  // The user set their name already in this browser session
  initName = getName();
}

const nameSceneSwitchWatcher = new SceneSwitchWatcher(NAME_SCENE, initNameScene, exitNameScene);


// Menu scene
// ==========

// Constants and globals
// ---------------------

// Constant DOM references
const MENU_NAME = document.getElementById("menu-name");

const MENU_START_LINK = document.getElementById("menu-start");
const MENU_NAME_LINK = document.getElementById("menu-edit-name");
const MENU_INSTRUCTIONS_LINK = document.getElementById("menu-instructions");
const MENU_CREDITS_LINK = document.getElementById("menu-credits");
const L_MENU_MAIN_OPTIONS = [MENU_START_LINK, MENU_NAME_LINK, MENU_INSTRUCTIONS_LINK, MENU_CREDITS_LINK];

const MENU_CHARSET_LABEL = document.getElementById("charset-label");
const MENU_CHARSET_SELECT = document.getElementById("charset-select");
const L_MENU_CONFIG_OPTIONS = [MENU_CHARSET_LABEL];

const L_MENU_OPTIONS = [...L_MENU_MAIN_OPTIONS, ...L_MENU_CONFIG_OPTIONS];

const CHARSET_SELECT = document.getElementById("charset-select");
const CHARSET_OPTION_TEMPLATE = document.getElementById("charset-option-template");

// Functions
// ---------

function initMenuScene() {
  window.addEventListener("keydown", navigateMenu);
  window.addEventListener("resize", fixMenuTabIndex);
  fixMenuTabIndex();
  MENU_START_LINK.focus({ focusVisible: true });
}

function exitMenuScene() {
  window.removeEventListener("keydown", navigateMenu);
  window.removeEventListener("resize", fixMenuTabIndex);
}

/**
 * Updates the displayed percent of loading progress on the main menu
 */
function updateLoadingPercent() {
  let loadedPercent = 0;
  if (numImagesToLoadTotal > 0)
    loadedPercent = Math.floor(100 * (1 - numImagesLoading / numImagesToLoadTotal));
  document.querySelectorAll(".game-loading-percent").forEach(el => el.textContent = loadedPercent + "%");
}

async function startGame() {
  // If the game is already loading, exit to avoid doubling up
  if (gameLoading)
    return;
  gameLoading = true;
  numImagesToLoadTotal = 0;
  updateLoadingPercent();

  document.querySelectorAll(".game-loading-message").forEach(el => el.classList.remove("hidden"));

  // Load the selected character set
  const setName = CHARSET_SELECT.value;
  if (!setName) {
    alert("ERROR: No character set selected. Try reloading the page to see if the sets load properly.");
    gameLoading = false;
    return;
  }
  await loadCharacterSet(setName);

  // Make sure lookup mode starts disabled
  setOffLookupMode();

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
  YOUR_CHAR_IMG_FRAME.value = yourCharInfo.name;
  YOUR_CHAR_IMG.setAttribute("alt", yourCharInfo.name);

  // Set the image to be scaled based on its natural size
  ++numImagesLoading;
  ++numImagesToLoadTotal;
  YOUR_CHAR_IMG.onload = () => {
    --numImagesLoading;
    updateLoadingPercent();
    // Set the image to be scaled based on its natural size
    scaleImage(YOUR_CHAR_IMG, window.getComputedStyle(YOUR_CHAR_IMG).getPropertyValue('--your-char-scale'));
  }
  YOUR_CHAR_IMG.onerror = () => {
    // If it can't be loaded, leave it blank - better than hanging forever
    --numImagesLoading;
    updateLoadingPercent();
  }

  // Start loading the image
  YOUR_CHAR_IMG.setAttribute("src", charsetPath + "/" + yourCharInfo.imgName);

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
  } else if ((currentIndex == L_MENU_MAIN_OPTIONS.length - 1 && dir == 1) ||
    (currentIndex == L_MENU_MAIN_OPTIONS.length && dir == -1)) {
    // We would be moving between menus, so do nothing
    return;
  } else {
    // dir is -1 or 1, so we're moving up or down within the same menu
    currentIndex += dir;
    if (currentIndex < 0) {
      // Loop around only in small-window mode, where the config menu is placed on top of the main menu
      if (window.innerWidth <= SCREEN_SIZE_BREAKPOINT)
        currentIndex = L_MENU_OPTIONS.length - 1;
      else
        currentIndex = 0;
    }
    else if (currentIndex >= L_MENU_OPTIONS.length) {
      if (window.innerWidth <= SCREEN_SIZE_BREAKPOINT)
        currentIndex = 0;
      else
        currentIndex = L_MENU_OPTIONS.length - 1;
    }
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

  // Check through the names of character sets to determine how they should be sorted
  const lSortedCharsets = [];
  const lUnsortedCharsets = [];

  lCharsets.forEach((charsetName) => {
    // Check if this name starts with an index
    let i = parseInt(charsetName.split("-")[0]);
    if ((i === NaN) || (!charsetName.startsWith(i.toString()))) {
      // Doesn't appear to start with an index, so add it to the unsorted list
      lUnsortedCharsets.push({ name: charsetName, unindexedName: charsetName });
      return;
    }

    // This appears to be indexed
    let charsetNameInfo = { name: charsetName, unindexedName: charsetName.replace(i + "-", "") };

    // Make sure it can fit into the sorted list and isn't already present
    if (i > lSortedCharsets.length - 1)
      lSortedCharsets.length = i + i;
    if (lSortedCharsets[i] !== undefined) {
      // This index is already in the list, so log an error and add it to the unsorted list
      console.error("More than one character set has the index " + i + ". Sorting will not appear as intended.");
      lUnsortedCharsets.push(charsetNameInfo);
      return;
    }
    lSortedCharsets[i] = charsetNameInfo;
  });

  // Fill the options for the character set select box
  const lAllCharsets = [...lSortedCharsets, ...lUnsortedCharsets];
  lAllCharsets.forEach((charsetNameInfo) => {
    if (charsetNameInfo === undefined)
      return;
    const newCharsetOption = document.importNode(CHARSET_OPTION_TEMPLATE.content, true).querySelector(".charset-option");
    newCharsetOption.textContent = charsetNameInfo.unindexedName;
    newCharsetOption.value = charsetNameInfo.name;
    CHARSET_SELECT.appendChild(newCharsetOption);
  });
}

function fixMenuTabIndex() {
  // Check if we're above or below the breakpoint, and set the tabindex appropriately so tabbing will behave as
  // expected
  if (window.innerWidth <= SCREEN_SIZE_BREAKPOINT) {
    L_MENU_MAIN_OPTIONS.forEach((e) => e.setAttribute("tabindex", "2"));
    L_MENU_CONFIG_OPTIONS.forEach((e) => e.setAttribute("tabindex", "1"));
  } else {
    L_MENU_MAIN_OPTIONS.forEach((e) => e.setAttribute("tabindex", "1"));
    L_MENU_CONFIG_OPTIONS.forEach((e) => e.setAttribute("tabindex", "2"));
  }
}

// Setup
// -----

MENU_START_LINK.addEventListener("click", startGame);
MENU_NAME_LINK.addEventListener("click", () => switchScene(NAME_SCENE));
MENU_INSTRUCTIONS_LINK.addEventListener("click", () => switchScene(INSTRUCTIONS_SCENE));
MENU_CREDITS_LINK.addEventListener("click", () => switchScene(CREDITS_SCENE));
const menuSceneSwitchWatcher = new SceneSwitchWatcher(MENU_SCENE, initMenuScene, exitMenuScene);


// Game scene
// ==========

// Constants and globals
// ---------------------

// Constant DOM references
const CHARACTER_CARD_TEMPLATE = document.getElementById("character-card-template");

const GAME_LOOKUP_CURSOR = document.getElementById("game-lookup-cursor");

const GAME_NOTES_DIALOG = document.getElementById("game-notes-dialog");
const GAME_NOTES_INPUT = document.getElementById("game-notes");
const GAME_NOTES_CLOSE = document.getElementById("game-notes-close");

const QUIT_GAME_BUTTON = document.getElementById("game-quit");
const RESTART_GAME_BUTTON = document.getElementById("game-restart");
const L_LOOKUP_BUTTONS = document.querySelectorAll(".game-lookup");
const L_NOTES_BUTTONS = document.querySelectorAll(".game-notes");
const L_CONTROLS_BUTTONS = document.querySelectorAll(".game-controls");
const L_INSTRUCTIONS_BUTTONS = document.querySelectorAll(".game-instructions");

const YOUR_CHAR_NAME = document.getElementById("your-char-name");
const YOUR_CHAR_IMG_FRAME = document.getElementById("your-char-img-frame");
const YOUR_CHAR_IMG = document.getElementById("your-char-img");
const L_GUESS_ICONS = document.querySelectorAll(".guess-icon");

const CARD_GRID = document.getElementById("card-grid");

// Other constants
const DEFAULT_LOOKUP_URL = "https://www.google.com/search?q=Undertale%20Deltarune%20%s&udm=14"
const DEFAULT_CHARSET_CONFIG = { "lookupUrl": DEFAULT_LOOKUP_URL }

const MIN_INSPECT_SCALE = 1.5;
const MAX_INSPECT_SCALE = 8;
const INSPECT_SCALE_INCREMENT = 0.5;

// Globals
let targetInspectScale = +window.getComputedStyle(document.body).getPropertyValue('--inspect-scale');
let inspectScale = targetInspectScale;
let inspectScaleAdjustInterval = null;

let cardScaleInfo = null;
let lCharacterCardFrames = [];
let lGameButtonsBeforePlayArea = null;
let lGameButtonsAfterPlayArea = null;
let lGameFocusableItems = null;

// Info about and in the currently-loaded character set
let loadedCharset = null;
let charsetPath = null;
let charsetConfig = null;
let lCharImageNames = null;
let lCharInfo = null;
let numImagesToLoadTotal = 0;
let numImagesLoading = 0;

// The player's character for the current game
let yourCharIndex = null;

// Functions
// ---------

function initGameScene() {
  window.addEventListener("keydown", navigateGame);
  window.addEventListener("resize", arrangeGameFocusableItems);
  arrangeGameFocusableItems();
}

function exitGameScene() {
  window.removeEventListener("keydown", navigateGame);
  window.removeEventListener("resize", arrangeGameFocusableItems);
}

// Functions to set/get aspects of lookup mode

function setMouseLookupMode() {
  document.documentElement.setAttribute("lookup-mode", "mouse");

  // Remove any events to switch to mouse lookup mode
  window.removeEventListener("mousemove", setMouseLookupMode);
}

function setKeyLookupMode() {
  document.documentElement.setAttribute("lookup-mode", "key");

  // Prepare an event to switch to mouse lookup move when the mouse is moved
  window.addEventListener("mousemove", setMouseLookupMode);
}

function setOffLookupMode() {
  window.removeEventListener("mousemove", setMouseLookupMode);
  window.removeEventListener("click", lookupTarget);
  document.documentElement.setAttribute("lookup-mode", "off");
}

function getLookupMode() {
  return document.documentElement.getAttribute("lookup-mode");
}

function lookupModeEnabled() {
  const lookupMode = getLookupMode();
  return lookupMode && lookupMode !== "off";
}

function mouseLookupModeEnabled() {
  return getLookupMode() === "mouse";
}

function keyLookupModeEnabled() {
  return getLookupMode() === "key";
}

/**
 * Start lookup mode
 */
function startLookupMode(e) {
  // If this gets triggered when we're already in lookup mode, end it
  if (lookupModeEnabled()) {
    setOffLookupMode();
    return;
  }

  if (e instanceof PointerEvent && e.pointerId !== -1)
    setMouseLookupMode();
  else {
    setKeyLookupMode();
    // If starting in key mode, move focus to the first character card
    lCharacterCardFrames[0].focus({ focusVisible: true });
  }

  // Prepare an event to look up the target
  window.addEventListener("click", lookupTarget);

  // Set the lookup mode cursor in the proper position
  updateLookupCursorPosition();

  // Stop propagation, as otherwise the lookupTarget function will be called immediately
  e.stopPropagation();
}

/**
 * Look up the target character being hovered over
 */
function lookupTarget(e) {

  // First, figure out what to look up. Check the Your Character frame, as well as all character cards. What feature we
  // check for depends on which lookup mode we're in
  let lookupFeature;
  if (keyLookupModeEnabled())
    lookupFeature = ":focus-visible";
  else if (mouseLookupModeEnabled())
    lookupFeature = ":hover";
  else
    lookupFeature = ":is(:focus-visible, :hover)";
  let imgFrame = document.querySelector(`#your-char-img-frame${lookupFeature}, .character-img-frame${lookupFeature}, ` +
    `.inspect-img-frame${lookupFeature}`);

  if (!imgFrame) {
    // Nothing is hovered over, so end lookup mode and return without doing anything else
    setOffLookupMode();
    return;
  }

  // Get the image frame, which will have the character name as its value
  if (!imgFrame.classList.contains("img-frame")) {
    imgFrame = imgFrame.closest(".character-card").querySelector(".img-frame");
  }

  let charName = imgFrame.value;

  // Construct the URL for the search
  let searchUrl = charsetConfig.lookupUrl;
  searchUrl = searchUrl.replace("%s", charName.replace(" ", "%20"));
  open(searchUrl);

  // End lookup mode
  setOffLookupMode();
}

function updateLookupCursorPosition() {

  // Determine the position from the focused element, if any
  const focusedElement = document.querySelector(":focus-visible");
  if (!focusedElement)
    return;

  const rect = focusedElement.getBoundingClientRect();
  const x = 0.5 * (rect.left + rect.right) + window.scrollX - 0.25 * GAME_LOOKUP_CURSOR.naturalWidth;
  const y = 0.5 * (rect.top + rect.bottom) + window.scrollY - 0.5 * GAME_LOOKUP_CURSOR.naturalHeight;

  GAME_LOOKUP_CURSOR.setAttribute("style", `top: ${y}px; left: ${x}px;`);
}

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
  let naturalWidth = img.naturalWidth, totalWidth = cardScaleInfo.totalWidth;

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

  img.setAttribute("style", `width: ${width * frameScale}px;`);
}

/**
 * Loads all characters in a character set
 * @param {String} setName 
 */
async function loadCharacterSet(setName) {

  // If this set is already loaded, do nothing
  if (setName === loadedCharset)
    return;

  // Load the meta file for the character set
  charsetPath = "character-sets/" + setName.replaceAll(" ", "%20");
  const charMetaUrl = charsetPath + "/char-meta.json";
  const charsetMeta = await loadJSON(charMetaUrl)
    .catch((err) => alert("ERROR: Could not load character information from " + charMetaUrl + ".\n" +
      "Try refreshing the page in case this is a temporary issue. The error message received was: \n" + err));

  // Get the config for the character set from the meta file
  charsetConfig = charsetMeta.config;
  if (charsetConfig === null)
    charsetConfig = DEFAULT_CHARSET_CONFIG;

  // Fetch the characters in the set from the meta file
  lCharImageNames = charsetMeta.chars;
  const dCharInfo = {};

  // Clear any present character cards
  document.querySelectorAll(".character-card").forEach((el) => el.remove());

  // Check through the names of character images to determine how they should be sorted
  const lSortedChars = [];
  const lUnsortedChars = [];

  lCharImageNames.forEach((charImgName) => {
    // Check if this name starts with an index
    let i = parseInt(charImgName.split("-")[0]);
    if ((i === NaN) || (!charImgName.startsWith(i.toString()))) {
      // Doesn't appear to start with an index, so add it to the unsorted list
      lUnsortedChars.push({ imgName: charImgName.replace(" ", "%20"), name: charImgName.replace(".png", "") });
      return;
    }

    // This appears to be indexed
    let charInfo = { imgName: charImgName.replace(" ", "%20"), name: charImgName.replace(i + "-", "").replace(".png", "") };

    // Make sure it can fit into the sorted list and isn't already present
    if (i > lSortedChars.length - 1)
      lSortedChars.length = i + i;
    if (lSortedChars[i] !== undefined) {
      // This index is already in the list, so log an error and add it to the unsorted list
      console.error("More than one character has the index " + i + ". Sorting will not appear as intended.");
      lUnsortedChars.push(charInfo);
      return;
    }
    lSortedChars[i] = charInfo;
  });

  // Get the info for each character
  const lAllChars = [...lSortedChars, ...lUnsortedChars];
  lCharInfo = [];
  const inspectImgScale = window.getComputedStyle(YOUR_CHAR_IMG).getPropertyValue('--your-char-scale');
  lAllChars.forEach((charInfo) => {
    if (charInfo === undefined)
      return;
    lCharInfo.push(charInfo);
    const newCard = document.importNode(CHARACTER_CARD_TEMPLATE.content, true).querySelector(".character-card");

    newCard.querySelector(".character-img-frame").value = charInfo.name;
    newCard.querySelector(".character-name").textContent = charInfo.name;

    const imgEl = newCard.querySelector(".character-img");
    const inspectImgEl = newCard.querySelector(".inspect-img");
    imgEl.setAttribute("alt", charInfo.name);
    inspectImgEl.setAttribute("alt", charInfo.name);

    ++numImagesLoading;
    ++numImagesToLoadTotal;
    imgEl.onload = () => {
      --numImagesLoading;
      updateLoadingPercent();
      // Set the image to be scaled based on its natural size
      scaleImage(imgEl);
    }
    inspectImgEl.onload = () => {
      scaleImage(inspectImgEl, inspectImgScale);
    }
    imgEl.onerror = () => {
      // If it can't be loaded, leave it blank - better than hanging forever
      --numImagesLoading;
      updateLoadingPercent();
    }

    imgEl.setAttribute("src", charsetPath + "/" + charInfo.imgName);
    inspectImgEl.setAttribute("src", charsetPath + "/" + charInfo.imgName);

    const frameEl = newCard.querySelector(".character-img-frame");
    frameEl.addEventListener("click", flipCard);
    frameEl.addEventListener("dblclick", markCard);
    frameEl.addEventListener("mousedown", (e) => {
      if (e.button == 1 || e.buttons == 4)
        toggleInspectCard(e);
    });
    frameEl.addEventListener("contextmenu", markCard, false);
    frameEl.addEventListener("wheel", (e) => {
      if (e.deltaY < 0) {
        e.preventDefault();
        inspectScale = MIN_INSPECT_SCALE;
        setInspectScaleTarget(MIN_INSPECT_SCALE);
        toggleInspectCard(e);
        return false;
      }
    }, false);

    const inspectEl = newCard.querySelector(".inspect-img-frame");
    inspectEl.addEventListener("mousedown", (e) => {
      if (e.button == 1 || e.buttons == 4)
        toggleInspectCard(e);
    });
    inspectEl.addEventListener("wheel", (e) => {
      if (e.deltaY > 0) {
        e.preventDefault();
        decreaseInspectScale();
        return false;
      } else if (e.deltaY < 0) {
        e.preventDefault();
        increaseInspectScale();
        return false;
      }
    }, false);

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

  // Don't flip if we're in lookup mode
  if (lookupModeEnabled())
    return;

  let frameEl;
  if (!(frameEl = e.currentTarget || e.target))
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
 * Toggles inspect mode on and off for a card
 * @param {Event | Element} e 
 */
function toggleInspectCard(e) {

  let card = e;
  if (e instanceof Event) {
    e.preventDefault();
    card = e.target.closest(".character-card");
  } else if (!card.classList.contains(".character-card")) {
    card = card.closest(".character-card");
  }

  // Figure out which card to inspect. The order of priority is:
  // 1. Visibly-focused card
  // 2. Hovered-over card
  // 3. Invisibly-focused card

  if (!card || !card.querySelector(".character-img-frame:focus-visible")) {
    // No card is currently focused, so check if one is hovered over
    let hoveredFrame = document.querySelector(".character-img-frame:hover, .inspect-img-frame:hover");

    if (!hoveredFrame && !card) {
      // No card is focused by any means nor hovered over, so do nothing
      return;
    } else if (hoveredFrame) {
      // A card is hovered over, so choose that for inspection
      card = hoveredFrame.closest(".character-card");
    }
    // Implicit else - inspect the invisibly focused card
  }

  const cardClassList = card.classList;
  if (!cardClassList.contains("inspect"))
    inspectCard(card);
  else
    uninspectCard(card);

  return false;
}

/**
 * Starts inspecting a card, increasing its size
 * @param {Event | Element} e 
 */
function inspectCard(e) {
  let card = e;
  if (e instanceof Event) {
    e.preventDefault();
    card = e.target.closest(".character-card");
  } else if (!card.classList.contains(".character-card")) {
    card = card.closest(".character-card");
  }

  const cardClassList = card.classList;
  cardClassList.remove("inspect-fading");
  cardClassList.add("inspect");

  // Temporarily add the "inspect-starting" class to prevent holding the key from immediately uninspecting the card
  cardClassList.add("inspect-starting");
  setTimeout(() => cardClassList.remove("inspect-starting"), 125);

  // Check for if the card has lost focus or mouseover, and end the inspection if so
  const frame = card.querySelector(".character-img-frame");
  const inspectFrame = card.querySelector(".inspect-img-frame");
  const interval = setInterval(() => {
    if ((document.activeElement === frame) || (inspectFrame.matches(':hover')))
      return;
    uninspectCard(e);
    clearInterval(interval);
  }, 50);
  inspectFrame.addEventListener("click", () => {
    uninspectCard(e);
    clearInterval(interval);
    flipCard(e);
  });
}

/**
 * Stops inspecting a card, returning it to normal size
 * @param {Event} e 
 */
function uninspectCard(e) {
  let card = e;
  if (e instanceof Event) {
    e.preventDefault();
    card = e.target.closest(".character-card");
  }

  const cardClassList = card.classList;

  // Exit if the card inspection is starting, stopping, or isn't active
  if (cardClassList.contains("inspect-starting") || cardClassList.contains("inspect-fading") ||
    !cardClassList.contains("inspect"))
    return;

  cardClassList.remove("inspect");
  cardClassList.add("inspect-fading");

  // The fade will take 125ms, so remove the fading class after that to hide the expanded inspection card
  setTimeout(() => cardClassList.remove("inspect-fading"), 125);
  cardClassList.add("steady-popup");
  const frame = card.querySelector(".character-img-frame");
  const inspectFrame = card.querySelector(".inspect-img-frame");
  const interval = setInterval(() => {
    if ((document.activeElement === frame) || (inspectFrame.matches(':hover')) || (frame.matches(':hover')))
      return;
    cardClassList.remove("steady-popup");
    clearInterval(interval);
  }, 50);
}

function setInspectScaleTarget(val) {

  if (inspectScaleAdjustInterval)
    clearInterval(inspectScaleAdjustInterval);

  targetInspectScale = val;
  if (targetInspectScale > MAX_INSPECT_SCALE)
    targetInspectScale = MAX_INSPECT_SCALE;
  else if (targetInspectScale < MIN_INSPECT_SCALE)
    targetInspectScale = MIN_INSPECT_SCALE;

  updateInspectScale();
  inspectScaleAdjustInterval = setInterval(updateInspectScale, 10);
}

function updateInspectScale() {
  inspectScale = approach(inspectScale, targetInspectScale);
  document.documentElement.style.setProperty("--inspect-scale", inspectScale);
  if (inspectScale == targetInspectScale && inspectScaleAdjustInterval) {
    clearInterval(inspectScaleAdjustInterval);
    inspectScaleAdjustInterval = null;
  }
}

function increaseInspectScale() {
  setInspectScaleTarget(targetInspectScale + INSPECT_SCALE_INCREMENT);
}

function decreaseInspectScale() {

  // Check if we're already at the minimum scale, in which case we end inspection instead
  if (targetInspectScale === MIN_INSPECT_SCALE) {
    for (const card of document.querySelectorAll(".character-card.inspect")) {
      uninspectCard(card);
    }
  }

  setInspectScaleTarget(targetInspectScale - INSPECT_SCALE_INCREMENT);
}

/**
 * Sets up the list of all focusable items in the game scene, in the order they'll appear with the current window width
 */
function arrangeGameFocusableItems() {
  if (window.innerWidth <= SCREEN_SIZE_BREAKPOINT) {
    lGameButtonsBeforePlayArea = [QUIT_GAME_BUTTON, RESTART_GAME_BUTTON,
      L_LOOKUP_BUTTONS[0], L_NOTES_BUTTONS[0], L_CONTROLS_BUTTONS[0], L_INSTRUCTIONS_BUTTONS[0]];
    lGameButtonsAfterPlayArea = [];
  } else {
    lGameButtonsBeforePlayArea = [QUIT_GAME_BUTTON, RESTART_GAME_BUTTON, L_LOOKUP_BUTTONS[1], L_NOTES_BUTTONS[1]];
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
      if (currentIndex === -1) {
        // Nothing is selected, so do nothing (except dismiss lookup mode if in it)
        if (lookupModeEnabled())
          setOffLookupMode();
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      if (lookupModeEnabled()) {
        lookupTarget(e);
      } else {
        // Simulate a click event
        document.activeElement.click();
      }
      return;

    case "x":
      // Cancel button

      // Dismiss lookup mode if in it
      if (lookupModeEnabled()) {
        setOffLookupMode();
        return;
      }

      // Do nothing if not on a character card
      if (currentIndex < numButtonsBeforePlayArea + numGuessIcons ||
        currentIndex >= numButtonsBeforePlayArea + numGuessIcons + numCharacterCards)
        return;

      // On a character card, so mark it
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

    case "l":
      // Look up character
      lookupTarget(e);
      return;

    case "Escape":

      // Dismiss lookup mode if in it
      if (lookupModeEnabled()) {
        setOffLookupMode();
        return;
      }

      if (GAME_NOTES_DIALOG.hasAttribute("open"))
        return;
      e.stopPropagation();
      e.preventDefault();
      openNotes();
      return;

    case "i":
      return toggleInspectCard(e);

    case "-":
      return decreaseInspectScale();

    case "+":
    case "=":
      // Check if a frame is focused or hovered and not already being inspected; if so, start inspecting it
      const lTargetFrames = document.querySelectorAll(".character-card:not(.inspect) .character-img-frame:focus-visible, " +
        ".character-card:not(.inspect) .character-img-frame:hover, " +
        ".character-card:not(.inspect) .character-img-frame:focus");
      if (lTargetFrames.length > 0) {
        inspectScale = MIN_INSPECT_SCALE;
        setInspectScaleTarget(MIN_INSPECT_SCALE);
        toggleInspectCard(lTargetFrames[0]);
      }
      else
        return increaseInspectScale();

    default:
      return;
  }

  // If we get here, one of the buttons to navigate has been pressed

  // If we were previously in mouse lookup mode, switch to key lookup mode
  if (mouseLookupModeEnabled()) {
    setKeyLookupMode();
  }

  if (currentIndex == -1) {
    // Not in the options currently, so go to the first character card
    lCharacterCardFrames[0].focus({ focusVisible: true });
    if (keyLookupModeEnabled())
      updateLookupCursorPosition();
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

  if (keyLookupModeEnabled())
    updateLookupCursorPosition();
}

// Setup
// -----

QUIT_GAME_BUTTON.addEventListener("click", () => switchScene(MENU_SCENE));
RESTART_GAME_BUTTON.addEventListener("click", startGame);

L_LOOKUP_BUTTONS.forEach((el) => el.addEventListener("click", startLookupMode, false));

L_NOTES_BUTTONS.forEach((el) => el.addEventListener("click", openNotes));
GAME_NOTES_CLOSE.addEventListener("click", closeNotes);

L_CONTROLS_BUTTONS.forEach((el) => el.addEventListener("click", () => switchScene(CONTROLS_SCENE)));
L_INSTRUCTIONS_BUTTONS.forEach((el) => el.addEventListener("click", () => switchScene(INSTRUCTIONS_SCENE)));

L_GUESS_ICONS.forEach((el) => el.addEventListener("click", flipGuess));
// Character cards are added dynamically, so the click event to flip them has to be added when they're added

const gameSceneSwitchWatcher = new SceneSwitchWatcher(GAME_SCENE, initGameScene, exitGameScene);


// Instructions scene
// ==================

// Constants and globals
// ---------------------

// Constant DOM references
const INSTRUCTIONS_SCENE_HEADER = document.getElementById("instructions-scene");
const INSTRUCTIONS_BACK_BUTTON = document.getElementById("instructions-back");

// Functions
// ---------

function initInstructionsScene() {
  INSTRUCTIONS_BACK_BUTTON.focus({ focusVisible: true });
  INSTRUCTIONS_SCENE_HEADER.scrollIntoView();
  window.addEventListener("keydown", navigateTextScenes);
}

function exitInstructionsScene() {
  window.removeEventListener("keydown", navigateTextScenes);
}

// Setup
// -----

INSTRUCTIONS_BACK_BUTTON.addEventListener("click", () => switchScene(lastScene));
const instructionsSceneSwitchWatcher = new SceneSwitchWatcher(INSTRUCTIONS_SCENE,
  initInstructionsScene, exitInstructionsScene);


// Controls scene
// ==============

// Constants and globals
// ---------------------

// Constant DOM references
const CONTROLS_SCENE_HEADER = document.getElementById("controls-scene");
const CONTROLS_BACK_BUTTON = document.getElementById("controls-back");

// Functions
// ---------

function initControlsScene() {
  CONTROLS_BACK_BUTTON.focus({ focusVisible: true });
  CONTROLS_SCENE_HEADER.scrollIntoView();
  window.addEventListener("keydown", navigateTextScenes);
}

function exitControlsScene() {
  window.removeEventListener("keydown", navigateTextScenes);
}

// Setup
// -----

CONTROLS_BACK_BUTTON.addEventListener("click", () => switchScene(lastScene));
const controlsSceneSwitchWatcher = new SceneSwitchWatcher(CONTROLS_SCENE, initControlsScene, exitControlsScene);


// Credits scene
// =============

// Constants and globals
// ---------------------

// Constant DOM references
const CREDITS_SCENE_HEADER = document.getElementById("credits-scene");
const CREDITS_BACK_BUTTON = document.getElementById("credits-back");

// Functions
// ---------

function initCreditsScene() {
  CREDITS_BACK_BUTTON.focus({ focusVisible: true });
  CREDITS_SCENE_HEADER.scrollIntoView();
  window.addEventListener("keydown", navigateTextScenes);
}

function exitCreditsScene() {
  window.removeEventListener("keydown", navigateTextScenes);
}

// Setup
// -----

CREDITS_BACK_BUTTON.addEventListener("click", () => switchScene(lastScene));
const creditsSceneSwitchWatcher = new SceneSwitchWatcher(CREDITS_SCENE, initCreditsScene, exitCreditsScene);


// Final setup
// ===========
window.onload = function () {
  lastScene = MENU_SCENE;

  fixMenuTabIndex();
  loadCharacterSetList().then(() => {
    MENU_START_LINK.classList.remove("hidden");
    document.querySelectorAll(".game-loading-message").forEach(el => el.classList.add("hidden"));
    if (!MENU_SCENE.classList.contains("hidden"))
      MENU_START_LINK.focus({ focusVisible: true });
  });

  if (initName) {
    setName(initName);
    NAME_INPUT.value = getName();
    switchScene(MENU_SCENE);
  } else {
    switchScene(NAME_SCENE);
    NAME_INPUT.focus({ focusVisible: true });
  }
}