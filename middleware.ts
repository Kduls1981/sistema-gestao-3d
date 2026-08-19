import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Se já estiver na página de login, arquivos estáticos do Next ou API, libera o acesso
  if (
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Verifica se o cookie da sessão do Supabase existe
  const allCookies = request.cookies.getAll()
  const hasSession = allCookies.some(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )

  // Se não estiver autenticado e tentar acessar rotas protegidas, redireciona para o login
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}