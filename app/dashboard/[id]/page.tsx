'use client'

import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Job } from '@/types'

export default function JobDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const [id, setId] = useState<string | null>(null)
    const [job, setJob] = useState<Job | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        params.then(p => setId(p.id))
    }, [params])

    useEffect(() => {
        if (!id) return

        const fetchJob = async () => {
            try {
                const res = await fetch('/api/jobs')
                if (res.ok) {
                    const data = await res.json()
                    const foundJob = (data.jobs as Job[]).find(j => j.id === id)
                    if (foundJob) {
                        setJob(foundJob)
                    }
                }
            } catch (error) {
                console.error('Error fetching job details:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchJob()
    }, [id])

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Error downloading image:', error)
            alert('Error al descargar la imagen. Inténtalo de nuevo.')
        }
    }

    if (isLoading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Cargando...</div>
    }

    if (!job) {
        redirect('/dashboard')
    }

    const statusConfig = {
        pending: { color: 'bg-yellow-500/20 text-yellow-300', icon: '⏳', label: 'Pendiente' },
        running: { color: 'bg-blue-500/20 text-blue-300', icon: '🔄', label: 'Procesando' },
        completed: { color: 'bg-primary/20 text-primary', icon: '✅', label: 'Completado' },
        failed: { color: 'bg-destructive/20 text-destructive-foreground', icon: '❌', label: 'Error' },
    }

    const status = statusConfig[job.status] || statusConfig.pending

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
            {/* Vibrant Background Blurs */}
            <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6 border-b border-border/50">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_-5px_theme(colors.primary.DEFAULT)] group-hover:shadow-[0_0_25px_-5px_theme(colors.primary.DEFAULT)] transition-all duration-500">
                        <span className="text-xl">🍌</span>
                    </div>
                    <span className="text-xl font-bold text-foreground">halloBanana</span>
                </Link>

                <Link
                    href="/dashboard"
                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-2 text-sm"
                >
                    ← Volver al Dashboard
                </Link>
            </nav>

            <main className="relative z-10 max-w-4xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-3xl font-bold text-foreground">Detalle del Anuncio</h1>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${status.color} flex items-center gap-2`}>
                            <span className={job.status === 'running' ? 'animate-spin' : ''}>{status.icon}</span>
                            {status.label}
                        </span>
                    </div>
                    <p className="text-muted-foreground">
                        Creado el {new Date(job.created_at).toLocaleDateString('es-ES', {
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
                    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <span>📝</span> Instrucciones
                        </h2>
                        <p className="text-muted-foreground whitespace-pre-wrap">{job.input.instructions}</p>
                    </div>

                    {/* Result */}
                    {job.status === 'completed' && job.output?.image_url && (
                        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <span>🎨</span> Resultado Generado
                            </h2>
                            <div className="rounded-xl overflow-hidden bg-black/20 border border-border/50">
                                <img
                                    src={job.output.image_url}
                                    alt="Generated advertisement"
                                    className="w-full"
                                />
                            </div>
                            <button
                                onClick={() => handleDownload(job.output!.image_url, `nanobanana-ad-${job.id}.png`)}
                                className="mt-6 inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all cursor-pointer"
                            >
                                📥 Descargar Imagen
                            </button>
                        </div>
                    )}

                    {/* Processing State */}
                    {(job.status === 'pending' || job.status === 'running') && (
                        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-12 border border-border/50 text-center">
                            <div className="animate-pulse">
                                <span className="text-6xl mb-4 block animate-bounce">🎨</span>
                                <h2 className="text-xl font-semibold text-foreground mb-2">
                                    {job.status === 'pending' ? 'Esperando procesamiento...' : 'Generando tu anuncio...'}
                                </h2>
                                <p className="text-muted-foreground">
                                    Esto puede tomar unos segundos. La página se actualizará automáticamente.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {job.status === 'failed' && job.error?.message && (
                        <div className="bg-destructive/10 backdrop-blur-sm rounded-2xl p-6 border border-destructive/20">
                            <h2 className="text-lg font-semibold text-destructive-foreground mb-4 flex items-center gap-2">
                                <span>⚠️</span> Error
                            </h2>
                            <p className="text-destructive-foreground/90">{job.error.message}</p>
                            {job.error.code && (
                                <p className="text-destructive-foreground/70 text-sm mt-2">Código: {job.error.code}</p>
                            )}
                        </div>
                    )}

                    {/* Source Images */}
                    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <span>📸</span> Imágenes de Origen
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {job.input.character_image_url && (
                                <div>
                                    <p className="text-muted-foreground text-sm mb-2">Personaje</p>
                                    <div className="aspect-square rounded-xl overflow-hidden bg-black/20 border border-border/50">
                                        <img
                                            src={job.input.character_image_url}
                                            alt="Character"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}
                            {job.input.product_image_url && (
                                <div>
                                    <p className="text-muted-foreground text-sm mb-2">Producto</p>
                                    <div className="aspect-square rounded-xl overflow-hidden bg-black/20 border border-border/50">
                                        <img
                                            src={job.input.product_image_url}
                                            alt="Product"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-muted-foreground text-sm mt-12">
                    © 2025 halloBanana. Powered by cheosDesign.
                </p>
            </main>
        </div>
    )
}
