// Code for handling FUN events in the game
// ========================================

import { playExplosionSound, playSelectSound, playTromboneSound, preloadAudio, unloadAudio } from "./audio.js";

// Globals
// -------

// Force a FUN value for debugging
const FORCE_FUN = null;

// Constant DOM references
const SETTINGS_FUN_BUTTON = document.getElementById("fun-adjust-button");
const SETTINGS_FUN_FORCE_INPUT = document.getElementById("fun-force-input");
const SETTINGS_NO_FUN_BOX = document.getElementById("no-fun-box");
const TROMBONE_GIF_TEMPLATE = document.getElementById("trombone-template");
const EXPLOSION_GIF_TEMPLATE = document.getElementById("explosion-template");

// The current FUN value. -1 indicates all FUN events will be inactive, 1-100 are valid values and may activate events
let funValue = -1;

let buttonTextLock = false;

class FunEventManager {

  // Whether or not FUN events are enabled
  #enabled;

  // List of all known FUN events
  #lEvents;

  // Set of all currently-active FUN events
  #sActiveEvents;

  // Object containing all active events triggered from guess icons
  #oHeartEvents;

  // Object containing all active events triggered from character cards
  #oCardEvents;

  constructor() {
    this.#enabled = true;
    this.#lEvents = [];
    this.#sActiveEvents = new Set();
    this.#oHeartEvents = {};
    this.#oCardEvents = {};
  }

  /**
   * Add an event to the manager, which will allow it to be activated when an appropriate FUN value is set
   * @param {FunEvent} e 
   */
  registerEvent(e) {
    this.#lEvents.push(e);
  }

  /**
   * Update to a new active FUN value
   * @param {Number} fun The new FUN value
   */
  updateFun(fun = null) {
    if (fun !== null) {
      funValue = fun;
    }

    // Check through all active events, and deactivate any that are no longer active with the new FUN value. We can't
    // modify the set while iterating over it, hence the second loop. If events are disabled in general, mark all to be
    // disabled
    const lEventsToDeactivate = []
    this.#sActiveEvents.forEach((e) => {
      if (!this.#enabled || !e.isActiveForFun(funValue))
        lEventsToDeactivate.push(e);
    });
    lEventsToDeactivate.forEach((e) => {
      e.onDeactivate();
      this.#sActiveEvents.delete(e);
    });

    // Now check through all events and activate those which should be active but aren't yet
    this.#lEvents.forEach((e) => {
      if (this.#sActiveEvents.has(e))
        return;
      if (this.#enabled && e.isActiveForFun(funValue)) {
        e.onActivate();
        this.#sActiveEvents.add(e);
      }
    });

    this.#updateEventWeight();
  }

  /**
   * Get the new total event weight and apply effects based on it
   */
  #updateEventWeight() {
    const totalWeight = [...this.#sActiveEvents].reduce((a, b) => a + b.weight, 0);

    if (!buttonTextLock) {
      // Edit the text of the FUN button appropriately for the weight
      let funText;
      if (totalWeight < 10) {
        funText = "No";
      } else {
        funText = "Maybe";
      }
      if (totalWeight % 2 != 0) {
        funText += "?"
      }
      SETTINGS_FUN_BUTTON.textContent = funText;
    }

  }

  /**
   * Enable FUN events to be active in general
   */
  enableEvents() {
    this.#enabled = true;
    this.updateFun();
  }

  /**
   * Disable FUN events from being active in general
   */
  disableEvents() {
    this.#enabled = false;
    this.updateFun();
  }

  /**
   * Adds an event which is triggered from some actions on guess icons
   * @param {Object} oHeartEvent 
   */
  addHeartEvent(oHeartEvent) {
    // Check if this event is already active, and do nothing if so
    if (this.#oHeartEvents[oHeartEvent.name])
      return;

    this.#oHeartEvents[oHeartEvent.name] = oHeartEvent;
    this.#attachHeartEvent(oHeartEvent);
  }

  #attachHeartEvent(oHeartEvent) {

    let selector = ".guess-icon"
    if (oHeartEvent.selector)
      selector += oHeartEvent.selector

    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener(oHeartEvent.trigger, oHeartEvent.handler);
    });
  }

  /**
   * Remove an event triggered from some actions on guess icons
   * @param {String} name
   */
  removeHeartEvent(name) {
    if (!this.#oHeartEvents[name])
      return;

    this.#detachHeartEvent(name);
    delete this.#oHeartEvents[name];
  }

  #detachHeartEvent(name) {

    const oHeartEvent = this.#oHeartEvents[name];

    let selector = ".guess-icon"
    if (Object.hasOwn(oHeartEvent, selector))
      selector += oHeartEvent.selector

    document.querySelectorAll(selector).forEach((el) => {
      el.removeEventListener(oHeartEvent.trigger, oHeartEvent.handler);
    });
  }

  /**
   * Attach all heart events to all currently-active guess icons
   */
  attachAllHeartEvents() {
    Object.values(this.#oHeartEvents).forEach((oHeartEvent) => {
      this.#attachHeartEvent(oHeartEvent);
    });
  }

  /**
   * Adds an event which is triggered from some actions on character cards
   * @param {Object} oCardEvent 
   */
  addCardEvent(oCardEvent) {
    // Check if this event is already active, and do nothing if so
    if (this.#oCardEvents[oCardEvent.name])
      return;

    this.#oCardEvents[oCardEvent.name] = oCardEvent;
    this.#attachCardEvent(oCardEvent);
  }

  #attachCardEvent(oCardEvent) {

    let selector = ".character-card";
    if (oCardEvent.selector)
      selector += oCardEvent.selector

    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener(oCardEvent.trigger, oCardEvent.handler);
    });
  }

  /**
   * Remove an event triggered from some actions on character cards
   * @param {String} name
   */
  removeCardEvent(name) {
    if (!this.#oCardEvents[name])
      return;

    this.#detachCardEvent(name);
    delete this.#oCardEvents[name];
  }

  #detachCardEvent(name) {

    const oCardEvent = this.#oCardEvents[name];

    let selector = ".character-card";
    if (Object.hasOwn(oCardEvent, selector))
      selector += oCardEvent.selector

    document.querySelectorAll(selector).forEach((el) => {
      el.removeEventListener(oCardEvent.trigger, oCardEvent.handler);
    });
  }

  /**
   * Attach all card events to all currently-active character cards
   */
  attachAllCardEvents() {
    Object.values(this.#oCardEvents).forEach((oCardEvent) => {
      this.#attachCardEvent(oCardEvent);
    });
  }
}
const manager = new FunEventManager();

