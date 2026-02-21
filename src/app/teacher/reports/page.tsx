"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reportService } from "@/services/report.service";
import { studentService } from "@/services/student.service";
import { MotivationReport, User } from "@/types";
import { BarChart3, User as UserIcon, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function TeacherReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<(MotivationReport & { student?: User })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsData = await reportService.getAllReports();
        const reportsWithStudents = await Promise.all(
          reportsData.map(async (report) => {
            const student = await studentService.getStudentById(report.studentId);
            return { ...report, student: student ?? undefined };
          })
        );
        setReports(reportsWithStudents);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
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
          <h1 className="text-3xl font-bold">Motivation Reports</h1>
          <p className="text-muted-foreground mt-2">AI-generated motivation analysis reports</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      {report.student?.name || "Unknown Student"}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(report.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                    </CardDescription>
                  </div>
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Engagement:</span>
                      <span className="ml-2 font-semibold">{report.scores.engagement}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="ml-2 font-semibold">{report.scores.confidence}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Persistence:</span>
                      <span className="ml-2 font-semibold">{report.scores.persistence}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Emotional State:</span>
                      <span className="ml-2 font-semibold">{report.scores.emotionalState}%</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/teacher/reports/${report.studentId}`)}
                  >
                    View Full Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reports.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reports generated yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
