import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ name: string }[]>([]);


  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
  
    fetch(`http://localhost:3000/api/football/search?query=${query}`)
      .then(res => res.json())
      .then(data => {
        const mergedResults = [
          ...data.fixtures,
          ...data.countries,
          ...data.leagues
        ];
        setResults(mergedResults);
      })
      .catch(err => console.error('Error:', err));
  }, [query]);
  

  return (
    <div className="relative w-11/12 sm:w-2/3 max-w-3xl">
      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl" />

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search leagues, players, games..."
        className="w-full py-3 pl-12 pr-4 rounded-full border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl"
      />
      {results.length > 0 && (
        <ul className="absolute top-full mt-2 w-full bg-white shadow-lg rounded-md">
          
          {results.map((item, i) => (
            <li key={i} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
