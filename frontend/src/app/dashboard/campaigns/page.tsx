"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCampaigns, type Campaign } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  lottery: "抽選",
  quest: "クエスト",
  buyback: "買取",
  general: "その他",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaigns()
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
          <h1 className="text-xl font-bold text-emerald-700">キャンペーン</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {campaigns.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
            <p className="text-slate-700 font-medium">現在開催中のキャンペーンはありません</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {campaigns.map((c) => (
              <li key={c.id} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:border-emerald-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-bold text-slate-800">{c.title}</h2>
                  <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded-lg border border-emerald-300">
                    {TYPE_LABEL[c.campaign_type] || c.campaign_type}
                  </span>
                </div>
                {c.description && (
                  <p className="text-slate-700 mb-2">{c.description}</p>
                )}
                {c.points && (
                  <p className="text-emerald-600 font-bold">{c.points}pt</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
