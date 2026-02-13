import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Amplify で環境変数がビルドに渡らない場合のフォールバック（本番用）
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "http://43.207.105.126:8000/api/v1"
        : "http://localhost:8000/api/v1"),
  },
};

export default nextConfig;
