import React from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";

interface DroppableCellProps {
  id: string;
  items: { code: string; stuff: string; id: string }[]; // id 必須存在才能拖曳
  onDoubleClickItem?: (item: any) => void;
}

const DroppableCell: React.FC<DroppableCellProps> = ({ id, items, onDoubleClickItem }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <td className="droppable-cell" ref={setNodeRef}>
      {items.map((item) => (
        <DraggableTaskItem
          key={item.id}
          item={item}
          onDoubleClickItem={onDoubleClickItem}
        />
      ))}
    </td>
  );
};

export default DroppableCell;

// ⬇️ 拖曳元件（放在 DroppableCell.tsx 裡面也可以）
const DraggableTaskItem = ({
  item,
  onDoubleClickItem,
}: {
  item: { id: string; code: string; stuff: string };
  onDoubleClickItem?: (item: any) => void;
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: item.id,
    data: item,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="task-item"
      onDoubleClick={() => onDoubleClickItem?.(item)}
    >
      <strong>{item.code}</strong>
    </div>
  );
};
