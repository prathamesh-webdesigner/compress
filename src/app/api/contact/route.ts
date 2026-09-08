import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/config/site";

export const runtime = "nodejs";

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

    const web3formsAccessKey = process.env.WEB3FORMS_ACCESS_KEY;
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
          replyto: email,
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
        const providerMessage = result?.message || `HTTP ${res.status}`;
        console.error("Contact email failed to send via Web3Forms:", providerMessage, rawBody);
        return NextResponse.json({ error: `Email provider error: ${providerMessage}` }, { status: 502 });
      }
    } else if (resendApiKey) {
      const resendFromEmail = process.env.RESEND_FROM_EMAIL || siteConfig.contactEmail;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${siteConfig.name} Contact Form <${resendFromEmail}>`,
          to: siteConfig.contactEmail,
          reply_to: email,
          subject: `[Contact] ${subject}`,
          text: `From: ${name} <${email}>\n\n${message}`,
        }),
      });
      if (!res.ok) {
        const providerMessage = await res.text();
        console.error("Contact email failed to send via Resend:", providerMessage);
        return NextResponse.json({ error: `Email provider error: ${providerMessage || `HTTP ${res.status}`}` }, { status: 502 });
      }
    } else {
      console.error("Contact email is not configured. Set WEB3FORMS_ACCESS_KEY or RESEND_API_KEY.");
      return NextResponse.json({ error: "Email delivery is not configured yet. Please try again later." }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
