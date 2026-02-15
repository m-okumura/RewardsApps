"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getAdminReceipts,
  getAdminReceipt,
  reviewReceipt,
  type Receipt,
} from "@/lib/api";

export default function AdminReceiptsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [detail, setDetail] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");

  const load = () => {
    setLoading(true);
    getAdminReceipts(statusFilter || undefined)
      .then(setReceipts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [statusFilter]);

  const openDetail = (id: number) => {
    getAdminReceipt(id).then(setDetail);
  };

  const handleApprove = async () => {
    if (!detail) return;
    const pts = parseInt(points, 10) || 0;
    try {
      await reviewReceipt(detail.id, "approved", pts > 0 ? pts : undefined);
      setDetail(null);
      setPoints("");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "処理に失敗しました");
    }
  };

  const handleReject = async () => {
    if (!detail) return;
    try {
      await reviewReceipt(detail.id, "rejected", undefined, reason);
      setDetail(null);
      setReason("");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "処理に失敗しました");
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-300",
      approved: "bg-emerald-100 text-emerald-800 border-emerald-300",
      rejected: "bg-rose-100 text-rose-800 border-rose-300",
    };
    const labels: Record<string, string> = {
      pending: "審査待ち",
      approved: "承認済み",
      rejected: "却下",
    };
    const s = styles[status] || "bg-slate-100 text-slate-700 border-slate-300";
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">レシート審査</h1>
      <div className="mb-6 flex gap-2 flex-wrap">
        <Link
          href="/dashboard/admin/receipts"
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            !statusFilter
              ? "bg-slate-800 text-white shadow-md"
              : "bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          全て
        </Link>
        <Link
          href="/dashboard/admin/receipts?status=pending"
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            statusFilter === "pending"
              ? "bg-amber-500 text-white shadow-md"
              : "bg-white text-amber-700 border-2 border-amber-200 hover:border-amber-300 hover:bg-amber-50"
          }`}
        >
          審査待ち
        </Link>
        <Link
          href="/dashboard/admin/receipts?status=approved"
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            statusFilter === "approved"
              ? "bg-emerald-500 text-white shadow-md"
              : "bg-white text-emerald-700 border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
          }`}
        >
          承認済み
        </Link>
        <Link
          href="/dashboard/admin/receipts?status=rejected"
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            statusFilter === "rejected"
              ? "bg-rose-500 text-white shadow-md"
              : "bg-white text-rose-700 border-2 border-rose-200 hover:border-rose-300 hover:bg-rose-50"
          }`}
        >
          却下
        </Link>
      </div>
      {loading ? (
        <p className="text-slate-600 font-medium">読み込み中...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-5 py-4 text-left font-semibold">ID</th>
                <th className="px-5 py-4 text-left font-semibold">ユーザーID</th>
                <th className="px-5 py-4 text-left font-semibold">店舗</th>
                <th className="px-5 py-4 text-left font-semibold">金額</th>
                <th className="px-5 py-4 text-left font-semibold">状態</th>
                <th className="px-5 py-4 text-left font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-b border-slate-100 hover:bg-emerald-50/50 transition-colors ${
                    i % 2 === 1 ? "bg-slate-50/50" : ""
                  }`}
                >
                  <td className="px-5 py-4 font-mono text-slate-700">{r.id}</td>
                  <td className="px-5 py-4 text-slate-700">{r.user_id}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{r.store_name || "-"}</td>
                  <td className="px-5 py-4 font-semibold text-emerald-700">
                    ¥{r.amount?.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => openDetail(r.id)}
                      className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      詳細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {detail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold mb-4 text-slate-800">レシート #{detail.id}</h2>
            <div className="space-y-2 mb-4">
              <p className="text-slate-700"><span className="font-semibold text-slate-500">店舗:</span> {detail.store_name}</p>
              <p className="text-slate-700"><span className="font-semibold text-slate-500">金額:</span> <span className="font-bold text-emerald-600">¥{detail.amount?.toLocaleString()}</span></p>
              <p className="text-slate-700"><span className="font-semibold text-slate-500">状態:</span> <StatusBadge status={detail.status} /></p>
            </div>
            {detail.image_url && (
              <img
                src={`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace("/api/v1", "")}${detail.image_url}`}
                alt="レシート"
                className="mt-2 max-h-48 object-contain"
              />
            )}
            {detail.status === "pending" && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">付与ポイント</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="px-4 py-2 border-2 border-slate-200 rounded-lg w-24 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    placeholder="例: 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">却下理由</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="px-4 py-2 border-2 border-slate-200 rounded-lg w-full focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    placeholder="却下する場合"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleApprove}
                    className="flex-1 px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-md"
                  >
                    承認
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 px-4 py-3 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors shadow-md"
                  >
                    却下
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => setDetail(null)}
              className="mt-4 px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
