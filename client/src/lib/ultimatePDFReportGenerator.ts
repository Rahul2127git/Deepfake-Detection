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

export async function generateUltimatePDFReport(data: AnalysisData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  // Color scheme
  const colors = {
    primary: [0, 200, 255],
    secondary: [100, 50, 255],
    success: [0, 255, 100],
    warning: [255, 150, 0],
    danger: [255, 50, 50],
    dark: [20, 30, 50],
    text: [200, 200, 200],
    textSecondary: [150, 150, 150],
  };

  // Helper: Draw circular gauge
  const drawCircularGauge = (x: number, y: number, radius: number, percentage: number, label: string) => {
    const centerX = x + radius;
    const centerY = y + radius;
    
    doc.setFillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.circle(centerX, centerY, radius, 'F');
    
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.5);
    doc.circle(centerX, centerY, radius, 'S');
    
    doc.setFontSize(24);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${percentage.toFixed(1)}%`, centerX, centerY - 2, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(label, centerX, centerY + 8, { align: 'center' });
  };

  // Helper: Draw progress bar
  const drawProgressBar = (x: number, y: number, width: number, height: number, percentage: number, color: number[]) => {
    doc.setFillColor(colors.dark[0] + 20, colors.dark[1] + 20, colors.dark[2] + 20);
    doc.rect(x, y, width, height, 'F');
    doc.setDrawColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.rect(x, y, width, height, 'S');
    
    const filledWidth = (width * percentage) / 100;
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, y, filledWidth, height, 'F');
  };

  // Helper: Get status color
  const getStatusColor = (score: number) => {
    if (score >= 80) return { label: 'Likely Deepfake', color: colors.danger };
    if (score >= 60) return { label: 'Suspicious', color: colors.warning };
    if (score >= 40) return { label: 'Uncertain', color: colors.warning };
    return { label: 'Likely Real', color: colors.success };
  };

  // ===== PAGE 1 =====

  // Header
  doc.setFontSize(20);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Deepfake Detection Report', 15, yPosition);
  yPosition += 8;

  // Report metadata
  doc.setFontSize(9);
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.setFont('helvetica', 'normal');
  const reportId = `RPT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  doc.text(`Report ID: ${reportId} • Generated: ${new Date().toLocaleDateString()} • File: ${data.fileName}`, 15, yPosition);
  yPosition += 7;

  // Summary bar
  const status = getStatusColor(data.deepfakeScore);
  doc.setFillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.rect(15, yPosition, pageWidth - 30, 12, 'F');
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(15, yPosition, pageWidth - 30, 12, 'S');
  
  doc.setFontSize(10);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Score: ${data.deepfakeScore.toFixed(1)}/100`, 18, yPosition + 8);
  
  doc.setTextColor(status.color[0], status.color[1], status.color[2]);
  doc.text(`Status: ${status.label}`, 60, yPosition + 8);
  
  doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.text(`Models Analyzed: ${data.detectionSummary.length}`, 120, yPosition + 8);
  
  yPosition += 18;

  // Score gauge and summary
  doc.setFillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.rect(15, yPosition, 60, 50, 'F');
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(15, yPosition, 60, 50, 'S');
  
  drawCircularGauge(18, yPosition + 5, 20, data.deepfakeScore, 'Confidence');
  yPosition += 5;

  // Detection summary
  doc.setFillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.rect(80, yPosition - 5, pageWidth - 95, 50, 'F');
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(80, yPosition - 5, pageWidth - 95, 50, 'S');
  
  doc.setFontSize(11);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Detection Summary', 83, yPosition + 2);
  
  doc.setFontSize(9);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`Model Confidence: ${data.modelConfidence}%`, 83, yPosition + 10);
  doc.text(`Total Frames: ${data.frameAnalysis.totalFrames}`, 83, yPosition + 18);
  doc.text(`Deepfake Frames: ${data.frameAnalysis.deepfakeFrames}`, 83, yPosition + 26);
  doc.text(`Real Frames: ${data.frameAnalysis.realFrames}`, 83, yPosition + 34);
  doc.text(`Artifacts: ${data.artifactsDetected.length}`, 83, yPosition + 42);
  
  yPosition += 58;

  // Detection indicators table with progress bars
  doc.setFontSize(11);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Detection Indicators Analysis', 15, yPosition);
  yPosition += 8;

  const tableData = data.detectionSummary.map(summary => {
    const confidenceColor = summary.confidence >= 80 ? colors.danger : summary.confidence >= 60 ? colors.warning : colors.success;
    return [
      summary.model,
      `${summary.confidence}%`,
      summary.result,
      summary.severity.toUpperCase(),
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['Model', 'Confidence', 'Result', 'Severity']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [colors.primary[0], colors.primary[1], colors.primary[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: [colors.text[0], colors.text[1], colors.text[2]],
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [colors.dark[0] + 20, colors.dark[1] + 20, colors.dark[2] + 20],
    },
    margin: { left: 15, right: 15 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 15;
  }

  // Threat assessment cards
  doc.setFontSize(11);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Threat Assessment', 15, yPosition);
  yPosition += 8;

  // Left card: Deepfake Risk
  doc.setFillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.rect(15, yPosition, (pageWidth - 45) / 2, 30, 'F');
  doc.setDrawColor(colors.danger[0], colors.danger[1], colors.danger[2]);
  doc.rect(15, yPosition, (pageWidth - 45) / 2, 30, 'S');
  
  doc.setFontSize(10);
  doc.setTextColor(colors.danger[0], colors.danger[1], colors.danger[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Deepfake Risk', 18, yPosition + 6);
  
  doc.setFontSize(14);
  doc.setTextColor(colors.danger[0], colors.danger[1], colors.danger[2]);
  doc.text(`${data.deepfakeScore.toFixed(1)}%`, 18, yPosition + 18);
  
  doc.setFontSize(8);
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Risk Level', 18, yPosition + 25);

  // Right card: Artifact Severity
  const artifactSeverity = data.artifactsDetected.length > 0 ? 'HIGH' : 'LOW';
  const artifactColor = data.artifactsDetected.length > 0 ? colors.warning : colors.success;
  
  doc.setFillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.rect(15 + (pageWidth - 45) / 2 + 15, yPosition, (pageWidth - 45) / 2, 30, 'F');
  doc.setDrawColor(artifactColor[0], artifactColor[1], artifactColor[2]);
  doc.rect(15 + (pageWidth - 45) / 2 + 15, yPosition, (pageWidth - 45) / 2, 30, 'S');
  
  doc.setFontSize(10);
  doc.setTextColor(artifactColor[0], artifactColor[1], artifactColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Artifact Severity', 18 + (pageWidth - 45) / 2 + 15, yPosition + 6);
  
  doc.setFontSize(14);
  doc.setTextColor(artifactColor[0], artifactColor[1], artifactColor[2]);
  doc.text(artifactSeverity, 18 + (pageWidth - 45) / 2 + 15, yPosition + 18);
  
  doc.setFontSize(8);
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.artifactsDetected.length} detected`, 18 + (pageWidth - 45) / 2 + 15, yPosition + 25);

  yPosition += 40;

  // Artifacts detected
  if (data.artifactsDetected.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Detected Artifacts', 15, yPosition);
    yPosition += 6;

    data.artifactsDetected.forEach(artifact => {
      doc.setFontSize(9);
      doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${artifact}`, 18, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // Check if we need a new page for recommendations
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = 15;
  }

  // Confidence Distribution Chart
  doc.setFontSize(11);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Confidence Distribution', 15, yPosition);
  yPosition += 8;

  // Draw confidence bars for each model
  data.detectionSummary.forEach((summary, idx) => {
    const confidenceColor = summary.confidence >= 80 ? colors.danger : summary.confidence >= 60 ? colors.warning : colors.success;
    
    doc.setFontSize(9);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(`${summary.model}:`, 18, yPosition);
    
    drawProgressBar(50, yPosition - 2, 100, 4, summary.confidence, confidenceColor);
    
    doc.setTextColor(confidenceColor[0], confidenceColor[1], confidenceColor[2]);
    doc.text(`${summary.confidence}%`, 155, yPosition);
    
    yPosition += 8;
  });

  yPosition += 5;

  // Personalized recommendations
  doc.setFontSize(11);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Security Recommendations', 15, yPosition);
  yPosition += 6;

  const recommendations = [
    'Verify the source and authenticity of this media through multiple channels',
    'Do not share or act upon this content without independent verification',
    'Report suspicious content to relevant authorities or platforms',
    'Use additional verification tools and expert analysis for critical decisions',
  ];

  recommendations.forEach((rec, idx) => {
    doc.setFontSize(9);
    doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}.`, 18, yPosition);
    
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFont('helvetica', 'normal');
    const wrappedText = doc.splitTextToSize(rec, 160);
    doc.text(wrappedText, 25, yPosition);
    yPosition += wrappedText.length * 4 + 2;
  });

  yPosition += 5;

  // Disclaimer
  doc.setFillColor(colors.dark[0] + 10, colors.dark[1] + 10, colors.dark[2] + 10);
  doc.rect(15, yPosition, pageWidth - 30, 15, 'F');
  doc.setDrawColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.rect(15, yPosition, pageWidth - 30, 15, 'S');
  
  doc.setFontSize(8);
  doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('⚠ Disclaimer:', 18, yPosition + 4);
  
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.setFont('helvetica', 'normal');
  const disclaimerText = 'This report is generated by AI for informational purposes only. While we strive for accuracy, no AI system is 100% accurate. Always verify results with additional analysis and expert judgment before making critical decisions.';
  const wrappedDisclaimer = doc.splitTextToSize(disclaimerText, 160);
  doc.text(wrappedDisclaimer, 18, yPosition + 9);

  // Add page numbers to all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const fileName = `deepfake-detection-${data.fileId}-${Date.now()}.pdf`;
  doc.save(fileName);
}
