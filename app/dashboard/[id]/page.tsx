import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function JobDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const job = await prisma.job.findFirst({
        where: {
            id,
            userId: session.user.id,
        },
    })

    if (!job) {
        redirect('/dashboard')
    }

    const statusConfig = {
        pending: { color: 'bg-yellow-500/20 text-yellow-300', icon: '⏳', label: 'Pendiente' },
        running: { color: 'bg-blue-500/20 text-blue-300', icon: '🔄', label: 'Procesando' },
        completed: { color: 'bg-green-500/20 text-green-300', icon: '✅', label: 'Completado' },
        failed: { color: 'bg-red-500/20 text-red-300', icon: '❌', label: 'Error' },
    }

    const status = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.pending

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6 border-b border-white/10">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <span className="text-xl">🍌</span>
                    </div>
                    <span className="text-xl font-bold text-white">NanoBanana</span>
                </Link>

                <Link
                    href="/dashboard"
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium flex items-center gap-2"
                >
                    ← Volver al Dashboard
                </Link>
            </nav>

            <main className="relative z-10 max-w-4xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-3xl font-bold text-white">Detalle del Anuncio</h1>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${status.color} flex items-center gap-2`}>
                            <span className={job.status === 'running' ? 'animate-spin' : ''}>{status.icon}</span>
                            {status.label}
                        </span>
                    </div>
                    <p className="text-gray-400">
                        Creado el {job.createdAt.toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    {/* Instructions */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span>📝</span> Instrucciones
                        </h2>
                        <p className="text-gray-300 whitespace-pre-wrap">{job.instructions}</p>
                    </div>

                    {/* Result */}
                    {job.status === 'completed' && job.outputImageUrl && (
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span>🎨</span> Resultado Generado
                            </h2>
                            <div className="rounded-xl overflow-hidden bg-black/20">
                                <img
                                    src={job.outputImageUrl}
                                    alt="Generated advertisement"
                                    className="w-full"
                                />
                            </div>
                            <a
                                href={job.outputImageUrl}
                                download={`nanobanana-ad-${job.id}.png`}
                                className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all"
                            >
                                📥 Descargar Imagen
                            </a>
                        </div>
                    )}

                    {/* Processing State */}
                    {(job.status === 'pending' || job.status === 'running') && (
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
                            <div className="animate-pulse">
                                <span className="text-6xl mb-4 block animate-bounce">🎨</span>
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    {job.status === 'pending' ? 'Esperando procesamiento...' : 'Generando tu anuncio...'}
                                </h2>
                                <p className="text-gray-400">
                                    Esto puede tomar unos segundos. La página se actualizará automáticamente.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {job.status === 'failed' && job.errorMessage && (
                        <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30">
                            <h2 className="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
                                <span>⚠️</span> Error
                            </h2>
                            <p className="text-red-200">{job.errorMessage}</p>
                            {job.errorCode && (
                                <p className="text-red-400 text-sm mt-2">Código: {job.errorCode}</p>
                            )}
                        </div>
                    )}

                    {/* Source Images */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span>📸</span> Imágenes de Origen
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {job.characterImage && (
                                <div>
                                    <p className="text-gray-400 text-sm mb-2">Personaje</p>
                                    <div className="aspect-square rounded-xl overflow-hidden bg-black/20">
                                        <img
                                            src={job.characterImage}
                                            alt="Character"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}
                            {job.productImage && (
                                <div>
                                    <p className="text-gray-400 text-sm mb-2">Producto</p>
                                    <div className="aspect-square rounded-xl overflow-hidden bg-black/20">
                                        <img
                                            src={job.productImage}
                                            alt="Product"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
