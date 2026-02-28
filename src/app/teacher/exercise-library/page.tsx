"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { exerciseLibraryService } from "@/services/exerciseLibrary.service";
import { DifferencesExerciseBuilder } from "@/components/exercises/DifferencesExerciseBuilder";
import type { Exercise } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ImageIcon, Plus, Search, SlidersHorizontal, Star } from "lucide-react";

// Map exercise types to human-readable labels and colours
const TYPE_META: Record<string, { label: string; colour: string }> = {
  multiple_choice: { label: "Multiple Choice", colour: "bg-blue-100 text-blue-700" },
  open_text: { label: "Open Text", colour: "bg-green-100 text-green-700" },
  rating_scale: { label: "Rating Scale", colour: "bg-yellow-100 text-yellow-700" },
  likert_scale: { label: "Likert Scale", colour: "bg-purple-100 text-purple-700" },
  differences: { label: "Differences", colour: "bg-orange-100 text-orange-700" },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  differences: <ImageIcon className="h-5 w-5 text-orange-500" />,
  open_text: <BookOpen className="h-5 w-5 text-green-500" />,
  rating_scale: <Star className="h-5 w-5 text-yellow-500" />,
  multiple_choice: <SlidersHorizontal className="h-5 w-5 text-blue-500" />,
  likert_scale: <SlidersHorizontal className="h-5 w-5 text-purple-500" />,
};

export default function ExerciseLibraryPage() {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"differences" | null>(null);

  const fetchExercises = async () => {
    setLoading(true);
    const data = await exerciseLibraryService.getAllExercises();
    setExercises(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const filtered = exercises.filter((ex) => {
    const q = search.toLowerCase();
    return (
      !q ||
      ex.title.toLowerCase().includes(q) ||
      ex.tags.some((t) => t.toLowerCase().includes(q)) ||
      ex.type.includes(q)
    );
  });

  const handleSaveDifferences = async (exercise: Omit<Exercise, "id">) => {
    await exerciseLibraryService.createExercise(exercise as Parameters<typeof exerciseLibraryService.createExercise>[0]);
    await fetchExercises();
    setDialogOpen(false);
    setCreateType(null);
    toast({ title: "Exercise saved", description: "Added to your exercise library." });
  };

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exercise Library</h1>
            <p className="text-sm text-muted-foreground">
              Reusable exercises you can add to any exam
            </p>
          </div>

          {/* Create exercise button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" onClick={() => setCreateType("differences")}>
                <Plus className="h-4 w-4 mr-2" />
                New Exercise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Differences Exercise</DialogTitle>
              </DialogHeader>
              {createType === "differences" && (
                <DifferencesExerciseBuilder
                  onSave={handleSaveDifferences}
                  onCancel={() => {
                    setDialogOpen(false);
                    setCreateType(null);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by title, tag, or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Stats row */}
        <div className="flex gap-4 flex-wrap">
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const count = exercises.filter((e) => e.type === type).length;
            if (count === 0) return null;
            return (
              <div
                key={type}
                className={`rounded-full px-3 py-1 text-xs font-medium ${meta.colour}`}
              >
                {meta.label}: {count}
              </div>
            );
          })}
        </div>

        {/* Exercise grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Loading library…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
            <BookOpen className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">No exercises found</p>
            {search && (
              <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ex) => {
              const meta = TYPE_META[ex.type] ?? {
                label: ex.type,
                colour: "bg-gray-100 text-gray-700",
              };
              const icon = TYPE_ICONS[ex.type] ?? <BookOpen className="h-5 w-5 text-muted-foreground" />;

              return (
                <Card
                  key={ex.id}
                  className="flex flex-col hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail for differences type */}
                  {ex.type === "differences" && ex.question.differenceImages && (
                    <div className="grid grid-cols-2 gap-1 p-3 pb-0">
                      {[
                        ex.question.differenceImages.image1Url,
                        ex.question.differenceImages.image2Url,
                      ].map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={src}
                          alt={`Image ${i + 1}`}
                          className="w-full rounded border border-border object-contain bg-muted"
                          style={{ aspectRatio: "4/3", maxHeight: 90 }}
                          draggable={false}
                        />
                      ))}
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
                          {ex.title}
                        </CardTitle>
                        <div className="mt-1">
                          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${meta.colour}`}>
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-between pt-0 gap-3">
                    <CardDescription className="text-xs line-clamp-2">
                      {ex.instructions}
                    </CardDescription>
                    {ex.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ex.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
