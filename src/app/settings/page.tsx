'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Settings, 
  User, 
  Lock, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff, 
  Smartphone,
  Mail,
  Phone,
  MapPin,
  Save,
  Edit,
  ChevronRight,
  Key,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile Settings
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    department: '',
    bio: ''
  });

  // Password Settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Forgot Password
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  // 2FA Settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showQR, setShowQR] = useState(false);

  // Notification Settings
  const [notifications, setNotifications] = useState({
    email: {
      events: true,
      updates: true,
      newsletters: false,
      security: true
    },
    push: {
      events: true,
      messages: true,
      updates: false
    }
  });

  const sections: SettingsSection[] = [
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Update your personal information',
      icon: User,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'password',
      title: 'Password & Security',
      description: 'Change password and security settings',
      icon: Lock,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'twofactor',
      title: 'Two-Factor Authentication',
      description: 'Secure your account with 2FA',
      icon: Shield,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage notification preferences',
      icon: Bell,
      color: 'from-orange-500 to-red-500'
    }
  ];

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any)?.phone || '',
        location: (user as any)?.location || '',
        department: (user as any)?.department || '',
        bio: (user as any)?.bio || ''
      });
    }
  }, [user]);

  // Check 2FA status on component mount
  useEffect(() => {
    const check2FAStatus = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('zenith-token');
        const response = await fetch('/api/auth/setup-2fa', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTwoFactorEnabled(data.totpEnabled || data.emailOtpEnabled);
        }
      } catch (error) {
        console.error('Error checking 2FA status:', error);
      }
    };

    check2FAStatus();
  }, [user]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      toast.success(text);
    } else {
      toast.error(text);
    }
  };

  const handleProfileSave = async () => {
    if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
      showMessage('error', 'First name and last name are required');
      return;
    }

    if (!profileData.email.trim()) {
      showMessage('error', 'Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      showMessage('error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        showMessage('success', 'Profile updated successfully!');
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('error', 'Network error while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword.trim()) {
      showMessage('error', 'Current password is required');
      return;
    }

    if (!passwordData.newPassword.trim()) {
      showMessage('error', 'New password is required');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showMessage('error', 'New password must be at least 8 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      showMessage('error', 'New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      if (response.ok) {
        showMessage('success', 'Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      showMessage('error', 'Network error while changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      showMessage('error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      showMessage('error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      if (response.ok) {
        showMessage('success', 'Password reset link sent to your email (if account exists)');
        setForgotPasswordEmail('');
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      showMessage('error', 'Network error while sending reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setShowQR(true);
        showMessage('success', 'QR code generated. Scan with your authenticator app.');
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to setup 2FA');
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      showMessage('error', 'Network error while setting up 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showMessage('error', 'Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          userId: user?.id,
          code: verificationCode 
        }),
      });

      if (response.ok) {
        setTwoFactorEnabled(true);
        setShowQR(false);
        setVerificationCode('');
        showMessage('success', 'Two-factor authentication enabled successfully!');
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      showMessage('error', 'Network error during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('zenith-token');
      const response = await fetch('/api/auth/disable-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTwoFactorEnabled(false);
        setShowQR(false);
        setQrCode('');
        setVerificationCode('');
        showMessage('success', 'Two-factor authentication disabled');
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      console.error('2FA disable error:', error);
      showMessage('error', 'Network error while disabling 2FA');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="zenith-bg-card backdrop-blur-sm border zenith-border shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 zenith-text-primary">
            <User className="w-5 h-5" />
            <span>Personal Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium zenith-text-secondary mb-2">
                First Name
              </label>
              <Input
                value={profileData.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData({...profileData, firstName: e.target.value})}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium zenith-text-secondary mb-2">
                Last Name
              </label>
              <Input
                value={profileData.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData({...profileData, lastName: e.target.value})}
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium zenith-text-secondary mb-2">
              Email Address
            </label>
            <div className="relative">
              <Input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                placeholder="Email address"
                className="pr-10"
              />
              <div className="absolute right-3 top-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium zenith-text-secondary mb-2">
                Phone Number
              </label>
              <Input
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium zenith-text-secondary mb-2">
                Location
              </label>
              <Input
                value={profileData.location}
                onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                placeholder="City, State"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium zenith-text-secondary mb-2">
              Department
            </label>
            <Input
              value={profileData.department}
              onChange={(e) => setProfileData({...profileData, department: e.target.value})}
              placeholder="Computer Science"
            />
          </div>

          <div>
            <label className="block text-sm font-medium zenith-text-secondary mb-2">
              Bio
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              placeholder="Tell us about yourself..."
              className="w-full p-3 border zenith-border rounded-lg zenith-bg-card zenith-text-primary resize-none"
              rows={4}
            />
          </div>

          <Button
            onClick={handleProfileSave}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderPasswordSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="zenith-bg-card backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 zenith-text-primary">
            <Lock className="w-5 h-5" />
            <span>Change Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium zenith-text-secondary mb-2">
              Current Password
            </label>
            <div className="relative">
              <Input
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                placeholder="Enter current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                className="absolute right-3 top-3 zenith-text-muted hover:zenith-text-secondary"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium zenith-text-secondary mb-2">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                placeholder="Enter new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                className="absolute right-3 top-3 zenith-text-muted hover:zenith-text-secondary"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium zenith-text-secondary mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                className="absolute right-3 top-3 zenith-text-muted hover:zenith-text-secondary"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="zenith-bg-section p-4 rounded-lg">
            <h4 className="font-medium zenith-text-primary mb-2">Password Requirements:</h4>
            <ul className="text-sm zenith-text-secondary space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Include uppercase and lowercase letters</li>
              <li>• Include at least one number</li>
              <li>• Include at least one special character</li>
            </ul>
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Changing...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  const render2FASection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="zenith-bg-card backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 zenith-text-primary">
            <Shield className="w-5 h-5" />
            <span>Two-Factor Authentication</span>
            {twoFactorEnabled && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Enabled
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!twoFactorEnabled ? (
            <div className="space-y-4">
              <div className="zenith-bg-section p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium zenith-text-primary">
                      Enhance Your Security
                    </h4>
                    <p className="text-sm zenith-text-secondary mt-1">
                      Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.
                    </p>
                  </div>
                </div>
              </div>

              {!showQR ? (
                <Button
                  onClick={handleEnable2FA}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Enable 2FA
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-medium zenith-text-primary mb-2">
                      Scan QR Code
                    </h4>
                    <p className="text-sm zenith-text-secondary mb-4">
                      Use your authenticator app to scan this QR code
                    </p>
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium zenith-text-secondary mb-2">
                      Verification Code
                    </label>
                    <Input
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleVerify2FA}
                      disabled={loading || verificationCode.length !== 6}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify & Enable
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowQR(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="zenith-bg-section p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium zenith-text-primary">
                      2FA is Active
                    </h4>
                    <p className="text-sm zenith-text-secondary mt-1">
                      Your account is protected with two-factor authentication. You'll need to enter a verification code when logging in.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleDisable2FA}
                disabled={loading}
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent mr-2" />
                    Disabling...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Disable 2FA
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderNotificationsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="zenith-bg-card backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 zenith-text-primary">
            <Mail className="w-5 h-5" />
            <span>Email Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 zenith-bg-section rounded-lg">
              <div>
                <h4 className="font-medium zenith-text-primary capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm zenith-text-secondary">
                  {key === 'events' && 'Get notified about upcoming events'}
                  {key === 'updates' && 'Receive system updates and announcements'}
                  {key === 'newsletters' && 'Weekly newsletters and club highlights'}
                  {key === 'security' && 'Important security alerts and login notifications'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    email: { ...notifications.email, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="zenith-bg-card backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 zenith-text-primary">
            <Bell className="w-5 h-5" />
            <span>Push Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 zenith-bg-section rounded-lg">
              <div>
                <h4 className="font-medium zenith-text-primary capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm zenith-text-secondary">
                  {key === 'events' && 'Push notifications for event reminders'}
                  {key === 'messages' && 'New message notifications'}
                  {key === 'updates' && 'App updates and maintenance notifications'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    push: { ...notifications.push, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );

  if (!user) {
    return (
      <div className="min-h-screen zenith-bg-main flex items-center justify-center">
        <Card className="zenith-bg-card backdrop-blur-sm border-0 shadow-xl p-8 text-center">
          <h2 className="text-xl font-semibold zenith-text-primary mb-2">Not Logged In</h2>
          <p className="zenith-text-secondary">Please log in to access settings.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen zenith-bg-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold zenith-text-primary">
            Settings
          </h1>
          <p className="mt-2 text-lg zenith-text-secondary">
            Manage your account preferences and security settings
          </p>
        </motion.div>

        {/* Message Alert */}
        {/* Messages now handled by react-hot-toast */}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-2"
            >
              {sections.map((section) => (
                <motion.button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                    activeSection === section.id
                      ? 'zenith-bg-card shadow-lg scale-105'
                      : 'zenith-bg-section hover:zenith-bg-hover hover:shadow-md'
                  }`}
                  whileHover={{ scale: activeSection === section.id ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${section.color}`}>
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium zenith-text-primary">
                        {section.title}
                      </h3>
                      <p className="text-sm zenith-text-secondary">
                        {section.description}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 zenith-text-muted transition-transform ${
                      activeSection === section.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeSection === 'profile' && renderProfileSection()}
              {activeSection === 'password' && renderPasswordSection()}
              {activeSection === 'twofactor' && render2FASection()}
              {activeSection === 'notifications' && renderNotificationsSection()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
