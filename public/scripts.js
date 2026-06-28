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
const SETTINGS_SCENE = document.getElementById("settings-scene");
const CREDITS_SCENE = document.getElementById("credits-scene");

// Other constants
const SCREEN_SIZE_BREAKPOINT = 800;

// Globals

// The scenes the user as traversed, so we can go back. The final item will always be the current scene, and second-to-
// final will be the previous scene, etc.
const lSceneStack = []

// State locks
let sceneSwitching = false;
let gameLoading = false;

// Initial setting values
const initSettings = {};

// Loaded info about all available character sets
let lCharsetDirs = null;

// Whether or not the site is run as a Tauri app
let tauriMode = false;

// Functions
// ---------

/**
 * Sets the selected option in a select box to the one that has the provided value
 * @param {Element} el The select element
 * @param {str} val The desired option value
 */
function setSelectByValue(el, val) {
  const lOptions = el.querySelectorAll("option");
  let iTarget = -1;
  lOptions.forEach((optEl, i) => {
    if (optEl.value == val)
      iTarget = i;
    optEl.removeAttribute("selected");
  });

  if (iTarget >= 0) {
    lOptions[iTarget].setAttribute("selected", "true");
  }
  el.value = lOptions[iTarget].value;
}

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

  document.cookie = encodeURIComponent(sItems + sExpiry + ";path=/");
}

/**
 * Deletes the currently-stored cookie for this page
 */
