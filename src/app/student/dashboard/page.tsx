"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";

interface Grade {
  id: number;
  value: number;
  gradeDate: string;
  gradeType: string;
  topic: string;
  quarter: number;
  subject: { id: number; name: string };
  teacher: { id: number; fullName: string };
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGrades() {
      try {
        const res = await fetch("/api/student-grades");
        const data = await res.json();
        setGrades(data.grades || []);
      } catch {
        console.error("Baholarni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    }
    fetchGrades();
  }, []);

  const subjectGroups = useMemo(() => {
    const map: Record<string, Grade[]> = {};
    grades.forEach((g) => {
      const key = g.subject.name;
      if (!map[key]) map[key] = [];
      map[key].push(g);
    });
    return Object.entries(map)
      .map(([name, items]) => ({
        name,
        items: items.sort(
          (a, b) => new Date(b.gradeDate).getTime() - new Date(a.gradeDate).getTime()
        ),
        average: items.reduce((s, g) => s + g.value, 0) / items.length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [grades]);

  const overallAverage = useMemo(() => {
    if (grades.length === 0) return 0;
    return grades.reduce((s, g) => s + g.value, 0) / grades.length;
  }, [grades]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">
          Assalomu alaykum, {session?.user?.fullName}!
        </h1>
        <p className="mt-1 text-indigo-100 text-sm">
          Sizning baholaringiz va o&apos;quv natijalaringiz
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="bg-white/20 rounded-xl px-4 py-2">
            <span className="text-sm">Jami baholar: </span>
            <span className="font-bold text-lg">{grades.length}</span>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2">
            <span className="text-sm">O&apos;rtacha: </span>
            <span className="font-bold text-lg">
              {overallAverage > 0 ? overallAverage.toFixed(1) : "—"}
            </span>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2">
            <span className="text-sm">Fanlar: </span>
            <span className="font-bold text-lg">{subjectGroups.length}</span>
          </div>
        </div>
      </div>

      {subjectGroups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-700">
            Hali baholar mavjud emas
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            O&apos;qituvchilar baho qo&apos;yganda bu yerda ko&apos;rinadi
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectGroups.map((sg) => (
            <SubjectCard key={sg.name} name={sg.name} grades={sg.items} average={sg.average} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectCard({
  name,
  grades,
  average,
}: {
  name: string;
  grades: Grade[];
  average: number;
}) {
  const avgColor =
    average >= 4.5
      ? "bg-green-500"
      : average >= 3.5
        ? "bg-blue-500"
        : average >= 2.5
          ? "bg-yellow-500"
          : "bg-red-500";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{grades.length} ta baho</span>
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-sm ${avgColor}`}
          >
            {average.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {grades.slice(0, 20).map((g) => (
            <GradePill key={g.id} grade={g} />
          ))}
          {grades.length > 20 && (
            <span className="text-xs text-gray-400 self-center ml-1">
              +{grades.length - 20} ta
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GradePill({ grade }: { grade: Grade }) {
  const color =
    grade.value === 5
      ? "bg-green-100 text-green-700 border-green-200"
      : grade.value === 4
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : grade.value === 3
          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
          : grade.value === 2
            ? "bg-orange-100 text-orange-700 border-orange-200"
            : "bg-red-100 text-red-700 border-red-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold ${color}`}
      title={`${new Date(grade.gradeDate).toLocaleDateString("uz-UZ")}${grade.topic ? ` — ${grade.topic}` : ""}`}
    >
      {grade.value}
    </span>
  );
}
