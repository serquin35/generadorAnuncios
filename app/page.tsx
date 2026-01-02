import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Vibrant Background Blurs */}
      <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-3 group px-2 cursor-default">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_-5px_theme(colors.primary.DEFAULT)] group-hover:shadow-[0_0_25px_-5px_theme(colors.primary.DEFAULT)] transition-all duration-500">
            <span className="text-xl">🍌</span>
          </div>
          <span className="text-xl font-bold text-foreground">halloBanana</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium text-sm hidden sm:block"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all text-sm"
          >
            Empezar Gratis
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 text-center">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-foreground max-w-4xl leading-tight mb-6">
          Crea{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Anuncios Increíbles
          </span>{' '}
          con IA
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mb-10">
          Sube las imágenes de tu producto y personaje, describe lo que quieres,
          y deja que la IA cree anuncios profesionales en segundos.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href="/signup"
            className="px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
          >
            Crear Mi Primer Anuncio →
          </Link>
          <Link
            href="#como-funciona"
            className="px-8 py-4 bg-card/50 backdrop-blur-sm text-foreground font-semibold text-lg rounded-2xl border border-border/50 hover:bg-card/80 hover:border-primary/30 transition-all"
          >
            Ver Cómo Funciona
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full" id="como-funciona">
          <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-primary/50 transition-all group shadow-lg shadow-black/5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Sube tus Imágenes</h3>
            <p className="text-muted-foreground">Carga la imagen de tu producto y un personaje/mascota que quieras incluir.</p>
          </div>

          <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-primary/50 transition-all group shadow-lg shadow-black/5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Describe tu Idea</h3>
            <p className="text-muted-foreground">Escribe instrucciones detalladas sobre el tipo de anuncio que deseas crear.</p>
          </div>

          <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-primary/50 transition-all group shadow-lg shadow-black/5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">IA Hace la Magia</h3>
            <p className="text-muted-foreground">Internamente la IA genera tu anuncio personalizado en cuestión de segundos.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center border-t border-border/10 mt-10">
        <p className="text-muted-foreground text-sm">
          © 2025 HalloBanana. Powered by cheosDesign.
        </p>
      </footer>
    </div>
  )
}
