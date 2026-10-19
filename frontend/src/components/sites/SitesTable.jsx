import React from 'react';

const SitesTable = ({ sites, getStatusBadge, onView, onEdit, onDelete, onSticker }) => {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '0 0 12px 12px',
      border: '1px solid #D1C2AF',
      borderTop: 'none',
      boxShadow: '0 4px 16px rgba(100, 70, 40, 0.05)',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      width: '100%'
    }}>
      <table style={{
        width: '100%',
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
            <th style={{padding: '12px 14px', width: '10%'}}>Code</th>
            <th style={{padding: '12px 14px', width: '22%'}}>Client / Site</th>
            <th style={{padding: '12px 14px', width: '15%'}}>Contact</th>
            <th style={{padding: '12px 14px', width: '23%'}}>Address</th>
            <th style={{padding: '12px 14px', width: '9%'}}>Start Date</th>
            <th style={{padding: '12px 14px', width: '9%'}}>Status</th>
            <th style={{padding: '12px 18px', width: '12%', textAlign: 'right'}}>Actions</th>
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
            sites.map((site) => (
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
                        {(site.refFrom || site.refName) && (
                          <span style={{
                            fontSize: '9.5px',
                            background: '#FEF3C7',
                            color: '#92400E',
                            padding: '0px 5px',
                            borderRadius: '3px',
                            fontWeight: '600'
                          }} title={`Source: ${site.refFrom || 'Referral'}${site.refName ? ` (${site.refName})` : ''}`}>
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

                {/* Status */}
                <td style={{padding: '13px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap'}}>
                  {getStatusBadge(site.status)}
                </td>

                {/* Actions - Guaranteed spacing and NEVER cut off */}
                <td style={{padding: '13px 18px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap'}}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '5px'
                  }}>
                    <button
                      title="View Details"
                      onClick={() => onView(site)}
                      style={{
                        width: '28px',
                        height: '28px',
                        background: '#FAF8F5',
                        border: '1px solid #D1C2AF',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#4B5563',
                        fontSize: '11px',
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

                    <button
                      title="Print Folder Sticker"
                      onClick={() => onSticker && onSticker(site)}
                      style={{
                        width: '28px',
                        height: '28px',
                        background: '#FAF8F5',
                        border: '1px solid #D1C2AF',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#A56A30',
                        fontSize: '11px',
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
                      <i className="fa-solid fa-tag"></i>
                    </button>
                    
                    <button
                      title="Edit Site"
                      onClick={() => onEdit(site)}
                      style={{
                        width: '28px',
                        height: '28px',
                        background: '#FAF8F5',
                        border: '1px solid #D1C2AF',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: 'var(--gold, #A56A30)',
                        fontSize: '11px',
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
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    
                    <button
                      title="Delete Site"
                      onClick={() => onDelete(site.id)}
                      style={{
                        width: '28px',
                        height: '28px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#DC2626',
                        fontSize: '11px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        padding: 0,
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.borderColor = '#F87171'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA'; }}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
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
