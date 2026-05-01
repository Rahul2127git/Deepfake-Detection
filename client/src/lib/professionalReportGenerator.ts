import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export const generateProfessionalPDFReport = async (data: AnalysisData): Promise<void> => {
  try {
    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set colors
    const primaryColor = [0, 200, 255]; // Cyan
    const darkBg = [15, 23, 42]; // Slate-900
    const textColor = [255, 255, 255]; // White
    const accentRed = [239, 68, 68]; // Red-500
    const accentGreen = [16, 185, 129]; // Green-500

    let yPosition = 20;

    // Header with branding
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('DeepShield AI', 20, 20);
    
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Deepfake Detection Analysis Report', 20, 28);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);

    yPosition = 50;

    // Executive Summary
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 10;

    const riskLevel = data.deepfakeScore >= 80 ? 'CRITICAL' : data.deepfakeScore >= 60 ? 'HIGH' : data.deepfakeScore >= 40 ? 'MEDIUM' : 'LOW';
    const isDeepfake = data.deepfakeScore > 50;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    const summaryText = `This analysis examined "${data.fileName}" and detected a ${data.deepfakeScore.toFixed(1)}% probability of deepfake content with ${data.modelConfidence}% model confidence. The overall risk level is classified as ${riskLevel}. ${isDeepfake ? 'The content shows significant signs of manipulation and should be verified before sharing.' : 'The content appears to be authentic based on our analysis.'}`;
    
    const wrappedSummary = doc.splitTextToSize(summaryText, 170);
    doc.text(wrappedSummary, 20, yPosition);
    yPosition += wrappedSummary.length * 5 + 10;

    // Key Findings
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Findings', 20, yPosition);
    yPosition += 8;

    const findings: Array<{ label: string; value: string; color: number[] }> = [
      { label: 'Deepfake Score', value: `${data.deepfakeScore.toFixed(1)}%`, color: isDeepfake ? accentRed : accentGreen },
      { label: 'Model Confidence', value: `${data.modelConfidence}%`, color: primaryColor },
      { label: 'Risk Level', value: riskLevel, color: isDeepfake ? accentRed : accentGreen },
      { label: 'Detection Result', value: isDeepfake ? 'Likely Deepfake' : 'Likely Authentic', color: isDeepfake ? accentRed : accentGreen },
    ];

    findings.forEach((finding) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(`${finding.label}:`, 20, yPosition);
      doc.setTextColor(finding.color[0], finding.color[1], finding.color[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(finding.value, 100, yPosition);
      yPosition += 7;
    });

    yPosition += 5;

    // Frame Analysis (if video)
    if (data.fileType === 'video' && data.frameAnalysis.totalFrames > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text('Frame Analysis', 20, yPosition);
      yPosition += 8;

      const frameData: string[][] = [
        ['Metric', 'Count', 'Percentage'],
        ['Total Frames', data.frameAnalysis.totalFrames.toString(), '100%'],
        ['Deepfake Frames', data.frameAnalysis.deepfakeFrames.toString(), `${((data.frameAnalysis.deepfakeFrames / data.frameAnalysis.totalFrames) * 100).toFixed(1)}%`],
        ['Real Frames', data.frameAnalysis.realFrames.toString(), `${((data.frameAnalysis.realFrames / data.frameAnalysis.totalFrames) * 100).toFixed(1)}%`],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [frameData[0]],
        body: frameData.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]] as [number, number, number],
          textColor: [darkBg[0], darkBg[1], darkBg[2]] as [number, number, number],
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          textColor: [textColor[0], textColor[1], textColor[2]] as [number, number, number],
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [30, 41, 59],
        },
        margin: { left: 20, right: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Artifacts Detected
    if (data.artifactsDetected.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text('Artifacts Detected', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      data.artifactsDetected.forEach((artifact) => {
        doc.setTextColor(accentRed[0], accentRed[1], accentRed[2]);
        doc.text(`• ${artifact}`, 25, yPosition);
        yPosition += 5;
      });

      yPosition += 5;
    }

    // Detection Summary - Model Comparison
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Model Comparison', 20, yPosition);
    yPosition += 8;

    const modelData: string[][] = [
      ['Model', 'Confidence', 'Result', 'Severity'],
    ];
    data.detectionSummary.forEach((summary) => {
      modelData.push([
        summary.model,
        `${summary.confidence}%`,
        summary.result,
        summary.severity.toUpperCase(),
      ]);
    });

    autoTable(doc, {
      startY: yPosition,
      head: [modelData[0]],
      body: modelData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]] as [number, number, number],
        textColor: [darkBg[0], darkBg[1], darkBg[2]] as [number, number, number],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        textColor: [textColor[0], textColor[1], textColor[2]] as [number, number, number],
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [30, 41, 59],
      },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Recommendations
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Recommendations', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const recommendations = isDeepfake
      ? [
          'Verify the source of this content before sharing or acting upon it',
          'Report this content to the appropriate platform or authorities',
          'Implement additional verification methods before distribution',
          'Consider using multiple detection tools for confirmation',
        ]
      : [
          'Content appears to be authentic based on our analysis',
          'Continue monitoring for any suspicious modifications',
          'Keep records of this analysis for future reference',
          'Use this report as supporting evidence if needed',
        ];

    recommendations.forEach((rec, idx) => {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${idx + 1}.`, 20, yPosition);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const wrappedRec = doc.splitTextToSize(rec, 160);
      doc.text(wrappedRec, 25, yPosition);
      yPosition += wrappedRec.length * 4 + 3;
    });

    // File Information
    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('File Information', 20, yPosition);
    yPosition += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const fileInfo: string[] = [
      `File Name: ${data.fileName}`,
      `File Type: ${data.fileType.toUpperCase()}`,
      `Upload Time: ${data.uploadTime}`,
    ];
    if (data.fileSize) {
      fileInfo.push(`File Size: ${(data.fileSize / 1024 / 1024).toFixed(2)} MB`);
    }
    if (data.fileDuration) {
      fileInfo.push(`Duration: ${data.fileDuration}s`);
    }

    fileInfo.forEach((info) => {
      doc.setTextColor(150, 150, 150);
      doc.text(info, 20, yPosition);
      yPosition += 5;
    });

    // Footer
    const pageCount = (doc as any).internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `DeepShield AI Report | Page ${i} of ${pageCount} | ${new Date().toLocaleDateString()}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }

    // Save PDF
    doc.save(`deepshield-analysis-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
