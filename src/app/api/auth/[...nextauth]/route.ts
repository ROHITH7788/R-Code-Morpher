import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest, ctx: any) {
  if (!process.env.NEXTAUTH_URL) {
    const u = new URL(req.url)
    process.env.NEXTAUTH_URL = `${u.protocol}//${u.host}`
  }
  // @ts-ignore
  const handler = NextAuth(authOptions)
  // @ts-ignore
  return handler(req, ctx)
}

export async function POST(req: NextRequest, ctx: any) {
  if (!process.env.NEXTAUTH_URL) {
    const u = new URL(req.url)
    process.env.NEXTAUTH_URL = `${u.protocol}//${u.host}`
  }
  // @ts-ignore
  const handler = NextAuth(authOptions)
  // @ts-ignore
  return handler(req, ctx)
}
