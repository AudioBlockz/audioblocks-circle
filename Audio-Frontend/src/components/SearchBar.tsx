import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/search?query=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form
      className="flex items-center bg-[#1D1F1F] rounded-full px-3 py-2"
      onSubmit={handleSearch}
    >
      <Search className="text-gray-500 mr-2" size={16} />
      <input
        type="text"
        placeholder="Search by artists, songs, or albums"
        className="w-full rounded-full px-3 border-none focus:outline-none bg-[#1D1F1F] text-white placeholder-gray-400"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
};

export default SearchBar;
