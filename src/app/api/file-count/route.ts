import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COUNTER_KEY = "sizesnap:total-files-created";

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function redisCommand(command: string, amount?: number) {
  const config = getRedisConfig();
  if (!config) return null;

  const path = amount === undefined
    ? `${command}/${encodeURIComponent(COUNTER_KEY)}`
    : `${command}/${encodeURIComponent(COUNTER_KEY)}/${amount}`;
  const response = await fetch(`${config.url}/${path}`, {
    headers: { Authorization: `Bearer ${config.token}` },
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Redis request failed with status ${response.status}`);
  const result = (await response.json()) as { result?: number | string };
  return Number(result.result) || 0;
}

export async function GET() {
  try {
    const count = await redisCommand("get");
    if (count === null) {
      return NextResponse.json({ error: "The shared file counter is not configured." }, { status: 503 });
    }
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Could not read shared file count:", error);
    return NextResponse.json({ error: "Could not read the shared file count." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { amount?: number };
    const amount = Number(body.amount ?? 1);
    if (!Number.isInteger(amount) || amount <= 0 || amount > 100) {
      return NextResponse.json({ error: "Amount must be a positive integer up to 100." }, { status: 400 });
    }

    const count = await redisCommand("incrby", amount);
    if (count === null) {
      return NextResponse.json({ error: "The shared file counter is not configured." }, { status: 503 });
    }
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Could not update shared file count:", error);
    return NextResponse.json({ error: "Could not update the shared file count." }, { status: 502 });
  }
}