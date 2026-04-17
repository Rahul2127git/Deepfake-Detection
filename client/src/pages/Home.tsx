'use client';

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { ArrowRight, CheckCircle2, Zap, Eye, Brain, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SignInModal from "@/components/SignInModal";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

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
                onClick={() => setIsSignInModalOpen(true)}
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
        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Advanced machine learning platform that instantly analyzes images and videos to detect AI-generated deepfakes. Get real-time results with 99.2% accuracy and detailed frame-by-frame analysis.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Button
            onClick={handleStartAnalysis}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 glow-cyan flex items-center justify-center gap-2"
          >
            Start Analysis
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleViewDemo}
            variant="outline"
            className="border-cyan-500/50 text-cyan-400 hover:text-cyan-300 hover:border-cyan-400 font-semibold px-8 py-3 rounded-lg transition-all duration-300"
          >
            View Demo Dashboard
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {/* Feature 1 */}
          <div className="glass-dark p-8 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
              <Eye className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Frame-Level Analysis</h3>
            <p className="text-gray-400 text-sm">Analyze every frame of video content for precise deepfake detection and manipulation identification.</p>
          </div>

          {/* Feature 2 */}
          <div className="glass-dark p-8 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Detection</h3>
            <p className="text-gray-400 text-sm">Get instant results with live webcam detection and immediate feedback on media authenticity.</p>
          </div>

          {/* Feature 3 */}
          <div className="glass-dark p-8 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
              <Brain className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">High Accuracy</h3>
            <p className="text-gray-400 text-sm">99.2% detection accuracy powered by state-of-the-art machine learning models and algorithms.</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Stat 1 */}
          <div className="glass-dark p-6 rounded-xl text-center border border-white/10">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">50K+</p>
            <p className="text-xs text-gray-400">Scans Analyzed</p>
          </div>

          {/* Stat 2 */}
          <div className="glass-dark p-6 rounded-xl text-center border border-white/10">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">4</p>
            <p className="text-xs text-gray-400">AI Models Active</p>
          </div>

          {/* Stat 3 */}
          <div className="glass-dark p-6 rounded-xl text-center border border-white/10">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">98.7%</p>
            <p className="text-xs text-gray-400">Accuracy Rate</p>
          </div>

          {/* Stat 4 */}
          <div className="glass-dark p-6 rounded-xl text-center border border-white/10">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-pink-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">120+</p>
            <p className="text-xs text-gray-400">Biomarkers Tracked</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/10 mt-20 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 DeepShield AI. Advanced deepfake detection powered by machine learning.
          </p>
        </div>
      </div>

      {/* Sign In Modal */}
      <SignInModal isOpen={isSignInModalOpen} onClose={() => setIsSignInModalOpen(false)} />
    </div>
  );
}
