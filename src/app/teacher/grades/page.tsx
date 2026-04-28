"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

interface TeacherSubject {
  id: number;
  teacherId: number;
  subjectId: number;
  classId: number;
  subject: { id: number; name: string };
  class: { id: number; name: string };
}

interface Student {
  id: number;
  fullName: string;
  classId: number;
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
  student: { id: number; fullName: string };
  subject: { id: number; name: string };
  class: { id: number; name: string };
}

interface StudentGradeRow {
  studentId: number;
  studentName: string;
  value: string;
  gradeType: string;
  topic: string;
  note: string;
  saving: boolean;
  saved: boolean;
  error: string;
}

const gradeTypeOptions = [
  { value: "daily", label: "Kunlik" },
  { value: "control", label: "Nazorat" },
  { value: "homework", label: "Uy vazifasi" },
  { value: "exam", label: "Yakuniy" },
];

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

const gradeBgColors: Record<number, string> = {
  5: "bg-emerald-500",
  4: "bg-blue-500",
  3: "bg-amber-500",
  2: "bg-orange-500",
  1: "bg-red-500",
};

const quarterNames = ["I-chorak", "II-chorak", "III-chorak", "IV-chorak"];

export default function TeacherGrades() {
  const { data: session } = useSession();
  const teacherId = session?.user?.id;
  const isPrimary = session?.user?.isPrimary === true;

  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("1");
  const [students, setStudents] = useState<Student[]>([]);
  const [existingGrades, setExistingGrades] = useState<Grade[]>([]);
  const [rows, setRows] = useState<StudentGradeRow[]>([]);
  const [loadingTS, setLoadingTS] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!teacherId) return;
    setLoadingTS(true);
    fetch(`/api/teacher-subjects?teacherId=${teacherId}`)
      .then((r) => r.json())
      .then((data: TeacherSubject[]) => setTeacherSubjects(data))
      .catch(console.error)
      .finally(() => setLoadingTS(false));
  }, [teacherId]);

  const uniqueClasses = Array.from(
    new Map(
      teacherSubjects.map((ts) => [ts.class.id, ts.class])
    ).values()
  );

  const allSubjectsForClass = selectedClassId
    ? Array.from(
        new Map(
          teacherSubjects
            .filter((ts) => ts.classId === Number(selectedClassId))
            .map((ts) => [ts.subject.id, ts.subject])
        ).values()
      )
    : [];

  useEffect(() => {
    if (!isPrimary) setSelectedSubjectId("");
    else if (isPrimary && allSubjectsForClass.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(String(allSubjectsForClass[0].id));
    }
  }, [selectedClassId, isPrimary, allSubjectsForClass.length]);

  const fetchStudents = useCallback(async () => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/students?classId=${selectedClassId}`);
      const data: Student[] = await res.json();
      setStudents(data);
      setRows(
        data.map((s) => ({
          studentId: s.id,
          studentName: s.fullName,
          value: "",
          gradeType: "daily",
          topic: "",
          note: "",
          saving: false,
          saved: false,
          error: "",
        }))
      );
    } catch (err) {
      console.error("O'quvchilarni yuklashda xatolik:", err);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedClassId]);

  const fetchExistingGrades = useCallback(async () => {
    if (!selectedClassId || !teacherId) return;
    const subId = isPrimary ? selectedSubjectId : selectedSubjectId;
    if (!subId) return;
    setLoadingGrades(true);
    try {
      const params = new URLSearchParams({
        teacherId: String(teacherId),
        classId: selectedClassId,
        subjectId: subId,
        quarter: selectedQuarter,
      });
      const res = await fetch(`/api/grades?${params}`);
      const data: Grade[] = await res.json();
      const dailyOnly = (data || []).filter(
        (g) => g.gradeType !== "year" && g.gradeType !== "quarter"
      );
      setExistingGrades(dailyOnly);
    } catch (err) {
      console.error("Baholarni yuklashda xatolik:", err);
    } finally {
      setLoadingGrades(false);
    }
  }, [selectedClassId, selectedSubjectId, selectedQuarter, teacherId, isPrimary]);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
    } else {
      setStudents([]);
      setRows([]);
    }
  }, [selectedClassId, fetchStudents]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      fetchExistingGrades();
    } else {
      setExistingGrades([]);
    }
  }, [selectedClassId, selectedSubjectId, selectedQuarter, fetchExistingGrades]);

  const updateRow = (index: number, field: keyof StudentGradeRow, val: string) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, [field]: val, saved: false, error: "" } : r
      )
    );
  };

  const saveRow = async (index: number) => {
    const row = rows[index];
    const subjectId = isPrimary ? selectedSubjectId : selectedSubjectId;
    if (!row.value || !subjectId || !selectedClassId || !teacherId) return;

    const val = Number(row.value);
    if (val < 1 || val > 5) {
      setRows((prev) =>
        prev.map((r, i) =>
          i === index ? { ...r, error: "Baho 1-5 oralig'ida bo'lishi kerak" } : r
        )
      );
      return;
    }

    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, saving: true, error: "" } : r))
    );

    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: row.studentId,
          teacherId: Number(teacherId),
          subjectId: Number(subjectId),
          classId: Number(selectedClassId),
          gradeType: row.gradeType,
          topic: row.topic,
          value: val,
          quarter: Number(selectedQuarter),
          note: row.note,
          gradeDate: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Xatolik yuz berdi");
      }

      setRows((prev) =>
        prev.map((r, i) =>
          i === index
            ? { ...r, saving: false, saved: true, value: "", topic: "", note: "" }
            : r
        )
      );
      fetchExistingGrades();
    } catch (err) {
      setRows((prev) =>
        prev.map((r, i) =>
          i === index
            ? { ...r, saving: false, error: err instanceof Error ? err.message : "Xatolik" }
            : r
        )
      );
    }
  };

  const saveAll = async () => {
    const toSave = rows.filter((r) => r.value && Number(r.value) >= 1 && Number(r.value) <= 5);
    if (toSave.length === 0) return;

    setBulkSaving(true);
    setSuccessMessage("");

    let savedCount = 0;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].value && Number(rows[i].value) >= 1 && Number(rows[i].value) <= 5) {
        await saveRow(i);
        savedCount++;
      }
    }

    setBulkSaving(false);
    if (savedCount > 0) {
      setSuccessMessage(`${savedCount} ta baho muvaffaqiyatli saqlandi!`);
      setTimeout(() => setSuccessMessage(""), 4000);
    }
  };

  const isFormReady = isPrimary
    ? selectedClassId && selectedSubjectId && students.length > 0
    : selectedClassId && selectedSubjectId && students.length > 0;

  if (loadingTS) {
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
          <span className="text-3xl">📝</span> Baho qo&apos;yish
        </h1>
        <p className="mt-2 text-blue-100 text-sm lg:text-base">
          {isPrimary
            ? "Sinfni va fanni tanlang — barcha fanlar ro'yxatda"
            : "Sinf, fan va chorakni tanlang, keyin o'quvchilarga baho qo'ying"}
        </p>
        {isPrimary && (
          <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-white/20 rounded-full">
            Boshlang&apos;ich sinf o&apos;qituvchisi
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in stagger-1">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Parametrlarni tanlang
        </h2>
        <div className={`grid gap-4 ${isPrimary ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Sinf
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50 focus:bg-white transition-colors"
            >
              <option value="">Sinfni tanlang...</option>
              {uniqueClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject — for primary: all subjects shown as tabs/select */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Fan {isPrimary && <span className="text-blue-500">(barcha fanlar)</span>}
            </label>
            {isPrimary && allSubjectsForClass.length > 6 ? (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={!selectedClassId}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50 focus:bg-white transition-colors disabled:opacity-50"
              >
                <option value="">Fanni tanlang...</option>
                {allSubjectsForClass.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : isPrimary && allSubjectsForClass.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {allSubjectsForClass.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubjectId(String(s.id))}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedSubjectId === String(s.id)
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={!selectedClassId}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50 focus:bg-white transition-colors disabled:opacity-50"
              >
                <option value="">Fanni tanlang...</option>
                {allSubjectsForClass.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quarter */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Chorak
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(String(q))}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedQuarter === String(q)
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedClassId && selectedSubjectId && (
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl">
            <span>📌</span>
            <span>
              {uniqueClasses.find((c) => c.id === Number(selectedClassId))?.name} &middot;{" "}
              {allSubjectsForClass.find((s) => s.id === Number(selectedSubjectId))?.name} &middot;{" "}
              {quarterNames[Number(selectedQuarter) - 1]}
            </span>
          </div>
        )}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-xl flex items-center gap-2 animate-scale-in">
          <span className="text-lg">✅</span>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Student grade entry table */}
      {isFormReady && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in stagger-2">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Baho qo&apos;yish
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {students.length} ta o&apos;quvchi
              </p>
            </div>
            <button
              onClick={saveAll}
              disabled={bulkSaving || !rows.some((r) => r.value)}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200 flex items-center gap-2"
            >
              {bulkSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>💾 Barchasini saqlash</>
              )}
            </button>
          </div>

          {loadingStudents ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              <p>O&apos;quvchilar yuklanmoqda...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left font-medium w-8">#</th>
                    <th className="px-4 py-3 text-left font-medium">O&apos;quvchi</th>
                    <th className="px-4 py-3 text-center font-medium w-20">Baho</th>
                    <th className="px-4 py-3 text-left font-medium w-36">Turi</th>
                    <th className="px-4 py-3 text-left font-medium">Mavzu</th>
                    <th className="px-4 py-3 text-left font-medium">Izoh</th>
                    <th className="px-4 py-3 text-center font-medium w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row, i) => (
                    <tr
                      key={row.studentId}
                      className={`transition-colors ${
                        row.saved
                          ? "bg-emerald-50/50"
                          : row.error
                            ? "bg-red-50/50"
                            : "hover:bg-gray-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {row.studentName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button
                              key={v}
                              onClick={() => updateRow(i, "value", row.value === String(v) ? "" : String(v))}
                              className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                                row.value === String(v)
                                  ? `${gradeBgColors[v]} text-white shadow-md scale-110`
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.gradeType}
                          onChange={(e) => updateRow(i, "gradeType", e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs bg-gray-50 focus:bg-white"
                        >
                          {gradeTypeOptions.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.topic}
                          onChange={(e) => updateRow(i, "topic", e.target.value)}
                          placeholder="Mavzu..."
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs bg-gray-50 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) => updateRow(i, "note", e.target.value)}
                          placeholder="Izoh..."
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs bg-gray-50 focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.saved ? (
                          <span className="text-emerald-600 text-xs font-medium flex items-center justify-center gap-1">
                            ✅ Saqlandi
                          </span>
                        ) : row.error ? (
                          <span className="text-red-500 text-xs">{row.error}</span>
                        ) : (
                          <button
                            onClick={() => saveRow(i)}
                            disabled={!row.value || row.saving}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {row.saving ? (
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            ) : (
                              "Saqlash"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Existing grades table */}
      {selectedClassId && selectedSubjectId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in stagger-3">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Mavjud baholar
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {quarterNames[Number(selectedQuarter) - 1]} uchun qo&apos;yilgan baholar
            </p>
          </div>

          {loadingGrades ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              <p>Baholar yuklanmoqda...</p>
            </div>
          ) : existingGrades.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <span className="text-4xl block mb-3">📋</span>
              <p>Bu chorak uchun hali baho qo&apos;yilmagan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 text-left font-medium">O&apos;quvchi</th>
                    <th className="px-6 py-3 text-center font-medium">Baho</th>
                    <th className="px-6 py-3 text-left font-medium">Turi</th>
                    <th className="px-6 py-3 text-left font-medium">Mavzu</th>
                    <th className="px-6 py-3 text-left font-medium">Izoh</th>
                    <th className="px-6 py-3 text-left font-medium">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {existingGrades.map((g) => (
                    <tr
                      key={g.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {g.student.fullName}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ring-1 ${gradeColors[g.value] || "bg-gray-100 text-gray-600"}`}
                        >
                          {g.value}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {gradeTypeLabels[g.gradeType] || g.gradeType}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {g.topic || "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {g.note || "—"}
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
      )}

      {/* Empty state */}
      {!selectedClassId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in stagger-2">
          <span className="text-5xl block mb-4">👆</span>
          <h3 className="text-lg font-semibold text-gray-700">
            Avval sinf{!isPrimary && " va fan"}ni tanlang
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isPrimary
              ? "Sinfni tanlang — barcha fanlar avtomatik ko'rinadi"
              : "O'quvchilar ro'yxati va baho qo'yish formasini ko'rish uchun yuqoridagi parametrlarni tanlang"}
          </p>
        </div>
      )}
    </div>
  );
}
