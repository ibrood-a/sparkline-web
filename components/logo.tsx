import { Squircle } from 'lucide-react'

export const Logo = () => {
  return (
    <div className="flex items-center gap-2 group">
      <img className="w-14 h-10 text-primary group-hover:-rotate-12 transition-all duration-300"
        src="/logo.png"
        alt="/logo.png"
      />
      <span className="text-xl group-hover:translate-x-0.5 transition-all duration-300">
        Sparkline
      </span>
    </div>
  )
}
