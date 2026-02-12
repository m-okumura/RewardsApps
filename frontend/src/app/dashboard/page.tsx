"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getReceipts, type Receipt } from "@/lib/api";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getReceipts()
        .then(setReceipts)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-emerald-700">ポイ活アプリ 管理画面</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">プロフィール</h2>
          <div className="bg-white p-4 rounded-lg shadow">
            <p><span className="text-slate-500">名前:</span> {user.name}</p>
            <p><span className="text-slate-500">メール:</span> {user.email}</p>
            <Link href="/dashboard/receipts/new" className="mt-4 inline-block text-emerald-600 hover:underline">
              レシートを登録する
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">登録レシート</h2>
          {loading ? (
            <p className="text-slate-500">読み込み中...</p>
          ) : receipts.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-slate-500">
              <p>まだレシートが登録されていません</p>
              <Link href="/dashboard/receipts/new" className="mt-2 inline-block text-emerald-600 hover:underline">
                レシートを登録する
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {receipts.map((r) => (
                <li key={r.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <p className="font-medium">{r.store_name || "店舗名なし"}</p>
                    <p className="text-sm text-slate-500">¥{r.amount.toLocaleString()} · {r.status}</p>
                  </div>
                  <Link href={`/dashboard/receipts/${r.id}`} className="text-emerald-600 text-sm hover:underline">
                    詳細
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
