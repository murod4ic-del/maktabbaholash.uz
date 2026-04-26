"use client";

import { useState, useEffect } from "react";

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalGrades: number;
  averageGrade: number;
}

const SCHOOL_ID = 1;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch(`/api/stats?schoolId=${SCHOOL_ID}`);
      if (!res.ok) throw new Error("Statistikani olishda xatolik");
      const data = await res.json();
      setStats(data);
    } catch {
      setError("Statistikani yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
      label: "O'quvchilar soni",
      value: stats?.totalStudents ?? 0,
      icon: "👨‍🎓",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      valueBg: "text-blue-900",
    },
    {
      label: "O'qituvchilar soni",
      value: stats?.totalTeachers ?? 0,
      icon: "👨‍🏫",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      valueBg: "text-emerald-900",
    },
    {
      label: "Ota-onalar soni",
      value: stats?.totalParents ?? 0,
      icon: "👨‍👩‍👧",
      bg: "bg-violet-50",
      border: "border-violet-200",
      text: "text-violet-700",
      valueBg: "text-violet-900",
    },
    {
      label: "Baholar soni",
      value: stats?.totalGrades ?? 0,
      icon: "📝",
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      valueBg: "text-amber-900",
    },
    {
      label: "O'rtacha baho",
      value: stats?.averageGrade ?? 0,
      icon: "⭐",
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-700",
      valueBg: "text-rose-900",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Admin panelga xush kelibsiz
        </h1>
        <p className="text-gray-500 mt-1">
          Maktab boshqaruv tizimi — umumiy statistika
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-lg bg-gray-200" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded" />
              </div>
            ))
          : cards.map((card) => (
              <div
                key={card.label}
                className={`${card.bg} ${card.border} border rounded-xl p-5 transition-transform hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl w-11 h-11 flex items-center justify-center rounded-lg bg-white/70">
                    {card.icon}
                  </div>
                  <span className={`text-sm font-medium ${card.text}`}>
                    {card.label}
                  </span>
                </div>
                <p className={`text-3xl font-bold ${card.valueBg}`}>
                  {card.value}
                </p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Tezkor havolalar
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                href: "/admin/teachers",
                label: "O'qituvchilar",
                icon: "👨‍🏫",
              },
              { href: "/admin/students", label: "O'quvchilar", icon: "👨‍🎓" },
              { href: "/admin/parents", label: "Ota-onalar", icon: "👨‍👩‍👧" },
              { href: "/admin/classes", label: "Sinflar", icon: "🏫" },
              { href: "/admin/subjects", label: "Fanlar", icon: "📚" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-colors"
              >
                <span className="text-xl">{link.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {link.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Tizim haqida
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Bu tizim maktab boshqaruvi uchun yaratilgan. Admin sifatida siz
              quyidagi amallarni bajarishingiz mumkin:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>O&apos;qituvchilar, o&apos;quvchilar va ota-onalarni boshqarish</li>
              <li>Sinflar va fanlarni yaratish</li>
              <li>O&apos;qituvchilarga fan va sinf biriktirish</li>
              <li>Baholar statistikasini ko&apos;rish</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
