"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudentExamSession, User } from "@/types";
import { liveSessionService } from "@/services/liveSession.service";
import { trackingService } from "@/services/tracking.service";
import { studentService } from "@/services/student.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExamSessionData {
  /** Student IDs currently connected (browsers open) */
  connectedStudentIds: string[];
  /** All students who have ever joined this session (incl. away/submitted) */
  sessions: StudentExamSession[];
  /** Maps studentId → display name */
  studentNames: Record<string, User>;
  isRefreshing: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Polls the live session and tracking service for a given exam.
 * Replaces ad-hoc polling in individual pages with a single reusable hook.
 * When the backend is ready, only the service functions need to change.
 *
 * @param examId   The exam to monitor.
 * @param isLive   Only polls while the exam is live; clears data when closed.
 * @param intervalMs  Poll interval in milliseconds (default 10s).
 */
export function useExamSession(
  examId: string,
  isLive: boolean,
  intervalMs = 10_000
): ExamSessionData & { refresh: () => void } {
  const [data, setData] = useState<ExamSessionData>({
    connectedStudentIds: [],
    sessions: [],
    studentNames: {},
    isRefreshing: false,
  });

  const refresh = useCallback(async () => {
    if (!isLive) {
      setData({ connectedStudentIds: [], sessions: [], studentNames: {}, isRefreshing: false });
      return;
    }

    setData((prev) => ({ ...prev, isRefreshing: true }));

    const [connectedStudentIds, sessions] = await Promise.all([
      liveSessionService.getConnectedStudents(examId),
      trackingService.getStudentSessionsForExam(examId),
    ]);

    // Resolve names for everyone who has a session (connected OR historical)
    const allIds = Array.from(
      new Set([...connectedStudentIds, ...sessions.map((s) => s.studentId)])
    );

    const userMap: Record<string, User> = {};
    await Promise.all(
      allIds.map(async (id) => {
        const u = await studentService.getStudentById(id);
        if (u) userMap[id] = u;
      })
    );

    setData({ connectedStudentIds, sessions, studentNames: userMap, isRefreshing: false });
  }, [examId, isLive]);

  useEffect(() => {
    refresh();
    if (!isLive) return;
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [isLive, refresh, intervalMs]);

  return { ...data, refresh };
}
