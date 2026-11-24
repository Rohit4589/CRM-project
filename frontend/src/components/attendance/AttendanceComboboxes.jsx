import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Global event to ensure only ONE combobox dropdown is open at a time
const notifyComboboxOpened = (id) => {
  if (typeof window !== 'undefined' && id) {
    window.dispatchEvent(new CustomEvent('combobox-opened', { detail: { id } }));
  }
};

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
  fallbackText = '',
  rowIndex,
  colIndex = 0,
  onNavigate,
  onEnterNext,
  id
}) => {
  const selectedEmp = employees.find(e => {
    if (!value && !fallbackText) return false;
    if (value !== undefined && value !== null && value !== '') {
      const valStr = String(value).trim();
      if (e.dbId !== undefined && e.dbId !== null && String(e.dbId) === valStr) return true;
      if (e.id !== undefined && e.id !== null && String(e.id) === valStr) return true;
      if (e.empCode && String(e.empCode).toLowerCase() === valStr.toLowerCase()) return true;
      if (e.code && String(e.code).toLowerCase() === valStr.toLowerCase()) return true;
      const valNum = parseInt(valStr, 10);
      if (!isNaN(valNum)) {
        if (e.dbId && Number(e.dbId) === valNum) return true;
        const eNum = parseInt(String(e.id || e.empCode || '').replace(/\D/g, ''), 10);
        if (!isNaN(eNum) && eNum === valNum) return true;
      }
    }
    if (fallbackText) {
      const fb = String(fallbackText).trim().toLowerCase();
      const eName = (e.name || e.fullName || '').trim().toLowerCase();
      if (eName === fb) return true;
    }
    return false;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);

  const openDropdown = () => {
    setIsOpen(true);
    notifyComboboxOpened(id);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setMenuStyle(null);
  };

  // Close this dropdown immediately if another combobox opens anywhere
  useEffect(() => {
    const handleOtherOpen = (e) => {
      if (e.detail?.id && e.detail.id !== id) {
        closeDropdown();
      }
    };
    window.addEventListener('combobox-opened', handleOtherOpen);
    return () => window.removeEventListener('combobox-opened', handleOtherOpen);
  }, [id]);
  const [query, setQuery] = useState(() => {
    return selectedEmp ? (selectedEmp.name || selectedEmp.fullName || '') : (fallbackText || '');
  });
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const isInteractingWithDropdownRef = useRef(false);
  const isSelectingRef = useRef(false);
  const blurTimeoutRef = useRef(null);

  // Position floating dropdown in a portal so it is never clipped by table overflow
  useEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return;
    }

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 220;
      const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setMenuStyle({
        position: 'fixed',
        left: `${Math.round(rect.left)}px`,
        width: `${Math.round(rect.width)}px`,
        zIndex: 100000,
        ...(openUp
          ? { bottom: `${Math.round(window.innerHeight - rect.top + 4)}px` }
          : { top: `${Math.round(rect.bottom + 4)}px` }
        )
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Sync query when external value, selectedEmp, or fallbackText changes
  useEffect(() => {
    if (isSelectingRef.current) return;
    if (selectedEmp) {
      setQuery(selectedEmp.name || selectedEmp.fullName || '');
    } else if (fallbackText) {
      setQuery(fallbackText);
    } else if (!value) {
      setQuery('');
    }
  }, [value, selectedEmp, fallbackText]);

  // Click outside listener (checks both input container and portalized dropdown)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (isInteractingWithDropdownRef.current) return;
      const inContainer = containerRef.current && containerRef.current.contains(e.target);
      const inList = listRef.current && listRef.current.contains(e.target);
      if (!inContainer && !inList) {
        closeDropdown();
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
  }, [isOpen, selectedEmp, fallbackText, value]);

  const selectedEmpName = selectedEmp ? (selectedEmp.name || selectedEmp.fullName || '') : '';
  const isDisplayingSelected = Boolean(selectedEmp && query.trim().toLowerCase() === selectedEmpName.trim().toLowerCase());

  // Filter employees (when query matches selected employee's full name, keep full roster open with selection highlighted)
  const filteredEmployees = employees.filter(emp => {
    if (!query.trim() || isDisplayingSelected) return true;
    const q = query.trim().toLowerCase();
    const name = (emp.name || emp.fullName || '').toLowerCase();
    const role = (emp.role || '').toLowerCase();
    const phone = (emp.phone || '').toLowerCase();
    const code = (emp.empCode || emp.code || '').toLowerCase();
    const empId = String(emp.dbId || emp.id || '');
    return name.includes(q) || role.includes(q) || phone.includes(q) || code.includes(q) || empId === q;
  });

  // Keep highlighted index in bounds (highlight currently selected employee when browsing)
  useEffect(() => {
    if (isDisplayingSelected && selectedEmp) {
      const idx = filteredEmployees.findIndex(e => String(e.dbId || e.id) === String(selectedEmp.dbId || selectedEmp.id));
      if (idx !== -1) {
        setHighlightedIndex(idx);
        return;
      }
    }
    setHighlightedIndex(0);
  }, [query, isDisplayingSelected, selectedEmp, filteredEmployees.length]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (emp, shouldAdvance = false) => {
    isSelectingRef.current = true;
    const empId = emp.dbId || emp.id;
    const rate = Number(emp.dailySalary || 0);
    setQuery(emp.name || emp.fullName || '');
    closeDropdown();
    onChange(empId, rate);

    if (shouldAdvance && onEnterNext) {
      setTimeout(() => {
        onEnterNext(rowIndex, colIndex);
        isSelectingRef.current = false;
      }, 50);
    } else {
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 200);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    isSelectingRef.current = false;
    setQuery('');
    onChange('', 0);
    openDropdown();
    inputRef.current?.focus();
  };

  const handleBlur = (e) => {
    if (isSelectingRef.current || isInteractingWithDropdownRef.current) {
      return;
    }
    if (listRef.current && (listRef.current === e.relatedTarget || listRef.current.contains(e.relatedTarget))) {
      return;
    }

    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      if (isSelectingRef.current || isInteractingWithDropdownRef.current) return;
      closeDropdown();

      const trimmed = (query || '').trim().toLowerCase();
      if (trimmed && !selectedEmp) {
        const exactMatch = employees.find(emp => {
          const name = (emp.name || emp.fullName || '').trim().toLowerCase();
          const code = (emp.empCode || emp.code || '').trim().toLowerCase();
          return name === trimmed || code === trimmed || name.startsWith(trimmed);
        });

        if (exactMatch) {
          handleSelect(exactMatch, false);
          return;
        }
      }

      if (selectedEmp) {
        setQuery(selectedEmp.name || selectedEmp.fullName || '');
      } else if (fallbackText) {
        setQuery(fallbackText);
      } else if (!value) {
        setQuery('');
      }
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.altKey) {
          setIsOpen(true);
        } else if (onNavigate) {
          onNavigate(rowIndex, colIndex, 'down');
        } else {
          setIsOpen(true);
        }
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.altKey) {
          setIsOpen(true);
        } else if (onNavigate) {
          onNavigate(rowIndex, colIndex, 'up');
        } else {
          setIsOpen(true);
        }
        return;
      }
      if (e.key === 'ArrowLeft') {
        const isAtStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
        const allSelected = e.target.selectionStart === 0 && e.target.selectionEnd === (e.target.value?.length || 0);
        if ((isAtStart || allSelected) && onNavigate) {
          e.preventDefault();
          onNavigate(rowIndex, colIndex, 'left');
          return;
        }
      }
      if (e.key === 'ArrowRight') {
        const isAtEnd = e.target.selectionStart === (e.target.value?.length || 0);
        const allSelected = e.target.selectionStart === 0 && e.target.selectionEnd === (e.target.value?.length || 0);
        if ((isAtEnd || allSelected) && onNavigate) {
          e.preventDefault();
          onNavigate(rowIndex, colIndex, 'right');
          return;
        }
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (onEnterNext) {
          onEnterNext(rowIndex, colIndex);
        } else if (onNavigate) {
          onNavigate(rowIndex, colIndex, 'right');
        }
        return;
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
        handleSelect(filteredEmployees[highlightedIndex], true);
      } else {
        setIsOpen(false);
        if (onEnterNext) onEnterNext(rowIndex, colIndex);
      }
    } else if (e.key === 'Tab') {
      if (filteredEmployees.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredEmployees.length) {
        handleSelect(filteredEmployees[highlightedIndex], false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
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
          id={id}
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={(e) => {
            e.target.select();
            openDropdown();
          }}
          onBlur={handleBlur}
          onClick={() => {
            openDropdown();
          }}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            openDropdown();
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

      {/* Floating Dropdown Filter Results (Rendered via Portal so never clipped) */}
      {isOpen && menuStyle && createPortal(
        <div
          ref={listRef}
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            isInteractingWithDropdownRef.current = true;
          }}
          onMouseUp={() => {
            setTimeout(() => {
              isInteractingWithDropdownRef.current = false;
            }, 200);
          }}
          style={{
            ...menuStyle,
            background: '#ffffff',
            borderRadius: '8px',
            border: '1.5px solid #4A2C17',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
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
              const isSelected = selectedEmp && (
                String(emp.dbId || emp.id) === String(selectedEmp.dbId || selectedEmp.id) ||
                String(emp.dbId || emp.id) === String(value)
              );
              const isHighlighted = i === highlightedIndex;
              const empName = emp.name || emp.fullName || '';

              return (
                <div
                  key={emp.id || emp.dbId || i}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isSelectingRef.current = true;
                    handleSelect(emp, false);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isSelectingRef.current = true;
                    handleSelect(emp, false);
                  }}
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
        </div>,
        document.body
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
  fallbackText = '',
  rowIndex,
  colIndex = 1,
  onNavigate,
  onEnterNext,
  id
}) => {
  const selectedSite = sites.find(s => {
    if (!value && !fallbackText) return false;
    if (value !== undefined && value !== null && value !== '') {
      const valStr = String(value).trim();
      const valNum = parseInt(valStr, 10);
      if (s.dbId !== undefined && s.dbId !== null && String(s.dbId) === valStr) return true;
      if (s.id !== undefined && s.id !== null && String(s.id) === valStr) return true;
      if (s.siteRef && String(s.siteRef).toLowerCase() === valStr.toLowerCase()) return true;
      if (s.siteCode && String(s.siteCode).toLowerCase() === valStr.toLowerCase()) return true;
      if (!isNaN(valNum)) {
        if (s.dbId && Number(s.dbId) === valNum) return true;
        const refNum = parseInt(String(s.siteRef || s.id || '').replace(/\D/g, ''), 10);
        if (!isNaN(refNum) && refNum === valNum) return true;
      }
    }
    if (fallbackText) {
      const fb = String(fallbackText).trim().toLowerCase();
      const sName = (s.customerName || s.name || '').trim().toLowerCase();
      if (sName === fb) return true;
    }
    return false;
  });

  const formatSiteDisplay = (site) => {
    if (!site) return '';
    const ref = site.siteRef || site.siteCode || site.id || '';
    const refPrefix = ref ? `[${ref}] ` : '';
    const locSuffix = site.location ? ` (${site.location})` : '';
    return `${refPrefix}${site.customerName || site.name || ''}${locSuffix}`.trim();
  };

  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);

  const openDropdown = () => {
    setIsOpen(true);
    notifyComboboxOpened(id);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setMenuStyle(null);
  };

  // Close this dropdown immediately if another combobox opens anywhere
  useEffect(() => {
    const handleOtherOpen = (e) => {
      if (e.detail?.id && e.detail.id !== id) {
        closeDropdown();
      }
    };
    window.addEventListener('combobox-opened', handleOtherOpen);
    return () => window.removeEventListener('combobox-opened', handleOtherOpen);
  }, [id]);

  const [query, setQuery] = useState(() => {
    return selectedSite ? formatSiteDisplay(selectedSite) : (fallbackText || '');
  });
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const isInteractingWithDropdownRef = useRef(false);
  const isSelectingRef = useRef(false);
  const blurTimeoutRef = useRef(null);

  // Position floating dropdown in a portal so it is never clipped by table overflow
  useEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return;
    }

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 220;
      const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setMenuStyle({
        position: 'fixed',
        left: `${Math.round(rect.left)}px`,
        width: `${Math.max(Math.round(rect.width), 260)}px`,
        zIndex: 100000,
        ...(openUp
          ? { bottom: `${Math.round(window.innerHeight - rect.top + 4)}px` }
          : { top: `${Math.round(rect.bottom + 4)}px` }
        )
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Sync display text when external value, selectedSite, or fallbackText changes
  useEffect(() => {
    if (isSelectingRef.current) return;
    if (selectedSite) {
      setQuery(formatSiteDisplay(selectedSite));
    } else if (fallbackText) {
      setQuery(fallbackText);
    } else if (!value) {
      setQuery('');
    }
  }, [value, selectedSite, fallbackText]);

  // Click outside listener (checks both input container and portalized dropdown)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (isInteractingWithDropdownRef.current) return;
      const inContainer = containerRef.current && containerRef.current.contains(e.target);
      const inList = listRef.current && listRef.current.contains(e.target);
      if (!inContainer && !inList) {
        closeDropdown();
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
  }, [isOpen, selectedSite, fallbackText, value]);

  const selectedSiteDisplay = selectedSite ? formatSiteDisplay(selectedSite) : '';
  const isDisplayingSelected = Boolean(selectedSite && query.trim().toLowerCase() === selectedSiteDisplay.trim().toLowerCase());

  // Filter sites (when query matches selected site's full display, keep all sites open with current site highlighted)
  const filteredSites = sites.filter(site => {
    if (!query.trim() || isDisplayingSelected) return true;
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    const siteRef = String(site.siteRef || site.siteCode || site.id || '').toLowerCase();
    const siteRefDigits = siteRef.replace(/\D/g, '');
    const name = (site.customerName || site.name || '').toLowerCase();
    const loc = (site.location || '').toLowerCase();
    const combined = `${siteRef} ${name} ${loc}`.toLowerCase();

    if (combined.includes(q)) return true;
    if (qDigits && siteRefDigits) {
      if (parseInt(qDigits, 10) === parseInt(siteRefDigits, 10)) return true;
      if (siteRefDigits.includes(qDigits)) return true;
    }
    return false;
  });

  // Keep highlighted index in bounds (highlight currently selected site when browsing)
  useEffect(() => {
    if (isDisplayingSelected && selectedSite) {
      const idx = filteredSites.findIndex(s => {
        return (
          (selectedSite.dbId && s.dbId && String(s.dbId) === String(selectedSite.dbId)) ||
          (selectedSite.id && s.id && String(s.id) === String(selectedSite.id))
        );
      });
      if (idx !== -1) {
        setHighlightedIndex(idx);
        return;
      }
    }
    setHighlightedIndex(0);
  }, [query, isDisplayingSelected, selectedSite, filteredSites.length]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (site, shouldAdvance = false) => {
    isSelectingRef.current = true;
    const siteId = site.dbId || site.id;
    const formatted = formatSiteDisplay(site);
    setQuery(formatted);
    closeDropdown();
    onChange(siteId);

    if (shouldAdvance && onEnterNext) {
      setTimeout(() => {
        onEnterNext(rowIndex, colIndex);
        isSelectingRef.current = false;
      }, 50);
    } else {
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 200);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    isSelectingRef.current = false;
    setQuery('');
    onChange('');
    openDropdown();
    inputRef.current?.focus();
  };

  const handleBlur = (e) => {
    if (isSelectingRef.current || isInteractingWithDropdownRef.current) {
      return;
    }
    if (listRef.current && (listRef.current === e.relatedTarget || listRef.current.contains(e.relatedTarget))) {
      return;
    }

    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      if (isSelectingRef.current || isInteractingWithDropdownRef.current) return;
      closeDropdown();

      const trimmed = (query || '').trim().toLowerCase();
      if (trimmed && !selectedSite) {
        const exactMatch = sites.find(s => {
          const ref = String(s.siteRef || s.siteCode || s.id || '').toLowerCase();
          const refDigits = ref.replace(/\D/g, '');
          const qDigits = trimmed.replace(/\D/g, '');
          if (ref === trimmed) return true;
          if (qDigits && refDigits && parseInt(qDigits, 10) === parseInt(refDigits, 10)) return true;
          const sName = (s.customerName || s.name || '').trim().toLowerCase();
          if (sName === trimmed) return true;
          return false;
        });

        if (exactMatch) {
          handleSelect(exactMatch, false);
          return;
        }
      }

      if (selectedSite) {
        setQuery(formatSiteDisplay(selectedSite));
      } else if (fallbackText) {
        setQuery(fallbackText);
      } else if (!value) {
        setQuery('');
      }
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.altKey) {
          openDropdown();
        } else if (onNavigate) {
          onNavigate(rowIndex, colIndex, 'down');
        } else {
          openDropdown();
        }
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.altKey) {
          openDropdown();
        } else if (onNavigate) {
          onNavigate(rowIndex, colIndex, 'up');
        } else {
          openDropdown();
        }
        return;
      }
      if (e.key === 'ArrowLeft') {
        const isAtStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
        const allSelected = e.target.selectionStart === 0 && e.target.selectionEnd === (e.target.value?.length || 0);
        if ((isAtStart || allSelected) && onNavigate) {
          e.preventDefault();
          onNavigate(rowIndex, colIndex, 'left');
          return;
        }
      }
      if (e.key === 'ArrowRight') {
        const isAtEnd = e.target.selectionStart === (e.target.value?.length || 0);
        const allSelected = e.target.selectionStart === 0 && e.target.selectionEnd === (e.target.value?.length || 0);
        if ((isAtEnd || allSelected) && onNavigate) {
          e.preventDefault();
          onNavigate(rowIndex, colIndex, 'right');
          return;
        }
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (onEnterNext) {
          onEnterNext(rowIndex, colIndex);
        } else if (onNavigate) {
          onNavigate(rowIndex, colIndex, 'right');
        }
        return;
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
        handleSelect(filteredSites[highlightedIndex], true);
      } else {
        closeDropdown();
        if (onEnterNext) onEnterNext(rowIndex, colIndex);
      }
    } else if (e.key === 'Tab') {
      if (filteredSites.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredSites.length) {
        handleSelect(filteredSites[highlightedIndex], false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
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
          id={id}
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={(e) => {
            e.target.select();
            openDropdown();
          }}
          onBlur={handleBlur}
          onClick={() => {
            openDropdown();
          }}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            openDropdown();
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

      {/* Floating Dropdown Filter Results (Rendered via Portal so never clipped) */}
      {isOpen && menuStyle && createPortal(
        <div
          ref={listRef}
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            isInteractingWithDropdownRef.current = true;
          }}
          onMouseUp={() => {
            setTimeout(() => {
              isInteractingWithDropdownRef.current = false;
            }, 200);
          }}
          style={{
            ...menuStyle,
            background: '#ffffff',
            borderRadius: '8px',
            border: '1.5px solid #4A2C17',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
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
              const isSelected = selectedSite && (
                (selectedSite.dbId && site.dbId && String(site.dbId) === String(selectedSite.dbId)) ||
                (selectedSite.id && site.id && String(site.id) === String(selectedSite.id)) ||
                (String(site.dbId || site.id) === String(value))
              );
              const isHighlighted = i === highlightedIndex;
              const siteName = site.customerName || site.name || '';

              return (
                <div
                  key={site.id || site.dbId || i}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isSelectingRef.current = true;
                    handleSelect(site, false);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isSelectingRef.current = true;
                    handleSelect(site, false);
                  }}
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
        </div>,
        document.body
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
  style = {},
  rowIndex,
  colIndex = 2,
  onNavigate,
  onEnterNext,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const [inputValue, setInputValue] = useState(String(value ?? '1.0'));
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const isInteractingWithDropdownRef = useRef(false);

  const openDropdown = () => {
    setIsOpen(true);
    notifyComboboxOpened(id);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setMenuStyle(null);
  };

  // Close this dropdown immediately if another combobox opens anywhere
  useEffect(() => {
    const handleOtherOpen = (e) => {
      if (e.detail?.id && e.detail.id !== id) {
        closeDropdown();
      }
    };
    window.addEventListener('combobox-opened', handleOtherOpen);
    return () => window.removeEventListener('combobox-opened', handleOtherOpen);
  }, [id]);

  // Position floating dropdown in a portal so it is never clipped by table overflow
  useEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return;
    }

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 220;
      const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setMenuStyle({
        position: 'fixed',
        left: `${Math.round(rect.left)}px`,
        width: `${Math.max(Math.round(rect.width), 160)}px`,
        zIndex: 100000,
        ...(openUp
          ? { bottom: `${Math.round(window.innerHeight - rect.top + 4)}px` }
          : { top: `${Math.round(rect.bottom + 4)}px` }
        )
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Sync internal input value with external value
  useEffect(() => {
    setInputValue(String(value ?? '1.0'));
  }, [value]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (isInteractingWithDropdownRef.current) return;
      const inContainer = containerRef.current && containerRef.current.contains(e.target);
      const inList = listRef.current && listRef.current.contains(e.target);
      if (!inContainer && !inList) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
    closeDropdown();
    onChange(presetVal);
    if (onEnterNext) {
      onEnterNext(rowIndex, colIndex);
    } else {
      inputRef.current?.focus();
    }
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
    if (isInteractingWithDropdownRef.current) return;
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
    if (isOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        return;
      }
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (onNavigate) {
        onNavigate(rowIndex, colIndex, 'up');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (onNavigate) {
        onNavigate(rowIndex, colIndex, 'down');
      }
    } else if (e.key === 'ArrowLeft') {
      const isAtStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
      const allSelected = e.target.selectionStart === 0 && e.target.selectionEnd === (e.target.value?.length || 0);
      if ((isAtStart || allSelected) && onNavigate) {
        e.preventDefault();
        onNavigate(rowIndex, colIndex, 'left');
      }
    } else if (e.key === 'ArrowRight') {
      const isAtEnd = e.target.selectionStart === (e.target.value?.length || 0);
      const allSelected = e.target.selectionStart === 0 && e.target.selectionEnd === (e.target.value?.length || 0);
      if ((isAtEnd || allSelected) && onNavigate) {
        e.preventDefault();
        onNavigate(rowIndex, colIndex, 'right');
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
      closeDropdown();
      if (onEnterNext) {
        onEnterNext(rowIndex, colIndex);
      }
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
          id={id}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            e.target.select();
            openDropdown();
          }}
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
            if (isOpen) {
              closeDropdown();
            } else {
              openDropdown();
            }
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
            if (isOpen) {
              closeDropdown();
            } else {
              openDropdown();
            }
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

      {/* Preset Dropdown Menu (Rendered via Portal so never clipped) */}
      {isOpen && menuStyle && createPortal(
        <div
          ref={listRef}
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            isInteractingWithDropdownRef.current = true;
          }}
          onMouseUp={() => {
            setTimeout(() => {
              isInteractingWithDropdownRef.current = false;
            }, 200);
          }}
          style={{
            ...menuStyle,
            background: '#ffffff',
            borderRadius: '8px',
            border: '1.5px solid #4A2C17',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
            zIndex: 100000,
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectPreset(p.val);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectPreset(p.val);
                }}
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
        </div>,
        document.body
      )}
    </div>
  );
};
