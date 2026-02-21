"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reportService } from "@/services/report.service";
import { studentService } from "@/services/student.service";
import { MotivationReport, User } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { ArrowLeft, TrendingUp } from "lucide-react";

export default function StudentReportPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const [report, setReport] = useState<MotivationReport | null>(null);
  const [student, setStudent] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reports = await reportService.getReportsByStudent(studentId);
        const studentData = await studentService.getStudentById(studentId);
        
        if (reports.length > 0) {
          setReport(reports[0]); // Get the most recent report
        }
        setStudent(studentData);
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  if (isLoading) {
    return (
      <Layout role="teacher">
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!report || !student) {
    return (
      <Layout role="teacher">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Report not found</p>
            <Button className="mt-4" onClick={() => router.push("/teacher/reports")}>
              Back to Reports
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const barChartData = [
    { name: "Engagement", value: report.scores.engagement },
    { name: "Confidence", value: report.scores.confidence },
    { name: "Persistence", value: report.scores.persistence },
    { name: "Emotional State", value: report.scores.emotionalState },
  ];

  const radarData = [
    {
      subject: "Engagement",
      A: report.scores.engagement,
      fullMark: 100,
    },
    {
      subject: "Confidence",
      A: report.scores.confidence,
      fullMark: 100,
    },
    {
      subject: "Persistence",
      A: report.scores.persistence,
      fullMark: 100,
    },
    {
      subject: "Emotional",
      A: report.scores.emotionalState,
      fullMark: 100,
    },
  ];

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => router.back()} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Motivation Report</h1>
            <p className="text-muted-foreground mt-2">{student.name}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Motivation Scores
              </CardTitle>
              <CardDescription>Overall motivation metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="url(#colorGradient)" />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(221.2 83.2% 53.3%)" />
                      <stop offset="100%" stopColor="hsl(270 70% 60%)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Radar Chart</CardTitle>
              <CardDescription>Multi-dimensional view</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="hsl(221.2 83.2% 53.3%)"
                    fill="hsl(221.2 83.2% 53.3%)"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {report.insights.map((insight, index) => (
                  <li key={index} className="text-sm">{insight}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {report.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm">{recommendation}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