export function setNewFunValue() {
  let newValue = parseInt(SETTINGS_FUN_FORCE_INPUT.value);
  if (!(newValue > 0 && newValue <= 100)) {
    if (FORCE_FUN > 0 && FORCE_FUN <= 100)
      newValue = FORCE_FUN;
    else
      newValue = Math.ceil(Math.random() * 100);
  }
  manager.updateFun(newValue);
}

export function attachAllHeartEvents() {
  manager.attachAllHeartEvents();
}

export function attachAllCardEvents() {
  manager.attachAllCardEvents();
}


/**
 * Base class for FUN events
 */
class FunEvent {

  // The "weight" of the event, which determines if it's significant enough to update the FUN button indicator
  weight;

  // Overridable methods
  // -------------------

  constructor() {
    this.weight = 10;
  }

  /**
   * Define whether or not this event is active for a given FUN (Fractal Universe Number) value. For instance, to make
   * an event active for FUN 1-10, the function could be `return fun >= 1 and fun <= 10`
   * @param {Number} fun The FUN (Fractal Universe Number) value
   * @returns {Boolean} Whether or not this event is active for the provided FUN
   */
  isActiveForFun(fun) {
    return false;
  }

  /**
   * This function is called when the event is activated (the FUN value changes to one for which this event is active).
   * This should change things in the game as appropriate to enable the event.
   */
  onActivate() { }

  /**
   * This function is called when the event is deactivated (the FUN value changes to one for which this event is not
   * active). This should change things in the game as appropriate to disable the event.
   */
  onDeactivate() { }

  // Methods that generally won't need to be overridden
  // --------------------------------------------------

  get weight() {
    return this.weight;
  }
}

// Functions related to FUN events

function setNewFunFromButton() {
  playSelectSound();
  setNewFunValue();
}

export function connectFunButton() {
  SETTINGS_FUN_BUTTON.addEventListener("click", setNewFunFromButton);
}

export function disconnectFunButton() {
  SETTINGS_FUN_BUTTON.removeEventListener("click", setNewFunFromButton);
}

// Classes implementing specific FUN events

class MaskEvent extends FunEvent {

  constructor() {
    super();
    // Low weight for this event, since it's active half the time
    this.weight = 1;
  }

  isActiveForFun(i) {
    // Active for any even FUN value
    return i % 2 == 0;
  }

  onActivate() {
    // Hide the halfmask image and show the fullmask image
    document.getElementById("char-img-halfmask").classList.add("hidden");
    document.getElementById("char-img-fullmask").classList.remove("hidden");
  }

