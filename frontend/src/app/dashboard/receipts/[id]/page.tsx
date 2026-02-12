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

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;
  if (!receipt) return null;

  const imageUrl = receipt.image_url.startsWith("http") ? receipt.image_url : `${API_BASE.replace("/api/v1", "")}${receipt.image_url}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-emerald-600 hover:underline">← ダッシュボードに戻る</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-bold mb-4">レシート詳細</h1>
          <div className="space-y-4">
            <div>
              <p className="text-slate-500 text-sm">店舗名</p>
              <p className="font-medium">{receipt.store_name || "-"}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">金額</p>
              <p className="font-medium">¥{receipt.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">ステータス</p>
              <p className="font-medium">{receipt.status}</p>
            </div>
            {receipt.image_url && (
              <div>
                <p className="text-slate-500 text-sm mb-2">画像</p>
                <img src={imageUrl} alt="レシート" className="max-w-full rounded border" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
