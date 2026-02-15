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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50/30">
        <div className="animate-pulse text-slate-700 font-medium">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50/30">
      <header className="bg-white shadow-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-emerald-700">ポイ活アプリ 管理画面</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-800">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm font-medium text-slate-700 hover:text-rose-600 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-slate-800">プロフィール</h2>
          <div className="bg-white p-5 rounded-xl shadow-lg border border-slate-200">
            <p className="text-slate-800"><span className="font-semibold text-slate-600">名前:</span> <span className="font-medium">{user.name}</span></p>
            <p className="text-slate-800 mt-1"><span className="font-semibold text-slate-600">メール:</span> <span className="font-medium">{user.email}</span></p>
            <Link href="/dashboard/receipts/new" className="mt-4 inline-block px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors">
              レシートを登録する
            </Link>
          </div>
        </section>

        {user.is_admin && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3 text-slate-800">管理者メニュー</h2>
            <Link
              href="/dashboard/admin"
              className="block p-5 bg-amber-100 border-2 border-amber-300 rounded-xl shadow-md hover:bg-amber-200 hover:border-amber-400 transition-colors"
            >
              <span className="text-amber-900 font-bold">🔧 管理画面</span>
              <span className="text-amber-800 font-medium">（分析・ユーザー・レシート審査・キャンペーン・お知らせ）</span>
            </Link>
          </section>
        )}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-slate-800">Phase 3 機能</h2>
          <div className="grid gap-3">
            <Link
              href="/dashboard/referrals"
              className="block p-5 bg-white rounded-xl shadow-lg border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all"
            >
              <span className="font-semibold text-slate-800">友達紹介</span>
            </Link>
            <Link
              href="/dashboard/campaigns"
              className="block p-5 bg-white rounded-xl shadow-lg border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all"
            >
              <span className="font-semibold text-slate-800">キャンペーン</span>
            </Link>
            <Link
              href="/dashboard/shopping"
              className="block p-5 bg-white rounded-xl shadow-lg border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all"
            >
              <span className="font-semibold text-slate-800">ショッピング（EC購入トラッキング）</span>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3 text-slate-800">登録レシート</h2>
          {loading ? (
            <p className="text-slate-700 font-medium">読み込み中...</p>
          ) : receipts.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
              <p className="text-slate-700 font-medium">まだレシートが登録されていません</p>
              <Link href="/dashboard/receipts/new" className="mt-4 inline-block px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors">
                レシートを登録する
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {receipts.map((r) => (
                <li key={r.id} className="bg-white p-5 rounded-xl shadow-lg border border-slate-200 flex justify-between items-center hover:border-emerald-200 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-800">{r.store_name || "店舗名なし"}</p>
                    <p className="text-sm font-medium text-slate-600 mt-0.5">¥{r.amount.toLocaleString()} · {r.status}</p>
                  </div>
                  <Link href={`/dashboard/receipts/${r.id}`} className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
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
