"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { MindMapNode, MindMapState } from "@/types/mindmap";

const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;
const HORIZONTAL_SPACING = 180;
const VERTICAL_SPACING = 80;

export function useMindMap() {
  const [state, setState] = useState<MindMapState>(() => {
    const rootId = uuidv4();
    return {
      nodes: {
        [rootId]: {
          id: rootId,
          text: "Central Idea",
          x: 400,
          y: 300,
          parentId: null,
          children: [],
        },
      },
      rootId,
      selectedNodeId: null,
    };
  });

  const selectNode = useCallback((nodeId: string | null) => {
    setState((prev) => ({ ...prev, selectedNodeId: nodeId }));
  }, []);

  const calculateChildPosition = useCallback(
    (parentNode: MindMapNode, childIndex: number, totalChildren: number) => {
      const totalHeight = (totalChildren - 1) * VERTICAL_SPACING;
      const startY = parentNode.y - totalHeight / 2;
      return {
        x: parentNode.x + HORIZONTAL_SPACING,
        y: startY + childIndex * VERTICAL_SPACING,
      };
    },
    []
  );

  const repositionChildren = useCallback(
    (nodes: Record<string, MindMapNode>, parentId: string) => {
      const parent = nodes[parentId];
      if (!parent) return nodes;

      const updatedNodes = { ...nodes };
      parent.children.forEach((childId, index) => {
        const pos = calculateChildPosition(
          parent,
          index,
          parent.children.length
        );
        updatedNodes[childId] = {
          ...updatedNodes[childId],
          x: pos.x,
          y: pos.y,
        };
      });
      return updatedNodes;
    },
    [calculateChildPosition]
  );

  const addNode = useCallback(
    (parentId: string, text: string = "New Node") => {
      setState((prev) => {
        const parent = prev.nodes[parentId];
        if (!parent) return prev;

        const newId = uuidv4();
        const childIndex = parent.children.length;
        const position = calculateChildPosition(parent, childIndex, childIndex + 1);

        const newNode: MindMapNode = {
          id: newId,
          text,
          x: position.x,
          y: position.y,
          parentId,
          children: [],
        };

        const updatedParent = {
          ...parent,
          children: [...parent.children, newId],
        };

        let updatedNodes = {
          ...prev.nodes,
          [parentId]: updatedParent,
          [newId]: newNode,
        };

        updatedNodes = repositionChildren(updatedNodes, parentId);

        return {
          ...prev,
          nodes: updatedNodes,
          selectedNodeId: newId,
        };
      });
    },
    [calculateChildPosition, repositionChildren]
  );

  const deleteNode = useCallback((nodeId: string) => {
    setState((prev) => {
      const node = prev.nodes[nodeId];
      if (!node || !node.parentId) return prev;

      const collectDescendants = (id: string): string[] => {
        const n = prev.nodes[id];
        if (!n) return [];
        return [id, ...n.children.flatMap(collectDescendants)];
      };

      const toDelete = new Set(collectDescendants(nodeId));
      const parent = prev.nodes[node.parentId];

      const updatedNodes = Object.fromEntries(
        Object.entries(prev.nodes).filter(([id]) => !toDelete.has(id))
      );

      if (parent) {
        updatedNodes[parent.id] = {
          ...parent,
          children: parent.children.filter((id) => id !== nodeId),
        };
      }

      return {
        ...prev,
        nodes: updatedNodes,
        selectedNodeId:
          prev.selectedNodeId && toDelete.has(prev.selectedNodeId)
            ? null
            : prev.selectedNodeId,
      };
    });
  }, []);

  const updateNodeText = useCallback((nodeId: string, text: string) => {
    setState((prev) => {
      const node = prev.nodes[nodeId];
      if (!node) return prev;

      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: { ...node, text },
        },
      };
    });
  }, []);

  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setState((prev) => {
      const node = prev.nodes[nodeId];
      if (!node) return prev;

      const dx = x - node.x;
      const dy = y - node.y;

      const moveDescendants = (
        nodes: Record<string, MindMapNode>,
        id: string,
        deltaX: number,
        deltaY: number
      ): Record<string, MindMapNode> => {
        const n = nodes[id];
        if (!n) return nodes;

        let updated = {
          ...nodes,
          [id]: { ...n, x: n.x + deltaX, y: n.y + deltaY },
        };

        for (const childId of n.children) {
          updated = moveDescendants(updated, childId, deltaX, deltaY);
        }

        return updated;
      };

      return {
        ...prev,
        nodes: moveDescendants(prev.nodes, nodeId, dx, dy),
      };
    });
  }, []);

  return {
    state,
    selectNode,
    addNode,
    deleteNode,
    updateNodeText,
    updateNodePosition,
  };
}
