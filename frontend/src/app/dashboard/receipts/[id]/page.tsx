"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getReceipt, type Receipt } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReceipt(id)
      .then(setReceipt)
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50/30">
      <p className="text-slate-700 font-medium">読み込み中...</p>
    </div>
  );
  if (!receipt) return null;

  const imageUrl = receipt.image_url.startsWith("http") ? receipt.image_url : `${API_BASE.replace("/api/v1", "")}${receipt.image_url}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50/30">
      <header className="bg-white shadow-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="font-medium text-emerald-600 hover:text-emerald-700">← ダッシュボードに戻る</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h1 className="text-xl font-bold mb-4 text-slate-800">レシート詳細</h1>
          <div className="space-y-4">
            <div>
              <p className="text-slate-600 text-sm font-semibold mb-0.5">店舗名</p>
              <p className="font-medium text-slate-800">{receipt.store_name || "-"}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-semibold mb-0.5">金額</p>
              <p className="font-bold text-emerald-600">¥{receipt.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-semibold mb-0.5">ステータス</p>
              <p className="font-medium text-slate-800">{receipt.status}</p>
            </div>
            {receipt.image_url && (
              <div>
                <p className="text-slate-600 text-sm font-semibold mb-2">画像</p>
                <img src={imageUrl} alt="レシート" className="max-w-full rounded-lg border-2 border-slate-200" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
