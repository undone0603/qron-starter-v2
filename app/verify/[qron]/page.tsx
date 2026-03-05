import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import ScanLogger from './ScanLogger';

// ─── Types ───────────────────────────────────────────────────────────────────

interface QronRecord {
  id: string;
  mode: string;
  target_url: string;
  short_code: string | null;
  image_url: string;
  thumbnail_url: string | null;
  metadata: Record<string, unknown> | null;
  nft_token_id: string | null;
  nft_contract_address: string | null;
  nft_chain: string | null;
  nft_transaction_hash: string | null;
  scan_count: number;
  expires_at: string | null;
  created_at: string;
  is_public: boolean;
  style: string | null;
  prompt: string | null;
}

interface TrustSignal {
  label: string;
  earned: number;
  max: number;
  description: string;
}

interface TrustResult {
  score: number;
  signals: TrustSignal[];
  verdict: 'authentic' | 'suspicious' | 'unregistered';
}

// ─── Trust Score Engine ───────────────────────────────────────────────────────

function computeTrustScore(qron: QronRecord): TrustResult {
  const signals: TrustSignal[] = [];
  let score = 0;

  // Signal 1: Registered on AuthiChain (base truth)
  signals.push({ label: 'Registered on AuthiChain', earned: 30, max: 30, description: 'QRON code is in the verified registry' });
  score += 30;

  // Signal 2: Blockchain Anchored
  const anchored = Boolean(qron.nft_token_id);
  signals.push({ label: 'Blockchain Anchored', earned: anchored ? 20 : 0, max: 20, description: 'Cryptographic proof on Polygon' });
  if (anchored) score += 20;

  // Signal 3: Active & Valid
  const notExpired = !qron.expires_at || new Date(qron.expires_at) > new Date();
  signals.push({ label: 'Active & Valid', earned: notExpired ? 15 : 0, max: 15, description: 'Code has not expired' });
  if (notExpired) score += 15;

  // Signal 4: Community Verified (others have scanned this)
  const communityVerified = (qron.scan_count ?? 0) > 0;
  signals.push({ label: 'Community Verified', earned: communityVerified ? 15 : 0, max: 15, description: `Scanned ${qron.scan_count} time${qron.scan_count === 1 ? '' : 's'} by real consumers` });
  if (communityVerified) score += 15;

  // Signal 5: Rich product metadata
  const meta = qron.metadata;
  const hasMeta = meta && (meta['brand'] || meta['product'] || meta['batchId'] || meta['sku']);
  signals.push({ label: 'Product Data Verified', earned: hasMeta ? 10 : 0, max: 10, description: 'Brand & product information on-chain' });
  if (hasMeta) score += 10;

  // Signal 6: Visual QRON signature
  const hasVisual = Boolean(qron.image_url);
  signals.push({ label: 'Visual Signature Present', earned: hasVisual ? 10 : 0, max: 10, description: 'AI-generated anti-counterfeit visual attached' });
  if (hasVisual) score += 10;

  const verdict: TrustResult['verdict'] =
    score >= 75 ? 'authentic' :
    score >= 45 ? 'suspicious' :
    'unregistered';

  return { score, signals, verdict };
}

// ─── AI Story Generation ──────────────────────────────────────────────────────

