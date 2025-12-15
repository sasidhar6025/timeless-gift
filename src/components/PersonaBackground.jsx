import { useEffect, useRef } from "react";

// patterns were removed; keeping persona pattern code minimal
const SKETCH_KEY = "timeless.persona.sketch";

export default function PersonaBackground({ src = "/images/luna.JPG", position = "right" }) {
  // portrait always visible; toggle removed per user request

  // previously supported patterns (dots/waves/floral) were removed

  // sketch/floral overlays removed per user's request

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.loading = "lazy";
  }, [src]);

  const layerRef = useRef(null);
  // gentle parallax: adjust a CSS var based on scroll to create depth
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!layerRef.current) return;
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        try {
          const y = window.scrollY || window.pageYOffset || 0;
          // small translate, clamped for safety
          const val = Math.max(-40, Math.min(40, Math.round(y * 0.02)));
          layerRef.current.style.setProperty('--persona-translate', `${val}px`);
        } catch {
          /* ignore */
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // initial
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // sanitize position and compute helper class to let CSS handle background-position
  const pos = ["left", "center", "right"].includes(position) ? position : "right";
  const alignClass = `persona-align-${pos}`;
  // compute image placement using the position prop (kept for the <img> fallback)
  const imgStyle = pos === "left" ? { left: "-10%", right: "auto" } : { right: "-10%", left: "auto" };

  return (
    <>
      <div className={`persona-layer ${alignClass}`} aria-hidden="true" ref={layerRef}>
        {/* warm overlay, vignette, and subtle grain for texture */}
  <div className="persona-overlay" aria-hidden="true" />
  <div className="persona-pattern" aria-hidden="true" />
        <div className="persona-vignette" aria-hidden="true" />
        {/* sketch/floral overlays removed */}
        <div className="persona-grain" aria-hidden="true" />
        <img className="persona" src={src} alt="" role="presentation" loading="lazy" style={imgStyle} />

        {/* right-side thumbnail grid (decorative) */}
        <div className="persona-grid" aria-hidden="true">
          <img src="/images/luna_images/2074F5D9-1122-4BDB-8ADD-F93D43DF76D5.JPG" alt="" />
          <img src="/images/luna_images/9AEB6679-9306-4799-9127-67A4C6C6B8DA.JPG" alt="" />
          <img src="/images/luna_images/B36F0E5A-F68F-4F95-B2E9-B62EDC2A29B5.JPG" alt="" />
          <img src="/images/luna_images/CDBA66D9-9C6A-4CC8-BB23-A8BC58F7B283.JPG" alt="" />
          <img src="/images/luna_images/DA624DC1-275E-41F6-A39C-F74CE75AF4D3.JPG" alt="" />
          <img src="/images/luna_images/E686AAB1-875B-4C68-B43C-F3AA76CE560D.JPG" alt="" />
          <img src="/images/luna_images/F1D58948-7D54-4031-8643-B76A7B810CCB.JPG" alt="" />
          <img src="/images/luna.JPG" alt="" />
        </div>
      </div>

      {/* portrait controls removed */}
    </>
  );
}
