'use client'

import { AnimatePresence } from 'framer-motion'
import { Widget } from './Widget'
import { Widget as WidgetType, Profile } from '@/types/database'

interface WidgetGridProps {
  widgets: (WidgetType & {
    profiles?: Profile
    original_widget?: WidgetType & { profiles?: Profile }
  })[]
  isOwner?: boolean
  showUser?: boolean
}

export function WidgetGrid({ widgets, isOwner = false, showUser = false }: WidgetGridProps) {
  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">
          {isOwner
            ? "No widgets yet. Tap + to add your first one!"
            : "No content yet."}
        </p>
      </div>
    )
  }

  return (
    <div className="columns-2 gap-2">
      <AnimatePresence mode="popLayout">
        {widgets.map((widget) => (
          <div key={widget.id} className="break-inside-avoid mb-2">
            <Widget
              widget={widget}
              isOwner={isOwner}
              showUser={showUser}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
