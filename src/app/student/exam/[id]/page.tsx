"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { submissionService } from "@/services/submission.service";
import { trackingService } from "@/services/tracking.service";
import {
  Exam,
  Answer,
  ExerciseAttempt,
  DifferencesTracking,
  PrioritySortTracking,
  ShapeCopyTracking,
  AnalyticalPerceptionTracking,
} from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DifferencesExercise } from "@/components/exercises/DifferencesExercise";
import { PrioritySortExercise } from "@/components/exercises/PrioritySortExercise";
import { ShapeCopyExercise } from "@/components/exercises/ShapeCopyExercise";
import { AnalyticalPerceptionExercise } from "@/components/exercises/AnalyticalPerceptionExercise";
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
  const [show30MinWarning, setShow30MinWarning] = useState(false);
  // Per-exercise tracking for the DIFFERENCES type (character count, edits, etc.)
  const [differencesTracking, setDifferencesTracking] = useState<
    Record<string, DifferencesTracking>
  >({});
  // Per-exercise tracking for the PRIORITY SORT type
  const [prioritySortTracking, setPrioritySortTracking] = useState<
    Record<string, PrioritySortTracking>
  >({});
  // Per-exercise tracking for the SHAPE_COPY type
  const [shapeCopyTracking, setShapeCopyTracking] = useState<
    Record<string, ShapeCopyTracking>
  >({});
  // Per-exercise tracking for the ANALYTICAL_PERCEPTION type
  const [analyticalPerceptionTracking, setAnalyticalPerceptionTracking] = useState<
    Record<string, AnalyticalPerceptionTracking>
  >({});
  const submissionIdRef = useRef<string | null>(null);

  const saveTracking = async (
    eventType: string,
    exerciseId: string,
    payload: Record<string, unknown> = {}
  ) => {
    if (!submissionIdRef.current) return;
    try {
      await submissionService.saveEvent(
        submissionIdRef.current,
        eventType,
        payload,
        exerciseId
      );
    } catch (err) {
      console.error("Failed to save tracking event:", err);
    }
  };

  const { register, handleSubmit, watch, setValue } = useForm<AnswersForm>({
    defaultValues: { answers: {} },
  });

  const exercises = useMemo(() => exam?.questions ?? [], [exam]);
  const totalExercises = exercises.length;
  const currentExercise = exercises[currentIndex];

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const data = await examService.getExamForStudent(examId);
        if (!data) {
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
          liveSessionService.joinSession(examId, user.id, user.name);
          await liveSessionService.addStudentToSession(examId, user.id);
          await trackingService.startStudentSession(examId, user.id, data.questions.length, started);
          try {
            const submission = await submissionService.startSubmission(
              examId,
              data.questions.length
            );
            submissionIdRef.current = submission.id;
          } catch (err) {
            console.error("Failed to start submission:", err);
          }
        }

        const FIVE_HOURS = 5 * 60 * 60 * 1000;
        const THIRTY_MIN = 30 * 60 * 1000;

        const autoSubmitTimeout = setTimeout(() => {
          setAutoSubmitted(true);
        }, FIVE_HOURS);

        // Show 30-minute warning at 4h30m
        const warningTimeout = setTimeout(() => {
          setShow30MinWarning(true);
        }, FIVE_HOURS - THIRTY_MIN);

        return () => {
          clearTimeout(autoSubmitTimeout);
          clearTimeout(warningTimeout);
        };
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
    await saveTracking("exercise_enter", exercise.id, { exerciseIndex: index });
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
    await saveTracking("exercise_leave", exercise.id, {
      exerciseIndex: index,
      durationOnExercise: ensureMetrics(exercise.id).durationOnExercise,
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
    await saveTracking("answer_change", exerciseId, { exerciseIndex: index, value });
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

      const diffTracking = differencesTracking[q.id];
      const priorityTracking = prioritySortTracking[q.id];
      const scTracking = shapeCopyTracking[q.id];
      const apTracking = analyticalPerceptionTracking[q.id];
      return {
        examId,
        exerciseId: q.id,
        questionId: q.id,
        studentId: user.id,
        exerciseType: q.type,
        timeStarted: timeStarted.toISOString(),
        timeFirstAnswer: m.timeAnswered?.toISOString(),
        timeAnswered: m.timeAnswered?.toISOString(),
        timeLeft: timeLeft.toISOString(),
        durationOnExercise,
        answerValue: m.answerValue,
        answerChanged: m.answerChanged,
        skipped: m.skipped && m.answerValue === undefined,
        revisited: m.revisited,
        // Differences tracking no longer uses text-based fields;
        // objects_classified, score, etc. travel in metadata below.
        ...(diffTracking || priorityTracking
          ? {
              metadata: {
                ...(diffTracking ?? {}),
                ...(priorityTracking ?? {}),
              } as Record<string, unknown>,
            }
          : {}),
        ...(scTracking
          ? { metadata: scTracking as unknown as Record<string, unknown> }
          : {}),
        ...(apTracking
          ? { metadata: apTracking as unknown as Record<string, unknown> }
          : {}),
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

      if (submissionIdRef.current) {
        await submissionService.saveEvent(submissionIdRef.current, "submit", {
          answers,
          timeSpent,
          attempts,
        });
        await submissionService.finalize(submissionIdRef.current);
        submissionIdRef.current = null;
      }

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

  // Stable callback — only recreated when the current exercise changes.
  // Using a stable reference prevents DifferencesExercise from seeing a new
  // prop function on every render, which was the root cause of the infinite loop.
  const handleTrackingUpdate = useCallback(
    (tracking: DifferencesTracking) => {
      setDifferencesTracking((prev) => ({
        ...prev,
        [currentExercise?.id ?? ""]: tracking,
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentExercise?.id]
  );

  // Stable callback for SHAPE_COPY tracking — same pattern as differences to avoid infinite loops
  const handleShapeCopyTrackingUpdate = useCallback(
    (tracking: ShapeCopyTracking) => {
      setShapeCopyTracking((prev) => ({
        ...prev,
        [currentExercise?.id ?? ""]: tracking,
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentExercise?.id]
  );

  // Stable callback for ANALYTICAL_PERCEPTION tracking — same pattern to avoid infinite loops
  const handleAnalyticalPerceptionTrackingUpdate = useCallback(
    (tracking: AnalyticalPerceptionTracking) => {
      setAnalyticalPerceptionTracking((prev) => ({
        ...prev,
        [currentExercise?.id ?? ""]: tracking,
      }));
      // Mark exercise as answered once at least one item is answered
      if (tracking.items.some((i) => !i.skipped) && metrics[currentExercise?.id ?? ""]?.skipped !== false) {
        handleAnswerChange(currentExercise?.id ?? "", currentIndex, "analytical_perception_in_progress");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentExercise?.id, currentIndex]
  );

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
          {/* 30-minute warning banner */}
          {show30MinWarning && (
            <div className="flex items-center justify-between rounded-lg border border-yellow-400 bg-yellow-50 px-4 py-2.5">
              <p className="text-sm font-medium text-yellow-800">
                ⏳ You have 30 minutes remaining to complete this exam.
              </p>
              <button
                type="button"
                onClick={() => setShow30MinWarning(false)}
                className="text-yellow-600 hover:text-yellow-800 ml-4 text-xs underline flex-shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Exercise {currentIndex + 1} of {totalExercises}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
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
              {/* For differences and shape_copy exercises the instructions are rendered inside the component */}
              {currentExercise.type !== "differences" && currentExercise.type !== "shape_copy" && currentExercise.type !== "analytical_perception" && (
                <CardDescription className="text-base font-normal mt-2">
                  {currentExercise.text}
                </CardDescription>
              )}
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

              {currentExercise.type === "differences" &&
                currentExercise.differenceImages && (
                  <DifferencesExercise
                    instructions={currentExercise.text}
                    images={currentExercise.differenceImages}
                    differenceObjects={currentExercise.differenceObjects ?? []}
                    value={(currentAnswerValue as string) || "{}"}
                    onChange={(val) => {
                      setValue(`answers.${currentExercise.id}`, val);
                      handleAnswerChange(currentExercise.id, currentIndex, val);
                    }}
                    onTrackingUpdate={handleTrackingUpdate}
                  />
                )}
              {currentExercise.type === "priority_sort" &&
                currentExercise.prioritySortData && (
                  <PrioritySortExercise
                    instructions={currentExercise.text}
                    data={currentExercise.prioritySortData}
                    value={(currentAnswerValue as string) || ""}
                    onChange={(val) => {
                      setValue(`answers.${currentExercise.id}`, val);
                      handleAnswerChange(currentExercise.id, currentIndex, val);
                    }}
                    onTrackingUpdate={(tracking) => {
                      setPrioritySortTracking((prev) => ({
                        ...prev,
                        [currentExercise.id]: tracking,
                      }));
                    }}
                  />
                )}

              {currentExercise.type === "shape_copy" &&
                currentExercise.shapeCopyConfig && (
                  <ShapeCopyExercise
                    instructions={currentExercise.text}
                    config={currentExercise.shapeCopyConfig}
                    onTrackingUpdate={(tracking) => {
                      handleShapeCopyTrackingUpdate(tracking);
                      // Mark exercise as answered once at least one shape is drawn
                      const totalShapes = tracking.figures.reduce(
                        (sum, f) => sum + f.total_shapes_drawn,
                        0
                      );
                      if (totalShapes > 0 && metrics[currentExercise.id]?.skipped !== false) {
                        handleAnswerChange(currentExercise.id, currentIndex, "drawing_in_progress");
                      }
                    }}
                  />
                )}

              {currentExercise.type === "analytical_perception" &&
                currentExercise.analyticalPerceptionConfig && (
                  <AnalyticalPerceptionExercise
                    instructions={currentExercise.text}
                    config={currentExercise.analyticalPerceptionConfig}
                    onTrackingUpdate={handleAnalyticalPerceptionTrackingUpdate}
                  />
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
              variant="gradient"
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
                  variant="gradient"
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

