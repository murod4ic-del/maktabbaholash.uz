"use client";

import { useEffect, useState } from "react";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";

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

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/parents");
        if (r.ok) setParents(await r.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = parents.filter((p) =>
    !search.trim() ||
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.login.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ota-onalar</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Ro&apos;yxatga olingan ota-onalar va ularning farzandlari
        </p>
      </div>

      <ReadOnlyBanner
        description="Ota-onalar AccessUZ dasturi yoki Telegram bot orqali ro'yxatga olinadi. Web sahifa faqat ko'rish uchun."
      />

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
          <span className="text-5xl block mb-4">👨‍👩‍👧</span>
          <p className="text-gray-500 text-sm">
            Ota-onalar topilmadi
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-semibold text-gray-800 truncate">{p.fullName}</h3>
              <code className="text-xs text-indigo-600 font-mono">{p.login}</code>
              {p.phone && (
                <p className="text-xs text-gray-500 mt-1">📞 {p.phone}</p>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[11px] uppercase text-gray-400 font-medium mb-1.5">
                  Farzandlari ({p.parentStudents.length})
                </p>
                {p.parentStudents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Yo&apos;q</p>
                ) : (
                  <div className="space-y-1">
                    {p.parentStudents.map((ps) => (
                      <div
                        key={ps.student.id}
                        className="text-xs bg-gray-50 rounded-lg px-2.5 py-1.5 text-gray-700"
                      >
                        {ps.student.fullName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
