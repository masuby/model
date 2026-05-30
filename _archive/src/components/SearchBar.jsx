import React from "react";

function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search in this sheet..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          borderColor: 'var(--primary-color, #dcdfe6)'
        }}
      />
    </div>
  );
}

export default SearchBar;