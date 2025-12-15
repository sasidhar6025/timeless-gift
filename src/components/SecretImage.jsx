import { useState } from "react";

export default function SecretImage() {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const PASSWORD = "16121997";

  return (
    <div className="secret">
      {!unlocked ? (
        <>
          <p>Some things are meant to be opened only if you know.</p>
          <input
            type="password"
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={() => input === PASSWORD && setUnlocked(true)}>
            Open
          </button>
        </>
      ) : (
        <div className="secret-image-wrapper visible" aria-live="polite">
          <button className="secret-close" aria-label="Close secret image" onClick={() => setUnlocked(false)}>×</button>
          <img src="/images/secret.jpg" width="300" alt="Secret" />
        </div>
      )}
    </div>
  );
}
