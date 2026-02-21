"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { examService } from "@/services/exam.service";
import { liveSessionService } from "@/services/liveSession.service";
import { Exam, Answer } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, Send } from "lucide-react";

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const { user } = useAuth();
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm<{ answers: Record<string, string | number> }>({
    defaultValues: { answers: {} },
  });

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const data = await examService.getExamById(examId);
        if (!data || !data.isLive) {
          toast({
            title: "Exam not available",
            description: "This exam is not currently live.",
            variant: "destructive",
          });
          router.push("/student/dashboard");
          return;
        }
        setExam(data);
        setStartTime(new Date());
        
        // Join live session
        if (user) {
          await liveSessionService.addStudentToSession(examId, user.id);
        }

        // Set timer if duration is specified
        if (data.duration) {
          setTimeRemaining(data.duration * 60); // Convert to seconds
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
      }
    };

    fetchExam();
  }, [examId, user, router, toast]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0 && exam) {
      toast({
        title: "Time's up!",
        description: "Your exam will be submitted automatically.",
      });
      handleAutoSubmit();
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAutoSubmit = async () => {
    if (!exam || !user || !startTime) return;
    
    const answers: Answer[] = exam.questions.map((q) => {
      const value = watch(`answers.${q.id}`);
      return {
        questionId: q.id,
        value: value || (q.type === "rating_scale" ? 5 : ""),
      };
    });

    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    await submitExam(answers, timeSpent);
  };

  const submitExam = async (answers: Answer[], timeSpent: number) => {
    if (!exam || !user) return;

    setIsSubmitting(true);
    try {
      await examService.submitExam(examId, user.id, answers, timeSpent);
      
      // Leave live session
      await liveSessionService.removeStudentFromSession(examId, user.id);

      toast({
        title: "Exam submitted",
        description: "Your answers have been submitted successfully.",
      });

      router.push("/student/history");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit exam. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: { answers: Record<string, string | number> }) => {
    if (!exam || !user || !startTime) return;

    const answers: Answer[] = exam.questions.map((q) => ({
      questionId: q.id,
      value: data.answers[q.id] || (q.type === "rating_scale" ? 5 : ""),
    }));

    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    await submitExam(answers, timeSpent);
  };

  if (!exam) {
    return (
      <Layout role="student">
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{exam.title}</h1>
            <p className="text-muted-foreground mt-2">{exam.description}</p>
          </div>
          {timeRemaining !== null && (
            <Card className="border-2 border-orange-200">
              <CardContent className="flex items-center gap-2 p-4">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-lg font-bold">
                  {timeRemaining > 0 ? formatTime(timeRemaining) : "Time's up!"}
                </span>
              </CardContent>
            </Card>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {exam.questions.map((question, index) => {
            const answerValue = watch(`answers.${question.id}`);

            return (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Question {index + 1}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </CardTitle>
                  <CardDescription className="text-base font-normal mt-2">
                    {question.text}
                  </CardDescription>
                  <CardDescription className="text-sm text-muted-foreground">
                    Type: {question.type.replace("_", " ")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {question.type === "multiple_choice" && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className="flex items-center space-x-2 p-2 rounded border hover:bg-muted cursor-pointer"
                        >
                          <input
                            type="radio"
                            value={option}
                            {...register(`answers.${question.id}`)}
                            className="h-4 w-4"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === "open_text" && (
                    <Textarea
                      {...register(`answers.${question.id}`)}
                      placeholder="Type your answer here..."
                      rows={4}
                    />
                  )}

                  {question.type === "rating_scale" && (
                    <div className="space-y-2">
                      <Label>Rate from 1 to 10</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        {...register(`answers.${question.id}`, { valueAsNumber: true })}
                        placeholder="Enter a number between 1 and 10"
                      />
                    </div>
                  )}

                  {question.type === "likert_scale" && (
                    <div className="space-y-2">
                      <Select
                        value={answerValue?.toString() || ""}
                        onValueChange={(value) => setValue(`answers.${question.id}`, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your response" />
                        </SelectTrigger>
                        <SelectContent>
                          {(question.options || [
                            "Strongly Disagree",
                            "Disagree",
                            "Neutral",
                            "Agree",
                            "Strongly Agree",
                          ]).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