  onDeactivate() {
    // Hide the fullmask image and show the halfmask image
    document.getElementById("char-img-halfmask").classList.remove("hidden");
    document.getElementById("char-img-fullmask").classList.add("hidden");
  }
}

manager.registerEvent(new MaskEvent());

class MiddleEvent extends FunEvent {

  #initButtonText;
  #currentStep;
  #lEventSteps;

  constructor() {

    super();

    this.#initButtonText = "";

    this.#currentStep = -1;

    this.#lEventSteps = [function () {
      SETTINGS_FUN_BUTTON.textContent = "No";
    },
    function () {
      SETTINGS_FUN_BUTTON.textContent = "Maybe";
    },
    function () {
      SETTINGS_FUN_BUTTON.textContent = "I don't know";
    },
    function () {
      SETTINGS_FUN_BUTTON.textContent = "Can you repeat the question?";
    },
    function () {
      SETTINGS_FUN_BUTTON.textContent = "You're not the boss of me now!";
    },
    function () {
      SETTINGS_FUN_BUTTON.textContent = "You're not the boss of me now!";
    },
    function () {
      SETTINGS_FUN_BUTTON.textContent = "You're not the boss of me now!";
    },
    function () {
      SETTINGS_FUN_BUTTON.textContent = "And";
    },
    function () {
      SETTINGS_FUN_BUTTON.textContent = "You're";
    },
    function () {
      SETTINGS_FUN_BUTTON.textContent = "Not";
    },
    function () {
      SETTINGS_FUN_BUTTON.textContent = "So";
    },
    function () {
      SETTINGS_FUN_BUTTON.textContent = "Big";
    },
    function () {
      alert("Life is unfair...");
      endMiddleEvent();
    },];
  }

  isActiveForFun(i) {
    // Active for FUN 26 only
    return i == 26;
  }

  onActivate() {
    // Store the current text of the FUN button
    this.#initButtonText = SETTINGS_FUN_BUTTON.textContent;

    // Disconnect the normal event from the FUN button and instead connect the event perform the chain of steps
    disconnectFunButton();

    // Start updating the button text, and lock it so the FUN manager won't change it
    SETTINGS_FUN_BUTTON.textContent = "Yes";
    buttonTextLock = true;

    this.#currentStep = 0;
    SETTINGS_FUN_BUTTON.addEventListener("click", runMiddleEventStep);
  }

  onDeactivate() {
    this.endEvent();
  }

  runCurrentStep() {
    this.#lEventSteps[this.#currentStep]();
    ++this.#currentStep;
  }

  endEvent() {
    // Disconnect all events for parts of the chain from the FUN button, and connect the normal event
    SETTINGS_FUN_BUTTON.removeEventListener("click", runMiddleEventStep);
    connectFunButton();

    // Release the lock on the button text so the FUN manager can change it once more
    buttonTextLock = false;

    // Restore the text for the FUN button
    // Store the current text of the FUN button
    SETTINGS_FUN_BUTTON.textContent = this.#initButtonText;
    this.#currentStep = -1;
    setNewFunValue();
  }
}

const middleEvent = new MiddleEvent();
function runMiddleEventStep() {
  middleEvent.runCurrentStep();
}
function endMiddleEvent() {
  middleEvent.endEvent();
}
manager.registerEvent(middleEvent);

class TwistEvent extends FunEvent {

  isActiveForFun(i) {
    return i >= 67 && i <= 70;
  }

  onActivate() {
    document.documentElement.setAttribute("bg-twist", true);
  }

  onDeactivate() {
    document.documentElement.removeAttribute("bg-twist");
  }
}

manager.registerEvent(new TwistEvent());

/**
 * Displays a trombone gif attached to the calling heart icon
 * @param {Event} e 
 */

/**
 * Displays a spritesheet animation attached to the event
 * @param {Event} e 
 * @param {Number} chance 
 * @param {HTMLElement} template 
 * @param {String} selector 
 * @param {String} parentSelector 
 * @param {Function} condition 
 * @returns {Boolean} Whether or not the animation ended up playing
 */
