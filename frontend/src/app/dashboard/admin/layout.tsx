"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <h1 className="text-xl font-bold text-rose-600 mb-2">アクセス権限がありません</h1>
          <p className="text-slate-600 mb-4">管理者のみアクセスできます</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  const nav = [
    { href: "/dashboard/admin", label: "分析" },
    { href: "/dashboard/admin/users", label: "ユーザー管理" },
    { href: "/dashboard/admin/receipts", label: "レシート審査" },
    { href: "/dashboard/admin/campaigns", label: "キャンペーン管理" },
    { href: "/dashboard/admin/surveys", label: "アンケート管理" },
    { href: "/dashboard/admin/announcements", label: "お知らせ管理" },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-100 via-white to-emerald-50/30">
      <aside className="w-60 bg-slate-900 flex flex-col shadow-xl">
        <div className="p-5 border-b border-slate-700">
          <h1 className="font-bold text-white text-lg tracking-tight">管理画面</h1>
          <p className="text-emerald-400 text-xs mt-1 truncate" title={user.email}>
            {user.email}
          </p>
        </div>
        <nav className="flex-1 p-3 gap-1">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 rounded-lg mb-1 font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-700 space-y-1">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors"
          >
            ← 通常ダッシュボード
          </Link>
          <button
            onClick={logout}
            className="block w-full text-left px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-rose-400 text-sm transition-colors"
          >
            ログアウト
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
