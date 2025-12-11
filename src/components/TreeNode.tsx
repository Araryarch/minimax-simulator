import React from 'react';
import { LayoutNode } from '@/lib/utils/layout';
import { PlusCircle, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { useAnimatedNumber } from '@/components/AnimatedNumber';
import { MathRenderer } from '@/components/MathRenderer';

interface TreeNodeProps {
  node: LayoutNode;
  activeId?: string;
  visitedIds?: string[];
  isPruned?: boolean;
  value?: number;
  alpha?: number;
  beta?: number;
  explanation?: string;
  onNodeClick: (id: string) => void;
  onNodeContextMenu: (e: React.MouseEvent, id: string) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDeleteNode: (id: string) => void;
  isRoot: boolean;
  // Learn Mode Props
  isLearnMode?: boolean;
  learnPickingId?: string | null;
  learnAlpha?: string;
  learnBeta?: string;
  onLearnAlphaBetaChange?: (nodeId: string, type: 'alpha' | 'beta', value: string) => void;
}

export const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  activeId,
  visitedIds,
  isPruned,
  value,
  alpha,
  beta,
  explanation,
  onNodeClick,
  onNodeContextMenu,
  isLearnMode,
  learnPickingId,
  learnAlpha,
  learnBeta,
  onLearnAlphaBetaChange,
  ...props
}) => {
  const isActive = activeId === node.id;
  const isVisited = visitedIds?.includes(node.id);

  // Picking Logic
  const isPickingSource = learnPickingId === node.id;
  
  // Animation Logic
  const { displayValue: animatedAlpha } = useAnimatedNumber(alpha, 200, !isLearnMode);
  const { displayValue: animatedBeta } = useAnimatedNumber(beta, 200, !isLearnMode);
  const { displayValue: animatedValue } = useAnimatedNumber(value, 200, true);

  // Styling logic for Shapes
  const shapeClass = node.isMaxNode 
     ? "rounded-[6px] border-2" // MAX = Box (Square-ish)
     : "rounded-full border-2"; // MIN = Circle

  // Pick color based on state
  const borderClass = isActive 
     ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
     : isVisited 
        ? "border-primary/80 shadow-sm" 
        : "border-muted-foreground/40";

  const bgClass = isActive 
     ? "bg-primary/5" 
     : "bg-background";
  
  const baseClass = "tree-node flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300";
  const prunedClass = isPruned ? "opacity-50 grayscale" : "";
  const pickingClass = isPickingSource ? "ring-4 ring-yellow-400 ring-offset-2 animate-pulse" : "";
  const learnModeClass = isLearnMode ? "cursor-pointer hover:border-primary" : "";

  // Helper styles
  const containerClassName = `${baseClass} ${shapeClass} ${borderClass} ${bgClass} ${prunedClass} ${pickingClass} ${learnModeClass}`;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeContextMenu(e, node.id); 
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick(node.id);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.onDeleteNode(node.id);
  };

  // Helper to safely format infinity
  const formatVal = (v: number | undefined | null) => {
      if (v === Infinity) return '∞';
      if (v === -Infinity) return '-∞';
      if (v === undefined || v === null) return '';
      return Math.round(v * 100) / 100;
  };

  return (
    <div
      className={containerClassName}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        position: 'absolute',
      }}
      onClick={() => onNodeClick(node.id)}
      onContextMenu={(e) => {
          e.preventDefault();
          onNodeContextMenu(e, node.id);
      }}
      id={`node-${node.id}`}
    >
      {/* Explanation Popup */}
      {explanation && !isLearnMode && (
          <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-max max-w-[350px] p-2.5 bg-popover/95 backdrop-blur text-popover-foreground rounded-xl shadow-xl border border-border z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                <MathRenderer content={explanation} compact={true} />
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-popover/95" />
          </div>
      )}

      <div className="node-content flex flex-col items-center justify-center w-full h-full relative group">
        <span className="node-id absolute top-0.5 right-1.5 text-[8px] opacity-40 font-mono">{node.id.slice(0, 4)}</span>
        
        {/* Pruning Indicator */}
        {isPruned && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded z-10">
                <span className="text-2xl">❌</span>
            </div>
        )}

        {/* Node Type Indicator */}
        <span className="text-[9px] font-bold uppercase tracking-wider mb-0.5 opacity-70">
            {node.isMaxNode ? 'MAX' : 'MIN'}
        </span>

        {/* Main Value */}
        <div className="text-lg font-bold leading-none my-1">
             {/* Picking Indicator */}
             {isPickingSource && animatedValue === undefined ? (
                 <span className="text-yellow-500 animate-bounce">?</span>
             ) : (
                formatVal(animatedValue) || (isLearnMode && !isPruned ? <span className="text-muted-foreground/30 text-xs">-</span> : '')
             )}
        </div>

        {/* Controls Overlay (Only Simulate Mode & Hover) */}
        {!isLearnMode && !isPruned && (
        <div className="node-controls absolute -bottom-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-background/80 rounded-full px-2 py-1 shadow-sm border border-border pointer-events-none group-hover:pointer-events-auto">
             <button onClick={handleAddClick} className="p-1 hover:text-green-500 transition-colors" title="Add Child">
                <PlusCircle size={14} />
             </button>
             <button onClick={handleEditClick} className="p-1 hover:text-blue-500 transition-colors" title="Edit Value">
                <Pencil size={14} />
             </button>
             {!props.isRoot && <button onClick={handleDeleteClick} className="p-1 hover:text-red-500 transition-colors" title="Delete Node">
                <Trash2 size={14} />
             </button>}
        </div>
        )}
        
        {/* Learn Mode: Picking Indicator Text */}
        {isPickingSource && (
             <div className="absolute -top-8 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce whitespace-nowrap z-30 pointer-events-none">
                 👇 Ambil nilai anak
             </div>
        )}

        {/* Alpha Beta Values */}
        {/* If Learn Mode: Input Fields */}
        {isLearnMode && !isPruned ? (
             <div className="w-[90%] flex gap-1 mt-1 z-20" onClick={e => e.stopPropagation()}>
                 <input 
                    value={learnAlpha || ''} 
                    onChange={e => onLearnAlphaBetaChange?.(node.id, 'alpha', e.target.value)}
                    placeholder="α"
                    className="w-1/2 h-5 text-[10px] text-center bg-background border border-border rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    title="Alpha"
                    disabled={isPruned}
                 />
                 <input 
                    value={learnBeta || ''} 
                    onChange={e => onLearnAlphaBetaChange?.(node.id, 'beta', e.target.value)}
                    placeholder="β"
                    className="w-1/2 h-5 text-[10px] text-center bg-background border border-border rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    title="Beta"
                    disabled={isPruned}
                 />
             </div>
        ) : (
             // Simulate Mode: Display Values
             (alpha !== undefined || beta !== undefined) && !isPruned && (
                <div className="flex gap-2 text-[9px] font-mono mt-0.5 opacity-80">
                    <span title="Alpha" className="text-blue-600 dark:text-blue-400">α:{formatVal(animatedAlpha)}</span>
                    <span title="Beta" className="text-red-600 dark:text-red-400">β:{formatVal(animatedBeta)}</span>
                </div>
            )
        )}
      </div>
    </div>
  );
};
