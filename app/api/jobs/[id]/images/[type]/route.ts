import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; type: string }> }
) {
    try {
        const { id, type } = await params

        const job = await prisma.job.findUnique({
            where: { id },
            select: {
                characterImage: true,
                productImage: true,
            }
        })

        if (!job) {
            return new NextResponse('Job not found', { status: 404 })
        }

        let base64Data = ''
        if (type === 'character') {
            base64Data = job.characterImage
        } else if (type === 'product') {
            base64Data = job.productImage
        } else {
            return new NextResponse('Invalid image type', { status: 400 })
        }

        // Base64 to Buffer
        // Expected format: data:image/jpeg;base64,....
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)

        let buffer: Buffer
        let contentType = 'image/png'

        if (matches && matches.length === 3) {
            contentType = matches[1]
            buffer = Buffer.from(matches[2], 'base64')
        } else {
            // Assume it's raw base64 or something else
            buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        }

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
            },
        })

    } catch (error) {
        console.error('Error serving job image:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
