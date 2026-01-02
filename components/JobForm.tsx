'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function JobForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [characterPreview, setCharacterPreview] = useState<string | null>(null)
    const [productPreview, setProductPreview] = useState<string | null>(null)

    const characterInputRef = useRef<HTMLInputElement>(null)
    const productInputRef = useRef<HTMLInputElement>(null)

    const compressImage = (base64Str: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image()
            img.src = base64Str
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const MAX_WIDTH = 1024
                const MAX_HEIGHT = 1024
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width
                        width = MAX_WIDTH
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height
                        height = MAX_HEIGHT
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)
                resolve(canvas.toDataURL('image/jpeg', 0.8)) // Compresión JPEG al 80%
            }
        })
    }

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setPreview: (url: string | null) => void
    ) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = async () => {
                const compressed = await compressImage(reader.result as string)
                setPreview(compressed)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const form = e.currentTarget
        const formData = new FormData(form)
        const instructions = formData.get('instructions') as string

        if (!characterPreview || !productPreview) {
            setError('Por favor, sube ambas imágenes')
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch('/api/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    instructions,
                    character_image: characterPreview,
                    product_image: productPreview,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error creando el anuncio')
            }

            // Reset form
            setCharacterPreview(null)
            setProductPreview(null)
            if (characterInputRef.current) characterInputRef.current.value = ''
            if (productInputRef.current) productInputRef.current.value = ''
            form.reset()

            // Refresh the page to show new job
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                    {error}
                </div>
            )}

            {/* Instructions */}
            <div>
                <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-2">
                    Instrucciones para el anuncio
                </label>
                <textarea
                    id="instructions"
                    name="instructions"
                    rows={4}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
                    placeholder="Describe cómo quieres que sea tu anuncio. Por ejemplo: Crea un anuncio navideño con el producto en primer plano y el personaje celebrando..."
                />
            </div>

            {/* Image Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Character Image */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Imagen del Personaje
                    </label>
                    <div
                        onClick={() => characterInputRef.current?.click()}
                        className="relative aspect-square bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                    >
                        {characterPreview ? (
                            <img src={characterPreview} alt="Character preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-4">
                                <span className="text-3xl mb-2 block">👤</span>
                                <span className="text-gray-400 text-sm">Click para subir</span>
                            </div>
                        )}
                    </div>
                    <input
                        ref={characterInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, setCharacterPreview)}
                    />
                </div>

                {/* Product Image */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Imagen del Producto
                    </label>
                    <div
                        onClick={() => productInputRef.current?.click()}
                        className="relative aspect-square bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                    >
                        {productPreview ? (
                            <img src={productPreview} alt="Product preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-4">
                                <span className="text-3xl mb-2 block">📦</span>
                                <span className="text-gray-400 text-sm">Click para subir</span>
                            </div>
                        )}
                    </div>
                    <input
                        ref={productInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, setProductPreview)}
                    />
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generando...
                    </span>
                ) : (
                    'Generar Anuncio ✨'
                )}
            </button>
        </form>
    )
}
