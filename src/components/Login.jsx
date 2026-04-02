import { useState } from 'react';
import { loginAPI } from '../api';
import './Auth.css';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await loginAPI(email, password);
      
      // Store token in localStorage
      if (response.data?.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
      }
      
      // Extract user from nested data structure
      const user = response.data?.user;
      
      // Validate that user has required fields
      if (!user || !user.role) {
        setError('Lỗi: Không thể xác định vai trò người dùng. Vui lòng thử lại.');
        setLoading(false);
        return;
      }
      
      // Normalize role to lowercase (API returns capitalized: "Admin" -> "admin")
      const normalizedUser = {
        ...user,
        role: user.role.toLowerCase()
      };
      
      onLoginSuccess(normalizedUser);
    } catch (err) {
      const errorMsg = err.message || 'Đăng nhập thất bại';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Đăng nhập</h1>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label className="form-label">Mật khẩu</label>
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                <img 
                  src={showPassword ? '/eye_open.png' : '/eye_close.png'} 
                  alt="" 
                  className="eye-icon" 
                />
                <span>{showPassword ? 'Hiện' : 'Ẩn'}</span>
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>


    </div>
  );
}

export default Login;
