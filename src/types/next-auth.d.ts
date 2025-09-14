import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      name?: string
      email?: string
      role: string
      level: number // NOVO
    }
  }

  interface User {
    id: string
    username: string
    name?: string
    email?: string
    role: string
    level: number // NOVO
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    username: string
    level: number // NOVO
  }
}
