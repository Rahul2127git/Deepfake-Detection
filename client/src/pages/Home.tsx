import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { ArrowRight, Zap, BarChart3, Shield, Sparkles, Upload as UploadIcon } from "lucide-react";
import { useState, useRef } from "react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (isAuthenticated) {
        setLocation("/upload");
      } else {
        window.location.href = getLoginUrl();
      }
    }
  };

  const handleAnalyzeUrl = () => {
    if (urlInput.trim()) {
      if (isAuthenticated) {
        setLocation("/upload");
      } else {
        window.location.href = getLoginUrl();
      }
    }
  };

  const handleTryDemo = () => {
    if (isAuthenticated) {
      setLocation("/upload");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020] animated-grid overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DeepShield AI</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button
                onClick={() => setLocation("/dashboard")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white glow-blue"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setLocation("/login")}
                  variant="ghost"
                  className="text-gray-300 hover:text-white"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => setLocation("/signup")}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white glow-blue"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 space-y-12">
        {/* Hero headline and description */}
        <div className="text-center space-y-6 slide-up">
          <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight">
            Detect Deepfakes{" "}
            <span className="gradient-text">Instantly</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Advanced AI-powered platform to detect whether uploaded images and videos are real or AI-generated deepfakes with 99.2% accuracy
          </p>
        </div>

        {/* Upload Section */}
        <div className="glass-dark p-8 rounded-2xl max-w-2xl mx-auto w-full space-y-6">
          {/* File upload input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Upload Image or Video
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={handleUpload}
              className="w-full border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 text-center"
            >
              <UploadIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-400">JPG, PNG, MP4, WebM (Max 500MB)</p>
            </button>
          </div>

          {/* URL input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Or Paste URL
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 outline-none"
              />
              <Button
                onClick={handleAnalyzeUrl}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold glow-blue"
              >
                Analyze
              </Button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleAnalyzeUrl}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 glow-blue"
            >
              <Zap className="w-5 h-5" />
              Analyze
            </Button>
            <Button
              onClick={handleTryDemo}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/5 font-semibold py-3 flex items-center justify-center gap-2"
            >
              Try Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {/* Frame-level analysis */}
          <div className="glass-dark p-8 rounded-xl hover:border-blue-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Frame-Level Analysis</h3>
            <p className="text-gray-400 text-sm">
              Analyze video content frame-by-frame to identify subtle manipulation patterns and synthetic artifacts
            </p>
          </div>

          {/* Real-time detection */}
          <div className="glass-dark p-8 rounded-xl hover:border-purple-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Detection</h3>
            <p className="text-gray-400 text-sm">
              Get instant results with our optimized ML models that process media in seconds, not minutes
            </p>
          </div>

          {/* High accuracy */}
          <div className="glass-dark p-8 rounded-xl hover:border-cyan-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">99.2% Accuracy</h3>
            <p className="text-gray-400 text-sm">
              Trained on diverse deepfake datasets from Kaggle, Mendeley, and HuggingFace with state-of-the-art performance
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-20 text-center space-y-8">
          <div className="space-y-2">
            <p className="text-gray-400 text-sm uppercase tracking-wider">Trusted by</p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="text-gray-500 font-semibold">Security Teams</div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-gray-500 font-semibold">Media Companies</div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-gray-500 font-semibold">Researchers</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <p className="text-3xl font-bold text-blue-400">1.2M+</p>
              <p className="text-gray-400 text-sm mt-1">Media Analyzed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">99.2%</p>
              <p className="text-gray-400 text-sm mt-1">Detection Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-cyan-400">&lt;2s</p>
              <p className="text-gray-400 text-sm mt-1">Average Analysis Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/10 mt-20 py-8 px-8 text-center text-gray-500 text-sm">
        <p>© 2026 DeepShield AI. All rights reserved. | Privacy Policy | Terms of Service</p>
      </div>
    </div>
  );
}
