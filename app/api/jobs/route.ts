import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate required fields
        if (!body.instructions || !body.character_image || !body.product_image) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: instructions, character_image, product_image' },
                { status: 400 }
            )
        }

        // Create job in database
        const job = await prisma.job.create({
            data: {
                userId: session.user.id,
                status: 'pending',
                instructions: body.instructions,
                characterImage: body.character_image,
                productImage: body.product_image,
            },
        })

        // Trigger n8n webhook using simple JSON
        try {
            const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    job_id: job.id,
                    instructions: body.instructions,
                    character_image: body.character_image,
                    product_image: body.product_image,
                }),
            })

            if (!n8nResponse.ok) {
                // Update job as failed
                await prisma.job.update({
                    where: { id: job.id },
                    data: {
                        status: 'failed',
                        errorCode: 'N8N_ERROR',
                        errorMessage: `n8n webhook returned ${n8nResponse.status}`,
                    },
                })

                return NextResponse.json(
                    { error: 'Error al enviar a n8n' },
                    { status: 500 }
                )
            }

            // Update job to running
            await prisma.job.update({
                where: { id: job.id },
                data: { status: 'running' },
            })

        } catch (n8nError) {
            console.error('Error calling n8n:', n8nError)

            await prisma.job.update({
                where: { id: job.id },
                data: {
                    status: 'failed',
                    errorCode: 'N8N_CONNECTION_ERROR',
                    errorMessage: 'No se pudo conectar con n8n',
                },
            })

            return NextResponse.json(
                { error: 'Error conectando con n8n' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            job_id: job.id,
            status: 'running',
            created_at: job.createdAt.toISOString(),
        }, { status: 201 })

    } catch (error) {
        console.error('Error in POST /api/jobs:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
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
