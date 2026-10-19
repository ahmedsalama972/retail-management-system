const SOUND_SRC = '/assets/sounds/notification.wav';

let audio: HTMLAudioElement | null = null;

function getAudio() {
  if (typeof window === 'undefined') return null;
  if (!audio) {
    audio = new Audio(SOUND_SRC);
    audio.preload = 'auto';
  }
  return audio;
}

/** Quiet unlock so browsers allow later notification chimes. */
export function unlockNotificationSound() {
  try {
    const el = getAudio();
    if (!el) return;
    const previous = el.volume;
    el.volume = 0;
    el.currentTime = 0;
    el.play()
      .then(() => {
        el.pause();
        el.currentTime = 0;
        el.volume = previous || 1;
      })
      .catch(() => {
        el.volume = previous || 1;
      });
  } catch {
    /* ignore */
  }
}

/** Play the in-app notification chime (best-effort). */
export function playNotificationSound() {
  try {
    const el = getAudio();
    if (!el) return;
    el.volume = 1;
    el.currentTime = 0;
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => undefined);
    }
  } catch {
    /* ignore */
  }
}
