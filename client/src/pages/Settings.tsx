import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Bell, Lock, User, Shield, Save, Home } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    notifications: true,
    emailAlerts: true,
    dataRetention: "30",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = () => {
    // In production, this would call the backend API
    console.log("Settings saved:", formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020] p-8 animated-grid">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
          </div>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="border-white/20 text-gray-400 hover:text-white flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        {/* Account Settings */}
        <div className="glass-dark p-8 rounded-xl space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Account Settings</h2>
          </div>

          <div className="space-y-4">
            {/* Name field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            {/* Account type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white">
                Premium Account
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="glass-dark p-8 rounded-xl space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Notifications</h2>
          </div>

          <div className="space-y-4">
            {/* Notifications toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div>
                <p className="text-white font-medium">Push Notifications</p>
                <p className="text-sm text-gray-400">Receive alerts for scan results</p>
              </div>
              <input
                type="checkbox"
                name="notifications"
                checked={formData.notifications}
                onChange={handleChange}
                className="w-5 h-5 rounded cursor-pointer"
              />
            </div>

            {/* Email alerts toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div>
                <p className="text-white font-medium">Email Alerts</p>
                <p className="text-sm text-gray-400">Get notified via email for important updates</p>
              </div>
              <input
                type="checkbox"
                name="emailAlerts"
                checked={formData.emailAlerts}
                onChange={handleChange}
                className="w-5 h-5 rounded cursor-pointer"
              />
            </div>

            {/* Data retention */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data Retention Period</label>
              <select
                name="dataRetention"
                value={formData.dataRetention}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500/50 focus:ring-blue-500/20 outline-none"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="glass-dark p-8 rounded-xl space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Security</h2>
          </div>

          <div className="space-y-4">
            {/* Password change */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Password</p>
                  <p className="text-sm text-gray-400">Last changed 45 days ago</p>
                </div>
                <Button variant="outline" className="border-white/20 text-gray-400 hover:text-white">
                  Change Password
                </Button>
              </div>
            </div>

            {/* Two-factor authentication */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-400">Add an extra layer of security</p>
                </div>
                <Button variant="outline" className="border-white/20 text-gray-400 hover:text-white">
                  Enable 2FA
                </Button>
              </div>
            </div>

            {/* Active sessions */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Active Sessions</p>
                  <p className="text-sm text-gray-400">1 active session</p>
                </div>
                <Button variant="outline" className="border-white/20 text-gray-400 hover:text-white">
                  View All
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="glass-dark p-8 rounded-xl space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Privacy & Data</h2>
          </div>

          <div className="space-y-4">
            {/* Data usage */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white font-medium mb-2">Your Data Usage</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Storage Used</span>
                  <span className="text-sm text-white">2.4 GB / 10 GB</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/4 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                </div>
              </div>
            </div>

            {/* Download data */}
            <Button variant="outline" className="w-full border-white/20 text-gray-400 hover:text-white">
              Download My Data
            </Button>

            {/* Delete account */}
            <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10">
              Delete Account
            </Button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" className="border-white/20 text-gray-400 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold flex items-center gap-2 glow-blue"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
