import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Server database not configured' }, { status: 503 })
    const { email, password, name } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Missing email/password' }, { status: 400 })
    if (typeof password !== 'string' || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { email, name, hashedPassword } })
    return NextResponse.json({ id: user.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Signup failed' }, { status: 500 })
  }
}
