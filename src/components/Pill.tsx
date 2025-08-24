// ──────────────────────────────────────────────────────────────────────────────
// File: src/components/Pill.tsx
// 
// A designed pill component
// ──────────────────────────────────────────────────────────────────────────────
import { memo } from "react";
import { FiX } from "react-icons/fi";
import type { Entity } from "../interfaces/api.interface";

export const Pill = memo(function Pill({ item, onRemove }: { item: Entity; onRemove: (e: Entity) => void }) {
  return (
    <span className="flex items-center bg-selected-card text-accent-2 px-2 py-px rounded-full text-xs leading-tight mr-2">
      {item.name}
      <FiX className="ml-2 cursor-pointer" onClick={() => onRemove(item)} />
    </span>
  );
});