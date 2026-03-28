import { useState, useEffect, useRef } from 'react';
import { getProjectsAPI } from '../../api';

function ProjectSearchSelect({ value, onChange, disabled = false }) {
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadProjects();
  }, [pageNumber, search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await getProjectsAPI(token, pageNumber, 20, search);
      console.log('Projects API response:', response);
      // Backend returns lowercase camelCase: items, totalCount, pageNumber, pageSize, totalPages
      const projectsList = response.items || [];
      console.log('Extracted projects:', projectsList);
      setProjects(Array.isArray(projectsList) ? projectsList : []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Error loading projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === value);

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
        placeholder="Tìm kiếm dự án..."
        value={isOpen ? search : selectedProject?.name || ''}
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
          ) : projects.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>
              Không tìm thấy dự án
            </div>
          ) : (
            <>
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => {
                    onChange(project.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: value === project.id ? '#dbeafe' : 'white',
                    borderBottom: '1px solid #f3f4f6',
                    ':hover': { background: '#f9fafb' }
                  }}
                >
                  <div style={{ fontWeight: 500, color: '#1f2937' }}>{project.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {project.description}
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

export default ProjectSearchSelect;
