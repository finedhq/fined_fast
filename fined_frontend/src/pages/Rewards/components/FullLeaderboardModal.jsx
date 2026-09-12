import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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

  // Compute highest score in list for progress bar normalization
  const highestScore = Math.max(
    100,
    ...leaderboard.map(e => e.fin_score ?? e.finScore ?? 0)
  );

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            🏆 Full Leaderboard Rankings
            <span className="modal-subtitle-tag">{timeframeLabel}</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Close modal">
            <FiX />
          </button>
        </div>

        <div className="modal-body" ref={modalBodyRef}>
          <div className="modal-search-wrapper">
            <FiSearch className="modal-search-icon" />
            <input
              type="text"
              className="modal-search-input-field"
              placeholder="Search learners by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              autoFocus
            />
          </div>

          <div className="leaderboard-rows-list">
            {paginatedList.length === 0 ? (
              <div className="modal-empty-state">
                <p>No learners found matching "{searchTerm}"</p>
              </div>
            ) : (
              paginatedList.map((entry, idx) => {
                const rank = entry.rank || (startIndex + idx + 1);
                const isUser = userEntry && (
                  (entry.email && entry.email === userEntry.email) || 
                  entry.isCurrentUser
                );
                const displayName = entry.name || entry.email?.split('@')[0] || `Learner #${rank}`;
                const finScore = entry.fin_score ?? entry.finScore ?? 0;
                const progressPercent = Math.min(100, Math.max(15, (finScore / highestScore) * 100));

                let rankBadge = <span className="rank-numeric-badge">{rank}</span>;
                if (rank === 1) rankBadge = <span role="img" aria-label="1st">🥇</span>;
                else if (rank === 2) rankBadge = <span role="img" aria-label="2nd">🥈</span>;
                else if (rank === 3) rankBadge = <span role="img" aria-label="3rd">🥉</span>;

                return (
                  <div 
                    key={entry.email || `${validCurrentPage}-${idx}`} 
                    className={`leader-row ${isUser ? 'user-highlight-row' : ''}`}
                  >
                    <div className="leader-rank-col">
                      {isUser ? (
                        <span className="user-rank-badge">#{rank}</span>
                      ) : (
                        rankBadge
                      )}
                    </div>

                    <div className="leader-user-col">
                      <div className={`leader-avatar ${isUser ? 'user-avatar-highlight' : ''}`}>
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="leader-name-group">
                        <span className="leader-name">{isUser ? 'You' : displayName}</span>
                      </div>
                    </div>

                    <div className="leader-progress-col">
                      <div className="leader-progress-bar-track">
                        <div 
                          className="leader-progress-bar-fill" 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="leader-points-col">
                      <span className="leader-score-val">{finScore}</span>
                      <span className="leader-score-pts">pts</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalItems > PAGE_SIZE && (
            <div className="modal-pagination-bar">
              <div className="modal-pagination-info">
                Showing {startIndex + 1}–{endIndex} of {totalItems} learners
              </div>

              <div className="modal-pagination-controls">
                <button 
                  className="modal-page-btn nav-btn"
                  disabled={validCurrentPage === 1}
                  onClick={() => handlePageChange(validCurrentPage - 1)}
                  type="button"
                  aria-label="Previous page"
                >
                  <FiChevronLeft /> Prev
                </button>

                {getPageNumbers().map((p, pIdx) => {
                  if (p === '...') {
                    return <span key={`ellipsis-${pIdx}`} className="modal-page-ellipsis">...</span>;
                  }
                  return (
                    <button
                      key={`page-${p}`}
                      className={`modal-page-btn ${p === validCurrentPage ? 'active' : ''}`}
                      onClick={() => handlePageChange(p)}
                      type="button"
                    >
                      {p}
                    </button>
                  );
                })}

                <button 
                  className="modal-page-btn nav-btn"
                  disabled={validCurrentPage === totalPages}
                  onClick={() => handlePageChange(validCurrentPage + 1)}
                  type="button"
                  aria-label="Next page"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullLeaderboardModal;
