import { Suspense } from 'react'
import SendToGradeContent from './send-to-grade-content'
import { Skeleton } from '@/components/ui/skeleton'

export default function SendToGradePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl p-6"><Skeleton className="h-96 w-full" /></div>}>
      <SendToGradeContent />
    </Suspense>
  )
}
