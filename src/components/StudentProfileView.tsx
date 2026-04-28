"use client";

import { useEffect, useState } from "react";

interface Student {
  id: number;
  fullName: string;
  class: { id: number; name: string };
  school?: { id: number; name: string };
  photoUrl?: string | null;
  login?: string | null;
}

interface SubjectGroup {
  id: number;
  name: string;
  teacher: string;
  average: number;
  finalQuarter: Record<number, number | null>;
  finalYear: number | null;
  distribution: Record<number, number>;
  grades: Array<{
    id: number;
    value: number;
    gradeType: string;
    quarter: number;
    topic: string;
    gradeDate: string;
  }>;
}

interface RecentGrade {
  id: number;
  value: number;
  gradeType: string;
  quarter: number;
  topic: string;
  gradeDate: string;
  subject: { id: number; name: string };
  teacher: { id: number; fullName: string };
}

interface AttendanceLog {
  id: number;
  date: string;
  enterAt?: string | null;
  exitAt?: string | null;
  isLate: boolean;
}

interface StatsResponse {
  student: Student;
  subjects: SubjectGroup[];
  recent: RecentGrade[];
  trend: { week: string; count: number; avg: number }[];
  attendance: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    recent: AttendanceLog[];
  };
  stats: {
    gradeCount: number;
    overallAverage: number;
    subjectCount: number;
    activityScore: number;
  };
}

const gradeColors: Record<number, string> = {
  5: "bg-emerald-500",
  4: "bg-blue-500",
  3: "bg-amber-500",
  2: "bg-orange-500",
  1: "bg-red-500",
};

const gradeColorsLight: Record<number, string> = {
  5: "bg-emerald-50 text-emerald-700 border-emerald-200",
  4: "bg-blue-50 text-blue-700 border-blue-200",
  3: "bg-amber-50 text-amber-700 border-amber-200",
  2: "bg-orange-50 text-orange-700 border-orange-200",
  1: "bg-red-50 text-red-700 border-red-200",
};

const gradeTypeLabels: Record<string, string> = {
  daily: "Kunlik",
  control: "Nazorat",
  homework: "Uy vazifa",
  exam: "Yakuniy",
  quarter: "Chorak",
  year: "Yillik",
};

interface Props {
  studentId: number;
  accent?: "indigo" | "teal" | "blue";
}

