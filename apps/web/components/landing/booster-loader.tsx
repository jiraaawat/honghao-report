'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FullPageLoader } from '@/components/ui/loading'

export function BoosterLoader() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = sessionStorage.getItem('honghao-booster-seen')
    if (seen) {
      setShow(false)
      return
    }
    const timer = setTimeout(() => {
      setShow(false)
      sessionStorage.setItem('honghao-booster-seen', '1')
    }, 2200)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950"
        >
          <FullPageLoader />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
