// Code for handling audio in the game
// ===================================

// Constants

const O_AUDIO_PATHS = {
  damage: "snd/damage.wav",
  explosion: "snd/explosion.mp3",
  movemenu: "snd/movemenu.wav",
  select: "snd/select.wav",
  trombone: "snd/trombone.ogg", // TODO: Convert to a format compatible with Safari
};

// Sounds which will normally always be active
const L_STANDARD_SOUNDS = ["damage", "movemenu", "select"];


// Globals

const oPreloadedAudio = {};


// General audio functions

/**
 * Checks whether or not the user has enabled audio
 * @returns {Boolean}
 */
export function audioEnabled() {
  return true;
}

/** 
 * Preload a specific sound so it can be played quickly when next needed
 * @param {String} key 
 */
export function preloadAudio(key) {
  if (!Object.hasOwn(oPreloadedAudio, key))
    oPreloadedAudio[key] = new Audio(O_AUDIO_PATHS[key]);
}

/** 
 * Unload a preloaded sound
 * @param {String} key 
 */
export function unloadAudio(key) {
  if (!Object.hasOwn(oPreloadedAudio, key))
    delete oPreloadedAudio[key];
}

/**
 * Play a specific sound
 * @param {String} key 
 */
export function playSound(key, vol = 1) {
  preloadAudio(key)
  if (audioEnabled()) {
    const audio = new Audio(O_AUDIO_PATHS[key]);
    audio.volume = vol;
    audio.play();
  }
}

// Convenience functions

/**
 * Preload all standard sounds
 */
export function preloadStandardAudio() {
  L_STANDARD_SOUNDS.forEach((key) => preloadAudio(key));
}

export function playDamageSound() {
  playSound("damage", 0.5);
}

export function playExplosionSound() {
  playSound("explosion");
}

export function playMoveMenuSound() {
  playSound("movemenu");
}

export function playSelectSound() {
  playSound("select");
}

export function playTromboneSound() {
  playSound("trombone");
}