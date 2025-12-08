import { NextRequest, NextResponse } from 'next/server';
import * as fal from '@fal-ai/serverless-client';
import QRCode from 'qrcode';
import { GeneratedQRON, GenerateRequest, QRONMode, STYLE_PRESETS } from '@/lib/types';
import { generateId } from '@/lib/utils';

// Configure Fal.ai
fal.config({
  credentials: process.env.FAL_KEY,
});

// Style prompt templates for different modes
const MODE_PROMPTS: Record<QRONMode, string> = {
  static: 'high quality, detailed, artistic QR code design',
  stereographic: '3D depth effect, stereoscopic, parallax layers',
  kinetic: 'motion blur, dynamic energy, flowing elements',
  holographic: 'holographic foil, iridescent, rainbow shift, prismatic',
  memory: 'ethereal, blockchain aesthetic, digital artifact, crystalline',
  echo: 'sound waves, audio visualization, sonic ripples',
  temporal: 'time-lapse, clock elements, flowing sand, temporal shift',
  reactive: 'responsive, adaptive, environment-aware, dynamic',
  layered: 'multi-layer, composite, depth, overlapping elements',
  dimensional: 'AR markers, spatial, 3D space, dimensional portal',
  living: 'organic, evolving, alive, breathing, cellular',
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: GenerateRequest = await request.json();
    const { targetUrl, mode, style, prompt } = body;

    // Validate required fields
    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Target URL is required' },
        { status: 400 }
      );
    }

    // Generate base QR code as reference
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 512,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Build the AI prompt
    const stylePreset = STYLE_PRESETS.find(p => p.id === style);
    const stylePrompt = stylePreset?.prompt || 'modern, sleek design';
    const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.static;
    
    const fullPrompt = prompt 
      ? `${prompt}, ${modePrompt}, ${stylePrompt}, QR code art, scannable`
      : `${modePrompt}, ${stylePrompt}, QR code art, beautiful, scannable, high contrast`;

    // Generate with Fal.ai using QR ControlNet
    const result = await fal.subscribe('fal-ai/fast-sdxl', {
      input: {
        prompt: fullPrompt,
        negative_prompt: 'blurry, low quality, distorted, unreadable, broken QR, text, watermark',
        image_size: 'square_hd',
        num_inference_steps: 30,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
        // ControlNet for QR would go here in production
        // controlnet: { qr_code_image: qrDataUrl }
      },
      logs: true,
    }) as any;

    const generationTime = (Date.now() - startTime) / 1000;

    // Build response
    const qron: GeneratedQRON = {
      id: generateId(),
      mode,
      targetUrl,
      imageUrl: result.images?.[0]?.url || qrDataUrl, // Fallback to base QR if AI fails
      metadata: {
        prompt: fullPrompt,
        style: stylePreset?.name || 'Custom',
        seed: result.seed,
        dimensions: { width: 1024, height: 1024 },
        aiModel: 'fal-ai/fast-sdxl',
        generationTime,
      },
      createdAt: new Date(),
    };

    // TODO: Save to Supabase database
    // const { data, error } = await supabase.from('qrons').insert(qron);

    return NextResponse.json({ success: true, qron });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Generation failed' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'QRON Generation API',
    version: '2.0.0',
    modes: Object.keys(MODE_PROMPTS),
  });
}
