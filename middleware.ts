import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req: any) => {
    const isLoggedIn = !!req.auth
    const isAuthPage = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup'
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
    const isWebhook = req.nextUrl.pathname.startsWith('/api/webhooks')

    // Allow webhooks without auth
    if (isWebhook) {
        return NextResponse.next()
    }

    // Redirect authenticated users away from auth pages
    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
    }

    // Protect dashboard routes
    if (!isLoggedIn && isDashboard) {
        return NextResponse.redirect(new URL('/login', req.nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
