import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';

export default function FavoriteModal({ item, onClose }) {
  const modalRef = useRef(null);
  const firstFocusRef = useRef(null);

  useEffect(() => {
    if (!item) return;
    const prevActive = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // focus trap: focus modal container
    if (modalRef.current) {
      firstFocusRef.current = modalRef.current.querySelector('button, [tabindex]') || modalRef.current;
      firstFocusRef.current && firstFocusRef.current.focus();
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      prevActive && prevActive.focus && prevActive.focus();
    };
  }, [onClose, item]);

  if (!item) return null;

  const rootId = 'modal-root';
  let root = document.getElementById(rootId);
  if (!root) {
    root = document.createElement('div');
    root.id = rootId;
    document.body.appendChild(root);
  }

  const modal = (
    <div className="modal" onClick={onClose}>
      <div className="modal-content fav-modal" ref={modalRef} onClick={(e) => e.stopPropagation()} style={{ padding: 20 }}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        <h3 style={{ marginTop: 8 }}>{item.name}</h3>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
          <img src={item.src} alt={item.name} className="fav-modal-image transition-image" style={{ maxWidth: '80vw', width: 360, borderRadius: 10 }} />
        </div>
      </div>
    </div>
  );

  return createPortal(modal, root);
}
