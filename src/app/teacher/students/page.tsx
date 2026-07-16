"use client";

import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentService } from "@/services/student.service";
import { ApiError } from "@/lib/api";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Camera,
  KeyRound,
  Mail,
  Phone,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
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
    try {
      const message = await studentService.sendPasswordReset(student.id);
      setShowResetConfirm(false);
      toast({
        title: "Reset link sent",
        description: message,
      });
    } catch (err) {
      const description =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to send reset link.";
      toast({
        title: "Could not send reset link",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
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
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <button onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-600 hover:underline">
              Change profile picture
            </button>
          </div>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Student name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </Label>
              <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-grade">Grade / Group</Label>
              <Input id="edit-grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. Grade 9 — Group A" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Email (read only)
              </Label>
              <Input value={student.email} readOnly className="bg-muted/50 text-muted-foreground cursor-not-allowed" />
            </div>
          </div>

          <div className="rounded-lg border border-dashed p-4 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Password Reset</p>
            </div>
            {!showResetConfirm ? (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowResetConfirm(true)}>
                Send Password Reset Link
              </Button>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-3">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Send a password reset link to <strong>{student.email}</strong>?
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" disabled={isSendingReset} onClick={handleSendReset}>
                    {isSendingReset ? "Sending…" : "Yes, Send Link"}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowResetConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gradient-primary" disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Modal
// ---------------------------------------------------------------------------
interface CreateModalProps {
  onClose: () => void;
  onCreated: (student: User) => void;
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleCreate = async () => {
    if (!email || !name) {
      toast({ title: "Validation error", description: "Email and name are required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const created = await studentService.createStudent({ email, name, phone: phone || undefined, grade: grade || undefined });
      onCreated(created);
      toast({ title: "Student added", description: `${name} has been added.` });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create student.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Add New Student</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email <span className="text-destructive">*</span>
            </Label>
            <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@school.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-name">Full Name <span className="text-destructive">*</span></Label>
            <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Student full name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Phone
            </Label>
            <Input id="new-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-grade">Grade / Group</Label>
            <Input id="new-grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. Grade 9 — Group A" />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gradient-primary" disabled={isSaving} onClick={handleCreate}>
            {isSaving ? "Adding…" : "Add Student"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------
interface DeleteModalProps {
  student: User;
  onClose: () => void;
  onDeleted: (studentId: string) => void;
}

function DeleteModal({ student, onClose, onDeleted }: DeleteModalProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await studentService.deleteStudent(student.id);
      onDeleted(student.id);
      toast({ title: "Student removed", description: `${student.name} has been removed.` });
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to remove student.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold">Remove Student?</p>
              <p className="text-sm text-muted-foreground">This cannot be undone.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
            <strong>{student.name}</strong> ({student.email}) will be permanently removed.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Removing…" : "Remove"}
            </Button>
          </div>
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
  const [deletingStudent, setDeletingStudent] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleStudentCreated = (created: User) => {
    setStudents((prev) => [created, ...prev]);
  };

  const handleStudentDeleted = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Students</h1>
            <p className="text-muted-foreground mt-1">
              {students.length} student{students.length !== 1 ? "s" : ""} · click a card to edit
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {students.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200 group relative"
              onClick={() => setEditingStudent(student)}
            >
              {/* Delete button */}
              <button
                className="absolute top-2 right-2 z-10 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-border shadow-sm hover:bg-destructive hover:text-white hover:border-destructive"
                onClick={(e) => { e.stopPropagation(); setDeletingStudent(student); }}
                aria-label="Remove student"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              <CardContent className="pt-6 pb-5 flex flex-col items-center gap-3 text-center">
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
          ))}
        </div>

        {students.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <Users className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No students registered yet</p>
              <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add First Student
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {editingStudent && (
        <EditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSaved={handleStudentSaved}
        />
      )}

      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleStudentCreated}
        />
      )}

      {deletingStudent && (
        <DeleteModal
          student={deletingStudent}
          onClose={() => setDeletingStudent(null)}
          onDeleted={handleStudentDeleted}
        />
      )}
    </Layout>
  );
}
