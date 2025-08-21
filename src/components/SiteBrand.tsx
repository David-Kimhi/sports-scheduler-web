// components/SiteBrand.tsx
import { Link } from "react-router-dom";

type Props = {
  title?: string;
  tagline?: string | null;
  logoSrc?: string;               // transparent PNG
  useGradientTitle?: boolean;     // toggle gradient text
};

export default function SiteBrand({
  title = "Sport Scheduler",
  tagline = "Search • Pick • Add to Calendar",
  logoSrc = "/logo.png",
  useGradientTitle = true,
}: Props) {
  return (
    <header className="relative z-50">

        {/* Glassy logo badge - top-left corner */}
        <div
        className="fixed top-4 left-4 z-50 rounded-2xl p-2 backdrop-blur "
        style={{
            // background: "color-mix(in srgb, var(--color-card) 70%, transparent)",
            // boxShadow: `0 2px 6px color-mix(in srgb, var(--shadow-secondary) 0%, transparent)`,
            // borderColor: "color-mix(in srgb, var(--border-primary) 18%, transparent)",
        }}
        >
        <img
            src={logoSrc}
            alt="Site logo"
            className="h-10 w-auto md:h-10 object-contain select-none"
            loading="eager"
            decoding="async"
        />
        </div>

        
      <div className="mx-auto w-11/12 sm:w-5/6 lg:w-2/3 py-4">
        <Link
          to="/"
          aria-label="Go to homepage"
          className="group mx-auto flex w-full max-w-[980px] flex-col items-center text-center"
        >
          {/* Soft glow */}
          <div className="pointer-events-none absolute inset-x-0 -top-6 flex justify-center">
            <div
              className="h-15 w-35 rounded-full blur-3xl opacity-35 transition-opacity duration-300 group-hover:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, var(--gradient-light), var(--gradient-mid), var(--gradient-dark))",
              }}
            />
          </div>

          {/* Title — gradient via your CSS vars, or solid via --text-primary */}
          <h1
            className={`mt-3 font-extrabold tracking-tight leading-tight text-center
                        text-[clamp(14px,6vw,45px)] ${useGradientTitle ? "bg-clip-text text-transparent" : ""}`}
            style={
              useGradientTitle
                ? {
                    backgroundImage:
                      "linear-gradient(90deg, var(--gradient-light), var(--gradient-mid), var(--gradient-dark))",
                  }
                : { color: "var(--text-primary)" }
            }
          >
            <span className="relative inline-block">
              {title}
              {/* Animated underline accent using your gradient vars */}
              <span
                className="absolute -bottom-1 left-1/2 h-[3px] w-0 -translate-x-1/2 rounded-full transition-all duration-500 group-hover:w-[70%]"
                style={{
                  background:
                    "linear-gradient(90deg, var(--gradient-light), var(--gradient-mid), var(--gradient-dark))",
                }}
              />
            </span>
          </h1>

          {/* Tagline (optional) */}
          {tagline && (
            <p
              className="mt-2 text-[clamp(12px,2.3vw,16px)] max-w-[60ch]"
              style={{ color: "color-mix(in srgb, var(--text-primary) 70%, transparent)" }}
            >
              {tagline}
            </p>
          )}
        </Link>
      </div>
    </header>
  );
}
