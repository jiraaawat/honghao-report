import { Suspense } from 'react'
import SendToGradeContent from './send-to-grade-content'
import { FullPageLoader } from '@/components/ui/loading'

export default function SendToGradePage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <SendToGradeContent />
    </Suspense>
  )
}
