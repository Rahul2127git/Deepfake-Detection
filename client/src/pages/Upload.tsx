'use client';

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Upload, Camera, AlertTriangle, CheckCircle, Zap, Home, X } from "lucide-react";

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
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamResult, setWebcamResult] = useState<DetectionResult>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [, setLocation] = useLocation();

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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

  // Simple face detection using canvas and image processing
  const detectFaceInFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple skin tone detection (basic face detection)
    let skinPixels = 0;
    const threshold = data.length * 0.05; // At least 5% skin tone pixels

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Skin tone detection heuristic
      if (
        r > 95 &&
        g > 40 &&
        b > 20 &&
        r > g &&
        r > b &&
        Math.abs(r - g) > 15
      ) {
        skinPixels++;
      }
    }

    return skinPixels > threshold;
  };

  const startFaceDetectionLoop = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const detectFrame = () => {
      if (!video.paused && !video.ended) {
        const detected = detectFaceInFrame(video, canvas);
        setFaceDetected(detected);
      }
      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };
    detectFrame();
  };

  const handleStartWebcam = async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current && canvasRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setWebcamActive(true);
        setWebcamResult(null);
        setFaceDetected(false);

        // Start face detection loop when video starts playing
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && canvasRef.current) {
            startFaceDetectionLoop(videoRef.current, canvasRef.current);
          }
        };
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      const errorMessage =
        error instanceof DOMException
          ? error.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access in your browser settings."
            : error.name === "NotFoundError"
            ? "No camera found on this device."
            : "Unable to access camera. Please check your browser permissions."
          : "An unexpected error occurred while accessing the camera.";
      setWebcamError(errorMessage);
      setWebcamActive(false);
    }
  };

  const handleStopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    setFaceDetected(false);
    setWebcamError(null);
  };

  const handleCaptureFrame = async () => {
    if (!videoRef.current) return;

    setIsAnalyzing(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock result for webcam capture
    const mockResult: DetectionResult = {
      label: Math.random() > 0.3 ? "Real" : "Deepfake",
      confidence: 85 + Math.random() * 14,
      frameAnalysis: Array.from({ length: 5 }, (_, i) => ({
        frame: i + 1,
        score: 0.7 + Math.random() * 0.3,
      })),
    };

    setWebcamResult(mockResult);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020] p-8 animated-grid">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Upload Media</h1>
            <p className="text-gray-400">Upload an image or video to detect deepfakes instantly</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Drag and drop area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                dragActive
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/20 bg-white/5 hover:border-blue-500/50 hover:bg-blue-500/5"
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

              {!uploadedFile ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">Drag and drop your file here</p>
                    <p className="text-gray-400 text-sm">or click to browse (Image or Video)</p>
                  </div>
                  <p className="text-xs text-gray-500">Supported formats: JPG, PNG, MP4, WebM</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{uploadedFile.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                      setResult(null);
                    }}
                    className="border-white/20 text-gray-400 hover:text-white"
                  >
                    Change File
                  </Button>
                </div>
              )}
            </div>

            {/* Analyze button */}
            {uploadedFile && !result && (
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 glow-blue flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze Now
                  </>
                )}
              </Button>
            )}

            {/* Webcam section */}
            <div className="glass-dark p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                Live Webcam Detection
              </h3>

              {/* Error message */}
              {webcamError && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-semibold text-sm">Camera Error</p>
                    <p className="text-red-300/80 text-sm">{webcamError}</p>
                  </div>
                </div>
              )}

              {/* Video container */}
              <div className="relative aspect-video bg-black/50 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden mb-4">
                {webcamActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Face detection indicator */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg">
                      <div
                        className={`w-2 h-2 rounded-full transition-all ${
                          faceDetected ? "bg-green-400 shadow-lg shadow-green-400" : "bg-gray-500"
                        }`}
                      ></div>
                      <span className="text-xs font-semibold text-white">
                        {faceDetected ? "Face Detected" : "No Face"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500">Click "Start Webcam" to begin</p>
                  </div>
                )}
              </div>

              {/* Hidden canvas for face detection */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Buttons */}
              <div className="flex gap-3">
                {!webcamActive ? (
                  <Button
                    onClick={handleStartWebcam}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Start Webcam
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleCaptureFrame}
                      disabled={isAnalyzing || !faceDetected}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? "Analyzing..." : faceDetected ? "Capture & Analyze" : "Waiting for Face..."}
                    </Button>
                    <Button
                      onClick={handleStopWebcam}
                      variant="outline"
                      className="flex-1 border-white/20 text-gray-400 hover:text-white font-semibold py-2 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Results section */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Result card */}
                <div
                  className={`glass-dark p-6 rounded-xl border-l-4 ${
                    result.label === "Real"
                      ? "border-l-cyan-400"
                      : "border-l-purple-400"
                  }`}
                >
                  <div className="flex items-start gap-4 mb-6">
                    {result.label === "Real" ? (
                      <CheckCircle className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
                    )}
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Detection Result</p>
                      <p className="text-3xl font-bold text-white">{result.label}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Confidence Score</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              result.label === "Real"
                                ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                                : "bg-gradient-to-r from-purple-500 to-pink-500"
                            }`}
                            style={{ width: `${result.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-semibold min-w-fit">
                          {result.confidence.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Action insights */}
                    <div className="pt-4 border-t border-white/10">
                      {result.label === "Real" ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-cyan-400">✓ Verification Success</p>
                          <p className="text-xs text-gray-400">
                            This content appears to be authentic with high confidence.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-purple-400">⚠ Deepfake Detected</p>
                          <p className="text-xs text-gray-400">
                            This content shows signs of AI manipulation. Use caution when sharing.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Frame analysis */}
                <div className="glass-dark p-6 rounded-xl">
                  <h4 className="text-sm font-semibold text-white mb-4">Frame-by-Frame Analysis</h4>
                  <div className="space-y-2">
                    {result.frameAnalysis.map((frame) => (
                      <div key={frame.frame} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 min-w-fit">Frame {frame.frame}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                            style={{ width: `${frame.score * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400 min-w-fit">{(frame.score * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : webcamResult ? (
              <>
                {/* Webcam result card */}
                <div
                  className={`glass-dark p-6 rounded-xl border-l-4 ${
                    webcamResult.label === "Real"
                      ? "border-l-cyan-400"
                      : "border-l-purple-400"
                  }`}
                >
                  <div className="flex items-start gap-4 mb-6">
                    {webcamResult.label === "Real" ? (
                      <CheckCircle className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
                    )}
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Webcam Result</p>
                      <p className="text-3xl font-bold text-white">{webcamResult.label}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Confidence Score</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              webcamResult.label === "Real"
                                ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                                : "bg-gradient-to-r from-purple-500 to-pink-500"
                            }`}
                            style={{ width: `${webcamResult.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-semibold min-w-fit">
                          {webcamResult.confidence.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Action insights */}
                    <div className="pt-4 border-t border-white/10">
                      {webcamResult.label === "Real" ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-cyan-400">✓ Verification Success</p>
                          <p className="text-xs text-gray-400">
                            This content appears to be authentic with high confidence.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-purple-400">⚠ Deepfake Detected</p>
                          <p className="text-xs text-gray-400">
                            This content shows signs of AI manipulation. Use caution when sharing.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-dark p-6 rounded-xl text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-gray-400 text-sm">Upload a file or capture from webcam to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom home button */}
      <div className="mt-12 flex justify-center">
        <div className="text-center space-y-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-64 mx-auto"></div>
          <Button
            onClick={() => setLocation("/")}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 glow-cyan flex items-center justify-center gap-2 mx-auto"
          >
            <Home className="w-5 h-5" />
            Return to Home
          </Button>
          <p className="text-gray-500 text-sm">Need help? Check our documentation</p>
        </div>
      </div>
    </div>
  );
}
