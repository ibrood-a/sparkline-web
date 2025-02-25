'use client'

import { Header } from '@/components/auth/header'
import { Social } from '@/components/auth/social'
import { BackButton } from '@/components/auth/back-button'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'

interface CardWrapperProps {
  children: React.ReactNode
}

export const CardWrapper = ({
  children,
}: CardWrapperProps) => {
  return (
    <Card className={"mx-auto w-full bg-secondary/90 border border-foreground/5 rounded-lg p-4"}>
        <div>{children}</div>
    </Card>
)
}