function displayAnim(e, chance, template, selector, parentSelector, condition) {

  if (Math.random() > chance)
    return false;

  const el = e.target;

  // Only run if an active icon was clicked
  if (!condition(el))
    return false;

  const parentEl = el.closest(parentSelector);

  // Don't run if the icon already has an active animation
  if (parentEl.querySelectorAll(selector).length > 0)
    return false;

  const newGif = document.importNode(template.content, true).querySelector(selector);
  parentEl.appendChild(newGif);

  const gifStyle = window.getComputedStyle(newGif);
  const animFrames = parseInt(gifStyle.getPropertyValue("--anim-frames"));
  const animFrameTime = 1000 * parseFloat(gifStyle.getPropertyValue("--anim-frame-time"));
  const animIters = parseFloat(gifStyle.getPropertyValue("--anim-iters"));

  newGif.style.animationPlayState = "running";

  setTimeout(() => {
    newGif.style.animation = "none";
    newGif.offsetHeight;
    newGif.style.animation = null;
    newGif.remove();
  }, animFrames * animFrameTime * animIters - 10);

  return true;
}

/**
 * Displays a trombone gif attached to the calling heart icon
 * @param {Event} e 
 */
async function displayTromboneAnim(e) {

  // Tiny delay before starting to ensure the event to toggle the heart state always goes first
  await new Promise((resolve) => { setTimeout(resolve, 1) });

  const condition = (el) => {
    const cl = el.closest(".guess-icon").classList;
    return cl.contains("inactive") || cl.contains("fading");
  };

  if (displayAnim(e, 1, TROMBONE_GIF_TEMPLATE, ".trombone", ".guess-icon", condition))
    playTromboneSound();
}

export let suppressGuessFadeSound = false;

class TromboneEvent extends FunEvent {

  #preloadedGif;

  isActiveForFun(i) {
    return i >= 80 && i <= 89;
  }

  onActivate() {
    manager.addHeartEvent({
      name: "trombone",
      trigger: "click",
      handler: displayTromboneAnim
    });

    // Preload the image and audio so they will appear quickly the first time it's triggered
    this.#preloadedGif = document.importNode(TROMBONE_GIF_TEMPLATE.content, true).querySelector(".trombone");
    preloadAudio("trombone");
    suppressGuessFadeSound = true;
  }

  onDeactivate() {
    manager.removeHeartEvent("trombone");
    this.#preloadedGif = null;
    unloadAudio("trombone");
    suppressGuessFadeSound = false;
  }
}

manager.registerEvent(new TromboneEvent());

/**
 * Displays a explosion gif attached to the calling card
 * @param {Event} e 
 */
async function displayExplosionAnim(e) {

  // Tiny delay before starting to ensure the event to toggle the card state always goes first
  await new Promise((resolve) => { setTimeout(resolve, 1) });

  const condition = (el) => {
    const cl = el.closest(".character-card").classList;
    return cl.contains("active") && cl.contains("flipping");
  };

  if (displayAnim(e, 0.1, EXPLOSION_GIF_TEMPLATE, ".explosion", ".character-card", condition))
    playExplosionSound();
}

class ExplosionEvent extends FunEvent {

  #preloadedGif;

  isActiveForFun(i) {
    return i >= 70 && i <= 79;
  }

  onActivate() {
    manager.addCardEvent({
      name: "explosion",
      trigger: "click",
      handler: displayExplosionAnim
    });

    // Preload the image and audio so they will appear quickly the first time it's triggered
    this.#preloadedGif = document.importNode(EXPLOSION_GIF_TEMPLATE.content, true).querySelector(".explosion");
    preloadAudio("explosion");
  }

  onDeactivate() {
    manager.removeCardEvent("explosion");
    this.#preloadedGif = null;
    unloadAudio("explosion");
  }
}

manager.registerEvent(new ExplosionEvent());

function setGonerClass(e) {
  const card = e.target.closest(".character-card");
  setGonerClassForCard(card);
}

function setGonerClassForCard(el) {
  const cl = el.classList;
  if ((cl.contains("active") && cl.contains("flipping")) ||
    (cl.contains("inactive") && !cl.contains("flipping")))
    cl.add("goner");
  else
    cl.remove("goner");

}

class GonerEvent extends FunEvent {

  isActiveForFun(i) {
    return i >= 55 && i <= 59;
  }

  onActivate() {
    manager.addCardEvent({
      name: "goner",
      trigger: "click",
      handler: setGonerClass
    });
    document.querySelectorAll(".character-card").forEach((el) => { setGonerClassForCard(el) });
  }

  onDeactivate() {
    manager.removeCardEvent("goner");
    document.querySelectorAll(".character-card").forEach((el) => { el.classList.remove("goner") });
  }
}

manager.registerEvent(new GonerEvent());

// General FUN event management
// ----------------------------

export function updateNoFun() {
  if (SETTINGS_NO_FUN_BOX.checked) {
    manager.disableEvents();
  } else {
    manager.enableEvents();
  }
}