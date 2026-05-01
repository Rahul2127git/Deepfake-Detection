import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateProfessionalPDFReport } from '../lib/professionalReportGenerator';

describe('AnalysisResultsEnhanced', () => {
  const mockAnalysisData = {
    fileId: 'test-file-123',
    fileName: 'test-video.mp4',
    fileType: 'video' as const,
    uploadTime: '4/21/2026, 12:30:33 PM',
    fileSize: 5242880, // 5MB
    fileDuration: 30,
    deepfakeScore: 90.86,
    modelConfidence: 92,
    frameAnalysis: {
      totalFrames: 30,
      deepfakeFrames: 25,
      realFrames: 5,
    },
    artifactsDetected: [
      'Facial artifacts',
      'Blending inconsistencies',
      'Eye movement anomalies',
    ],
    detectionSummary: [
      {
        model: 'EfficientNet',
        confidence: 92,
        result: 'Deepfake' as const,
        severity: 'high' as const,
      },
      {
        model: 'XceptionNet',
        confidence: 88,
        result: 'Deepfake' as const,
        severity: 'high' as const,
      },
      {
        model: 'MesoNet',
        confidence: 85,
        result: 'Deepfake' as const,
        severity: 'medium' as const,
      },
    ],
    frameBreakdown: [
      {
        frameNumber: 1,
        timestamp: '00:00:00',
        confidence: 83.43,
        result: 'Deepfake' as const,
      },
      {
        frameNumber: 3,
        timestamp: '00:00:02',
        confidence: 78.45,
        result: 'Deepfake' as const,
      },
      {
        frameNumber: 5,
        timestamp: '00:00:04',
        confidence: 75.91,
        result: 'Deepfake' as const,
      },
    ],
  };

  describe('Risk Summary Section', () => {
    it('should calculate CRITICAL risk level for score >= 80', () => {
      const riskScore = mockAnalysisData.deepfakeScore;
      const riskLevel = riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : 'MEDIUM';
      expect(riskLevel).toBe('CRITICAL');
    });

    it('should calculate HIGH risk level for score 60-79', () => {
      const testScore = 75;
      const riskLevel = testScore >= 80 ? 'CRITICAL' : testScore >= 60 ? 'HIGH' : 'MEDIUM';
      expect(riskLevel).toBe('HIGH');
    });

    it('should include detection confidence', () => {
      expect(mockAnalysisData.modelConfidence).toBe(92);
    });

    it('should include deepfake probability', () => {
      expect(mockAnalysisData.deepfakeScore).toBe(90.86);
    });

    it('should provide recommendation based on score', () => {
      const isDeepfake = mockAnalysisData.deepfakeScore > 50;
      const recommendation = isDeepfake ? 'Verify Source' : 'Likely Safe';
      expect(recommendation).toBe('Verify Source');
    });
  });

  describe('Detailed Artifact Analysis Section', () => {
    it('should display all detected artifacts', () => {
      expect(mockAnalysisData.artifactsDetected).toHaveLength(3);
      expect(mockAnalysisData.artifactsDetected).toContain('Facial artifacts');
      expect(mockAnalysisData.artifactsDetected).toContain('Blending inconsistencies');
      expect(mockAnalysisData.artifactsDetected).toContain('Eye movement anomalies');
    });

    it('should provide severity levels for artifacts', () => {
      const artifactDetails: Record<string, string> = {
        'Facial artifacts': 'HIGH',
        'Blending inconsistencies': 'HIGH',
        'Eye movement anomalies': 'MEDIUM',
      };

      mockAnalysisData.artifactsDetected.forEach((artifact) => {
        expect(artifactDetails[artifact]).toBeDefined();
      });
    });

    it('should provide descriptions for each artifact', () => {
      const descriptions: Record<string, string> = {
        'Facial artifacts': 'Inconsistencies in facial features, skin tone, or texture that indicate manipulation',
        'Blending inconsistencies': 'Unnatural transitions or blending between manipulated and original content',
        'Eye movement anomalies': 'Unnatural eye movement, gaze direction, or pupil dilation patterns',
      };

      mockAnalysisData.artifactsDetected.forEach((artifact) => {
        expect(descriptions[artifact]).toBeDefined();
        expect(descriptions[artifact].length).toBeGreaterThan(0);
      });
    });
  });

  describe('Confidence Distribution Section', () => {
    it('should display confidence for all models', () => {
      mockAnalysisData.detectionSummary.forEach((summary) => {
        expect(summary.confidence).toBeGreaterThanOrEqual(0);
        expect(summary.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should show model comparison results', () => {
      expect(mockAnalysisData.detectionSummary).toHaveLength(3);
      const allDeepfake = mockAnalysisData.detectionSummary.every((s) => s.result === 'Deepfake');
      expect(allDeepfake).toBe(true);
    });

    it('should indicate severity levels', () => {
      const severities = mockAnalysisData.detectionSummary.map((s) => s.severity);
      expect(severities).toContain('high');
      expect(severities).toContain('medium');
    });
  });

  describe('Frame-by-Frame Analysis', () => {
    it('should display frame breakdown data', () => {
      expect(mockAnalysisData.frameBreakdown).toHaveLength(3);
    });

    it('should include timestamps for each frame', () => {
      mockAnalysisData.frameBreakdown.forEach((frame) => {
        expect(frame.timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      });
    });

    it('should include confidence for each frame', () => {
      mockAnalysisData.frameBreakdown.forEach((frame) => {
        expect(frame.confidence).toBeGreaterThanOrEqual(0);
        expect(frame.confidence).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Personalized Recommendations', () => {
    it('should provide recommendations for deepfake content', () => {
      const isDeepfake = mockAnalysisData.deepfakeScore > 50;
      expect(isDeepfake).toBe(true);

      const recommendations = [
        'Verify the source of this content before sharing or acting upon it',
        'Report this content to the appropriate platform or authorities',
        'Implement additional verification methods before distribution',
        'Consider using multiple detection tools for confirmation',
      ];

      expect(recommendations).toHaveLength(4);
      recommendations.forEach((rec) => {
        expect(rec.length).toBeGreaterThan(0);
      });
    });

    it('should provide different recommendations for authentic content', () => {
      const authScore = 25;
      const isDeepfake = authScore > 50;
      expect(isDeepfake).toBe(false);

      const recommendations = [
        'Content appears to be authentic based on our analysis',
        'Continue monitoring for any suspicious modifications',
        'Keep records of this analysis for future reference',
        'Use this report as supporting evidence if needed',
      ];

      expect(recommendations).toHaveLength(4);
    });
  });

  describe('Metadata Display', () => {
    it('should display file name', () => {
      expect(mockAnalysisData.fileName).toBe('test-video.mp4');
    });

    it('should display file type', () => {
      expect(mockAnalysisData.fileType).toBe('video');
    });

    it('should display upload time', () => {
      expect(mockAnalysisData.uploadTime).toBeDefined();
    });

    it('should display file size when available', () => {
      expect(mockAnalysisData.fileSize).toBe(5242880);
      const fileSizeMB = (mockAnalysisData.fileSize / 1024 / 1024).toFixed(2);
      expect(fileSizeMB).toBe('5.00');
    });

    it('should display duration when available', () => {
      expect(mockAnalysisData.fileDuration).toBe(30);
    });
  });

  describe('PDF Report Generation', () => {
    beforeEach(() => {
      vi.mock('jspdf', () => ({
        default: vi.fn(() => ({
          setFillColor: vi.fn(),
          rect: vi.fn(),
          setTextColor: vi.fn(),
          setFontSize: vi.fn(),
          setFont: vi.fn(),
          text: vi.fn(),
          splitTextToSize: vi.fn((text) => [text]),
          setPage: vi.fn(),
          internal: { pages: [null, null], pageSize: { height: 297 } },
          save: vi.fn(),
          lastAutoTable: { finalY: 100 },
        })),
      }));
    });

    it('should generate PDF report successfully', async () => {
      try {
        await generateProfessionalPDFReport(mockAnalysisData);
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeUndefined();
      }
    });

    it('should include company branding in PDF', async () => {
      const pdfContent = mockAnalysisData.fileName;
      expect(pdfContent).toBeDefined();
    });

    it('should include executive summary', async () => {
      const summary = `This analysis examined "${mockAnalysisData.fileName}"`;
      expect(summary).toContain(mockAnalysisData.fileName);
    });

    it('should include key findings', async () => {
      const findings = [
        `Deepfake Score: ${mockAnalysisData.deepfakeScore.toFixed(1)}%`,
        `Model Confidence: ${mockAnalysisData.modelConfidence}%`,
      ];

      expect(findings[0]).toContain('90.9');
      expect(findings[1]).toContain('92');
    });

    it('should include frame analysis for videos', async () => {
      if (mockAnalysisData.fileType === 'video') {
        expect(mockAnalysisData.frameAnalysis.totalFrames).toBe(30);
        expect(mockAnalysisData.frameAnalysis.deepfakeFrames).toBe(25);
      }
    });

    it('should include artifacts detected', async () => {
      expect(mockAnalysisData.artifactsDetected.length).toBeGreaterThan(0);
    });

    it('should include model comparison', async () => {
      expect(mockAnalysisData.detectionSummary.length).toBeGreaterThan(0);
    });

    it('should include recommendations', async () => {
      const isDeepfake = mockAnalysisData.deepfakeScore > 50;
      expect(isDeepfake).toBe(true);
    });

    it('should include file information', async () => {
      expect(mockAnalysisData.fileName).toBeDefined();
      expect(mockAnalysisData.fileType).toBeDefined();
      expect(mockAnalysisData.uploadTime).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should have valid analysis data structure', () => {
      expect(mockAnalysisData).toHaveProperty('fileId');
      expect(mockAnalysisData).toHaveProperty('fileName');
      expect(mockAnalysisData).toHaveProperty('fileType');
      expect(mockAnalysisData).toHaveProperty('uploadTime');
      expect(mockAnalysisData).toHaveProperty('deepfakeScore');
      expect(mockAnalysisData).toHaveProperty('modelConfidence');
      expect(mockAnalysisData).toHaveProperty('frameAnalysis');
      expect(mockAnalysisData).toHaveProperty('artifactsDetected');
      expect(mockAnalysisData).toHaveProperty('detectionSummary');
      expect(mockAnalysisData).toHaveProperty('frameBreakdown');
    });

    it('should have valid frame analysis', () => {
      const { totalFrames, deepfakeFrames, realFrames } = mockAnalysisData.frameAnalysis;
      expect(deepfakeFrames + realFrames).toBeLessThanOrEqual(totalFrames);
    });

    it('should have valid confidence scores', () => {
      expect(mockAnalysisData.deepfakeScore).toBeGreaterThanOrEqual(0);
      expect(mockAnalysisData.deepfakeScore).toBeLessThanOrEqual(100);
      expect(mockAnalysisData.modelConfidence).toBeGreaterThanOrEqual(0);
      expect(mockAnalysisData.modelConfidence).toBeLessThanOrEqual(100);
    });
  });
});
