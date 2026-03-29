// Audio service — Web Speech API only (ElevenLabs removed)

let currentUtterance = null;

export function cancelSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export async function speakText(text, { isMuted = false, onStart, onEnd } = {}) {
  if (isMuted || !text) return;
  cancelSpeech();
  _webSpeech(text, { onStart, onEnd });
}

function _webSpeech(text, { onStart, onEnd } = {}) {
  if (!window.speechSynthesis) {
    onEnd?.();
    return;
  }

  function speak() {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(v =>
      /daniel|david|james|george|arthur|male|alex|fred/i.test(v.name)
    );
    if (maleVoice) utterance.voice = maleVoice;
    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    currentUtterance = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    speak();
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', speak, { once: true });
  }
}
