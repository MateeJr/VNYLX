import React from 'react'

const Footer: React.FC = () => {
  return (
    <>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 py-1 z-50 mx-auto px-4">
        <div className="text-center text-sm text-muted-foreground/50">
          ©{new Date().getFullYear()} Vnyl-1.0.
          <br />
          by Vallian.
        </div>
      </div>
    </>
  )
}

export default Footer
