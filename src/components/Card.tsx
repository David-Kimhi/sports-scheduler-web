import { useEffect, useRef, useState } from "react";
import { measureTextPx, getFontString, getLetterSpacing } from "../utils/textMeasure.utils";
import type { Entity } from "../interfaces/api.interface";
import { logos } from "../config";

interface CardProps {
  item: Entity;
  onSelect: (i: Entity) => void;
  isSelected?: boolean;
}

export function Card({ item, onSelect, isSelected = false }: CardProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  const id = String(item.id).toLowerCase();
  const logoKey = `../assets/logos/${item.type}/${id}.svg`;
  const pngKey = `../assets/logos/${item.type}/${id}.png`;
  const logoSrc: string | undefined = logos[logoKey] || logos[pngKey];

  // layout constants
  const baseWidth = 170;                 // fixed width when not hovering
  const logoPx = 32;                     // w-8 => ~32px 
  const gapPx = 18;                      // gap-3 => ~12px. If gap-4 => 16px

  const [hoverWidth, setHoverWidth] = useState(baseWidth);

  // Recompute when fonts load or on resize
  useEffect(() => {
    const compute = () => {
      const titleEl = titleRef.current;
      const descEl = descRef.current;
      if (!titleEl || !descEl) return;

      const titleFont = getFontString(titleEl);
      const descFont  = getFontString(descEl);
      const titleLS   = getLetterSpacing(titleEl);
      const descLS    = getLetterSpacing(descEl);

      const titleW = measureTextPx(item.name ?? "", titleFont, titleLS);
      const descW  = measureTextPx(item.description ?? "", descFont, descLS);

      const padX = 24; // p-3 => 12 left + 12 right
      const w1 = Math.ceil(padX + logoPx + gapPx + titleW);
      const w2 = Math.ceil(padX + logoPx + gapPx + descW);
      const w3 = baseWidth;
      setHoverWidth(Math.max(w1, w2, w3));
    };

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) {
      fonts.ready.then(compute);
    } else {
      compute();
    }


    // Recompute on window resize
    const ro = new ResizeObserver(compute);
    if (titleRef.current) ro.observe(titleRef.current);
    if (descRef.current)  ro.observe(descRef.current);

    const onResize = () => compute();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [item.name, item.description]);

  const cardBase =
    "p-2 rounded-xl shadow-md hover:shadow-lg cursor-pointer flex gap-3 transition-all duration-300 hover:-translate-y-1 flex-none shrink-0";
  const bg = isSelected ? " bg-selected-card " : " bg-white ";

  return (
    <div
      onClick={() => item.type !== "game" && onSelect(item)}
      className={`group ${cardBase}${bg} flex-none shrink-0 h-8 items-center`}
      style={{ width: baseWidth }}
      onMouseEnter={(e) => { e.currentTarget.style.width = `${hoverWidth}px`; e.currentTarget.style.height = `50px`}}
      onMouseLeave={(e) => { e.currentTarget.style.width = `${baseWidth}px`; e.currentTarget.style.height = `32px`}}
    >
      {/* Logo */}
      <div style={{ width: logoPx, height: logoPx }} className="flex items-center justify-center">
        <div className="relative w-5 h-5 flex-shrink-0">
          <img
            src={logoSrc}
            alt={`${item.name} flag`}
            className="w-full h-full rounded-full object-cover border border-gray-200 shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
          />
          <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none" />
        </div>
      </div>

      {/* Text column */}
      <div className="flex flex-col flex-1 justify-center overflow-hidden min-w-0">
        <h5
          ref={titleRef}
          className="
            text-sm font-bold text-gray-800 text-center
            transition-transform duration-300 group-hover:-translate-y-1
            whitespace-nowrap overflow-hidden text-ellipsis
            group-hover:overflow-visible group-hover:text-clip
          "
        >
          {item.name}
        </h5>

        <p
          ref={descRef}
          className="
            text-xs text-gray-700 text-center
            opacity-0 max-h-0 overflow-hidden whitespace-nowrap
            transition-[max-height,opacity] duration-300 ease-in-out
            group-hover:opacity-100 group-hover:max-h-5
          "
        >
          {item.description}
        </p>
      </div>


    </div>
  );
}
