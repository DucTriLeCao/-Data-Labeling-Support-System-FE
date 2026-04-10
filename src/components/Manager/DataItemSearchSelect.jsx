import { useState, useEffect, useRef } from 'react';
import { getDataItemsAPI } from '../../api';

function DataItemSearchSelect({ datasetId, value, onChange, disabled = false }) {
  const [search, setSearch] = useState('');
  const [dataItems, setDataItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (datasetId) {
      loadDataItems();
    } else {
      setDataItems([]);
    }
  }, [datasetId, pageNumber, search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDataItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await getDataItemsAPI(datasetId, token, pageNumber, 20, search);
      console.log('Data items API response:', response);
      const itemsList = response.items || [];
      console.log('Extracted data items:', itemsList);
      setDataItems(Array.isArray(itemsList) ? itemsList : []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Error loading data items:', err);
      setDataItems([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = dataItems.find(i => i.id === value);

  if (!datasetId) {
    return (
      <input
        type="text"
        placeholder="Chọn bộ dữ liệu trước"
        disabled
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '14px',
          background: '#f3f4f6',
          color: '#9ca3af',
          boxSizing: 'border-box'
        }}
      />
    );
  }

  return (
    <div 
      ref={dropdownRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%'
      }}
    >
      <input
        type="text"
        placeholder="Tìm kiếm mục dữ liệu..."
        value={isOpen ? search : selectedItem?.content || ''}
        onChange={(e) => {
          setSearch(e.target.value);
          setPageNumber(1);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '14px',
          boxSizing: 'border-box'
        }}
      />

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
              Đang tải...
            </div>
          ) : dataItems.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>
              Không tìm thấy mục dữ liệu
            </div>
          ) : (
            <>
              {dataItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    onChange(item.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: value === item.id ? '#dbeafe' : 'white',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <div style={{ fontWeight: 500, color: '#1f2937' }}>ID: {item.id}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.content}
                  </div>
                </div>
              ))}
              
              {totalPages > 1 && (
                <div style={{ padding: '8px', display: 'flex', gap: '8px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <button
                    onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                    disabled={pageNumber === 1}
                    style={{
                      flex: 1,
                      padding: '6px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      background: pageNumber === 1 ? '#f3f4f6' : 'white',
                      cursor: pageNumber === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ← Trước
                  </button>
                  <button
                    onClick={() => setPageNumber(Math.min(totalPages, pageNumber + 1))}
                    disabled={pageNumber === totalPages}
                    style={{
                      flex: 1,
                      padding: '6px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      background: pageNumber === totalPages ? '#f3f4f6' : 'white',
                      cursor: pageNumber === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Tiếp →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DataItemSearchSelect;
