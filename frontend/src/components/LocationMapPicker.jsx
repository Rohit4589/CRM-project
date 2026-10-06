import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LocationMapPicker = ({
  isOpen,
  onClose,
  initialLatLng = '',
  initialAddress = '',
  initialLocation = '',
  onSelectLocation
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Parse initial coordinates or default to Pune center (18.5204, 73.8567)
  const parseCoordinates = (str) => {
    if (!str || typeof str !== 'string') return null;
    const parts = str.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  };

  const parsedInitial = parseCoordinates(initialLatLng);
  const [coords, setCoords] = useState(parsedInitial);
  const [addressPreview, setAddressPreview] = useState(initialAddress || initialLocation || '');
  const [searchQuery, setSearchQuery] = useState(initialAddress || initialLocation || '');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [updateAddressInForm, setUpdateAddressInForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Custom Gold Pin Marker Icon
  const createPinIcon = () => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          position: relative;
          width: 36px;
          height: 36px;
          background: #B9782D;
          border: 3px solid #FFFFFF;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(185, 120, 45, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <i class="fa-solid fa-location-dot" style="
            color: #FFFFFF;
            font-size: 16px;
            transform: rotate(45deg);
          "></i>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
  };

  // Reverse Geocode
  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      setReverseGeocoding(true);
      setErrorMessage('');
      const res = await fetch(`http://localhost:5000/api/geocode/reverse?lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data.success && data.displayName) {
        setAddressPreview(data.displayName);
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    } finally {
      setReverseGeocoding(false);
    }
  };

  // Search Address / Landmark
  const handleSearchAddress = async (queryToSearch) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q) {
      setErrorMessage('Please enter an address or area to search.');
      return;
    }

    try {
      setSearching(true);
      setErrorMessage('');
      setSearchResults([]);
      const res = await fetch(`http://localhost:5000/api/geocode/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (data.success && data.results && data.results.length > 0) {
        setSearchResults(data.results);
        // Automatically select the first result
        applyLocation(data.results[0].lat, data.results[0].lon, data.results[0].displayName, 16);
      } else {
        setErrorMessage(`No map location found for "${q}". Try another landmark or area name.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setErrorMessage('Unable to connect to location search service.');
    } finally {
      setSearching(false);
    }
  };

  // Move marker & update position
  const applyLocation = (lat, lng, label = '', zoomLevel = null) => {
    const roundedLat = parseFloat(Number(lat).toFixed(5));
    const roundedLng = parseFloat(Number(lng).toFixed(5));
    setCoords({ lat: roundedLat, lng: roundedLng });

    if (label) {
      setAddressPreview(label);
    } else {
      fetchAddressFromCoords(roundedLat, roundedLng);
    }

    if (mapInstanceRef.current) {
      const zoom = zoomLevel || mapInstanceRef.current.getZoom();
      mapInstanceRef.current.flyTo([roundedLat, roundedLng], zoom, { duration: 1 });

      if (markerRef.current) {
        markerRef.current.setLatLng([roundedLat, roundedLng]);
        markerRef.current.bindPopup(`<b>Selected Site Location</b><br>${roundedLat}, ${roundedLng}`).openPopup();
      } else {
        const marker = L.marker([roundedLat, roundedLng], {
          icon: createPinIcon(),
          draggable: true
        }).addTo(mapInstanceRef.current);

        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          applyLocation(newPos.lat, newPos.lng);
        });

        marker.bindPopup(`<b>Selected Site Location</b><br>${roundedLat}, ${roundedLng}`).openPopup();
        markerRef.current = marker;
      }
    }
  };

  // Use Browser Current GPS Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setSearching(true);
    setErrorMessage('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSearching(false);
        const { latitude, longitude } = pos.coords;
        applyLocation(latitude, longitude, '', 16);
      },
      (err) => {
        setSearching(false);
        setErrorMessage('Could not retrieve current location. Please grant location permissions or pick on map.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Initialize Map when modal is opened
  useEffect(() => {
    if (!isOpen) return;

    const initialPos = coords || { lat: 18.5204, lng: 73.8567 }; // Pune default
    const initialZoom = coords ? 15 : 12;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [initialPos.lat, initialPos.lng],
        zoom: initialZoom,
        zoomControl: true,
      });

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add marker if coordinates exist
      if (coords) {
        const marker = L.marker([coords.lat, coords.lng], {
          icon: createPinIcon(),
          draggable: true
        }).addTo(map);

        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          applyLocation(newPos.lat, newPos.lng);
        });

        marker.bindPopup(`<b>Selected Site Location</b><br>${coords.lat}, ${coords.lng}`).openPopup();
        markerRef.current = marker;
      }

      // Map click handler: click anywhere to place marker & fetch coords
      map.on('click', (e) => {
        applyLocation(e.latlng.lat, e.latlng.lng);
      });

      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  // If search query is prefilled from address and no initial coords, auto-search
  useEffect(() => {
    if (isOpen && !coords && (initialAddress || initialLocation)) {
      const q = initialAddress || initialLocation;
      setSearchQuery(q);
      handleSearchAddress(q);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (coords) {
      const formattedLatLng = `${coords.lat}, ${coords.lng}`;
      onSelectLocation({
        latLng: formattedLatLng,
        address: updateAddressInForm && addressPreview ? addressPreview : null
      });
    } else {
      // Cleared / optional
      onSelectLocation({ latLng: '', address: null });
    }
    onClose();
  };

  const handleClear = () => {
    setCoords(null);
    setAddressPreview('');
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1300, backdropFilter: 'blur(4px)', padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '780px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#F8FAFC'
        }}>
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(185, 120, 45, 0.12)', color: 'var(--gold, #B9782D)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px'
              }}>
                <i className="fa-solid fa-map-location-dot"></i>
              </div>
              <div>
                <h3 style={{margin: 0, fontSize: '17px', fontWeight: '700', color: '#0F172A'}}>
                  Pick Site Location on Map
                </h3>
                <span style={{fontSize: '12px', color: '#64748B'}}>
                  Click anywhere on map, drag the pin, or search address to fetch coordinates
                </span>
              </div>
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span style={{
              fontSize: '11px', background: '#F1F5F9', color: '#475569',
              padding: '3px 8px', borderRadius: '12px', fontWeight: '600'
            }}>
              Optional Field
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none', fontSize: '22px',
                cursor: 'pointer', color: '#94A3B8', padding: '0 4px', lineHeight: 1
              }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div style={{padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF'}}>
          <form onSubmit={(e) => { e.preventDefault(); handleSearchAddress(); }} style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
            <div style={{flex: '1 1 300px', position: 'relative'}}>
              <i className="fa-solid fa-magnifying-glass" style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: '#94A3B8', fontSize: '13px'
              }}></i>
              <input
                type="text"
                placeholder="Type address, building, or area (e.g. Baner, Pune or FC Road)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 34px', borderRadius: '6px',
                  border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              style={{
                padding: '9px 16px', background: 'var(--navy, #0F172A)', color: '#FFFFFF',
                border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                cursor: searching ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {searching ? (
                <><i className="fa-solid fa-spinner fa-spin"></i> Searching...</>
              ) : (
                <><i className="fa-solid fa-search"></i> Fetch from Address</>
              )}
            </button>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={searching}
              style={{
                padding: '9px 14px', background: 'rgba(185, 120, 45, 0.1)', color: 'var(--gold, #B9782D)',
                border: '1px solid rgba(185, 120, 45, 0.3)', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
              title="Use current device GPS location"
            >
              <i className="fa-solid fa-crosshairs"></i> My GPS
            </button>
          </form>

          {/* Search suggestions dropdown if multiple */}
          {searchResults.length > 1 && (
            <div style={{
              marginTop: '8px', padding: '8px', background: '#F8FAFC',
              border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px'
            }}>
              <div style={{fontWeight: '600', color: '#475569', marginBottom: '4px'}}>
                Matching Locations (Click to jump):
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                {searchResults.slice(0, 3).map((res, i) => (
                  <div
                    key={i}
                    onClick={() => applyLocation(res.lat, res.lon, res.displayName, 16)}
                    style={{
                      padding: '5px 8px', borderRadius: '4px', cursor: 'pointer',
                      background: '#FFFFFF', border: '1px solid #E2E8F0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--gold, #B9782D)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
                  >
                    <span style={{color: '#1E293B', fontWeight: '500'}}>
                      <i className="fa-solid fa-location-dot" style={{color: 'var(--gold, #B9782D)', marginRight: '6px'}}></i>
                      {res.displayName}
                    </span>
                    <span style={{color: '#64748B', fontSize: '11px', whiteSpace: 'nowrap'}}>
                      {res.lat.toFixed(4)}, {res.lon.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div style={{
              marginTop: '8px', padding: '7px 10px', background: '#FEF2F2',
              border: '1px solid #FECACA', borderRadius: '6px', color: '#B91C1C',
              fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <i className="fa-solid fa-circle-exclamation"></i>
              {errorMessage}
            </div>
          )}
        </div>

        {/* Map View */}
        <div style={{position: 'relative', flex: 1, minHeight: '340px', background: '#E2E8F0'}}>
          <div ref={mapContainerRef} style={{width: '100%', height: '100%', minHeight: '340px'}} />

          {/* Floating Map Helper Badge */}
          <div style={{
            position: 'absolute', bottom: '12px', left: '12px', zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.85)', color: '#FFFFFF', backdropFilter: 'blur(4px)',
            padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '500',
            display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'none'
          }}>
            <i className="fa-solid fa-hand-pointer" style={{color: 'var(--gold, #B9782D)'}}></i>
            Click on map or drag pin to adjust coordinates
          </div>
        </div>

        {/* Current Selection Status Bar */}
        <div style={{
          padding: '12px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
        }}>
          <div style={{flex: '1 1 300px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '12px', fontWeight: '700', color: '#334155'}}>
                Selected Coordinates:
              </span>
              {coords ? (
                <span style={{
                  fontFamily: 'monospace', fontSize: '13px', fontWeight: '700',
                  color: 'var(--gold, #B9782D)', background: 'rgba(185, 120, 45, 0.1)',
                  padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(185, 120, 45, 0.25)'
                }}>
                  {coords.lat}, {coords.lng}
                </span>
              ) : (
                <span style={{fontSize: '12px', color: '#94A3B8', fontStyle: 'italic'}}>
                  None selected (Optional)
                </span>
              )}
            </div>

            {addressPreview && (
              <div style={{fontSize: '12px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'flex-start', gap: '6px'}}>
                <i className="fa-solid fa-map-pin" style={{color: 'var(--gold, #B9782D)', marginTop: '2px'}}></i>
                <span style={{lineHeight: '1.4'}}>
                  {reverseGeocoding ? 'Detecting address...' : addressPreview}
                </span>
              </div>
            )}

            {addressPreview && (
              <label style={{
                display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px',
                fontSize: '12px', color: '#334155', cursor: 'pointer', fontWeight: '500'
              }}>
                <input
                  type="checkbox"
                  checked={updateAddressInForm}
                  onChange={(e) => setUpdateAddressInForm(e.target.checked)}
                />
                Also update Site Address field with this location
              </label>
            )}
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            {coords && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: '8px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1',
                  color: '#64748B', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Clear Location
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px', background: '#FFFFFF', border: '1px solid #CBD5E1',
                color: '#334155', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                padding: '8px 18px', background: 'var(--gold, #B9782D)', color: '#FFFFFF',
                border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 2px 6px rgba(185, 120, 45, 0.3)'
              }}
            >
              <i className="fa-solid fa-check"></i> Apply Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMapPicker;
