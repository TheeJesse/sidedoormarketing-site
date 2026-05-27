'use client'

import { useRef, useState } from 'react'
import { Avatar } from './Avatar'

interface AvatarUploadProps {
  userId: string
  name: string
  photoUrl?: string | null
}

export function AvatarUpload({ userId, name, photoUrl }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState(photoUrl)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const form = new FormData()
      form.append('photo', file)

      const res = await fetch(`/api/users/${userId}/photo`, {
        method: 'POST',
        body: form,
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Upload failed')
        return
      }

      const data = await res.json()
      setUrl(data.url)
    } catch {
      alert('Upload failed — try again')
    } finally {
      setUploading(false)
    }
  }

  return (
    <button
      type="button"
      disabled={uploading}
      onClick={() => inputRef.current?.click()}
      className="relative group block"
      title="Change photo"
    >
      <Avatar
        name={name}
        photoUrl={url}
        size="xl"
        className="border-4 border-white shadow-sm group-hover:opacity-80 transition-opacity"
      />
      <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
        <span className="text-white text-xs font-medium">
          {uploading ? '…' : '📷'}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </button>
  )
}
