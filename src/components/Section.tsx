import { useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { type Entity } from "../interfaces/api.interface";
import { Card } from "./Card";

export function Section({
  title,
  items,
  onSelect,
  selected = [],
  activeFilters = [], // <-- NEW
  onApplyFilters,
  onClearFilters,
  hasPendingFilters,
  hasActiveFilters,
}: {
  title: string;
  items: Entity[];
  onSelect: (i: Entity) => void;
  selected?: Entity[];        // pending filters
  activeFilters?: Entity[];   // applied filters
  onApplyFilters: () => void;
  onClearFilters: () => void;
  hasPendingFilters: boolean;
  hasActiveFilters: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = 300;
  const scrollLeft = () => containerRef.current?.scrollBy({ left: -scrollByAmount, behavior: "smooth" });
  const scrollRight = () => containerRef.current?.scrollBy({ left: scrollByAmount, behavior: "smooth" });

  const orderedItems = [...items].sort((a, b) => {
    const aPinned = selected.some((f) => f.id === a.id) || activeFilters.some((f) => f.id === a.id);
    const bPinned = selected.some((f) => f.id === b.id) || activeFilters.some((f) => f.id === b.id);
    if (aPinned === bPinned) return 0;
    return aPinned ? -1 : 1;  // pinned (pending or active) always first
  });

  return (
    <div className="mt-6 relative">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4 ml-6">
        <h3 className="ml-6 inline-flex items-center gap-1 text-gray-900 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
            {title} <FiChevronRight />
          </h3>
          {hasPendingFilters && (
            <button
              onClick={onApplyFilters}
              className="text-blue-600 text-sm hover:underline"
            >
              Apply Filters
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-blue-600 text-sm hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex gap-2 z-20">
          <button
            onClick={scrollLeft}
            className="bg-gray-50 shadow rounded-full p-2 hover:bg-gray-100"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={scrollRight}
            className="bg-gray-50 shadow rounded-full p-2 hover:bg-gray-100"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="py-2">
        <div
          ref={containerRef}
          className="flex gap-4 items-center overflow-x-auto no-scrollbar rounded-2xl pl-3 pr-12 flex-nowrap"
          style={{
            scrollBehavior: "smooth",
            overflowY: "visible",
            minHeight: "100px",
            maxHeight: "100px",
          }}
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
        <div className="pointer-events-none absolute top-0 right-0 h-full w-16 rounded-r-2xl bg-gradient-to-l from-white to-transparent z-10"></div>
      </div>
    </div>
  );
}

