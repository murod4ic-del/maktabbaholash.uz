"use client";

import { useState, useEffect } from "react";

interface Subject {
  id: number;
  name: string;
  school?: { id: number; name: string };
}

interface Teacher {
  id: number;
  fullName: string;
}

interface ClassItem {
  id: number;
  name: string;
}

interface TeacherSubject {
  id: number;
  teacher: { id: number; fullName: string };
  subject: { id: number; name: string };
  class: { id: number; name: string };
}

const SCHOOL_ID = 1;

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [subjectName, setSubjectName] = useState("");
  const [assignForm, setAssignForm] = useState({
    teacherId: "",
    subjectId: "",
    classId: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchAll() {
    try {
      const [subjectsRes, teachersRes, classesRes, tsRes] = await Promise.all([
        fetch(`/api/subjects?schoolId=${SCHOOL_ID}`),
        fetch(`/api/teachers?schoolId=${SCHOOL_ID}`),
        fetch(`/api/classes?schoolId=${SCHOOL_ID}`),
        fetch("/api/teacher-subjects"),
      ]);

      if (!subjectsRes.ok || !teachersRes.ok || !classesRes.ok || !tsRes.ok) {
        throw new Error();
      }

      setSubjects(await subjectsRes.json());
      setTeachers(await teachersRes.json());
      setClasses(await classesRes.json());
      setTeacherSubjects(await tsRes.json());
    } catch {
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subjectName, schoolId: SCHOOL_ID }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Xatolik yuz berdi");
      }

      setSubjectName("");
      setShowSubjectModal(false);
      setToast({ message: "Fan muvaffaqiyatli qo'shildi!", type: "success" });
      fetchAll();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Fan qo'shishda xatolik",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: Number(assignForm.teacherId),
          subjectId: Number(assignForm.subjectId),
          classId: Number(assignForm.classId),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Xatolik yuz berdi");
      }

      setAssignForm({ teacherId: "", subjectId: "", classId: "" });
      setShowAssignModal(false);
      setToast({
        message: "O'qituvchiga fan biriktirildi!",
        type: "success",
      });
      fetchAll();
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Biriktishda xatolik",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fanlar</h1>
          <p className="text-gray-500 mt-1">
            Fanlar ro&apos;yxati va o&apos;qituvchi-fan biriktirishlari
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            🔗 Biriktirish
          </button>
          <button
            onClick={() => setShowSubjectModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <span className="text-lg">+</span>
            Yangi fan
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Fanlar ro&apos;yxati
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
                >
                  <div className="h-5 w-32 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="text-3xl mb-2">📚</div>
              <p className="text-gray-500">Hali fan qo&apos;shilmagan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subjects.map((s, idx) => (
                <div
                  key={s.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 w-6">
                      {idx + 1}.
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {s.name}
                    </span>
                  </div>
                  <span className="text-lg">📖</span>
                </div>
              ))}
              <p className="text-sm text-gray-500 pt-2">
                Jami: {subjects.length} ta fan
              </p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            O&apos;qituvchi — Fan — Sinf biriktirishlari
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
                >
                  <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : teacherSubjects.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="text-3xl mb-2">🔗</div>
              <p className="text-gray-500">Hali biriktirish qilinmagan</p>
              <button
                onClick={() => setShowAssignModal(true)}
                className="mt-3 text-indigo-600 text-sm font-medium hover:text-indigo-700"
              >
                Birinchi biriktirish qiling
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      O&apos;qituvchi
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Fan
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Sinf
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teacherSubjects.map((ts) => (
                    <tr
                      key={ts.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {ts.teacher.fullName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">
                          {ts.subject.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                          {ts.class.name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                Jami: {teacherSubjects.length} ta biriktirish
              </div>
            </div>
          )}
        </div>
      </div>

      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSubjectModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Yangi fan qo&apos;shish
              </h2>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fan nomi
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Masalan: Matematika, Fizika"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAssignModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                O&apos;qituvchiga fan biriktirish
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  O&apos;qituvchi
                </label>
                <select
                  required
                  value={assignForm.teacherId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, teacherId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="">O&apos;qituvchini tanlang</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fan
                </label>
                <select
                  required
                  value={assignForm.subjectId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, subjectId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="">Fanni tanlang</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sinf
                </label>
                <select
                  required
                  value={assignForm.classId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, classId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="">Sinfni tanlang</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saqlanmoqda..." : "Biriktirish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
