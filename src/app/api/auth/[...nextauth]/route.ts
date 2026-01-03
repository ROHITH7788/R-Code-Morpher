import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { NextRequest } from 'next/server'

const handler = NextAuth(authOptions)

export async function GET(req: NextRequest, ctx: any) {
  if (!process.env.NEXTAUTH_URL) {
    const u = new URL(req.url)
    process.env.NEXTAUTH_URL = `${u.protocol}//${u.host}`
  }
  // @ts-ignore
  return handler(req, ctx)
}

export async function POST(req: NextRequest, ctx: any) {
  if (!process.env.NEXTAUTH_URL) {
    const u = new URL(req.url)
    process.env.NEXTAUTH_URL = `${u.protocol}//${u.host}`
  }
  // @ts-ignore
  return handler(req, ctx)
}
