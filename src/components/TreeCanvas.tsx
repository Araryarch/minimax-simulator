import React, { useRef, useState, useEffect, useMemo } from 'react';
import { TreeNodeComponent } from '@/components/TreeNode';
import { TreeNode } from '@/types/tree';
import { calculateTreeLayout, LayoutNode } from '@/lib/utils/layout';
import { ZoomIn, ZoomOut, Move, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface TreeCanvasProps {
  root: TreeNode;
  simulationState: {
    activeId?: string;
    visitedIds?: string[];
    prunedIds?: string[];
    currentValues?: Record<string, number | { value?: number, alpha?: string, beta?: string }>;
    alphaValues?: Record<string, number>;
    betaValues?: Record<string, number>;
    explanation?: string;
  };
  onAddChild: (parentId: string) => void;
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  // Learn Mode Props
  isLearnMode?: boolean;
  learnPickingId?: string | null;
  learnAnswers?: Record<string, { value?: number, alpha?: string, beta?: string }>;
  onLearnAlphaBetaChange?: (nodeId: string, type: 'alpha' | 'beta', value: string) => void;
}

export const TreeCanvas: React.FC<TreeCanvasProps> = ({
  root,
  simulationState,
  onAddChild,
  onEditNode,
  onDeleteNode,
  isLearnMode,
  learnPickingId,
  learnAnswers,
  onLearnAlphaBetaChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Compute Layout
  const { nodes: nodePositions, edges, width: treeWidth, height: treeHeight } = useMemo(() => {
    // Start layout calculation at 0,0 locally
    const layout = calculateTreeLayout(root, 0, 0); 
    
    // Generate Edges manually as layout util doesn't return them structure-wise
    const generatedEdges: { id: string; source: LayoutNode; target: LayoutNode }[] = [];
    const nodeMap = new Map(layout.nodes.map(n => [n.id, n]));

    layout.nodes.forEach(node => {
        node.children.forEach(child => {
            const childNode = nodeMap.get(child.id);
            if (childNode) {
                generatedEdges.push({
                    id: `${node.id}-${child.id}`,
                    source: node,
                    target: childNode
                });
            }
        });
    });

    return { 
        nodes: layout.nodes, 
        edges: generatedEdges, 
        width: layout.width, 
        height: layout.height 
    };
  }, [root]);

  // Center tree on initial load
  useEffect(() => {
    if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        const centerX = (clientWidth - treeWidth) / 2;
        // Add padding top 50
        setPan({ x: centerX > 0 ? centerX : 20, y: 50 });
    }
  }, [treeWidth, root.id]); // Re-center on newly generated tree

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(z => Math.min(Math.max(0.1, z * delta), 3));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if clicking on background (not specific elements)
    if ((e.target as HTMLElement).tagName === 'DIV' || (e.target as HTMLElement).tagName === 'svg') {
        setIsDragging(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handlers for manual pan/zoom
  const zoomIn = () => setZoom(z => Math.min(z * 1.2, 3));
  const zoomOut = () => setZoom(z => Math.max(z / 1.2, 0.1));
  const autoFit = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const scaleX = (clientWidth - 100) / treeWidth;
        const scaleY = (clientHeight - 100) / treeHeight;
        const fitScale = Math.min(Math.min(scaleX, scaleY), 1); // Don't zoom in too much initially
        setZoom(Math.max(fitScale, 0.4));
        const centerX = (clientWidth - treeWidth * fitScale) / 2;
        setPan({ x: centerX, y: 50 });
      }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
       // Stop dragging canvas when interacting with node
       e.stopPropagation();
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing select-none bg-dot-pattern"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="active-layer relative transform-gpu transition-transform duration-75 ease-out origin-top-left will-change-transform"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        {/* Layer 1: Edges (SVG) */}
        {/* Make SVG large enough or overflow visible */}
        <svg className="absolute top-0 left-0 w-1 h-1 overflow-visible pointer-events-none z-0">
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
                        className={`tree-edge stroke-border stroke-[2px] transition-colors duration-300 ${isPruned ? 'stroke-destructive/50 opacity-40 stroke-dasharray-4' : ''} ${isVisited ? 'stroke-primary' : ''}`}
                    />
                  );
            })}
        </svg>

        {/* Layer 2: Nodes (HTML) */}
        <div className="nodes-layer z-10 absolute top-0 left-0">
            {nodePositions.slice().sort((a, b) => {
                // Ensure active node (and tooltip) renders last for Z-index
                if (a.id === simulationState?.activeId) return 1;
                if (b.id === simulationState?.activeId) return -1;
                return 0;
            }).map(node => {
                // Extract values based on mode
                let displayVal: number | undefined;
                let displayAlpha: number | undefined;
                let displayBeta: number | undefined;
                
                const rawCurrent = simulationState?.currentValues?.[node.id];
                
                if (isLearnMode && rawCurrent && typeof rawCurrent === 'object') {
                    // In learn mode, userAnswers stores object
                    displayVal = rawCurrent.value;
                    // Alpha/Beta for display (controlled inputs via other props) are strings usually in learn mode
                } else if (typeof rawCurrent === 'number') {
                    displayVal = rawCurrent;
                }

                // For simulation mode, alpha/beta come from separate records
                if (!isLearnMode) {
                    displayAlpha = simulationState?.alphaValues?.[node.id];
                    displayBeta = simulationState?.betaValues?.[node.id];
                }

                // For Learn mode input props
                const learnData = learnAnswers?.[node.id];

                return (
                    <TreeNodeComponent
                        key={node.id}
                        node={node}
                        activeId={simulationState?.activeId}
                        visitedIds={simulationState?.visitedIds}
                        isPruned={simulationState?.prunedIds?.includes(node.id)}
                        
                        value={displayVal}
                        alpha={displayAlpha}
                        beta={displayBeta}
                        
                        explanation={simulationState?.activeId === node.id ? simulationState?.explanation : undefined}
                        
                        onNodeContextMenu={(e, id) => { e.preventDefault(); onAddChild(id); }}
                        onNodeClick={(id) => onEditNode(id)}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        onDeleteNode={onDeleteNode}
                        isRoot={node.id === root.id}
                        
                        // Learn Mode
                        isLearnMode={isLearnMode}
                        learnPickingId={learnPickingId}
                        learnAlpha={learnData?.alpha}
                        learnBeta={learnData?.beta}
                        onLearnAlphaBetaChange={onLearnAlphaBetaChange}
                    />
                );
            })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-50">
          {/* Pan Controls - D-pad style */}
          <div className="bg-card p-1 rounded-lg border shadow-lg grid grid-cols-3 gap-0.5">
             <div></div>
             <button onMouseDown={() => setPan(p => ({...p, y: p.y + 50}))} className="p-1 hover:bg-muted rounded text-foreground flex justify-center"><ChevronUp size={16} /></button>
             <div></div>
             <button onMouseDown={() => setPan(p => ({...p, x: p.x + 50}))} className="p-1 hover:bg-muted rounded text-foreground flex justify-center"><ChevronLeft size={16} /></button>
             <button onClick={autoFit} className="p-1 bg-primary/10 hover:bg-primary/20 rounded flex items-center justify-center text-primary"><RefreshCw size={14} /></button>
             <button onMouseDown={() => setPan(p => ({...p, x: p.x - 50}))} className="p-1 hover:bg-muted rounded text-foreground flex justify-center"><ChevronRight size={16} /></button>
             <div></div>
             <button onMouseDown={() => setPan(p => ({...p, y: p.y - 50}))} className="p-1 hover:bg-muted rounded text-foreground flex justify-center"><ChevronDown size={16} /></button>
             <div></div>
          </div>

          <div className="flex flex-col bg-card border border-border rounded shadow-sm">
            <button onClick={zoomIn} className="p-2 hover:bg-muted border-b border-border flex justify-center w-full" title="Zoom In">
                <ZoomIn size={16} />
            </button>
            <button onClick={zoomOut} className="p-2 hover:bg-muted flex justify-center w-full" title="Zoom Out">
                <ZoomOut size={16} />
            </button>
          </div>
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 left-4 p-2 bg-card/90 backdrop-blur border border-border rounded text-[10px] space-y-1 pointer-events-none z-50 md:flex hidden flex-col">
          <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm border border-destructive bg-background"></span>
              <span>MAX Node (Petak)</span>
          </div>
          <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border border-primary bg-background"></span>
              <span>MIN Node (Lingkaran)</span>
          </div>
          <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-destructive/50 border-t border-destructive/50"></span>
              <span>Jalur Dipangkas</span>
          </div>
      </div>
    </div>
  );
};
