import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './EventsFilterBar.css';

export default function EventsFilterBar({
  statusFilter,
  onStatusChange,
  availableYears = [],
  selectedYear,
  onYearChange,
  resultCount = 0,
  onResetFilters,
}) {
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown on pointerdown outside or Escape
  useEffect(() => {
    const handlePointerDownOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsYearDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isYearDropdownOpen) {
        setIsYearDropdownOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isYearDropdownOpen]);

  const yearOptions = [
    { value: 'all', label: 'All years' },
    ...availableYears.map((yr) => ({ value: String(yr), label: String(yr) })),
  ];

  const currentYearLabel =
    selectedYear === 'all'
      ? 'All years'
      : yearOptions.find((o) => o.value === String(selectedYear))?.label || String(selectedYear);

  const handleSelectYear = (val) => {
    onYearChange(val);
    setIsYearDropdownOpen(false);
    buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsYearDropdownOpen((prev) => !prev);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsYearDropdownOpen(true);
      setTimeout(() => {
        const firstOption = dropdownRef.current?.querySelector('[role="option"]');
        firstOption?.focus();
      }, 0);
    }
  };

  const handleListboxKeyDown = (e, index) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % yearOptions.length;
      const nextEl = dropdownRef.current?.querySelectorAll('[role="option"]')[nextIndex];
      nextEl?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + yearOptions.length) % yearOptions.length;
      const prevEl = dropdownRef.current?.querySelectorAll('[role="option"]')[prevIndex];
      prevEl?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectYear(yearOptions[index].value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsYearDropdownOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className="events-filter-bar-wrapper" id="events-filter-bar" data-testid="events-filter">
      {/* Visually hidden aria-live polite region that announces result count */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {resultCount === 1 ? '1 event shown' : `${resultCount} events shown`}
      </div>

      <div className="events-filter-pill">
        {/* Status segmented control */}
        <div
          className="filter-status-seg"
          role="radiogroup"
          aria-label="Filter events by status"
        >
          <button
            type="button"
            role="radio"
            aria-checked={statusFilter === 'all'}
            className={`filter-seg-option ${statusFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => onStatusChange('all')}
          >
            All
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={statusFilter === 'upcoming'}
            className={`filter-seg-option ${statusFilter === 'upcoming' ? 'is-active' : ''}`}
            onClick={() => onStatusChange('upcoming')}
          >
            Upcoming
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={statusFilter === 'past'}
            className={`filter-seg-option ${statusFilter === 'past' ? 'is-active' : ''}`}
            onClick={() => onStatusChange('past')}
          >
            Past
          </button>
        </div>

        {/* Hairline divider */}
        <div className="filter-pill-divider" aria-hidden="true" />

        {/* Year Dropdown listbox */}
        <div className="filter-year-dropdown-wrap" ref={dropdownRef}>
          <button
            ref={buttonRef}
            type="button"
            className="filter-year-dropdown-btn"
            aria-haspopup="listbox"
            aria-expanded={isYearDropdownOpen}
            aria-label={`Select year filter, current selection ${currentYearLabel}`}
            onClick={() => setIsYearDropdownOpen((prev) => !prev)}
            onKeyDown={handleButtonKeyDown}
          >
            <span>{currentYearLabel}</span>
            <ChevronDown
              size={13}
              className={`dropdown-chevron ${isYearDropdownOpen ? 'is-open' : ''}`}
            />
          </button>

          {isYearDropdownOpen && (
            <ul
              className="filter-year-listbox"
              role="listbox"
              aria-label="Filter by year"
              tabIndex={-1}
            >
              {yearOptions.map((opt, i) => {
                const isSelected = selectedYear === opt.value;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    className={`filter-year-option ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectYear(opt.value)}
                    onKeyDown={(e) => handleListboxKeyDown(e, i)}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={12} className="option-check-icon" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
