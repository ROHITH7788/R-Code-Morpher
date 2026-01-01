import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ ok: true })
  const token = uuidv4()
  const expires = new Date(Date.now() + 1000 * 60 * 30)
  await prisma.passwordResetToken.create({ data: { userId: user.id, token, expires } })
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset?token=${token}`
    await transporter.sendMail({ from: 'no-reply@codemorpher', to: email, subject: 'Password reset', text: `Reset: ${resetUrl}` })
  }
  return NextResponse.json({ ok: true })
}
