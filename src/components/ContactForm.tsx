"use client";

import { useState, FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(data: FormData): FieldErrors {
    const errs: FieldErrors = {};
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const subject = String(data.get("subject") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!name) errs.name = "Please enter your name.";
    if (!email) errs.email = "Please enter your email.";
    else if (!EMAIL_PATTERN.test(email)) errs.email = "Please enter a valid email address.";
    if (!subject) errs.subject = "Please enter a subject.";
    if (!message) errs.message = "Please enter a message.";
    else if (message.length > 5000) errs.message = "Message is too long (max 5000 characters).";
    return errs;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const errs = validate(data);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      subject: String(data.get("subject") || ""),
      message: String(data.get("message") || ""),
      website: String(data.get("website") || ""), // honeypot
    };
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setStatus("sent");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="card flex items-center gap-3 p-6" role="status">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
          <CheckCircle2 size={22} />
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Message sent</p>
          <p className="text-sm text-[var(--color-text-muted)]">Thanks — we&apos;ll get back to you soon.</p>
        </div>
      </div>
    );
  }

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-xl border bg-[var(--color-surface)] px-3.5 py-2.5 text-sm focus-ring outline-none transition-colors ${
      hasError ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6 sm:p-7">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
      {error && <ErrorMessage message={error} />}
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">Name</label>
        <input
          id="contact-name"
          name="name"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
          className={inputClass(Boolean(fieldErrors.name))}
        />
        {fieldErrors.name && <p id="contact-name-error" className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.name}</p>}
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">Email</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
          className={inputClass(Boolean(fieldErrors.email))}
        />
        {fieldErrors.email && <p id="contact-email-error" className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.email}</p>}
      </div>
      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">Subject</label>
        <input
          id="contact-subject"
          name="subject"
          aria-invalid={Boolean(fieldErrors.subject)}
          aria-describedby={fieldErrors.subject ? "contact-subject-error" : undefined}
          className={inputClass(Boolean(fieldErrors.subject))}
        />
        {fieldErrors.subject && <p id="contact-subject-error" className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.subject}</p>}
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">Message</label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
          className={inputClass(Boolean(fieldErrors.message))}
        />
        {fieldErrors.message && <p id="contact-message-error" className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.message}</p>}
      </div>
      <button type="submit" disabled={status === "sending"} className="btn-primary flex items-center justify-center gap-2 px-5 py-3 text-sm">
        {status === "sending" ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Sending...
          </>
        ) : (
          <>
            <Send size={16} /> Send message
          </>
        )}
      </button>
    </form>
  );
}
