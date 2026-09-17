import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdEye, IoMdEyeOff } from 'react-icons/io';
import { toast } from 'react-toastify';
import { useAuth } from '../../../Context/AuthContext';
import { loginUser } from '../../../Services/authService';
import { getFriendlyErrorMessage } from '../../../Api/api';
import './LoginForm.scss';

const INITIAL_FORM = {
  username: '',
  password: '',
};

export default function LoginForm({ idPrefix = 'login' }) {
  const navigate = useNavigate();
  const { handleLogin } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
    setServerError('');
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Email or phone is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6 || formData.password.length > 16) {
      errors.password = 'Password must be between 6 and 16 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError('');

    try {
      const response = await loginUser({
        username: formData.username.trim(),
        password: formData.password,
      });

      localStorage.setItem('token', response.token);
      handleLogin(response.user);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      setServerError(getFriendlyErrorMessage(error, 'Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="login-form__field">
        <label className="login-form__label" htmlFor={`${idPrefix}-username`}>
          Email Address
        </label>
        <input
          id={`${idPrefix}-username`}
          type="text"
          className="login-form__input"
          value={formData.username}
          onChange={handleChange('username')}
          placeholder="admin@technoai.ae"
          autoComplete="username"
        />
        {formErrors.username && (
          <p className="login-form__error">{formErrors.username}</p>
        )}
      </div>

      <div className="login-form__field">
        <div className="login-form__label-row">
          <label className="login-form__label" htmlFor={`${idPrefix}-password`}>Password</label>
          <button type="button" className="login-form__forgot">Forgot password?</button>
        </div>
        <div className="login-form__password-wrap">
          <input
            id={`${idPrefix}-password`}
            type={showPassword ? 'text' : 'password'}
            className="login-form__input"
            value={formData.password}
            onChange={handleChange('password')}
            placeholder="Enter password"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="login-form__toggle-password"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <IoMdEyeOff size={20} /> : <IoMdEye size={20} />}
          </button>
        </div>
        {formErrors.password && (
          <p className="login-form__error">{formErrors.password}</p>
        )}
      </div>

      {serverError && <p className="login-form__error">{serverError}</p>}

      <label className="login-form__remember">
        <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
        <span>Remember me</span>
      </label>

      <button type="submit" className="login-form__submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
