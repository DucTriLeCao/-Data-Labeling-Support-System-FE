import { useState, useEffect } from 'react';
import { getUsersAPI, createUserAPI, updateUserAPI, deleteUserAPI, bulkDeactivateUsersAPI } from '../../api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'annotator',
    status: 'active'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const fetchUsers = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await getUsersAPI(token, pageNumber, pageSize);
      const paginatedData = response || {};
      const usersData = paginatedData.items || [];
      
      setUsers(usersData);
      setTotalCount(paginatedData.totalCount || 0);
      setTotalPages(paginatedData.totalPages || 0);
      setCurrentPage(paginatedData.pageNumber || pageNumber);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Không thể tải danh sách người dùng');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'Annotator',
      status: 'Active'
    });
    setFormError('');
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status
    });
    setFormError('');
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này? (Soft delete - chỉ vô hiệu hóa)')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      await deleteUserAPI(userId, token);
      
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, status: 'inactive' }
          : u
      ));
      setError('');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(`Không thể xóa người dùng: ${err.message}`);
    }
  };

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleToggleAllUsers = () => {
    const activeUserIds = users.filter(u => u.status?.toLowerCase() === 'active').map(u => u.id);
    if (selectedUserIds.length === activeUserIds.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(activeUserIds);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUserIds.length === 0) {
      setError('Vui lòng chọn ít nhất một người dùng');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn vô hiệu hóa ${selectedUserIds.length} người dùng đã chọn?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      await bulkDeactivateUsersAPI(selectedUserIds, token);
      
      setUsers(users.map(u => 
        selectedUserIds.includes(u.id)
          ? { ...u, status: 'inactive' }
          : u
      ));
      setSelectedUserIds([]);
      setError('');
    } catch (err) {
      console.error('Error bulk deactivating users:', err);
      setError(`Không thể vô hiệu hóa người dùng: ${err.message}`);
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setFormError('Vui lòng nhập tên người dùng');
      return false;
    }
    if (!formData.email.trim()) {
      setFormError('Vui lòng nhập email');
      return false;
    }
    if (!formData.email.includes('@')) {
      setFormError('Email không hợp lệ');
      return false;
    }
    if (!editingUser && !formData.password) {
      setFormError('Vui lòng nhập mật khẩu');
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      setFormError('Mật khẩu phải ít nhất 6 ký tự');
      return false;
    }
    return true;
  };

  const handleSaveUser = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      if (editingUser) {
        const updateData = {
          role: formData.role,
          status: formData.status
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await updateUserAPI(editingUser.id, updateData, token);
        const updatedUser = response;

        setUsers(users.map(u => 
          u.id === editingUser.id 
            ? {
                ...u,
                role: updatedUser.role || u.role,
                status: updatedUser.status || u.status,
                username: updatedUser.username || u.username,
                email: updatedUser.email || u.email,
                createdAt: updatedUser.createdAt || u.createdAt
              }
            : u
        ));
      } else {
        const createData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status
        };

        const response = await createUserAPI(createData, token);
        const newUser = response;

        setUsers([...users, {
          ...newUser,
          role: newUser.role || 'annotator',
          status: newUser.status || 'active'
        }]);
      }

      setShowModal(false);
      setError('');
    } catch (err) {
      console.error('Error saving user:', err);
      setFormError(err.message || 'Không thể lưu người dùng');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      'Admin': 'Admin',
      'Manager': 'Manager',
      'Annotator': 'Annotator',
      'Reviewer': 'Reviewer',
      'admin': 'Admin',
      'manager': 'Manager',
      'annotator': 'Annotator',
      'reviewer': 'Reviewer'
    };
    return roleMap[role] || role;
  };

  const getAvatarEmoji = (role) => {
    const emojiMap = {
      'admin': 'A',
      'manager': 'M',
      'annotator': 'An',
      'reviewer': 'R'
    };
    return emojiMap[role?.toLowerCase()] || 'U';
  };

  return (
    <>
      <div className="user-management-header">
        <h1>Quản lý người dùng</h1>
        <button className="add-user-btn" onClick={handleAddUser}>
          Thêm người dùng
        </button>
      </div>

      {selectedUserIds.length > 0 && (
        <div className="bulk-action-toolbar">
          <span className="selected-count">
            Đã chọn {selectedUserIds.length} người dùng
          </span>
          <button 
            className="bulk-deactivate-btn" 
            onClick={handleBulkDeactivate}
          >
            Vô hiệu hóa {selectedUserIds.length}
          </button>
          <button 
            className="bulk-cancel-btn" 
            onClick={() => setSelectedUserIds([])}
          >
            Hủy chọn
          </button>
        </div>
      )}

      {loading && <div className="loading">Đang tải danh sách người dùng...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && users.length === 0 && !error && (
        <div className="empty-state">
          <p>Chưa có người dùng nào trong hệ thống</p>
        </div>
      )}

      {!loading && users.length > 0 && (
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedUserIds.length > 0 && selectedUserIds.length === users.filter(u => u.status?.toLowerCase() === 'active').length}
                  onChange={handleToggleAllUsers}
                  className="select-all-checkbox"
                />
              </th>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(user => user.status?.toLowerCase() === 'active').map(user => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleToggleUser(user.id)}
                    className="user-checkbox"
                  />
                </td>
                <td>
                  <div className="user-info-cell">
                    <div className="user-avatar">{getAvatarEmoji(user.role)}</div>
                    <span>{user.username}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                    {user.status?.toLowerCase() === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td>{user.createdAt || user.created_at || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn edit" onClick={() => handleEditUser(user)}>
                      Sửa
                    </button>
                    <button className="action-btn delete" onClick={() => handleDeleteUser(user.id)}>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination-controls">
          <button 
            className="pagination-btn" 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Trang trước
          </button>
          <span className="pagination-info">
            Trang {currentPage} / {totalPages}
          </span>
          <button 
            className="pagination-btn" 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Trang tiếp
          </button>
        </div>
      </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2>{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h2>
            
            {formError && <div className="form-error">{formError}</div>}
            
            {editingUser && (
              <div className="edit-user-info">
                <p><strong>Tên người dùng:</strong> {editingUser.username}</p>
                <p><strong>Email:</strong> {editingUser.email}</p>
              </div>
            )}
            
            {!editingUser && (
              <>
                <div className="admin-form-group">
                  <label>Tên người dùng</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Nhập tên người dùng"
                    disabled={isSaving}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Nhập email"
                    disabled={isSaving}
                  />
                </div>
              </>
            )}

            <div className="admin-form-group">
              <label>{editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={editingUser ? 'Nhập mật khẩu mới' : 'Nhập mật khẩu'}
                disabled={isSaving}
              />
            </div>

            <div className="admin-form-group">
              <label>Vai trò</label>
              <select name="role" value={formData.role} onChange={handleInputChange} disabled={isSaving}>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Annotator">Annotator</option>
                <option value="Reviewer">Reviewer</option>
              </select>
            </div>

            <div className="admin-modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)} disabled={isSaving}>
                Hủy
              </button>
              <button className="save-btn" onClick={handleSaveUser} disabled={isSaving}>
                {isSaving ? '⏳ Đang lưu...' : (editingUser ? 'Cập nhật' : 'Thêm mới')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UserManagement;
