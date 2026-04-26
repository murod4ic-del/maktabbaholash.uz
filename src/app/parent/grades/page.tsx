"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChildClass {
  id: number;
  name: string;
}

interface Child {
  id: number;
  fullName: string;
  class: ChildClass;
}

interface Grade {
  id: number;
  studentId: number;
  teacherId: number;
  subjectId: number;
  classId: number;
  gradeType: string;
  topic: string;
  value: number;
  quarter: number;
  note: string;
  gradeDate: string;
  createdAt: string;
  student: { fullName: string };
  teacher: { fullName: string };
  subject: { id: number; name: string };
  class: { id: number; name: string };
}

const GRADE_TYPES = [
  { value: "", label: "Barchasi" },
  { value: "daily", label: "Kunlik" },
  { value: "control", label: "Nazorat" },
  { value: "homework", label: "Uy vazifasi" },
  { value: "final", label: "Yakuniy" },
];

const QUARTERS = [
  { value: 0, label: "Barcha choraklar" },
  { value: 1, label: "1-chorak" },
  { value: 2, label: "2-chorak" },
  { value: 3, label: "3-chorak" },
  { value: 4, label: "4-chorak" },
];

function gradeTypeLabel(type: string): string {
  const found = GRADE_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
}

export default function ParentGrades() {
  const { data: session } = useSession();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [quarter, setQuarter] = useState(0);
  const [gradeType, setGradeType] = useState("");

  useEffect(() => {
    async function fetchChildren() {
      try {
        const res = await fetch("/api/parent-children");
        const data = await res.json();
        const items: Child[] = data.items || [];
        setChildren(items);
        if (items.length > 0) {
          setSelectedChildId(items[0].id);
        }
      } catch {
        console.error("Farzandlarni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    }
    fetchChildren();
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    async function fetchGrades() {
      setGradesLoading(true);
      try {
        const params = new URLSearchParams({
          studentId: String(selectedChildId),
        });
        if (quarter > 0) params.set("quarter", String(quarter));
        if (gradeType) params.set("gradeType", gradeType);

        const res = await fetch(`/api/grades?${params.toString()}`);
        const data = await res.json();
        setGrades(Array.isArray(data) ? data : []);
      } catch {
        console.error("Baholarni yuklashda xatolik");
      } finally {
        setGradesLoading(false);
      }
    }
    fetchGrades();
  }, [selectedChildId, quarter, gradeType]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const stats = useMemo(() => {
    if (grades.length === 0)
      return { average: 0, bestSubject: "—", worstSubject: "—", total: 0 };

    const sum = grades.reduce((acc, g) => acc + g.value, 0);
    const average = sum / grades.length;

    const subjectAvgs: Record<string, { sum: number; count: number }> = {};
    grades.forEach((g) => {
      if (!subjectAvgs[g.subject.name])
        subjectAvgs[g.subject.name] = { sum: 0, count: 0 };
      subjectAvgs[g.subject.name].sum += g.value;
      subjectAvgs[g.subject.name].count += 1;
    });

    const entries = Object.entries(subjectAvgs).map(([name, v]) => ({
      name,
      avg: v.sum / v.count,
    }));
    entries.sort((a, b) => b.avg - a.avg);

    return {
      average,
      bestSubject: entries[0]?.name || "—",
      worstSubject: entries[entries.length - 1]?.name || "—",
      total: grades.length,
    };
  }, [grades]);

  const groupedBySubject = useMemo(() => {
    const map: Record<string, Grade[]> = {};
    grades.forEach((g) => {
      const key = g.subject.name;
      if (!map[key]) map[key] = [];
      map[key].push(g);
    });
    Object.values(map).forEach((arr) =>
      arr.sort(
        (a, b) =>
          new Date(b.gradeDate).getTime() - new Date(a.gradeDate).getTime()
      )
    );
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [grades]);

  const chartData = useMemo(() => {
    const subjectAvgs: Record<string, { sum: number; count: number }> = {};
    grades.forEach((g) => {
      if (!subjectAvgs[g.subject.name])
        subjectAvgs[g.subject.name] = { sum: 0, count: 0 };
      subjectAvgs[g.subject.name].sum += g.value;
      subjectAvgs[g.subject.name].count += 1;
    });
    return Object.entries(subjectAvgs)
      .map(([name, v]) => ({
        name,
        average: Number((v.sum / v.count).toFixed(2)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [grades]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
        <div className="text-5xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-700">
          Farzandlar topilmadi
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Sizga biriktirilgan o&apos;quvchilar mavjud emas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">Baholar</h1>
        {selectedChild && (
          <p className="text-sm text-gray-500">
            {selectedChild.fullName} — {selectedChild.class.name}
          </p>
        )}
      </div>

      {children.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Farzandni tanlang
          </label>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  selectedChildId === child.id
                    ? "bg-teal-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {child.fullName}
                <span className="ml-1.5 text-xs opacity-75">
                  ({child.class.name})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Chorak
            </label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {QUARTERS.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Baho turi
            </label>
            <select
              value={gradeType}
              onChange={(e) => setGradeType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {GRADE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {gradesLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="O'rtacha baho"
              value={stats.average > 0 ? stats.average.toFixed(2) : "—"}
              icon="📊"
              color={
                stats.average >= 4.5
                  ? "text-green-600"
                  : stats.average >= 3.5
                    ? "text-blue-600"
                    : stats.average >= 2.5
                      ? "text-yellow-600"
                      : "text-red-600"
              }
            />
            <StatCard
              label="Eng yuqori fan"
              value={stats.bestSubject}
              icon="🏆"
              color="text-green-600"
            />
            <StatCard
              label="Eng past fan"
              value={stats.worstSubject}
              icon="📉"
              color="text-orange-600"
            />
            <StatCard
              label="Jami baholar"
              value={String(stats.total)}
              icon="📝"
              color="text-teal-600"
            />
          </div>

          {grades.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
              <div className="text-4xl mb-3">📭</div>
              <h3 className="font-semibold text-gray-600">
                Baholar topilmadi
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Tanlangan filtrlar bo&apos;yicha baholar mavjud emas
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-600 mb-4">
                  Fanlar bo&apos;yicha o&apos;rtacha baholar
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      angle={-25}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        fontSize: "13px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value) => [
                        Number(value ?? 0).toFixed(2),
                        "O'rtacha",
                      ]}
                    />
                    <Bar dataKey="average" radius={[6, 6, 0, 0]} name="O'rtacha baho">
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.average >= 4.5
                              ? "#10b981"
                              : entry.average >= 3.5
                                ? "#3b82f6"
                                : entry.average >= 2.5
                                  ? "#eab308"
                                  : "#ef4444"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {groupedBySubject.map(([subjectName, subjectGrades]) => {
                  const subjectAvg =
                    subjectGrades.reduce((s, g) => s + g.value, 0) /
                    subjectGrades.length;
                  return (
                    <div
                      key={subjectName}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-base">📚</span>
                          <h3 className="font-semibold text-gray-700">
                            {subjectName}
                          </h3>
                          <span className="text-xs text-gray-400">
                            ({subjectGrades.length} ta baho)
                          </span>
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            subjectAvg >= 4.5
                              ? "text-green-600"
                              : subjectAvg >= 3.5
                                ? "text-blue-600"
                                : subjectAvg >= 2.5
                                  ? "text-yellow-600"
                                  : "text-red-600"
                          }`}
                        >
                          O&apos;rtacha: {subjectAvg.toFixed(2)}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                              <th className="px-5 py-2.5">Sana</th>
                              <th className="px-5 py-2.5">Baho</th>
                              <th className="px-5 py-2.5">Turi</th>
                              <th className="px-5 py-2.5 hidden md:table-cell">
                                Mavzu
                              </th>
                              <th className="px-5 py-2.5 hidden lg:table-cell">
                                O&apos;qituvchi
                              </th>
                              <th className="px-5 py-2.5 hidden lg:table-cell">
                                Izoh
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {subjectGrades.map((g) => (
                              <tr
                                key={g.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-5 py-2.5 text-gray-600 whitespace-nowrap">
                                  {new Date(g.gradeDate).toLocaleDateString(
                                    "uz-UZ"
                                  )}
                                </td>
                                <td className="px-5 py-2.5">
                                  <GradeBadge value={g.value} />
                                </td>
                                <td className="px-5 py-2.5 text-gray-600">
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium">
                                    {gradeTypeLabel(g.gradeType)}
                                  </span>
                                </td>
                                <td className="px-5 py-2.5 text-gray-600 hidden md:table-cell max-w-[200px] truncate">
                                  {g.topic || "—"}
                                </td>
                                <td className="px-5 py-2.5 text-gray-600 hidden lg:table-cell whitespace-nowrap">
                                  {g.teacher.fullName}
                                </td>
                                <td className="px-5 py-2.5 text-gray-400 hidden lg:table-cell max-w-[150px] truncate">
                                  {g.note || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className={`text-xl font-bold ${color} truncate`}>{value}</p>
    </div>
  );
}

function GradeBadge({ value }: { value: number }) {
  const color =
    value === 5
      ? "bg-green-500"
      : value === 4
        ? "bg-blue-500"
        : value === 3
          ? "bg-yellow-500"
          : value === 2
            ? "bg-orange-500"
            : "bg-red-500";

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-sm ${color}`}
    >
      {value}
    </span>
  );
}
