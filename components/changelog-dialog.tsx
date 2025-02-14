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
import { getCookie, setCookie } from '@/lib/utils/cookies'
import { ClipboardList } from 'lucide-react'

// This will be updated by the admin to trigger new changelog displays
export const CURRENT_UPDATE_ID = '1.5'

// Changelog content component to avoid duplication
const ChangelogContent = () => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold mb-2">Version {CURRENT_UPDATE_ID} - (Feb 15, 2025)</h3>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
        <li>🔍 Search Improvements:</li>
        <li className="ml-6">Fixed Blank Searches Error</li>
        <li>🧠 AI & Reasoning:</li>
        <li className="ml-6">Added Reasoning 'Think' Mode for Advanced Reasoning (BETA, may not work as expected)</li>
        <li>📱 User Experience:</li>
        <li className="ml-6">Auto Dynamic Scrolling for Better Reading Experience</li>
        <li className="ml-6">Updated System Time to WIB (Indonesia Time Zone)</li>
        <li>🗄️ File Features:</li>
        <li className="ml-6">Added Camera Capture Mode for Mobile Users</li>
        <li className="ml-6">Added Image Paste Support for Web Users</li>
        <li>⚙️ System Controls:</li>
        <li className="ml-6">Fixed STOP Button Functionality</li>
        <li className="ml-6">Added Delete Button for History</li>
      </ul>
    </div>
  </div>
)

export function ChangelogDialog() {
  const [open, setOpen] = useState(false)
  const [forceShow, setForceShow] = useState(false)

  useEffect(() => {
    const lastSeenUpdate = getCookie('last-seen-update')
    if (!lastSeenUpdate || lastSeenUpdate !== CURRENT_UPDATE_ID) {
      // Clear the old changelog cookie when new update is detected
      if (lastSeenUpdate) {
        document.cookie = 'last-seen-update=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      }
      
      const userName = getCookie('user-name')
      // For new users, don't show immediately (let name input show first)
      if (userName) {
        setOpen(true)
      } else {
        // Set a flag to show after name input
        setForceShow(true)
      }
    }
  }, [])

  useEffect(() => {
    const userName = getCookie('user-name')
    if (userName && forceShow) {
      setOpen(true)
      setForceShow(false)
    }
  }, [forceShow])

  const handleClose = () => {
    setCookie('last-seen-update', CURRENT_UPDATE_ID)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        setCookie('last-seen-update', CURRENT_UPDATE_ID)
      }
      setOpen(open)
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            What's New in VNYL v{CURRENT_UPDATE_ID}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-6">
          <ChangelogContent />
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Button component to manually show changelog
export function ChangelogButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <ClipboardList className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">View changelog</span>
      </Button>
      <Dialog open={open} onOpenChange={(open) => {
        if (!open) {
          setCookie('last-seen-update', CURRENT_UPDATE_ID)
        }
        setOpen(open)
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              What's New in VNYL v{CURRENT_UPDATE_ID}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6">
            <ChangelogContent />
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setCookie('last-seen-update', CURRENT_UPDATE_ID)
              setOpen(false)
            }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 