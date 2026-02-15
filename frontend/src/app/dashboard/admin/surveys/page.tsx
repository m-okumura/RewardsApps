"use client";

import { useEffect, useState } from "react";
import {
  getAdminSurveys,
  createSurvey,
  updateSurvey,
  type Survey,
} from "@/lib/api";

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Survey | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    points: "10",
    expires_at: "",
    is_active: true,
  });

  const load = () => {
    getAdminSurveys()
      .then(setSurveys)
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
      await createSurvey({
        title: form.title,
        description: form.description || undefined,
        points: parseInt(form.points, 10) || 10,
        expires_at: form.expires_at || undefined,
        is_active: form.is_active,
      });
      setForm({ title: "", description: "", points: "10", expires_at: "", is_active: true });
      setCreating(false);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "作成に失敗しました");
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await updateSurvey(editing.id, {
        title: form.title || undefined,
        description: form.description || undefined,
        points: parseInt(form.points, 10) || undefined,
        expires_at: form.expires_at || undefined,
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
      <h1 className="text-2xl font-bold mb-6 text-slate-800">アンケート管理</h1>
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
          {surveys.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-xl shadow-lg border border-slate-200 flex justify-between items-center hover:border-emerald-200 transition-colors"
            >
              <div>
                <p className="font-semibold text-slate-800">{s.title}</p>
                <p className="text-sm text-slate-600 mt-0.5"><span className="font-medium text-emerald-600">{s.points}pt</span> · {s.expires_at ? new Date(s.expires_at).toLocaleDateString("ja-JP") : "無期限"}</p>
              </div>
              <button
                onClick={() => {
                  setEditing(s);
                  setForm({
                    title: s.title,
                    description: s.description || "",
                    points: String(s.points),
                    expires_at: s.expires_at ? s.expires_at.slice(0, 16) : "",
                    is_active: s.is_active ?? true,
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
              {creating ? "アンケート作成" : "アンケート編集"}
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
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">締切（任意）</label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
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
