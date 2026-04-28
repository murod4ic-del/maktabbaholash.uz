"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import StudentProfileView from "@/components/StudentProfileView";

interface Child {
  id: number;
  fullName: string;
  class: { id: number; name: string };
}

export default function ParentDashboard() {
  const { data: session } = useSession();
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/parent-children")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const items: Child[] = json.items || [];
        setChildren(items);
        if (items.length > 0) setActiveId(items[0].id);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
        <h3 className="text-lg font-semibold text-gray-700">Farzandlar topilmadi</h3>
        <p className="text-sm text-gray-500 mt-1">
          Sizga biriktirilgan o&apos;quvchilar mavjud emas. Maktab ma&apos;muriyatiga murojaat qiling.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-white/30 blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-teal-100 text-sm">
            {new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            Assalomu alaykum, {session?.user?.fullName}!
          </h1>
          <p className="mt-2 text-teal-50/90 max-w-2xl">
            Farzand{children.length > 1 ? "laringiz" : "ingizning"} o&apos;qish natijalari, davomati va faolligi
            shu yerda. Pastdagi suratlardan birini tanlang.
          </p>
        </div>
      </div>

      {children.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2">
          {children.map((c) => {
            const active = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                  active
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                    active ? "bg-white/20" : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {c.fullName.charAt(0)}
                </span>
                <span className="text-left">
                  <span className="block leading-tight">{c.fullName}</span>
                  <span className={`block text-[11px] ${active ? "text-white/80" : "text-gray-400"}`}>
                    {c.class.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {activeId && <StudentProfileView studentId={activeId} accent="teal" />}
    </div>
  );
}
