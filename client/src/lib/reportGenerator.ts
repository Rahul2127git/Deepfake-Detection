import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export function generatePDFReport(analysisData: AnalysisData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Set colors
  const primaryColor = [0, 188, 212]; // Cyan
  const darkBg = [11, 16, 32]; // Dark background
  const textColor = [255, 255, 255]; // White
  const redColor = [239, 68, 68]; // Red
  const greenColor = [16, 185, 129]; // Green

  // Header
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(primaryColor[0] || 0, primaryColor[1] || 0, primaryColor[2] || 0);
  doc.setFontSize(24);
  doc.setFont('Helvetica', 'bold');
  doc.text('DeepShield AI', 20, 25);
  
  doc.setTextColor(textColor[0] || 0, textColor[1] || 0, textColor[2] || 0);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text('Deepfake Detection Analysis Report', 20, 32);

  yPosition = 50;

  // File Information Section
  doc.setTextColor(primaryColor[0] || 0, primaryColor[1] || 0, primaryColor[2] || 0);
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.text('File Information', 20, yPosition);
  yPosition += 8;

  doc.setTextColor(textColor[0] || 0, textColor[1] || 0, textColor[2] || 0);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(`File Name: ${analysisData.fileName}`, 20, yPosition);
  yPosition += 6;
  doc.text(`File Type: ${analysisData.fileType.toUpperCase()}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Analysis Date: ${analysisData.uploadTime}`, 20, yPosition);
  yPosition += 6;
  doc.text(`File ID: ${analysisData.fileId}`, 20, yPosition);
  yPosition += 12;

  // Analysis Summary Section
  doc.setTextColor(primaryColor[0] || 0, primaryColor[1] || 0, primaryColor[2] || 0);
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.text('Analysis Summary', 20, yPosition);
  yPosition += 8;

  // Deepfake Score Box
  const isDeepfake = analysisData.deepfakeScore > 50;
  const scoreColor = isDeepfake ? redColor : greenColor;
  const scoreStatus = isDeepfake ? 'LIKELY DEEPFAKE' : 'LIKELY REAL';

  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.rect(20, yPosition, 170, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text(`Deepfake Score: ${analysisData.deepfakeScore}%`, 30, yPosition + 8);
  doc.text(scoreStatus, 130, yPosition + 8);
  yPosition += 28;

  // Key Metrics
  doc.setTextColor(textColor[0] || 0, textColor[1] || 0, textColor[2] || 0);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Model Confidence: ${analysisData.modelConfidence}%`, 20, yPosition);
  yPosition += 6;

  if (analysisData.fileType === 'video') {
    doc.text(`Total Frames Analyzed: ${analysisData.frameAnalysis.totalFrames}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Deepfake Frames Detected: ${analysisData.frameAnalysis.deepfakeFrames}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Real Frames Detected: ${analysisData.frameAnalysis.realFrames}`, 20, yPosition);
    yPosition += 12;
  }

  // Artifacts Detected Section
  if (analysisData.artifactsDetected.length > 0) {
    doc.setTextColor(primaryColor[0] || 0, primaryColor[1] || 0, primaryColor[2] || 0);
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('Artifacts Detected', 20, yPosition);
    yPosition += 6;

    doc.setTextColor(textColor[0] || 0, textColor[1] || 0, textColor[2] || 0);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    analysisData.artifactsDetected.forEach((artifact) => {
      doc.text(`• ${artifact}`, 25, yPosition);
      yPosition += 4;
    });
    yPosition += 6;
  }

  // Detection Summary Table
  doc.setTextColor(primaryColor[0] || 0, primaryColor[1] || 0, primaryColor[2] || 0);
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text('Detection Summary by Model', 20, yPosition);
  yPosition += 8;

  const tableData = analysisData.detectionSummary.map((summary) => [
    summary.model,
    `${summary.confidence}%`,
    summary.result,
    summary.severity.toUpperCase(),
  ]);

  autoTable(doc, {
    head: [['Model', 'Confidence', 'Result', 'Severity']],
    body: tableData,
    startY: yPosition,
    margin: { left: 20, right: 20 },
    headStyles: {
      fillColor: [primaryColor[0] || 0, primaryColor[1] || 0, primaryColor[2] || 0] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold',
    },
    bodyStyles: {
      textColor: [textColor[0] || 0, textColor[1] || 0, textColor[2] || 0] as [number, number, number],
    },
    alternateRowStyles: {
      fillColor: [30, 40, 60] as [number, number, number],
    },
  });

  yPosition = (doc as any).lastAutoTable?.finalY || yPosition + 20;

  // Frame-by-Frame Analysis (if video)
  if (analysisData.fileType === 'video' && analysisData.frameBreakdown.length > 0) {
    // Add new page if needed
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setTextColor(primaryColor[0] || 0, primaryColor[1] || 0, primaryColor[2] || 0);
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('Frame-by-Frame Analysis (Sample)', 20, yPosition);
    yPosition += 8;

    const frameTableData = analysisData.frameBreakdown.slice(0, 15).map((frame) => [
      `#${frame.frameNumber}`,
      frame.timestamp,
      `${frame.confidence}%`,
      frame.result,
    ]);

    autoTable(doc, {
      head: [['Frame', 'Timestamp', 'Confidence', 'Result']],
      body: frameTableData,
      startY: yPosition,
      margin: { left: 20, right: 20 },
      headStyles: {
        fillColor: [primaryColor[0] || 0, primaryColor[1] || 0, primaryColor[2] || 0] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [textColor[0] || 0, textColor[1] || 0, textColor[2] || 0] as [number, number, number],
      },
      alternateRowStyles: {
        fillColor: [30, 40, 60] as [number, number, number],
      },
    });
  }

  // Footer
  const finalPage = doc.internal.pages.length - 1;
  doc.setTextColor(primaryColor[0] || 0, primaryColor[1] || 0, primaryColor[2] || 0);
  doc.setFontSize(8);
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    20,
    pageHeight - 10
  );
  doc.text(
    `Page ${finalPage} of ${finalPage}`,
    pageWidth - 40,
    pageHeight - 10
  );

  // Save PDF
  const fileName = `deepshield-analysis-${analysisData.fileId}.pdf`;
  doc.save(fileName);
}

