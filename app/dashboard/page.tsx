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
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
            {/* Vibrant Background Blurs */}
            <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-4 md:px-6 lg:px-12 py-4 md:py-6 border-b border-white/5">
                <Link href="/dashboard" className="flex items-center gap-2 md:gap-3 group">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_-5px_theme(colors.primary.DEFAULT)] group-hover:shadow-[0_0_25px_-5px_theme(colors.primary.DEFAULT)] transition-all duration-500">
                        <span className="text-lg md:text-xl">🍌</span>
                    </div>
                    <span className="text-lg md:text-xl font-bold text-foreground">halloBanana</span>
                </Link>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 text-sm font-medium">
                        <span>🍌</span>
                        <span>{session.user.credits ?? 0}</span>
                    </div>
                    <span className="text-muted-foreground hidden sm:inline text-sm">{session.user.email}</span>
                    <form action={async () => {
                        'use server'
                        await signOut({ redirectTo: '/login' })
                    }}>
                        <button
                            type="submit"
                            className="px-3 py-1.5 md:px-4 md:py-2 text-muted-foreground hover:text-foreground transition-colors font-medium text-xs md:text-sm border border-white/10 rounded-lg md:border-transparent hover:bg-white/5 md:hover:bg-transparent"
                        >
                            Cerrar Sesión
                        </button>
                    </form>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
                {/* Header */}
                <div className="mb-8 md:mb-10">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Crea y gestiona tus anuncios generados con IA</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 w-full">
                    {/* Create New Job */}
                    <div className="bg-card/50 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-8 border border-border/50 hover:border-border transition-colors w-full">
                        <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6 flex items-center gap-2">
                            <span className="text-xl md:text-2xl">✨</span> Crear Nuevo Anuncio
                        </h2>
                        <JobForm userCredits={session.user.credits ?? 0} />
                    </div>

                    {/* Job History */}
                    <div className="bg-card/50 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-8 border border-border/50 hover:border-border transition-colors w-full">
                        <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6 flex items-center gap-2">
                            <span className="text-xl md:text-2xl">📋</span> Historial de Anuncios
                        </h2>
                        <JobList initialJobs={formattedJobs} />
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-muted-foreground text-xs md:text-sm mt-8 md:mt-12 pb-4">
                    © 2025 halloBanana. Powered by cheosDesign.
                </p>
            </main>
        </div>
    )
}
