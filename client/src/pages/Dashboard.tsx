import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { LayoutDashboard, Upload, FileText, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const mockStats = [
  { label: "Total Scans", value: "1,247", change: "+12.5%", icon: "📊" },
  { label: "Real Content", value: "892", change: "+8.2%", icon: "✓" },
  { label: "Deepfakes Detected", value: "355", change: "+4.3%", icon: "⚠" },
  { label: "Accuracy", value: "99.2%", change: "+0.5%", icon: "🎯" },
];

const mockRecentScans = [
  { id: 1, filename: "video_sample_001.mp4", result: "Real", confidence: 98.5, timestamp: "2 hours ago" },
  { id: 2, filename: "image_test_042.jpg", result: "Deepfake", confidence: 94.2, timestamp: "5 hours ago" },
  { id: 3, filename: "video_sample_003.mp4", result: "Real", confidence: 97.8, timestamp: "1 day ago" },
  { id: 4, filename: "image_test_089.jpg", result: "Deepfake", confidence: 91.5, timestamp: "2 days ago" },
  { id: 5, filename: "video_sample_045.mp4", result: "Real", confidence: 99.1, timestamp: "3 days ago" },
];

const mockDistributionData = [
  { name: "Real", value: 892, fill: "#22D3EE" },
  { name: "Deepfake", value: 355, fill: "#8B5CF6" },
];

const mockTrendData = [
  { date: "Mon", real: 120, fake: 40 },
  { date: "Tue", real: 145, fake: 55 },
  { date: "Wed", real: 110, fake: 48 },
  { date: "Thu", real: 165, fake: 62 },
  { date: "Fri", real: 180, fake: 70 },
  { date: "Sat", real: 95, fake: 35 },
  { date: "Sun", real: 77, fake: 45 },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", active: true },
    { label: "Upload", icon: Upload, path: "/upload", active: false },
    { label: "Reports", icon: FileText, path: "/reports", active: false },
    { label: "Settings", icon: Settings, path: "/settings", active: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020] flex animated-grid">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-[#111827] border-r border-white/10 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DS</span>
              </div>
              <span className="text-white font-bold">DeepShield</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                item.active
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 glow-blue"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              title={!sidebarOpen ? item.label : ""}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => {
              logout();
              setLocation("/");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
            title={!sidebarOpen ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/20 backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-400">Welcome back, {user?.name || "User"}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.email}</p>
              <p className="text-xs text-gray-400">Premium Account</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockStats.map((stat, idx) => (
              <div key={idx} className="glass-dark p-6 rounded-xl hover:border-blue-500/50 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <p className="text-xs text-green-400 font-semibold">{stat.change} from last month</p>
              </div>
            ))}
          </div>

          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Distribution pie chart */}
            <div className="glass-dark p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-6">Detection Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mockDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1a2847", border: "1px solid rgba(59, 130, 246, 0.3)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Trend bar chart */}
            <div className="glass-dark p-6 rounded-xl lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-6">Weekly Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mockTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ backgroundColor: "#1a2847", border: "1px solid rgba(59, 130, 246, 0.3)" }} />
                  <Legend />
                  <Bar dataKey="real" fill="#22D3EE" name="Real" />
                  <Bar dataKey="fake" fill="#8B5CF6" name="Deepfake" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent scans table */}
          <div className="glass-dark p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-6">Recent Scans</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">File Name</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Result</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Confidence</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {mockRecentScans.map((scan) => (
                    <tr key={scan.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-white font-medium">{scan.filename}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            scan.result === "Real"
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}
                        >
                          {scan.result}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{scan.confidence}%</td>
                      <td className="py-4 px-4 text-gray-400">{scan.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
