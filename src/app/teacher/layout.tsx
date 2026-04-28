"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar, { type SidebarLink } from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

const teacherLinks: SidebarLink[] = [
  { href: "/teacher/dashboard", label: "Bosh sahifa", icon: "🏠" },
  { href: "/teacher/grades", label: "Kunlik baholar", icon: "📝" },
  { href: "/teacher/finals", label: "Chorak / Yillik", icon: "🎯" },
  { href: "/teacher/quarters", label: "Chorak vaqtlari", icon: "📅" },
  { href: "/teacher/students", label: "O'quvchilarim", icon: "👨‍🎓" },
];

function TeacherContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== "teacher"
    ) {
      router.push("/login");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "teacher") {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        links={teacherLinks}
        title="O'qituvchi"
        colorClass="bg-blue-700"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          title="O'qituvchi kabineti"
          userName={session.user.fullName}
          onLogout={() => signOut({ callbackUrl: "/login" })}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <TeacherContent>{children}</TeacherContent>
    </SessionProvider>
  );
}
