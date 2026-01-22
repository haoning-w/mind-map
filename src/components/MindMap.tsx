"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer } from "react-konva";
import type Konva from "konva";
import { MindMapNodeComponent } from "./MindMapNode";
import { Connection } from "./Connection";
import { useMindMap } from "@/hooks/useMindMap";
import type { ViewportState } from "@/types/mindmap";

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const SCALE_STEP = 1.1;

export function MindMap() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [viewport, setViewport] = useState<ViewportState>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const {
    state,
    selectNode,
    addNode,
    deleteNode,
    updateNodeText,
    updateNodePosition,
  } = useMindMap();

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, direction > 0 ? oldScale * SCALE_STEP : oldScale / SCALE_STEP)
    );

    setViewport({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, []);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (e.target === stageRef.current) {
        setViewport((prev) => ({
          ...prev,
          x: e.target.x(),
          y: e.target.y(),
        }));
      }
    },
    []
  );

  const handleNodeDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      updateNodePosition(id, x, y);
    },
    [updateNodePosition]
  );

  const handleNodeDoubleClick = useCallback(
    (id: string) => {
      const node = state.nodes[id];
      if (node) {
        setEditingNodeId(id);
        setEditText(node.text);
      }
    },
    [state.nodes]
  );

  const handleEditSubmit = useCallback(() => {
    if (editingNodeId && editText.trim()) {
      updateNodeText(editingNodeId, editText.trim());
    }
    setEditingNodeId(null);
    setEditText("");
  }, [editingNodeId, editText, updateNodeText]);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === stageRef.current) {
        selectNode(null);
      }
    },
    [selectNode]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNodeId) {
        if (e.key === "Enter") {
          handleEditSubmit();
        } else if (e.key === "Escape") {
          setEditingNodeId(null);
          setEditText("");
        }
        return;
      }

      if (e.key === "Tab" && state.selectedNodeId) {
        e.preventDefault();
        addNode(state.selectedNodeId);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedNodeId && state.selectedNodeId !== state.rootId) {
          deleteNode(state.selectedNodeId);
        }
      } else if (e.key === "Enter" && state.selectedNodeId) {
        e.preventDefault();
        handleNodeDoubleClick(state.selectedNodeId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.selectedNodeId,
    state.rootId,
    editingNodeId,
    addNode,
    deleteNode,
    handleEditSubmit,
    handleNodeDoubleClick,
  ]);

  const connections = Object.values(state.nodes).flatMap((node) =>
    node.children
      .map((childId) => {
        const child = state.nodes[childId];
        if (!child) return null;
        return { parent: node, child, key: `${node.id}-${childId}` };
      })
      .filter(Boolean)
  );

  const zoomIn = () => {
    setViewport((prev) => ({
      ...prev,
      scale: Math.min(MAX_SCALE, prev.scale * SCALE_STEP),
    }));
  };

  const zoomOut = () => {
    setViewport((prev) => ({
      ...prev,
      scale: Math.max(MIN_SCALE, prev.scale / SCALE_STEP),
    }));
  };

  const resetView = () => {
    setViewport({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          {connections.map(
            (conn) =>
              conn && (
                <Connection
                  key={conn.key}
                  parent={conn.parent}
                  child={conn.child}
                />
              )
          )}
          {Object.values(state.nodes).map((node) => (
            <MindMapNodeComponent
              key={node.id}
              node={node}
              isSelected={state.selectedNodeId === node.id}
              isRoot={state.rootId === node.id}
              onSelect={selectNode}
              onDragEnd={handleNodeDragEnd}
              onDoubleClick={handleNodeDoubleClick}
            />
          ))}
        </Layer>
      </Stage>

      {editingNodeId && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/20"
          onClick={() => {
            setEditingNodeId(null);
            setEditText("");
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-64 text-gray-900"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditSubmit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingNodeId(null);
                  setEditText("");
                }
              }}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingNodeId(null);
                  setEditText("");
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 text-xl font-bold"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 text-xl font-bold"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 text-sm"
          title="Reset View"
        >
          1:1
        </button>
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => state.selectedNodeId && addNode(state.selectedNodeId)}
          disabled={!state.selectedNodeId}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md enabled:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Add Child (Tab)
        </button>
        <button
          onClick={() =>
            state.selectedNodeId &&
            state.selectedNodeId !== state.rootId &&
            deleteNode(state.selectedNodeId)
          }
          disabled={!state.selectedNodeId || state.selectedNodeId === state.rootId}
          className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md enabled:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Delete (Del)
        </button>
      </div>

      <div className="absolute bottom-4 right-4 text-sm text-gray-500 bg-white/80 rounded px-2 py-1">
        {Math.round(viewport.scale * 100)}%
      </div>
    </div>
  );
}
