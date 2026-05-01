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
    result: 'Deepfake' | 'Real';
    severity: 'high' | 'medium' | 'low';
  }>;
  frameBreakdown: Array<{
    frameNumber: number;
    timestamp: string;
    confidence: number;
    result: 'Deepfake' | 'Real';
  }>;
}

export async function generateEnhancedPDFReport(data: AnalysisData): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Define colors matching the screenshot
    const colors = {
      darkBg: [15, 23, 42],
      primary: [0, 200, 255],
      danger: [239, 68, 68],
      success: [34, 197, 94],
      warning: [234, 179, 8],
      text: [226, 232, 240],
      textSecondary: [148, 163, 184],
    };

    // Helper function to add section header
    const addSectionHeader = (title: string, description: string = '') => {
      doc.setFontSize(14);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 15, yPosition);
      yPosition += 6;

      if (description) {
        doc.setFontSize(10);
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(description, 15, yPosition);
        yPosition += 5;
      }
      yPosition += 3;
    };

    // Helper function to add a card/box
    const addCard = (x: number, y: number, width: number, height: number, title: string, value: string, color: number[]) => {
      doc.setDrawColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.setLineWidth(0.5);
      doc.rect(x, y, width, height);

      doc.setFontSize(9);
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(title, x + 3, y + 5);

      doc.setFontSize(12);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(value, x + 3, y + 12);
    };

    // ===== HEADER =====
    doc.setFontSize(18);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis Results', 15, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.fileName} • ${data.uploadTime}`, 15, yPosition);
    yPosition += 10;

    // ===== DEEPFAKE SCORE & DETECTION INDICATORS =====
    addSectionHeader('Deepfake Score & Detection Indicators');

    // Score card
    addCard(15, yPosition, 40, 30, 'Confidence Level', `${data.deepfakeScore.toFixed(1)}%`, colors.danger);

    // Detection Indicators
    addCard(58, yPosition, 35, 10, 'Model Confidence', `${data.modelConfidence}%`, colors.primary);
    addCard(96, yPosition, 35, 10, 'Total Frames', `${data.frameAnalysis.totalFrames}`, colors.primary);
    addCard(134, yPosition, 35, 10, 'Deepfake Frames', `${data.frameAnalysis.deepfakeFrames}`, colors.danger);

    // Artifacts row
    addCard(58, yPosition + 12, 111, 8, 'Artifacts Detected', data.artifactsDetected.join(', '), colors.warning);

    yPosition += 42;

    // ===== RISK SUMMARY =====
    addSectionHeader('Risk Summary', 'Comprehensive risk assessment');

    const riskLevel = data.deepfakeScore >= 80 ? 'CRITICAL' : data.deepfakeScore >= 60 ? 'HIGH' : 'MEDIUM';
    const riskColor = riskLevel === 'CRITICAL' ? colors.danger : riskLevel === 'HIGH' ? colors.warning : colors.success;

    addCard(15, yPosition, 40, 15, 'Overall Risk Level', riskLevel, riskColor);
    addCard(58, yPosition, 40, 15, 'Detection Confidence', `${data.modelConfidence}%`, colors.primary);
    addCard(101, yPosition, 40, 15, 'Deepfake Probability', `${data.deepfakeScore.toFixed(1)}%`, colors.danger);

    yPosition += 20;

    // ===== FRAME-BY-FRAME ANALYSIS =====
    addSectionHeader('Frame-by-Frame Analysis', 'Detailed breakdown for video analysis');

    const frameTableData = data.frameBreakdown.slice(0, 5).map((frame) => [
      `#${frame.frameNumber}`,
      frame.timestamp,
      `${frame.confidence.toFixed(1)}%`,
      frame.result,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Frame', 'Timestamp', 'Confidence', 'Result']],
      body: frameTableData,
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary as [number, number, number],
        textColor: colors.darkBg as [number, number, number],
        fontSize: 9,
        font: 'helvetica',
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: colors.text as [number, number, number],
        fontSize: 8,
        fillColor: [30, 41, 59] as [number, number, number],
      },
      alternateRowStyles: {
        fillColor: [20, 30, 48] as [number, number, number],
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;

    // ===== DETECTION SUMMARY =====
    addSectionHeader('Detection Summary', 'Model comparison results');

    const modelTableData = data.detectionSummary.map((summary) => [
      summary.model,
      `${summary.confidence}%`,
      summary.result,
      summary.severity.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Model', 'Confidence', 'Result', 'Severity']],
      body: modelTableData,
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary as [number, number, number],
        textColor: colors.darkBg as [number, number, number],
        fontSize: 9,
        font: 'helvetica',
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: colors.text as [number, number, number],
        fontSize: 8,
        fillColor: [30, 41, 59] as [number, number, number],
      },
      alternateRowStyles: {
        fillColor: [20, 30, 48] as [number, number, number],
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;

    // ===== DETAILED ARTIFACT ANALYSIS =====
    addSectionHeader('Detailed Artifact Analysis', 'In-depth examination of detected artifacts');

    const artifactDetails: Record<string, string> = {
      'Facial artifacts': 'Inconsistencies in facial features, skin tone, or texture indicating manipulation',
      'Blending inconsistencies': 'Unnatural transitions or blending between manipulated and original content',
      'Eye movement anomalies': 'Unnatural eye movement, gaze direction, or pupil dilation patterns',
    };

    data.artifactsDetected.forEach((artifact) => {
      const detail = artifactDetails[artifact] || 'Detected artifact in the content';
      doc.setFontSize(9);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${artifact}`, 15, yPosition);
      yPosition += 4;

      doc.setFontSize(8);
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.setFont('helvetica', 'normal');
      const wrappedText = doc.splitTextToSize(detail, 170);
      doc.text(wrappedText, 20, yPosition);
      yPosition += wrappedText.length * 3 + 2;
    });

    yPosition += 3;

    // ===== CONFIDENCE DISTRIBUTION =====
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 15;
    }

    addSectionHeader('Confidence Distribution', 'Analysis confidence across detection models');

    data.detectionSummary.forEach((summary) => {
      doc.setFontSize(9);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(`${summary.model}: ${summary.confidence}%`, 15, yPosition);

      // Draw progress bar
      const barWidth = 150;
      const barHeight = 3;
      doc.setDrawColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.rect(15, yPosition + 2, barWidth, barHeight);

      const fillColor = summary.result === 'Deepfake' ? colors.danger : colors.success;
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      const fillWidth = (summary.confidence / 100) * barWidth;
      doc.rect(15, yPosition + 2, fillWidth, barHeight, 'F');

      yPosition += 8;
    });

    yPosition += 5;

    // ===== PERSONALIZED RECOMMENDATIONS =====
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 15;
    }

    addSectionHeader('Personalized Recommendations', 'Actions and next steps based on analysis');

    const isDeepfake = data.deepfakeScore > 50;
    const recommendations = isDeepfake
      ? [
          'Verify the source of this content before sharing or acting upon it',
          'Report this content to the appropriate platform or authorities',
          'Implement additional verification methods before distribution',
        ]
      : [
          'Content appears to be authentic based on our analysis',
          'Continue monitoring for any suspicious modifications',
          'Keep records of this analysis for future reference',
        ];

    recommendations.forEach((rec, idx) => {
      doc.setFontSize(9);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`✓ ${rec}`, 15, yPosition);
      yPosition += 5;
    });

    yPosition += 5;

    // ===== FILE INFORMATION =====
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 15;
    }

    addSectionHeader('File Information', 'Analysis metadata');

    const fileInfoData = [
      ['File Name', data.fileName],
      ['File Type', data.fileType.toUpperCase()],
      ['Upload Time', data.uploadTime],
      ...(data.fileSize ? [['File Size', `${(data.fileSize / 1024 / 1024).toFixed(2)} MB`]] : []),
      ...(data.fileDuration ? [['Duration', `${data.fileDuration} seconds`]] : []),
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Property', 'Value']],
      body: fileInfoData,
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary as [number, number, number],
        textColor: colors.darkBg as [number, number, number],
        fontSize: 9,
        font: 'helvetica',
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: colors.text as [number, number, number],
        fontSize: 8,
        fillColor: [30, 41, 59] as [number, number, number],
      },
      alternateRowStyles: {
        fillColor: [20, 30, 48] as [number, number, number],
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { halign: 'left', cellWidth: 50 },
        1: { halign: 'left', cellWidth: 100 },
      },
    });

    // ===== FOOTER =====
    const totalPages = (doc as any).internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, pageHeight - 10);
    }

    // Save PDF
    doc.save(`deepshield-analysis-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}
