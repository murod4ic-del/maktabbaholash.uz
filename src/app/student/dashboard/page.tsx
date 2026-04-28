"use client";

import { useSession } from "next-auth/react";
import StudentProfileView from "@/components/StudentProfileView";

export default function StudentDashboard() {
  const { data: session } = useSession();
  const studentId = Number(session?.user?.id);

  if (!studentId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <StudentProfileView studentId={studentId} accent="indigo" />;
}
