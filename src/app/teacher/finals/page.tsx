"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface TeacherSubject {
  id: number;
  classId: number;
  subjectId: number;
  subject: { id: number; name: string };
  class: { id: number; name: string };
}

interface Student {
  id: number;
  fullName: string;
}

interface Grade {
  id: number;
  value: number;
  gradeType: string;
  quarter: number;
  studentId: number;
  subjectId: number;
}

const quarterNames = ["I-chorak", "II-chorak", "III-chorak", "IV-chorak"];

const gradeBgColors: Record<number, string> = {
  5: "bg-emerald-500",
  4: "bg-blue-500",
  3: "bg-amber-500",
  2: "bg-orange-500",
  1: "bg-red-500",
};

export default function TeacherFinalsPage() {
  const { data: session } = useSession();
  const teacherId = session?.user?.id;

  const [tsList, setTsList] = useState<TeacherSubject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [mode, setMode] = useState<"quarter" | "year">("quarter");
  const [quarter, setQuarter] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);
    fetch(`/api/teacher-subjects?teacherId=${teacherId}`)
      .then((r) => r.json())
      .then((data: TeacherSubject[]) => setTsList(data || []))
      .finally(() => setLoading(false));
  }, [teacherId]);

  const classes = useMemo(
    () => Array.from(new Map(tsList.map((t) => [t.classId, t.class])).values()),
    [tsList]
  );
  const subjects = useMemo(() => {
    if (!classId) return [];
    return Array.from(
      new Map(
        tsList.filter((t) => t.classId === Number(classId)).map((t) => [t.subjectId, t.subject])
      ).values()
    );
  }, [tsList, classId]);

  const loadStudents = useCallback(async () => {
    if (!classId) return setStudents([]);
    const r = await fetch(`/api/students?classId=${classId}`);
    const data: Student[] = await r.json();
    setStudents(data || []);
  }, [classId]);

  const loadGrades = useCallback(async () => {
    if (!classId || !subjectId || !teacherId) return setGrades([]);
    const params = new URLSearchParams({
      teacherId: String(teacherId),
      classId,
      subjectId,
      gradeType: mode,
    });
    if (mode === "quarter") params.set("quarter", quarter);
    const r = await fetch(`/api/grades?${params}`);
    const data: Grade[] = await r.json();
    setGrades(data || []);
  }, [classId, subjectId, teacherId, mode, quarter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  useEffect(() => {
    const next: Record<number, string> = {};
    for (const s of students) {
      const g = grades.find((x) => x.studentId === s.id);
      next[s.id] = g ? String(g.value) : "";
    }
    setDraft(next);
  }, [JSON.stringify(students.map((s) => s.id)), JSON.stringify(grades)]);

  const setStudentGrade = (studentId: number, value: string) => {
    setDraft((prev) => ({ ...prev, [studentId]: value }));
  };

  const saveOne = async (studentId: number) => {
    const value = draft[studentId];
    if (!value || !subjectId || !classId || !teacherId) return;
    setSaving((p) => ({ ...p, [studentId]: true }));
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          teacherId: Number(teacherId),
          subjectId: Number(subjectId),
          classId: Number(classId),
          gradeType: mode,
          quarter: Number(mode === "quarter" ? quarter : 4),
          value: Number(value),
          replace: true,
          gradeDate: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Xatolik");
      }
      setMessage(`Saqlandi ✓`);
      setTimeout(() => setMessage(""), 2000);
      await loadGrades();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setSaving((p) => ({ ...p, [studentId]: false }));
    }
  };

  const saveAll = async () => {
    const targets = students.filter((s) => draft[s.id] && Number(draft[s.id]) >= 1);
    setMessage(`${targets.length} ta o'quvchi uchun saqlanmoqda...`);
    for (const s of targets) {
      await saveOne(s.id);
    }
    setMessage(`${targets.length} ta baho saqlandi ✓`);
    setTimeout(() => setMessage(""), 3500);
  };

  const computeAvgFor = useCallback(
    async (studentId: number): Promise<number | null> => {
      if (!subjectId) return null;
      try {
        const params = new URLSearchParams({
          studentId: String(studentId),
          subjectId,
        });
        if (mode === "quarter") params.set("quarter", quarter);
        const r = await fetch(`/api/grades?${params}`);
        const list: { value: number; gradeType: string }[] = await r.json();
        const everyday = list.filter((g) => g.gradeType !== "year" && g.gradeType !== "quarter");
        if (everyday.length === 0) return null;
        const sum = everyday.reduce((s, g) => s + g.value, 0);
        return Number((sum / everyday.length).toFixed(2));
      } catch {
        return null;
      }
    },
    [subjectId, mode, quarter]
  );

  const [averages, setAverages] = useState<Record<number, number | null>>({});
  useEffect(() => {
    if (!students.length || !subjectId) {
      setAverages({});
      return;
    }
    let cancelled = false;
    (async () => {
      const next: Record<number, number | null> = {};
      for (const s of students) {
        next[s.id] = await computeAvgFor(s.id);
        if (cancelled) return;
      }
      if (!cancelled) setAverages(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [students, computeAvgFor, subjectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const ready = classId && subjectId && students.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span>🎯</span> Chorak / Yillik baholar
        </h1>
        <p className="mt-2 text-emerald-50">
          O&apos;quvchilarning chorak yoki yillik yakuniy bahosini qo&apos;ying. Avtomatik o&apos;rtacha tavsiya qilinadi.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { v: "quarter", label: "Chorak yakuniy", icon: "📊" },
            { v: "year", label: "Yillik yakuniy", icon: "🏆" },
          ].map((m) => (
            <button
              key={m.v}
              onClick={() => setMode(m.v as "quarter" | "year")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                mode === m.v
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="mr-1.5">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sinf</label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSubjectId("");
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:bg-white"
            >
              <option value="">Sinfni tanlang...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fan</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={!classId}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:bg-white disabled:opacity-50"
            >
              <option value="">Fanni tanlang...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {mode === "quarter" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chorak</label>
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuarter(String(q))}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      quarter === String(q)
                        ? "bg-emerald-600 text-white shadow"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {ready && (
          <div className="flex items-center justify-between bg-emerald-50 px-4 py-2.5 rounded-xl">
            <span className="text-sm text-emerald-800">
              {classes.find((c) => c.id === Number(classId))?.name} ·{" "}
              {subjects.find((s) => s.id === Number(subjectId))?.name} ·{" "}
              {mode === "quarter" ? quarterNames[Number(quarter) - 1] : "Yillik"}
            </span>
            <button
              onClick={saveAll}
              disabled={Object.values(saving).some(Boolean)}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow"
            >
              💾 Hammasini saqlash
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-xl">
          {message}
        </div>
      )}

      {ready ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-8">#</th>
                <th className="px-4 py-3 text-left">O&apos;quvchi</th>
                <th className="px-4 py-3 text-center">O&apos;rtacha</th>
                <th className="px-4 py-3 text-center">Yakuniy baho</th>
                <th className="px-4 py-3 text-center w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s, i) => {
                const avg = averages[s.id];
                const recommended = avg !== null && avg !== undefined ? Math.round(avg) : null;
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {s.fullName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {avg ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`inline-block w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center ${
                              gradeBgColors[recommended || 1]
                            }`}
                          >
                            {avg.toFixed(1)}
                          </span>
                          {recommended && (
                            <button
                              onClick={() => setStudentGrade(s.id, String(recommended))}
                              className="text-[11px] text-blue-600 hover:underline"
                              title="O'rtacha bo'yicha tavsiya"
                            >
                              → {recommended}
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <button
                            key={v}
                            onClick={() =>
                              setStudentGrade(s.id, draft[s.id] === String(v) ? "" : String(v))
                            }
                            className={`w-9 h-9 rounded-full text-sm font-bold transition ${
                              draft[s.id] === String(v)
                                ? `${gradeBgColors[v]} text-white shadow scale-110`
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => saveOne(s.id)}
                        disabled={!draft[s.id] || saving[s.id]}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-40"
                      >
                        {saving[s.id] ? "..." : "Saqlash"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <span className="text-5xl block mb-4">👆</span>
          <h3 className="text-lg font-semibold text-gray-700">Sinf va fanni tanlang</h3>
          <p className="text-sm text-gray-500 mt-1">
            O&apos;quvchilar ro&apos;yxati va yakuniy baho qo&apos;yish jadvali shu yerda paydo bo&apos;ladi.
          </p>
        </div>
      )}
    </div>
  );
}