export default function StudentProfileView({ studentId, accent = "indigo" }: Props) {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/student-stats?studentId=${studentId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          if (json.error) {
            setData(null);
          } else {
            setData(json);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
        Ma&apos;lumot topilmadi
      </div>
    );
  }

  const accentBg =
    accent === "teal"
      ? "from-teal-500 via-cyan-500 to-blue-500"
      : accent === "blue"
        ? "from-blue-600 via-indigo-600 to-purple-500"
        : "from-indigo-600 via-violet-600 to-fuchsia-500";

  const overall = data.stats.overallAverage;
  const overallColor =
    overall >= 4.5
      ? "from-emerald-500 to-green-500"
      : overall >= 3.5
        ? "from-blue-500 to-cyan-500"
        : overall >= 2.5
          ? "from-amber-500 to-orange-500"
          : "from-rose-500 to-red-500";

  const onTimeRate =
    data.attendance.totalDays > 0
      ? Math.round(
          ((data.attendance.presentDays - data.attendance.lateDays) /
            data.attendance.totalDays) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${accentBg} p-6 lg:p-8 text-white shadow-xl`}>
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-white/30 blur-3xl" />
        </div>
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="relative">
            {data.student.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.student.photoUrl}
                alt={data.student.fullName}
                className="w-28 h-28 rounded-3xl object-cover ring-4 ring-white/40 shadow-2xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl font-bold ring-4 ring-white/40">
                {data.student.fullName.charAt(0)}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-lg font-bold text-sm">
              {data.stats.activityScore}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <h1 className="text-3xl font-bold">{data.student.fullName}</h1>
            <p className="text-white/80 mt-1">
              {data.student.class.name}
              {data.student.school ? ` · ${data.student.school.name}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill icon="📚" label="Fanlar" value={data.stats.subjectCount} />
              <Pill icon="📝" label="Baholar" value={data.stats.gradeCount} />
              <Pill icon="📅" label="Davomat" value={`${onTimeRate}%`} />
            </div>
          </div>

          <div className="text-center">
            <div
              className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${overallColor} shadow-2xl flex items-center justify-center`}
            >
              <div className="text-center">
                <p className="text-white/80 text-[10px] uppercase tracking-wider">O&apos;rtacha</p>
                <p className="text-white text-3xl font-bold">
                  {overall > 0 ? overall.toFixed(1) : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ActivityCard
          title="Faollik darajasi"
          value={`${data.stats.activityScore}/100`}
          icon="⚡"
          progress={data.stats.activityScore}
          color="from-indigo-500 to-purple-500"
        />
        <ActivityCard
          title="Vaqtida kelish"
          value={`${onTimeRate}%`}
          icon="⏰"
          progress={onTimeRate}
          color="from-emerald-500 to-teal-500"
        />
        <ActivityCard
          title="Kech qolish"
          value={`${data.attendance.lateDays} kun`}
          icon="⏳"
          progress={
            data.attendance.totalDays > 0
              ? 100 - Math.round((data.attendance.lateDays / data.attendance.totalDays) * 100)
              : 100
          }
          color="from-amber-500 to-orange-500"
        />
        <ActivityCard
          title="Davomat (30 kun)"
          value={`${data.attendance.presentDays}/${data.attendance.totalDays || 0}`}
          icon="📅"
          progress={
            data.attendance.totalDays > 0
              ? Math.round((data.attendance.presentDays / data.attendance.totalDays) * 100)
              : 0
          }
          color="from-cyan-500 to-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">📚 Fanlar bo&apos;yicha o&apos;zlashtirish</h2>
              <span className="text-xs text-gray-500">{data.subjects.length} ta fan</span>
            </div>
            {data.subjects.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <span className="text-4xl block mb-3">📭</span>
                <p>Fanlar yoki baholar mavjud emas</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {data.subjects.map((s) => (
                  <SubjectRow key={s.id} subject={s} />
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">📊 Chorak yakuniy baholar</h2>
              <p className="text-xs text-gray-500">Har bir fan uchun chorak yakuni va yillik baho</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Fan</th>
                    <th className="px-4 py-3 text-center">I</th>
                    <th className="px-4 py-3 text-center">II</th>
                    <th className="px-4 py-3 text-center">III</th>
                    <th className="px-4 py-3 text-center">IV</th>
                    <th className="px-4 py-3 text-center">Yillik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.subjects.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                        {s.name}
                      </td>
                      {[1, 2, 3, 4].map((q) => (
                        <td key={q} className="px-4 py-2.5 text-center">
                          {s.finalQuarter[q] != null ? (
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-bold ${gradeColors[s.finalQuarter[q] as number]}`}
                            >
                              {s.finalQuarter[q]}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-center">
                        {s.finalYear != null ? (
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-white text-sm font-bold ${gradeColors[s.finalYear]} shadow`}
                          >
                            {s.finalYear}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">🕒 So&apos;nggi baholar</h2>
            </div>
            {data.recent.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400">
                <span className="text-3xl block mb-2">📋</span>
                <p className="text-sm">Hali baholar yo&apos;q</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {data.recent.slice(0, 8).map((g) => (
                  <li key={g.id} className="px-5 py-3 flex items-center gap-3">
                    <span
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-white text-sm font-bold ${gradeColors[g.value] || "bg-gray-400"}`}
                    >
                      {g.value}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{g.subject.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {gradeTypeLabels[g.gradeType] || g.gradeType}
                        {g.topic ? ` · ${g.topic}` : ""}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {new Date(g.gradeDate).toLocaleDateString("uz-UZ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">📅 Davomat (oxirgi 10 kun)</h2>
            </div>
            {data.attendance.recent.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400">
                <span className="text-3xl block mb-2">🗓️</span>
                <p className="text-sm">Davomat ma&apos;lumotlari yo&apos;q</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {data.attendance.recent.slice(0, 10).map((a) => (
                  <li key={a.id} className="px-5 py-2.5 flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        a.isLate ? "bg-amber-500" : a.enterAt ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      {new Date(a.date).toLocaleDateString("uz-UZ", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {a.enterAt
                        ? new Date(a.enterAt).toLocaleTimeString("uz-UZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Yo'q"}
                    </span>
                    {a.isLate && (
                      <span className="text-[11px] text-amber-700 font-medium">Kech</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-medium">
      <span>{icon}</span>
      <span>{label}:</span>
      <strong>{value}</strong>
    </span>
  );
}

function ActivityCard({
  title,
  value,
  icon,
  progress,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  progress: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-gray-500 uppercase tracking-wider">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      <div className="mt-2.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}

function SubjectRow({ subject }: { subject: SubjectGroup }) {
  const total = Object.values(subject.distribution).reduce((s, n) => s + n, 0);
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="px-5 py-3.5">
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center justify-center w-11 h-11 rounded-xl text-white font-bold ${gradeColors[Math.round(subject.average) || 1] || "bg-gray-400"} shadow`}
          >
            {subject.average > 0 ? subject.average.toFixed(1) : "—"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{subject.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {subject.teacher} · {total} ta baho
            </p>
            <div className="mt-2 flex h-1.5 rounded-full overflow-hidden bg-gray-100">
              {[5, 4, 3, 2, 1].map((v) => {
                const count = subject.distribution[v] || 0;
                const pct = total > 0 ? (count / total) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={v}
                    className={gradeColors[v]}
                    style={{ width: `${pct}%` }}
                    title={`${v}: ${count} ta`}
                  />
                );
              })}
            </div>
          </div>
          <span className={`text-gray-400 transition ${expanded ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>
      {expanded && subject.grades.length > 0 && (
        <div className="mt-3 pl-14 flex flex-wrap gap-1.5">
          {subject.grades.slice(0, 25).map((g) => (
            <span
              key={g.id}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold ${gradeColorsLight[g.value] || ""}`}
              title={`${gradeTypeLabels[g.gradeType] || g.gradeType}${g.topic ? " · " + g.topic : ""} · ${new Date(g.gradeDate).toLocaleDateString("uz-UZ")}`}
            >
              {g.value}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}
