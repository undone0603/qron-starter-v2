import { NextRequest } from "next/server";
import { fal } from "@fal-ai/serverless-client";


// ---------- Types ----------

type BrandTier = "starter" | "growth" | "enterprise";

interface GenerateBody {
  prompt: string;
  controlImage: string; // URL or base64
  seed?: number;
  brandTier?: BrandTier;
  brandName?: string;
  rarityTier?: "common" | "rare" | "legendary";
}

interface FalResult {
  images?: { url: string }[];
  [key: string]: any;
}

// ---------- Config ----------

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // per window per identity

// naive in-memory store (replace with Redis/Upstash in prod)
const rateLimitStore = new Map<
  string,
  { windowStart: number; count: number }
>();

// Model mapping by brand tier
const MODEL_BY_TIER: Record<BrandTier, string> = {
  starter: "fal-ai/illusion-diffusion",
  growth: "fal-ai/illusion-diffusion-xl",
  enterprise: "fal-ai/illusion-diffusion-enterprise",
};

// ---------- Helpers ----------

function getClientIdentity(req: NextRequest): string {
  // You can swap this for real auth:
  // - JWT sub
  // - brandId
  // - API key hash
  const ip = req.ip ?? "unknown-ip";
  const ua = req.headers.get("user-agent") ?? "unknown-ua";
  return `${ip}:${ua}`;
}

function checkRateLimit(identity: string): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(identity);

  if (!existing) {
    rateLimitStore.set(identity, { windowStart: now, count: 1 });
    return true;
  }

  const { windowStart, count } = existing;

  if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
    // reset window
    rateLimitStore.set(identity, { windowStart: now, count: 1 });
    return true;
  }

  if (count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  rateLimitStore.set(identity, { windowStart, count: count + 1 });
  return true;
}

function resolveBrandTier(input?: BrandTier): BrandTier {
  if (!input) return "starter";
  if (input === "growth" || input === "enterprise") return input;
  return "starter";
}

function getModelForTier(tier: BrandTier): string {
  return MODEL_BY_TIER[tier] ?? MODEL_BY_TIER["starter"];
}

// QRON-specific prompt template
function buildQRONPrompt(params: {
  prompt: string;
  brandName?: string;
  rarityTier?: "common" | "rare" | "legendary";
}): string {
  const { prompt, brandName, rarityTier } = params;

  const rarityDescriptor =
    rarityTier === "legendary"
      ? "legendary, ultra-rare, high-contrast, luminous accents"
      : rarityTier === "rare"
      ? "rare, premium, subtle glow, refined details"
      : "clean, minimal, trustworthy, production-ready";

  const brandDescriptor = brandName
    ? `for the brand ${brandName}, emphasizing authenticity, proof-of-origin, and anti-counterfeit confidence`
    : "emphasizing authenticity, proof-of-origin, and anti-counterfeit confidence";

  return [
    "QRON-style product authenticity artwork,",
    rarityDescriptor + ",",
    brandDescriptor + ",",
    "designed to sit behind a scannable QR code without interfering with ISO-compliant finder patterns,",
    "no text, no logos, no QR modules drawn manually,",
    "focus on background composition only.",
    "",
    "User intent:",
    prompt,
  ].join(" ");
}

// ---------- Streaming Response Helper ----------

function createTextStream(
  handler: (push: (chunk: string) => void) => Promise<void>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (chunk: string) => {
        controller.enqueue(encoder.encode(chunk));
      };

      try {
        await handler(push);
        controller.close();
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              error: "INTERNAL_ERROR",
              message: err?.message ?? "Unknown error",
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}

// ---------- Route Handler ----------

export async function POST(req: NextRequest) {
  const identity = getClientIdentity(req);

  if (!checkRateLimit(identity)) {
    return new Response(
      JSON.stringify({
        error: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please slow down.",
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let body: GenerateBody;

  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return new Response(
      JSON.stringify({
        error: "INVALID_JSON",
        message: "Request body must be valid JSON.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { prompt, controlImage, seed, brandTier, brandName, rarityTier } = body;

  if (!prompt || !controlImage) {
    return new Response(
      JSON.stringify({
        error: "MISSING_FIELDS",
        message: "Both 'prompt' and 'controlImage' are required.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const resolvedTier = resolveBrandTier(brandTier);
  const model = getModelForTier(resolvedTier);
  const fullPrompt = buildQRONPrompt({ prompt, brandName, rarityTier });

  const stream = createTextStream(async (push) => {
    // Initial event
    push(
      `event: status\ndata: ${JSON.stringify({
        status: "starting",
        model,
        tier: resolvedTier,
      })}\n\n`
    );

    try {
      const result = (await fal.subscribe(model, {
        input: {
          prompt: fullPrompt,
          control_image: controlImage,
          seed,
        },
      })) as FalResult;

      const imageUrl = result?.images?.[0]?.url ?? null;

      push(
        `event: complete\ndata: ${JSON.stringify({
          status: "complete",
          model,
          tier: resolvedTier,
          imageUrl,
          raw: result,
        })}\n\n`
      );
    } catch (err: any) {
      push(
        `event: error\ndata: ${JSON.stringify({
          error: "GENERATION_FAILED",
          message: err?.message ?? "Failed to generate image.",
        })}\n\n`
      );
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

