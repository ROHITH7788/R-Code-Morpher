import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const files = await prisma.fileObject.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } })
  return NextResponse.json({ files })
}
