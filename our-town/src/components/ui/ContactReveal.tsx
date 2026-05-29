'use client'

import { useState } from 'react'
import { Button } from './Button'

interface ContactRevealProps {
  name: string
  method: string
  value: string
}

export function ContactReveal({ name, method, value }: ContactRevealProps) {
  const [revealed, setRevealed] = useState(false)

  const firstName = name.split(' ')[0]
  const icon = method === 'phone' ? '📞' : '✉️'
  const href = method === 'phone' ? `tel:${value}` : `mailto:${value}`

  if (!revealed) {
    return (
      <div className="flex-shrink-0">
        <Button size="md" onClick={() => setRevealed(true)}>
          {icon} Contact {firstName}
        </Button>
        <p className="text-xs text-earth-400 mt-1.5 text-center">Click to reveal</p>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0">
      <a href={href} className="inline-block">
        <Button size="md">
          {icon} Contact {firstName}
        </Button>
      </a>
      <p className="text-xs text-earth-400 mt-1.5 text-center">{value}</p>
    </div>
  )
}
