import { useRef, useCallback, useEffect } from 'react';

/**
 * AI Voice Engine — v3 (Fixed stopAll + audioElRef tracking)
 *
 * Fixes:
 *  1. audioElRef.current is now set inside tryPlayBase64 so stopAll() can interrupt it
 *  2. Immediate stop when human starts speaking
 *  3. Distinct voices: moderator vs participant
 *  4. stopAll() cancels mid-sentence (base64 AND web-speech)
 */
export function useAIVoice({ enabled = true } = {}) {
  const queueRef    = useRef([]);
  const playingRef  = useRef(false);
  const audioCtxRef = useRef(null);
  const audioElRef  = useRef(null);   // ✅ tracks currently playing <Audio> so stopAll works
  const enabledRef  = useRef(enabled);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  // ── Unlock AudioContext on first user gesture ────────────────────────────
  useEffect(() => {
    function unlock() {
      if (audioCtxRef.current) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf; src.connect(ctx.destination); src.start(0);
        audioCtxRef.current = ctx;
      } catch {}
      document.removeEventListener('click',      unlock);
      document.removeEventListener('keydown',    unlock);
      document.removeEventListener('touchstart', unlock);
    }
    document.addEventListener('click',      unlock, { once: true });
    document.addEventListener('keydown',    unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    return () => {
      document.removeEventListener('click',      unlock);
      document.removeEventListener('keydown',    unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);

  const processQueue = useRef(null);
  processQueue.current = () => {
    if (playingRef.current || queueRef.current.length === 0) return;
    if (!enabledRef.current) { queueRef.current = []; return; }

    const item = queueRef.current.shift();
    playingRef.current = true;

    const onDone = () => {
      audioElRef.current = null;    // ✅ clear ref when done
      playingRef.current = false;
      setTimeout(() => processQueue.current?.(), 150);
    };

    if (item.audioBase64 && audioCtxRef.current) {
      // ✅ Pass audioElRef so tryPlayBase64 can set it for stopAll()
      tryPlayBase64(item.audioBase64, item.text, item.voiceType, onDone, audioElRef);
    } else {
      speakWebSpeech(item.text, item.voiceType, onDone);
    }
  };

  const enqueue = useCallback((audioBase64, text, voiceType = 'moderator') => {
    if (!text?.trim()) return;
    queueRef.current.push({ audioBase64: audioBase64 || null, text, voiceType });
    processQueue.current?.();
  }, []);

  const playAudio = useCallback((audioBase64, text, voiceType = 'moderator') => {
    enqueue(audioBase64, text, voiceType);
  }, [enqueue]);

  const playText = useCallback((text, voiceType = 'moderator') => {
    enqueue(null, text, voiceType);
  }, [enqueue]);

  // ✅ Immediate stop — cancels queued + currently playing base64 audio AND web speech
  const stopAll = useCallback(() => {
    queueRef.current   = [];
    playingRef.current = false;
    window.speechSynthesis?.cancel();
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
        audioElRef.current.src = '';
      } catch {}
      audioElRef.current = null;
    }
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  return { playAudio, playText, stopAll };
}

// ── Play Groq base64 TTS via <Audio> element ─────────────────────────────────
// ✅ audioElRef param lets the hook's stopAll() pause this element mid-play
function tryPlayBase64(base64, text, voiceType, onDone, audioElRef) {
  try {
    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob  = new Blob([bytes], { type: 'audio/mp3' });
    const url   = URL.createObjectURL(blob);
    const audio = new Audio(url);

    // ✅ Assign so stopAll() can call .pause() on it
    audioElRef.current = audio;

    audio.onended = () => { URL.revokeObjectURL(url); onDone(); };
    audio.onerror = () => { URL.revokeObjectURL(url); speakWebSpeech(text, voiceType, onDone); };
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => { URL.revokeObjectURL(url); speakWebSpeech(text, voiceType, onDone); });
    }
  } catch {
    speakWebSpeech(text, voiceType, onDone);
  }
}

// ── Web Speech API — different voices for moderator vs participant ────────────
function speakWebSpeech(text, voiceType = 'moderator', onDone) {
  if (!window.speechSynthesis || !text?.trim()) { onDone?.(); return; }
  window.speechSynthesis.cancel();

  const MAX_CHUNK = 200;
  const chunks    = chunkText(text, MAX_CHUNK);
  let idx = 0;

  function speakChunk() {
    if (idx >= chunks.length) { onDone?.(); return; }
    const utt = new SpeechSynthesisUtterance(chunks[idx++]);
    utt.lang  = 'en-IN';

    const voices = window.speechSynthesis.getVoices();

    if (voiceType === 'moderator') {
      utt.rate  = 0.90;
      utt.pitch = 1.05;
      utt.volume = 1.0;
      const voice =
        voices.find(v => v.name.includes('Google') && v.lang === 'en-IN') ||
        voices.find(v => v.name.toLowerCase().includes('female') && v.lang.startsWith('en')) ||
        voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
        voices.find(v => v.lang.startsWith('en') && !v.localService) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
      if (voice) utt.voice = voice;
    } else {
      utt.rate  = 0.95;
      utt.pitch = 0.90;
      utt.volume = 0.95;
      const voice =
        voices.find(v => v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('fe') && v.lang.startsWith('en')) ||
        voices.find(v => (v.name.includes('David') || v.name.includes('Mark') || v.name.includes('James')) && v.lang.startsWith('en')) ||
        voices.find(v => v.lang === 'en-GB' && v.name.includes('Google')) ||
        voices.find(v => v.lang.startsWith('en') && v.localService) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
      if (voice) utt.voice = voice;
    }

    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 5000);
    utt.onend   = () => { clearInterval(keepAlive); speakChunk(); };
    utt.onerror = () => { clearInterval(keepAlive); speakChunk(); };
    window.speechSynthesis.speak(utt);
  }

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      speakChunk();
    };
  } else {
    speakChunk();
  }
}

function chunkText(text, max) {
  if (text.length <= max) return [text];
  const chunks    = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > max) {
      if (current) { chunks.push(current.trim()); current = ''; }
      if (s.length > max) {
        for (let i = 0; i < s.length; i += max) chunks.push(s.slice(i, i + max));
      } else { current = s; }
    } else { current += s; }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}