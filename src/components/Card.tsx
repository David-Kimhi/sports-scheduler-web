import { type Entity } from "../interfaces/api.interface";
import { logos } from "../config";

export function Card({
  item,
  onSelect,
  isSelected = false,
}: {
  item: Entity;
  onSelect: (i: Entity) => void;
  isSelected: boolean;
}) {
  const id = String(item.id).toLowerCase();
  const logoKey = `../assets/logos/${item.type}/${id}.svg`;
  const pngKey = `../assets/logos/${item.type}/${id}.png`;
  const logoSrc: string | undefined = logos[logoKey] || logos[pngKey];
  const isCountry = item.type === "country";

  let cardClass =
    "p-4 rounded-xl shadow-md hover:shadow-lg cursor-pointer flex items-center gap-4 transition-transform hover:-translate-y-1 w-[220px]";
  if (isSelected) cardClass += " bg-blue-200 ";

  return (
    <div onClick={() => item.type !== "game" && onSelect(item)} className={cardClass}>
      {isCountry && logoSrc && (
        <div className="relative w-12 h-12 flex-shrink-0">
          <img
            src={logoSrc}
            alt={`${item.name} flag`}
            className="w-full h-full rounded-full object-cover border border-gray-200 shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
          />
          <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none" />
        </div>
      )}
      {!isCountry && logoSrc && (
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
          <img src={logoSrc} alt={`${item.name} logo`} className="max-w-full max-h-full object-contain" />
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <h4 className="text-lg font-bold text-gray-800 truncate whitespace-nowrap overflow-hidden">
          {item.name}
        </h4>
        <p className="text-sm text-gray-500 truncate whitespace-nowrap overflow-hidden">
          {item.description}
        </p>
      </div>
    </div>
  );
}
