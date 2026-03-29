// Globally relevant
// =================

// Constants and globals
// ---------------------

// Constant DOM references
const L_SCENES = document.querySelectorAll(".scene");
const NAME_SCENE = document.querySelector("#name-scene");
const MENU_SCENE = document.querySelector("#menu-scene");
const GAME_SCENE = document.querySelector("#game-scene");
const INSTRUCTIONS_SCENE = document.querySelector("#instructions-scene");

// Globals
let lastScene;

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
  }
}

// Name scene
// ==========

// Constants and globals
// ---------------------

// Constant DOM references
const NAME_INPUT = document.querySelector("#name-input");
const NAME_SUBMIT = document.querySelector("#name-submit");

// Functions
// ---------

function setName(name) {
  sessionStorage["name"] = name;
  MENU_NAME.textContent = name;
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
const MENU_NAME = document.querySelector("#menu-name");
const L_MENU_OPTIONS = document.querySelectorAll("#menu-options>li>a")

const MENU_START_LINK = document.querySelector("#menu-start");
const MENU_NAME_LINK = document.querySelector("#menu-edit-name");
const MENU_INSTRUCTIONS_LINK = document.querySelector("#menu-instructions");

// Functions
// ---------

function startGame() {
  switchScene(GAME_SCENE);
}

function navigateMenu(e) {
  // Only execute if the menu scene is active
  if (MENU_SCENE.classList.contains("hidden"))
    return;

  let currentIndex = Array.from(L_MENU_OPTIONS).findIndex((el) => document.activeElement === el);

  // Check if we're navigating forwards or backwards
  let dir;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    dir = 1;
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    dir = -1;
  } else if (e.key === " " || e.key === "z" && currentIndex !== -1) {
    e.stopPropagation();
    document.activeElement.click();
    return;
  } else {
    return;
  }

  if (currentIndex == -1) {
    // Not in the options currently, so go to the first
    L_MENU_OPTIONS[0].focus();
    return;
  }

  let newIndex = currentIndex + dir;
  if (newIndex < 0)
    newIndex = L_MENU_OPTIONS.length - 1;
  else if (newIndex >= L_MENU_OPTIONS.length)
    newIndex = 0;

  L_MENU_OPTIONS[newIndex].focus();
}

// Setup
// -----

window.addEventListener("keydown", navigateMenu);
MENU_START_LINK.addEventListener("click", startGame);
MENU_NAME_LINK.addEventListener("click", () => switchScene(NAME_SCENE));
MENU_INSTRUCTIONS_LINK.addEventListener("click", () => switchScene(INSTRUCTIONS_SCENE));



// Instructions scene
// ==================

// Constants and globals
// ---------------------

// Constant DOM references
const INSTRUCTIONS_BACK_BUTTON = document.querySelector("#instructions-back");

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
}