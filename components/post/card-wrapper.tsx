'use client'

import { Header } from '@/components/auth/header'
import { Social } from '@/components/auth/social'
import { BackButton } from '@/components/auth/back-button'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'

interface CardWrapperProps {
  children: React.ReactNode
  className: string
}

export const CardWrapper = ({
  children, className,
}: CardWrapperProps) => {
  return (
    <Card className={"mx-auto w-6xl bg-secondary/90 border border-foreground/5 rounded-lg px-7 p-5" + className}>
        <div>{children}</div>
    </Card>
)
}
