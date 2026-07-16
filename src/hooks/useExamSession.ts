"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudentExamSession, User } from "@/types";
import { examService } from "@/services/exam.service";
import { studentService } from "@/services/student.service";
import { connectSocket, getSocket } from "@/lib/socket";

export interface ExamSessionData {
  connectedStudentIds: string[];
  sessions: StudentExamSession[];
  studentNames: Record<string, User>;
  isRefreshing: boolean;
}

interface SocketStudentPayload {
  examId?: string;
  studentId: string;
  studentName?: string;
}

export function useExamSession(
  examId: string,
  isLive: boolean,
  intervalMs = 10_000
): ExamSessionData & { refresh: () => void } {
  const [connectedStudentIds, setConnectedStudentIds] = useState<string[]>([]);
  const [sessions, setSessions] = useState<StudentExamSession[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, User>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLive) return;

    setIsRefreshing(true);
    try {
      const apiSessions = await examService.getExamSessions(examId);
      setSessions(apiSessions);
    } finally {
      setIsRefreshing(false);
    }
  }, [examId, isLive]);

  useEffect(() => {
    if (!isLive) {
      setConnectedStudentIds([]);
      setSessions([]);
      setStudentNames({});
      return;
    }

    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [isLive, refresh, intervalMs]);

  useEffect(() => {
    if (!isLive) return;

    const allIds = Array.from(
      new Set([...connectedStudentIds, ...sessions.map((s) => s.studentId)])
    );
    if (allIds.length === 0) {
      setStudentNames({});
      return;
    }

    let cancelled = false;
    (async () => {
      const userMap: Record<string, User> = {};
      await Promise.all(
        allIds.map(async (id) => {
          const u = await studentService.getStudentById(id);
          if (u) userMap[id] = u;
        })
      );
      if (!cancelled) setStudentNames(userMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [connectedStudentIds, sessions, isLive]);

  useEffect(() => {
    if (!isLive) {
      setConnectedStudentIds([]);
      return;
    }

    const socket = connectSocket();
    if (!socket.connected) socket.connect();

    const matchesExam = (payload: SocketStudentPayload) =>
      !payload.examId || payload.examId === examId;

    const addConnected = (studentId: string) => {
      setConnectedStudentIds((prev) =>
        prev.includes(studentId) ? prev : [...prev, studentId]
      );
    };

    const removeConnected = (studentId: string) => {
      setConnectedStudentIds((prev) => prev.filter((id) => id !== studentId));
    };

    const onRoster = ({ examId: eid, students }: { examId: string; students: SocketStudentPayload[] }) => {
      if (eid !== examId) return;
      setConnectedStudentIds(students.map((s) => s.studentId));
    };

    const onJoined = (payload: SocketStudentPayload) => {
      if (!matchesExam(payload)) return;
      addConnected(payload.studentId);
      refresh();
    };

    const onLeft = (payload: SocketStudentPayload) => {
      if (!matchesExam(payload)) return;
      removeConnected(payload.studentId);
    };

    const onProgress = () => refresh();
    const onSubmitted = () => refresh();

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
  }, [examId, isLive, refresh]);

  return {
    connectedStudentIds,
    sessions,
    studentNames,
    isRefreshing,
    refresh,
  };
}
