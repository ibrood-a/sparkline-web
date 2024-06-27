import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RocketIcon } from 'lucide-react'

export function AlertDemo() {
  return (
    <div className="w-full max-w-6xl px-6 py-4">
      <Alert className="px-6 rounded-xl border-0 ring ring-primary/20 ring-inset text-secondary bg-primary/15 text-black dark:text-white cursor-default">
        <AlertTitle className="flex gap-1">
          <span className="font-semibold">Welcome to sparkline, leader in scheduling and analytics! 🚀</span>
        </AlertTitle>
        <AlertDescription>
          We are currently in development, please be patient as we work to bring you the best experience possible.
          Sign up for our mailing list to stay up to date with our progress.
        </AlertDescription>
      </Alert>
    </div>
  )
}
