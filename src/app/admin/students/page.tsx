"use client";

import { useEffect, useState } from "react";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";

interface Student {
  id: number;
  fullName: string;
  login: string | null;
  classId: number;
  schoolId: number;
  photoUrl: string | null;
  createdAt: string;
  class?: { id: number; name: string };
  school?: { id: number; name: string };
}

interface ClassItem {
  id: number;
  name: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/classes"),
        ]);
        if (sRes.ok) setStudents(await sRes.json());
        if (cRes.ok) setClasses(await cRes.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = students.filter((s) => {
    if (classFilter && String(s.classId) !== classFilter) return false;
    if (
      search.trim() &&
      !s.fullName.toLowerCase().includes(search.toLowerCase()) &&
      !(s.login || "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">O&apos;quvchilar</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Dasturda terminaldan ro&apos;yxatga olingan o&apos;quvchilar
        </p>
      </div>

      <ReadOnlyBanner />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Qidirish: ism yoki login..."
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
        />
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
        >
          <option value="">Barcha sinflar</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium whitespace-nowrap">
          {filtered.length} ta
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <span className="text-5xl block mb-4">👨‍🎓</span>
          <p className="text-gray-500 text-sm">
            O&apos;quvchilar topilmadi. Dasturda terminallarga yuzlarni ro&apos;yxatga oling va sinxronlang.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((s) => {
            const initials = s.fullName
              .split(/\s+/)
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition text-center"
              >
                {s.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.photoUrl}
                    alt={s.fullName}
                    className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-semibold text-lg">
                    {initials || "?"}
                  </div>
                )}
                <h3 className="mt-2 font-medium text-gray-800 text-sm truncate">{s.fullName}</h3>
                <p className="text-xs text-gray-400 truncate">
                  {s.class?.name || `Sinf #${s.classId}`}
                </p>
                {s.login && (
                  <code className="text-[10px] text-indigo-600 font-mono mt-1 block truncate">
                    {s.login}
                  </code>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
