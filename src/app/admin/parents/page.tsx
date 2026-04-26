"use client";

import { useState, useEffect } from "react";

interface ParentStudent {
  student: { id: number; fullName: string; classId: number };
}

interface Parent {
  id: number;
  fullName: string;
  login: string;
  phone: string;
  createdAt: string;
  parentStudents: ParentStudent[];
}

interface Student {
  id: number;
  fullName: string;
  class?: { id: number; name: string };
}

const SCHOOL_ID = 1;

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    login: string;
    password: string;
    fullName: string;
  } | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    login: "",
    password: "",
    phone: "",
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  useEffect(() => {
    fetchParents();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchParents() {
    try {
      const res = await fetch("/api/parents");
      if (!res.ok) throw new Error();
      setParents(await res.json());
    } catch {
      setError("Ota-onalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudents() {
    try {
      const res = await fetch(`/api/students?schoolId=${SCHOOL_ID}`);
      if (!res.ok) throw new Error();
      setStudents(await res.json());
    } catch {
      /* students will remain empty */
    }
  }

  function toggleStudent(id: number) {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          studentIds: selectedStudentIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Xatolik yuz berdi");
      }

      setCreatedCredentials({
        login: form.login,
        password: form.password,
        fullName: form.fullName,
      });
      setForm({ fullName: "", login: "", password: "", phone: "" });
      setSelectedStudentIds([]);
      setShowModal(false);
      setToast({
        message: "Ota-ona muvaffaqiyatli qo'shildi!",
        type: "success",
      });
      fetchParents();
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Ota-ona qo'shishda xatolik",
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
          <h1 className="text-2xl font-bold text-gray-900">Ota-onalar</h1>
          <p className="text-gray-500 mt-1">
            Barcha ota-onalar ro&apos;yxati va boshqaruv
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <span className="text-lg">+</span>
          Yangi ota-ona
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

      {createdCredentials && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-indigo-900 mb-2">
                Yangi ota-ona ma&apos;lumotlari — saqlab qo&apos;ying yoki chop eting!
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-indigo-800">
                  <span className="font-medium">Ism:</span>{" "}
                  {createdCredentials.fullName}
                </p>
                <p className="text-indigo-800">
                  <span className="font-medium">Login:</span>{" "}
                  <code className="bg-indigo-100 px-2 py-0.5 rounded">
                    {createdCredentials.login}
                  </code>
                </p>
                <p className="text-indigo-800">
                  <span className="font-medium">Parol:</span>{" "}
                  <code className="bg-indigo-100 px-2 py-0.5 rounded">
                    {createdCredentials.password}
                  </code>
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="text-indigo-400 hover:text-indigo-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

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
                  Login
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Telefon
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">
                  Bog&apos;langan o&apos;quvchilar
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
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : parents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Hali ota-ona qo&apos;shilmagan
                  </td>
                </tr>
              ) : (
                parents.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.fullName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {p.login}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.parentStudents.length === 0 ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          p.parentStudents.map((ps) => (
                            <span
                              key={ps.student.id}
                              className="inline-flex items-center bg-violet-50 text-violet-700 px-2 py-0.5 rounded text-xs font-medium"
                            >
                              {ps.student.fullName}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(p.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && parents.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            Jami: {parents.length} ta ota-ona
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Yangi ota-ona qo&apos;shish
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
                  Login
                </label>
                <input
                  type="text"
                  required
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="login_nomi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parol
                </label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Parolni kiriting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon raqam
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  O&apos;quvchilarni tanlang
                </label>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                  {students.length === 0 ? (
                    <p className="text-sm text-gray-400 p-2">
                      O&apos;quvchilar topilmadi
                    </p>
                  ) : (
                    students.map((s) => (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedStudentIds.includes(s.id)
                            ? "bg-indigo-50 border border-indigo-200"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-900">
                          {s.fullName}
                        </span>
                        {s.class && (
                          <span className="text-xs text-gray-400 ml-auto">
                            {s.class.name}
                          </span>
                        )}
                      </label>
                    ))
                  )}
                </div>
                {selectedStudentIds.length > 0 && (
                  <p className="text-xs text-indigo-600 mt-1">
                    {selectedStudentIds.length} ta o&apos;quvchi tanlandi
                  </p>
                )}
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
