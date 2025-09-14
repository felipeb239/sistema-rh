import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se o username já existe (exceto para o próprio usuário)
    if (data.username && data.username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: data.username }
      })
      
      if (usernameExists) {
        return NextResponse.json(
          { error: 'Nome de usuário já existe' },
          { status: 400 }
        )
      }
    }
    
    // Preparar dados para atualização
    const updateData: any = {
      username: data.username,
      name: data.name,
      email: data.email || null,
      role: data.role,
      level: data.level,
      status: data.status
    }
    
    // Atualizar senha apenas se fornecida
    if (data.password && data.password.trim() !== '') {
      updateData.password = await bcrypt.hash(data.password, 12)
    }
    
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    await prisma.user.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Usuário excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
