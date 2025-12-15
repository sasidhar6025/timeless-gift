import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "timeless.sound";

export default function SoundPlayer({ src = "/sound/ambient.mp3", title = "Ambient soundtrack" }) {
  const [available, setAvailable] = useState(true);
  const [playing, setPlaying] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [volume, setVolume] = useState(() => {
    try {
      const v = localStorage.getItem(`${STORAGE_KEY}.vol`);
      return v ? Number(v) : 0.25;
    } catch {
      return 0.25;
    }
  });
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const musicGainRef = useRef(null);
  const fullAudioRef = useRef(null);
  const fullAudioTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, playing ? "1" : "0");
    } catch (e) {
      console.error("SoundPlayer save state error:", e);
    }

    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    // route audio through WebAudio gain node if available
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        const ctx = audioCtxRef.current;
        if (!musicGainRef.current) {
          try {
            const srcNode = ctx.createMediaElementSource(audio);
            const g = ctx.createGain();
            g.gain.value = volume;
            srcNode.connect(g);
            g.connect(ctx.destination);
            musicGainRef.current = g;
          } catch {
            // creating MediaElementSource can throw if audio is cross-origin without CORS headers; fallback to element volume
            musicGainRef.current = null;
          }
        } else {
          // update gain
          try { if (musicGainRef.current && musicGainRef.current.gain) musicGainRef.current.gain.value = volume; } catch (err) { console.debug('update gain failed', err); }
        }
      } else {
        audio.volume = volume;
      }
      } catch {
      audio.volume = volume;
    }
    // if playing requested, attempt to play; browsers may block autoplay
    if (playing) {
      audio.muted = true; // try muted autoplay first
      const p = audio.play();
      if (p && p.catch) p.catch(() => {
        // autoplay blocked, unmute and wait for user gesture
        audio.muted = false;
      }).then(() => {
        // if autoplay succeeded while muted, unmute after a short delay
        setTimeout(() => { try { audio.muted = false; } catch (e) { console.error('unmute failed', e); } }, 300);
      });
    } else {
      audio.pause();
    }
  }, [playing, volume]);

  // Listen for programmatic play/pause via custom events (timeless:play / timeless:pause)
  useEffect(() => {
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    window.addEventListener('timeless:play', onPlay);
    window.addEventListener('timeless:pause', onPause);
    // small chime / full-ambient event - ensure only one full audio instance plays at a time
    const onChime = () => {
      // When the answer popup opens, ensure the ambient background audio is playing in loop.
      try {
        setPlaying(true);
      } catch (err) {
        console.debug('start looped ambient failed', err);
      }
    };
    window.addEventListener('timeless:playFull', onChime);
    return () => {
      window.removeEventListener('timeless:play', onPlay);
      window.removeEventListener('timeless:pause', onPause);
      window.removeEventListener('timeless:playFull', onChime);
      // cleanup any in-progress full-audio instance
      try {
        if (fullAudioRef.current) {
          try { fullAudioRef.current.pause(); fullAudioRef.current.src = ''; } catch (err) { console.debug('cleanup full audio failed', err); }
          fullAudioRef.current = null;
        }
        if (fullAudioTimeoutRef.current) {
          clearTimeout(fullAudioTimeoutRef.current);
          fullAudioTimeoutRef.current = null;
        }
      } catch (err) {
        console.debug('cleanup refs failed', err);
      }
    };
  }, [src, volume]);

  // check whether the audio file exists (HEAD request) and hide UI if missing
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(src, { method: "HEAD" });
        if (!canceled) setAvailable(res.ok);
      } catch {
        if (!canceled) setAvailable(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [src]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}.vol`, String(volume));
    } catch (e) {
      console.error("SoundPlayer save volume error:", e);
    }
  }, [volume]);

  if (!available) {
    return (
      <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 9999, background: "rgba(0,0,0,0.6)", color: "#fff", padding: 8, borderRadius: 8 }}>
        Background music not found.
        <div style={{ marginTop: 8 }}>
          <label style={{ fontSize: 13 }}>Choose a local audio file to test:</label>
          <input type="file" accept="audio/*" onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            if (f) {
              const url = URL.createObjectURL(f);
              try { localStorage.setItem(`${STORAGE_KEY}.local`, url); } catch (e) { console.error('save local audio url failed', e); }
              const audio = audioRef.current;
              if (audio) { audio.src = url; audio.play().catch(() => {}); setPlaying(true); }
              setAvailable(true);
            }
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="sound-player" style={{ position: "fixed", right: 12, bottom: 12, zIndex: 9999, display: "flex", gap: 8, alignItems: "center" }}>
      <audio ref={audioRef} src={src} preload="auto" aria-label={title} />
      <button onClick={() => setPlaying((p) => !p)} aria-pressed={playing} style={{ padding: "6px 10px", borderRadius: 8 }}>
        {playing ? "Pause" : "Play"}
      </button>
      <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume" />
      </label>
    </div>
  );
}
