"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import SignOutModal from "./SignOutModal";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/dashboard",           label: "Inicio",         icon: "⊞" },
  { href: "/dashboard/contracts", label: "Contratos",      icon: "⊟" },
  { href: "/dashboard/upload",    label: "Subir contrato", icon: "⊕" },
  { href: "/dashboard/analysis",  label: "Análisis",       icon: "◎" },
  { href: "/dashboard/chat",      label: "Chat IA",        icon: "⊡" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [showSignOut, setShowSignOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split("@")[0]
    || "Usuario";

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="flex items-center gap-2 mb-1">
            <Image src="/logo.jpg" alt="Suchus" width={26} height={26} className="rounded-full" style={{ objectFit: "cover" }} />
            <span className="sidebar-brand-name">
              Suchus
              <span className="mvp-badge">MVP</span>
            </span>
          </div>
          <span className="sidebar-brand-sub">Contract AI</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? "active" : ""}`}
            >
              <span style={{ fontSize: "13px", width: "16px", textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-avatar" />
            <div>
              <div className="user-name">{displayName.split(" ")[0]} {displayName.split(" ")[1]?.[0] ? `${displayName.split(" ")[1][0]}.` : ""}</div>
              <div className="user-role">Alumno / Dev</div>
            </div>
          </div>
          <button onClick={() => setShowSignOut(true)} className="sign-out-btn">
            <span>↩</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {showSignOut && <SignOutModal onClose={() => setShowSignOut(false)} />}
    </>
  );
}
