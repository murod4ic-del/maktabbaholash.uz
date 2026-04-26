"use client";

import { useState, useEffect } from "react";

interface Teacher {
  id: number;
  fullName: string;
  login: string;
  phone: string;
  createdAt: string;
  school?: { id: number; name: string };
}

const SCHOOL_ID = 1;

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchTeachers() {
    try {
      const res = await fetch(`/api/teachers?schoolId=${SCHOOL_ID}`);
      if (!res.ok) throw new Error();
      setTeachers(await res.json());
    } catch {
      setError("O'qituvchilarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, schoolId: SCHOOL_ID }),
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
      setShowModal(false);
      setToast({
        message: "O'qituvchi muvaffaqiyatli qo'shildi!",
        type: "success",
      });
      fetchTeachers();
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "O'qituvchi qo'shishda xatolik",
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
          <h1 className="text-2xl font-bold text-gray-900">O&apos;qituvchilar</h1>
          <p className="text-gray-500 mt-1">
            Barcha o&apos;qituvchilar ro&apos;yxati va boshqaruv
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <span className="text-lg">+</span>
          Yangi o&apos;qituvchi
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
                Yangi o&apos;qituvchi ma&apos;lumotlari — saqlab qo&apos;ying!
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
                  Qo&apos;shilgan sana
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : teachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Hali o&apos;qituvchi qo&apos;shilmagan
                  </td>
                </tr>
              ) : (
                teachers.map((t, idx) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {t.fullName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {t.login}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(t.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && teachers.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            Jami: {teachers.length} ta o&apos;qituvchi
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
                Yangi o&apos;qituvchi qo&apos;shish
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
