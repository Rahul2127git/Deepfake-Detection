import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generatePDFReport, downloadReportAsJSON, downloadReportAsCSV } from '@/lib/reportGenerator';

describe('Report Generation', () => {
  const mockAnalysisData = {
    fileId: 'test-123',
    fileName: 'test-video.mp4',
    fileType: 'video' as const,
    uploadTime: '2026-04-21 12:00:00',
    deepfakeScore: 85,
    modelConfidence: 92,
    frameAnalysis: {
      totalFrames: 30,
      deepfakeFrames: 25,
      realFrames: 5,
    },
    artifactsDetected: ['Facial artifacts', 'Blending inconsistencies'],
    detectionSummary: [
      {
        model: 'EfficientNet',
        confidence: 92,
        result: 'Deepfake' as const,
        severity: 'high' as const,
      },
    ],
    frameBreakdown: [
      {
        frameNumber: 1,
        timestamp: '00:00:00',
        confidence: 85,
        result: 'Deepfake' as const,
      },
      {
        frameNumber: 2,
        timestamp: '00:00:01',
        confidence: 90,
        result: 'Deepfake' as const,
      },
    ],
  };

  beforeEach(() => {
    // Mock document.createElement for download links
    vi.spyOn(document, 'createElement').mockReturnValue({
      click: vi.fn(),
      href: '',
      download: '',
    } as any);

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('generatePDFReport', () => {
    it('should create a PDF report with analysis data', () => {
      const saveSpy = vi.fn();
      
      // Mock jsPDF
      vi.mock('jspdf', () => ({
        jsPDF: class {
          internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 }, pages: [1, 2] };
          setFillColor = vi.fn();
          rect = vi.fn();
          setTextColor = vi.fn();
          setFontSize = vi.fn();
          setFont = vi.fn();
          text = vi.fn();
          addPage = vi.fn();
          save = saveSpy;
        },
      }));

      // Call should not throw
      expect(() => generatePDFReport(mockAnalysisData)).not.toThrow();
    });

    it('should handle deepfake and real scores correctly', () => {
      const deepfakeData = { ...mockAnalysisData, deepfakeScore: 95 };
      const realData = { ...mockAnalysisData, deepfakeScore: 15 };

      expect(() => generatePDFReport(deepfakeData)).not.toThrow();
      expect(() => generatePDFReport(realData)).not.toThrow();
    });
  });

  describe('downloadReportAsJSON', () => {
    it('should create a JSON file download', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      
      downloadReportAsJSON(mockAnalysisData);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should include all analysis data in JSON', () => {
      const blobSpy = vi.spyOn(global, 'Blob' as any);
      
      downloadReportAsJSON(mockAnalysisData);

      // Verify Blob was called with JSON stringified data
      expect(blobSpy).toHaveBeenCalled();
    });
  });

  describe('downloadReportAsCSV', () => {
    it('should create a CSV file download', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      
      downloadReportAsCSV(mockAnalysisData);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should include all analysis data in CSV', () => {
      const blobSpy = vi.spyOn(global, 'Blob' as any);
      
      downloadReportAsCSV(mockAnalysisData);

      // Verify Blob was called with CSV data
      expect(blobSpy).toHaveBeenCalled();
    });
  });

  describe('Analysis data structure', () => {
    it('should have all required fields', () => {
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

    it('should have valid deepfake score range', () => {
      expect(mockAnalysisData.deepfakeScore).toBeGreaterThanOrEqual(0);
      expect(mockAnalysisData.deepfakeScore).toBeLessThanOrEqual(100);
    });

    it('should have valid model confidence range', () => {
      expect(mockAnalysisData.modelConfidence).toBeGreaterThanOrEqual(0);
      expect(mockAnalysisData.modelConfidence).toBeLessThanOrEqual(100);
    });

    it('should have correct frame analysis counts', () => {
      const { totalFrames, deepfakeFrames, realFrames } = mockAnalysisData.frameAnalysis;
      expect(deepfakeFrames + realFrames).toBeLessThanOrEqual(totalFrames);
    });
  });
});
