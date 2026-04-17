'use client';

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Upload, AlertTriangle, CheckCircle, Home, ArrowRight } from "lucide-react";

type DetectionResult = {
  label: "Real" | "Deepfake";
  confidence: number;
  frameAnalysis: { frame: number; score: number }[];
} | null;

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setUploadedFile(file);
        setResult(null);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setUploadedFile(file);
        setResult(null);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock result - in production, this would call the backend /predict endpoint
    const mockResult: DetectionResult = {
      label: Math.random() > 0.3 ? "Real" : "Deepfake",
      confidence: 85 + Math.random() * 14,
      frameAnalysis: Array.from({ length: 5 }, (_, i) => ({
        frame: i + 1,
        score: 0.7 + Math.random() * 0.3,
      })),
    };

    setResult(mockResult);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020] animated-grid">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Upload Media</h1>
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="text-gray-400 hover:text-white flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`glass-dark p-12 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
            dragActive
              ? "border-cyan-500 bg-cyan-500/10"
              : "border-white/20 hover:border-cyan-500/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Upload className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-white mb-2">
                Drag & drop your media here
              </p>
              <p className="text-gray-400 text-sm">
                or click to browse (Images and Videos supported)
              </p>
            </div>
          </div>
        </div>

        {/* File Preview */}
        {uploadedFile && (
          <div className="mt-8 glass-dark p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400">Selected File</p>
                <p className="text-lg font-semibold text-white">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                onClick={() => {
                  setUploadedFile(null);
                  setResult(null);
                }}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 glow-cyan flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Results Panel */}
        {result && (
          <div className="mt-8 glass-dark p-8 rounded-xl border border-white/10">
            <div className="flex items-start gap-4 mb-6">
              {result.label === "Real" ? (
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">Detection Result</p>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {result.label === "Real" ? "✓ Real" : "⚠ Deepfake"}
                </h2>
                <p className="text-gray-400">
                  Confidence: <span className="text-cyan-400 font-semibold">{result.confidence.toFixed(1)}%</span>
                </p>
              </div>
            </div>

            {/* Action Insights */}
            {result.label === "Deepfake" && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 font-semibold mb-2">⚠ Deepfake Detected</p>
                <p className="text-sm text-gray-300">
                  This media appears to be AI-generated or manipulated. Exercise caution when sharing or using this content.
                </p>
              </div>
            )}

            {result.label === "Real" && (
              <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-green-400 font-semibold mb-2">✓ Verification Successful</p>
                <p className="text-sm text-gray-300">
                  This media appears to be authentic and unmanipulated based on our analysis.
                </p>
              </div>
            )}

            {/* Frame Analysis */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-white mb-4">Frame-by-Frame Analysis</p>
              <div className="space-y-3">
                {result.frameAnalysis.map((frame) => (
                  <div key={frame.frame} className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 w-20">Frame {frame.frame}</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          frame.score > 0.7
                            ? "bg-red-500"
                            : frame.score > 0.4
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${frame.score * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">
                      {(frame.score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* New Analysis Button */}
            <Button
              onClick={() => {
                setUploadedFile(null);
                setResult(null);
              }}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
            >
              Analyze Another File
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Home Button */}
      {uploadedFile && !result && (
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center border-t border-white/10 pt-8">
            <Button
              onClick={() => setLocation("/")}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 glow-cyan flex items-center justify-center gap-2 mx-auto"
            >
              <Home className="w-5 h-5" />
              Return to Home
            </Button>
            <p className="text-gray-400 text-sm mt-4">Need help? Check our documentation</p>
          </div>
        </div>
      )}
    </div>
  );
}
