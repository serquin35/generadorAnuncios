import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const maxDuration = 300; // Allow long running for this route if needed
export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!process.env.N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'Configuración incompleta: Falta la URL del motor de IA' },
        { status: 500 }
      )
    }

    const body = await request.json()

    if (!body.instructions || !body.character_image || !body.product_image) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        status: 'pending',
        instructions: body.instructions,
        characterImage: body.character_image,
        productImage: body.product_image,
      },
    })

    await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: job.id,
        instructions: body.instructions,
        character_image_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${job.id}/images/character`,
        product_image_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${job.id}/images/product`,
      }),
    })

    return NextResponse.json(
      {
        job_id: job.id,
        status: 'pending',
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error in POST /api/jobs:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const jobs = await prisma.job.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        })

        // Transform to expected format
        const formattedJobs = jobs.map(job => ({
            id: job.id,
            status: job.status,
            input: {
                instructions: job.instructions,
                character_image_url: job.characterImage,
                product_image_url: job.productImage,
            },
            output: job.outputImageUrl ? {
                image_url: job.outputImageUrl,
                generated_at: job.completedAt?.toISOString() || '',
                // ad_copy: (job as any).adCopy || null, // Comentado para evitar error de Prisma
                ad_copy: null, // Usando null por ahora
            } : null,
            error: job.errorMessage ? {
                code: job.errorCode || 'UNKNOWN',
                message: job.errorMessage,
            } : null,
            created_at: job.createdAt.toISOString(),
            completed_at: job.completedAt?.toISOString() || null,
        }))

        return NextResponse.json({ jobs: formattedJobs })

    } catch (error) {
        console.error('Error in GET /api/jobs:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
