export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session as any)?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const form = await req.formData()
  const files = form.getAll('files') as File[]
  
  for (const f of files) {
    const text = await f.text()
    await prisma.fileObject.create({ data: { userId, name: f.name, content: text } })
  }
  return NextResponse.json({ ok: true })
}
