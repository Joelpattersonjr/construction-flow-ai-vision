import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DashboardWidget } from './DashboardWidget';
import { DashboardWidget as WidgetType } from '@/types/dashboard';

interface SortableDashboardWidgetProps {
  widget: WidgetType;
  children: React.ReactNode;
  isEditing?: boolean;
  onRemove?: () => void;
  onResize?: (width: number, height: number) => void;
}

export const SortableDashboardWidget: React.FC<SortableDashboardWidgetProps> = ({
  widget,
  children,
  isEditing = false,
  onRemove,
  onResize
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: widget.id,
    disabled: !isEditing
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isEditing ? listeners : {})}
      className={`${isDragging ? 'z-50' : ''}`}
    >
      <DashboardWidget
        widget={widget}
        isEditing={isEditing}
        isDragging={isDragging}
        onRemove={onRemove}
        onResize={onResize}
      >
        {children}
      </DashboardWidget>
    </div>
  );
};