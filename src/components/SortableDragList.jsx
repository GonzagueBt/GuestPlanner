import { useState } from 'react'
import {
  DndContext, closestCenter,
  PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function GripIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16" aria-hidden>
      <circle cx="5"  cy="3.5" r="1.2" /><circle cx="11" cy="3.5" r="1.2" />
      <circle cx="5"  cy="8"   r="1.2" /><circle cx="11" cy="8"   r="1.2" />
      <circle cx="5"  cy="12.5" r="1.2" /><circle cx="11" cy="12.5" r="1.2" />
    </svg>
  )
}

function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={`flex items-center gap-2 ${isDragging ? 'opacity-40' : ''}`}
    >
      {/* Drag handle — toujours visible pour indiquer la possibilité */}
      <button
        type="button"
        aria-label="Réordonner"
        className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing touch-none flex-shrink-0 py-1"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      {children}
    </div>
  )
}

/**
 * Liste triable par drag-and-drop (souris + tactile).
 * @param {Array}    items       - tableau d'objets avec au moins un champ `id`
 * @param {Function} onReorder   - appelé avec le nouveau tableau après réordonnancement
 * @param {Function} renderItem  - (item) => ReactNode  — contenu de chaque ligne
 */
export default function SortableDragList({ items, onReorder, renderItem }) {
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const from = items.findIndex(i => i.id === active.id)
    const to   = items.findIndex(i => i.id === over.id)
    onReorder(arrayMove(items, from, to))
  }

  if (items.length === 0) return null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {items.map(item => (
            <SortableRow key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
