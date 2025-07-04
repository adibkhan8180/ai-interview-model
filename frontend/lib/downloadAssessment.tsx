import { OverallFeedback } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const downloadFeedbackPdf = (feedback: OverallFeedback) => {
  const pdf = new jsPDF("p", "pt", "a4");
  const margin = 40;
  let yPos = margin;

  pdf.setFontSize(18);
  pdf.text("Interview Feedback Summary", margin, yPos);
  yPos += 30;

  // Summary
  pdf.setFontSize(12);
  pdf.text(`Overall Score: ${feedback.overall_score}`, margin, yPos);
  yPos += 20;
  pdf.text("Summary:", margin, yPos);
  yPos += 15;
  pdf.setFontSize(10);
  const splitSummary = pdf.splitTextToSize(feedback.summary, 500);
  pdf.text(splitSummary, margin, yPos);
  yPos += splitSummary.length * 12 + 15;

  // Questions Analysis Table
  pdf.setFontSize(12);
  pdf.text("Questions Analysis:", margin, yPos);
  yPos += 15;

  const questionsTableData = feedback.questions_analysis.map((qa) => [
    qa.question,
    qa.response,
    qa.feedback,
    qa.score.toString(),
  ]);

  autoTable(pdf, {
    startY: yPos,
    head: [["Question", "Response", "Feedback", "Score"]],
    body: questionsTableData,
    styles: { fontSize: 8, cellWidth: "wrap" },
    headStyles: { fillColor: [22, 160, 133] },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 180 },
      2: { cellWidth: 120 },
      3: { cellWidth: 40, halign: "center" },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      if (data.cursor) {
        yPos = data.cursor.y + 15;
      }
    },
  });

  // Coaching Scores
  pdf.setFontSize(12);
  pdf.text("Coaching Scores:", margin, yPos);
  yPos += 15;

  const coachingScores = feedback.coaching_scores;
  pdf.setFontSize(10);
  Object.entries(coachingScores).forEach(([key, value]) => {
    pdf.text(`${key.replace(/_/g, " ")}: ${value}`, margin + 10, yPos);
    yPos += 15;
  });
  yPos += 10;

  // Recommendations
  pdf.setFontSize(12);
  pdf.text("Recommendations:", margin, yPos);
  yPos += 15;
  pdf.setFontSize(10);
  feedback.recommendations.forEach((rec) => {
    pdf.text(`• ${rec}`, margin + 10, yPos);
    yPos += 15;
  });
  yPos += 10;

  // Closure message
  pdf.setFontSize(12);
  pdf.text("Closure Message:", margin, yPos);
  yPos += 15;
  pdf.setFontSize(10);
  const closureSplit = pdf.splitTextToSize(feedback.closure_message, 500);
  pdf.text(closureSplit, margin, yPos);
  yPos += closureSplit.length * 12 + 15;

  // Level
  pdf.setFontSize(12);
  pdf.text(`Level: ${feedback.level}`, margin, yPos);

  // Save file
  pdf.save("feedback.pdf");
};
