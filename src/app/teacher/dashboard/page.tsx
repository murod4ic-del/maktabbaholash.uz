"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface TeacherSubject {
  id: number;
  classId: number;
  subjectId: number;
  subject: { id: number; name: string };
  class: { id: number; name: string };
}

interface Grade {
  id: number;
  value: number;
  gradeType: string;
  topic: string;
  quarter: number;
  gradeDate: string;
  student: { id: number; fullName: string };
  subject: { id: number; name: string };
  class: { id: number; name: string };
}

interface QuarterCfg {
  id: number;
  quarter: number;
  startDate: string;
  endDate: string;
  subjectId: number | null;
  classId: number | null;
}

const gradeColors: Record<number, string> = {
  5: "bg-emerald-500",
  4: "bg-blue-500",
  3: "bg-amber-500",
  2: "bg-orange-500",
  1: "bg-red-500",
};

const gradeTypeLabels: Record<string, string> = {
  daily: "Kunlik",
  control: "Nazorat",
  homework: "Uy vazifa",
  exam: "Yakuniy",
  quarter: "Chorak",
  year: "Yillik",
};

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const teacherId = session?.user?.id;
  const teacherName = session?.user?.fullName || "O'qituvchi";

  const [grades, setGrades] = useState<Grade[]>([]);
  const [tsList, setTsList] = useState<TeacherSubject[]>([]);
  const [quarters, setQuarters] = useState<QuarterCfg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [g, ts, q] = await Promise.all([
          fetch(`/api/grades?teacherId=${teacherId}`).then((r) => r.json()),
          fetch(`/api/teacher-subjects?teacherId=${teacherId}`).then((r) => r.json()),
          fetch(`/api/quarters?teacherId=${teacherId}`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setGrades(g || []);
        setTsList(ts || []);
        setQuarters(q?.items || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const todayGrades = grades.filter((g) => g.gradeDate?.split("T")[0] === todayStr);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const weekGrades = grades.filter((g) => new Date(g.gradeDate) >= weekAgo);

  const uniqueClasses = useMemo(
    () => Array.from(new Map(tsList.map((t) => [t.classId, t.class])).values()),
    [tsList]
  );
  const uniqueSubjects = useMemo(
    () => Array.from(new Map(tsList.map((t) => [t.subjectId, t.subject])).values()),
    [tsList]
  );

  const dailyGrades = grades.filter((g) => g.gradeType !== "year" && g.gradeType !== "quarter");
  const avgGrade =
    dailyGrades.length > 0
      ? (dailyGrades.reduce((s, g) => s + g.value, 0) / dailyGrades.length).toFixed(2)
      : "—";

  const activeQuarter = useMemo(() => {
    const now = today.getTime();
    const found = quarters.find(
      (q) => new Date(q.startDate).getTime() <= now && new Date(q.endDate).getTime() >= now
    );
    if (found) return found;
    const upcoming = quarters
      .filter((q) => new Date(q.startDate).getTime() > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
    return upcoming || null;
  }, [quarters]);

  const recentGrades = grades.slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-cyan-200/40 blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-blue-100 text-sm">
            {today.toLocaleDateString("uz-UZ", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="mt-1 text-3xl lg:text-4xl font-bold">
            Salom, {teacherName}!
          </h1>
          <p className="mt-2 text-blue-50/90">
            Bugun {todayGrades.length} ta baho qo&apos;ydingiz. Hafta ichida — {weekGrades.length} ta.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/teacher/grades"
              className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 transition shadow"
            >
              📝 Yangi baho qo&apos;yish
            </Link>
            <Link
              href="/teacher/finals"
              className="px-5 py-2.5 rounded-xl bg-white/15 text-white border border-white/30 font-semibold text-sm hover:bg-white/25 transition"
            >
              🎯 Chorak / yillik baho
            </Link>
            <Link
              href="/teacher/quarters"
              className="px-5 py-2.5 rounded-xl bg-white/15 text-white border border-white/30 font-semibold text-sm hover:bg-white/25 transition"
            >
              📅 Chorak vaqtlari
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat icon="🏫" label="Sinflar" value={uniqueClasses.length} color="from-violet-500 to-fuchsia-500" />
        <Stat icon="📚" label="Fanlar" value={uniqueSubjects.length} color="from-blue-500 to-cyan-500" />
        <Stat icon="📝" label="Bugun" value={todayGrades.length} color="from-emerald-500 to-teal-500" />
        <Stat icon="📊" label="O'rtacha" value={avgGrade} color="from-amber-500 to-orange-500" />
        <Stat icon="🗓️" label="Hafta" value={weekGrades.length} color="from-rose-500 to-pink-500" />
      </div>

      {activeQuarter ? (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-5 flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-md">
            ⏳
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm text-emerald-700 font-medium">
              Hozirgi chorak: {romanize(activeQuarter.quarter)}-chorak
            </p>
            <p className="text-emerald-800 font-semibold">
              {fmtDate(activeQuarter.startDate)} — {fmtDate(activeQuarter.endDate)}
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              {daysLeft(activeQuarter.endDate)} kun qoldi.
            </p>
          </div>
          <Link
            href="/teacher/finals"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition shadow"
          >
            Chorak baholarini qo&apos;yish
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl">📅</div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-amber-800 font-semibold">Chorak vaqtlari hali sozlanmagan</p>
            <p className="text-sm text-amber-700">
              Choraklarni avval &quot;Chorak vaqtlari&quot; bo&apos;limida belgilab oling — keyin yakuniy baho qo&apos;yish uchun avtomatik yordam beradi.
            </p>
          </div>
          <Link
            href="/teacher/quarters"
            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition shadow"
          >
            Sozlash
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">So&apos;nggi baholar</h2>
              <p className="text-xs text-gray-500">Oxirgi 8 ta yozuv</p>
            </div>
            <Link
              href="/teacher/grades"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Hammasini ko&apos;rish →
            </Link>
          </div>
          {recentGrades.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <span className="text-4xl block mb-3">📋</span>
              <p>Hozircha baholar yo&apos;q</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentGrades.map((g) => (
                <li key={g.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50">
                  <span
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold text-sm ${gradeColors[g.value] || "bg-gray-400"}`}
                  >
                    {g.value}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{g.student.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {g.subject.name} · {g.class.name} · {gradeTypeLabels[g.gradeType] || g.gradeType}
                      {g.topic ? ` · ${g.topic}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(g.gradeDate).toLocaleDateString("uz-UZ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Mening sinflarim</h2>
            <p className="text-xs text-gray-500">{uniqueClasses.length} ta sinf · {uniqueSubjects.length} ta fan</p>
          </div>
          {uniqueClasses.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">
              <span className="text-4xl block mb-3">🏫</span>
              <p>Sinflar biriktirilmagan</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {uniqueClasses.map((c) => {
                const subs = tsList.filter((t) => t.classId === c.id).map((t) => t.subject.name);
                return (
                  <li key={c.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">{c.name}</span>
                      <Link
                        href={`/teacher/students?classId=${c.id}`}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Ro&apos;yxat →
                      </Link>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {subs.slice(0, 6).map((s) => (
                        <span
                          key={s}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"
                        >
                          {s}
                        </span>
                      ))}
                      {subs.length > 6 && (
                        <span className="text-[11px] text-gray-500">+{subs.length - 6}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center text-lg shadow-md`}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysLeft(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function romanize(n: number): string {
  return ["I", "II", "III", "IV"][n - 1] || String(n);
}
