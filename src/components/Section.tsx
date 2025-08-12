import { useRef } from "react";
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
  const scrollByAmount = 300;

  // hide section if has no cards
  if (!items || items.length === 0) return null;


  const scrollLeft = () =>
    containerRef.current?.scrollBy({ left: -scrollByAmount, behavior: "smooth" });
  const scrollRight = () =>
    containerRef.current?.scrollBy({ left: scrollByAmount, behavior: "smooth" });

  const orderedItems = [...items].sort((a, b) => {
    const aPinned =
      selected.some((f) => f.id === a.id) || activeFilters.some((f) => f.id === a.id);
    const bPinned =
      selected.some((f) => f.id === b.id) || activeFilters.some((f) => f.id === b.id);
    if (aPinned === bPinned) return 0;
    return aPinned ? -1 : 1;
  });

  return (
    <div className="mt-3 relative">
      <div className="flex justify-between items-center">
        <h3 className="ml-6 inline-flex items-center gap-1 text-gray-900 bg-accent px-3 py-1 rounded-full text-sm font-medium shadow-md shadow-accent">
          {title} <FiChevronRight />
        </h3>
        <div className="flex gap-2 z-20">
          <button
            onClick={scrollLeft}
            className="bg-accent shadow shadow-accent rounded-full p-2 hover:bg-gray-100"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={scrollRight}
            className="bg-accent shadow shadow-accent rounded-full p-2 hover:bg-gray-100"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="py-2 overflow-visible">
        <div
          ref={containerRef}
          className="flex gap-4 items-center overflow-x-auto no-scrollbar rounded-2xl pl-3 pr-12 flex-nowrap min-h-[100px]"
        >
          {orderedItems.map((item) => (
            <Card
              key={`${item.type}-${item.id}`}
              item={item}
              onSelect={onSelect}
              isSelected={
                selected.some((f) => f.id === item.id) ||
                activeFilters.some((f) => f.id === item.id)
              }
            />
          ))}
        </div>
        <div className="pointer-events-none absolute top-0 right-0 h-full w-16 rounded-r-2xl z-10"
            style={{
              background: `linear-gradient(to left, var(--color-primary, #F2F4CB) 0%, transparent 100%)`
            }}>
        </div>
      </div>
    </div>
  );
}
