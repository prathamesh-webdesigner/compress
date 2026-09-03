import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/config/site";

export const runtime = "nodejs";

// Web3Forms access keys are designed to be used this way — a key only
// authorizes delivery to the single inbox it was created for, it can't be
// used to read or redirect mail anywhere else, so a sane default here (kept
// overridable via env var) is how Web3Forms itself documents embedding it.
// See: https://web3forms.com
const DEFAULT_WEB3FORMS_ACCESS_KEY = "72e5c470-e4bf-44e7-aa32-c162163ed4d2";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, website } = body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
      website?: string; // honeypot field
    };

    // Simple honeypot — bots tend to fill every field.
    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Please fill in every field." }, { status: 400 });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    const web3formsAccessKey = process.env.WEB3FORMS_ACCESS_KEY || DEFAULT_WEB3FORMS_ACCESS_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (web3formsAccessKey) {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: web3formsAccessKey,
          subject: `[${siteConfig.name} Contact] ${subject}`,
          name,
          email,
          message: `Subject: ${subject}\n\n${message}`,
        }),
      });
      const rawBody = await res.text().catch(() => "");
      let result: { success?: boolean; message?: string } | null = null;
      try {
        result = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        result = null;
      }
      if (!res.ok || !result?.success) {
        console.error("Contact email failed to send via Web3Forms:", result?.message || rawBody || `HTTP ${res.status}`);
        return NextResponse.json({ error: "We couldn't send your message right now. Please try again shortly." }, { status: 502 });
      }
    } else if (resendApiKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${siteConfig.name} Contact Form <onboarding@resend.dev>`,
          to: siteConfig.contactEmail,
          reply_to: email,
          subject: `[Contact] ${subject}`,
          text: `From: ${name} <${email}>\n\n${message}`,
        }),
      });
      if (!res.ok) {
        console.error("Contact email failed to send via Resend:", await res.text());
        return NextResponse.json({ error: "We couldn't send your message right now. Please try again shortly." }, { status: 502 });
      }
    } else {
      // No email provider configured — log server-side so the message isn't lost silently.
      // Set WEB3FORMS_ACCESS_KEY or RESEND_API_KEY to deliver messages by email.
      console.log("Contact form submission (no email provider configured):", { name, email, subject, message });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
