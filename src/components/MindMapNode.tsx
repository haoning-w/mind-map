"use client";

import { Group, Rect, Text } from "react-konva";
import type { MindMapNode as MindMapNodeType } from "@/types/mindmap";
import { useRef, useState, useEffect } from "react";
import type Konva from "konva";

interface MindMapNodeProps {
  node: MindMapNodeType;
  isSelected: boolean;
  isRoot: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;
const CORNER_RADIUS = 8;

export function MindMapNodeComponent({
  node,
  isSelected,
  isRoot,
  onSelect,
  onDragEnd,
  onDoubleClick,
}: MindMapNodeProps) {
  const groupRef = useRef<Konva.Group>(null);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(node.id, e.target.x(), e.target.y());
  };

  const handleClick = () => {
    onSelect(node.id);
  };

  const handleDoubleClick = () => {
    onDoubleClick(node.id);
  };

  const bgColor = isRoot ? "#6366f1" : isSelected ? "#3b82f6" : "#ffffff";
  const textColor = isRoot || isSelected ? "#ffffff" : "#1f2937";
  const strokeColor = isSelected ? "#3b82f6" : "#d1d5db";

  return (
    <Group
      ref={groupRef}
      x={node.x}
      y={node.y}
      draggable
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
    >
      <Rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        offsetX={NODE_WIDTH / 2}
        offsetY={NODE_HEIGHT / 2}
        fill={bgColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={CORNER_RADIUS}
        shadowColor="rgba(0,0,0,0.1)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
      />
      <Text
        text={node.text}
        width={NODE_WIDTH - 16}
        height={NODE_HEIGHT}
        offsetX={(NODE_WIDTH - 16) / 2}
        offsetY={NODE_HEIGHT / 2}
        align="center"
        verticalAlign="middle"
        fill={textColor}
        fontSize={14}
        fontFamily="system-ui, -apple-system, sans-serif"
        ellipsis
        wrap="none"
      />
    </Group>
  );
}
