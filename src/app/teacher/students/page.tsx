"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

interface TeacherSubject {
  id: number;
  classId: number;
  subject: { id: number; name: string };
  class: { id: number; name: string };
}

interface Student {
  id: number;
  fullName: string;
  classId: number;
  photoUrl?: string | null;
  class: { id: number; name: string };
}

interface Grade {
  id: number;
  value: number;
  gradeType: string;
  topic: string;
  note: string;
  quarter: number;
  gradeDate: string;
  subject: { id: number; name: string };
  class: { id: number; name: string };
  student: { id: number; fullName: string };
}

const gradeColors: Record<number, string> = {
  5: "bg-emerald-100 text-emerald-700 ring-emerald-500/20",
  4: "bg-blue-100 text-blue-700 ring-blue-500/20",
  3: "bg-amber-100 text-amber-700 ring-amber-500/20",
  2: "bg-orange-100 text-orange-700 ring-orange-500/20",
  1: "bg-red-100 text-red-700 ring-red-500/20",
};

const gradeTypeLabels: Record<string, string> = {
  daily: "Kunlik",
  control: "Nazorat",
  homework: "Uy vazifasi",
  exam: "Yakuniy",
};

export default function TeacherStudents() {
  const { data: session } = useSession();
  const teacherId = session?.user?.id;

  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);
    fetch(`/api/teacher-subjects?teacherId=${teacherId}`)
      .then((r) => r.json())
      .then((data: TeacherSubject[]) => setTeacherSubjects(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [teacherId]);

  const uniqueClasses = Array.from(
    new Map(
      teacherSubjects.map((ts) => [ts.class.id, ts.class])
    ).values()
  );

  const fetchStudents = useCallback(async (classId: string) => {
    if (!classId) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/students?classId=${classId}`);
      const data: Student[] = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("O'quvchilarni yuklashda xatolik:", err);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
    } else {
      const allClassIds = uniqueClasses.map((c) => c.id);
      if (allClassIds.length > 0) {
        Promise.all(
          allClassIds.map((cId) =>
            fetch(`/api/students?classId=${cId}`).then((r) => r.json())
          )
        )
          .then((results: Student[][]) => {
            const allStudents = results.flat();
            const unique = Array.from(
              new Map(allStudents.map((s) => [s.id, s])).values()
            );
            unique.sort((a, b) => a.fullName.localeCompare(b.fullName));
            setStudents(unique);
          })
          .catch(console.error);
      }
    }
    setSelectedStudent(null);
    setStudentGrades([]);
  }, [selectedClassId, fetchStudents, uniqueClasses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const openStudentDetail = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingGrades(true);
    try {
      const params = new URLSearchParams({
        studentId: String(student.id),
        teacherId: String(teacherId),
      });
      const res = await fetch(`/api/grades?${params}`);
      const data: Grade[] = await res.json();
      setStudentGrades(data);
    } catch (err) {
      console.error("Baholarni yuklashda xatolik:", err);
    } finally {
      setLoadingGrades(false);
    }
  };

  const gradesByQuarter = [1, 2, 3, 4].map((q) => ({
    quarter: q,
    grades: studentGrades.filter((g) => g.quarter === q),
  }));

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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 lg:p-8 text-white shadow-lg">
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <span className="text-3xl">👨‍🎓</span> O'quvchilarim
        </h1>
        <p className="mt-2 text-blue-100 text-sm lg:text-base">
          O'quvchilar ro'yxati va ularning baholari
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Student List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filter */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-fade-in stagger-1">
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Sinfni tanlang
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50 focus:bg-white transition-colors"
            >
              <option value="">Barcha sinflar</option>
              {uniqueClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Student list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in stagger-2">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">
                O'quvchilar ({students.length})
              </h2>
            </div>

            {loadingStudents ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Yuklanmoqda...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <span className="text-3xl block mb-2">👤</span>
                <p className="text-xs">O'quvchilar topilmadi</p>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-380px)] overflow-y-auto divide-y divide-gray-50">
                {students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openStudentDetail(s)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      selectedStudent?.id === s.id
                        ? "bg-blue-50 border-l-3 border-l-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {s.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photoUrl}
                        alt={s.fullName}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                          selectedStudent?.id === s.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {s.fullName}
                      </p>
                      <p className="text-xs text-gray-400">{s.class.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Student Detail */}
        <div className="lg:col-span-2">
          {!selectedStudent ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in stagger-3">
              <span className="text-5xl block mb-4">👈</span>
              <h3 className="text-lg font-semibold text-gray-700">
                O'quvchini tanlang
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Baholar tarixini ko'rish uchun chap tomondan o'quvchini tanlang
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Student info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-4">
                  {selectedStudent.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedStudent.photoUrl}
                      alt={selectedStudent.fullName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                      {selectedStudent.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedStudent.fullName}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedStudent.class.name}
                    </p>
                  </div>
                  {studentGrades.length > 0 && (
                    <div className="ml-auto text-right">
                      <p className="text-sm text-gray-500">O'rtacha baho</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(
                          studentGrades.reduce((s, g) => s + g.value, 0) /
                          studentGrades.length
                        ).toFixed(1)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Grades by quarter */}
              {loadingGrades ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center text-gray-400">
                  <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                  <p>Baholar yuklanmoqda...</p>
                </div>
              ) : studentGrades.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center text-gray-400">
                  <span className="text-4xl block mb-3">📋</span>
                  <p>Bu o'quvchi uchun baholar topilmadi</p>
                </div>
              ) : (
                <>
                  {/* Grade summary badges */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">
                      Baholar taqsimoti
                    </h3>
                    <div className="flex gap-3 flex-wrap">
                      {[5, 4, 3, 2, 1].map((v) => {
                        const count = studentGrades.filter(
                          (g) => g.value === v
                        ).length;
                        return (
                          <div
                            key={v}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl ring-1 ${gradeColors[v]}`}
                          >
                            <span className="text-lg font-bold">{v}</span>
                            <span className="text-xs font-medium opacity-75">
                              {count} ta
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grades table by quarter */}
                  {gradesByQuarter
                    .filter((q) => q.grades.length > 0)
                    .map((q) => (
                      <div
                        key={q.quarter}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-700">
                            {["I", "II", "III", "IV"][q.quarter - 1]}-chorak
                          </h3>
                          <span className="text-xs text-gray-400">
                            {q.grades.length} ta baho &middot; O'rtacha:{" "}
                            {(
                              q.grades.reduce((s, g) => s + g.value, 0) /
                              q.grades.length
                            ).toFixed(1)}
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-500 text-xs uppercase tracking-wider">
                                <th className="px-5 py-2.5 text-left font-medium">
                                  Fan
                                </th>
                                <th className="px-5 py-2.5 text-center font-medium">
                                  Baho
                                </th>
                                <th className="px-5 py-2.5 text-left font-medium">
                                  Turi
                                </th>
                                <th className="px-5 py-2.5 text-left font-medium">
                                  Mavzu
                                </th>
                                <th className="px-5 py-2.5 text-left font-medium">
                                  Izoh
                                </th>
                                <th className="px-5 py-2.5 text-left font-medium">
                                  Sana
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {q.grades.map((g) => (
                                <tr
                                  key={g.id}
                                  className="hover:bg-gray-50/50 transition-colors"
                                >
                                  <td className="px-5 py-2.5 text-gray-700 font-medium">
                                    {g.subject.name}
                                  </td>
                                  <td className="px-5 py-2.5 text-center">
                                    <span
                                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ring-1 ${gradeColors[g.value] || "bg-gray-100 text-gray-600"}`}
                                    >
                                      {g.value}
                                    </span>
                                  </td>
                                  <td className="px-5 py-2.5">
                                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                      {gradeTypeLabels[g.gradeType] ||
                                        g.gradeType}
                                    </span>
                                  </td>
                                  <td className="px-5 py-2.5 text-gray-600 text-xs">
                                    {g.topic || "—"}
                                  </td>
                                  <td className="px-5 py-2.5 text-gray-600 text-xs">
                                    {g.note || "—"}
                                  </td>
                                  <td className="px-5 py-2.5 text-gray-500 text-xs">
                                    {new Date(g.gradeDate).toLocaleDateString(
                                      "uz-UZ"
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
