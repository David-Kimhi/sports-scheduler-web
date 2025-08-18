// Import all logos (SVG + PNG) relative to this file
export const logos: Record<string, string> = import.meta.glob(
    "../assets/logos/**/*.{svg,png}",
    { eager: true, import: "default" }
  );


export const BACKEND_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';