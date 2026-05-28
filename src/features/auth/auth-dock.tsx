"use client";

import { motion } from "framer-motion";
import { LogIn, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/shared/supabase/browser";
import { hasSupabaseEnv } from "@/shared/supabase/env";

type AuthStatus = "idle" | "sending" | "sent" | "error";

export function AuthDock() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const isConfigured = hasSupabaseEnv();

  useEffect(() => {
    if (!isConfigured) return;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, [isConfigured]);

  async function sendMagicLink() {
    if (!email.trim() || !isConfigured) return;
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setStatus(error ? "error" : "sent");
  }

  async function signInWith(provider: "google" | "apple") {
    if (!isConfigured) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  if (!isConfigured) {
    return (
      <section className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/8 p-3 text-xs text-amber-100">
        Supabase env не настроен. Заполни <span className="font-mono">.env.local</span>, чтобы включить вход.
      </section>
    );
  }

  if (userEmail) {
    return (
      <motion.section
        layout
        className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/8 px-3 py-2"
      >
        <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-300/15 text-emerald-100">
          <ShieldCheck size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-emerald-100">Аккаунт подключен</p>
          <p className="truncate text-xs text-[var(--text-muted)]">{userEmail}</p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section layout className="mt-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <UserRound size={15} />
        Supabase Auth для профиля, друзей и live-сессий
      </div>
      <div className="flex gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-black/24 px-3">
          <Mail size={16} className="text-[var(--text-muted)]" />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            inputMode="email"
            placeholder="email"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          />
        </label>
        <button
          onClick={sendMagicLink}
          disabled={status === "sending"}
          className="grid h-11 w-11 place-items-center rounded-xl bg-white text-zinc-950 disabled:opacity-60"
          aria-label="Отправить magic link"
        >
          <LogIn size={17} />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={() => signInWith("google")} className="h-10 rounded-xl bg-white/8 text-xs text-zinc-200">
          Google
        </button>
        <button onClick={() => signInWith("apple")} className="h-10 rounded-xl bg-white/8 text-xs text-zinc-200">
          Apple
        </button>
      </div>
      {status === "sent" ? <p className="mt-2 text-xs text-emerald-200">Ссылка отправлена. Проверь почту.</p> : null}
      {status === "error" ? <p className="mt-2 text-xs text-rose-200">Не удалось отправить ссылку. Проверь настройки Auth URL.</p> : null}
    </motion.section>
  );
}

