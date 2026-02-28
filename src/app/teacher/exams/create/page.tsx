"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useAuth } from "@/contexts/AuthContext";
import { QuestionType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";

const questionSchema = z.object({
  type: z.enum(["multiple_choice", "open_text", "rating_scale", "likert_scale", "differences"]),
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
});

const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.number().min(1).optional(),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
});

type ExamFormData = z.infer<typeof examSchema>;

export default function CreateExamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      questions: [
        {
          type: "multiple_choice",
          text: "",
          options: [],
          required: true,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const addQuestion = () => {
    append({
      type: "multiple_choice",
      text: "",
      options: [],
      required: true,
    });
  };

  const addOption = (questionIndex: number) => {
    const currentOptions = watch(`questions.${questionIndex}.options`) || [];
    setValue(`questions.${questionIndex}.options`, [...currentOptions, ""]);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = watch(`questions.${questionIndex}.options`) || [];
    setValue(
      `questions.${questionIndex}.options`,
      currentOptions.filter((_, i) => i !== optionIndex)
    );
  };

  const onSubmit = async (data: ExamFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const exam = await examService.createExam({
        title: data.title,
        description: data.description,
        teacherId: user.id,
        duration: data.duration,
        questions: data.questions.map((q, index) => {
          let options = q.options?.filter((opt) => opt.trim() !== "");
          // Auto-generate Likert scale options if empty
          if (q.type === "likert_scale" && (!options || options.length === 0)) {
            options = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
          }
          return {
            id: `q${Date.now()}-${index}`,
            examId: "",
            type: q.type,
            text: q.text,
            options,
            required: q.required,
            order: index + 1,
          };
        }),
      });

      toast({
        title: "Exam created",
        description: "Your exam has been created successfully.",
      });

      router.push(`/teacher/exams/${exam.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create exam. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create New Exam</h1>
          <p className="text-muted-foreground mt-2">Build your assessment with multiple question types</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
              <CardDescription>Basic information about your exam</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register("title")} placeholder="Math Assessment - Algebra" />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Test your understanding of basic algebraic concepts"
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes, optional)</Label>
                <Input
                  id="duration"
                  type="number"
                  {...register("duration", { valueAsNumber: true })}
                  placeholder="30"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>Add questions to your exam</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, questionIndex) => {
                const questionType = watch(`questions.${questionIndex}.type`);
                const options = watch(`questions.${questionIndex}.options`) || [];
                const needsOptions =
                  questionType === "multiple_choice" || questionType === "likert_scale";

                return (
                  <Card key={field.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Question {questionIndex + 1}</CardTitle>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(questionIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Question Type</Label>
                        <Select
                          value={questionType}
                          onValueChange={(value) =>
                            setValue(`questions.${questionIndex}.type`, value as QuestionType)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="open_text">Open Text</SelectItem>
                            <SelectItem value="rating_scale">Rating Scale (1-10)</SelectItem>
                            <SelectItem value="likert_scale">Likert Scale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Question Text</Label>
                        <Textarea
                          {...register(`questions.${questionIndex}.text`)}
                          placeholder="Enter your question here..."
                        />
                        {errors.questions?.[questionIndex]?.text && (
                          <p className="text-sm text-destructive">
                            {errors.questions[questionIndex]?.text?.message}
                          </p>
                        )}
                      </div>

                      {needsOptions && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Options</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(questionIndex)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          {options.map((_, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <Input
                                {...register(`questions.${questionIndex}.options.${optionIndex}`)}
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(questionIndex, optionIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {questionType === "likert_scale" && options.length === 0 && (
                            <div className="text-sm text-muted-foreground">
                              Likert scale options will be auto-generated if left empty
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {errors.questions && (
                <p className="text-sm text-destructive">{errors.questions.message}</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Creating..." : "Create Exam"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
