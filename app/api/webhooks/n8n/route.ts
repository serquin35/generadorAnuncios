import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

interface N8NCallbackPayload {
  job_id: string
  status: 'completed' | 'failed'
  output_image_url?: string
  error?: {
    code: string
    message: string
  }
  timestamp?: string
  signature?: string
}

// Validate HMAC signature
function validateSignature(payload: string, signature: string): boolean {
  const secret = process.env.N8N_CALLBACK_SECRET
  if (!secret) {
    console.warn('N8N_CALLBACK_SECRET not configured, skipping validation')
    return true
  }

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body: N8NCallbackPayload = JSON.parse(rawBody)

    // Optional signature validation
    if (body.signature && !validateSignature(rawBody, body.signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    if (!body.job_id || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields: job_id, status' },
        { status: 400 }
      )
    }

    const job = await prisma.job.findUnique({
      where: { id: body.job_id },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Idempotency
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json({ message: 'Job already finalized' })
    }

    if (body.status === 'completed') {
      if (!body.output_image_url) {
        return NextResponse.json(
          { error: 'Missing output_image_url for completed job' },
          { status: 400 }
        )
      }

      await prisma.job.update({
        where: { id: body.job_id },
        data: {
          status: 'completed',
          outputImageUrl: body.output_image_url,
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'Job completed',
        job_id: body.job_id,
      })
    }

    // FAILED
    await prisma.job.update({
      where: { id: body.job_id },
      data: {
        status: 'failed',
        errorCode: body.error?.code || 'UNKNOWN',
        errorMessage: body.error?.message || 'Unknown error',
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Job failed',
      job_id: body.job_id,
    })

  } catch (error) {
    console.error('Error in n8n webhook:', error)
    return NextResponse.json(
      { error: 'Error processing callback' },
      { status: 500 }
    )
  }
}
