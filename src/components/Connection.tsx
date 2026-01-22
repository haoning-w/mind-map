"use client";

import { Line } from "react-konva";
import type { MindMapNode } from "@/types/mindmap";

interface ConnectionProps {
  parent: MindMapNode;
  child: MindMapNode;
}

export function Connection({ parent, child }: ConnectionProps) {
  const startX = parent.x + 60;
  const startY = parent.y;
  const endX = child.x - 60;
  const endY = child.y;

  const controlPointOffset = (endX - startX) / 2;

  return (
    <Line
      points={[
        startX,
        startY,
        startX + controlPointOffset,
        startY,
        endX - controlPointOffset,
        endY,
        endX,
        endY,
      ]}
      stroke="#9ca3af"
      strokeWidth={2}
      tension={0}
      bezier
      lineCap="round"
      lineJoin="round"
    />
  );
}