async function generateStory(qron: QronRecord): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return buildFallbackStory(qron);
  }

  const meta = qron.metadata ?? {};
  const brand = String(meta['brand'] ?? '');
  const product = String(meta['product'] ?? '');
  const batchId = String(meta['batchId'] ?? '');

  const systemPrompt = `You are the AuthiChain Authentic Economy narrator. In 2-3 vivid sentences, tell the provenance story of a product that has just been verified authentic. Be specific, poetic, and confident. Mention the blockchain verification, the journey of the product, and what authenticity means for the consumer. No marketing speak — speak truth.`;

  const userPrompt = brand || product
    ? `The verified product: ${brand ? `Brand: ${brand}` : ''} ${product ? `Product: ${product}` : ''} ${batchId ? `Batch: ${batchId}` : ''}. Style: ${qron.style ?? qron.mode ?? 'standard'}. This QRON has been scanned ${qron.scan_count} times.`
    : `A product has been authenticated. It was created on ${new Date(qron.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. QRON mode: ${qron.style ?? qron.mode ?? 'standard'}. This is scan #${qron.scan_count + 1}.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 120,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return buildFallbackStory(qron);
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    return data?.choices?.[0]?.message?.content?.trim() ?? buildFallbackStory(qron);
  } catch {
    return buildFallbackStory(qron);
  }
}

function buildFallbackStory(qron: QronRecord): string {
  const meta = qron.metadata ?? {};
  const brand = String(meta['brand'] ?? '');
  const product = String(meta['product'] ?? '');
  if (brand && product) {
    return `This ${product} by ${brand} has been cryptographically verified through the AuthiChain Authentic Economy. Every scan is immutably recorded, protecting the brand's integrity and rewarding consumers who choose truth. You are holding something real.`;
  }
  return `This product has been verified through the AuthiChain Authentic Economy. Its authenticity is backed by cryptographic proof, immutable records, and a network of truth — not just a promise. You can trust what you hold.`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function verdictConfig(verdict: TrustResult['verdict']) {
  if (verdict === 'authentic') return {
    label: 'AUTHENTIC',
    icon: '✓',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    glow: 'shadow-emerald-500/20',
    bar: 'bg-emerald-400',
  };
  if (verdict === 'suspicious') return {
    label: 'SUSPICIOUS',
    icon: '⚠',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    glow: 'shadow-amber-500/20',
    bar: 'bg-amber-400',
  };
  return {
    label: 'UNREGISTERED',
    icon: '✕',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    glow: 'shadow-red-500/20',
    bar: 'bg-red-400',
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VerifyPage({ params }: { params: { qron: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const qronParam = params.qron;

  // Try short_code first, then id
  let qron: QronRecord | null = null;
  const { data: byShortCode } = await supabase
    .from('qrons')
    .select('*')
    .eq('short_code', qronParam)
    .maybeSingle();

  if (byShortCode) {
    qron = byShortCode as QronRecord;
  } else {
    const { data: byId } = await supabase
      .from('qrons')
      .select('*')
      .eq('id', qronParam)
      .maybeSingle();
    if (byId) qron = byId as QronRecord;
  }

  // If not found — show unregistered state (still return a page, not 404)
  if (!qron) {
    return <UnregisteredPage qronId={qronParam} />;
  }

  const trust = computeTrustScore(qron);
  const vc = verdictConfig(trust.verdict);
  const story = await generateStory(qron);

  const meta = qron.metadata ?? {};
  const brandName = String(meta['brand'] ?? '');
  const productName = String(meta['product'] ?? '');
  const batchId = String(meta['batchId'] ?? '');

  const isFirstScan = (qron.scan_count ?? 0) === 0;
  const rewardPoints = isFirstScan ? 100 : 10;
  const scanNumber = (qron.scan_count ?? 0) + 1;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] font-sans">
      {/* Log this scan (client component, no visible UI) */}
      <ScanLogger qronId={qron.id} />

      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#0a0a0f]/90 backdrop-blur border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-black text-white">Q</div>
          <span className="text-sm font-semibold tracking-tight">QRON</span>
          <span className="text-xs text-[#64748b]">by AuthiChain</span>
        </div>
        <a
          href={qron.target_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors border border-violet-400/30 px-3 py-1 rounded-full"
        >
          Visit →
        </a>
      </header>

      {/* QRON Visual */}
      {qron.image_url && (
        <div className="relative w-full aspect-square max-h-64 overflow-hidden">
          <Image
            src={qron.image_url}
            alt="QRON authenticity visual"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f]" />
        </div>
      )}

      <div className="px-4 pb-16 space-y-4 max-w-md mx-auto">

        {/* Verdict card */}
        <div className={`mt-4 rounded-2xl p-5 border ${vc.bg} ${vc.border} shadow-lg ${vc.glow}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black ${vc.color}`}>{vc.icon}</span>
              <span className={`text-base font-black tracking-widest ${vc.color}`}>{vc.label}</span>
            </div>
            <span className={`text-2xl font-black ${vc.color}`}>{trust.score}<span className="text-sm font-normal text-[#64748b]">/100</span></span>
          </div>

          {/* Score bar */}
          <div className="w-full h-2 rounded-full bg-[#1e1e2e]">
            <div
              className={`h-2 rounded-full transition-all ${vc.bar}`}
              style={{ width: `${trust.score}%` }}
            />
          </div>
        </div>

        {/* Product info */}
        {(brandName || productName || batchId) && (
          <div className="rounded-2xl p-5 bg-[#111118] border border-[#1e1e2e]">
            {productName && <h1 className="text-lg font-bold text-white leading-tight">{productName}</h1>}
            {brandName && <p className="text-sm text-violet-400 font-medium mt-0.5">{brandName}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#1e1e2e] text-[#94a3b8]">
                {qron.style ?? qron.mode ?? 'Standard'}
              </span>
              {batchId && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#1e1e2e] text-[#94a3b8] font-mono">
                  {batchId}
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#1e1e2e] text-[#94a3b8]">
                Scan #{scanNumber}
              </span>
            </div>
          </div>
        )}

        {/* AI Story */}
        <div className="rounded-2xl p-5 bg-[#111118] border border-[#1e1e2e]">
          <p className="text-xs font-semibold tracking-widest text-[#64748b] uppercase mb-2">Authenticity Story</p>
          <p className="text-sm text-[#cbd5e1] leading-relaxed italic">"{story}"</p>
        </div>

        {/* Trust Score Breakdown */}
        <div className="rounded-2xl p-5 bg-[#111118] border border-[#1e1e2e]">
          <p className="text-xs font-semibold tracking-widest text-[#64748b] uppercase mb-3">Trust Score Breakdown</p>
          <div className="space-y-3">
            {trust.signals.map((sig) => (
              <div key={sig.label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${sig.earned > 0 ? 'bg-emerald-400/20 text-emerald-400' : 'bg-[#1e1e2e] text-[#64748b]'}`}>
                  {sig.earned > 0 ? '✓' : '–'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${sig.earned > 0 ? 'text-[#e2e8f0]' : 'text-[#64748b]'}`}>{sig.label}</p>
                  <p className="text-[11px] text-[#475569] truncate">{sig.description}</p>
                </div>
                <span className={`text-xs font-bold tabular-nums flex-shrink-0 ${sig.earned > 0 ? 'text-emerald-400' : 'text-[#475569]'}`}>
                  +{sig.earned}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reward */}
        {trust.verdict === 'authentic' && (
          <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-900/40 to-cyan-900/20 border border-violet-500/30">
            <p className="text-xs font-semibold tracking-widest text-[#64748b] uppercase mb-1">Reward Earned</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">{rewardPoints}</span>
              <span className="text-sm text-violet-400 font-semibold">QRON pts</span>
            </div>
            <p className="text-xs text-[#64748b] mt-1">
              {isFirstScan ? 'First-scan bonus — you found this first!' : 'Thanks for verifying this product.'}
            </p>
            <a
              href="https://authichain.com"
              className="mt-3 w-full block text-center text-xs font-semibold py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              Claim Reward →
            </a>
          </div>
        )}

        {/* Provenance footer */}
        <div className="rounded-2xl p-4 bg-[#0d0d12] border border-[#1e1e2e]">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[#64748b]">First registered</p>
              <p className="text-[#94a3b8] font-medium mt-0.5">{formatDate(qron.created_at)}</p>
            </div>
            <div>
              <p className="text-[#64748b]">Total scans</p>
              <p className="text-[#94a3b8] font-medium mt-0.5">{scanNumber}</p>
            </div>
            {qron.nft_token_id && (
              <div>
                <p className="text-[#64748b]">Token ID</p>
                <p className="text-[#94a3b8] font-mono text-[11px] mt-0.5 truncate">#{qron.nft_token_id}</p>
              </div>
            )}
            {qron.nft_chain && (
              <div>
                <p className="text-[#64748b]">Chain</p>
                <p className="text-[#94a3b8] font-medium mt-0.5">{qron.nft_chain}</p>
              </div>
            )}
          </div>
          {qron.nft_transaction_hash && (
            <div className="mt-3 pt-3 border-t border-[#1e1e2e]">
              <p className="text-[#64748b] text-xs">Transaction hash</p>
              <p className="text-[#475569] font-mono text-[10px] mt-0.5 break-all">{qron.nft_transaction_hash}</p>
            </div>
          )}
        </div>

        {/* AuthiChain footer */}
        <div className="text-center pt-2 pb-4">
          <p className="text-[11px] text-[#475569]">
            Verified by{' '}
            <a href="https://authichain.com" className="text-violet-500 hover:text-violet-400">
              AuthiChain
            </a>{' '}
            · The Authentic Economy
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Unregistered State ───────────────────────────────────────────────────────

function UnregisteredPage({ qronId }: { qronId: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-400/10 border border-red-400/30 flex items-center justify-center text-3xl mx-auto">
          ✕
        </div>
        <div>
          <h1 className="text-xl font-black text-red-400 tracking-widest">UNREGISTERED</h1>
          <p className="text-sm text-[#64748b] mt-2">This QRON code is not in the AuthiChain registry.</p>
        </div>
        <div className="rounded-2xl p-4 bg-[#111118] border border-[#1e1e2e] text-left">
          <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">What this means</p>
          <ul className="space-y-1.5 text-xs text-[#94a3b8]">
            <li>· The product may be counterfeit</li>
            <li>· The QR code may have been tampered with</li>
            <li>· The code ID <code className="font-mono text-[#475569]">{qronId}</code> was not found</li>
          </ul>
        </div>
        <a
          href="https://authichain.com/report"
          className="block w-full text-center text-sm font-semibold py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          Report Suspicious Product
        </a>
        <a href="https://qron.space" className="text-xs text-[#475569] hover:text-[#64748b]">
          Learn about QRON →
        </a>
      </div>
    </div>
  );
}
