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
  L_SCENES.forEach((el) => {
    // Mark the current scene as the last scene
    if (!el.classList.contains("hidden"))
      lastScene = el;
    el.classList.add("hidden");
  });
  newScene.classList.remove("hidden");
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
  // If this is a keydown event, check if the key is Enter or Return before triggering
  if (e.type === "keydown" && !(e.key === "Enter" || e.key === "Return"))
    return;
  setName(NAME_INPUT.value);
  switchScene(lastScene);
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
const MENU_START_LINK = document.querySelector("#menu-start");
const MENU_NAME_LINK = document.querySelector("#menu-edit-name");
const MENU_INSTRUCTIONS_LINK = document.querySelector("#menu-instructions");

// Functions
// ---------

function startGame() {
  switchScene(GAME_SCENE);
}

// Setup
// -----

MENU_START_LINK.addEventListener("click", () => switchScene(NAME_SCENE));
MENU_NAME_LINK.addEventListener("click", startGame);
MENU_INSTRUCTIONS_LINK.addEventListener("click", () => switchScene(INSTRUCTIONS_SCENE));


// Final setup
// ===========
window.onload = function () {
  lastScene = MENU_SCENE;
}