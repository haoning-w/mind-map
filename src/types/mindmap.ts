export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
}

export interface MindMapState {
  nodes: Record<string, MindMapNode>;
  rootId: string | null;
  selectedNodeId: string | null;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}
