import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockReports = [
  { id: 1, filename: "video_sample_001.mp4", result: "Real", confidence: 98.5, timestamp: "2026-04-12 14:30", duration: "2m 45s" },
  { id: 2, filename: "image_test_042.jpg", result: "Deepfake", confidence: 94.2, timestamp: "2026-04-12 13:15", duration: "N/A" },
  { id: 3, filename: "video_sample_003.mp4", result: "Real", confidence: 97.8, timestamp: "2026-04-12 12:00", duration: "1m 30s" },
  { id: 4, filename: "image_test_089.jpg", result: "Deepfake", confidence: 91.5, timestamp: "2026-04-12 10:45", duration: "N/A" },
  { id: 5, filename: "video_sample_045.mp4", result: "Real", confidence: 99.1, timestamp: "2026-04-11 16:20", duration: "3m 10s" },
  { id: 6, filename: "image_test_156.jpg", result: "Real", confidence: 96.3, timestamp: "2026-04-11 14:00", duration: "N/A" },
];

const mockTrendData = [
  { date: "Apr 1", real: 45, fake: 12 },
  { date: "Apr 2", real: 52, fake: 18 },
  { date: "Apr 3", real: 48, fake: 15 },
  { date: "Apr 4", real: 61, fake: 22 },
  { date: "Apr 5", real: 55, fake: 19 },
  { date: "Apr 6", real: 67, fake: 25 },
  { date: "Apr 7", real: 72, fake: 28 },
  { date: "Apr 8", real: 58, fake: 20 },
  { date: "Apr 9", real: 64, fake: 24 },
  { date: "Apr 10", real: 71, fake: 26 },
  { date: "Apr 11", real: 68, fake: 23 },
  { date: "Apr 12", real: 75, fake: 30 },
];

const mockAccuracyData = [
  { model: "ResNet50", accuracy: 94.2 },
  { model: "EfficientNet", accuracy: 96.1 },
  { model: "ViT-Large", accuracy: 97.8 },
  { model: "Ensemble", accuracy: 99.2 },
];

export default function Reports() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020] p-8 animated-grid">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Reports</h1>
            <p className="text-gray-400">Detailed analysis and scan history</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex items-center gap-2 glow-blue">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-dark p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Total Scans</p>
            <p className="text-2xl font-bold text-white">1,247</p>
            <p className="text-xs text-green-400 mt-2">↑ 12.5% this month</p>
          </div>
          <div className="glass-dark p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Real Content</p>
            <p className="text-2xl font-bold text-cyan-400">892</p>
            <p className="text-xs text-gray-400 mt-2">71.5% of total</p>
          </div>
          <div className="glass-dark p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Deepfakes</p>
            <p className="text-2xl font-bold text-purple-400">355</p>
            <p className="text-xs text-gray-400 mt-2">28.5% of total</p>
          </div>
          <div className="glass-dark p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Avg Confidence</p>
            <p className="text-2xl font-bold text-blue-400">96.8%</p>
            <p className="text-xs text-gray-400 mt-2">Model accuracy</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend chart */}
          <div className="glass-dark p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-6">Detection Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "#1a2847", border: "1px solid rgba(59, 130, 246, 0.3)" }} />
                <Legend />
                <Line type="monotone" dataKey="real" stroke="#22D3EE" strokeWidth={2} name="Real" />
                <Line type="monotone" dataKey="fake" stroke="#8B5CF6" strokeWidth={2} name="Deepfake" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Model accuracy */}
          <div className="glass-dark p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-6">Model Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockAccuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="model" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" domain={[90, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#1a2847", border: "1px solid rgba(59, 130, 246, 0.3)" }} />
                <Bar dataKey="accuracy" fill="#3B82F6" name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-dark p-4 rounded-xl flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by filename..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 outline-none"
          />
          <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500/50 focus:ring-blue-500/20 outline-none">
            <option>All Results</option>
            <option>Real Only</option>
            <option>Deepfake Only</option>
          </select>
        </div>

        {/* Scan history table */}
        <div className="glass-dark p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Scan History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">File Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Result</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Confidence</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Duration</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Timestamp</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockReports.map((report) => (
                  <tr key={report.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white font-medium">{report.filename}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          report.result === "Real"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {report.result}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{report.confidence}%</td>
                    <td className="py-4 px-4 text-gray-400">{report.duration}</td>
                    <td className="py-4 px-4 text-gray-400">{report.timestamp}</td>
                    <td className="py-4 px-4">
                      <button className="text-blue-400 hover:text-blue-300 transition-colors text-xs font-semibold">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
