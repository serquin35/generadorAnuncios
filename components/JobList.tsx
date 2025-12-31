'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Job, JobStatus } from '@/types'

interface JobListProps {
    initialJobs: Job[]
}

const statusConfig: Record<JobStatus, { color: string; icon: string; label: string }> = {
    pending: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: '⏳', label: 'Pendiente' },
    running: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '🔄', label: 'Procesando' },
    completed: { color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: '✅', label: 'Completado' },
    failed: { color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '❌', label: 'Error' },
}

export default function JobList({ initialJobs }: JobListProps) {
    const [jobs, setJobs] = useState<Job[]>(initialJobs)

    // Polling for updates when there are pending/running jobs
    useEffect(() => {
        const hasPendingJobs = jobs.some(job => job.status === 'pending' || job.status === 'running')

        if (!hasPendingJobs) return

        const interval = setInterval(async () => {
            try {
                const response = await fetch('/api/jobs')
                if (response.ok) {
                    const data = await response.json()
                    setJobs(data.jobs)
                }
            } catch (error) {
                console.error('Error polling jobs:', error)
            }
        }, 3000) // Poll every 3 seconds

        return () => clearInterval(interval)
    }, [jobs])

    if (jobs.length === 0) {
        return (
            <div className="text-center py-12">
                <span className="text-5xl mb-4 block">📭</span>
                <p className="text-gray-400">No tienes anuncios todavía</p>
                <p className="text-gray-500 text-sm mt-1">¡Crea tu primer anuncio ahora!</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {jobs.map((job) => {
                const status = statusConfig[job.status]

                return (
                    <Link
                        key={job.id}
                        href={`/dashboard/${job.id}`}
                        className="block p-4 bg-white/5 rounded-xl border border-white/10 hover:border-yellow-500/30 transition-all group"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">
                                    {job.input?.instructions?.slice(0, 50)}...
                                </p>
                                <p className="text-gray-500 text-sm mt-1">
                                    {new Date(job.created_at).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>

                            <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${status.color} flex items-center gap-1.5 shrink-0`}>
                                <span className={job.status === 'running' ? 'animate-spin' : ''}>{status.icon}</span>
                                {status.label}
                            </div>
                        </div>

                        {/* Preview thumbnail if completed */}
                        {job.status === 'completed' && job.output?.image_url && (
                            <div className="mt-3 h-20 rounded-lg overflow-hidden bg-black/20">
                                <img
                                    src={job.output.image_url}
                                    alt="Generated ad"
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                        )}

                        {/* Error message if failed */}
                        {job.status === 'failed' && job.error && (
                            <p className="mt-2 text-red-400 text-sm truncate">
                                {job.error.message}
                            </p>
                        )}
                    </Link>
                )
            })}
        </div>
    )
}
