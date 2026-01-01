import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ conversions: [] })
  const conversions = await prisma.conversion.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, sourceLang: true, targetLang: true, createdAt: true, inputCode: true, outputCode: true },
  })
  return NextResponse.json({ conversions })
}
