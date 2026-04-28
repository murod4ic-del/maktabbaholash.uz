"use client";

import { useEffect, useState } from "react";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";

interface ClassItem {
  id: number;
  name: string;
  schoolId: number;
  _count?: { students: number };
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/classes");
        if (r.ok) setClasses(await r.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = [...classes].sort((a, b) =>
    a.name.localeCompare(b.name, "uz", { numeric: true })
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sinflar</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Maktabdagi sinflar va ulardagi o&apos;quvchilar soni
        </p>
      </div>

      <ReadOnlyBanner />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <span className="text-5xl block mb-4">🏫</span>
          <p className="text-gray-500 text-sm">
            Hali sinf qo&apos;shilmagan. Dasturda sinflarni qo&apos;shing va sinxronlang.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sorted.map((c) => {
            const isPrimary = /^[1-4]/.test(c.name);
            return (
              <div
                key={c.id}
                className={`rounded-2xl border p-4 shadow-sm hover:shadow-md transition text-center ${
                  isPrimary
                    ? "bg-amber-50 border-amber-100"
                    : "bg-white border-gray-100"
                }`}
              >
                <div className="text-3xl mb-1">{isPrimary ? "🧒" : "🎓"}</div>
                <h3 className="font-bold text-lg text-gray-800">{c.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {c._count?.students ?? 0} o&apos;quvchi
                </p>
                {isPrimary && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-medium mt-1 inline-block">
                    Boshlang&apos;ich
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
