import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, AlertTriangle, CheckCircle, TrendingUp, Shield } from 'lucide-react';
import { generateProfessionalPDFReport } from '@/lib/professionalReportGenerator';

interface AnalysisData {
  fileId: string;
  fileName: string;
  fileType: 'image' | 'video';
  uploadTime: string;
  fileSize?: number;
  fileDuration?: number;
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

export const AnalysisResultsEnhanced: React.FC = () => {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
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
      await generateProfessionalPDFReport(analysisData);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
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
  
  // Calculate risk level
  const getRiskLevel = () => {
    if (deepfakePercentage >= 80) return { level: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (deepfakePercentage >= 60) return { level: 'HIGH', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    if (deepfakePercentage >= 40) return { level: 'MEDIUM', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { level: 'LOW', color: 'text-green-500', bg: 'bg-green-500/10' };
  };

  const riskLevel = getRiskLevel();

  // Recommendations based on analysis
  const getRecommendations = () => {
    const recommendations = [];
    if (isDeepfake) {
      recommendations.push({
        title: 'Verify Source',
        description: 'Contact the original source to verify the authenticity of this media',
        icon: '🔍',
      });
      recommendations.push({
        title: 'Report Content',
        description: 'Report this content to the platform or relevant authorities',
        icon: '⚠️',
      });
      recommendations.push({
        title: 'Implement Verification',
        description: 'Use additional verification methods before sharing or acting on this content',
        icon: '✓',
      });
    } else {
      recommendations.push({
        title: 'Content Verified',
        description: 'This content appears to be authentic based on our analysis',
        icon: '✓',
      });
      recommendations.push({
        title: 'Keep Monitoring',
        description: 'Continue monitoring for any suspicious modifications',
        icon: '👁️',
      });
    }
    return recommendations;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Deepfake Score - Large Gauge */}
          <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Deepfake Score</CardTitle>
              <CardDescription>Confidence Level</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="relative w-32 h-32 mb-4">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="55" fill="none" stroke="#334155" strokeWidth="8" />
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
                    <div className="text-2xl font-bold text-white">{deepfakePercentage.toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">Confidence</div>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${isDeepfake ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {isDeepfake ? 'Likely Deepfake' : 'Likely Authentic'}
              </div>
            </CardContent>
          </Card>

          {/* Detection Indicators */}
          <Card className="lg:col-span-3 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Detection Indicators</CardTitle>
              <CardDescription>Key metrics and analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Model Confidence</span>
                  <span className="text-sm font-semibold text-cyan-400">{analysisData.modelConfidence}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all"
                    style={{ width: `${analysisData.modelConfidence}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">{analysisData.frameAnalysis.totalFrames}</div>
                  <div className="text-xs text-slate-400">Total Frames</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{analysisData.frameAnalysis.deepfakeFrames}</div>
                  <div className="text-xs text-slate-400">Deepfake</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{analysisData.frameAnalysis.realFrames}</div>
                  <div className="text-xs text-slate-400">Real</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-300 mb-2">Artifacts Detected</div>
                <div className="flex flex-wrap gap-2">
                  {analysisData.artifactsDetected.map((artifact, idx) => (
                    <span key={idx} className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                      {artifact}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Summary Section */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Risk Summary</CardTitle>
            <CardDescription>Comprehensive risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border ${riskLevel.bg} border-slate-600`}>
                <div className="text-sm text-slate-400 mb-1">Overall Risk Level</div>
                <div className={`text-2xl font-bold ${riskLevel.color}`}>{riskLevel.level}</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                <div className="text-sm text-slate-400 mb-1">Detection Confidence</div>
                <div className="text-2xl font-bold text-cyan-400">{analysisData.modelConfidence}%</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                <div className="text-sm text-slate-400 mb-1">Deepfake Probability</div>
                <div className="text-2xl font-bold text-red-400">{deepfakePercentage.toFixed(1)}%</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                <div className="text-sm text-slate-400 mb-1">Recommendation</div>
                <div className={`text-sm font-semibold ${isDeepfake ? 'text-red-400' : 'text-green-400'}`}>
                  {isDeepfake ? 'Verify Source' : 'Likely Safe'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2 px-2 text-slate-300 font-semibold">Frame</th>
                    <th className="text-left py-2 px-2 text-slate-300 font-semibold">Timestamp</th>
                    <th className="text-left py-2 px-2 text-slate-300 font-semibold">Confidence</th>
                    <th className="text-left py-2 px-2 text-slate-300 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.frameBreakdown.slice(0, 10).map((frame, idx) => (
                    <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/30">
                      <td className="py-2 px-2 text-slate-300">#{frame.frameNumber}</td>
                      <td className="py-2 px-2 text-slate-400">{frame.timestamp}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${frame.result === 'Deepfake' ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${frame.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{frame.confidence.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${frame.result === 'Deepfake' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          {frame.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Detection Summary - Model Comparison */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Detection Summary</CardTitle>
            <CardDescription>Results from all detection models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisData.detectionSummary.map((summary, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-white">{summary.model}</h4>
                    <AlertTriangle className={`w-4 h-4 ${summary.severity === 'high' ? 'text-red-500' : summary.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'}`} />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Confidence</div>
                      <div className="text-lg font-bold text-cyan-400">{summary.confidence}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Result</div>
                      <div className={`text-sm font-semibold ${summary.result === 'Deepfake' ? 'text-red-400' : 'text-green-400'}`}>
                        {summary.result}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Severity</div>
                      <div className={`text-xs font-semibold uppercase ${summary.severity === 'high' ? 'text-red-400' : summary.severity === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {summary.severity}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Artifact Analysis */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Detailed Artifact Analysis</CardTitle>
            <CardDescription>In-depth examination of detected artifacts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisData.artifactsDetected.map((artifact, idx) => {
                const artifactDetails: Record<string, { severity: string; description: string; impact: string }> = {
                  'Facial artifacts': {
                    severity: 'HIGH',
                    description: 'Inconsistencies in facial features, skin tone, or texture that indicate manipulation',
                    impact: 'Strong indicator of deepfake content',
                  },
                  'Blending inconsistencies': {
                    severity: 'HIGH',
                    description: 'Unnatural transitions or blending between manipulated and original content',
                    impact: 'Clear sign of post-processing or face-swapping',
                  },
                  'Eye movement anomalies': {
                    severity: 'MEDIUM',
                    description: 'Unnatural eye movement, gaze direction, or pupil dilation patterns',
                    impact: 'Suggests AI-generated facial movements',
                  },
                };
                const detail = artifactDetails[artifact] || {
                  severity: 'MEDIUM',
                  description: 'Detected artifact in the content',
                  impact: 'Suggests potential manipulation',
                };
                return (
                  <div key={idx} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white">{artifact}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        detail.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                        detail.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {detail.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{detail.description}</p>
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold">Impact:</span> {detail.impact}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Confidence Distribution</CardTitle>
            <CardDescription>Analysis confidence across detection models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analysisData.detectionSummary.map((summary, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">{summary.model}</span>
                    <span className={`text-sm font-bold ${
                      summary.result === 'Deepfake' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {summary.confidence}% - {summary.result}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        summary.result === 'Deepfake' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                        'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                      style={{ width: `${summary.confidence}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personalized Recommendations */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Personalized Recommendations</CardTitle>
            <CardDescription>Actions and next steps based on analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getRecommendations().map((rec, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                  <div className="text-2xl">{rec.icon}</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{rec.title}</h4>
                    <p className="text-sm text-slate-400">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">File Information</CardTitle>
            <CardDescription>Metadata and analysis details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">File Name</div>
                <div className="text-sm font-medium text-white">{analysisData.fileName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">File Type</div>
                <div className="text-sm font-medium text-white capitalize">{analysisData.fileType}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Upload Time</div>
                <div className="text-sm font-medium text-white">{analysisData.uploadTime}</div>
              </div>
              {analysisData.fileSize && (
                <div>
                  <div className="text-xs text-slate-400 mb-1">File Size</div>
                  <div className="text-sm font-medium text-white">{(analysisData.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              )}
              {analysisData.fileDuration && (
                <div>
                  <div className="text-xs text-slate-400 mb-1">Duration</div>
                  <div className="text-sm font-medium text-white">{analysisData.fileDuration}s</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
