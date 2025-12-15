import { useState, useRef } from "react";
import HoverImage from "./HoverImage";
import FavoriteModal from "./FavoriteModal";

export default function FavoritesMenu() {
  const categories = {
    People: ["Akkayya", "Bava", "Isha", "Amma"],
    Places: ["Tirupathi", "Switzerland", "Beach"],
    Food: ["Dal Rice", "Ghee Roast Mutton Mandi"],
    Things: ["Outfits", "Ear Rings","Shiva Idols"]
  };

  // explicit image filename mappings (use exact filenames in public/images)
  const imageMap = {
    Akkayya: 'Akkayya.jpg',
    Bava: 'Bava.jpg',
    Isha: 'Isha.JPG',
    Amma: 'Amma.jpg',
    Home: 'home.jpg',
    Beach: 'beach.jpg',
    Market: 'market.jpg',
    Park: 'park.jpg'
  };

  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem('timeless.favOpen') || null; } catch { return null; }
  });
  const [focusIndex, setFocusIndex] = useState(0);
  const listRef = useRef(null);
  const [selected, setSelected] = useState(null);

  return (
    <>
    <div className="favorites-menu" aria-hidden="false">
      {Object.keys(categories).map((cat) => (
        <div key={cat} className="fav-block">
          <button
            className="fav-btn"
            onClick={() => {
              const next = open === cat ? null : cat;
              setOpen(next);
              try { localStorage.setItem('timeless.favOpen', next || ''); } catch (err) { console.error('save favOpen failed', err); }
            }}
            aria-expanded={open === cat}
            aria-controls={`fav-list-${cat}`}
          >{cat}</button>
          {open === cat && (
            <div
              id={`fav-list-${cat}`}
              className="fav-list"
              role="menu"
              ref={listRef}
              tabIndex={0}
              onKeyDown={(e) => {
                const items = categories[cat];
                if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIndex((i) => (i + 1) % items.length); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIndex((i) => (i - 1 + items.length) % items.length); }
                if (e.key === 'Enter') { e.preventDefault(); const selName = items[focusIndex]; const selSrc = imageMap[selName] ? `/images/${imageMap[selName]}` : `/images/${selName.replace(/\s+/g,'')}.jpg`; setSelected({ name: selName, src: selSrc }); }
              }}
            >
              {categories[cat].map((item, idx) => (
                <div
                  key={item}
                  className={`fav-item ${focusIndex === idx ? 'focused' : ''}`}
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => { const selSrc = imageMap[item] ? `/images/${imageMap[item]}` : `/images/${item.replace(/\s+/g,'')}.jpg`; setSelected({ name: item, src: selSrc }); }}
                  onMouseEnter={() => setFocusIndex(idx)}
                >
                  <HoverImage name={item} image={imageMap[item] ? `/images/${imageMap[item]}` : `/images/${item.replace(/\s+/g,'')}.jpg`} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
    {selected && <FavoriteModal item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
