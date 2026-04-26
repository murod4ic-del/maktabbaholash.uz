"use client";

import { useState, useEffect } from "react";

interface ClassItem {
  id: number;
  name: string;
  createdAt?: string;
  school?: { id: number; name: string };
  _count?: { students: number };
}

const SCHOOL_ID = 1;

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [formName, setFormName] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchClasses() {
    try {
      const res = await fetch(`/api/classes?schoolId=${SCHOOL_ID}`);
      if (!res.ok) throw new Error();
      setClasses(await res.json());
    } catch {
      setError("Sinflarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, schoolId: SCHOOL_ID }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Xatolik yuz berdi");
      }

      setFormName("");
      setShowModal(false);
      setToast({
        message: "Sinf muvaffaqiyatli qo'shildi!",
        type: "success",
      });
      fetchClasses();
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Sinf qo'shishda xatolik",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const totalStudents = classes.reduce(
    (sum, c) => sum + (c._count?.students ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sinflar</h1>
          <p className="text-gray-500 mt-1">
            Barcha sinflar ro&apos;yxati va boshqaruv
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <span className="text-lg">+</span>
          Yangi sinf
        </button>
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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
            >
              <div className="h-6 w-16 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🏫</div>
          <p className="text-gray-500">Hali sinf qo&apos;shilmagan</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-700"
          >
            Birinchi sinfni qo&apos;shing
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              Jami: <strong className="text-gray-900">{classes.length}</strong>{" "}
              ta sinf
            </span>
            <span>•</span>
            <span>
              Jami o&apos;quvchilar:{" "}
              <strong className="text-gray-900">{totalStudents}</strong> ta
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {classes.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{c.name}</h3>
                  <span className="text-2xl">🏫</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-sm font-medium">
                    👨‍🎓 {c._count?.students ?? 0} ta o&apos;quvchi
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Yangi sinf qo&apos;shish
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sinf nomi
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Masalan: 5-A, 9-B"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
    </div>
  );
}
