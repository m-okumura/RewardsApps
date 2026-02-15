"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50/50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-emerald-700 mb-2">ポイ活アプリ</h1>
        <p className="text-slate-700 font-medium mb-4">読み込み中...</p>
        <Link href="/login" className="inline-block px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors">
          ログインへ
        </Link>
      </div>
    </div>
  );
}
