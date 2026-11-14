"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/server/actions/admin";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, { status: "idle" });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className="input" />
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
