"use client";

import { useEffect, useState } from "react";
import {
  getAdminCampaigns,
  createCampaign,
  updateCampaign,
  type Campaign,
} from "@/lib/api";

const TYPES = [
  { id: "general", label: "その他" },
  { id: "lottery", label: "抽選" },
  { id: "quest", label: "クエスト" },
  { id: "buyback", label: "買取" },
];

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    campaign_type: "general",
    description: "",
    points: "",
    is_active: true,
  });

  const load = () => {
    getAdminCampaigns()
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      alert("タイトルを入力してください");
      return;
    }
    try {
      await createCampaign({
        title: form.title,
        campaign_type: form.campaign_type,
        description: form.description || undefined,
        points: form.points ? parseInt(form.points, 10) : undefined,
        is_active: form.is_active,
      });
      setForm({ title: "", campaign_type: "general", description: "", points: "", is_active: true });
      setCreating(false);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "作成に失敗しました");
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await updateCampaign(editing.id, {
        title: form.title || undefined,
        campaign_type: form.campaign_type,
        description: form.description || undefined,
        points: form.points ? parseInt(form.points, 10) : undefined,
        is_active: form.is_active,
      });
      setEditing(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新に失敗しました");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">キャンペーン管理</h1>
      <button
        onClick={() => setCreating(true)}
        className="mb-6 px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-md"
      >
        新規作成
      </button>
      {loading ? (
        <p className="text-slate-600 font-medium">読み込み中...</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-xl shadow-lg border border-slate-200 flex justify-between items-center hover:border-emerald-200 transition-colors"
            >
              <div>
                <p className="font-semibold text-slate-800">{c.title}</p>
                <p className="text-sm text-slate-600 mt-0.5">{c.campaign_type} · <span className="font-medium text-emerald-600">{c.points ?? "-"}pt</span></p>
              </div>
              <button
                onClick={() => {
                  setEditing(c);
                  setForm({
                    title: c.title,
                    campaign_type: c.campaign_type,
                    description: c.description || "",
                    points: c.points?.toString() || "",
                    is_active: c.is_active,
                  });
                }}
                className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
              >
                編集
              </button>
            </div>
          ))}
        </div>
      )}
      {(creating || editing) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold mb-4 text-slate-800">
              {creating ? "キャンペーン作成" : "キャンペーン編集"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">タイトル</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">種類</label>
                <select
                  value={form.campaign_type}
                  onChange={(e) => setForm({ ...form, campaign_type: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                >
                  {TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">説明</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">ポイント</label>
                <input
                  type="number"
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                <label htmlFor="active">有効</label>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={creating ? handleCreate : handleUpdate}
                className="px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-md"
              >
                {creating ? "作成" : "更新"}
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                className="px-5 py-2.5 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
