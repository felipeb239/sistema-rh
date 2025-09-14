import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Permitir acesso de qualquer host em desenvolvimento
  ...(process.env.NODE_ENV === 'development' && {
    trustHost: true,
  }),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username }
          })
          
          if (!user || user.status !== 'active') {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            username: user.username,
            name: user.name || user.username,
            email: user.email || '',
            role: user.role,
            level: user.level, // NOVO
          }
        } catch (error) {
          console.error('Erro na autenticação:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
        token.level = user.level // NOVO
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.username = token.username as string
        session.user.level = token.level as number // NOVO
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 NextAuth redirect callback:')
      console.log('   url:', url)
      console.log('   baseUrl:', baseUrl)
      
      // Se a URL for relativa, usar baseUrl
      if (url.startsWith('/')) {
        const result = `${baseUrl}${url}`
        console.log('   resultado (relativa):', result)
        return result
      }
      
      // Se a URL for absoluta e do mesmo domínio, usar ela
      try {
        if(new URL(url).origin === baseUrl) {
          console.log('   resultado (mesmo domínio):', url)
          return url
        }
      } catch (e) {
        console.log('   erro ao verificar URL:', e.message)
      }
      
      // Caso contrário, usar baseUrl
      const fallback = `${baseUrl}/login`
      console.log('   resultado (fallback):', fallback)
      return fallback
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  }
}
