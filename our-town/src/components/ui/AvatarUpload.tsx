'use client'

import { useRef, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'

interface AvatarUploadProps {
  userId: string
  name: string
  photoUrl?: string | null
}

export function AvatarUpload({ userId, name, photoUrl }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState(photoUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) { setError('Please select an image.'); return }
    if (file.size > 3 * 1024 * 1024) { setError('Image must be under 3MB.'); return }
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function upload() {
    if (!fileInputRef.current?.files?.[0]) return
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('photo', fileInputRef.current.files[0])
    const res = await fetch(`/api/users/${userId}/photo`, { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Upload failed.')
    } else {
      setCurrentUrl(data.url)
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    setUploading(false)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button onClick={() => fileInputRef.current?.click()} className="relative group flex-shrink-0" title="Change profile photo">
        <Avatar name={name} photoUrl={preview ?? currentUrl} size="xl" className="border-4 border-white shadow-sm" />
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-sm">📷</span>
        </div>
      </button>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {preview && (
        <div className="flex gap-2 items-center">
          <button onClick={upload} disabled={uploading} className="text-xs font-medium bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
            {uploading ? 'Uploading…' : 'Save photo'}
          </button>
          <button onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-xs text-earth-400 hover:text-earth-600">
            Cancel
          </button>
        </div>
      )}

      {!preview && (
        <button onClick={() => fileInputRef.current?.click()} className="text-xs text-brand-500 hover:text-brand-600">
          {currentUrl ? 'Change photo' : '+ Add photo'}
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
