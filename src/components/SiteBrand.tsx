import { Link } from "react-router-dom";

type Props = {
  title?: string;
  tagline?: string | null;
  logoSrc?: string;
  useGradientTitle?: boolean;
};

export default function SiteBrand({
  title = "Sport Scheduler",
  tagline = "Search • Pick • Add to Calendar",
  logoSrc = "/logo.png",
  useGradientTitle = true,
}: Props) {
  return (
    <header className="relative py-4">
      <div className="mx-auto w-11/12 sm:w-5/6 lg:w-2/3">
        <Link
          to="/"
          aria-label="Go to homepage"
          className="group mx-auto flex w-full max-w-[980px] flex-col items-center text-center"
        >
          {/* Title row with logo */}
          <div className="flex items-center justify-center gap-3">
            <img
              src={logoSrc}
              alt="Site logo"
              className="h-[clamp(14px,6vw,45px)] w-auto object-contain select-none"
              loading="eager"
              decoding="async"
            />
            <h1
              className={`font-extrabold tracking-tight leading-tight 
                          text-[clamp(14px,6vw,45px)] ${
                            useGradientTitle ? "bg-clip-text text-transparent" : ""
                          }`}
              style={
                useGradientTitle
                  ? {
                      backgroundImage:
                        "linear-gradient(90deg, var(--gradient-light), var(--gradient-mid), var(--gradient-dark))",
                    }
                  : { color: "var(--text-primary)" }
              }
            >
              {title}
            </h1>
          </div>

          {tagline && (
            <p
              className="mt-2 text-[clamp(12px,2.3vw,16px)] max-w-[60ch] mb-6"
              style={{
                color: "color-mix(in srgb, var(--text-primary) 70%, transparent)",
              }}
            >
              {tagline}
            </p>
          )}
        </Link>
      </div>
    </header>
  );
}
