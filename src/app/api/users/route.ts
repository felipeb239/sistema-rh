import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        level: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Verificar se o username já existe
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Nome de usuário já existe' },
        { status: 400 }
      )
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 12)
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name,
        email: data.email || null,
        role: data.role || 'user',
        level: data.level || 1,
        status: data.status || 'active'
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        level: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
