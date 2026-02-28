"use client";

import { useEffect, useMemo, useState } from "react";
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
import { trackingService } from "@/services/tracking.service";
import { Exam, Answer, ExerciseAttempt } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

type AnswersForm = { answers: Record<string, string | number> };

interface ExerciseMetrics {
  timeStarted?: Date;
  timeAnswered?: Date;
  timeLeft?: Date;
  durationOnExercise?: number;
  answerValue?: string | number;
  answerChanged: boolean;
  skipped: boolean;
  revisited: boolean;
}

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const { user } = useAuth();
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, ExerciseMetrics>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm<AnswersForm>({
    defaultValues: { answers: {} },
  });

  const exercises = useMemo(() => exam?.questions ?? [], [exam]);
  const totalExercises = exercises.length;
  const currentExercise = exercises[currentIndex];

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
        const started = new Date();
        setStartTime(started);

        if (user) {
          await liveSessionService.addStudentToSession(examId, user.id);
          await trackingService.startStudentSession(examId, user.id, data.questions.length, started);
        }

        const timeout = setTimeout(() => {
          setAutoSubmitted(true);
        }, 5 * 60 * 60 * 1000); // 5 hours

        return () => clearTimeout(timeout);
      } catch (error) {
        console.error("Error fetching exam:", error);
      }
    };

    fetchExam();
  }, [examId, user, router, toast]);

  useEffect(() => {
    if (autoSubmitted && exam) {
      toast({
        title: "Session ended",
        description: "Your exam session reached the maximum duration and was submitted.",
      });
      handleAutoSubmit();
    }
  }, [autoSubmitted, exam]);

  const ensureMetrics = (exerciseId: string): ExerciseMetrics => {
    return (
      metrics[exerciseId] ?? {
        answerChanged: false,
        skipped: true,
        revisited: false,
      }
    );
  };

  const handleEnterExercise = async (index: number) => {
    if (!exam || !user) return;
    const exercise = exercises[index];
    if (!exercise) return;

    setMetrics((prev) => {
      const current = ensureMetrics(exercise.id);
      const isRevisit = !!current.timeStarted;
      return {
        ...prev,
        [exercise.id]: {
          ...current,
          timeStarted: current.timeStarted ?? new Date(),
          revisited: current.revisited || isRevisit,
        },
      };
    });

    await trackingService.updateStudentSession({
      examId,
      studentId: user.id,
      currentExerciseIndex: index,
      totalExercises,
      exerciseId: exercise.id,
      action: "enter",
    });
  };

  const handleLeaveExercise = async (index: number) => {
    if (!exam || !user) return;
    const exercise = exercises[index];
    if (!exercise) return;

    setMetrics((prev) => {
      const current = ensureMetrics(exercise.id);
      const timeLeft = new Date();
      const durationOnExercise = current.timeStarted
        ? Math.floor((timeLeft.getTime() - current.timeStarted.getTime()) / 1000)
        : current.durationOnExercise;

      return {
        ...prev,
        [exercise.id]: {
          ...current,
          timeLeft,
          durationOnExercise,
        },
      };
    });

    await trackingService.updateStudentSession({
      examId,
      studentId: user.id,
      currentExerciseIndex: index,
      totalExercises,
      exerciseId: exercise.id,
      action: "leave",
    });
  };

  const handleAnswerChange = async (exerciseId: string, index: number, value: string | number) => {
    if (!exam || !user) return;
    setMetrics((prev) => {
      const current = ensureMetrics(exerciseId);
      const now = new Date();
      const firstAnswered = current.timeAnswered == null;
      return {
        ...prev,
        [exerciseId]: {
          ...current,
          timeStarted: current.timeStarted ?? now,
          timeAnswered: current.timeAnswered ?? now,
          answerValue: value,
          answerChanged: !firstAnswered || current.answerValue !== undefined,
          skipped: false,
        },
      };
    });

    await trackingService.updateStudentSession({
      examId,
      studentId: user.id,
      currentExerciseIndex: index,
      totalExercises,
      exerciseId,
      action: "answer",
    });
  };

  const goToExercise = async (nextIndex: number) => {
    if (!exam) return;
    await handleLeaveExercise(currentIndex);
    setCurrentIndex(nextIndex);
    await handleEnterExercise(nextIndex);
  };

  const handleAutoSubmit = async () => {
    if (!exam || !user || !startTime) return;

    const formValues = watch("answers");
    const answers: Answer[] = exercises.map((q) => {
      const value = formValues[q.id];
      return {
        questionId: q.id,
        value: value || (q.type === "rating_scale" ? 5 : ""),
      };
    });

    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    await submitExam(answers, timeSpent);
  };

  const buildAttempts = (): ExerciseAttempt[] => {
    if (!exam || !user || !startTime) return [];
    return exercises.map((q) => {
      const m = ensureMetrics(q.id);
      const timeStarted = m.timeStarted ?? startTime;
      const timeLeft = m.timeLeft ?? new Date();
      const durationOnExercise =
        m.durationOnExercise ??
        Math.floor((timeLeft.getTime() - timeStarted.getTime()) / 1000);

      return {
        examId,
        exerciseId: q.id,
        questionId: q.id,
        studentId: user.id,
        timeStarted: timeStarted.toISOString(),
        timeAnswered: m.timeAnswered?.toISOString(),
        timeLeft: timeLeft.toISOString(),
        durationOnExercise,
        answerValue: m.answerValue,
        answerChanged: m.answerChanged,
        skipped: m.skipped && m.answerValue === undefined,
        revisited: m.revisited,
      };
    });
  };

  const submitExam = async (answers: Answer[], timeSpent: number) => {
    if (!exam || !user) return;

    setIsSubmitting(true);
    try {
      const attempts = buildAttempts();
      await trackingService.recordExerciseAttempts(attempts);
      await trackingService.markSubmitted(examId, user.id);

      await examService.submitExam(examId, user.id, answers, timeSpent);
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

  const onSubmit = async (data: AnswersForm) => {
    if (!exam || !user || !startTime) return;

    const answers: Answer[] = exercises.map((q) => ({
      questionId: q.id,
      value: data.answers[q.id] || (q.type === "rating_scale" ? 5 : ""),
    }));

    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    await submitExam(answers, timeSpent);
  };

  useEffect(() => {
    if (exam && totalExercises > 0) {
      handleEnterExercise(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, totalExercises]);

  if (!exam || !currentExercise) {
    return (
      <Layout role="student">
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  const currentAnswerValue = watch(`answers.${currentExercise.id}`);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalExercises - 1;

  const handleNext = async () => {
    if (!isLast) {
      await goToExercise(currentIndex + 1);
    } else {
      setShowConfirm(true);
    }
  };

  const handlePrevious = async () => {
    if (!isFirst) {
      await goToExercise(currentIndex - 1);
    }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    await handleSubmit(onSubmit)();
  };

  return (
    <Layout role="student">
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        <div className="flex-1 flex flex-col gap-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Exercise {currentIndex + 1} of {totalExercises}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full gradient-primary"
                style={{ width: `${((currentIndex + 1) / totalExercises) * 100}%` }}
              />
            </div>
          </div>

          {/* Exercise card */}
          <Card className="flex-1 flex flex-col min-h-[60vh]">
            <CardHeader>
              <CardTitle className="text-lg">
                Exercise {currentExercise.order}
                {currentExercise.required && <span className="text-red-500 ml-1">*</span>}
              </CardTitle>
              <CardDescription className="text-base font-normal mt-2">
                {currentExercise.text}
              </CardDescription>
              <CardDescription className="text-sm text-muted-foreground">
                Type: {currentExercise.type.replace("_", " ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-start">
              {currentExercise.type === "multiple_choice" && currentExercise.options && (
                <div className="space-y-2">
                  {currentExercise.options.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center space-x-2 p-2 rounded border hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="radio"
                        value={option}
                        {...register(`answers.${currentExercise.id}`)}
                        onChange={(e) => {
                          setValue(`answers.${currentExercise.id}`, e.target.value);
                          handleAnswerChange(currentExercise.id, currentIndex, e.target.value);
                        }}
                        className="h-4 w-4"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentExercise.type === "open_text" && (
                <Textarea
                  {...register(`answers.${currentExercise.id}`)}
                  placeholder="Type your answer here..."
                  rows={6}
                  className="mt-2"
                  onChange={(e) =>
                    handleAnswerChange(currentExercise.id, currentIndex, e.target.value)
                  }
                />
              )}

              {currentExercise.type === "rating_scale" && (
                <div className="space-y-2 mt-2 max-w-sm">
                  <Label>Rate from 1 to 10</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    {...register(`answers.${currentExercise.id}`, { valueAsNumber: true })}
                    placeholder="Enter a number between 1 and 10"
                    onChange={(e) =>
                      handleAnswerChange(
                        currentExercise.id,
                        currentIndex,
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              )}

              {currentExercise.type === "likert_scale" && (
                <div className="space-y-2 mt-2 max-w-sm">
                  <Select
                    value={currentAnswerValue?.toString() || ""}
                    onValueChange={(value) => {
                      setValue(`answers.${currentExercise.id}`, value);
                      handleAnswerChange(currentExercise.id, currentIndex, value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your response" />
                    </SelectTrigger>
                    <SelectContent>
                      {(currentExercise.options || [
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
        </div>

        {/* Navigation bar */}
        <div className="mt-6 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between py-4 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirst || isSubmitting}
            >
              Previous
            </Button>
            <div className="flex-1 text-center text-sm text-muted-foreground">
              You can move between exercises freely before submitting.
            </div>
            <Button
              type="button"
              className="gradient-primary"
              disabled={isSubmitting}
              onClick={handleNext}
            >
              <Send className="h-4 w-4 mr-2" />
              {isLast ? "Submit Exam" : "Next"}
            </Button>
          </div>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-2">Submit exam?</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Once you submit, you won&apos;t be able to change your answers.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="gradient-primary"
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                >
                  Confirm Submit
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

