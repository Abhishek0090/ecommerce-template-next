"use client";

import { useState } from "react";
import { useStore } from "@/components/providers/store-provider";

/** Demo only: wire `onSubmit` to your email provider (Mailchimp, Resend, ConvertKit...). */
export function NewsletterForm({ big }: { big?: boolean }) {
  const { notify } = useStore();
  const [email, setEmail] = useState("");
  return (
    <form
      className={`flex gap-2 ${big ? "mx-auto max-w-md" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        notify("You're subscribed", email);
        setEmail("");
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
        className={`input ${big ? "border-white/30 bg-white/15 text-white placeholder:text-white/70" : ""}`}
      />
      <button type="submit" className={big ? "btn-light shrink-0" : "btn-primary shrink-0"}>
        Subscribe
      </button>
    </form>
  );
}
