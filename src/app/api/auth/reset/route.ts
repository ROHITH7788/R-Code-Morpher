import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(req: Request) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const record = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!record || record.expires < new Date()) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  const hashedPassword = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { id: record.userId }, data: { hashedPassword } })
  await prisma.passwordResetToken.delete({ where: { token } })
  return NextResponse.json({ ok: true })
}
