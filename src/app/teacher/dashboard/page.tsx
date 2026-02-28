"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { examService } from "@/services/exam.service";
import { studentService } from "@/services/student.service";
import { reportService } from "@/services/report.service";
import { Users, FileText, BarChart3, Clock } from "lucide-react";

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalExams: 0,
    activeExams: 0,
    pendingReports: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [students, exams, reports] = await Promise.all([
          studentService.getAllStudents(),
          examService.getAllExams(),
          reportService.getAllReports(),
        ]);

        setStats({
          totalStudents: students.length,
          totalExams: exams.length,
          activeExams: exams.filter((e) => e.isLive).length,
          pendingReports: reports.length,
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
        <div className="flex items-center justify-center h-64">
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
          <p className="text-muted-foreground mt-2">Overview of your teaching activities</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Registered students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeExams}</div>
              <p className="text-xs text-muted-foreground">Currently live</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExams}</div>
              <p className="text-xs text-muted-foreground">Created exams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReports}</div>
              <p className="text-xs text-muted-foreground">Generated reports</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
