"use client";

export default function ParentAttendance() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-5">
          <svg
            className="w-10 h-10 text-teal-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-2">
          Davomat ma&apos;lumotlari
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Davomat ma&apos;lumotlari tez orada qo&apos;shiladi
        </p>

        <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
          <div className="flex items-center justify-center gap-2 text-teal-700">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">
              Ushbu bo&apos;lim hozircha ishlab chiqilmoqda
            </span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-2 h-2 rounded-full bg-teal-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
