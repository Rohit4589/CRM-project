import React, { useState } from 'react';

const INITIAL_SITES = [
  {
    id: 'SITE-001',
    customerName: 'Rahul Deshmukh',
    phone: '+91 98765 43210',
    email: 'rahul.d@email.com',
    location: 'Kothrud, Pune',
    fullAddress: 'Flat 402, Rohan Tarang, Near MIT College, Kothrud, Pune - 411038',
    latLng: '18.5074, 73.8077',
    startDate: '2026-09-01',
    targetDate: '2026-11-15',
    status: 'Running',
    progress: 72,
    notes: '3BHK complete interior renovation, modular kitchen and false ceiling work.',
    assignedTeam: ['Ramesh Kumar (Carpenter)']
  },
  {
    id: 'SITE-002',
    customerName: 'Priya Sharma',
    phone: '+91 99887 76655',
    email: 'priya.s@email.com',
    location: 'Baner, Pune',
    fullAddress: 'B-12, Orchid Towers, Pan Card Club Road, Baner, Pune - 411045',
    latLng: '18.5590, 73.7868',
    startDate: '2026-09-15',
    targetDate: '2026-12-01',
    status: 'Running',
    progress: 45,
    notes: 'Full apartment interior woodwork, master bedroom wardrobe and TV unit.',
    assignedTeam: ['Ramesh Kumar (Carpenter)', 'Suresh Patil (Painter)']
  },
  {
    id: 'SITE-003',
    customerName: 'Amit Patel',
    phone: '+91 98220 12345',
    email: 'amit.patel@email.com',
    location: 'Wakad, Pune',
    fullAddress: 'A-701, Signature Heights, Datta Mandir Road, Wakad, Pune - 411057',
    latLng: '18.5987, 73.7686',
    startDate: '2026-08-01',
    targetDate: '2026-09-28',
    status: 'Completed',
    progress: 100,
    notes: 'Living room interior, designer wallpaper, and smart electrical fittings completed.',
    assignedTeam: ['Suresh Patil (Painter)']
  },
  {
    id: 'SITE-004',
    customerName: 'Sunil Kadam',
    phone: '+91 97654 32109',
    email: 'sunil.kadam@email.com',
    location: 'Aundh, Pune',
    fullAddress: 'Plot 18, Sindh Society, Aundh, Pune - 411007',
    latLng: '18.5626, 73.8087',
    startDate: '2026-10-10',
    targetDate: '2026-12-25',
    status: 'On Hold',
    progress: 15,
    notes: 'Awaiting architectural drawing confirmation for balcony extension.',
    assignedTeam: []
  }
];

