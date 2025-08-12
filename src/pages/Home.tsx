import SearchBar from "../components/SearchPage";

export default function Home() {
    return (
        <div className="flex flex-col items-center px-4 pt-24 sm:pt-50">
            <h1 className="text-4xl text-primary font-bold mb-6">Sports Scheduler</h1>
            <SearchBar />
        </div>
    );
  }
  