import { useCallback, useEffect, useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { toast } from 'react-toastify';
import {
  CREATABLE_STAFF_ROLES,
  ROLE_LABELS,
  USER_ROLES,
} from '../../../Constants/roles';
import {
  changePasswordByAdmin,
  createStaffUser,
  deleteUser,
  fetchUsers,
  toggleBlockUser,
} from '../../../Services/userService';
import { getFriendlyErrorMessage } from '../../../Api/api';
import ConfirmToast from '../../../Design/ConfirmToast/ConfirmToast';
import ServerErrorState from '../../Common/ServerErrorState/ServerErrorState';
import { useAuth } from '../../../Context/AuthContext';
import './UserManagement.scss';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  countryCode: '+971',
  phoneNumber: '',
  role: USER_ROLES.DATA_ENTRY,
  password: '',
};

const INITIAL_RESET_PASSWORD_FORM = {
  newPassword: '',
  confirmPassword: '',
};

const PANEL_CLOSE_MS = 320;

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelActive, setIsPanelActive] = useState(false);
  const [panelMode, setPanelMode] = useState('create');
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPasswordForm, setResetPasswordForm] = useState(INITIAL_RESET_PASSWORD_FORM);
  const [resetPasswordErrors, setResetPasswordErrors] = useState({});
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await fetchUsers();
      setUsers(response.data || []);
    } catch (error) {
      setLoadError(getFriendlyErrorMessage(error, 'Unable to load users. Please refresh the page and try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!isPanelOpen) return undefined;

    const frame = requestAnimationFrame(() => {
      setIsPanelActive(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [isPanelOpen]);

  const openPanel = () => {
    setPanelMode('create');
    setResetPasswordUser(null);
    setResetPasswordForm(INITIAL_RESET_PASSWORD_FORM);
    setResetPasswordErrors({});
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setIsPanelOpen(true);
  };

  const openResetPasswordPanel = (user) => {
    setPanelMode('resetPassword');
    setResetPasswordUser(user);
    setResetPasswordForm(INITIAL_RESET_PASSWORD_FORM);
    setResetPasswordErrors({});
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelActive(false);
    window.setTimeout(() => {
      setIsPanelOpen(false);
      setPanelMode('create');
      setResetPasswordUser(null);
      setResetPasswordForm(INITIAL_RESET_PASSWORD_FORM);
      setResetPasswordErrors({});
      setFormData(INITIAL_FORM);
      setFormErrors({});
    }, PANEL_CLOSE_MS);
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6 || formData.password.length > 16) {
      errors.password = 'Password must be between 6 and 16 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPasswordChange = (field) => (event) => {
    setResetPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
    setResetPasswordErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateResetPasswordForm = () => {
    const errors = {};

    if (!resetPasswordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (resetPasswordForm.newPassword.length < 6 || resetPasswordForm.newPassword.length > 16) {
      errors.newPassword = 'Password must be between 6 and 16 characters';
    }

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setResetPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!validateResetPasswordForm() || !resetPasswordUser?._id) return;

    setIsSaving(true);
    try {
      await changePasswordByAdmin(resetPasswordUser._id, resetPasswordForm.newPassword);
      toast.success('Password reset successfully');
      closePanel();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to reset password.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await createStaffUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: { address: formData.email.trim() },
        phone: {
          countryCode: formData.countryCode.trim(),
          number: formData.phoneNumber.trim(),
        },
        role: formData.role,
        password: formData.password,
      });

      toast.success('Staff user created successfully');
      closePanel();
      loadUsers();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to create user.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBlock = async (userId, isBlocked) => {
    try {
      await toggleBlockUser(userId, !isBlocked);
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
      loadUsers();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Action failed.'));
    }
  };

  const handleDelete = (userId) => {
    setConfirmDialog({
      title: 'Delete user',
      message: 'Delete this user permanently? This action cannot be undone.',
      confirmLabel: 'Delete',
      action: async () => {
        try {
          await deleteUser(userId);
          toast.success('User deleted');
          loadUsers();
        } catch (error) {
          toast.error(getFriendlyErrorMessage(error, 'Failed to delete user.'));
        }
      },
    });
  };

  return (
    <section className="user-management">
      <div className="user-management__head">
        <div>
          <h1 className="user-management__title">User Management</h1>
          <p className="user-management__subtitle">
            Create data entry and viewer accounts for your team.
          </p>
        </div>
        <button
          type="button"
          className="user-management__add-btn"
          onClick={openPanel}
        >
          + Add User
        </button>
      </div>

      {loadError ? (
        <ServerErrorState message={loadError} onRetry={loadUsers} retryLabel="Try again" />
      ) : (
        <div className="user-management__table-wrap">
          {isLoading ? (
            <div className="user-management__state">
              <div className="user-management__loader" aria-hidden />
              <p>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <p className="user-management__empty">No users found.</p>
          ) : (
            <table className="user-management__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user._id === currentUser?._id;

                  return (
                    <tr key={user._id}>
                      <td>{[user.firstName, user.lastName].filter(Boolean).join(' ')}</td>
                      <td>{user.email?.address}</td>
                      <td>
                        {[user.phone?.countryCode, user.phone?.number].filter(Boolean).join(' ')}
                      </td>
                      <td>
                        <span className="user-management__badge">
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`user-management__badge${user.isBlocked ? ' is-blocked' : ''}`}
                        >
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="user-management__actions">
                          {!isSelf && (
                            <>
                              <button
                                type="button"
                                className="user-management__action-btn"
                                onClick={() => openResetPasswordPanel(user)}
                              >
                                Reset password
                              </button>
                              <button
                                type="button"
                                className="user-management__action-btn"
                                onClick={() => handleToggleBlock(user._id, user.isBlocked)}
                              >
                                {user.isBlocked ? 'Unblock' : 'Block'}
                              </button>
                              <button
                                type="button"
                                className="user-management__action-btn is-danger"
                                onClick={() => handleDelete(user._id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {isPanelOpen && (
        <>
          <div
            className={`user-management__panel-overlay${isPanelActive ? ' is-active' : ''}`}
            onClick={closePanel}
            role="presentation"
          />
          <aside className={`user-management__panel${isPanelActive ? ' is-active' : ''}`}>
            <div className="user-management__panel-header">
              <h2 className="user-management__panel-title">
                {panelMode === 'resetPassword' ? 'Reset user password' : 'Create Staff User'}
              </h2>
              <button
                type="button"
                className="user-management__panel-close"
                onClick={closePanel}
                aria-label="Close panel"
              >
                <IoMdClose size={22} />
              </button>
            </div>

            {panelMode === 'resetPassword' ? (
              <form className="user-management__form" onSubmit={handleResetPassword}>
                <p className="user-management__panel-note">
                  Set a new password for{' '}
                  <strong>
                    {[resetPasswordUser?.firstName, resetPasswordUser?.lastName].filter(Boolean).join(' ')}
                  </strong>
                  .
                </p>

                <div className="user-management__form-grid user-management__form-grid--single">
                  <div className="user-management__field user-management__field--full">
                    <label className="user-management__label" htmlFor="newPassword">New password</label>
                    <input
                      id="newPassword"
                      type="password"
                      className="user-management__input"
                      value={resetPasswordForm.newPassword}
                      onChange={handleResetPasswordChange('newPassword')}
                    />
                    {resetPasswordErrors.newPassword && (
                      <p className="user-management__error">{resetPasswordErrors.newPassword}</p>
                    )}
                  </div>

                  <div className="user-management__field user-management__field--full">
                    <label className="user-management__label" htmlFor="confirmPassword">Confirm password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      className="user-management__input"
                      value={resetPasswordForm.confirmPassword}
                      onChange={handleResetPasswordChange('confirmPassword')}
                    />
                    {resetPasswordErrors.confirmPassword && (
                      <p className="user-management__error">{resetPasswordErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="user-management__panel-actions">
                  <button type="button" className="user-management__cancel-btn" onClick={closePanel}>
                    Cancel
                  </button>
                  <button type="submit" className="user-management__save-btn" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Reset password'}
                  </button>
                </div>
              </form>
            ) : (
            <form className="user-management__form" onSubmit={handleCreateUser}>
              <div className="user-management__form-grid">
                <div className="user-management__field">
                  <label className="user-management__label" htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    className="user-management__input"
                    value={formData.firstName}
                    onChange={handleChange('firstName')}
                  />
                  {formErrors.firstName && (
                    <p className="user-management__error">{formErrors.firstName}</p>
                  )}
                </div>

                <div className="user-management__field">
                  <label className="user-management__label" htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    className="user-management__input"
                    value={formData.lastName}
                    onChange={handleChange('lastName')}
                  />
                  {formErrors.lastName && (
                    <p className="user-management__error">{formErrors.lastName}</p>
                  )}
                </div>

                <div className="user-management__field user-management__field--full">
                  <label className="user-management__label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="user-management__input"
                    value={formData.email}
                    onChange={handleChange('email')}
                  />
                  {formErrors.email && (
                    <p className="user-management__error">{formErrors.email}</p>
                  )}
                </div>

                <div className="user-management__field">
                  <label className="user-management__label" htmlFor="countryCode">Country code</label>
                  <input
                    id="countryCode"
                    className="user-management__input"
                    value={formData.countryCode}
                    onChange={handleChange('countryCode')}
                  />
                </div>

                <div className="user-management__field">
                  <label className="user-management__label" htmlFor="phoneNumber">Phone number</label>
                  <input
                    id="phoneNumber"
                    className="user-management__input"
                    value={formData.phoneNumber}
                    onChange={handleChange('phoneNumber')}
                  />
                  {formErrors.phoneNumber && (
                    <p className="user-management__error">{formErrors.phoneNumber}</p>
                  )}
                </div>

                <div className="user-management__field">
                  <label className="user-management__label" htmlFor="role">Role</label>
                  <select
                    id="role"
                    className="user-management__select"
                    value={formData.role}
                    onChange={handleChange('role')}
                  >
                    {CREATABLE_STAFF_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="user-management__field">
                  <label className="user-management__label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    className="user-management__input"
                    value={formData.password}
                    onChange={handleChange('password')}
                  />
                  {formErrors.password && (
                    <p className="user-management__error">{formErrors.password}</p>
                  )}
                </div>
              </div>

              <div className="user-management__panel-actions">
                <button
                  type="button"
                  className="user-management__cancel-btn"
                  onClick={closePanel}
                >
                  Cancel
                </button>
                <button type="submit" className="user-management__save-btn" disabled={isSaving}>
                  {isSaving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
            )}
          </aside>
        </>
      )}

      {confirmDialog && (
        <ConfirmToast
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={() => {
            confirmDialog.action();
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </section>
  );
}
