import React from 'react';

export default function ChildSearchFilter({
  searchQuery,
  onSearchChange,
  childrenCount,
  isSearching,
  searchRef,
  onClearSearch,
}) {
  return (
    <div className="search-filter-card glass-panel">
      <div className="search-top-bar">
        <div className="search-input-wrapper">
          <span className="search-input-icon">🔍</span>
          <input
            ref={searchRef}
            type="text"
            className="search-input-field"
            placeholder="Search any child by name or class (e.g. Adam, Butterfly Group)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search children by name or class"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={onClearSearch}
              title="Clear search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="search-results-counter">
          {isSearching ? (
            <>
              Found <strong>{childrenCount}</strong> matching child{childrenCount === 1 ? '' : 'ren'}
            </>
          ) : (
            <>
              Showing <strong>{childrenCount}</strong> children needing action
            </>
          )}
        </div>
      </div>
    </div>
  );
}
