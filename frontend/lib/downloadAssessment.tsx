import { OverallFeedback } from "@/types";
import jsPDF from "jspdf";

export const downloadFeedbackPdf = (feedback: OverallFeedback) => {
  const pdf = new jsPDF("p", "pt", "a4");
  const margin = 40;
  const pageHeight = 800;
  const lineHeight = 16;
  const bottomMargin = 40;
  let yPos = margin;

  const colors = {
    primary: [59, 100, 246],
    section: [22, 160, 133],
    black: [0, 0, 0],
    gray: [80, 80, 80],
  };

  const addTextWithCheck = (
    text: string | string[],
    fontSize = 10,
    fontStyle: "normal" | "bold" = "normal",
    color: number[] = colors.gray
  ) => {
    pdf.setFont("helvetica", fontStyle);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);

    const lines =
      typeof text === "string" ? pdf.splitTextToSize(text, 500) : text;

    lines.forEach((line) => {
      if (yPos + lineHeight > pageHeight - bottomMargin) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text(line, margin, yPos);
      yPos += lineHeight;
    });
  };

  const addSectionTitle = (title: string) => {
    yPos += 10;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...colors.section);
    pdf.text(title, margin, yPos);
    yPos += lineHeight;
  };

  // Header
  pdf.setFontSize(20);
  pdf.setTextColor(...colors.primary);
  pdf.setFont("helvetica", "bold");
  pdf.text("Interview Feedback Summary", margin, yPos);
  yPos += 35;

  // Overall Score
  addSectionTitle("Overall Score");
  addTextWithCheck(`${feedback.overall_score}/100`, 12, "bold", colors.black);

  // Summary
  addSectionTitle("Summary");
  addTextWithCheck(feedback.summary);

  // Questions Analysis
  addSectionTitle("Questions Analysis");
  feedback.questions_analysis.forEach((qa, index) => {
    addTextWithCheck(`Q${index + 1}: ${qa.question}`, 11, "bold", colors.black);
    addTextWithCheck(`Response: ${qa.response}`);
    addTextWithCheck(`Feedback: ${qa.feedback}`);
    addTextWithCheck(`Score: ${qa.score}/10`);
    yPos += 5;
  });

  // Coaching Scores
  addSectionTitle("Coaching Scores");
  Object.entries(feedback.coaching_scores).forEach(([key, value]) => {
    const formattedKey =
      key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) +
      ":";

    addTextWithCheck(`${formattedKey} ${value}/5`, 10, "normal", colors.black);
  });

  // Recommendations
  addSectionTitle("Recommendations");
  feedback.recommendations.forEach((rec) => {
    addTextWithCheck(`• ${rec}`, 10, "normal", colors.black);
  });

  // Closure Message
  addSectionTitle("Closure Message");
  addTextWithCheck(feedback.closure_message);

  // Final Level
  addSectionTitle("Candidate Level");
  addTextWithCheck(`${feedback.level}`, 12, "bold", colors.primary);

  pdf.save("feedback.pdf");
};
