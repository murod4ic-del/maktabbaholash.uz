"use client";

import { useState, useEffect, useCallback } from "react";

interface Student {
  id: number;
  fullName: string;
  createdAt: string;
  class?: { id: number; name: string };
}

interface ClassItem {
  id: number;
  name: string;
  _count?: { students: number };
}

const SCHOOL_ID = 1;

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [filterClassId, setFilterClassId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ fullName: "", classId: "" });

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ schoolId: String(SCHOOL_ID) });
      if (filterClassId) params.set("classId", filterClassId);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/students?${params}`);
      if (!res.ok) throw new Error();
      setStudents(await res.json());
    } catch {
      setError("O'quvchilarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [filterClassId, searchQuery]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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
      /* classes will remain empty */
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          classId: Number(form.classId),
          schoolId: SCHOOL_ID,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Xatolik yuz berdi");
      }

      setForm({ fullName: "", classId: "" });
      setShowModal(false);
      setToast({
        message: "O'quvchi muvaffaqiyatli qo'shildi!",
        type: "success",
      });
      fetchStudents();
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "O'quvchi qo'shishda xatolik",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">O&apos;quvchilar</h1>
          <p className="text-gray-500 mt-1">
            Barcha o&apos;quvchilar ro&apos;yxati va boshqaruv
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <span className="text-lg">+</span>
          Yangi o&apos;quvchi
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism bo'yicha qidirish..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <select
          value={filterClassId}
          onChange={(e) => setFilterClassId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-w-[160px]"
        >
          <option value="">Barcha sinflar</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  #
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  F.I.Sh
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Sinf
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Qo&apos;shilgan sana
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    {searchQuery || filterClassId
                      ? "Hech qanday natija topilmadi"
                      : "Hali o'quvchi qo'shilmagan"}
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {s.fullName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        {s.class?.name || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(s.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && students.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            Jami: {students.length} ta o&apos;quvchi
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Yangi o&apos;quvchi qo&apos;shish
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
                  F.I.Sh (to&apos;liq ism)
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Ism Familiya"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sinf
                </label>
                <select
                  required
                  value={form.classId}
                  onChange={(e) =>
                    setForm({ ...form, classId: e.target.value })
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
