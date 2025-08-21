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
    <div className="pr-8 pl-8 relative">
      <div className="flex justify-between items-center">
        <h3 className="ml-6 inline-flex items-center text-gray-900 text-sm font-medium">
          {title} <FiChevronRight />
        </h3>

        {/* Chevrons (horizontal scroll) */}
        {canScroll && (
          <div className="flex gap-2 z-20">
            <button
              onClick={scrollLeft}
              disabled={atStart}
              className={`bg-accent shadow shadow-accent rounded-full p-1
                ${atStart ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"}`}
              title={atStart ? "At start" : "Scroll left"}
            >
              <FiChevronLeft size={13} />
            </button>
            <button
              onClick={scrollRight}
              disabled={atEnd}
              className={`bg-accent shadow shadow-accent rounded-full p-1
                ${atEnd ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"}`}
              title={atEnd ? "At end" : "Scroll right"}
            >
              <FiChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="py-2 overflow-visible">
        <div
          ref={containerRef}
          onScroll={measure} // extra safety 
          className="flex gap-3 items-center overflow-x-auto no-scrollbar rounded-2xl pl-3 pr-12 flex-nowrap min-h-[60px]"
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