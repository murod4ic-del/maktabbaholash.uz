"use client";

interface NavbarProps {
  title: string;
  userName?: string;
  onLogout: () => void;
  onMenuToggle: () => void;
}

export default function Navbar({
  title,
  userName,
  onLogout,
  onMenuToggle,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Menyuni ochish"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {userName && (
            <span className="hidden sm:block text-sm text-gray-600 font-medium">
              👤 {userName}
            </span>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">Chiqish</span>
          </button>
        </div>
      </div>
    </header>
  );
}
