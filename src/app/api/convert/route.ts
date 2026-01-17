import { NextResponse } from 'next/server'
import { convertWithLLM } from '@/lib/llm'

export async function POST(req: Request) {
  const body = await req.json()
  const { sourceLang, targetLang, inputCode, dsaMode } = body || {}
  if (!sourceLang || !targetLang || !inputCode) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  try {
    const converted = await convertWithLLM({ sourceLang, targetLang, inputCode, dsaMode })
    const { outputCode, explanation, complexity, tests, usedLLM } = converted as any
    try {
      const mod = await import('@/lib/prisma')
      const prisma = (mod as any).prisma
      const userId = null
      if (userId) {
        await prisma.conversion.create({ data: { userId, sourceLang, targetLang, inputCode, outputCode, explanation, complexity, tests } })
      }
    } catch {}
    if (!usedLLM) {
      return NextResponse.json({ error: 'LLM_REQUIRED' }, { status: 400 })
    }
    return NextResponse.json({ outputCode, explanation, complexity, tests, usedLLM })
  } catch (e: any) {
    const msg = (e?.message || '').toString()
    const status = /LLM_API_KEY_MISSING|LLM_REQUIRED|LLM_UNCHANGED_OUTPUT/.test(msg) ? 400 : 500
    return NextResponse.json({ error: msg || 'Conversion failed' }, { status })
  }
}
