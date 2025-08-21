// AppHeader.tsx
import SiteBrand from "./SiteBrand";

export default function AppHeader() {
  return (
    <div className="w-full sticky top-0 z-50 backdrop-blur bg-primary/80 border-b"
         style={{ borderColor: "color-mix(in srgb, var(--text-primary) 12%)" }}>
      <SiteBrand
        title="Sport Scheduler"
        tagline="Find fixtures fast • Export with one click"
        logoSrc="/logo.png"
        useGradientTitle={true}   // set false for solid color
      />
    </div>
  );
}
