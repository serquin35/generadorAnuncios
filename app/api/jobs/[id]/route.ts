import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const job = await prisma.job.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        })

        if (!job) {
            return NextResponse.json(
                { error: 'Job no encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({
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
            } : null,
            error: job.errorMessage ? {
                code: job.errorCode || 'UNKNOWN',
                message: job.errorMessage,
            } : null,
            created_at: job.createdAt.toISOString(),
            updated_at: job.updatedAt.toISOString(),
            completed_at: job.completedAt?.toISOString() || null,
        })

    } catch (error) {
        console.error('Error in GET /api/jobs/[id]:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