const Sites = () => {
  const [sites, setSites] = useState(INITIAL_SITES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [editingSite, setEditingSite] = useState(null);

  // New site form state
  const [formData, setFormData] = useState({
    id: '',
    customerName: '',
    phone: '',
    email: '',
    location: '',
    fullAddress: '',
    latLng: '',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    status: 'Running',
    notes: ''
  });

  const nextSiteId = `SITE-${String(sites.length + 1).padStart(3, '0')}`;

  const openAddModal = () => {
    setFormData({
      id: nextSiteId,
      customerName: '',
      phone: '',
      email: '',
      location: '',
      fullAddress: '',
      latLng: '',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: '',
      status: 'Running',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newSite = {
      ...formData,
      id: formData.id || nextSiteId,
      progress: formData.status === 'Completed' ? 100 : 10,
      assignedTeam: []
    };
    setSites([newSite, ...sites]);
    setShowAddModal(false);
  };

  const openEditModal = (site) => {
    setEditingSite({ ...site });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setSites(sites.map(s => s.id === editingSite.id ? editingSite : s));
    if (selectedSite && selectedSite.id === editingSite.id) {
      setSelectedSite(editingSite);
    }
    setEditingSite(null);
  };

  const handleDeleteSite = (siteId) => {
    if (window.confirm('Are you sure you want to remove this site?')) {
      setSites(sites.filter(s => s.id !== siteId));
      if (selectedSite && selectedSite.id === siteId) {
        setSelectedSite(null);
      }
    }
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'All' || site.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: sites.length,
    running: sites.filter(s => s.status === 'Running').length,
    completed: sites.filter(s => s.status === 'Completed').length,
    onHold: sites.filter(s => s.status === 'On Hold').length
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Running':
        return (
          <span style={{
            background: '#e6f4ea',
            color: '#1e8e3e',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{width: '6px', height: '6px', borderRadius: '50%', background: '#1e8e3e'}}></span>
            Running
          </span>
        );
      case 'Completed':
        return (
          <span style={{
            background: '#f1f3f4',
            color: '#5f6368',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{width: '6px', height: '6px', borderRadius: '50%', background: '#5f6368'}}></span>
            Completed
          </span>
        );
      case 'On Hold':
        return (
          <span style={{
            background: '#fef7e0',
            color: '#b06000',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{width: '6px', height: '6px', borderRadius: '50%', background: '#b06000'}}></span>
            On Hold
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <main className="dashboard-content" style={{padding: '24px 28px'}}>
      
      {/* Header */}
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '20px'}}>
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap'}}>
            <h1 className="page-title" style={{margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--navy, #111827)'}}>
              Sites / Customers
            </h1>
            <span style={{
              background: 'var(--gold-bg, rgba(185, 120, 45, 0.1))',
              color: 'var(--gold, #B9782D)',
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '12px',
              letterSpacing: '0.5px'
            }}>
              Customer is the Site
            </span>
          </div>
          <p style={{margin: 0, fontSize: '13px', color: 'var(--text-secondary, #6B7280)'}}>
            Manage customer locations, active sites, work progress, and site addresses in one place.
          </p>
        </div>

        <div className="header-actions">
          <button className="btn-primary" onClick={openAddModal} style={{boxShadow: '0 2px 8px rgba(185, 120, 45, 0.25)'}}>
            <i className="fa-solid fa-plus"></i> Add Site / Customer
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '14px',
        marginBottom: '22px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '14px 18px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: 'rgba(185, 120, 45, 0.1)', color: 'var(--gold, #B9782D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
          }}>
            <i className="fa-solid fa-location-dot"></i>
          </div>
          <div>
            <div style={{fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total Sites</div>
            <div style={{fontSize: '20px', fontWeight: '700', color: '#111827'}}>{counts.all}</div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '14px 18px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: '#e6f4ea', color: '#1e8e3e',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
          }}>
            <i className="fa-solid fa-person-digging"></i>
          </div>
          <div>
            <div style={{fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Running</div>
            <div style={{fontSize: '20px', fontWeight: '700', color: '#1e8e3e'}}>{counts.running}</div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '14px 18px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: '#f1f3f4', color: '#5f6368',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
          }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <div style={{fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Completed</div>
            <div style={{fontSize: '20px', fontWeight: '700', color: '#374151'}}>{counts.completed}</div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '14px 18px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: '#fef7e0', color: '#b06000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
          }}>
            <i className="fa-solid fa-pause"></i>
          </div>
          <div>
            <div style={{fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>On Hold</div>
            <div style={{fontSize: '20px', fontWeight: '700', color: '#b06000'}}>{counts.onHold}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#fff',
        borderRadius: '10px 10px 0 0',
        padding: '14px 18px',
        border: '1px solid #E5E7EB',
        borderBottom: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Status Tabs */}
        <div style={{display: 'flex', gap: '4px', background: '#F3F4F6', padding: '4px', borderRadius: '8px', flexWrap: 'wrap'}}>
          {['All', 'Running', 'Completed', 'On Hold'].map(status => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  border: 'none',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? 'var(--gold, #B9782D)' : '#6B7280',
                  fontWeight: isActive ? '600' : '500',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {status} {status === 'All' ? `(${counts.all})` : status === 'Running' ? `(${counts.running})` : status === 'Completed' ? `(${counts.completed})` : `(${counts.onHold})`}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="search-box" style={{position: 'relative', width: '260px'}}>
          <input
            type="text"
            placeholder="Search customer, site, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              outline: 'none',
              fontSize: '13px'
            }}
          />
          <i className="fa-solid fa-search" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9CA3AF',
            fontSize: '13px'
          }}></i>
        </div>
      </div>

      {/* Main Sites Table (Touch Responsive Container) */}
      <div className="panel table-responsive" style={{
        background: '#fff',
        borderRadius: '0 0 10px 10px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '680px'}}>
          <thead>
            <tr style={{
              background: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
              textAlign: 'left',
              color: '#6B7280',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <th style={{padding: '12px 16px'}}>Site Ref</th>
              <th style={{padding: '12px 16px'}}>Customer / Site Name</th>
              <th style={{padding: '12px 16px'}}>Contact Info</th>
              <th style={{padding: '12px 16px'}}>Site Location & Address</th>
              <th style={{padding: '12px 16px'}}>Start Date</th>
              <th style={{padding: '12px 16px'}}>Status</th>
              <th style={{padding: '12px 16px', textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSites.length === 0 ? (
              <tr>
                <td colSpan="7" style={{padding: '40px', textAlign: 'center', color: '#9CA3AF'}}>
                  <i className="fa-solid fa-location-dot" style={{fontSize: '32px', marginBottom: '10px', display: 'block', color: '#D1D5DB'}}></i>
                  No sites / customers found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredSites.map((site) => (
                <tr key={site.id} style={{borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s'}}>
                  
                  {/* Site Ref */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle'}}>
                    <span style={{
                      background: 'rgba(185, 120, 45, 0.08)',
                      color: 'var(--gold, #B9782D)',
                      fontWeight: '700',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      border: '1px solid rgba(185, 120, 45, 0.2)',
                      letterSpacing: '0.5px'
                    }}>
                      {site.id}
                    </span>
                  </td>

                  {/* Customer / Site Name */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '11px',
                        flexShrink: 0
                      }}>
                        {site.customerName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{fontWeight: '600', color: '#111827', fontSize: '13px'}}>
                          {site.customerName}
                        </div>
                        <div style={{fontSize: '11px', color: '#6B7280'}}>
                          {site.location}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle'}}>
                    <div style={{fontSize: '12px', color: '#374151', fontWeight: '500'}}>
                      <i className="fa-solid fa-phone" style={{fontSize: '10px', color: '#9CA3AF', marginRight: '6px'}}></i>
                      {site.phone}
                    </div>
                    {site.email && (
                      <div style={{fontSize: '11px', color: '#6B7280', marginTop: '2px'}}>
                        <i className="fa-solid fa-envelope" style={{fontSize: '10px', color: '#9CA3AF', marginRight: '6px'}}></i>
                        {site.email}
                      </div>
                    )}
                  </td>

                  {/* Site Location & Address */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle', maxWidth: '240px'}}>
                    <div style={{display: 'flex', alignItems: 'flex-start', gap: '6px'}}>
                      <i className="fa-solid fa-location-dot" style={{color: 'var(--gold, #B9782D)', marginTop: '3px', fontSize: '12px'}}></i>
                      <div>
                        <span style={{fontWeight: '600', color: '#111827', fontSize: '12px'}}>{site.location}</span>
                        <div style={{
                          fontSize: '11px',
                          color: '#6B7280',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '220px'
                        }}>
                          {site.fullAddress}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Start Date */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle', fontSize: '12px', color: '#4B5563'}}>
                    <div>{site.startDate}</div>
                    {site.targetDate && (
                      <div style={{fontSize: '11px', color: '#9CA3AF'}}>Due: {site.targetDate}</div>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle'}}>
                    {getStatusBadge(site.status)}
                  </td>

                  {/* Actions */}
                  <td style={{padding: '13px 16px', verticalAlign: 'middle', textAlign: 'right'}}>
                    <div style={{display: 'inline-flex', gap: '6px'}}>
                      <button
                        title="View Details"
                        onClick={() => setSelectedSite(site)}
                        style={{
                          background: '#F3F4F6',
                          border: '1px solid #E5E7EB',
                          padding: '6px 9px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#4B5563',
                          fontSize: '12px'
                        }}
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button
                        title="Edit Site"
                        onClick={() => openEditModal(site)}
                        style={{
                          background: '#F3F4F6',
                          border: '1px solid #E5E7EB',
                          padding: '6px 9px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'var(--gold, #B9782D)',
                          fontSize: '12px'
                        }}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        title="Delete Site"
                        onClick={() => handleDeleteSite(site.id)}
                        style={{
                          background: '#FEE2E2',
                          border: '1px solid #FECACA',
                          padding: '6px 9px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#DC2626',
                          fontSize: '12px'
                        }}
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

      {/* =========================================
          ADD SITE / CUSTOMER MODAL
          ========================================= */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.65)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1250,
          backdropFilter: 'blur(3px)', padding: '16px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            width: '100%', maxWidth: '620px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '92vh', overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 20px', borderBottom: '1px solid #E5E7EB'
            }}>
              <div>
                <h2 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827'}}>
                  Add New Site / Customer
                </h2>
                <span style={{fontSize: '12px', color: '#6B7280'}}>
                  The customer represents the site location and project owner
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'transparent', border: 'none', fontSize: '20px',
                  cursor: 'pointer', color: '#9CA3AF', padding: '4px'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{padding: '20px'}}>
              
              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Site Ref ID
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      fontWeight: '600', color: 'var(--gold, #B9782D)', textTransform: 'uppercase'
                    }}
                    required
                  />
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="Running">Running</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Customer / Site Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Deshmukh"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                    required
                  />
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Site Area / Location *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kothrud, Pune"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                    required
                  />
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    GPS Coordinates (Lat, Lng)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 18.5204, 73.8567"
                    value={formData.latLng}
                    onChange={(e) => setFormData({...formData, latLng: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Full Site Address *
                </label>
                <textarea
                  placeholder="Enter complete site address with building and landmark..."
                  rows="2"
                  value={formData.fullAddress}
                  onChange={(e) => setFormData({...formData, fullAddress: e.target.value})}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit'
                  }}
                  required
                ></textarea>
              </div>

              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Work Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{marginBottom: '18px'}}>
                <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Site Notes & Scope of Work
                </label>
                <textarea
                  placeholder="Details on 2BHK/3BHK interior, woodwork specifications, tiles, etc."
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit'
                  }}
                ></textarea>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #E5E7EB', flexWrap: 'wrap'}}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '6px', border: '1px solid #D1D5DB',
                    background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{padding: '9px 20px'}}
                >
                  <i className="fa-solid fa-check"></i> Save Site / Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          VIEW SITE DETAILS MODAL
          ========================================= */}
      {selectedSite && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.65)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1250,
          backdropFilter: 'blur(3px)', padding: '16px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            width: '100%', maxWidth: '580px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '92vh', overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 20px', borderBottom: '1px solid #E5E7EB',
              background: '#F9FAFB'
            }}>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                  <span style={{
                    background: 'rgba(185, 120, 45, 0.1)',
                    color: 'var(--gold, #B9782D)',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}>
                    {selectedSite.id}
                  </span>
                  <h2 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827'}}>
                    {selectedSite.customerName}
                  </h2>
                </div>
                <div style={{fontSize: '12px', color: '#6B7280', marginTop: '2px'}}>
                  Site Location: <strong>{selectedSite.location}</strong>
                </div>
              </div>
              <button
                onClick={() => setSelectedSite(null)}
                style={{
                  background: 'transparent', border: 'none', fontSize: '20px',
                  cursor: 'pointer', color: '#9CA3AF'
                }}
              >
                &times;
              </button>
            </div>

            <div style={{padding: '20px'}}>
              
              {/* Status and Progress */}
              <div style={{
                background: '#F9FAFB', padding: '14px', borderRadius: '8px',
                border: '1px solid #E5E7EB', marginBottom: '18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600'}}>Current Status</div>
                  <div style={{marginTop: '4px'}}>{getStatusBadge(selectedSite.status)}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div style={{fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: '600'}}>Progress</div>
                  <div style={{fontSize: '18px', fontWeight: '700', color: 'var(--gold, #B9782D)'}}>{selectedSite.progress || 0}%</div>
                </div>
              </div>

              {/* Contact Info */}
              <div style={{marginBottom: '18px'}}>
                <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                  Customer Contact
                </h4>
                <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
                  <div style={{fontSize: '13px'}}>
                    <span style={{color: '#6B7280'}}>Phone: </span>
                    <strong style={{color: '#111827'}}>{selectedSite.phone}</strong>
                  </div>
                  {selectedSite.email && (
                    <div style={{fontSize: '13px'}}>
                      <span style={{color: '#6B7280'}}>Email: </span>
                      <strong style={{color: '#111827'}}>{selectedSite.email}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Site Address & Map */}
              <div style={{marginBottom: '18px'}}>
                <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                  Site Address & Location
                </h4>
                <div style={{
                  padding: '12px 14px', background: '#fff', border: '1px solid #E5E7EB',
                  borderRadius: '6px', fontSize: '13px', color: '#374151', lineHeight: '1.5'
                }}>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <i className="fa-solid fa-map-location-dot" style={{color: 'var(--gold, #B9782D)', marginTop: '3px'}}></i>
                    <div>
                      <div>{selectedSite.fullAddress}</div>
                      {selectedSite.latLng && (
                        <div style={{fontSize: '11px', color: '#6B7280', marginTop: '4px'}}>
                          GPS: {selectedSite.latLng}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div style={{marginBottom: '18px'}}>
                <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                  Timeline
                </h4>
                <div style={{display: 'flex', gap: '20px', fontSize: '13px', flexWrap: 'wrap'}}>
                  <div>
                    <span style={{color: '#6B7280'}}>Started: </span>
                    <strong>{selectedSite.startDate || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{color: '#6B7280'}}>Target Completion: </span>
                    <strong>{selectedSite.targetDate || 'Ongoing'}</strong>
                  </div>
                </div>
              </div>

              {/* Scope & Notes */}
              {selectedSite.notes && (
                <div style={{marginBottom: '18px'}}>
                  <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    Scope of Work / Notes
                  </h4>
                  <div style={{
                    padding: '10px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB',
                    borderRadius: '6px', fontSize: '13px', color: '#4B5563', lineHeight: '1.5'
                  }}>
                    {selectedSite.notes}
                  </div>
                </div>
              )}

              {/* Assigned Staff */}
              {selectedSite.assignedTeam && selectedSite.assignedTeam.length > 0 && (
                <div>
                  <h4 style={{margin: '0 0 8px 0', fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    Assigned Employees
                  </h4>
                  <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                    {selectedSite.assignedTeam.map((emp, i) => (
                      <span key={i} style={{
                        background: '#EEF2FF', color: '#4F46E5', fontSize: '12px',
                        fontWeight: '600', padding: '4px 10px', borderRadius: '15px'
                      }}>
                        <i className="fa-solid fa-user-check" style={{marginRight: '5px'}}></i>
                        {emp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #E5E7EB', flexWrap: 'wrap'}}>
                <button
                  onClick={() => {
                    const siteToEdit = selectedSite;
                    setSelectedSite(null);
                    openEditModal(siteToEdit);
                  }}
                  className="btn-primary"
                  style={{fontSize: '13px', padding: '8px 16px'}}
                >
                  <i className="fa-solid fa-pen"></i> Edit Site Details
                </button>
                <button
                  onClick={() => setSelectedSite(null)}
                  style={{
                    padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB',
                    background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '500'
                  }}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* =========================================
          EDIT SITE MODAL
          ========================================= */}
      {editingSite && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.65)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1250,
          backdropFilter: 'blur(3px)', padding: '16px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            width: '100%', maxWidth: '620px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '92vh', overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 20px', borderBottom: '1px solid #E5E7EB'
            }}>
              <div>
                <h2 style={{margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827'}}>
                  Edit Site / Customer: {editingSite.id}
                </h2>
              </div>
              <button
                onClick={() => setEditingSite(null)}
                style={{
                  background: 'transparent', border: 'none', fontSize: '20px',
                  cursor: 'pointer', color: '#9CA3AF'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{padding: '20px'}}>
              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Customer / Site Name
                  </label>
                  <input
                    type="text"
                    value={editingSite.customerName}
                    onChange={(e) => setEditingSite({...editingSite, customerName: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                    required
                  />
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Status
                  </label>
                  <select
                    value={editingSite.status}
                    onChange={(e) => setEditingSite({...editingSite, status: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="Running">Running</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editingSite.phone}
                    onChange={(e) => setEditingSite({...editingSite, phone: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                    required
                  />
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingSite.email || ''}
                    onChange={(e) => setEditingSite({...editingSite, email: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap'}}>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Location / Area
                  </label>
                  <input
                    type="text"
                    value={editingSite.location}
                    onChange={(e) => setEditingSite({...editingSite, location: e.target.value})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                    required
                  />
                </div>
                <div style={{flex: '1 1 200px'}}>
                  <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                    Progress %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingSite.progress || 0}
                    onChange={(e) => setEditingSite({...editingSite, progress: Number(e.target.value)})}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '6px',
                      border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Full Site Address
                </label>
                <textarea
                  rows="2"
                  value={editingSite.fullAddress}
                  onChange={(e) => setEditingSite({...editingSite, fullAddress: e.target.value})}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit'
                  }}
                  required
                ></textarea>
              </div>

              <div style={{marginBottom: '18px'}}>
                <label style={{display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px'}}>
                  Notes / Work Description
                </label>
                <textarea
                  rows="2"
                  value={editingSite.notes || ''}
                  onChange={(e) => setEditingSite({...editingSite, notes: e.target.value})}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '6px',
                    border: '1px solid #D1D5DB', boxSizing: 'border-box', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit'
                  }}
                ></textarea>
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #E5E7EB', flexWrap: 'wrap'}}>
                <button
                  type="button"
                  onClick={() => setEditingSite(null)}
                  style={{
                    padding: '9px 16px', borderRadius: '6px', border: '1px solid #D1D5DB',
                    background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{padding: '9px 20px'}}
                >
                  <i className="fa-solid fa-check"></i> Update Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default Sites;
