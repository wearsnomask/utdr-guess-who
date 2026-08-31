// Code for handling FUN events in the game
// ========================================

// Globals
// -------

// The current FUN value. -1 indicates all FUN events will be inactive, 1-100 are valid values and may activate events
let funValue = -1;

class FunEventManager {

  // The list of all known FUN events
  #lEvents;

  // The set of all currently-active FUN events
  #sActiveEvents;

  constructor() {
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
  updateFunValue(fun) {
    // Check through all active events, and deactivate any that are no longer active with the new FUN value. We can't
    // modify the set while iterating over it, hence the second loop
    const lEventsToDeactivate = []
    this.#sActiveEvents.forEach((e) => {
      if (!e.isActiveForFun(fun))
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
      if (e.isActiveForFun(fun)) {
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
    document.getElementById("fun-adjust-button").textContent = funText;

  }
}
const manager = new FunEventManager();

export function setNewFunValue() {
  const newValue = Math.ceil(Math.random() * 100);
  manager.updateFunValue(newValue);
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

  isActiveForFun(i) {
    // Active for FUN 26 only
    return i == 26;
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