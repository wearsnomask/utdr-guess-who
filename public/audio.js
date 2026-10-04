// Code for handling audio in the game
// ===================================

// Constants

const O_AUDIO_BASE_PATHS = {
  bark: "snd/bark",
  damage: "snd/damage",
  explosion: "snd/explosion.mp3",
  flip: "snd/flip",
  heal: "snd/heal",
  movemenu: "snd/movemenu",
  select: "snd/select",
  trombone: "snd/trombone.mp3",
  flowery: "snd/flowery.mp3",
  flowery_eating: "snd/flowery_eating.mp3",
  flowery_falling: "snd/flowery_falling.mp3",
  flowery_forgetit: "snd/flowery_forgetit.mp3",
  flowery_gohome: "snd/flowery_gohome.mp3",
  flowery_goodbye: "snd/flowery_goodbye.mp3",
  flowery_great: "snd/flowery_great.mp3",
  flowery_itsme: "snd/flowery_itsme.mp3",
  flowery_jarona: "snd/flowery_jarona.mp3",
  flowery_leafittome: "snd/flowery_leafittome.mp3",
  flowery_sanfrandisco: "snd/flowery_sanfrandisco.mp3",
  flowery_stingus: "snd/flowery_stingus.mp3"
};

// Sounds which will normally always be active
const L_STANDARD_SOUNDS = ["bark", "damage", "movemenu", "select"];

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
  if (val.slice(-4) == ".mp3") {
    if (isOggSupported())
      oAudioPaths[key] = val.slice(0, -4) + audioExt;
    else
      oAudioPaths[key] = val;
  } else {
    oAudioPaths[key] = val + audioExt;
  }
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
 * @returns {HTMLAudioElement}
 */
export function playSound(key, vol = 1) {
  preloadAudio(key)
  if (audioEnabled()) {
    const audio = new Audio(oAudioPaths[key]);
    audio.volume = vol;
    audio.play();
    return audio;
  }
  return null;
}

// Convenience functions

/**
 * Preload all standard sounds
 */
export function preloadStandardAudio() {
  L_STANDARD_SOUNDS.forEach((key) => preloadAudio(key));
}

export function playBarkSound(vol = 1) {
  playSound("bark", vol);
}

export function playDamageSound(vol = 0.5) {
  playSound("damage", vol);
}

export function playExplosionSound(vol = 1) {
  playSound("explosion", vol);
}

export function playFlipSound(vol = 0.4) {
  playSound("flip", vol);
}

export function playHealSound(vol = 1) {
  playSound("heal", vol);
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

export function playFlowerySound(vol = 1) {
  playSound("flowery", vol);
}

/**
 * Pick a random item from an array
 * @param {Array} a 
 */
function randomItem(a) {
  return a[Math.floor(Math.random() * a.length)];
}

const L_FLOWERY_POSITIVE = ["flowery_great", "flowery_itsme", "flowery_jarona", "flowery_leafittome",
  "flowery_sanfrandisco", "flowery_stingus"];
const L_FLOWERY_NEGATIVE = ["flowery_eating", "flowery_falling", "flowery_forgetit", "flowery_gohome",
  "flowery_goodbye"];

let floweryAudio = null;

export function playFloweryPositiveSound(vol = 1) {
  if (floweryAudio)
    floweryAudio.pause()
  floweryAudio = playSound(randomItem(L_FLOWERY_POSITIVE), vol);
}

export function playFloweryNegativeSound(vol = 1) {
  if (floweryAudio)
    floweryAudio.pause()
  floweryAudio = playSound(randomItem(L_FLOWERY_NEGATIVE), vol);
}