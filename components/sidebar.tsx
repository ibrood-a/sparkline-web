import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/use-current-user'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { ModeToggle } from '@/components/mode-toggle'
import { Logo } from '@/components/logo'

const sidebarPages = [
  {
    title: 'Pricing',
    link: '/#pricing'
  },
  {
    title: 'Tos',
    link: '/tos'
  },
  {
    title: 'Privacy',
    link: '/privacy'
  },
]

export const sidebarPagesAuthed = [
  {
    title: 'Dashboard',
    link: '/analytics'
  },
  {
    title: 'Post',
    link: '/post'
  },
  {
    title: 'Schedule',
    link: '/schedule'
  },
]

interface SidebarProps {
  closeSidebar?: () => void
}

export const Sidebar = ({ closeSidebar }: SidebarProps) => {
  const session = useCurrentUser()
  const Logout = () => {
    signOut()
  }

  const tabs = session ? sidebarPagesAuthed : sidebarPages
  return (
    <div className="flex flex-col justify-between pl-2">
      <Link href="/" onClick={closeSidebar}>
        <Logo />
      </Link>
      <div className="flex pt-4">
        <ModeToggle />
      </div>
      <div className=" pt-3">
        <div className="space-y-4">
          <div className="ml-2">
            <h1 className="text-xl font-semibold">Main</h1>
            {tabs.map((page) => (
              <Link
                key={page.link}
                href={page.link}
                className={cn(
                  'group flex py-1.5 w-full justify-start font-light cursor-pointer'
                )}
                onClick={closeSidebar}
              >
                <div className="flex w-full">
                  <p className="font-normal text-foreground/75">{page.title}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="ml-2">
            <h1 className="text-xl font-semibold">Socials</h1>
            {/*
              {
                socials.map((page) => (
                  <Link
                    key={page.link}
                    href={page.link}
                    className={cn(
                      'group flex w-full justify-start font-light cursor-pointer py-1.5'
                    )}
                    onClick={closeSidebar}
                  >
                    <div className="flex w-full">
                      <p className="font-normal text-foreground/75">{page.title}</p>
                    </div>
                  </Link>
                ))
              }
            */}
          </div>
          {session ? (
            <Link
              href="/login"
              className="group flex py-2 w-full justify-start cursor-pointer rounded ml-2 font-bold text-xl"
              onClick={() => {
                Logout()
                closeSidebar && closeSidebar()
              }}
            >
              Logout
            </Link>
          ) : (
            <Link
              href="/login"
              className="group flex pt-2 w-full justify-start font-light cursor-pointer"
              onClick={closeSidebar}
            >
              <div className="flex w-full ml-2 pb-3">
                <p className="font-semibold ">Sign Up</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
