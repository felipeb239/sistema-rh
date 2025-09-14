import { NextResponse } from 'next/server'

export async function POST() {
  // Forçar logout limpando cookies
  const response = NextResponse.json({ success: true })
  
  // Limpar cookies de sessão
  response.cookies.set('next-auth.session-token', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })
  
  response.cookies.set('__Secure-next-auth.session-token', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  })
  
  return response
}
