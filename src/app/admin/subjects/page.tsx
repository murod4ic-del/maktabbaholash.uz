"use client";

import { useEffect, useState } from "react";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";

interface SubjectItem {
  id: number;
  name: string;
  schoolId: number;
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/subjects");
        if (r.ok) setSubjects(await r.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = [...subjects].sort((a, b) =>
    a.name.localeCompare(b.name, "uz")
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fanlar</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Maktabdagi o&apos;qitilayotgan fanlar
        </p>
      </div>

      <ReadOnlyBanner />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <span className="text-5xl block mb-4">📚</span>
          <p className="text-gray-500 text-sm">
            Hali fan qo&apos;shilmagan. Dasturda fanlarni qo&apos;shing va sinxronlang.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-lg flex-shrink-0">
                📖
              </div>
              <h3 className="font-medium text-gray-800 truncate">{s.name}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
