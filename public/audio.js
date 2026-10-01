// Code for handling audio in the game
// ===================================

// Constants

const O_AUDIO_BASE_PATHS = {
  damage: "snd/damage",
  explosion: "snd/explosion",
  movemenu: "snd/movemenu",
  select: "snd/select",
  trombone: "snd/trombone",
};

// Sounds which will normally always be active
const L_STANDARD_SOUNDS = ["damage", "movemenu", "select"];

// Constant DOM references
const SETTINGS_MUTE_SOUND_BOX = document.getElementById("mute-sound-box");


// Globals

const oPreloadedAudio = {};
let oggSupported = null;
let oAudioPaths = {};


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

// Set up audio paths based on if .ogg formats are supported or not
let audioExt = ".wav";
if (isOggSupported()) {
  audioExt = ".ogg";
}
Object.entries(O_AUDIO_BASE_PATHS).forEach(([key, val]) => {
  oAudioPaths[key] = val + audioExt;
});

/**
 * Checks whether or not the user has enabled audio
 * @returns {Boolean}
 */
export function audioEnabled() {
  return !SETTINGS_MUTE_SOUND_BOX.checked;
}

/** 
 * Preload a specific sound so it can be played quickly when next needed
 * @param {String} key 
 */
export function preloadAudio(key) {
  if (!Object.hasOwn(oPreloadedAudio, key))
    oPreloadedAudio[key] = new Audio(oAudioPaths[key]);
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
    const audio = new Audio(oAudioPaths[key]);
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

export function playDamageSound(vol = 0.5) {
  playSound("damage", vol);
}

export function playExplosionSound(vol = 1) {
  playSound("explosion", vol);
}

export function playMoveMenuSound(vol = 0.5) {
  playSound("movemenu", vol);
}

export function playSelectSound(vol = 1) {
  playSound("select", vol);
}

export function playTromboneSound(vol = 1) {
  playSound("trombone", vol);
}