function deleteCookie() {

  // Craft a string to define the expiry date as being in the past
  const expTime = new Date();
  expTime.setTime(expTime.getTime() - (24 * 60 * 60 * 1000));
  let sExpiry = "expires=" + expTime.toUTCString();

  document.cookie = encodeURIComponent(sExpiry + ";path=/");
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
 * Load a saved setting
 * @param {str} key The name of the setting
 * @param {() => null | null} onFound Callback if the setting is found saved
 * @param {() => null | null} onNotFound Callback if the setting is not found saved
 * @param {() => null | null} onCookie Callback if the setting is found in the cookie
 * @param {() => null | null} onNotCookie Callback if the setting is not found in the cookie
 */
function loadSetting(key, onFound = null, onNotFound = null, onCookie = null, onNotCookie = null) {

  let found = false;
  let foundInCookie = false;

  // Try to find the setting, checking in the cookie first, or else the session storage
  if (cookieData[key]) {
    found = foundInCookie = true;
    initSettings[key] = sessionStorage[key] = cookieData[key];
  } else if (sessionStorage.getItem(key)) {
    found = true;
    initSettings[key] = sessionStorage[key];
  } else {
    initSettings[key] = null;
  }

  // Call the appropriate callbacks
  if (found) {
    if (onFound)
      onFound();
  } else {
    if (onNotFound)
      onNotFound();
  }
  if (foundInCookie) {
    if (onCookie)
      onCookie();
  } else {
    if (onNotCookie)
      onNotCookie();
  }

}

/**
 * Get the currently-active scene
 * @returns {Element}
 */
function getCurrentScene() {
  if (lSceneStack.length > 0)
    return lSceneStack.at(-1);
  return null;
}

/**
 * Get the previously-active scene
 * @returns {Element}
 */
function getLastScene() {
  if (lSceneStack.length > 1)
    return lSceneStack.at(-2);
  return null;
}

/**
 * Remove any duplicates from the scene stack
 */
function cleanSceneStack() {

  // Construct a clean stack which only contains unique scenes
  const lCleanSceneStack = [];
  for (const scene of lSceneStack) {
    if (!lCleanSceneStack.includes(scene))
      lCleanSceneStack.push(scene);
  }

  // Check if the scene stack is already clean
  if (lSceneStack.length == lCleanSceneStack.length)
    return;

  // Fix the scene stack
  lSceneStack.length = lCleanSceneStack.length;
  for (let i = 0; i < lSceneStack.length; ++i) {
    lSceneStack[i] = lCleanSceneStack[i];
  }
}

/**
 * Switch to target scene
 * @param {Element | null} newScene The scene to switch to. If null, will switch to the previous scene
 */
function switchScene(newScene = null) {

  // Check for scene switch lock so we don't overlap scene switches
  if (sceneSwitching)
    return;

  // Check if we're switching to the last scene
  if (newScene == null || newScene instanceof Event) {
    newScene = getLastScene();

    // If `newScene` is still null, that means there is no last scene, so cancel the switch
    if (newScene == null)
      return;
  }

  const currentScene = getCurrentScene();

  // If `newScene` is the current scene, cancel the switch. And just in case this occurred because the last scene in the
  // stack is the same as the current scene (shouldn't normally happen), clean up the scene stack for good measure
  if (newScene == currentScene) {
    cleanSceneStack();
    return;
  }

  // Adjust the scene stack as appropriate for this change

  if (!lSceneStack.includes(newScene)) {
    // If the new scene isn't in the stack, add it
    lSceneStack.push(newScene);
  } else {
    // Rewind the stack back to where the new scene is in it
    lSceneStack.length = lSceneStack.findIndex((el) => el == newScene) + 1;
  }

  // Perform the scene switch
  if (currentScene)
    currentScene.classList.add("hidden");
  newScene.classList.remove("hidden");

  // Flag that a scene switch is in progress so user actions don't trigger an overlapping switch in the next bit of time
  sceneSwitching = true;
  setTimeout(() => sceneSwitching = false, 250);
}

/**
 * Keyboard navigation for scenes with only text in them
 * @param {KeyboardEvent} e
 */
function navigateTextScenes(e) {
  switch (e.key) {
    case "z":
    case " ":
    case "Enter":
    case "Escape":
      switchScene();
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

  // Default to the first option if none are marked as selected
  let iSelected = 0;
  lOptions.forEach((optionEl, i) => {
    if (optionEl.value == selectEl.value) {
      iSelected = i;
    }
    optionEl.removeAttribute("selected");
  });

  // Select the next option. If by chance no option was selected, going from -1 to 0 here will select the first
  iSelected += 1
  if (iSelected >= lOptions.length) {
    iSelected = 0;
  }
  lOptions[iSelected].setAttribute("selected", "true");
  selectEl.value = lOptions[iSelected].value;

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

/**
 * Checks if this is run as a Tauri app or not and stores the value for here and the CSS
 */
function setTauriMode() {
  if (window.__TAURI__) {
    tauriMode = true;
    document.documentElement.setAttribute("tauri-mode", "true");
  } else {
    document.documentElement.setAttribute("tauri-mode", "false");
  }
}

// Setup
// -----

setTauriMode();
const cookieData = getCookie();


// Name scene
// ==========

// Constants and globals
// ---------------------

// Constant DOM references
const NAME_SCENE_HEADER = document.getElementById("name-scene");

const NAME_INPUT = document.getElementById("name-input");
const NAME_REMEMBER_BOX = document.getElementById("remember-name");
const NAME_SUBMIT = document.getElementById("name-submit");

const L_NAME_OPTIONS = [NAME_INPUT, NAME_REMEMBER_BOX, NAME_SUBMIT];

// Globals
let naughtyPlayer = false;

// Functions
// ---------

function initNameScene() {
  if (!naughtyPlayer) {
    NAME_INPUT.removeAttribute("disabled");
    setTimeout(() => NAME_INPUT.focus({ focusVisible: true }), 100);
  }
  NAME_SCENE_HEADER.scrollIntoView();
  window.addEventListener("keydown", navigateName);
}

function exitNameScene() {
  NAME_INPUT.setAttribute("disabled", "disabled");
  window.removeEventListener("keydown", navigateName);
}

function saveSettings() {
  // If any values aren't loaded in sessionStorage, set them now based on inputs
  if (!sessionStorage.getItem("name"))
    sessionStorage["name"] = NAME_INPUT.value;
  if (!sessionStorage.getItem("numGuesses"))
    sessionStorage["numGuesses"] = SETTINGS_GUESS_SELECT.value;
  if (!sessionStorage.getItem("cardScale"))
    sessionStorage["cardScale"] = SETTINGS_SCALE_SELECT.value;

  setCookie({
    name: sessionStorage["name"],
    numGuesses: sessionStorage["numGuesses"],
    cardScale: sessionStorage["cardScale"]
  });
}

function setName(name) {
  sessionStorage["name"] = name;
  NAME_INPUT.value = name;
  document.querySelectorAll(".player-name").forEach((el) => el.textContent = name);

  // If the user desires, store the name in a cookie to remember it
  if (NAME_REMEMBER_BOX.checked) {
    saveSettings();
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
  // If this is a keydown event, check if the key is Enter before triggering
  if (e.type === "keydown" && e.key !== "Enter")
    return;
  setName(NAME_INPUT.value);
  switchScene();
  e.stopPropagation();
}

/**
 * Monitor the name for any naughty users
 * @param {Event} e 
 */
function monitorName(e) {
  const nameLower = NAME_INPUT.value.toLowerCase().replaceAll(/\W/g, "");
  if (nameLower.includes("gaster") || nameLower.includes("wdg")) {
    NAME_INPUT.value = "Jerry";
    naughtyPlayer = true;
    submitName(e);
  }
}

/**
 * Sync the Remember Name and Remember Settings checkboxes
 */
function updateRememberName() {
  SETTINGS_REMEMBER_BOX.checked = NAME_REMEMBER_BOX.checked;
}


/**
 * Keyboard navigation for the name scene
 * @param {KeyboardEvent} e 
 */
function navigateName(e) {
  let currentIndex = L_NAME_OPTIONS.findIndex((el) => document.activeElement === el);

  // Check the direction of navigation
  let dir;
  const el = document.activeElement;

  switch (e.key) {
    case "s":
      if (el === NAME_INPUT)
        return;
    case "ArrowDown":
      dir = 1;
      e.stopPropagation();
      e.preventDefault();
      break;

    case "w":
      if (el === NAME_INPUT)
        return;
    case "ArrowUp":
      dir = -1;
      e.stopPropagation();
      e.preventDefault();
      break;

    case " ":
    case "z":
      if (el === NAME_INPUT)
        return;
    case "Enter":
      if (currentIndex === -1)
        return;
      e.stopPropagation();
      e.preventDefault();
      if (el == NAME_REMEMBER_BOX || el == NAME_SUBMIT) {
        el.click()
      } else {
        NAME_SUBMIT.click();
      }
      return;

    default:
      return;
  }

  if (currentIndex == -1) {
    // Not in the options currently, so go to the first
    L_NAME_OPTIONS[0].focus({ focusVisible: true });
    return;
  }

  // move to the next or previous item, and loop around if necessary
  currentIndex += dir;
  if (currentIndex < 0) {
    currentIndex = L_NAME_OPTIONS.length - 1;
  }
  else if (currentIndex >= L_NAME_OPTIONS.length) {
    currentIndex = 0;
  }
  L_NAME_OPTIONS[currentIndex].focus({ focusVisible: true });

}

// Setup
// -----

NAME_INPUT.addEventListener("keydown", submitName);
NAME_INPUT.addEventListener("keyup", monitorName);
NAME_INPUT.addEventListener("change", monitorName);
NAME_SUBMIT.addEventListener("click", submitName);
NAME_REMEMBER_BOX.addEventListener("change", updateRememberName);

const nameSceneSwitchWatcher = new SceneSwitchWatcher(NAME_SCENE, initNameScene, exitNameScene);


// Menu scene
// ==========

// Constants and globals
// ---------------------

// Constant DOM references
const MENU_START_LINK = document.getElementById("menu-start");
const MENU_SETTINGS_LINK = document.getElementById("menu-settings");
const MENU_INSTRUCTIONS_LINK = document.getElementById("menu-instructions");
const MENU_CREDITS_LINK = document.getElementById("menu-credits");
const L_MENU_MAIN_OPTIONS = [MENU_START_LINK, MENU_SETTINGS_LINK, MENU_INSTRUCTIONS_LINK, MENU_CREDITS_LINK];

const MENU_CHARSET_LABEL = document.getElementById("charset-label");
const MENU_CHARSET_SELECT = document.getElementById("charset-select");
const MENU_ADD_CHARSET_LINK = document.getElementById("menu-add-charset-link");
const L_MENU_CONFIG_OPTIONS = [MENU_CHARSET_LABEL, MENU_ADD_CHARSET_LINK];

const L_MENU_OPTIONS = [...L_MENU_MAIN_OPTIONS, ...L_MENU_CONFIG_OPTIONS];

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

function loadGuessIcons() {

  const targetNumGuessIcons = sessionStorage.getItem("numGuesses");
  lGuessIcons = document.querySelectorAll(".guess-icon");

  // Check if we have the correct number of guesses, need to add some, or need to remove some
  if (lGuessIcons.length > targetNumGuessIcons) {
    // Remove guesses down to the correct number
    lGuessIcons.forEach((el, i) => {
      if (i >= targetNumGuessIcons)
        el.remove();
    });

    lGuessIcons = document.querySelectorAll(".guess-icon");
  } else if (lGuessIcons.length < targetNumGuessIcons) {
    // Add guesses up to the correct number
    for (let i = lGuessIcons.length; i < targetNumGuessIcons; ++i) {
      GUESS_ICON_LINE.appendChild(lGuessIcons[0].cloneNode(true));
    }
    lGuessIcons = document.querySelectorAll(".guess-icon");
  }

  // Reset available guesses to all be active
  lGuessIcons.forEach((el) => {
    el.classList.add("active");
    el.classList.remove("inactive");
  });

  // Connect all the icons to the event to flip them
  lGuessIcons.forEach((el) => el.addEventListener("click", flipGuess));
}

async function startGame() {
  // If the game is already loading, exit to avoid doubling up
  if (gameLoading)
    return;
  gameLoading = true;
  numImagesToLoadTotal = 0;
  updateLoadingPercent();

  document.querySelectorAll(".game-loading-message").forEach(el => el.classList.remove("hidden"));

  loadGuessIcons();

  // Load the selected character set
  const setDirName = MENU_CHARSET_SELECT.value;
  if (!setDirName) {
    alert("ERROR: No character set selected. Try reloading the page to see if the sets load properly.");
    gameLoading = false;
    return;
  }
  await loadCharacterSet(setDirName);

  // Make sure lookup mode starts disabled
  setOffLookupMode();

  // Store lists of focusable items
  lGuessIcons = document.querySelectorAll(".guess-icon");
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
      e.stopPropagation();
      e.preventDefault();
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
  lCharsetDirs = charsetMeta.sets;

  // Check through the names of character sets to determine how they should be sorted
  const lSortedCharsets = [];
  const lUnsortedCharsets = [];

  lCharsetDirs.forEach((charsetDirName) => {

    // Check if this name starts with an index
    const i = parseInt(charsetDirName.split("-")[0]);

    if ((i === NaN) || (!charsetDirName.startsWith(i.toString()))) {
      // Doesn't appear to start with an index, so add it to the unsorted list
      lUnsortedCharsets.push({
        // In case it's a Tauri build, replace back spaces in the name of the set
        name: charsetDirName.replaceAll("_", " ").replaceAll("%20", " "),
        dirName: charsetDirName,
      });
      return;
    }

    // This appears to be indexed
    let charsetNameInfo = {
      name: charsetDirName.replace(i + "-", "").replaceAll("_", " ").replaceAll("%20", " "),
      dirName: charsetDirName
    };

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
    newCharsetOption.textContent = charsetNameInfo.name;
    newCharsetOption.value = charsetNameInfo.dirName;
    MENU_CHARSET_SELECT.appendChild(newCharsetOption);
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
MENU_SETTINGS_LINK.addEventListener("click", () => switchScene(SETTINGS_SCENE));
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
const L_SETTINGS_BUTTONS = document.querySelectorAll(".game-settings");

const GUESS_ICON_LINE = document.getElementById("guesses-line");
const YOUR_CHAR_NAME = document.getElementById("your-char-name");
const YOUR_CHAR_IMG_FRAME = document.getElementById("your-char-img-frame");
const YOUR_CHAR_IMG = document.getElementById("your-char-img");

const CARD_GRID = document.getElementById("card-grid");

// Default configuration values
const BODY_STYLE = window.getComputedStyle(document.body);
const DEFAULT_LOOKUP_URL = "https://www.google.com/search?q=Undertale%20Deltarune%20%s&udm=14";
const DEFAULT_NUM_GUESSES = document.querySelectorAll(".guess-icon").length;
const DEFAULT_CARD_SCALE = +BODY_STYLE.getPropertyValue('--card-scale');
const DEFAULT_CARD_WIDTH = parseInt(BODY_STYLE.getPropertyValue('--card-base-img-width')) * DEFAULT_CARD_SCALE;
const DEFAULT_CARD_HEIGHT = parseInt(BODY_STYLE.getPropertyValue('--card-base-img-height')) * DEFAULT_CARD_SCALE;
const DEFAULT_CHARSET_CONFIG = {
  "lookupUrl": DEFAULT_LOOKUP_URL,
  "cardWidth": DEFAULT_CARD_WIDTH,
  "cardHeight": DEFAULT_CARD_HEIGHT,
};

// Other constants
const MIN_INSPECT_SCALE = 1.5;
const MAX_INSPECT_SCALE = 8;
const INSPECT_SCALE_INCREMENT = 0.5;

// Globals
let targetInspectScale = +BODY_STYLE.getPropertyValue('--inspect-scale');
let inspectScale = targetInspectScale;
let inspectScaleAdjustInterval = null;

let cardScaleInfo = null;
let lGuessIcons = [];
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

function setCardScaleInfo() {
  const scale = BODY_STYLE.getPropertyValue('--card-scale');
  function getPxVal(x) {
    return +(BODY_STYLE.getPropertyValue(x).replace("px", ""));
  }
  cardScaleInfo = {
    width: scale * getPxVal('--card-base-img-width'),
    height: scale * getPxVal('--card-base-img-height')
  }
}

/**
 * Scale an image with the optimal scaling factor to fit in the provided frame
 * @param {HTMLImageElement} img 
 */
function scaleImage(img, frameScale = 1) {
  // Determine card scale info if not already determined
  if (!cardScaleInfo) {
    setCardScaleInfo();
  }

  // The maximum size we want the scaled image to be is the width of the card, so we find the half-integer scale factor
  // that makes it as big as possible while still less than this size

  let width;
  let naturalWidth = img.naturalWidth, cardWidth = cardScaleInfo.width;

  if (naturalWidth == 0) {
    // Something went wrong with loading the image and we don't know its size, so size to the default image size
    width = cardScaleInfo.width;
  } else if (naturalWidth > cardWidth) {
    // We'll need to scale it down
    let scaleDownFactor = Math.ceil(naturalWidth / cardWidth);
    width = 0.5 * Math.round(2 * naturalWidth / scaleDownFactor);
  } else {
    // We'll need to either leave it alone or scale it up
    let scaleUpFactor = 0.5 * Math.floor(2 * cardWidth / naturalWidth);
    width = naturalWidth * scaleUpFactor;
  }

  img.setAttribute("style", `width: ${width * frameScale}px;`);
}

/**
 * Loads all characters in a character set
 * @param {String} setDirName 
 */
async function loadCharacterSet(setDirName) {

  // If this set is already loaded, do nothing
  if (setDirName === loadedCharset)
    return;

  // Unload scale info, which might change with this new set
  cardScaleInfo = null;

  // Load the meta file for the character set
  if (tauriMode)
    charsetPath = "character-sets/" + setDirName.replaceAll(" ", "_");
  else
    charsetPath = "character-sets/" + setDirName.replaceAll(" ", "%20");
  const charMetaUrl = charsetPath + "/char-meta.json";
  const charsetMeta = await loadJSON(charMetaUrl)
    .catch((err) => alert("ERROR: Could not load character information from " + charMetaUrl + ".\n" +
      "Try refreshing the page in case this is a temporary issue. The error message received was: \n" + err));

  // Get the config for the character set from the meta file
  charsetConfig = charsetMeta.config;
  if (charsetConfig === null) {
    // Use the full default config if none is provided
    charsetConfig = DEFAULT_CHARSET_CONFIG;
  } else {
    // If card width and/or height are present, convert them to integers
    if (charsetConfig.cardWidth)
      charsetConfig.cardWidth = parseInt(charsetConfig.cardWidth);
    if (charsetConfig.cardHeight)
      charsetConfig.cardHeight = parseInt(charsetConfig.cardHeight);

    // For card width and height, we handle them explicitly so the user can scale by modifying just one or both
    if (charsetConfig.cardWidth && !charsetConfig.cardHeight) {
      // The user set width but not height, so scale the height to match
      charsetConfig.cardHeight = DEFAULT_CHARSET_CONFIG.cardHeight *
        (charsetConfig.cardWidth / DEFAULT_CHARSET_CONFIG.cardWidth);
    } else if (charsetConfig.cardHeight && !charsetConfig.cardWidth) {
      // The user set height but not width, so scale the width to match
      charsetConfig.cardWidth = DEFAULT_CHARSET_CONFIG.cardWidth *
        (charsetConfig.cardHeight / DEFAULT_CHARSET_CONFIG.cardHeight);
    }
    // If the user set both, we don't need to do anything. If they set neither, the standard filling in of details below
    // will handle it

    // Check for any missing values in the config and fill them with defaults
    for (const [key, val] of Object.entries(DEFAULT_CHARSET_CONFIG)) {
      if (!charsetConfig[key])
        charsetConfig[key] = val;
    }
  }

  // Apply config options as appropriate
  document.documentElement.style.setProperty("--card-base-img-width",
    charsetConfig.cardWidth / DEFAULT_CARD_SCALE + "px");
  document.documentElement.style.setProperty("--card-base-img-height",
    charsetConfig.cardHeight / DEFAULT_CARD_SCALE + "px");

  // Fetch the characters in the set from the meta file
  lCharImageNames = charsetMeta.chars;
  const dCharInfo = {};

  // Clear any present character cards
  document.querySelectorAll(".character-card").forEach((el) => el.remove());

  // Check through the names of character images to determine how they should be sorted
  const lSortedChars = [];
  const lUnsortedChars = [];

  lCharImageNames.forEach((charImgName) => {

    let escapedCharImgName = charImgName;
    if (tauriMode)
      escapedCharImgName = charImgName.replace(" ", "_");
    else
      escapedCharImgName = charImgName.replace(" ", "%20");

    // Check if this name starts with an index
    let i = parseInt(charImgName.split("-")[0]);
    if ((i === NaN) || (!charImgName.startsWith(i.toString()))) {
      // Doesn't appear to start with an index, so add it to the unsorted list
      lUnsortedChars.push({
        imgName: escapedCharImgName,
        name: charImgName.replace(".png", "").replaceAll("_", " ").replaceAll("%20", " ")
      });
      return;
    }

    // This appears to be indexed
    let charInfo = {
      imgName: escapedCharImgName,
      name: charImgName.replace(i + "-", "").replace(".png", "").replaceAll("_", " ").replaceAll("%20", " ")
    };

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
    inspectEl.addEventListener("contextmenu", markCard, false);
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
  loadedCharset = setDirName;
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
    lGameButtonsBeforePlayArea = [QUIT_GAME_BUTTON, RESTART_GAME_BUTTON, L_LOOKUP_BUTTONS[0],
      L_NOTES_BUTTONS[0], L_CONTROLS_BUTTONS[0], L_INSTRUCTIONS_BUTTONS[0], L_SETTINGS_BUTTONS[0]];
    lGameButtonsAfterPlayArea = [];
  } else {
    lGameButtonsBeforePlayArea = [QUIT_GAME_BUTTON, RESTART_GAME_BUTTON, L_LOOKUP_BUTTONS[1], L_NOTES_BUTTONS[1]];
    lGameButtonsAfterPlayArea = [L_CONTROLS_BUTTONS[1], L_INSTRUCTIONS_BUTTONS[1], L_SETTINGS_BUTTONS[1]];
  }
  lGameFocusableItems = [...lGameButtonsBeforePlayArea, ...lGuessIcons, ...lCharacterCardFrames,
  ...lGameButtonsAfterPlayArea];
}

/**
 * Keyboard navigation for the game scene
 * @param {KeyboardEvent} e 
 */
function navigateGame(e) {
  // Get current position
  let currentIndex = lGameFocusableItems.findIndex((el) => document.activeElement === el);

  const numButtonsBeforePlayArea = lGameButtonsBeforePlayArea.length;
  const numGuessIcons = lGuessIcons.length;
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
L_SETTINGS_BUTTONS.forEach((el) => el.addEventListener("click", () => switchScene(SETTINGS_SCENE)));

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

INSTRUCTIONS_BACK_BUTTON.addEventListener("click", switchScene);
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

CONTROLS_BACK_BUTTON.addEventListener("click", switchScene);
const controlsSceneSwitchWatcher = new SceneSwitchWatcher(CONTROLS_SCENE, initControlsScene, exitControlsScene);


// Settings scene
// ==============

// Constants and globals
// ---------------------

// Constant DOM references
const SETTINGS_SCENE_HEADER = document.getElementById("settings-scene");

const SETTINGS_NAME_LINK = document.getElementById("settings-edit-name");
const SETTINGS_GUESS_LABEL = document.getElementById("num-guesses-label");
const SETTINGS_GUESS_SELECT = document.getElementById("num-guesses-select");
const SETTINGS_SCALE_LABEL = document.getElementById("card-scale-label");
const SETTINGS_SCALE_SELECT = document.getElementById("card-scale-select");
const SETTINGS_SCALE_IMG = document.getElementById("example-character-img");
const SETTINGS_REMEMBER_BOX = document.getElementById("remember-settings");

const SETTINGS_RESTORE_DEFAULT_BUTTON = document.getElementById("settings-restore-default");
const SETTINGS_RESTORE_INIT_BUTTON = document.getElementById("settings-restore-init");
const SETTINGS_BACK_BUTTON = document.getElementById("settings-back");

const L_SETTINGS_OPTIONS = [SETTINGS_NAME_LINK, SETTINGS_GUESS_LABEL, SETTINGS_SCALE_LABEL, SETTINGS_REMEMBER_BOX,
  SETTINGS_RESTORE_DEFAULT_BUTTON, SETTINGS_RESTORE_INIT_BUTTON, SETTINGS_BACK_BUTTON];

const SETTINGS_EXAMPLE_CARD = document.getElementById("example-character-card");


// Functions
// ---------

function initSettingsScene() {
  SETTINGS_NAME_LINK.focus({ focusVisible: true });
  SETTINGS_SCENE_HEADER.scrollIntoView();
  window.addEventListener("keydown", navigateSettings);
}

function exitSettingsScene() {
  window.removeEventListener("keydown", navigateSettings);

  // Save settings on exiting the scene
  sessionStorage["numGuesses"] = SETTINGS_GUESS_SELECT.value;
  sessionStorage["cardScale"] = SETTINGS_SCALE_SELECT.value;

  // If the user desires, store the value in a cookie to remember it
  if (SETTINGS_REMEMBER_BOX.checked) {
    saveSettings();
  } else {
    // Otherwise delete any previously-set cookie
    deleteCookie();
  }
}

/**
 * Update the CSS card scale property and the example card image
 */
function updateCardScale() {
  document.documentElement.style.setProperty("--card-scale", SETTINGS_SCALE_SELECT.value);
  setCardScaleInfo();
  scaleImage(SETTINGS_SCALE_IMG);
  scaleImage(YOUR_CHAR_IMG, window.getComputedStyle(YOUR_CHAR_IMG).getPropertyValue('--your-char-scale'))
  document.querySelectorAll(".character-img").forEach((el) => scaleImage(el));
  const inspectImgScale = window.getComputedStyle(YOUR_CHAR_IMG).getPropertyValue('--your-char-scale');
  document.querySelectorAll(".inspect-img").forEach((el) => scaleImage(el, inspectImgScale));
}

/**
 * Sync the Remember Name and Remember Settings checkboxes
 */
function updateRememberSettings() {
  NAME_REMEMBER_BOX.checked = SETTINGS_REMEMBER_BOX.checked;
}

function restoreDefaultSettings() {
  setSelectByValue(SETTINGS_GUESS_SELECT, DEFAULT_NUM_GUESSES);
  setSelectByValue(SETTINGS_SCALE_SELECT, DEFAULT_CARD_SCALE);
  updateCardScale();
}

function restoreInitSettings() {
  setSelectByValue(SETTINGS_GUESS_SELECT, initSettings["numGuesses"]);
  setSelectByValue(SETTINGS_SCALE_SELECT, initSettings["cardScale"]);
  updateCardScale();
}

/**
 * Keyboard navigation for the settings scene
 * @param {KeyboardEvent} e 
 */
function navigateSettings(e) {
  let currentIndex = L_SETTINGS_OPTIONS.findIndex((el) => document.activeElement === el);

  // Check the direction of navigation
  let dir;

  switch (e.key) {
    case "ArrowDown":
    case "ArrowRight":
    case "s":
    case "d":
      dir = 1;
      break;

    case "ArrowUp":
    case "ArrowLeft":
    case "w":
    case "a":
      dir = -1;
      break;

    case " ":
    case "z":
    case "Enter":
      if (currentIndex === -1)
        return;
      e.stopPropagation();
      e.preventDefault();
      const el = document.activeElement;
      if (el == SETTINGS_GUESS_LABEL) {
        cycleSelect(SETTINGS_GUESS_SELECT);
      } else if (el == SETTINGS_SCALE_LABEL) {
        cycleSelect(SETTINGS_SCALE_SELECT);
        updateCardScale();
      } else {
        el.click();
      }
      return;

    default:
      return;
  }

  if (currentIndex == -1) {
    // Not in the options currently, so go to the first
    L_SETTINGS_OPTIONS[0].focus({ focusVisible: true });
    return;
  }

  // move to the next or previous item, and loop around if necessary
  currentIndex += dir;
  if (currentIndex < 0) {
    currentIndex = L_SETTINGS_OPTIONS.length - 1;
  }
  else if (currentIndex >= L_SETTINGS_OPTIONS.length) {
    currentIndex = 0;
  }
  L_SETTINGS_OPTIONS[currentIndex].focus({ focusVisible: true });

}

// Setup
// -----

SETTINGS_NAME_LINK.addEventListener("click", () => switchScene(NAME_SCENE));
SETTINGS_SCALE_SELECT.addEventListener("change", updateCardScale);
SETTINGS_REMEMBER_BOX.addEventListener("change", updateRememberSettings);

SETTINGS_RESTORE_DEFAULT_BUTTON.addEventListener("click", restoreDefaultSettings);
SETTINGS_RESTORE_INIT_BUTTON.addEventListener("click", restoreInitSettings);
SETTINGS_BACK_BUTTON.addEventListener("click", switchScene);

const settingsSceneSwitchWatcher = new SceneSwitchWatcher(SETTINGS_SCENE, initSettingsScene, exitSettingsScene);


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

CREDITS_BACK_BUTTON.addEventListener("click", switchScene);
const creditsSceneSwitchWatcher = new SceneSwitchWatcher(CREDITS_SCENE, initCreditsScene, exitCreditsScene);


// Final setup
// ===========
window.onload = function () {
  lSceneStack.push(MENU_SCENE);

  // Get the saved name, if any. If it's found in the cookie, set the "remember" boxes to be checked
  loadSetting("name", null, null,
    () => { NAME_REMEMBER_BOX.checked = true; SETTINGS_REMEMBER_BOX.checked = true },
    () => { NAME_REMEMBER_BOX.checked = false; SETTINGS_REMEMBER_BOX.checked = false });

  // Get and apply other saved settings
  loadSetting("numGuesses", () => setSelectByValue(SETTINGS_GUESS_SELECT, initSettings.numGuesses));
  loadSetting("cardScale", () => setSelectByValue(SETTINGS_SCALE_SELECT, initSettings.cardScale));
  updateCardScale();

  fixMenuTabIndex();
  loadCharacterSetList().then(() => {
    MENU_START_LINK.classList.remove("hidden");
    document.querySelectorAll(".game-loading-message").forEach(el => el.classList.add("hidden"));
    if (!MENU_SCENE.classList.contains("hidden"))
      MENU_START_LINK.focus({ focusVisible: true });
  });

  if (initSettings.name) {
    setName(initSettings.name);
    MENU_SCENE.classList.remove("hidden");
  } else {
    switchScene(NAME_SCENE);
    NAME_INPUT.focus({ focusVisible: true });
  }

  updateRememberName();
}