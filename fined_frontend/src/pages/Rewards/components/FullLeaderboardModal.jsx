import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PiCaretLeftBold, PiCaretRightBold, PiMagnifyingGlassBold, PiXBold } from 'react-icons/pi';

const PAGE_SIZE = 15;

const FullLeaderboardModal = ({ 
  isOpen, 
  onClose, 
  leaderboard = [], 
  userEntry = null,
  timeframe = 'all_time'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const modalBodyRef = useRef(null);

  // Reset search and page when opening
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setCurrentPage(1);
    }
  }, [isOpen, timeframe]);

  // Reset page to 1 when search term changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (!isOpen) return null;

  const filteredList = leaderboard.filter((entry) => {
    const name = entry.name || entry.email?.split('@')[0] || '';
    const email = entry.email || '';
    const query = searchTerm.toLowerCase();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  const totalItems = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const paginatedList = filteredList.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Generate pagination buttons with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (validCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (validCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages];
  };

  const timeframeLabel = {
    this_week: 'This Week',
    this_month: 'This Month',
    all_time: 'All Time'
  }[timeframe] || 'Leaderboard';

  // Portal to <body> so the overlay covers the page and the fixed navbar
  return createPortal(
    <div className="rw-modal-overlay" onClick={onClose}>
      <div className="rw-modal" role="dialog" aria-modal="true" aria-labelledby="rw-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="rw-modal-head">
          <h3 id="rw-modal-title">
            Full Leaderboard Rankings
            <span className="rw-modal-tag">{timeframeLabel}</span>
          </h3>
          <button className="rw-modal-close" onClick={onClose} type="button" aria-label="Close modal">
            <PiXBold aria-hidden="true" />
          </button>
        </div>

        <div className="rw-modal-body" ref={modalBodyRef}>
          <label className="rw-search">
            <PiMagnifyingGlassBold aria-hidden="true" />
            <span className="rw-sr-only">Search learners</span>
            <input
              type="text"
              placeholder="Search learners by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              autoFocus
            />
          </label>

          {paginatedList.length === 0 ? (
            <p className="rw-modal-empty">No learners found matching "{searchTerm}"</p>
          ) : (
            <ol className="rw-rows">
              {paginatedList.map((entry, idx) => {
                const rank = entry.rank || (startIndex + idx + 1);
                const isUser = userEntry && (
                  (entry.email && entry.email === userEntry.email) ||
                  entry.isCurrentUser
                );
                const displayName = entry.name || entry.email?.split('@')[0] || `Learner #${rank}`;
                const finScore = entry.fin_score ?? entry.finScore ?? 0;

                return (
                  <li
                    key={entry.email || `${validCurrentPage}-${idx}`}
                    className={`rw-row${isUser ? ' rw-row--you' : ''}${rank <= 3 ? ` rw-row--top rw-row--top${rank}` : ''}`}
                  >
                    <span className="rw-row-rank">{isUser ? `#${rank}` : rank}</span>
                    <span className="rw-row-avatar" aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
                    <span className="rw-row-name">{isUser ? 'You' : displayName}</span>
                    <span className="rw-row-score">{finScore} <small>pts</small></span>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Pagination Controls */}
          {totalItems > PAGE_SIZE && (
            <div className="rw-pages">
              <span className="rw-pages-info">
                Showing {startIndex + 1}-{endIndex} of {totalItems} learners
              </span>
              <div className="rw-pages-controls">
                <button
                  className="rw-pg"
                  disabled={validCurrentPage === 1}
                  onClick={() => handlePageChange(validCurrentPage - 1)}
                  type="button"
                  aria-label="Previous page"
                >
                  <PiCaretLeftBold aria-hidden="true" />
                </button>
                {getPageNumbers().map((p, pIdx) => (
                  p === '...'
                    ? <span key={`ellipsis-${pIdx}`} className="rw-pg-gap">...</span>
                    : (
                      <button
                        key={`page-${p}`}
                        className={`rw-pg${p === validCurrentPage ? ' is-active' : ''}`}
                        onClick={() => handlePageChange(p)}
                        type="button"
                        aria-current={p === validCurrentPage ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    )
                ))}
                <button
                  className="rw-pg"
                  disabled={validCurrentPage === totalPages}
                  onClick={() => handlePageChange(validCurrentPage + 1)}
                  type="button"
                  aria-label="Next page"
                >
                  <PiCaretRightBold aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FullLeaderboardModal;
