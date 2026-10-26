import React, { useState, useEffect } from 'react';

const SitesTable = ({
  sites,
  getStatusBadge,
  onView,
  onEdit,
  onDelete,
  onSticker,
  onOpenFolder,
  onOpenEstimate,
  onOpenTodoList,
  onShiftStatus
}) => {
  const [statusMenuSiteId, setStatusMenuSiteId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleGlobalClick = () => { setOpenMenuId(null); setStatusMenuSiteId(null); };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div style={{
      background: '#fff',
      borderRadius: '0 0 12px 12px',
      border: '1px solid #D1C2AF',
      borderTop: 'none',
      boxShadow: '0 4px 16px rgba(100, 70, 40, 0.05)',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      width: '100%',
      minHeight: '260px',
      paddingBottom: '24px'
    }}>
      <table style={{
        width: '100%',
        minWidth: '1050px',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        margin: 0
      }}>
        <thead>
          <tr style={{
            background: '#F3EDE6',
            borderBottom: '1.5px solid #D1C2AF',
            textAlign: 'left',
            color: '#6E5743',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.8px'
          }}>
            <th style={{padding: '12px 14px', width: '8%', minWidth: '70px'}}>Code</th>
            <th style={{padding: '12px 14px', width: '22%', minWidth: '180px'}}>Client / Site</th>
            <th style={{padding: '12px 14px', width: '15%', minWidth: '130px'}}>Contact</th>
            <th style={{padding: '12px 14px', width: '22%', minWidth: '160px'}}>Address</th>
            <th style={{padding: '12px 14px', width: '10%', minWidth: '95px'}}>Start Date</th>
            <th style={{padding: '12px 14px', width: '10%', minWidth: '95px'}}>Status</th>
            <th style={{padding: '12px 14px', width: '13%', minWidth: '135px', textAlign: 'right'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(!sites || sites.length === 0) ? (
            <tr>
              <td colSpan="7" style={{padding: '40px', textAlign: 'center', color: '#9CA3AF'}}>
                <i className="fa-solid fa-location-dot" style={{fontSize: '32px', marginBottom: '10px', display: 'block', color: '#D1C2AF'}}></i>
                No sites found.
              </td>
            </tr>
          ) : (
            sites.map((site, index) => (
              <tr key={site.id} style={{borderBottom: '1px solid #EAE1D5', transition: 'background 0.15s'}}>
                
                {/* Site Ref */}
                <td style={{padding: '13px 14px', verticalAlign: 'middle'}}>
                  <span style={{
                    background: 'rgba(165, 106, 48, 0.08)',
                    color: 'var(--gold, #A56A30)',
                    fontWeight: '700',
                    padding: '4px 8px',
                    borderRadius: '5px',
                    fontSize: '11.5px',
                    border: '1px solid rgba(165, 106, 48, 0.2)',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    display: 'inline-block'
                  }}>
                    {site.id}
                  </span>
                </td>

                {/* Customer / Site Name */}
                <td style={{padding: '13px 14px', verticalAlign: 'middle'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0}}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'rgba(165, 106, 48, 0.12)',
                      color: '#7A4518',
                      border: '1px solid rgba(165, 106, 48, 0.28)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '11px',
                      flexShrink: 0
                    }}>
                      {site.customerName ? site.customerName.split(' ').map(n => n[0]).join('') : 'C'}
                    </div>
                    <div style={{minWidth: 0, overflow: 'hidden'}}>
                      <div style={{fontWeight: '600', color: '#111827', fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}}>
                        {site.customerName}
                      </div>
                      <div style={{fontSize: '11px', color: '#6B7280', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap'}}>
                        <span>{site.location}</span>
                        {site.refFrom === 'Existing Customer' && (
                          <span style={{
                            fontSize: '9.5px',
                            background: '#DCFCE7',
                            color: '#15803D',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontWeight: '700'
                          }} title={`Repeat Customer${site.refName ? ` (${site.refName})` : ''}`}>
                            <i className="fa-solid fa-user-check" style={{fontSize: '8.5px', marginRight: '3px'}}></i>
                            Existing Customer
                          </span>
                        )}
                        {site.refFrom === 'Referred by Existing Customer' && (
                          <span style={{
                            fontSize: '9.5px',
                            background: '#FEF3C7',
                            color: '#92400E',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontWeight: '700'
                          }} title={`Referred by ${site.refName || 'Customer'}`}>
                            <i className="fa-solid fa-bullhorn" style={{fontSize: '8px', marginRight: '3px'}}></i>
                            {site.refName ? `Ref by: ${site.refName}` : 'Referred by Customer'}
                          </span>
                        )}
                        {site.refFrom && site.refFrom !== 'Existing Customer' && site.refFrom !== 'Referred by Existing Customer' && (
                          <span style={{
                            fontSize: '9.5px',
                            background: '#FEF3C7',
                            color: '#92400E',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontWeight: '600'
                          }} title={`Source: ${site.refFrom}${site.refName ? ` (${site.refName})` : ''}`}>
                            <i className="fa-solid fa-bullhorn" style={{fontSize: '8px', marginRight: '3px'}}></i>
                            {site.refFrom || site.refName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td style={{padding: '13px 14px', verticalAlign: 'middle'}}>
                  <div style={{fontSize: '12px', color: '#374151', fontWeight: '500', whiteSpace: 'nowrap'}}>
                    <i className="fa-solid fa-phone" style={{fontSize: '10px', color: '#9CA3AF', marginRight: '6px'}}></i>
                    {site.phone || 'N/A'}
                  </div>
                  {site.email && (
                    <div style={{fontSize: '11px', color: '#6B7280', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}}>
                      <i className="fa-solid fa-envelope" style={{fontSize: '10px', color: '#9CA3AF', marginRight: '6px'}}></i>
                      {site.email}
                    </div>
                  )}
                  {Array.isArray(site.contactPersons) && site.contactPersons.length > 0 && (
                    <div
                      style={{
                        marginTop: '3px',
                        fontSize: '10px',
                        color: '#059669',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: '#ECFDF5',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: '600',
                        cursor: 'help'
                      }}
                      title={site.contactPersons.map(c => `${c.name || 'Contact'}: ${c.phone || ''}`).join('\n')}
                    >
                      <i className="fa-solid fa-users" style={{fontSize: '9px'}}></i>
                      +{site.contactPersons.length} more
                    </div>
                  )}
                </td>

                {/* Site Location & Address */}
                <td style={{padding: '13px 14px', verticalAlign: 'middle'}}>
                  <div style={{display: 'flex', alignItems: 'flex-start', gap: '6px', minWidth: 0}}>
                    <i className="fa-solid fa-location-dot" style={{color: 'var(--gold, #A56A30)', marginTop: '3px', fontSize: '11px', flexShrink: 0}}></i>
                    <div style={{minWidth: 0, overflow: 'hidden'}}>
                      <span style={{fontWeight: '600', color: '#111827', fontSize: '12px', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}}>
                        {site.location || 'Location'}
                      </span>
                      <div style={{
                        fontSize: '11px',
                        color: '#6B7280',
                        marginTop: '1px',
                        lineHeight: '1.3',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }} title={site.fullAddress || site.location}>
                        {site.fullAddress || 'No full address given'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Start Date */}
                <td style={{padding: '13px 14px', verticalAlign: 'middle', fontSize: '12px', color: '#4B5563', fontFamily: 'monospace', whiteSpace: 'nowrap'}}>
                  <div>{(() => {
                    const d = site.startDate;
                    if (!d) return '--';
                    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
                      const [y, m, day] = d.split('-');
                      return `${day}-${m}-${y}`;
                    }
                    return d;
                  })()}</div>
                  {site.targetDate && (
                    <div style={{fontSize: '10px', color: '#9CA3AF'}}>Due: {(() => {
                      const d = site.targetDate;
                      if (!d) return '--';
                      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
                        const [y, m, day] = d.split('-');
                        return `${day}-${m}-${y}`;
                      }
                      return d;
                    })()}</div>
                  )}
                </td>

                {/* Status with Quick Shift Dropdown */}
                <td style={{padding: '13px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap'}}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusMenuSiteId(statusMenuSiteId === site.id ? null : site.id);
                      }}
                      title="Click to shift customer status (Running / Completed / On Hold)"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {getStatusBadge(site.status)}
                      <i className="fa-solid fa-chevron-down" style={{ fontSize: '9px', color: '#9CA3AF' }}></i>
                    </button>

                    {statusMenuSiteId === site.id && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 'calc(100% + 4px)',
                          background: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1.5px solid #D1C2AF',
                          boxShadow: '0 8px 20px rgba(74, 44, 23, 0.2)',
                          zIndex: 300,
                          minWidth: '135px',
                          padding: '4px 0',
                          textAlign: 'left'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '800', color: '#78716C', textTransform: 'uppercase' }}>
                          Shift Status:
                        </div>
                        {['Running', 'Completed', 'On Hold'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setStatusMenuSiteId(null);
                              onShiftStatus && onShiftStatus(site, st);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              width: '100%',
                              padding: '7px 12px',
                              border: 'none',
                              background: site.status === st ? '#FAF4EE' : 'transparent',
                              color: st === 'Running' ? '#1E8E3E' : (st === 'Completed' ? '#15803D' : '#B45309'),
                              fontSize: '12px',
                              fontWeight: site.status === st ? '800' : '600',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#FAF4EE'}
                            onMouseLeave={(e) => {
                              if (site.status !== st) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <span>●</span>
                            <span>{st}</span>
                            {site.status === st && <i className="fa-solid fa-check" style={{ marginLeft: 'auto', fontSize: '10px' }}></i>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                {/* Actions - View, Folder, and 3-Dots Dropdown Menu */}
                <td style={{padding: '12px 14px', minWidth: '135px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap'}}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '6px'
                  }}>
                    {/* 1. View Details */}
                    <button
                      type="button"
                      title="View Details"
                      onClick={() => onView(site)}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: '#FAF8F5',
                        border: '1px solid #D1C2AF',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#4B5563',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        padding: 0,
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#F3EDE6'; e.currentTarget.style.borderColor = '#9A7B56'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#FAF8F5'; e.currentTarget.style.borderColor = '#D1C2AF'; }}
                    >
                      <i className="fa-solid fa-eye"></i>
                    </button>

                    {/* 2. Open Project Folder */}
                    <button
                      type="button"
                      title="Open Project Folder in File Explorer"
                      onClick={() => onOpenFolder && onOpenFolder(site)}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: '#FAF8F5',
                        border: '1px solid #D1C2AF',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#D97706',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        padding: 0,
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#FEF3C7'; e.currentTarget.style.borderColor = '#F59E0B'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#FAF8F5'; e.currentTarget.style.borderColor = '#D1C2AF'; }}
                    >
                      <i className="fa-solid fa-folder-open"></i>
                    </button>

                    {/* 3. Three-Dots Menu with Rock-Solid Click & Hover Lock */}
                    <div
                      style={{ position: 'relative', display: 'inline-block' }}
                      onMouseEnter={() => {
                        // Smoothly open on hover
                        setOpenMenuId(site.id);
                      }}
                      onMouseLeave={(e) => {
                        // Only close on mouse leave if moving far away, with slight tolerance
                        setOpenMenuId(null);
                      }}
                    >
                      <button
                        type="button"
                        title="Customer Actions (Estimate, To-Do, Sticker, Edit, Delete)"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === site.id ? null : site.id);
                        }}
                        style={{
                          width: '36px',
                          height: '34px',
                          background: openMenuId === site.id ? 'var(--gold, #4A2C17)' : '#FAF8F5',
                          border: openMenuId === site.id ? '1.5px solid var(--gold, #4A2C17)' : '1.5px solid #D1C2AF',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          color: openMenuId === site.id ? '#FFFFFF' : '#4A2C17',
                          fontSize: '16px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          padding: 0,
                          flexShrink: 0,
                          boxShadow: openMenuId === site.id ? '0 2px 8px rgba(74, 44, 23, 0.25)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (openMenuId !== site.id) {
                            e.currentTarget.style.background = '#F3EDE6';
                            e.currentTarget.style.borderColor = 'var(--gold, #A56A30)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (openMenuId !== site.id) {
                            e.currentTarget.style.background = '#FAF8F5';
                            e.currentTarget.style.borderColor = '#D1C2AF';
                          }
                        }}
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>

                      {openMenuId === site.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            // Bridge without any dead space!
                            top: index >= sites.length - 2 && sites.length > 2 ? 'auto' : '100%',
                            bottom: index >= sites.length - 2 && sites.length > 2 ? '100%' : 'auto',
                            paddingTop: index >= sites.length - 2 && sites.length > 2 ? '0' : '4px',
                            paddingBottom: index >= sites.length - 2 && sites.length > 2 ? '4px' : '0',
                            zIndex: 600,
                            minWidth: '190px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              background: '#FFFFFF',
                              borderRadius: '10px',
                              border: '1.5px solid #D1C2AF',
                              boxShadow: '0 12px 32px rgba(74, 44, 23, 0.25)',
                              padding: '6px 0',
                              display: 'flex',
                              flexDirection: 'column',
                              textAlign: 'left',
                              overflow: 'hidden'
                            }}
                          >
                            {/* Menu Header with site code */}
                            <div style={{
                              padding: '6px 14px 4px',
                              fontSize: '10.5px',
                              fontWeight: '800',
                              color: 'var(--gold, #8C5521)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.6px',
                              borderBottom: '1px solid #F3EDE6',
                              marginBottom: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span>Customer Actions</span>
                              <span style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}>#{site.siteCode || site.id}</span>
                            </div>

                            {/* 1. Estimate */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onOpenEstimate && onOpenEstimate(site);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '9px 14px',
                                background: 'transparent',
                                border: 'none',
                                color: '#111827',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#FAF4EE'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: '#FAF4EE',
                                color: 'var(--gold, #A56A30)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                border: '1px solid #EAD8C7'
                              }}>
                                <i className="fa-solid fa-file-invoice"></i>
                              </span>
                              <span>Estimate</span>
                            </button>

                            {/* 2. To-Do List */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onOpenTodoList && onOpenTodoList(site);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '9px 14px',
                                background: 'transparent',
                                border: 'none',
                                color: '#111827',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#FAF4EE'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: '#FEF3C7',
                                color: '#D97706',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                border: '1px solid #FDE68A'
                              }}>
                                <i className="fa-solid fa-list-check"></i>
                              </span>
                              <span>To-Do List</span>
                            </button>

                            {/* 3. Sticker */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onSticker && onSticker(site);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '9px 14px',
                                background: 'transparent',
                                border: 'none',
                                color: '#111827',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#FAF4EE'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: '#F3E8FF',
                                color: '#7C3AED',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                border: '1px solid #E9D5FF'
                              }}>
                                <i className="fa-solid fa-tag"></i>
                              </span>
                              <span>Sticker</span>
                            </button>

                            {/* 4. Edit */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onEdit && onEdit(site);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '9px 14px',
                                background: 'transparent',
                                border: 'none',
                                color: '#111827',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#FAF4EE'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: '#EFF6FF',
                                color: '#2563EB',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                border: '1px solid #BFDBFE'
                              }}>
                                <i className="fa-solid fa-pen-to-square"></i>
                              </span>
                              <span>Edit Customer</span>
                            </button>

                            <div style={{ height: '1px', background: '#F3EDE6', margin: '4px 0' }}></div>

                            {/* 5. Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onDelete && onDelete(site.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '9px 14px',
                                background: 'transparent',
                                border: 'none',
                                color: '#DC2626',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                border: '1px solid #FECACA'
                              }}>
                                <i className="fa-solid fa-trash-can"></i>
                              </span>
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </td>

              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SitesTable;
