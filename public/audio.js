// Code for handling audio in the game
// ===================================

// Constants

const O_AUDIO_PATHS = {
  damage: "snd/damage.wav",
  explosion: "snd/explosion.mp3",
  movemenu: "snd/movemenu.wav",
  select: "snd/select.wav",
  trombone: "snd/trombone.ogg",
}

// Globals
const oLoadedAudio = {};

export function playSound(key) {
  if (!Object.hasOwn(oLoadedAudio, key)) {
    oLoadedAudio[key] = new Audio(O_AUDIO_PATHS[key]);
  }
  oLoadedAudio[key].play();
}