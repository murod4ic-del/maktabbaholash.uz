"use client";

import { useEffect, useState } from "react";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";

interface Teacher {
  id: number;
  fullName: string;
  login: string;
  phone: string;
  isPrimary?: boolean;
  schoolId: number;
  createdAt: string;
  school?: { id: number; name: string };
}

interface TeacherSubjectItem {
  id: number;
  teacherId: number;
  subject: { id: number; name: string };
  class: { id: number; name: string };
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [tsList, setTsList] = useState<TeacherSubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [tRes, tsRes] = await Promise.all([
          fetch("/api/teachers"),
          fetch("/api/teacher-subjects"),
        ]);
        if (tRes.ok) setTeachers(await tRes.json());
        if (tsRes.ok) setTsList(await tsRes.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tsByTeacher = tsList.reduce<Record<number, TeacherSubjectItem[]>>((acc, ts) => {
    (acc[ts.teacherId] ||= []).push(ts);
    return acc;
  }, {});

  const filtered = teachers.filter((t) =>
    !search.trim() ||
    t.fullName.toLowerCase().includes(search.toLowerCase()) ||
    t.login.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">O&apos;qituvchilar</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Dasturda ro&apos;yxatga olingan o&apos;qituvchilar va biriktirilgan fanlari
        </p>
      </div>

      <ReadOnlyBanner />

      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Qidirish: ism yoki login..."
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
        />
        <div className="px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium">
          {filtered.length} ta
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <span className="text-5xl block mb-4">👨‍🏫</span>
          <p className="text-gray-500 text-sm">
            Hali o&apos;qituvchi qo&apos;shilmagan. Dasturda o&apos;qituvchilarni qo&apos;shing va Web sinxron tugmasini bosing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((t) => {
            const myTs = tsByTeacher[t.id] || [];
            const initials = t.fullName
              .split(/\s+/)
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-semibold text-sm">
                    {initials || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800 truncate">{t.fullName}</h3>
                    <code className="text-xs text-indigo-600 font-mono">{t.login}</code>
                  </div>
                  {t.isPrimary && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium whitespace-nowrap">
                      Boshlang&apos;ich
                    </span>
                  )}
                </div>
                {t.phone && (
                  <p className="text-xs text-gray-500 mt-2">📞 {t.phone}</p>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[11px] uppercase text-gray-400 font-medium mb-1.5">
                    Biriktirilgan fanlar ({myTs.length})
                  </p>
                  {myTs.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Yo&apos;q</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {myTs.slice(0, 6).map((ts) => (
                        <span
                          key={ts.id}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                        >
                          {ts.subject.name} · {ts.class.name}
                        </span>
                      ))}
                      {myTs.length > 6 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-400">
                          +{myTs.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
