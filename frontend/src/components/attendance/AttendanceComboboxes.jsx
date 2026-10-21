import React, { useState, useEffect, useRef } from 'react';

// Helper to highlight matching substrings
const HighlightedText = ({ text = '', query = '' }) => {
  if (!query || !query.trim() || !text) {
    return <span>{text}</span>;
  }
  const q = query.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(q);

  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + q.length);
  const after = text.substring(index + q.length);

  return (
    <span>
      {before}
      <span style={{ background: '#FEF3C7', color: '#92400E', fontWeight: '700', borderRadius: '2px', padding: '0 1px' }}>
        {match}
      </span>
      {after}
    </span>
  );
};

/**
 * Searchable & Editable Employee Combobox for Attendance Table
 * - Row starts 100% empty
 * - Typing (e.g. 'p') immediately filters all employees matching 'p'
 * - ArrowUp/ArrowDown/Enter keyboard navigation
 * - Clear button
 */
export const EmployeeCombobox = ({
  value,
  employees = [],
  onChange,
  placeholder = "Type worker name (e.g. 'P', 'Jubair')...",
  openUpward = false,
  fallbackText = ''
}) => {
  const selectedEmp = employees.find(e => 
    (value && (String(e.dbId) === String(value) || String(e.id) === String(value) || String(e.empCode) === String(value))) ||
    (fallbackText && (e.name || e.fullName || '').trim().toLowerCase() === String(fallbackText).trim().toLowerCase())
  );

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(() => {
    return selectedEmp ? (selectedEmp.name || selectedEmp.fullName || '') : (fallbackText || '');
  });
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync query when external value, selectedEmp, or fallbackText changes
  useEffect(() => {
    if (selectedEmp) {
      setQuery(selectedEmp.name || selectedEmp.fullName || '');
    } else if (fallbackText) {
      setQuery(fallbackText);
    } else if (!value) {
      setQuery('');
    }
  }, [value, selectedEmp, fallbackText]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // If closed without selecting, revert to currently selected employee's name or fallback
        if (selectedEmp) {
          setQuery(selectedEmp.name || selectedEmp.fullName || '');
        } else if (fallbackText) {
          setQuery(fallbackText);
        } else if (!value) {
          setQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedEmp, fallbackText, value]);

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const name = (emp.name || emp.fullName || '').toLowerCase();
    const role = (emp.role || '').toLowerCase();
    const phone = (emp.phone || '').toLowerCase();
    return name.includes(q) || role.includes(q) || phone.includes(q);
  });

  // Keep highlighted index in bounds
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (emp) => {
    const empId = emp.dbId || emp.id;
    const rate = Number(emp.dailySalary || 0);
    setQuery(emp.name || emp.fullName || '');
    setIsOpen(false);
    onChange(empId, rate);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    setIsOpen(true);
    onChange('', 0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredEmployees.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredEmployees.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEmployees.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredEmployees.length) {
        handleSelect(filteredEmployees[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedEmp) {
        setQuery(selectedEmp.name || selectedEmp.fullName || '');
      } else {
        setQuery('');
      }
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 60 : 1 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#ffffff',
        border: isOpen ? '1.5px solid #4A2C17' : (value ? '1px solid #9CA3AF' : '1px solid #D1D5DB'),
        borderRadius: '6px',
        padding: '0 8px',
        boxShadow: isOpen ? '0 0 0 3px rgba(74, 44, 23, 0.12)' : 'none',
        transition: 'all 0.15s ease'
      }}>
        <i
          className="fa-solid fa-user"
          style={{
            color: selectedEmp ? '#4A2C17' : '#9CA3AF',
            fontSize: '11px',
            marginRight: '6px',
            flexShrink: 0
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={(e) => {
            setIsOpen(true);
            e.target.select();
          }}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setIsOpen(true);
            // If emptied out, clear selected employee
            if (!val.trim() && value) {
              onChange('', 0);
            }
          }}
          style={{
            width: '100%',
            padding: '7px 0',
            border: 'none',
            outline: 'none',
            fontSize: '12px',
            fontWeight: selectedEmp ? '600' : '400',
            color: '#111827',
            background: 'transparent'
          }}
        />

        {/* Clear Button */}
        {(value || query) ? (
          <button
            type="button"
            onClick={handleClear}
            title="Clear worker"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 4px',
              lineHeight: 1,
              flexShrink: 0
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#DC2626'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#9CA3AF'; }}
          >
            &times;
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsOpen(prev => !prev);
              inputRef.current?.focus();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '10px',
              padding: '2px',
              flexShrink: 0
            }}
          >
            <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
          </button>
        )}
      </div>

      {/* Floating Dropdown Filter Results */}
      {isOpen && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            ...(openUpward ? { bottom: '100%', marginBottom: '4px' } : { top: '100%', marginTop: '4px' }),
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: '8px',
            border: '1.5px solid #4A2C17',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22)',
            zIndex: 9999,
            maxHeight: '220px',
            overflowY: 'auto',
            textAlign: 'left'
          }}
        >
          {filteredEmployees.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280', fontSize: '11.5px' }}>
              No workers matching "<strong>{query}</strong>"
            </div>
          ) : (
            filteredEmployees.map((emp, i) => {
              const isSelected = String(emp.dbId || emp.id) === String(value);
              const isHighlighted = i === highlightedIndex;
              const empName = emp.name || emp.fullName || '';

              return (
                <div
                  key={emp.id || emp.dbId}
                  onClick={() => handleSelect(emp)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    background: isHighlighted
                      ? 'rgba(74, 44, 23, 0.08)'
                      : (isSelected ? 'rgba(74, 44, 23, 0.04)' : '#ffffff'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    transition: 'background 0.1s'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: isSelected ? '700' : '600',
                      color: isSelected ? '#4A2C17' : '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      <HighlightedText text={empName} query={query} />
                    </div>
                    {emp.role && (
                      <div style={{ fontSize: '10px', color: '#6B7280' }}>
                        <HighlightedText text={emp.role} query={query} />
                      </div>
                    )}
                  </div>
                  {emp.dailySalary && (
                    <span style={{
                      background: '#F0FDF4',
                      color: '#166534',
                      border: '1px solid #BBF7D0',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      ₹{emp.dailySalary}/d
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Searchable & Editable Site Combobox for Attendance Table
 * - Row starts 100% empty
 * - Typing (e.g. '204', 'Ceratec', 'p') immediately filters all sites matching query
 * - ArrowUp/ArrowDown/Enter keyboard navigation
 * - Clear button
 */
export const SiteCombobox = ({
  value,
  sites = [],
  onChange,
  placeholder = "Type site # or name (e.g. '204', 'Ceratec')...",
  openUpward = false,
  fallbackText = ''
}) => {
  const selectedSite = sites.find(s => 
    (value && (String(s.dbId) === String(value) || String(s.id) === String(value) || String(s.siteRef) === String(value) || String(s.siteCode) === String(value))) ||
    (fallbackText && (s.customerName || s.name || '').trim().toLowerCase() === String(fallbackText).trim().toLowerCase())
  );

  const formatSiteDisplay = (site) => {
    if (!site) return '';
    const refPrefix = site.siteRef ? `[${site.siteRef}] ` : '';
    const locSuffix = site.location ? ` (${site.location})` : '';
    return `${refPrefix}${site.customerName || site.name || ''}${locSuffix}`.trim();
  };

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(() => {
    return selectedSite ? formatSiteDisplay(selectedSite) : (fallbackText || '');
  });
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync display text when external value, selectedSite, or fallbackText changes
  useEffect(() => {
    if (selectedSite) {
      setQuery(formatSiteDisplay(selectedSite));
    } else if (fallbackText) {
      setQuery(fallbackText);
    } else if (!value) {
      setQuery('');
    }
  }, [value, selectedSite, fallbackText]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // Reset query back to selected name if closed without selecting
        if (selectedSite) {
          setQuery(formatSiteDisplay(selectedSite));
        } else if (fallbackText) {
          setQuery(fallbackText);
        } else if (!value) {
          setQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedSite, fallbackText, value]);

  // Filter sites by siteRef (e.g. '204'), name/customerName, or location
  const filteredSites = sites.filter(site => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const siteRef = String(site.siteRef || site.siteCode || site.id || '').toLowerCase();
    const name = (site.customerName || site.name || '').toLowerCase();
    const loc = (site.location || '').toLowerCase();
    const combined = `${siteRef} ${name} ${loc}`.toLowerCase();
    return combined.includes(q);
  });

  // Keep highlighted index in bounds
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (site) => {
    const siteId = site.dbId || site.id;
    setQuery(formatSiteDisplay(site));
    setIsOpen(false);
    onChange(siteId);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    setIsOpen(true);
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredSites.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredSites.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSites.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredSites.length) {
        handleSelect(filteredSites[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedSite) {
        setQuery(formatSiteDisplay(selectedSite));
      } else {
        setQuery('');
      }
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 60 : 1 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#ffffff',
        border: isOpen ? '1.5px solid #4A2C17' : (value ? '1px solid #9CA3AF' : '1px solid #D1D5DB'),
        borderRadius: '6px',
        padding: '0 8px',
        boxShadow: isOpen ? '0 0 0 3px rgba(74, 44, 23, 0.12)' : 'none',
        transition: 'all 0.15s ease'
      }}>
        <i
          className="fa-solid fa-location-dot"
          style={{
            color: selectedSite ? '#A56A30' : '#9CA3AF',
            fontSize: '11px',
            marginRight: '6px',
            flexShrink: 0
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={(e) => {
            setIsOpen(true);
            e.target.select();
          }}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setIsOpen(true);
            // If emptied out, clear selected site
            if (!val.trim() && value) {
              onChange('');
            }
          }}
          style={{
            width: '100%',
            padding: '7px 0',
            border: 'none',
            outline: 'none',
            fontSize: '12px',
            fontWeight: selectedSite ? '600' : '400',
            color: '#111827',
            background: 'transparent'
          }}
        />

        {/* Clear Button */}
        {(value || query) ? (
          <button
            type="button"
            onClick={handleClear}
            title="Clear site"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 4px',
              lineHeight: 1,
              flexShrink: 0
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#DC2626'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#9CA3AF'; }}
          >
            &times;
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsOpen(prev => !prev);
              inputRef.current?.focus();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '10px',
              padding: '2px',
              flexShrink: 0
            }}
          >
            <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
          </button>
        )}
      </div>

      {/* Floating Dropdown Filter Results */}
      {isOpen && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            ...(openUpward ? { bottom: '100%', marginBottom: '4px' } : { top: '100%', marginTop: '4px' }),
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: '8px',
            border: '1.5px solid #4A2C17',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22)',
            zIndex: 9999,
            maxHeight: '220px',
            overflowY: 'auto',
            textAlign: 'left'
          }}
        >
          {filteredSites.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280', fontSize: '11.5px' }}>
              No sites matching "<strong>{query}</strong>"
            </div>
          ) : (
            filteredSites.map((site, i) => {
              const isSelected = String(site.dbId || site.id) === String(value);
              const isHighlighted = i === highlightedIndex;
              const siteName = site.customerName || site.name || '';

              return (
                <div
                  key={site.id || site.dbId}
                  onClick={() => handleSelect(site)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    background: isHighlighted
                      ? 'rgba(74, 44, 23, 0.08)'
                      : (isSelected ? 'rgba(74, 44, 23, 0.04)' : '#ffffff'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    transition: 'background 0.1s'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: isSelected ? '700' : '600',
                      color: isSelected ? '#4A2C17' : '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      <HighlightedText text={siteName} query={query} />
                    </div>
                    {site.location && (
                      <div style={{ fontSize: '10px', color: '#6B7280' }}>
                        <HighlightedText text={site.location} query={query} />
                      </div>
                    )}
                  </div>
                  {site.siteRef && (
                    <span style={{
                      background: 'rgba(165, 106, 48, 0.1)',
                      color: 'var(--gold, #A56A30)',
                      border: '1px solid rgba(165, 106, 48, 0.25)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      [<HighlightedText text={String(site.siteRef)} query={query} />]
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Searchable & Editable Day Value Combobox
 * - Allows typing ANY custom decimal (e.g. 0.65, 1.35)
 * - Has preset dropdown in sequence: 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0
 * - Color-coded according to work unit (green for 1.0, yellow for <1.0, blue for >1.0)
 */
export const DayValueCombobox = ({
  value = '1.0',
  onChange,
  openUpward = false,
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(String(value ?? '1.0'));
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal input value with external value
  useEffect(() => {
    setInputValue(String(value ?? '1.0'));
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const numVal = parseFloat(inputValue);
  const isNormal = !isNaN(numVal) && numVal === 1.0;
  const isPartial = !isNaN(numVal) && numVal < 1.0 && numVal > 0;
  const isOvertime = !isNaN(numVal) && numVal > 1.0;

  // Colors based on Day Value
  let themeBg = '#F0FDF4';
  let themeBorder = '#86EFAC';
  let themeColor = '#166534';

  if (isPartial) {
    themeBg = '#FEFCE8';
    themeBorder = '#FDE047';
    themeColor = '#854D0E';
  } else if (isOvertime) {
    themeBg = '#EFF6FF';
    themeBorder = '#BFDBFE';
    themeColor = '#1E40AF';
  } else if (numVal === 0) {
    themeBg = '#F3F4F6';
    themeBorder = '#D1D5DB';
    themeColor = '#6B7280';
  }

  const presets = [
    { val: '0.25', label: '0.25 Day' },
    { val: '0.5', label: '0.5 Day' },
    { val: '0.75', label: '0.75 Day' },
    { val: '1.0', label: '1.0 Day' },
    { val: '1.25', label: '1.25 Day' },
    { val: '1.5', label: '1.5 Day' },
    { val: '1.75', label: '1.75 Day' },
    { val: '2.0', label: '2.0 Day' }
  ];

  const handleSelectPreset = (presetVal) => {
    setInputValue(presetVal);
    setIsOpen(false);
    onChange(presetVal);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    // Allow digits and at most one decimal point
    if (/^\d*\.?\d*$/.test(val)) {
      setInputValue(val);
      if (val !== '' && val !== '.') {
        onChange(val);
      }
    }
  };

  const handleBlur = () => {
    if (!inputValue || inputValue === '.' || isNaN(parseFloat(inputValue))) {
      setInputValue('1.0');
      onChange('1.0');
    } else {
      const parsed = parseFloat(inputValue);
      const formatted = String(parsed);
      setInputValue(formatted);
      onChange(formatted);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseFloat(inputValue) || 0;
      const next = (Math.round((current + 0.25) * 100) / 100).toString();
      setInputValue(next);
      onChange(next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseFloat(inputValue) || 0;
      const next = Math.max(0, Math.round((current - 0.25) * 100) / 100).toString();
      setInputValue(next);
      onChange(next);
    } else if (e.key === 'Enter') {
      inputRef.current?.blur();
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 60 : 1, ...style }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: themeBg,
          border: `1.5px solid ${isOpen ? '#4A2C17' : themeBorder}`,
          borderRadius: '6px',
          padding: '2px 8px',
          boxShadow: isOpen ? '0 0 0 2px rgba(74, 44, 23, 0.12)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.target.select()}
          placeholder="1.0"
          title="Type any custom day value (e.g. 0.65, 1.35) or pick from presets"
          style={{
            flex: 1,
            minWidth: '38px',
            padding: '5px 0',
            border: 'none',
            outline: 'none',
            fontSize: '12px',
            fontWeight: '700',
            color: themeColor,
            background: 'transparent'
          }}
        />

        <span
          onClick={() => {
            setIsOpen(prev => !prev);
            inputRef.current?.focus();
          }}
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: themeColor,
            opacity: 0.9,
            marginRight: '6px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          Day
        </span>

        <button
          type="button"
          onClick={() => {
            setIsOpen(prev => !prev);
            inputRef.current?.focus();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: themeColor,
            cursor: 'pointer',
            fontSize: '10px',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1
          }}
          title="Open presets"
        >
          <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
        </button>
      </div>

      {/* Preset Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(openUpward ? { bottom: '100%', marginBottom: '4px' } : { top: '100%', marginTop: '4px' }),
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: '8px',
            border: '1.5px solid #4A2C17',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.18)',
            zIndex: 9999,
            maxHeight: '220px',
            overflowY: 'auto',
            textAlign: 'left'
          }}
        >
          <div style={{ padding: '6px 8px', fontSize: '10px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
            Quick Presets (or type custom)
          </div>
          {presets.map(p => {
            const isSelected = String(value) === p.val;
            return (
              <div
                key={p.val}
                onClick={() => handleSelectPreset(p.val)}
                style={{
                  padding: '7px 10px',
                  fontSize: '12px',
                  fontWeight: isSelected ? '700' : '600',
                  color: isSelected ? '#4A2C17' : '#1F2937',
                  background: isSelected ? 'rgba(74, 44, 23, 0.08)' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #F9FAFB'
                }}
                onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = '#ffffff'; }}
              >
                <span>{p.label}</span>
                {isSelected && (
                  <i className="fa-solid fa-check" style={{ color: '#4A2C17', fontSize: '11px' }}></i>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
