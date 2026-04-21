import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, AlertTriangle, CheckCircle } from 'lucide-react';

interface AnalysisData {
  fileId: string;
  fileName: string;
  fileType: 'image' | 'video';
  uploadTime: string;
  deepfakeScore: number;
  modelConfidence: number;
  frameAnalysis: {
    totalFrames: number;
    deepfakeFrames: number;
    realFrames: number;
  };
  artifactsDetected: string[];
  detectionSummary: Array<{
    model: string;
    confidence: number;
    result: 'Real' | 'Deepfake';
    severity: 'low' | 'medium' | 'high';
  }>;
  frameBreakdown: Array<{
    frameNumber: number;
    timestamp: string;
    confidence: number;
    result: 'Real' | 'Deepfake';
  }>;
}

export const AnalysisResults: React.FC = () => {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Get analysis data from localStorage
    const stored = localStorage.getItem('lastAnalysisResult');
    if (stored) {
      try {
        setAnalysisData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse analysis data:', e);
      }
    }
  }, []);

  const handleDownloadReport = async () => {
    if (!analysisData) return;
    setIsDownloading(true);
    try {
      // TODO: Implement PDF generation
      console.log('Downloading report for:', analysisData.fileName);
      // Call tRPC procedure to generate PDF
    } finally {
      setIsDownloading(false);
    }
  };

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-400">No analysis data available</p>
            <Button
              onClick={() => navigate('/upload')}
              className="mt-4 bg-cyan-500 hover:bg-cyan-600"
            >
              Back to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deepfakePercentage = analysisData.deepfakeScore;
  const isDeepfake = deepfakePercentage > 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/upload')}
              className="hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Analysis Results</h1>
              <p className="text-slate-400 text-sm">
                {analysisData.fileName} • {analysisData.uploadTime}
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Generating...' : 'Download Report'}
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Deepfake Score - Large Gauge */}
          <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Deepfake Score</CardTitle>
              <CardDescription>Confidence Level</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="relative w-32 h-32 mb-4">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="55"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="55"
                    fill="none"
                    stroke={isDeepfake ? '#ef4444' : '#10b981'}
                    strokeWidth="8"
                    strokeDasharray={`${(deepfakePercentage / 100) * 345.6} 345.6`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">
                      {deepfakePercentage}%
                    </div>
                    <div className="text-xs text-slate-400">Confidence</div>
                  </div>
                </div>
              </div>
              <div className={`text-center px-4 py-2 rounded-lg ${
                isDeepfake
                  ? 'bg-red-500/20 border border-red-500/50'
                  : 'bg-green-500/20 border border-green-500/50'
              }`}>
                <p className={isDeepfake ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                  {isDeepfake ? 'Likely Deepfake' : 'Likely Real'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detection Indicators */}
          <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Detection Indicators</CardTitle>
              <CardDescription>Key metrics and analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Model Confidence */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Model Confidence</span>
                  <span className="text-cyan-400 font-semibold">{analysisData.modelConfidence}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                    style={{ width: `${analysisData.modelConfidence}%` }}
                  />
                </div>
              </div>

              {/* Frame Analysis */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">
                    {analysisData.frameAnalysis.totalFrames}
                  </div>
                  <div className="text-xs text-slate-400">Total Frames</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {analysisData.frameAnalysis.deepfakeFrames}
                  </div>
                  <div className="text-xs text-slate-400">Deepfake</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {analysisData.frameAnalysis.realFrames}
                  </div>
                  <div className="text-xs text-slate-400">Real</div>
                </div>
              </div>

              {/* Artifacts Detected */}
              <div className="pt-4 border-t border-slate-700">
                <p className="text-sm font-semibold text-slate-300 mb-2">Artifacts Detected</p>
                <div className="flex flex-wrap gap-2">
                  {analysisData.artifactsDetected.length > 0 ? (
                    analysisData.artifactsDetected.map((artifact, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-xs text-yellow-400"
                      >
                        {artifact}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-sm">No significant artifacts detected</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Frame-by-Frame Analysis */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Frame-by-Frame Analysis</CardTitle>
            <CardDescription>Detailed breakdown for video analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Frame</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Timestamp</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Confidence</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.frameBreakdown.slice(0, 10).map((frame, idx) => (
                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-slate-300">#{frame.frameNumber}</td>
                      <td className="py-3 px-4 text-slate-400">{frame.timestamp}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                frame.result === 'Deepfake'
                                  ? 'bg-red-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${frame.confidence}%` }}
                            />
                          </div>
                          <span className="text-slate-300 text-xs font-semibold">
                            {frame.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            frame.result === 'Deepfake'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                              : 'bg-green-500/20 text-green-400 border border-green-500/50'
                          }`}
                        >
                          {frame.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analysisData.frameBreakdown.length > 10 && (
                <div className="text-center py-4 text-slate-400 text-sm">
                  Showing 10 of {analysisData.frameBreakdown.length} frames
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detection Summary */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">Detection Summary</CardTitle>
            <CardDescription>Results from all detection models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisData.detectionSummary.map((summary, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    summary.result === 'Deepfake'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-green-500/10 border-green-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-200">{summary.model}</h4>
                    {summary.result === 'Deepfake' ? (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Confidence</span>
                      <span className="text-slate-200 font-semibold">{summary.confidence}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Result</span>
                      <span
                        className={`font-semibold ${
                          summary.result === 'Deepfake'
                            ? 'text-red-400'
                            : 'text-green-400'
                        }`}
                      >
                        {summary.result}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Severity</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          summary.severity === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : summary.severity === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {summary.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
