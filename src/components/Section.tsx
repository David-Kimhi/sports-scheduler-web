import { useRef, useState, useLayoutEffect, useCallback} from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { type Entity } from "../interfaces/api.interface";
import { Card } from "./Card";

export function Section({
  title,
  items,
  onSelect,
  selected = [],
  activeFilters = [],
}: {
  title: string;
  items: Entity[];
  onSelect: (i: Entity) => void;
  selected?: Entity[];
  activeFilters?: Entity[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const scrollByAmount = 300;
  const EPS = 4; // tolerance for sub-pixel rounding

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanScroll(max > EPS);
    setAtStart(el.scrollLeft <= EPS);
    setAtEnd(max - el.scrollLeft <= EPS);
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;
    const onResize = () => measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", onResize);
    };
  }, [measure]);

  // Re-measure when item count/layout changes
  useLayoutEffect(() => {
    // next tick to let DOM paint
    requestAnimationFrame(measure);
  }, [items.length, measure]);

  const scrollLeft = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: -scrollByAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: scrollByAmount, behavior: "smooth" });
  };

  // hide section if empty
  if (!items || items.length === 0) return null;

  const orderedItems = [...items].sort((a, b) => {
    const aPinned = selected.some(f => f.id === a.id) || activeFilters.some(f => f.id === a.id);
    const bPinned = selected.some(f => f.id === b.id) || activeFilters.some(f => f.id === b.id);
    return aPinned === bPinned ? 0 : aPinned ? -1 : 1;
  });

  return (
    <div className="pr- pl-2 relative">

      <div className="py-2 overflow-visible z-5">
        <div className="flex justify-between items-center">
          <h3 className="ml-6 inline-flex items-center text-gray-900 text-sm font-medium">
            {title} <FiChevronRight />
          </h3>

          {/* Chevrons (horizontal scroll) */}
          {canScroll && (
            <div className="hidden md:grid w-16 grid-cols-2 gap-2 z-20"> {/* 2×(w-7) + gap-2 = 64px */}
              {/* Left */}
              <button
                onClick={scrollLeft}
                disabled={atStart}
                className={[
                  "bg-accent shadow shadow-accent rounded-full p-1 transition-all duration-300",
                  "h-7 w-7 flex items-center justify-center",
                  atStart ? "opacity-40 cursor-not-allowed hidden" : "hover:bg-gray-100",            // hide when disabled
                  atEnd && !atStart ? "col-span-2 w-full" : ""                      // expand if right is disabled
                ].join(" ")}
                title={atStart ? "At start" : "Scroll left"}
                aria-disabled={atStart}
              >
                <FiChevronLeft size={13} />
              </button>
              {/* Right */}
              <button
                onClick={scrollRight}
                disabled={atEnd}
                className={[
                  "bg-accent shadow shadow-accent rounded-full p-1 transition-all duration-300",
                  "h-7 w-7 flex items-center justify-center",
                  atEnd ? "opacity-40 cursor-not-allowed hidden" : "hover:bg-gray-100",
                  atStart && !atEnd ? "col-span-2 w-full" : ""                      // expand if left is disabled
                ].join(" ")}
                title={atEnd ? "At end" : "Scroll right"}
                aria-disabled={atEnd}
              >
                <FiChevronRight size={13} />
              </button>
            </div>
          )}

        </div>
        <div
          ref={containerRef}
          onScroll={measure} // extra safety 
          className="flex gap-3 items-center overflow-x-auto no-scrollbar rounded-2xl pl-3 pr-12 flex-nowrap min-h-[50px] sm:min-h-[60px] z-30"
        >
          {orderedItems.map(item => (
            <Card
              key={`${item.type}-${item.id}`}
              item={item}
              onSelect={onSelect}
              isSelected={selected.some(f => f.id === item.id) || activeFilters.some(f => f.id === item.id)}
            />
          ))}
        </div>

        {/* Right fade overlay remains fine (pointer-events-none to not block scroll) */}
        <div
          className="pointer-events-none absolute top-0 right-0 h-full w-16 rounded-r-2xl z-10"
          style={{ background: "linear-gradient(to left, var(--color-primary, #F2F4CB) 0%, transparent 100%)" }}
        />
      </div>
    </div>
  );
}