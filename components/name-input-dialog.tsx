'use client'

import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog'
import { Input } from './ui/input'
import { getCookie, setCookie } from '@/lib/utils/cookies'

export function NameInputDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    const userName = getCookie('user-name')
    if (!userName) {
      setOpen(true)
    }
  }, [])

  const handleSubmit = () => {
    if (name.trim()) {
      setCookie('user-name', name.trim())
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to VNYL!</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <p className="mb-4 text-muted-foreground">
            Please enter your name so the AI knows who it's chatting with:
          </p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 