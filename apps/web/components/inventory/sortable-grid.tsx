'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { InventoryItem } from '@/types'
import { cn } from '@/lib/utils'

interface SortableInventoryGridProps {
  items: InventoryItem[]
  onReorder: (items: InventoryItem[]) => void
  renderItem: (item: InventoryItem) => React.ReactNode
}

function SortableItem({
  item,
  renderItem,
}: {
  item: InventoryItem
  renderItem: (item: InventoryItem) => React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.cardId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group relative', isDragging && 'z-50 opacity-30')}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1 z-10 cursor-grab rounded-md bg-zinc-950/70 p-1 text-zinc-400 opacity-0 transition-opacity hover:text-zinc-100 group-hover:opacity-100"
      >
        <GripVertical className="h-3 w-3" />
      </div>
      {renderItem(item)}
    </div>
  )
}

export function SortableInventoryGrid({
  items,
  onReorder,
  renderItem,
}: SortableInventoryGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((i) => i.cardId === active.id)
        const newIndex = items.findIndex((i) => i.cardId === over.id)
        onReorder(arrayMove(items, oldIndex, newIndex))
      }
      setActiveId(null)
    },
    [items, onReorder]
  )

  const activeItem = activeId ? items.find((i) => i.cardId === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.cardId)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 gap-4 auto-rows-[1fr] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <SortableItem
              key={item.cardId}
              item={item}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90">{renderItem(activeItem)}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
