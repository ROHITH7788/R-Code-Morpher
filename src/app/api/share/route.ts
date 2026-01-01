import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const { inputCode, outputCode, sourceLang, targetLang } = await req.json()
  const conversion = await prisma.conversion.create({
    data: {
      userId: (session?.user as any)?.id ?? 'public',
      sourceLang,
      targetLang,
      inputCode,
      outputCode,
    },
  })
  const share = await prisma.shareLink.create({ data: { userId: (session?.user as any)?.id ?? 'public', conversionId: conversion.id } })
  return NextResponse.json({ id: share.id })
}
