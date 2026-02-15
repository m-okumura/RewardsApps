"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getShoppingHistory,
  trackPurchase,
  type ShoppingTrack,
} from "@/lib/api";

export default function ShoppingPage() {
  const [history, setHistory] = useState<ShoppingTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    getShoppingHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim()) return;
    setSubmitting(true);
    try {
      await trackPurchase(
        merchant.trim(),
        orderId.trim() || undefined,
        amount ? parseInt(amount, 10) : undefined
      );
      setMerchant("");
      setOrderId("");
      setAmount("");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50/30">
      <header className="bg-white shadow-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="font-medium text-emerald-600 hover:text-emerald-700">
            ← ダッシュボード
          </Link>
          <h1 className="text-xl font-bold text-emerald-700">ショッピング</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-6">
          <h2 className="text-lg font-bold mb-3 text-slate-800">購入を登録</h2>
          <p className="text-slate-700 mb-4">
            提携ECで購入した場合、ここで登録するとキャッシュバック対象となります
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">販売元</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                required
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                placeholder="例: ONEモール"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">注文ID（任意）</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                placeholder="注文番号"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">購入金額（任意）</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                placeholder="円"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-md"
            >
              {submitting ? "登録中..." : "登録"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3 text-slate-800">登録履歴</h2>
          {loading ? (
            <p className="text-slate-700 font-medium">読み込み中...</p>
          ) : history.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
              <p className="text-slate-700 font-medium">まだ登録がありません</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {history.map((t) => (
                <li
                  key={t.id}
                  className="bg-white p-5 rounded-xl shadow-lg border border-slate-200 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{t.merchant}</p>
                    {t.order_id && (
                      <p className="text-sm font-medium text-slate-600">{t.order_id}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {t.amount != null && (
                      <p className="font-bold text-emerald-600">¥{t.amount.toLocaleString()}</p>
                    )}
                    <p className="text-xs font-medium text-slate-600">{t.status}</p>
                    <p className="text-xs font-medium text-slate-600">
                      {new Date(t.tracked_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
