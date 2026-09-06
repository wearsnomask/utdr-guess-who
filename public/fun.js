// Code for handling FUN events in the game
// ========================================

// Globals
// -------

// Constant DOM references
const SETTINGS_FUN_BUTTON = document.getElementById("fun-adjust-button");
const SETTINGS_FUN_FORCE_INPUT = document.getElementById("fun-force-input");
const SETTINGS_NO_FUN_BOX = document.getElementById("no-fun");

// The current FUN value. -1 indicates all FUN events will be inactive, 1-100 are valid values and may activate events
let funValue = -1;

let buttonTextLock = false;

class FunEventManager {

  // Whether or not FUN events are enabled
  #enabled;

  // The list of all known FUN events
  #lEvents;

  // The set of all currently-active FUN events
  #sActiveEvents;

  constructor() {
    this.#enabled = true;
    this.#lEvents = [];
    this.#sActiveEvents = new Set();
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
}
const manager = new FunEventManager();

export function setNewFunValue() {
  let newValue = parseInt(SETTINGS_FUN_FORCE_INPUT.value);
  if (!(newValue > 0 && newValue <= 100)) {
    newValue = Math.ceil(Math.random() * 100);
  }
  manager.updateFun(newValue);
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

export function connectFunButton() {
  SETTINGS_FUN_BUTTON.addEventListener("click", setNewFunValue);
}

export function disconnectFunButton() {
  SETTINGS_FUN_BUTTON.removeEventListener("click", setNewFunValue);
}

// Classes implementing specific FUN events

class CharMaskEvent extends FunEvent {

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

manager.registerEvent(new CharMaskEvent());

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

// General FUN event management
// ----------------------------

export function updateNoFun() {
  if (SETTINGS_NO_FUN_BOX.checked) {
    manager.disableEvents();
  } else {
    manager.enableEvents();
  }
}