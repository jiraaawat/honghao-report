import { Suspense } from 'react'
import SendToGradeContent from './send-to-grade-content'

export default function SendToGradePage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="font-mono text-sm text-zinc-500">loading...</div>
      </div>
    }>
      <SendToGradeContent />
    </Suspense>
  )
}
