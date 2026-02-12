"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadReceipt } from "@/lib/api";

export default function NewReceiptPage() {
  const [image, setImage] = useState<File | null>(null);
  const [storeName, setStoreName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError("画像を選択してください");
      return;
    }
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt < 0) {
      setError("金額を正しく入力してください");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await uploadReceipt(image, storeName, amt);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-emerald-600 hover:underline">← ダッシュボードに戻る</Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">レシート登録</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">レシート画像</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              required
              className="w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">店舗名</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              placeholder="例: コンビニエンスストア"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">合計金額（円）</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              placeholder="1000"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "登録中..." : "登録する"}
          </button>
        </form>
      </main>
    </div>
  );
}
