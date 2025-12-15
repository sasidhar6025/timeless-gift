/* import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
 */


import { useState, useEffect } from "react";
import { messages } from "./data/messages";
import MessageCard from "./components/MessageCard";
import MessageModal from "./components/MessageModal";
import SecretImage from "./components/SecretImage";
import PersonaBackground from "./components/PersonaBackground";
import SoundPlayer from "./components/SoundPlayer";
import FavoritesMenu from "./components/FavoritesMenu";
import "./styles.css";

export default function App() {
  const [active, setActive] = useState(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("timeless.theme") || "warm";
    } catch {
      return "warm";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("timeless.theme", theme);
    } catch (e) {
      console.error("Error saving theme:", e);
    }
    const root = document.documentElement;
    if (theme === "night") {
      root.classList.add("theme-night");
    } else {
      root.classList.remove("theme-night");
    }
  }, [theme]);

  const today = new Date();
  const isBirthday = today.getDate() === 16 && today.getMonth() === 11;
  const [showAudioPrompt, setShowAudioPrompt] = useState(() => {
    try { return localStorage.getItem('timeless.audioPrompt') !== 'dismissed'; } catch { return true; }
  });
  const [personaAlign, setPersonaAlign] = useState(() => {
    try { return localStorage.getItem('timeless.personaAlign') || 'right'; } catch { return 'right'; }
  });
  const [savor, setSavor] = useState(() => {
    try {
      const v = localStorage.getItem('timeless.savor');
      // default to true when no preference is stored
      if (v === null || v === undefined) return true;
      return v === '1';
    } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem('timeless.savor', savor ? '1' : '0'); } catch (err) { console.debug('save savor failed', err); }
    if (savor) document.documentElement.classList.add('savor-mode'); else document.documentElement.classList.remove('savor-mode');
  }, [savor]);

  return (
    <div className="app-root">
  <PersonaBackground src="/images/luna.jpg" position={personaAlign} />
  <div className="persona-align-controls" aria-hidden="false">
  <button onClick={() => { setPersonaAlign('left'); try { localStorage.setItem('timeless.personaAlign','left'); } catch (e) { console.error('save align left failed', e); } }} title="Align portrait left">Left</button>
  <button onClick={() => { setPersonaAlign('center'); try { localStorage.setItem('timeless.personaAlign','center'); } catch (e) { console.error('save align center failed', e); } }} title="Align portrait center">Center</button>
  <button onClick={() => { setPersonaAlign('right'); try { localStorage.setItem('timeless.personaAlign','right'); } catch (e) { console.error('save align right failed', e); } }} title="Align portrait right">Right</button>
  </div>

      <div className="container content">
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
          <FavoritesMenu />
          <button onClick={() => setTheme((t) => (t === "warm" ? "night" : "warm"))} style={{ padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer" }}>
            Switch theme: {theme === "warm" ? "Warm Paper" : "Night Glow"}
          </button>
          <button onClick={() => setSavor((s) => !s)} aria-pressed={savor} style={{ padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer" }}>
            {savor ? 'Savor: On' : 'Savor: Off'}
          </button>
        </div>

        {isBirthday && <p>Today matters. Happy Birthday.</p>}

        <div className="title">
          This isn’t a birthday gift.  
          It just happens to start on one.
        </div>

        <div className="subtitle">These messages don’t expire.</div>

        {messages.map((m) => (
          <MessageCard key={m.id} title={m.title} onClick={() => {
            // user gesture: open message and trigger music play event + chime
            setActive(m);
            //try { window.dispatchEvent(new Event('timeless:play')); } catch (e) { console.error('play dispatch failed', e); }
            //try { window.dispatchEvent(new Event('timeless:playFull')); } catch (e) { console.error('playFull dispatch failed', e); }
            // add a body class to animate greeting-card open
             if (window.__timelessAudio?.play) {
                window.__timelessAudio.play();
            }
            document.documentElement.classList.add('greeting-open');
          }} />
        ))}

  {active && <MessageModal message={active} savor={savor} onClose={() => { setActive(null); try { window.dispatchEvent(new Event('timeless:pause')); } catch (e) { console.error('pause dispatch failed', e); } document.documentElement.classList.remove('greeting-open'); }} />}

        <SecretImage />
  {/* use Vite base URL so the sound path resolves correctly in deployed apps hosted on subpaths */}
  <SoundPlayer src={`${import.meta.env.BASE_URL}sound/ambient.mp3`} />
        {showAudioPrompt && (
          <div style={{ position: 'fixed', left: 20, bottom: 80, zIndex: 9999, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '10px 14px', borderRadius: 8 }}>
            <div style={{ marginBottom: 6 }}>Enable background music for a gentler ambience.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { try { localStorage.setItem('timeless.sound','1'); } catch (e) { console.error('save play state failed', e); } window.location.reload(); }} style={{ padding: '6px 10px' }}>Enable</button>
              <button onClick={() => { try { localStorage.setItem('timeless.audioPrompt','dismissed'); } catch (e) { console.error('save prompt dismissed failed', e); } setShowAudioPrompt(false); }} style={{ padding: '6px 10px' }}>Dismiss</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
