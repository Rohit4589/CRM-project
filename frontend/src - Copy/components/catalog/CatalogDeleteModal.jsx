import React from 'react';

const CatalogDeleteModal = ({ title, message, itemName, onClose, onConfirm, deleting = false }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(30, 24, 20, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '28px 24px 22px 24px',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(43, 37, 32, 0.18)',
          border: '1px solid #EAE4DD',
          animation: 'fadeInScale 0.18s ease-out'
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            margin: '0 auto 16px auto'
          }}
        >
          <i className="fa-solid fa-trash-can"></i>
        </div>

        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '700',
            color: '#2B2520'
          }}
        >
          {title || 'Confirm Deletion'}
        </h3>

        <p
          style={{
            margin: '0 0 8px 0',
            fontSize: '13.5px',
            color: '#4A3E36',
            lineHeight: '1.5'
          }}
        >
          Are you sure you want to delete <strong style={{ color: '#822D16' }}>{itemName}</strong>?
        </p>

        {message && (
          <p
            style={{
              margin: '0 0 20px 0',
              fontSize: '12px',
              color: '#8C827A',
              lineHeight: '1.4'
            }}
          >
            {message}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #DCD4CA',
              background: '#FAF8F5',
              color: '#5C5248',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: deleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#DC2626',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: deleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
              transition: 'all 0.15s'
            }}
          >
            {deleting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-trash-can"></i>
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CatalogDeleteModal;
