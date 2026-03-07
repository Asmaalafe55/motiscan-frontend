/**
 * Shared exam session state — used by both teacher and student views
 * to ensure consistency between what the teacher sees and what the student can access.
 *
 * This is the single source of truth for which exams are live and which students
 * have generated AI reports.
 */

// Track which (studentId, examId) pairs have a generated report
const generatedReports: Set<string> = new Set([
  // Pre-seeded: Sara's report on examA and both Ahmed & Maya on examC
  "sara:examA",
  "ahmed:examC",
  "maya:examC",
]);

export const examSessionService = {
  /** Returns true if an AI report has already been generated for this student/exam pair */
  hasReport: (studentId: string, examId: string): boolean => {
    return generatedReports.has(`${studentId}:${examId}`);
  },

  /** Mark a report as generated */
  markReportGenerated: (studentId: string, examId: string): void => {
    generatedReports.add(`${studentId}:${examId}`);
  },
};
