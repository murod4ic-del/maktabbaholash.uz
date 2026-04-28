"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

interface QuarterCfg {
  id: number;
  quarter: number;
  startDate: string;
  endDate: string;
  subjectId: number | null;
  classId: number | null;
  schoolYear: string;
}

interface TeacherSubject {
  id: number;
  classId: number;
  subjectId: number;
  subject: { id: number; name: string };
  class: { id: number; name: string };
}

const quarterNames = ["I-chorak", "II-chorak", "III-chorak", "IV-chorak"];

function defaultQuarterDates(year: number): { start: string; end: string }[] {
  return [
    { start: `${year}-09-02`, end: `${year}-10-31` },
    { start: `${year}-11-08`, end: `${year}-12-28` },
    { start: `${year + 1}-01-09`, end: `${year + 1}-03-21` },
    { start: `${year + 1}-04-01`, end: `${year + 1}-05-30` },
  ];
}

function currentSchoolYear(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export default function TeacherQuartersPage() {
  const { data: session } = useSession();
  const teacherId = session?.user?.id;

  const [tsList, setTsList] = useState<TeacherSubject[]>([]);
  const [quarters, setQuarters] = useState<QuarterCfg[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [scopeMode, setScopeMode] = useState<"global" | "class" | "subject">("global");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const sy = currentSchoolYear();
  const baseYear = Number(sy.split("-")[0]);

  const loadAll = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const [ts, q] = await Promise.all([
        fetch(`/api/teacher-subjects?teacherId=${teacherId}`).then((r) => r.json()),
        fetch(`/api/quarters?teacherId=${teacherId}`).then((r) => r.json()),
      ]);
      setTsList(ts || []);
      setQuarters(q?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [teacherId]);

  const classes = useMemo(
    () => Array.from(new Map(tsList.map((t) => [t.classId, t.class])).values()),
    [tsList]
  );
  const subjectsForClass = useMemo(() => {
    if (!selectedClassId) return [];
    return Array.from(
      new Map(
        tsList.filter((t) => t.classId === Number(selectedClassId)).map((t) => [t.subjectId, t.subject])
      ).values()
    );
  }, [tsList, selectedClassId]);

  const filterScope = useMemo(() => {
    if (scopeMode === "global") return { classId: null as number | null, subjectId: null as number | null };
    if (scopeMode === "class")
      return {
        classId: selectedClassId ? Number(selectedClassId) : null,
        subjectId: null as number | null,
      };
    return {
      classId: selectedClassId ? Number(selectedClassId) : null,
      subjectId: selectedSubjectId ? Number(selectedSubjectId) : null,
    };
  }, [scopeMode, selectedClassId, selectedSubjectId]);

  const visibleQuarters = useMemo(() => {
    return quarters.filter(
      (q) =>
        (q.classId ?? null) === filterScope.classId &&
        (q.subjectId ?? null) === filterScope.subjectId
    );
  }, [quarters, filterScope]);

  const defaults = defaultQuarterDates(baseYear);

  const draft: Record<number, { start: string; end: string }> = {};
  for (let q = 1; q <= 4; q++) {
    const found = visibleQuarters.find((x) => x.quarter === q);
    draft[q] = {
      start: found ? found.startDate.slice(0, 10) : defaults[q - 1].start,
      end: found ? found.endDate.slice(0, 10) : defaults[q - 1].end,
    };
  }

  const [editDraft, setEditDraft] = useState(draft);
  useEffect(() => {
    setEditDraft(draft);
  }, [JSON.stringify(visibleQuarters), scopeMode, selectedClassId, selectedSubjectId]);

  const updateDraft = (q: number, field: "start" | "end", value: string) => {
    setEditDraft((prev) => ({ ...prev, [q]: { ...prev[q], [field]: value } }));
  };

  const saveQuarter = async (q: number) => {
    if (!teacherId) return;
    setSaving(q);
    setMessage("");
    try {
      const res = await fetch("/api/quarters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: Number(teacherId),
          subjectId: filterScope.subjectId,
          classId: filterScope.classId,
          quarter: q,
          startDate: editDraft[q].start,
          endDate: editDraft[q].end,
          schoolYear: sy,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Saqlashda xatolik");
      }
      setMessage(`${quarterNames[q - 1]} saqlandi ✓`);
      await loadAll();
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setSaving(null);
    }
  };

  const saveAll = async () => {
    if (!teacherId) return;
    setSaving(0);
    setMessage("");
    try {
      for (let q = 1; q <= 4; q++) {
        await fetch("/api/quarters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId: Number(teacherId),
            subjectId: filterScope.subjectId,
            classId: filterScope.classId,
            quarter: q,
            startDate: editDraft[q].start,
            endDate: editDraft[q].end,
            schoolYear: sy,
          }),
        });
      }
      setMessage("Barcha choraklar saqlandi ✓");
      await loadAll();
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span>📅</span> Chorak vaqtlarini sozlash
        </h1>
        <p className="mt-2 text-orange-50">
          O&apos;quv yili: <strong>{sy}</strong>. Choraklar boshlanish va tugash sanalarini o&apos;zingiz belgilaysiz.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Qaerga qo&apos;llash kerak?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {(
            [
              { v: "global", label: "Barcha sinflar va fanlar uchun (umumiy)", icon: "🌐" },
              { v: "class", label: "Faqat tanlangan sinf uchun", icon: "🏫" },
              { v: "subject", label: "Faqat tanlangan sinf + fan uchun", icon: "📚" },
            ] as const
          ).map((m) => (
            <button
              key={m.v}
              onClick={() => setScopeMode(m.v)}
              className={`px-4 py-3 rounded-xl text-sm font-medium border transition text-left ${
                scopeMode === m.v
                  ? "border-orange-500 bg-orange-50 text-orange-700 shadow"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {scopeMode !== "global" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSubjectId("");
              }}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:bg-white"
            >
              <option value="">Sinfni tanlang...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {scopeMode === "subject" && (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={!selectedClassId}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:bg-white disabled:opacity-50"
              >
                <option value="">Fanni tanlang...</option>
                {subjectsForClass.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-xl flex items-center gap-2 animate-scale-in">
          <span className="text-lg">✅</span>
          <span className="font-medium">{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((q) => {
          const inToday =
            new Date(editDraft[q].start) <= new Date() &&
            new Date(editDraft[q].end) >= new Date();
          return (
            <div
              key={q}
              className={`bg-white rounded-2xl border p-5 ${
                inToday ? "border-emerald-300 shadow-md" : "border-gray-100 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold ${
                      ["bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"][q - 1]
                    }`}
                  >
                    {q}
                  </span>
                  {quarterNames[q - 1]}
                </h3>
                {inToday && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                    Hozirgi chorak
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Boshlanish</label>
                  <input
                    type="date"
                    value={editDraft[q].start}
                    onChange={(e) => updateDraft(q, "start", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tugash</label>
                  <input
                    type="date"
                    value={editDraft[q].end}
                    onChange={(e) => updateDraft(q, "end", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              <button
                onClick={() => saveQuarter(q)}
                disabled={saving !== null}
                className="mt-4 w-full py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50"
              >
                {saving === q ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-end">
        <button
          onClick={saveAll}
          disabled={saving !== null}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow"
        >
          {saving === 0 ? "Saqlanmoqda..." : "💾 Hammasini saqlash"}
        </button>
      </div>
    </div>
  );
}
