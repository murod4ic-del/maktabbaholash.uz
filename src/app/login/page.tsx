"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

type Role = "admin" | "teacher" | "parent" | "student";

const roles: { value: Role; label: string; icon: string }[] = [
  { value: "student", label: "O'quvchi", icon: "🎒" },
  { value: "teacher", label: "O'qituvchi", icon: "📚" },
  { value: "parent", label: "Ota-ona", icon: "👨‍👩‍👧" },
  { value: "admin", label: "Admin", icon: "🛡️" },
];

const dashboardRoutes: Record<Role, string> = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  parent: "/parent/dashboard",
  student: "/student/dashboard",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as Role) || "student";
  const initialLogin = searchParams.get("login") || "";
  const [role, setRole] = useState<Role>(
    roles.some((r) => r.value === initialRole) ? initialRole : "student"
  );
  const [login, setLogin] = useState(initialLogin);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialLogin) {
      const pwInput = document.getElementById("password") as HTMLInputElement;
      if (pwInput) pwInput.focus();
    }
  }, [initialLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!login.trim() || !password.trim()) {
      setError("Login va parolni kiriting");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        login: login.trim(),
        password,
        role,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push(dashboardRoutes[role]);
      }
    } catch {
      setError("Tizimda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-4xl mb-3 block">🏫</span>
            <h1 className="text-2xl font-bold text-gray-900">
              MaktabBaholash
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Tizimga kirish
            </p>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Role Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => {
                  setRole(r.value);
                  setError("");
                }}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg
                  text-sm font-medium transition-all duration-200 cursor-pointer
                  ${
                    role === r.value
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                <span className="text-base">{r.icon}</span>
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="login"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Login
              </label>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Loginni kiriting"
                autoComplete="username"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:border-indigo-400 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Parol
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolni kiriting"
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:bg-white focus:border-indigo-400 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 animate-fade-in">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Kirish...
                </span>
              ) : (
                "Kirish"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 MaktabBaholash — maktabbaholash.uz
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yuklanmoqda...</div>}>
      <LoginForm />
    </Suspense>
  );
}
