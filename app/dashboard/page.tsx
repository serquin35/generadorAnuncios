import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { signOut } from '@/lib/auth'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import JobForm from '@/components/JobForm'
import JobList from '@/components/JobList'

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    // Get user's jobs
    const jobs = await prisma.job.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
    })

    // Transform jobs to match the expected format
    const formattedJobs = jobs.map(job => ({
        id: job.id,
        user_id: job.userId,
        status: job.status as 'pending' | 'running' | 'completed' | 'failed',
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
        n8n_execution_id: job.n8nExecutionId,
        attempts: job.attempts,
        created_at: job.createdAt.toISOString(),
        updated_at: job.updatedAt.toISOString(),
        completed_at: job.completedAt?.toISOString() || null,
    }))

    return (
        <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            {/* Background Grid Pattern (Subtle) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6 border-b border-white/10">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <span className="text-xl">🍌</span>
                    </div>
                    <span className="text-xl font-bold text-white">NanoBanana</span>
                </Link>

                <div className="flex items-center gap-4">
                    <span className="text-gray-400 hidden sm:inline">{session.user.email}</span>
                    <form action={async () => {
                        'use server'
                        await signOut({ redirectTo: '/login' })
                    }}>
                        <button
                            type="submit"
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium"
                        >
                            Cerrar Sesión
                        </button>
                    </form>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-gray-400">Crea y gestiona tus anuncios generados con IA</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Create New Job */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="text-2xl">✨</span> Crear Nuevo Anuncio
                        </h2>
                        <JobForm />
                    </div>

                    {/* Job History */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="text-2xl">📋</span> Historial de Anuncios
                        </h2>
                        <JobList initialJobs={formattedJobs} />
                    </div>
                </div>
            </main>
        </div>
    )
}
