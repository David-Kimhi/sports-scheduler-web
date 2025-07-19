import SearchBar from "../components/SearchBar";

export default function Home() {
    return (
        <div className="flex flex-col items-center px-4 pt-24 sm:pt-32">
            <h1 className="text-4xl font-bold mb-6">Sports Scheduler</h1>
            <SearchBar />
        </div>
    );
  }
  