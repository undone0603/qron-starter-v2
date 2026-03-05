import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { qronId } = await req.json() as { qronId?: string };

    if (!qronId || typeof qronId !== 'string') {
      return NextResponse.json({ error: 'qronId required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Collect scan metadata (hash IP for privacy)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const ua = req.headers.get('user-agent') ?? 'unknown';

    // Simple hash for privacy (not cryptographic — just anonymization)
    const ipHash = Buffer.from(ip).toString('base64').slice(0, 16);

    // Detect device type from user-agent
    const deviceType =
      /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' :
      /tablet/i.test(ua) ? 'tablet' :
      'desktop';

    // Insert scan event (RLS policy: anyone can insert)
    const { error: scanError } = await supabase
      .from('scan_events')
      .insert({
        qron_id: qronId,
        user_agent: ua.slice(0, 200),
        ip_hash: ipHash,
        device_type: deviceType,
      });

    if (scanError) {
      console.error('scan_events insert error:', scanError.message);
      // Don't fail the request — scan logging is non-critical
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('scan route error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
