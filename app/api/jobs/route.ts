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

        // Trigger n8n webhook and WAIT for response (Synchronous Flow with short timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for sync response

        try {
            console.log(`Calling n8n (Hybrid): ${process.env.N8N_WEBHOOK_URL} (Job: ${job.id})`)
            console.log(`Payload sizes - Instr: ${body.instructions.length}, Char: ${body.character_image.length}, Prod: ${body.product_image.length}`)

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
                signal: controller.signal
            })

            clearTimeout(timeoutId);

            if (!n8nResponse.ok) {
                console.error(`n8n error response: ${n8nResponse.status}`)
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
            const n8nData = await n8nResponse.json()
            console.log('n8n response received successfully')

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
                    const priorityKeys = ['image', 'base64', 'output_image_url', 'url', 'data'];
                    for (const key of priorityKeys) {
                        if (obj[key]) {
                            const img = findImage(obj[key]);
                            if (img) {
                                console.log(`Image found in key: ${key}`);
                                return img;
                            }
                        }
                    }
                    for (const key in obj) {
                        const img = findImage(obj[key]);
                        if (img) return img;
                    }
                }
                return null;
            };

            const finalImageValue = findImage(n8nData);

            if (finalImageValue) {
                console.log('Valid image found in n8n response. Length:', finalImageValue.length)
                let cleanedImage = finalImageValue;

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

            console.log('No valid image found in n8n response. Data:', JSON.stringify(n8nData).substring(0, 200))

            await prisma.job.update({
                where: { id: job.id },
                data: { status: 'running' },
            })

            return NextResponse.json({
                job_id: job.id,
                status: 'running',
            }, { status: 201 })

        } catch (n8nError: any) {
            clearTimeout(timeoutId);
            const isTimeout = n8nError.name === 'AbortError' || n8nError.message?.includes('timeout');

            if (isTimeout) {
                console.log(`Sync timeout for job ${job.id}. Generation continues in background.`)
                // Return 202 Accepted. The UI will show "Generating..." thanks to polling.
                return NextResponse.json({
                    message: 'La generación está en marcha. Se actualizará en unos segundos.',
                    job_id: job.id,
                    status: 'running'
                }, { status: 202 })
            }

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
