// textMeasure.ts
export function measureTextPx(text: string, font: string, letterSpacing = 0) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    ctx.font = font; // e.g. "600 16px Inter"
    const base = ctx.measureText(text).width;
    // Tailwind letter-spacing isn't included in canvas metrics — add it manually
    return base + Math.max(0, text.length - 1) * letterSpacing;
  }
  
  // Build a CSS font string from an element’s computed styles
  export function getFontString(el: HTMLElement) {
    const cs = getComputedStyle(el);
    // style order matters: weight, size/line-height, family
    return `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  }
  
  export function getLetterSpacing(el: HTMLElement) {
    const ls = parseFloat(getComputedStyle(el).letterSpacing || "0");
    return isNaN(ls) ? 0 : ls;
  }
  