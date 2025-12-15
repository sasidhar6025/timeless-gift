import HoverImage from "./HoverImage";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

const replacePlaceholders = (text) => {
  return text
    .replace(/{{Akkayya}}/g, "<akkayya>")
    .replace(/{{Bava}}/g, "<bava>")
    .replace(/{{Isha}}/g, "<isha>")
    .replace(/{{Amma}}/g, "<amma>")
    .replace(/{{Family}}/g, "<family>");
};

const renderInline = (text, keyPrefix = '') => {
  const raw = replacePlaceholders(text).trim();
  return raw.split(" ").map((word, i) => {
    if (word.includes("<akkayya>")) return <span key={`${keyPrefix}-${i}`}><HoverImage name="Akkayya" image="/images/Akkayya.jpg" />{' '}</span>;
    if (word.includes("<bava>")) return <span key={`${keyPrefix}-${i}`}><HoverImage name="Bava" image="/images/Bava.jpg" />{' '}</span>;
    if (word.includes("<isha>")) return <span key={`${keyPrefix}-${i}`}><HoverImage name="Isha" image="/images/Isha.JPG" />{' '}</span>;
    if (word.includes("<amma>")) return <span key={`${keyPrefix}-${i}`}><HoverImage name="Amma" image="/images/Amma.jpg" />{' '}</span>;
    if (word.includes("<family>")) return <span key={`${keyPrefix}-${i}`}><HoverImage name="Family" image="/images/Family.jpg" />{' '}</span>;
    return word + " ";
  });
};

function SavorLine({ text, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // base delay by index; longer for savor mode via CSS variable if desired
  const base = 700; // ms (longer for savor mode)
    const delay = base * index;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <p className={`savor-line ${visible ? 'visible' : ''}`}>{renderInline(text, `savor-${index}`)}</p>
  );
}

function contrastColor(hexOrRgb) {
  try {
    // strip hashes and spaces
    const s = String(hexOrRgb).trim();
    // support rgb(...) or hex
    let r, g, b;
    if (s.startsWith("rgb")) {
      const nums = s.replace(/[rgba()]/g, "").split(",").map(n => parseFloat(n));
      [r, g, b] = nums;
    } else {
      const hex = s.replace('#','');
      if (hex.length === 3) {
        r = parseInt(hex[0]+hex[0],16);
        g = parseInt(hex[1]+hex[1],16);
        b = parseInt(hex[2]+hex[2],16);
      } else {
        r = parseInt(hex.substring(0,2),16);
        g = parseInt(hex.substring(2,4),16);
        b = parseInt(hex.substring(4,6),16);
      }
    }
    // perceived brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150 ? '#111' : '#fff';
    } catch {
      return '#fff';
    }
}

export default function MessageModal({ message, onClose, savor = false }) {
  const today = new Date();
  const isBirthday = today.getDate() === 16 && today.getMonth() === 11;

  // ...existing code...

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const [portalEl] = useState(() => {
    if (typeof document === 'undefined') return null;
    let el = document.getElementById('modal-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'modal-root';
      el.className = 'portal-modal-root';
      document.body.appendChild(el);
    }
    return el;
  });

  const contentRef = useRef(null);
  const prevActiveRef = useRef(null);

  // Focus trap and restore previous focus + aria-live announcement
  useEffect(() => {
    if (!portalEl) return;
    const content = contentRef.current;
    prevActiveRef.current = document.activeElement;

    // move focus into the dialog
    const focusable = content ? content.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])') : [];
    const first = focusable && focusable.length ? focusable[0] : content;
    if (first && typeof first.focus === 'function') {
      setTimeout(() => first.focus(), 0);
    }

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const elements = content.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
      const nodeList = Array.prototype.slice.call(elements);
      if (nodeList.length === 0) {
        e.preventDefault();
        return;
      }
      const idx = nodeList.indexOf(document.activeElement);
      if (e.shiftKey) {
        // backward
        if (idx <= 0) {
          nodeList[nodeList.length - 1].focus();
          e.preventDefault();
        }
      } else {
        // forward
        if (idx === nodeList.length - 1) {
          nodeList[0].focus();
          e.preventDefault();
        }
      }
    };

    content && content.addEventListener('keydown', handleKeyDown);

    return () => {
      content && content.removeEventListener('keydown', handleKeyDown);
      // restore focus
      try { prevActiveRef.current && prevActiveRef.current.focus(); } catch { /* ignore */ }
    };
  }, [portalEl]);

  const modal = (
    <div className="modal" onClick={onClose}>
      <div
        className="modal-content"
        style={{ background: message.color, color: contrastColor(message.color) }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${message.id}`}
        ref={contentRef}
        tabIndex={-1}
      >
        <button className="modal-close" aria-label="Close message" onClick={onClose}>×</button>
  <h2 id={`modal-title-${message.id}`} className="card-title">{message.title}</h2>
        {/* aria-live region to announce the opened message to screen readers */}
        <div className="sr-only" aria-live="polite">Opened message: {message.title}</div>

        {isBirthday && (
          <p><strong>Happy Birthday.</strong></p>
        )}

        <div className="modal-body">
          {(() => {
            const raw = replacePlaceholders(message.content).trim();
            // split into paragraphs or sentences for savor mode
            const lines = raw.split(/\n\s*\n|(?<=\.|\?|!)\s+/g).filter(Boolean);
            if (!savor) {
              // render as normal with inline HoverImage replacements
              return renderInline(raw);
            }

            // Savor mode: reveal lines progressively
            return lines.map((ln, idx) => (
              <SavorLine key={idx} text={ln} index={idx} />
            ));
          })()}
        </div>
        <div className="signature">With love,</div>
        <div className="opened-line">Opened on {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} — this moment matters.</div>
      </div>
    </div>
  );

  return portalEl ? createPortal(modal, portalEl) : null;
}
