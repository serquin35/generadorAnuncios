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

        // Trigger n8n webhook and WAIT for response (Synchronous Flow)
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
                await prisma.job.update({
                    where: { id: job.id },
                    data: {
                        status: 'failed',
                        errorCode: 'N8N_ERROR',
                        errorMessage: `n8n respondió con error ${n8nResponse.status}`,
                    },
                })
                return NextResponse.json({ error: 'Error en el motor de generación' }, { status: 500 })
            }

            // Parse result from n8n
            console.log('n8n response status:', n8nResponse.status)
            const n8nData = await n8nResponse.json()
            console.log('n8n response data received')

            // Helper to find image in nested object
            const findImage = (obj: any): string | null => {
                if (!obj) return null;
                if (typeof obj === 'string') {
                    if (obj.startsWith('http') || obj.startsWith('data:image')) return obj;
                    if (obj.length > 1000) return obj; // Likely base64
                    return null;
                }
                if (Array.isArray(obj)) {
                    for (const item of obj) {
                        const img = findImage(item);
                        if (img) return img;
                    }
                }
                if (typeof obj === 'object') {
                    // Priority keys
                    const priorityKeys = ['image', 'base64', 'output_image_url', 'url', 'data'];
                    for (const key of priorityKeys) {
                        const img = findImage(obj[key]);
                        if (img) {
                            console.log(`Image found in key: ${key}`);
                            return img;
                        }
                    }
                    // Scan all keys
                    for (const key in obj) {
                        const img = findImage(obj[key]);
                        if (img) {
                            console.log(`Image found in key: ${key}`);
                            return img;
                        }
                    }
                }
                return null;
            };

            const finalImageValue = findImage(n8nData);

            if (finalImageValue) {
                console.log('Valid image found in n8n response. Length:', finalImageValue.length)
                let cleanedImage = finalImageValue;

                // If it's pure base64 without prefix, add it
                if (cleanedImage.length > 1000 && !cleanedImage.startsWith('http') && !cleanedImage.startsWith('data:')) {
                    cleanedImage = `data:image/png;base64,${cleanedImage}`;
                }

                await prisma.job.update({
                    where: { id: job.id },
                    data: {
                        status: 'completed',
                        outputImageUrl: cleanedImage,
                        completedAt: new Date(),
                    },
                })

                return NextResponse.json({
                    job_id: job.id,
                    status: 'completed',
                    output_image_url: cleanedImage,
                }, { status: 201 })
            }

            console.log('No valid image found in n8n response. Data keys:', Object.keys(n8nData))

            // If no image but successful response, stay in running or mark as error
            await prisma.job.update({
                where: { id: job.id },
                data: { status: 'running' },
            })

            return NextResponse.json({
                job_id: job.id,
                status: 'running',
            }, { status: 201 })

        } catch (n8nError) {
            console.error('Error calling n8n:', n8nError)
            await prisma.job.update({
                where: { id: job.id },
                data: {
                    status: 'failed',
                    errorCode: 'N8N_CONNECTION_ERROR',
                    errorMessage: 'Error de comunicación con el motor de IA',
                },
            })
            return NextResponse.json({ error: 'Error de conexión' }, { status: 500 })
        }
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