export function downloadReportAsJSON(analysisData: AnalysisData): void {
  const dataStr = JSON.stringify(analysisData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `deepshield-analysis-${analysisData.fileId}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadReportAsCSV(analysisData: AnalysisData): void {
  let csv = 'DeepShield AI - Deepfake Detection Report\n';
  csv += `File Name,${analysisData.fileName}\n`;
  csv += `File Type,${analysisData.fileType}\n`;
  csv += `Analysis Date,${analysisData.uploadTime}\n`;
  csv += `Deepfake Score,${analysisData.deepfakeScore}%\n`;
  csv += `Model Confidence,${analysisData.modelConfidence}%\n`;
  csv += '\n';

  if (analysisData.fileType === 'video') {
    csv += 'Frame Analysis\n';
    csv += `Total Frames,${analysisData.frameAnalysis.totalFrames}\n`;
    csv += `Deepfake Frames,${analysisData.frameAnalysis.deepfakeFrames}\n`;
    csv += `Real Frames,${analysisData.frameAnalysis.realFrames}\n`;
    csv += '\n';
  }

  if (analysisData.artifactsDetected.length > 0) {
    csv += 'Artifacts Detected\n';
    analysisData.artifactsDetected.forEach((artifact) => {
      csv += `${artifact}\n`;
    });
    csv += '\n';
  }

  csv += 'Detection Summary\n';
  csv += 'Model,Confidence,Result,Severity\n';
  analysisData.detectionSummary.forEach((summary) => {
    csv += `${summary.model},${summary.confidence}%,${summary.result},${summary.severity}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `deepshield-analysis-${analysisData.fileId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
