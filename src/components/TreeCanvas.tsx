import React, { useMemo, useState } from 'react';
import { TreeNode } from '@/types/tree';
import { calculateTreeLayout, LayoutNode } from '@/lib/utils/layout';
import { TreeNodeComponent } from './TreeNode';
import { ZoomIn, ZoomOut, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Move } from 'lucide-react';

interface TreeCanvasProps {
  root: TreeNode;
  simulationState?: {
      activeId?: string;
      visitedIds?: string[];
      prunedIds?: string[]; 
      currentValues?: Record<string, number>; 
      alphaValues?: Record<string, number>;
      betaValues?: Record<string, number>;
      explanation?: string;
  };
  onAddChild: (parentId: string) => void;
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const TreeCanvas: React.FC<TreeCanvasProps> = ({
  root,
  simulationState,
  onAddChild,
  onEditNode,
  onDeleteNode
}) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Node Dragging State
  const [nodePositions, setNodePositions] = useState<LayoutNode[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Initial Layout calculation managed via Effect to sync with Prop 'root'
  // But strictly allowing manual overrides
  const computedLayout = useMemo(() => {
    return calculateTreeLayout(root, 2000, 2000); 
  }, [root]);

  // Sync state with prop (initial load or reset) - simplified logic:
  // If root changes significantly (id check or just length?), we reset.
  // Ideally we want to keep positions of existing nodes if structure is similar, but that's hard.
  // For now: whenever auto-layout computes, we reset positions unless we want persistent drag.
  // User asked for "Auto Layout Button", implying manual trigger.
  // So: WE ONLY RESET positions when 'root' structure changes (topologically new tree) OR button pressed.
  // To detect "new tree generation", we can check if root ID changed or rely on a "revision" prop.
  // Since 'root' object ref changes on every add/edit in Simulator.tsx, we might overwrite dragged pos.
  // BETTER: Update `nodePositions` when `computedLayout` changes, BUT try to preserve known ID positions?
  // User wants "Auto Layout" button.
  
  // Let's use an explicit effect that overrides positions safely.
  React.useEffect(() => {
       setNodePositions(computedLayout.nodes);
  }, [computedLayout]); 

  const handleAutoLayout = () => {
       setNodePositions(computedLayout.nodes);
       setPan({x:0, y:0});
       setZoom(1);
  };

  const edges = useMemo(() => {
    const edgeList: {source: LayoutNode, target: LayoutNode, id: string}[] = [];
    nodePositions.forEach(node => {
      node.children.forEach(child => {
          const childLayout = nodePositions.find(n => n.id === child.id);
          if (childLayout) {
              edgeList.push({ source: node, target: childLayout, id: `${node.id}-${child.id}` });
          }
      });
    });
    return edgeList;
  }, [nodePositions]);

  const handleMouseDown = (e: React.MouseEvent) => {
      // If clicking SVG background
      // Check target? simpler to let Node stopPropagation
      setDragging(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation(); // Stop canvas panning
      setDraggingNodeId(nodeId);
      // We don't store offset because we snap center to mouse? Or consistent offset?
      // Better: store offset of mouse relative to node center.
      // But node.x is in SVG space.
      // Complex coordinate mapping needed for offset drag.
      // Simple V1: no offset, node jumps to mouse? No, bad UX.
      // V2: calculate offset.
      // For now, simpler: we assume we just drag.
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (draggingNodeId) {
          // Dragging a node
          // Convert screen delta to SVG space delta
          const svg = e.currentTarget.querySelector('svg');
          if (svg) {
              // This is tricky without `getScreenCTM`.
              // Movement logic: dX_screen / zoom = dX_svg
              setNodePositions(prev => prev.map(n => {
                  if (n.id === draggingNodeId) {
                      return {
                          ...n,
                          x: n.x + e.movementX / zoom,
                          y: n.y + e.movementY / zoom
                      };
                  }
                  return n;
              }));
          }
      } else if (dragging) {
          // Panning Canvas
          setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      }
  };

  const handleMouseUp = () => {
      setDragging(false);
      setDraggingNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
      const scale = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(z => Math.max(0.1, Math.min(3, z * scale)));
  };

  return (
    <div 
        className="relative w-full h-full overflow-hidden bg-dot-pattern"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: dragging ? 'grabbing' : (draggingNodeId ? 'grabbing' : 'grab') }}
    >
      <svg 
        width="100%" 
        height="100%"
        viewBox={`0 0 ${computedLayout.width + 400} ${computedLayout.height + 200}`}
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
      >
        <g transform="translate(50, 50)">
            {edges.map(edge => {
                 const isVisited = simulationState?.visitedIds?.includes(edge.target.id) && simulationState?.visitedIds?.includes(edge.source.id);
                 const isPruned = simulationState?.prunedIds?.includes(edge.target.id);
                 
                 return (
                    <line
                        key={edge.id}
                        x1={edge.source.x}
                        y1={edge.source.y}
                        x2={edge.target.x}
                        y2={edge.target.y}
                        className={`tree-edge ${isPruned ? 'pruned' : ''} ${isVisited ? 'visited' : ''}`}
                    />
                 );
            })}

            {nodePositions.slice().sort((a, b) => {
                // Ensure active node (and tooltip) renders last for Z-index
                if (a.id === simulationState?.activeId) return 1;
                if (b.id === simulationState?.activeId) return -1;
                return 0;
            }).map(node => (
                <TreeNodeComponent
                    key={node.id}
                    node={node}
                    activeId={simulationState?.activeId}
                    visitedIds={simulationState?.visitedIds}
                    isPruned={simulationState?.prunedIds?.includes(node.id)}
                    value={simulationState?.currentValues?.[node.id]}
                    alpha={simulationState?.alphaValues?.[node.id]}
                    beta={simulationState?.betaValues?.[node.id]}
                    explanation={simulationState?.activeId === node.id ? simulationState?.explanation : undefined}
                    onNodeContextMenu={(e, id) => { e.preventDefault(); onAddChild(id); }}
                    onNodeClick={(id) => onEditNode(id)}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onDeleteNode={onDeleteNode}
                    isRoot={node.id === root.id}
                />
            ))}
        </g>
      </svg>

      {/* Navigation Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          {/* Pan Controls - D-pad style */}
          <div className="bg-card p-1 rounded-lg border shadow-lg grid grid-cols-3 gap-0.5">
              <div></div>
              <button 
                onClick={() => setPan(p => ({...p, y: p.y + 80}))} 
                className="p-2 hover:bg-muted rounded active:bg-muted/80"
              >
                <ChevronUp size={18}/>
              </button>
              <div></div>
              
              <button 
                onClick={() => setPan(p => ({...p, x: p.x + 80}))} 
                className="p-2 hover:bg-muted rounded active:bg-muted/80"
              >
                <ChevronLeft size={18}/>
              </button>
              <button 
                onClick={handleAutoLayout} 
                className="p-2 hover:bg-muted rounded active:bg-muted/80" 
                title="Reset View"
              >
                <Move size={16}/>
              </button>
              <button 
                onClick={() => setPan(p => ({...p, x: p.x - 80}))} 
                className="p-2 hover:bg-muted rounded active:bg-muted/80"
              >
                <ChevronRight size={18}/>
              </button>
              
              <div></div>
              <button 
                onClick={() => setPan(p => ({...p, y: p.y - 80}))} 
                className="p-2 hover:bg-muted rounded active:bg-muted/80"
              >
                <ChevronDown size={18}/>
              </button>
              <div></div>
          </div>

          {/* Zoom Controls */}
          <div className="bg-card p-1 rounded-lg border shadow-lg flex flex-col gap-0.5">
              <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-2 hover:bg-muted rounded active:bg-muted/80"><ZoomIn size={18}/></button>
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="p-2 hover:bg-muted rounded active:bg-muted/80"><ZoomOut size={18}/></button>
          </div>
      </div>
    </div>
  );
};
