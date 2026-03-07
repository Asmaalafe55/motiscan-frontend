"use client";

import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentService } from "@/services/student.service";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Mail,
  Phone,
  Users,
  X,
  KeyRound,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Edit Modal
// ---------------------------------------------------------------------------
interface EditModalProps {
  student: User;
  onClose: () => void;
  onSaved: (updated: User) => void;
}

function EditModal({ student, onClose, onSaved }: EditModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState(student.name);
  const [phone, setPhone] = useState(student.phone ?? "");
  const [grade, setGrade] = useState(student.grade ?? "");
  const [avatarUrl, setAvatarUrl] = useState(student.avatarUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await studentService.updateStudent(student.id, {
        name,
        phone,
        grade,
        avatarUrl,
      });
      if (updated) {
        onSaved(updated);
        toast({ title: "Changes saved", description: `${name}'s profile has been updated.` });
        onClose();
      }
    } catch {
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendReset = async () => {
    setIsSendingReset(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSendingReset(false);
    setShowResetConfirm(false);
    toast({
      title: "Reset link sent",
      description: `Reset link sent to ${student.email}`,
    });
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Edit Student Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(name)
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 hover:underline"
            >
              Change profile picture
            </button>
          </div>

          {/* Editable fields */}
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Phone Number
              </Label>
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-grade">Grade / Group</Label>
              <Input
                id="edit-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. Grade 9 — Group A"
              />
            </div>

            {/* Email — read only */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                Email (read only)
              </Label>
              <Input
                value={student.email}
                readOnly
                className="bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          {/* Password reset */}
          <div className="rounded-lg border border-dashed p-4 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Password Reset</p>
            </div>
            {!showResetConfirm ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowResetConfirm(true)}
              >
                Send Password Reset Link
              </Button>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-3">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Are you sure you want to send a password reset link to{" "}
                    <strong>{student.email}</strong>?
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={isSendingReset}
                    onClick={handleSendReset}
                  >
                    {isSendingReset ? "Sending…" : "Yes, Send Link"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1 gradient-primary" disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await studentService.getAllStudents();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleStudentSaved = (updated: User) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  if (isLoading) {
    return (
      <Layout role="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading students…</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground mt-1">
            Click on a student card to view and edit their profile
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {students.map((student) => {
            return (
              <Card
                key={student.id}
                className="cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
                onClick={() => setEditingStudent(student)}
              >
                <CardContent className="pt-6 pb-5 flex flex-col items-center gap-3 text-center">
                  {/* Avatar */}
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white overflow-hidden ring-2 ring-transparent group-hover:ring-blue-300 transition-all">
                    {student.avatarUrl ? (
                      <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(student.name)
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-snug">{student.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{student.email}</p>
                    {student.grade && (
                      <p className="text-xs text-muted-foreground mt-0.5">{student.grade}</p>
                    )}
                  </div>
                  <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to edit profile
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {students.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <Users className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No students registered yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <EditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSaved={handleStudentSaved}
        />
      )}
    </Layout>
  );
}
