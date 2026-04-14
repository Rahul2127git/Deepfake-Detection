import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { ArrowRight, CheckCircle2, Zap, Eye, Brain, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  const handleStartAnalysis = () => {
    if (isAuthenticated) {
      setLocation("/upload");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const handleViewDemo = () => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020] animated-grid">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DeepShield AI</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors">
              Home
            </a>
            <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </a>
            <a href="/upload" className="text-gray-400 hover:text-white transition-colors">
              Analyze
            </a>
            <a href="/reports" className="text-gray-400 hover:text-white transition-colors">
              Report
            </a>
          </div>

          {/* Auth button */}
          <div>
            {isAuthenticated ? (
              <Button
                onClick={() => setLocation("/dashboard")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300"
              >
                Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-8">
          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
          <span className="text-sm font-semibold text-cyan-400">AI-POWERED DEEPFAKE DETECTION</span>
        </div>

        {/* Main headline with gradient */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="text-white">Detect Your</span>
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Deepfakes
          </span>
          <br />
          <span className="text-white">With AI Precision</span>
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Advanced machine learning platform that instantly analyzes images and videos to detect AI-generated deepfakes. Get real-time results with 99.2% accuracy and detailed frame-by-frame analysis.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            onClick={handleStartAnalysis}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 glow-blue flex items-center justify-center gap-2 text-lg"
          >
            Start Analysis
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleViewDemo}
            variant="outline"
            className="border-2 border-white/20 text-white hover:border-cyan-500/50 hover:bg-cyan-500/10 font-bold py-3 px-8 rounded-lg transition-all duration-300 text-lg"
          >
            View Demo Dashboard
          </Button>
        </div>

        {/* Feature highlights */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="glass-dark p-6 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 mx-auto">
              <Eye className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Frame-Level Analysis</h3>
            <p className="text-gray-400 text-sm">Detailed frame-by-frame breakdown for videos with individual confidence scores</p>
          </div>

          <div className="glass-dark p-6 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 mx-auto">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Real-Time Detection</h3>
            <p className="text-gray-400 text-sm">Instant results with live webcam support for immediate deepfake verification</p>
          </div>

          <div className="glass-dark p-6 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 mx-auto">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">High Accuracy</h3>
            <p className="text-gray-400 text-sm">99.2% detection accuracy powered by state-of-the-art ML models</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div id="stats" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1 */}
          <div className="glass-dark p-8 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">50K+</p>
            <p className="text-gray-400">Media Files Analyzed</p>
          </div>

          {/* Stat 2 */}
          <div className="glass-dark p-8 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Brain className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">8</p>
            <p className="text-gray-400">ML Models Active</p>
          </div>

          {/* Stat 3 */}
          <div className="glass-dark p-8 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">99.2%</p>
            <p className="text-gray-400">Detection Accuracy</p>
          </div>

          {/* Stat 4 */}
          <div className="glass-dark p-8 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-pink-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">100%</p>
            <p className="text-gray-400">Data Privacy</p>
          </div>
        </div>
      </div>


    </div>
  );
}
