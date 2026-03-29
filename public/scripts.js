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
let name = "";

// Functions
// ---------

/**
 * Switch to target scene
 * @param {Element} newScene 
 */
function switchScene(newScene = MENU_SCENE) {
  L_SCENES.forEach((el) => el.classList.add("hidden"));
  newScene.classList.remove("hidden");
}

// Name input scene
// ================

// Constants and globals
// ---------------------

// Constant DOM references
const NAME_INPUT = document.querySelector("#name-input");
const NAME_SUBMIT = document.querySelector("#name-submit");

// Functions
// ---------

/**
 * Called when the user submits their name either through the button or enter/return
 * @param {Event} e 
 */
function submitName(e) {
  // If this is a keydown event, check if the key is Enter or Return before triggering
  if (e.type === "keydown" && !(e.key === "Enter" || e.key === "Return"))
    return;
  name = NAME_INPUT.getAttribute("value");
  switchScene(MENU_SCENE);
}

// Setup
// -----
NAME_INPUT.addEventListener("keydown", submitName);
NAME_SUBMIT.addEventListener("click", submitName);