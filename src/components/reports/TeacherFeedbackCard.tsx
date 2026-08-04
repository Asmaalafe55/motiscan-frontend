"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  reportService,
  Report,
  ReportScores,
  ReportAgreement,
} from "@/services/report.service";
import { Check, RotateCcw, ThumbsDown, ThumbsUp, Minus } from "lucide-react";
import { format } from "date-fns";

const DIMENSIONS: { key: keyof ReportScores; label: string; color: string }[] = [
  { key: "engagement", label: "Engagement", color: "#3b82f6" },
  { key: "confidence", label: "Confidence", color: "#8b5cf6" },
  { key: "persistence", label: "Persistence", color: "#10b981" },
  { key: "emotionalState", label: "Emotional State", color: "#f59e0b" },
];

const AGREEMENT_OPTIONS: {
  value: ReportAgreement;
  label: string;
  icon: typeof ThumbsUp;
  active: string;
}[] = [
  { value: "agree", label: "Accurate", icon: ThumbsUp, active: "border-emerald-500 bg-emerald-50 text-emerald-700" },
  { value: "partly", label: "Partly right", icon: Minus, active: "border-amber-500 bg-amber-50 text-amber-700" },
  { value: "disagree", label: "Wrong", icon: ThumbsDown, active: "border-red-500 bg-red-50 text-red-700" },
];

/**
 * Lets a teacher correct the AI's scores and say whether the report was right.
 * Their version is stored next to the AI's so the two can be compared as more
 * reports are reviewed.
 */
export function TeacherFeedbackCard({
  report,
  onSaved,
}: {
  report: Report;
  onSaved: (updated: Report) => void;
}) {
  const { toast } = useToast();
  const aiScores = report.scores;

  const initialScores = (): ReportScores => ({
    engagement: report.teacherScores?.engagement ?? aiScores.engagement,
    confidence: report.teacherScores?.confidence ?? aiScores.confidence,
    persistence: report.teacherScores?.persistence ?? aiScores.persistence,
    emotionalState: report.teacherScores?.emotionalState ?? aiScores.emotionalState,
  });

  const [scores, setScores] = useState<ReportScores>(initialScores);
  const [agreement, setAgreement] = useState<ReportAgreement | null>(
    report.teacherAgreement
  );
  const [comment, setComment] = useState(report.teacherComment ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const isEdited = DIMENSIONS.some(({ key }) => scores[key] !== aiScores[key]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await reportService.saveFeedback(report.id, {
        scores: isEdited ? scores : null,
        agreement,
        comment: comment.trim() || null,
      });
      onSaved(updated);
      toast({
        title: "Feedback saved",
        description: "Your review helps measure how accurate these reports are.",
      });
    } catch {
      toast({
        title: "Could not save",
        description: "Something went wrong saving your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm print:hidden">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="text-base font-bold text-gray-800">Your Review</h2>
        {report.feedbackAt && (
          <span className="text-xs text-gray-400">
            Last reviewed {format(new Date(report.feedbackAt), "MMM d, yyyy")}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-5">
        Adjust anything the AI got wrong. Your scores are kept separately and never
        overwrite the AI&apos;s.
      </p>

      <div className="space-y-4">
        {DIMENSIONS.map(({ key, label, color }) => {
          const value = scores[key];
          const delta = value - aiScores[key];
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={`score-${key}`} className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400">AI: {aiScores[key]}</span>
                  {delta !== 0 && (
                    <span
                      className={
                        delta > 0
                          ? "font-semibold text-emerald-600"
                          : "font-semibold text-red-600"
                      }
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                  <span className="w-9 text-right font-bold text-gray-800">{value}</span>
                </div>
              </div>
              <input
                id={`score-${key}`}
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(e) =>
                  setScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                }
                className="w-full h-2 cursor-pointer appearance-none rounded-full bg-gray-200 accent-current"
                style={{ color }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Overall, how accurate was this report?
        </p>
        <div className="flex flex-wrap gap-2">
          {AGREEMENT_OPTIONS.map(({ value, label, icon: Icon, active }) => (
            <button
              key={value}
              type="button"
              onClick={() => setAgreement(agreement === value ? null : value)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                agreement === value
                  ? active
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="feedback-comment" className="text-sm font-medium text-gray-700">
          What did it miss? <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <Textarea
          id="feedback-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="e.g. Sara was anxious about the timer, which the tracking data cannot show."
          className="mt-1.5"
        />
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        {isEdited && (
          <Button
            variant="ghost"
            onClick={() => setScores(initialScores())}
            disabled={isSaving}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Check className="h-4 w-4" />
          {isSaving ? "Saving…" : "Save review"}
        </Button>
      </div>
    </div>
  );
}
