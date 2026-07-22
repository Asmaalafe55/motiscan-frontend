"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudentExamSession, User } from "@/types";
import { examService } from "@/services/exam.service";
import { studentService } from "@/services/student.service";
import { connectSocket } from "@/lib/socket";

export interface ExamSessionData {
  connectedStudentIds: string[];
  sessions: StudentExamSession[];
  /** studentId → display name (from API, socket, or session row) */
  studentNames: Record<string, string>;
  isRefreshing: boolean;
}

interface SocketStudentPayload {
  examId?: string;
  studentId: string;
  studentName?: string;
  exerciseIndex?: number;
}

export function useExamSession(
  examId: string,
  isLive: boolean,
  intervalMs = 30_000
): ExamSessionData & {
  refresh: () => void;
  liveExerciseIndex: Record<string, number>;
} {
  const [connectedStudentIds, setConnectedStudentIds] = useState<string[]>([]);
  const [sessions, setSessions] = useState<StudentExamSession[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [liveExerciseIndex, setLiveExerciseIndex] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rememberName = useCallback((studentId: string, name?: string | null) => {
    if (!studentId || !name || name === studentId) return;
    setStudentNames((prev) =>
      prev[studentId] === name ? prev : { ...prev, [studentId]: name }
    );
  }, []);

  const refresh = useCallback(async () => {
    if (!isLive) return;

    setIsRefreshing(true);
    try {
      const apiSessions = await examService.getExamSessions(examId);
      setSessions(apiSessions);
      for (const s of apiSessions) {
        if (s.studentName) {
          setStudentNames((prev) =>
            prev[s.studentId] === s.studentName
              ? prev
              : { ...prev, [s.studentId]: s.studentName as string }
          );
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [examId, isLive]);

  useEffect(() => {
    if (!isLive) {
      setConnectedStudentIds([]);
      setSessions([]);
      setStudentNames({});
      setLiveExerciseIndex({});
      return;
    }

    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [isLive, refresh, intervalMs]);

  // Fill any missing names from the students API
  useEffect(() => {
    if (!isLive) return;

    const allIds = Array.from(
      new Set([...connectedStudentIds, ...sessions.map((s) => s.studentId)])
    );
    const missing = allIds.filter((id) => !studentNames[id]);
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const updates: Record<string, string> = {};
      await Promise.all(
        missing.map(async (id) => {
          const u = await studentService.getStudentById(id);
          if (u?.name) updates[id] = u.name;
        })
      );
      if (!cancelled && Object.keys(updates).length > 0) {
        setStudentNames((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connectedStudentIds, sessions, isLive, studentNames]);

  useEffect(() => {
    if (!isLive) {
      setConnectedStudentIds([]);
      return;
    }

    const socket = connectSocket();
    if (!socket.connected) socket.connect();

    const matchesExam = (payload: SocketStudentPayload) =>
      !payload.examId || payload.examId === examId;

    const addConnected = (studentId: string, studentName?: string) => {
      setConnectedStudentIds((prev) =>
        prev.includes(studentId) ? prev : [...prev, studentId]
      );
      rememberName(studentId, studentName);
    };

    const removeConnected = (studentId: string) => {
      setConnectedStudentIds((prev) => prev.filter((id) => id !== studentId));
    };

    const onRoster = ({
      examId: eid,
      students,
    }: {
      examId: string;
      students: SocketStudentPayload[];
    }) => {
      if (eid !== examId) return;
      setConnectedStudentIds(students.map((s) => s.studentId));
      for (const s of students) rememberName(s.studentId, s.studentName);
    };

    const onJoined = (payload: SocketStudentPayload) => {
      if (!matchesExam(payload)) return;
      addConnected(payload.studentId, payload.studentName);
      refresh();
    };

    const onLeft = (payload: SocketStudentPayload) => {
      if (!matchesExam(payload)) return;
      removeConnected(payload.studentId);
    };

    const onProgress = (payload: SocketStudentPayload) => {
      if (!matchesExam(payload)) return;
      rememberName(payload.studentId, payload.studentName);
      if (typeof payload.exerciseIndex === "number") {
        setLiveExerciseIndex((prev) => ({
          ...prev,
          [payload.studentId]: payload.exerciseIndex as number,
        }));
      }
      refresh();
    };

    const onSubmitted = (payload: SocketStudentPayload) => {
      if (!matchesExam(payload)) return;
      rememberName(payload.studentId, payload.studentName);
      refresh();
    };

    socket.on("session:roster", onRoster);
    socket.on("session:studentJoined", onJoined);
    socket.on("session:studentLeft", onLeft);
    socket.on("session:studentProgress", onProgress);
    socket.on("session:studentSubmitted", onSubmitted);

    return () => {
      socket.off("session:roster", onRoster);
      socket.off("session:studentJoined", onJoined);
      socket.off("session:studentLeft", onLeft);
      socket.off("session:studentProgress", onProgress);
      socket.off("session:studentSubmitted", onSubmitted);
    };
  }, [examId, isLive, refresh, rememberName]);

  return {
    connectedStudentIds,
    sessions,
    studentNames,
    liveExerciseIndex,
    isRefreshing,
    refresh,
  };
}
