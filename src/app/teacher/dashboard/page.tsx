"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivity } from "@/components/RecentActivity";
import { examService } from "@/services/exam.service";
import { studentService } from "@/services/student.service";
import { Exam, ExamSubmission, User as UserType } from "@/types";
import { User, FileText, BarChart3, Clock } from "lucide-react";

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalExams: 0,
    activeExams: 0,
    pendingReports: 0,
  });
  const [students, setStudents] = useState<UserType[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentList, examList, submissionList] = await Promise.all([
          studentService.getAllStudents(),
          examService.getAllExams(),
          examService.getAllSubmissions(),
        ]);

        setStudents(studentList);
        setExams(examList);
        setSubmissions(submissionList);
        setStats({
          totalStudents: studentList.length,
          totalExams: examList.length,
          activeExams: examList.filter((e) => e.isLive).length,
          pendingReports: submissionList.filter((s) => s.hasReport).length,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <Layout role="teacher">
        <div className="flex h-64 items-center justify-center">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Overview of your teaching activities</p>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/teacher/students" className="block">
          <Card className="cursor-pointer border-l-4 border-l-blue-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Registered students</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/exams" className="block">
          <Card className="cursor-pointer border-l-4 border-l-green-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Clock className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeExams}</div>
              <p className="text-xs text-muted-foreground">Currently live</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/exams" className="block">
          <Card className="cursor-pointer border-l-4 border-l-violet-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                  <FileText className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExams}</div>
              <p className="text-xs text-muted-foreground">Created exams</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/reports" className="block">
          <Card className="cursor-pointer border-l-4 border-l-orange-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReports}</div>
              <p className="text-xs text-muted-foreground">Generated reports</p>
            </CardContent>
          </Card>
        </Link>

        </div>

        <RecentActivity students={students} exams={exams} submissions={submissions} />
      </div>
    </Layout>
  );
}
