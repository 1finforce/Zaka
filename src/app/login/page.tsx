"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function Login() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [err, setErr] = useState("");
  const send = async () => {
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` } });
    error ? setErr(error.message) : setSent(true);
  };
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="card w-full max-w-sm">
        <h1 className="font-display text-3xl mb-1">Zaka</h1>
        <p className="text-muted mb-6">Sign in with your work email. We&apos;ll send a link.</p>
        {sent ? <p className="bg-mint text-mint-ink rounded-xl p-4">Check your inbox for the sign-in link.</p> : (
          <>
            <input className="input mb-3" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="btn w-full justify-center" onClick={send}>Send sign-in link</button>
            {err && <p className="text-blush-ink text-sm mt-3">{err}</p>}
          </>
        )}
      </div>
    </main>
  );
}
