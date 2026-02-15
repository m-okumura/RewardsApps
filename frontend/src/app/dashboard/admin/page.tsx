"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminAnalytics, type Analytics } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-slate-500">読み込み中...</p>;
  }

  if (!data) return null;

  const cards = [
    {
      title: "総ユーザー数",
      value: data.total_users,
      link: "/dashboard/admin/users",
    },
    {
      title: "今週の新規登録",
      value: data.new_users_week,
    },
    {
      title: "ポイント付与総数",
      value: `${data.total_points_granted.toLocaleString()} pt`,
    },
    {
      title: "交換総数",
      value: `${data.total_points_exchanged.toLocaleString()} pt`,
    },
    {
      title: "審査待ちレシート",
      value: data.pending_receipts,
      link: "/dashboard/admin/receipts?status=pending",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">分析ダッシュボード</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl hover:border-emerald-200 transition-all"
          >
            <p className="text-slate-500 text-sm font-medium mb-2">{card.title}</p>
            <p className="text-3xl font-bold text-slate-800">{card.value}</p>
            {card.link && (
              <Link
                href={card.link}
                className="mt-3 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                一覧を見る →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
