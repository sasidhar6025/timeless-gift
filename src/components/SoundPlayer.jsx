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
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [lastPlayError, setLastPlayError] = useState(null);
  const audioCtxRef = useRef(null);
  const musicGainRef = useRef(null);
  const fullAudioRef = useRef(null);
  const fullAudioTimeoutRef = useRef(null);
  const [audioStatus, setAudioStatus] = useState({ readyState: null, networkState: null, duration: null });

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
      if (p && p.then) {
        p.then(() => {
          setAutoplayBlocked(false);
          // if autoplay succeeded while muted, unmute after a short delay
          setTimeout(() => { try { audio.muted = false; } catch (e) { console.error('unmute failed', e); } }, 300);
        }).catch((err) => {
          // autoplay blocked by browser policy
          setAutoplayBlocked(true);
          setLastPlayError(err && err.message ? String(err.message) : String(err));
          try { audio.muted = false; } catch (e) { console.debug('unmute failed', e); }
        });
      } else {
        // no promise returned; assume playing
      }
    } else {
      try { audio.pause(); } catch (e) { console.debug('pause failed', e); }
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

  // attach audio element event listeners to capture errors and status for deployed debugging
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onError = (e) => {
      try {
        const err = audio.error;
        const msg = err ? `code:${err.code} message:${err.message || 'unknown'}` : (e && e.type) || 'audio error';
        setLastPlayError(msg);
        console.debug('audio error', msg, audio.currentSrc);
      } catch (ee) { console.debug('audio error handler failed', ee); }
    };
    const onPlaying = () => {
      setAutoplayBlocked(false);
      setLastPlayError(null);
      setAudioStatus({ readyState: audio.readyState, networkState: audio.networkState, duration: audio.duration });
      console.debug('audio playing', audio.currentSrc);
    };
    const onPlayEvent = () => setAudioStatus((s) => ({ ...s, readyState: audio.readyState }));
    const onLoaded = () => setAudioStatus((s) => ({ ...s, readyState: audio.readyState, duration: audio.duration }));
    audio.addEventListener('error', onError);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('play', onPlayEvent);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('stalled', () => { console.debug('audio stalled'); setLastPlayError('stalled'); });
    return () => {
      try {
        audio.removeEventListener('error', onError);
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('play', onPlayEvent);
        audio.removeEventListener('loadedmetadata', onLoaded);
      } catch (err) { console.debug('remove listeners failed', err); }
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
    <>
      <div className="sound-player" style={{ position: "fixed", right: 12, bottom: 12, zIndex: 9999, display: "flex", gap: 8, alignItems: "center" }}>
        <audio ref={audioRef} src={src} preload="auto" aria-label={title} />
        <button onClick={() => setPlaying((p) => !p)} aria-pressed={playing} style={{ padding: "6px 10px", borderRadius: 8 }}>
          {playing ? "Pause" : "Play"}
        </button>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume" />
        </label>
      </div>

      {/* If autoplay is blocked on deployed site, show a small overlay to request user gesture */}
      {autoplayBlocked && (
        <div style={{ position: 'fixed', right: 12, bottom: 80, zIndex: 12000 }}>
          <div style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', padding: 12, borderRadius: 10, minWidth: 220 }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Audio blocked</div>
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>Browser blocked autoplay. Click enable to allow ambient music.</div>
            {lastPlayError && <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Error: {lastPlayError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => {
                try {
                  const audio = audioRef.current;
                  if (!audio) return;
                  audio.play().then(() => { setPlaying(true); setAutoplayBlocked(false); }).catch((err) => { setLastPlayError(err && err.message ? String(err.message) : String(err)); });
                } catch (err) { setLastPlayError(err && err.message ? String(err.message) : String(err)); }
              }} style={{ padding: '8px 12px', borderRadius: 8, background: '#1f1f1f', color: '#fff', border: 'none', cursor: 'pointer' }}>Enable audio</button>
              <button onClick={() => { setAutoplayBlocked(false); }} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
      {/* Debug panel for deployed troubleshooting */}
      {(autoplayBlocked || lastPlayError || !available) && (
        <div style={{ position: 'fixed', right: 12, bottom: 180, zIndex: 12000 }}>
          <div style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: 10, borderRadius: 8, minWidth: 260 }}>
            <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}>Audio debug</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>src: <span style={{ opacity: 0.95 }}>{src}</span></div>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>readyState: {audioStatus.readyState ?? 'n/a'}</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>networkState: {audioStatus.networkState ?? 'n/a'}</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>duration: {audioStatus.duration ? `${Math.round(audioStatus.duration)}s` : 'unknown'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => window.open(src, '_blank')} style={{ padding: '6px 10px', borderRadius: 6 }}>Open audio</button>
              <button onClick={() => { try { fetch(src, { method: 'HEAD' }).then(r => { alert('HEAD: ' + r.status); }).catch(e => { alert('HEAD failed: ' + e.message); }); } catch (e) { alert('check failed: ' + e.message); } }} style={{ padding: '6px 10px', borderRadius: 6 }}>Check URL</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
