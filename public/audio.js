// Code for handling audio in the game
// ===================================

// Constants

const O_AUDIO_PATHS = {
  damage: "snd/damage",
  explosion: "snd/explosion",
  movemenu: "snd/movemenu",
  select: "snd/select",
  trombone: "snd/trombone",
};

// Sounds which will normally always be active
const L_STANDARD_SOUNDS = ["damage", "movemenu", "select"];


// Globals

const oPreloadedAudio = {};
let oggSupported = null;


// General audio functions

function isOggSupported() {
  if (oggSupported === null) {
    const audio = new Audio();
    if (!!(audio.canPlayType && audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '')))
      oggSupported = true;
    else
      oggSupported = false;
  }
  return oggSupported;
}

function getAudioPath(key) {
  const basePath = O_AUDIO_PATHS[key];
  if (isOggSupported())
    return basePath + ".ogg";
  else
    return basePath + ".wav"
}

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
    oPreloadedAudio[key] = new Audio(getAudioPath(key));
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
    const audio = new Audio(getAudioPath(key));
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