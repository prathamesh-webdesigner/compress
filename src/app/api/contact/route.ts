import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
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

    const smtpUser = process.env.SMTP_USER || siteConfig.contactEmail;
    const smtpPassword = process.env.SMTP_PASSWORD;
    if (!smtpPassword) {
      console.error("Contact email is not configured. Set SMTP_PASSWORD.");
      return NextResponse.json({ error: "Email delivery is not configured yet. Please try again later." }, { status: 503 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== "false",
      auth: { user: smtpUser, pass: smtpPassword },
    });

    await transporter.sendMail({
      from: `${siteConfig.name} Contact Form <${smtpUser}>`,
      to: siteConfig.contactEmail,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
