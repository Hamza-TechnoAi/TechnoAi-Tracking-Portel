import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getFriendlyErrorMessage } from '../../../Api/api';
import { ROLE_LABELS } from '../../../Constants/roles';
import { useAuth } from '../../../Context/AuthContext';
import { fetchAccount } from '../../../Services/authService';
import { updateProfile } from '../../../Services/userService';
import './ProfileSettings.scss';

const buildProfileForm = (user) => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email?.address || '',
  countryCode: user?.phone?.countryCode || '+971',
  phoneNumber: user?.phone?.number || '',
});

export default function ProfileSettings() {
  const { user, setUser } = useAuth();
  const [profileForm, setProfileForm] = useState(buildProfileForm(user));
  const [profileErrors, setProfileErrors] = useState({});
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadAccount = useCallback(async () => {
    setIsLoading(true);
    try {
      const account = await fetchAccount();
      setUser(account);
      setProfileForm(buildProfileForm(account));
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Unable to load profile.'));
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const handleProfileChange = (field) => (event) => {
    setProfileForm((prev) => ({ ...prev, [field]: event.target.value }));
    setProfileErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!profileForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!profileForm.lastName.trim()) errors.lastName = 'Last name is required';
    if (!profileForm.email.trim()) errors.email = 'Email is required';
    if (!profileForm.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!validateProfileForm() || !user?._id) return;

    setIsProfileSaving(true);
    try {
      const response = await updateProfile({
        _id: user._id,
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: { address: profileForm.email.trim() },
        phone: {
          countryCode: profileForm.countryCode.trim(),
          number: profileForm.phoneNumber.trim(),
        },
      });

      setUser(response.data);
      setProfileForm(buildProfileForm(response.data));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to update profile.'));
    } finally {
      setIsProfileSaving(false);
    }
  };

  return (
    <section className="profile-settings">
      <div className="profile-settings__head">
        <div>
          <h1 className="profile-settings__title">Profile</h1>
          <p className="profile-settings__subtitle">
            Update your account details.
          </p>
        </div>
        {user?.role && (
          <span className="profile-settings__role-badge">
            {ROLE_LABELS[user.role] || user.role}
          </span>
        )}
      </div>

      <article className="profile-settings__card profile-settings__card--full">
        {isLoading ? (
          <div className="profile-settings__state">
            <div className="profile-settings__loader" aria-hidden />
            <p>Loading profile...</p>
          </div>
        ) : (
          <form className="profile-settings__form" onSubmit={handleProfileSubmit}>
            <div className="profile-settings__form-grid">
              <div className="profile-settings__field">
                <label className="profile-settings__label" htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  className="profile-settings__input"
                  value={profileForm.firstName}
                  onChange={handleProfileChange('firstName')}
                />
                {profileErrors.firstName && (
                  <p className="profile-settings__error">{profileErrors.firstName}</p>
                )}
              </div>

              <div className="profile-settings__field">
                <label className="profile-settings__label" htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  className="profile-settings__input"
                  value={profileForm.lastName}
                  onChange={handleProfileChange('lastName')}
                />
                {profileErrors.lastName && (
                  <p className="profile-settings__error">{profileErrors.lastName}</p>
                )}
              </div>

              <div className="profile-settings__field">
                <label className="profile-settings__label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="profile-settings__input"
                  value={profileForm.email}
                  onChange={handleProfileChange('email')}
                />
                {profileErrors.email && (
                  <p className="profile-settings__error">{profileErrors.email}</p>
                )}
              </div>

              <div className="profile-settings__field">
                <label className="profile-settings__label" htmlFor="phoneNumber">Phone number</label>
                <div className="profile-settings__phone-row">
                  <input
                    id="countryCode"
                    className="profile-settings__input profile-settings__input--code"
                    value={profileForm.countryCode}
                    onChange={handleProfileChange('countryCode')}
                    aria-label="Country code"
                  />
                  <input
                    id="phoneNumber"
                    className="profile-settings__input"
                    value={profileForm.phoneNumber}
                    onChange={handleProfileChange('phoneNumber')}
                  />
                </div>
                {profileErrors.phoneNumber && (
                  <p className="profile-settings__error">{profileErrors.phoneNumber}</p>
                )}
              </div>
            </div>

            <button type="submit" className="profile-settings__save-btn" disabled={isProfileSaving}>
              {isProfileSaving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        )}
      </article>
    </section>
  );
}
