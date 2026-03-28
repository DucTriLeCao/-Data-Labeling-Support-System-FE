import { useState } from 'react';
import { loginAPI, forgotPasswordAPI, resetPasswordAPI } from '../api';
import './Auth.css';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: reset password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');

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

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const response = await forgotPasswordAPI(forgotEmail);
      setForgotSuccess('Kiểm tra email của bạn để lấy liên kết đặt lại mật khẩu');
      // Move to step 2 after successful request
      setTimeout(() => {
        setForgotStep(2);
      }, 1500);
    } catch (err) {
      setForgotError(err.message || 'Không thể gửi yêu cầu đặt lại mật khẩu');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (newPassword !== confirmPassword) {
      setForgotError('Mật khẩu không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (!userId || !resetToken) {
      setForgotError('Thông tin đặt lại mật khẩu không hợp lệ');
      return;
    }

    setForgotLoading(true);

    try {
      const response = await resetPasswordAPI(userId, resetToken, newPassword, confirmPassword);
      setForgotSuccess('Mật khẩu đã được đặt lại thành công. Đang đóng...');
      setTimeout(() => {
        closeForgotPassword();
      }, 1500);
    } catch (err) {
      setForgotError(err.message || 'Không thể đặt lại mật khẩu. Token có thể đã hết hạn.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotEmail('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setUserId('');
    setForgotError('');
    setForgotSuccess('');
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

          <a 
            href="#" 
            className="forgot-password"
            onClick={(e) => {
              e.preventDefault();
              setShowForgotPassword(true);
            }}
          >
            Quên mật khẩu ?
          </a>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>

      {showForgotPassword && (
        <div className="modal-overlay" onClick={closeForgotPassword}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Đặt lại mật khẩu</h2>
              <button className="modal-close" onClick={closeForgotPassword}>✕</button>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPasswordRequest}>
                {forgotError && <div className="error-message">{forgotError}</div>}
                {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}
                
                <div className="form-group">
                  <label className="form-label">Email hoặc Tên đăng nhập</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nhập email hoặc tên đăng nhập của bạn"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-button" disabled={forgotLoading}>
                  {forgotLoading ? 'Đang gửi...' : 'Gửi yêu cầu đặt lại'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                {forgotError && <div className="error-message">{forgotError}</div>}
                {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}
                
                <div className="form-group">
                  <label className="form-label">ID người dùng</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Nhập ID người dùng của bạn"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mã đặt lại (từ email)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nhập mã đặt lại từ email"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-button" disabled={forgotLoading}>
                  {forgotLoading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
