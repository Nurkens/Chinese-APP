import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, cameraOutline, lockClosedOutline, personOutline, mailOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { userAPI } from '../services/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_EMOJIS = ['🐼', '🐉', '🦊', '🐱', '🐶', '🦁', '🐯', '🐨', '🐵', '🦄', '🐸', '🐺'];
const MAX_AVATAR_BYTES = 1_000_000; // 1MB raw image

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string>('🐼');

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form whenever the modal opens
  useEffect(() => {
    if (!isOpen || !user) return;
    setUsername(user.username || '');
    setEmail(user.email || '');
    setAvatar(user.avatar || '🐼');
    setShowPasswordSection(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  }, [isOpen, user]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateProfile = (): boolean => {
    const next: Record<string, string> = {};
    if (!username || username.trim().length < 3) {
      next.username = 'Username must be at least 3 characters';
    } else if (username.length > 30) {
      next.username = 'Username must be 30 characters or less';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Enter a valid email address';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be smaller than 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.onerror = () => toast.error('Failed to read image');
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!validateProfile()) return;

    const payload: { username?: string; email?: string; avatar?: string } = {};
    if (username !== user.username) payload.username = username.trim();
    if ((email || '') !== (user.email || '')) payload.email = email.trim();
    if (avatar !== (user.avatar || '🐼')) payload.avatar = avatar;

    if (Object.keys(payload).length === 0) {
      toast.info('Nothing to update');
      return;
    }

    setSaving(true);
    try {
      const updated = await userAPI.updateProfile(payload);
      updateUser({
        username: updated.username,
        email: updated.email ?? undefined,
        avatar: updated.avatar ?? undefined,
        tag: updated.tag,
      });
      toast.success('Profile updated');
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 409 ? 'Username or email already in use' : null) ||
        'Failed to update profile';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = 'Current password is required';
    if (!newPassword || newPassword.length < 6) next.newPassword = 'New password must be at least 6 characters';
    if (newPassword !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors((prev) => ({ ...prev, ...next }));
    if (Object.keys(next).length > 0) return;

    setChangingPassword(true);
    try {
      await userAPI.changePassword(currentPassword, newPassword);
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 401 ? 'Current password is incorrect' : null) ||
        'Failed to change password';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const isImageAvatar = avatar?.startsWith('data:') || avatar?.startsWith('http');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-linear-to-br from-stone-800/95 to-stone-900/95 backdrop-blur-xl rounded-3xl border border-amber-700/30 shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-stone-700/50 bg-stone-900/80 backdrop-blur-xl rounded-t-3xl">
          <h2 className="text-2xl font-light text-primary">Edit Profile</h2>
          <button
            onClick={onClose}
            disabled={saving || changingPassword}
            className="p-2 rounded-xl hover:bg-stone-700/50 transition-all disabled:opacity-50"
            aria-label="Close"
          >
            <IonIcon icon={closeOutline} className="w-6 h-6 text-stone-300" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="w-28 h-28 bg-linear-to-br from-primary/20 to-amber-600/20 rounded-full flex items-center justify-center border-4 border-primary/30 overflow-hidden">
                {isImageAvatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">{avatar}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="absolute -bottom-1 -right-1 p-2 bg-primary hover:bg-primary/80 rounded-full text-stone-900 transition-all hover:scale-110 disabled:opacity-50"
                aria-label="Upload avatar"
              >
                <IonIcon icon={cameraOutline} className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarFile(f);
                  e.target.value = '';
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110 ${
                    avatar === emoji
                      ? 'bg-primary/30 ring-2 ring-primary'
                      : 'bg-stone-800/60 hover:bg-stone-700/60'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="flex items-center gap-2 text-sm text-stone-400 mb-2">
              <IonIcon icon={personOutline} className="w-4 h-4" />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-3 bg-stone-900/60 border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:border-primary focus:outline-none transition-all disabled:opacity-60"
              placeholder="your_username"
              autoComplete="username"
            />
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
          </div>

          {/* Email */}
          {!user?.isGuest && (
            <div>
              <label className="flex items-center gap-2 text-sm text-stone-400 mb-2">
                <IonIcon icon={mailOutline} className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 bg-stone-900/60 border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:border-primary focus:outline-none transition-all disabled:opacity-60"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
          )}

          {/* Save profile */}
          <button
            onClick={handleSaveProfile}
            disabled={saving || changingPassword}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-stone-900 font-medium rounded-xl transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-900/30 border-t-stone-900 rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>

          {/* Password Section */}
          {!user?.isGuest && user?.email && (
            <div className="pt-4 border-t border-stone-700/50">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full flex items-center justify-between p-3 hover:bg-stone-800/40 rounded-xl transition-all text-left"
              >
                <span className="flex items-center gap-2 text-stone-300">
                  <IonIcon icon={lockClosedOutline} className="w-5 h-5 text-primary" />
                  Change Password
                </span>
                <span className="text-stone-500 text-sm">
                  {showPasswordSection ? '−' : '+'}
                </span>
              </button>

              {showPasswordSection && (
                <div className="mt-4 space-y-3 animate-fadeIn">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={changingPassword}
                    className="w-full px-4 py-3 bg-stone-900/60 border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:border-primary focus:outline-none transition-all"
                    placeholder="Current password"
                    autoComplete="current-password"
                  />
                  {errors.currentPassword && (
                    <p className="text-red-400 text-xs">{errors.currentPassword}</p>
                  )}
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={changingPassword}
                    className="w-full px-4 py-3 bg-stone-900/60 border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:border-primary focus:outline-none transition-all"
                    placeholder="New password (min 6 chars)"
                    autoComplete="new-password"
                  />
                  {errors.newPassword && (
                    <p className="text-red-400 text-xs">{errors.newPassword}</p>
                  )}
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={changingPassword}
                    className="w-full px-4 py-3 bg-stone-900/60 border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:border-primary focus:outline-none transition-all"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs">{errors.confirmPassword}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword || saving}
                    className="w-full py-3 bg-primary/20 hover:bg-primary/30 text-primary font-medium rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {changingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
