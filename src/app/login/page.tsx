import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/account");

  return (
    <div
      className="flex min-h-full flex-col items-center justify-center p-6"
      style={{ backgroundColor: "var(--dashboard-bg)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 shadow-sm"
        style={{
          backgroundColor: "var(--dashboard-card)",
          borderColor: "var(--dashboard-border)",
        }}
      >
        <h1
          className="font-heading-ja text-center text-xl font-semibold"
          style={{ color: "var(--dashboard-text)" }}
        >
          Latlas Account
        </h1>
        <p className="mt-1 text-center text-sm" style={{ color: "var(--dashboard-text-muted)" }}>
          メールアドレスとパスワードでログイン
        </p>
        <LoginForm />
        <p className="mt-6 text-center text-sm" style={{ color: "var(--dashboard-text-muted)" }}>
          アカウントがない場合は{" "}
          <Link href="/signup" className="font-medium text-green-600 hover:text-green-700">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
