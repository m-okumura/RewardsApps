"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getReferralCode,
  getReferralHistory,
  type ReferralCode,
  type ReferralHistoryItem,
} from "@/lib/api";

export default function ReferralsPage() {
  const [code, setCode] = useState<ReferralCode | null>(null);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getReferralCode(), getReferralHistory()])
      .then(([c, h]) => {
        setCode(c);
        setHistory(h);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    if (code?.referral_code) {
      navigator.clipboard.writeText(code.referral_code);
      alert("紹介コードをコピーしました");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50/30">
        <p className="text-slate-700 font-medium">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50/30">
      <header className="bg-white shadow-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="font-medium text-emerald-600 hover:text-emerald-700">
            ← ダッシュボード
          </Link>
          <h1 className="text-xl font-bold text-emerald-700">友達紹介</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-6">
          <h2 className="text-lg font-bold mb-2 text-slate-800">あなたの紹介コード</h2>
          <p className="text-slate-700 mb-4">
            友達を招待して登録してもらうと、あなたに100pt、友達に50pt付与されます
          </p>
          <div className="flex items-center gap-4">
            <code className="text-2xl font-mono font-bold bg-emerald-50 text-slate-800 px-4 py-3 rounded-lg border-2 border-emerald-200">
              {code?.referral_code || "---"}
            </code>
            <button
              onClick={copyCode}
              className="px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-md"
            >
              コピー
            </button>
          </div>
          {code?.share_url && (
            <p className="mt-4 text-sm text-slate-700 font-medium">
              招待リンク: {code.share_url}
            </p>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3 text-slate-800">紹介履歴</h2>
          {history.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
              <p className="text-slate-700 font-medium">まだ紹介はありません</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {history.map((r) => (
                <li
                  key={r.id}
                  className="bg-white p-5 rounded-xl shadow-lg border border-slate-200 flex justify-between items-center"
                >
                  <span className="font-medium text-slate-800">ユーザーID: {r.referred_id}</span>
                  <span className="font-bold text-emerald-600">+{r.points_awarded}pt</span>
                  <span className="text-sm font-medium text-slate-600">
                    {new Date(r.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
