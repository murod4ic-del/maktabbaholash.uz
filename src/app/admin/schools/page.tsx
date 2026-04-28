"use client";

import { useEffect, useState } from "react";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";

interface School {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  _count?: {
    teachers: number;
    students: number;
    classes: number;
    subjects: number;
  };
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/schools");
        if (r.ok) {
          const data = await r.json();
          setSchools(Array.isArray(data) ? data : []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-xl">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <span>🏛️</span> Maktablar
        </h1>
        <p className="mt-1 text-indigo-100 text-sm">
          Tizimga ulangan maktablar. Har bir maktab AccessUZ dasturi orqali sinxronlanadi.
        </p>
      </div>

      <ReadOnlyBanner
        description="Yangi maktab qo'shish uchun shu maktab kompyuteridagi AccessUZ dasturini sozlang: «Web sinxron» bo'limida nomi, kodi, manzilini kiriting va sinxronlang. Maktab avtomatik paydo bo'ladi."
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : schools.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <span className="text-5xl block mb-4">🏛️</span>
          <h3 className="text-lg font-semibold text-gray-700">
            Hali maktab ulanmagan
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Birinchi sinxronizatsiya o&apos;tkazilganda maktab avtomatik qo&apos;shiladi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schools.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{s.name}</h3>
                  <code className="text-xs text-indigo-600 font-mono">
                    {s.code}
                  </code>
                </div>
                <span className="text-2xl">🏛️</span>
              </div>
              {s.address && (
                <p className="mt-2 text-sm text-gray-600 truncate">📍 {s.address}</p>
              )}
              {s.phone && (
                <p className="text-sm text-gray-600 truncate">📞 {s.phone}</p>
              )}
              {s._count && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 text-blue-700 rounded-lg px-2 py-1.5">
                    👨‍🏫 {s._count.teachers} o&apos;qituvchi
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 rounded-lg px-2 py-1.5">
                    👨‍🎓 {s._count.students} o&apos;quvchi
                  </div>
                  <div className="bg-amber-50 text-amber-700 rounded-lg px-2 py-1.5">
                    🏫 {s._count.classes} sinf
                  </div>
                  <div className="bg-violet-50 text-violet-700 rounded-lg px-2 py-1.5">
                    📚 {s._count.subjects} fan
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
