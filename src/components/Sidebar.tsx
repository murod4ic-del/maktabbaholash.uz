"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SidebarLink {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  links: SidebarLink[];
  title: string;
  colorClass?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  links,
  title,
  colorClass = "bg-indigo-700",
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 ${colorClass} text-white
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col shadow-xl
        `}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/15">
          <span className="text-2xl">🏫</span>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <span className="text-lg flex-shrink-0">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/15">
          <p className="text-xs text-white/50">© 2026 MaktabBaholash</p>
        </div>
      </aside>
    </>
  );
}
