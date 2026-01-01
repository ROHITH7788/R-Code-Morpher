import { NextResponse } from 'next/server'
import { convertWithLLM } from '@/lib/llm'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const body = await req.json()
  const { sourceLang, targetLang, inputCode, dsaMode } = body || {}
  if (!sourceLang || !targetLang || !inputCode) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const converted = await convertWithLLM({ sourceLang, targetLang, inputCode, dsaMode })
  const { outputCode, explanation, complexity, tests, usedLLM } = converted as any
  const userId = (session?.user as any)?.id
  if (userId) {
    await prisma.conversion.create({ data: { userId, sourceLang, targetLang, inputCode, outputCode, explanation, complexity, tests } })
  }
  return NextResponse.json({ outputCode, explanation, complexity, tests, usedLLM })
}
