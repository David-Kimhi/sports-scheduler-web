import tinycolor from "tinycolor2";

/**
 * Generate Tailwind-like color shades from a base color
 * @param baseColor - HEX or RGB string (e.g. "#3b82f6")
 * @returns Record of shades {50,100,...,900}
 */
function generateColorShades(baseColor: string) {
  const color = tinycolor(baseColor);
  const shades: Record<number, string> = {};

  const steps = {
    50:  0.95,
    100: 0.85,
    200: 0.75,
    300: 0.6,
    400: 0.4,
    500: 0,    // base
    600: -0.25,
    700: -0.45,
    800: -0.65,
    900: -0.75
  };

  for (const [shade, lightness] of Object.entries(steps)) {
    if (lightness >= 0) {
      // lighten
      shades[Number(shade)] = color.clone().lighten(lightness * 100).toHexString();
    } else {
      // darken
      shades[Number(shade)] = color.clone().darken(Math.abs(lightness) * 100).toHexString();
    }
  }

  return shades;
}

export function setThemeVariablesFromArray(colors: string[]) {
    const root = document.documentElement;
    const names = ["first", "second", "third", "fourth", "fifth"];
  
    colors.forEach((color, index) => {
      const name = names[index] ?? `color${index + 1}`;
      const shades = generateColorShades(color);
  
      for (const [shade, hex] of Object.entries(shades)) {
        root.style.setProperty(`--${name}-${shade}`, hex);
      }
    });
  }
