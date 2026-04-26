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
  value: number;
  gradeDate: string;
  gradeType: string;
  topic: string;
  subject: { id: number; name: string };
  teacher: { id: number; fullName: string };
}

interface ChildData {
  child: Child;
  grades: Grade[];
}

export default function ParentDashboard() {
  const { data: session } = useSession();
  const [childrenData, setChildrenData] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const childrenRes = await fetch("/api/parent-children");
        const childrenJson = await childrenRes.json();
        const children: Child[] = childrenJson.items || [];

        const results = await Promise.all(
          children.map(async (child) => {
            const res = await fetch(`/api/grades?studentId=${child.id}`);
            const grades: Grade[] = await res.json();
            return { child, grades };
          })
        );

        setChildrenData(results);
      } catch {
        console.error("Ma'lumotlarni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">
          Assalomu alaykum, {session?.user?.fullName}!
        </h1>
        <p className="mt-1 text-teal-100 text-sm">
          Farzandlaringiz o&apos;qish natijalari bilan tanishing
        </p>
      </div>

      {childrenData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
          <h3 className="text-lg font-semibold text-gray-700">
            Farzandlar topilmadi
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Sizga biriktirilgan o&apos;quvchilar mavjud emas
          </p>
        </div>
      ) : (
        childrenData.map(({ child, grades }) => (
          <ChildCard key={child.id} child={child} grades={grades} />
        ))
      )}
    </div>
  );
}

function ChildCard({ child, grades }: { child: Child; grades: Grade[] }) {
  const average = useMemo(() => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, g) => acc + g.value, 0);
    return sum / grades.length;
  }, [grades]);

  const lastFive = useMemo(
    () =>
      [...grades]
        .sort(
          (a, b) =>
            new Date(b.gradeDate).getTime() - new Date(a.gradeDate).getTime()
        )
        .slice(0, 5),
    [grades]
  );

  const chartData = useMemo(() => {
    const subjectMap: Record<string, number> = {};
    grades.forEach((g) => {
      subjectMap[g.subject.name] = (subjectMap[g.subject.name] || 0) + 1;
    });
    return Object.entries(subjectMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [grades]);

  const averageColor =
    average >= 4.5
      ? "text-green-600 bg-green-50 border-green-200"
      : average >= 3.5
        ? "text-blue-600 bg-blue-50 border-blue-200"
        : average >= 2.5
          ? "text-yellow-600 bg-yellow-50 border-yellow-200"
          : "text-red-600 bg-red-50 border-red-200";

  const averageBadgeBg =
    average >= 4.5
      ? "bg-green-500"
      : average >= 3.5
        ? "bg-blue-500"
        : average >= 2.5
          ? "bg-yellow-500"
          : "bg-red-500";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center text-lg font-bold text-teal-700">
            {child.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{child.fullName}</h2>
            <p className="text-sm text-gray-500">{child.class.name}</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${averageColor}`}
        >
          <span className="text-sm font-medium">O&apos;rtacha baho:</span>
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold text-lg ${averageBadgeBg}`}
          >
            {average > 0 ? average.toFixed(1) : "—"}
          </span>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            So&apos;nggi baholar
          </h3>
          {lastFive.length === 0 ? (
            <p className="text-sm text-gray-400">Baholar mavjud emas</p>
          ) : (
            <div className="space-y-2">
              {lastFive.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {g.subject.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(g.gradeDate).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                  <GradeBadge value={g.value} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            Fanlar bo&apos;yicha baholar soni
          </h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-400">Ma&apos;lumot mavjud emas</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} name="Baholar soni" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
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
