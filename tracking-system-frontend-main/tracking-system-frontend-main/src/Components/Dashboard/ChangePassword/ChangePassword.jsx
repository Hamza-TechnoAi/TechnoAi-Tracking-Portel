import { useState } from 'react';
import { toast } from 'react-toastify';
import { getFriendlyErrorMessage } from '../../../Api/api';
import { changePassword } from '../../../Services/authService';
import '../ProfileSettings/ProfileSettings.scss';

const INITIAL_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ChangePassword() {
  const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD_FORM);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const handlePasswordChange = (field) => (event) => {
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6 || passwordForm.newPassword.length > 16) {
      errors.newPassword = 'Password must be between 6 and 16 characters';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!validatePasswordForm()) return;

    setIsPasswordSaving(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm(INITIAL_PASSWORD_FORM);
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to change password.'));
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <section className="profile-settings">
      <div className="profile-settings__head">
        <div>
          <h1 className="profile-settings__title">Password</h1>
          <p className="profile-settings__subtitle">
            Update your account password.
          </p>
        </div>
      </div>

      <article className="profile-settings__card profile-settings__card--full">
        <form className="profile-settings__form" onSubmit={handlePasswordSubmit}>
          <div className="profile-settings__form-grid profile-settings__form-grid--password">
            <div className="profile-settings__field profile-settings__field--full">
              <label className="profile-settings__label" htmlFor="currentPassword">Current password</label>
              <input
                id="currentPassword"
                type="password"
                className="profile-settings__input"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange('currentPassword')}
              />
              {passwordErrors.currentPassword && (
                <p className="profile-settings__error">{passwordErrors.currentPassword}</p>
              )}
            </div>

            <div className="profile-settings__field">
              <label className="profile-settings__label" htmlFor="newPassword">New password</label>
              <input
                id="newPassword"
                type="password"
                className="profile-settings__input"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange('newPassword')}
              />
              {passwordErrors.newPassword && (
                <p className="profile-settings__error">{passwordErrors.newPassword}</p>
              )}
            </div>

            <div className="profile-settings__field">
              <label className="profile-settings__label" htmlFor="confirmPassword">Confirm new password</label>
              <input
                id="confirmPassword"
                type="password"
                className="profile-settings__input"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange('confirmPassword')}
              />
              {passwordErrors.confirmPassword && (
                <p className="profile-settings__error">{passwordErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button type="submit" className="profile-settings__save-btn" disabled={isPasswordSaving}>
            {isPasswordSaving ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </article>
    </section>
  );
}
