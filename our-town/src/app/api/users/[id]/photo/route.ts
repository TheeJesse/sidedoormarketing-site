export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.id !== params.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('photo') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  if (file.size > 3 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 3MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${params.id}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const client = supabaseAdmin()

  const { error } = await client.storage
    .from('avatars')
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = client.storage.from('avatars').getPublicUrl(filename)

  // Bust Supabase CDN cache by appending a timestamp
  const urlWithBust = `${publicUrl}?t=${Date.now()}`

  await prisma.user.update({
    where: { id: params.id },
    data: { profilePhoto: urlWithBust },
  })

  return NextResponse.json({ url: urlWithBust })
}
