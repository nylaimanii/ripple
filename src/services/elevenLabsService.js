const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam — deep, documentary

let currentAudio     = null;
let currentObjectUrl = null;

export function cancelSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export async function speakText(text, { isMuted = false, onStart, onEnd } = {}) {
  if (isMuted || !text) return;

  cancelSpeech();

  if (!API_KEY) {
    _fallbackWebSpeech(text, { onStart, onEnd });
    return;
  }

  try {
    onStart?.();

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept':       'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key':   API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) throw new Error(`ElevenLabs ${response.status}`);

    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);
    currentObjectUrl = url;

    const audio = new Audio(url);
    currentAudio = audio;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      currentObjectUrl = null;
      currentAudio     = null;
      onEnd?.();
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;

    await audio.play();
  } catch (e) {
    console.error('ElevenLabs speakText error:', e);
    onEnd?.();
    _fallbackWebSpeech(text, { onStart, onEnd });
  }
}

function _fallbackWebSpeech(text, { onStart, onEnd } = {}) {
  if (!window.speechSynthesis) { onEnd?.(); return; }

  function speak() {
    const utterance   = new SpeechSynthesisUtterance(text);
    utterance.rate    = 0.85;
    utterance.pitch   = 0.9;
    const voices      = window.speechSynthesis.getVoices();
    const maleVoice   = voices.find(v =>
      /daniel|david|james|george|arthur|male|alex|fred/i.test(v.name)
    );
    if (maleVoice) utterance.voice = maleVoice;
    utterance.onstart = () => onStart?.();
    utterance.onend   = () => onEnd?.();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    speak();
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', speak, { once: true });
  }
}
