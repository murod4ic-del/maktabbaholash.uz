"use client";

import { useEffect, useState } from "react";

interface School {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  _count?: {
    teachers: number;
    students: number;
    classes: number;
    subjects: number;
  };
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/schools");
      const data = await r.json();
      setSchools(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !code) {
      setError("Nom va kod kiriting");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code: code.toLowerCase().trim(), address, phone }),
      });
      if (!r.ok) {
        const j = await r.json();
        throw new Error(j.error || "Xatolik");
      }
      setName("");
      setCode("");
      setAddress("");
      setPhone("");
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const callBootstrap = async (school: School) => {
    if (!confirm(`${school.name} uchun demo ma'lumotlarni yaratish (sinflar, fanlar, demo o'qituvchi)?`)) return;
    const r = await fetch(`/api/bootstrap?school=${encodeURIComponent(school.code)}`);
    const j = await r.json();
    if (j.ok) {
      alert(
        `Demo ma'lumotlar tayyor!\n\nMaktab admini:\n  login: ${j.credentials.schoolAdmin.login}\n  parol: ${j.credentials.schoolAdmin.password}\n\nDemo o'qituvchi:\n  maktab kodi: ${school.code}\n  login: ${j.credentials.teacher.login}\n  parol: ${j.credentials.teacher.password}`
      );
      await load();
    } else {
      alert("Xatolik: " + (j.error || "noma'lum"));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-7 text-white shadow-xl">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span>🏛️</span> Maktablar
        </h1>
        <p className="mt-2 text-indigo-100">
          Tizimga qo&apos;shilgan maktablar ro&apos;yxati. Har bir maktab o&apos;z ma&apos;lumotlari va loginlari bilan butunlay ajratilgan.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow"
        >
          {showForm ? "Bekor qilish" : "+ Yangi maktab qo'shish"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <h2 className="text-base font-semibold text-gray-800">Yangi maktab</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="2-sonli maktab"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Kod * (lotin, kichik harf, qisqa)
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toLowerCase())}
                placeholder="maktab-2"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:bg-white"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Loginga qo&apos;shiladi. Misol: <code>maktab-2</code>, <code>school-namangan-12</code>
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Manzil</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Toshkent, Yunusobod 12-uy"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Telefon</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 71 ..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : schools.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <span className="text-5xl block mb-4">🏛️</span>
          <h3 className="text-lg font-semibold text-gray-700">Hali maktab qo&apos;shilmagan</h3>
          <p className="text-sm text-gray-500 mt-1">Tepadagi tugma orqali yangi maktab yarating</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schools.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{s.name}</h3>
                  <code className="text-xs text-indigo-600 font-mono">{s.code}</code>
                </div>
                <span className="text-2xl">🏛️</span>
              </div>
              {s.address && (
                <p className="mt-2 text-sm text-gray-600 truncate">📍 {s.address}</p>
              )}
              {s.phone && <p className="text-sm text-gray-600 truncate">📞 {s.phone}</p>}
              {s._count && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 text-blue-700 rounded-lg px-2 py-1.5">
                    👨‍🏫 {s._count.teachers} o&apos;qituvchi
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 rounded-lg px-2 py-1.5">
                    👨‍🎓 {s._count.students} o&apos;quvchi
                  </div>
                  <div className="bg-amber-50 text-amber-700 rounded-lg px-2 py-1.5">
                    🏫 {s._count.classes} sinf
                  </div>
                  <div className="bg-violet-50 text-violet-700 rounded-lg px-2 py-1.5">
                    📚 {s._count.subjects} fan
                  </div>
                </div>
              )}
              <button
                onClick={() => callBootstrap(s)}
                className="mt-3 w-full py-2 rounded-lg bg-gray-50 hover:bg-indigo-50 text-indigo-700 text-xs font-medium transition border border-gray-100"
              >
                Demo ma&apos;lumot yaratish (sinflar/fanlar/admin)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
