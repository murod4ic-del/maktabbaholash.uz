"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Grade {
  id: number;
  value: number;
  gradeType: string;
  topic: string;
  gradeDate: string;
  student: { id: number; fullName: string };
  subject: { id: number; name: string };
  class: { id: number; name: string };
}

const gradeTypeLabels: Record<string, string> = {
  daily: "Kunlik",
  control: "Nazorat",
  homework: "Uy vazifasi",
  exam: "Yakuniy",
};

const gradeColors: Record<number, string> = {
  5: "bg-emerald-100 text-emerald-700 ring-emerald-500/20",
  4: "bg-blue-100 text-blue-700 ring-blue-500/20",
  3: "bg-amber-100 text-amber-700 ring-amber-500/20",
  2: "bg-orange-100 text-orange-700 ring-orange-500/20",
  1: "bg-red-100 text-red-700 ring-red-500/20",
};

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [classCount, setClassCount] = useState(0);

  const teacherId = session?.user?.id;
  const teacherName = session?.user?.fullName || "O'qituvchi";

  useEffect(() => {
    if (!teacherId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [gradesRes, tsRes] = await Promise.all([
          fetch(`/api/grades?teacherId=${teacherId}`),
          fetch(`/api/teacher-subjects?teacherId=${teacherId}`),
        ]);

        const gradesData: Grade[] = await gradesRes.json();
        const tsData = await tsRes.json();

        setGrades(gradesData);

        const uniqueClasses = new Set(
          (tsData as { classId?: number; class?: { id: number } }[]).map(
            (ts) => ts.classId ?? ts.class?.id
          )
        );
        setClassCount(uniqueClasses.size);
      } catch (err) {
        console.error("Ma'lumotlarni yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherId]);

  const today = new Date().toISOString().split("T")[0];
  const todayGrades = grades.filter(
    (g) => g.gradeDate?.split("T")[0] === today
  );
  const avgGrade =
    grades.length > 0
      ? (grades.reduce((sum, g) => sum + g.value, 0) / grades.length).toFixed(1)
      : "—";

  const recentGrades = grades.slice(0, 10);

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
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 lg:p-8 text-white shadow-lg">
        <h1 className="text-2xl lg:text-3xl font-bold">
          Xush kelibsiz, {teacherName}!
        </h1>
        <p className="mt-2 text-blue-100 text-sm lg:text-base">
          Bugungi sana: {new Date().toLocaleDateString("uz-UZ", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon="📝"
          label="Bugun qo'yilgan baholar"
          value={todayGrades.length}
          color="bg-blue-50 text-blue-600"
          delay="stagger-1"
        />
        <StatCard
          icon="📊"
          label="O'rtacha baho"
          value={avgGrade}
          color="bg-emerald-50 text-emerald-600"
          delay="stagger-2"
        />
        <StatCard
          icon="🏫"
          label="Sinflar soni"
          value={classCount}
          color="bg-purple-50 text-purple-600"
          delay="stagger-3"
        />
      </div>

      {/* Recent grades */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in stagger-4">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            So'nggi qo'yilgan baholar
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Oxirgi 10 ta baho</p>
        </div>

        {recentGrades.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <span className="text-4xl block mb-3">📋</span>
            <p>Hozircha baholar yo'q</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-medium">O'quvchi</th>
                  <th className="px-6 py-3 text-left font-medium">Fan</th>
                  <th className="px-6 py-3 text-center font-medium">Baho</th>
                  <th className="px-6 py-3 text-left font-medium">Turi</th>
                  <th className="px-6 py-3 text-left font-medium">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentGrades.map((g) => (
                  <tr
                    key={g.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {g.student.fullName}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {g.subject.name}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ring-1 ${gradeColors[g.value] || "bg-gray-100 text-gray-600"}`}
                      >
                        {g.value}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {gradeTypeLabels[g.gradeType] || g.gradeType}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(g.gradeDate).toLocaleDateString("uz-UZ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  delay: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-fade-in ${delay}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
