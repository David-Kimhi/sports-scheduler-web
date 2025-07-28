import { useState } from "react";
import { GameCard } from "./GameCard";
import { type Entity } from "../interfaces/api.interface";

export function GameSection({ items }: { items: Entity[] }) {
    const [selectedGames, setSelectedGames] = useState<Set<string | number>>(new Set());
  
    const toggleGame = (id: string | number) => {
      setSelectedGames((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        return next;
      });
    };
  
    const selectAll = () => {
        if (selectedGames.size === items.length) {
          setSelectedGames(new Set()); // Unselect all
        } else {
          setSelectedGames(new Set(items.map((g) => g.id)));
        }
    };
  
    return (
      <div className="mt-8 w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">Events</h3>
          <button
            onClick={selectAll}
            className="text-blue-600 underline hover:text-blue-800 text-sm"
          >
            {selectedGames.size === items.length ? "Unselect All" : "Select All"}
          </button>
        </div>
  
        {/* Grid of games (2 columns on desktop) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {items.map((game) => (
            <div key={`game-${game.id}`} className="flex items-center gap-4">
              {/* Checkbox on the left */}
              <input
                type="checkbox"
                className="w-5 h-5 cursor-pointer accent-blue-500"
                checked={selectedGames.has(game.id)}
                onChange={() => toggleGame(game.id)}
              />
  
              {/* Game details (no outer shadow, GameCard handles its own look) */}
              <GameCard
                homeTeam={{
                  name: game.homeTeamName ?? "Unknown",
                  logoId: String(game.homeTeamId ?? "0"),
                }}
                awayTeam={{
                  name: game.awayTeamName ?? "Unknown",
                  logoId: String(game.awayTeamId ?? "0"),
                }}
                dateUTC={game.date ?? new Date().toISOString()}
              />
            </div>
          ))}
        </div>
  
        {/* Bulk Add button */}
        {selectedGames.size > 0 && (
          <div className="mt-6 flex justify-end">
            <button className="px-5 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
              Add {selectedGames.size} Selected Games
            </button>
          </div>
        )}
      </div>
    );
  }
  