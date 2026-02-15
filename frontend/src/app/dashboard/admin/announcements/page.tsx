"use client";

import { useEffect, useState } from "react";
import {
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  type Announcement,
} from "@/lib/api";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });

  const load = () => {
    getAdminAnnouncements()
      .then(setAnnouncements)
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
      await createAnnouncement({
        title: form.title,
        body: form.body || undefined,
      });
      setForm({ title: "", body: "" });
      setCreating(false);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "作成に失敗しました");
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await updateAnnouncement(editing.id, {
        title: form.title || undefined,
        body: form.body || undefined,
      });
      setEditing(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新に失敗しました");
    }
  };

  const handleToggleActive = async (a: Announcement) => {
    try {
      await updateAnnouncement(a.id, { is_active: !a.is_active });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新に失敗しました");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">お知らせ管理</h1>
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
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white p-5 rounded-xl shadow-lg border border-slate-200 flex justify-between items-center hover:border-emerald-200 transition-colors"
            >
              <div>
                <p className="font-semibold text-slate-800">{a.title}</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {a.is_active ? (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">公開中</span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600 border border-slate-300">非公開</span>
                  )}
                  {" · "}
                  {new Date(a.created_at).toLocaleDateString("ja-JP")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(a)}
                  className="text-sm font-medium px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  {a.is_active ? "非公開にする" : "公開する"}
                </button>
                <button
                  onClick={() => {
                    setEditing(a);
                    setForm({ title: a.title, body: a.body || "" });
                  }}
                  className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  編集
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(creating || editing) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold mb-4 text-slate-800">
              {creating ? "お知らせ作成" : "お知らせ編集"}
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">本文</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-emerald-500 outline-none h-24"
                />
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
