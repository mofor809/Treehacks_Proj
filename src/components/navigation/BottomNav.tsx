'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, User, Search, MessageCircle, Sun } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/prompts', icon: Sun, label: 'Prompts' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Frosted glass background */}
      <div className="glass bevel mx-4 mb-4 rounded-[24px] safe-area-inset-bottom overflow-hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-14 h-14 tap-highlight-none rounded-2xl active-scale"
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-1 rounded-xl gradient-primary-subtle"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}

                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`relative z-10 flex flex-col items-center justify-center transition-colors duration-200 ${
                    isActive ? 'text-[#3D3A7E]' : 'text-muted-foreground'
                  }`}
                >
                  <Icon
                    className="w-[22px] h-[22px]"
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
