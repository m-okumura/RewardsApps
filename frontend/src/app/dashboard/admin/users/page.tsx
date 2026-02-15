"use client";

import { useEffect, useState } from "react";
import {
  getAdminUsers,
  updateUserActive,
  grantPoints,
  type UserListItem,
} from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState<number | null>(null);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantAmount, setGrantAmount] = useState("");

  const load = () => {
    setLoading(true);
    getAdminUsers(search || undefined)
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [search]);

  const handleToggleActive = async (u: UserListItem) => {
    try {
      await updateUserActive(u.id, !u.is_active);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新に失敗しました");
    }
  };

  const handleGrant = async () => {
    const uid = parseInt(grantUserId, 10);
    const amount = parseInt(grantAmount, 10);
    if (!uid || !amount) {
      alert("ユーザーIDと金額を入力してください");
      return;
    }
    setGranting(uid);
    try {
      await grantPoints(uid, amount);
      setGrantUserId("");
      setGrantAmount("");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "付与に失敗しました");
    } finally {
      setGranting(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">ユーザー管理</h1>
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="検索（メール・名前）"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2.5 border-2 border-slate-200 rounded-xl w-72 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
        />
      </div>
      <div className="mb-6 p-5 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">ユーザーID</label>
          <input
            type="number"
            value={grantUserId}
            onChange={(e) => setGrantUserId(e.target.value)}
            className="px-4 py-2 border-2 border-slate-200 rounded-lg w-24 focus:border-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">ポイント数</label>
          <input
            type="number"
            value={grantAmount}
            onChange={(e) => setGrantAmount(e.target.value)}
            className="px-4 py-2 border-2 border-slate-200 rounded-lg w-24 focus:border-emerald-500 outline-none"
          />
        </div>
        <button
          onClick={handleGrant}
          disabled={granting !== null}
          className="px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-md"
        >
          {granting ? "付与中..." : "ポイント付与"}
        </button>
      </div>
      {loading ? (
        <p className="text-slate-600 font-medium">読み込み中...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-5 py-4 text-left font-semibold">ID</th>
                <th className="px-5 py-4 text-left font-semibold">メール</th>
                <th className="px-5 py-4 text-left font-semibold">名前</th>
                <th className="px-5 py-4 text-left font-semibold">状態</th>
                <th className="px-5 py-4 text-left font-semibold">管理者</th>
                <th className="px-5 py-4 text-left font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-b border-slate-100 hover:bg-emerald-50/50 transition-colors ${
                    i % 2 === 1 ? "bg-slate-50/50" : ""
                  }`}
                >
                  <td className="px-5 py-4 font-mono text-slate-700">{u.id}</td>
                  <td className="px-5 py-4 text-slate-700">{u.email}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{u.name}</td>
                  <td className="px-5 py-4">
                    {u.is_active ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        有効
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                        無効
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{u.is_admin ? "○" : "-"}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        u.is_active
                          ? "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-300"
                          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300"
                      }`}
                    >
                      {u.is_active ? "無効にする" : "有効にする"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
