import React from 'react';
import { LayoutNode } from '@/lib/utils/layout';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
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

  // Styles
  const containerStyle = {
    left: node.x,
    top: node.y,
    width: node.width,
    height: node.height,
    position: 'absolute' as const,
  };

  // Determine Shape Appearance based on State
  // Colors mapped to theme variables
  const strokeClass = isActive 
     ? "stroke-primary stroke-[3px]" 
     : isVisited 
        ? "stroke-primary stroke-[2px]" 
        : "stroke-muted-foreground/40 stroke-[2px]";
    
  const fillClass = isActive 
     ? "fill-primary/10"
     : isPruned
        ? "fill-muted/50"
        : "fill-background";

  const pickingClass = isPickingSource ? "animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" : "";
  const hoverClass = isLearnMode ? "cursor-pointer" : "cursor-default";

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

  const formatVal = (v: number | undefined | null) => {
      if (v === Infinity) return '∞';
      if (v === -Infinity) return '-∞';
      if (v === undefined || v === null) return '';
      return Math.round(v * 100) / 100;
  };

  // Shape Dimensions
  const r = node.width / 2; // Radius for circle
  
  return (
    <div
      className={`tree-node select-none group focus:outline-none ${hoverClass}`}
      style={containerStyle}
      onClick={() => onNodeClick(node.id)}
      onContextMenu={(e) => {
          e.preventDefault();
          onNodeContextMenu(e, node.id);
      }}
      id={`node-${node.id}`}
    >
        {/* Visual Layer: SVG Background Shapes */}
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none transition-all duration-300">
            <g className={`${pickingClass} transition-all duration-300`}>
                {node.isMaxNode ? (
                    // MAX Node: Rectangle/Square
                    <rect 
                        x="0" 
                        y="0" 
                        width={node.width} 
                        height={node.height} 
                        rx="6" 
                        className={`transition-colors duration-300 ${strokeClass} ${fillClass}`}
                    />
                ) : (
                    // MIN Node: Circle
                    <circle 
                        cx={r} 
                        cy={r} 
                        r={r} 
                        className={`transition-colors duration-300 ${strokeClass} ${fillClass}`}
                    />
                )}
            </g>
        </svg>

<<<<<<< HEAD
      {/* Explanation Popup */}
      {explanation && !isLearnMode && (
          <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-max max-w-[350px] p-2.5 bg-popover/95 backdrop-blur text-popover-foreground rounded-xl shadow-xl border border-border z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                <MathRenderer content={explanation} compact={true} />
=======
      {/* Main Shape */}
      {node.isMaxNode ? (
          <rect x={-24} y={-24} width={48} height={48} rx={8} className="node-shape" />
      ) : (
          <circle r={26} className="node-shape" />
      )}

      {/* Type Badge */}
      <g transform="translate(0, -38)">
          <rect 
            x={-16} y={-10} width={32} height={20} rx={4} 
            fill="hsl(var(--background))" 
            stroke={node.isMaxNode ? "hsl(var(--destructive))" : "hsl(var(--primary))"} 
            strokeWidth="1.5" 
          />
          <text 
            y={4} fontSize="10" textAnchor="middle" 
            fill={node.isMaxNode ? "hsl(var(--destructive))" : "hsl(var(--primary))"} 
            fontWeight="bold"
          >
              {node.isMaxNode ? "MAX" : "MIN"}
          </text>
      </g>

      {/* Pruned X */}
      {isPruned && (
        <text y={8} fontSize="40" fill="hsl(var(--destructive))" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none', opacity: 0.9 }}>
            ✕
        </text>
      )}

      {/* Value */}
      {!isPruned && (
        <text y={6} textAnchor="middle" className="node-value" fontSize="16">
            {value !== undefined ? value : ((node.value !== null) ? node.value : '?')}
        </text>
      )}
      
      {/* Alpha Beta */}
      {(alpha !== undefined || beta !== undefined) && !isPruned && (
          <text y={42} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))" fontWeight="500">
              {alpha !== undefined ? `\u03B1:${alpha}` : ''} {beta !== undefined ? `\u03B2:${beta}` : ''}
          </text>
      )}



      {/* Actions */}
      <g className="node-actions opacity-0 hover:opacity-100 transition-opacity" transform="translate(35, -20)">
         <foreignObject width="60" height="60" style={{ overflow: 'visible' }}>
             <div className="flex flex-col gap-1">
                 <button onClick={handleAddClick} className="p-1 bg-primary text-primary-foreground rounded-full hover:scale-110 transition-transform shadow-sm" title="Add Child">
                    <PlusCircle size={16} />
                 </button>
                 {node.children.length === 0 && (
                     <button onClick={handleEditClick} className="p-1 bg-accent text-accent-foreground rounded-full hover:scale-110 transition-transform shadow-sm" title="Edit Value">
                        <Pencil size={16} />
                     </button>
                 )}
                 {!props.isRoot && (
                    <button onClick={handleDeleteClick} className="p-1 bg-destructive text-destructive-foreground rounded-full hover:scale-110 transition-transform shadow-sm" title="Delete Node">
                        <Trash2 size={16} />
                    </button>
                 )}
             </div>
         </foreignObject>
      </g>

      {/* Explanation Tooltip (Moved to end for Z-index within node group) */}
      {props.explanation && (() => {
        const textLen = props.explanation.length;
        const tooltipWidth = Math.min(Math.max(140, textLen * 4), 320);
        const tooltipHeight = Math.max(45, Math.ceil(textLen / 40) * 18 + 20);
        const halfWidth = tooltipWidth / 2;
        
        return (
          <g transform={`translate(0, ${-50 - tooltipHeight})`} style={{ pointerEvents: 'none' }}>
            <rect 
              x={-halfWidth} 
              y={0} 
              width={tooltipWidth} 
              height={tooltipHeight}
              rx={8}
              fill="hsl(var(--popover))" 
              stroke="hsl(var(--primary))" 
              strokeWidth="2"
              filter="drop-shadow(0 4px 12px rgb(0 0 0 / 0.4))"
            />
            {/* Arrow pointing down */}
            <path 
              d={`M -8 ${tooltipHeight} L 0 ${tooltipHeight + 10} L 8 ${tooltipHeight} Z`}
              fill="hsl(var(--popover))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            <foreignObject x={-halfWidth + 8} y={6} width={tooltipWidth - 16} height={tooltipHeight - 10}>
              <div className="text-[11px] text-center leading-snug p-1 text-popover-foreground font-medium">
                {props.explanation}
>>>>>>> parent of c6c6433 (fix: fix)
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-popover/95" />
          </div>
      )}

      {/* Content Layer */}
      <div className="relative flex flex-col items-center justify-center w-full h-full z-10">
        <span className="node-id absolute top-0.5 right-1.5 text-[8px] opacity-40 font-mono hidden group-hover:block">{node.id.slice(0, 4)}</span>
        
        {/* Pruning Indicator */}
        {isPruned && (
             <span className="absolute text-2xl opacity-80 pointer-events-none">❌</span>
        )}

        {/* Node Type Label */}
         {/* Optional: Restore label if needed, but shapes usually convey type */}
        {/* <span className="text-[7px] font-bold uppercase tracking-wider mb-0.5 opacity-60">
            {node.isMaxNode ? 'MAX' : 'MIN'}
        </span> */}

        {/* Main Value */}
        <div className="text-lg font-bold leading-none my-0.5 text-foreground">
             {isPickingSource && animatedValue === undefined ? (
                 <span className="text-yellow-500 animate-bounce">?</span>
             ) : (
                formatVal(animatedValue) || (isLearnMode && !isPruned ? <span className="text-muted-foreground/30 text-xs">-</span> : '')
             )}
        </div>

        {/* Controls Overlay (Only Simulate Mode & Hover) */}
        {!isLearnMode && !isPruned && (
        <div className="absolute -bottom-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-background/90 backdrop-blur rounded-full px-2 py-1 shadow-sm border border-border">
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

        {/* Alpha Beta Values / Inputs */}
        {isLearnMode && !isPruned ? (
             <div className="w-[120%] flex gap-0.5 justify-center mt-0.5 z-20" onClick={e => e.stopPropagation()}>
                 <input 
                    value={learnAlpha || ''} 
                    onChange={e => onLearnAlphaBetaChange?.(node.id, 'alpha', e.target.value)}
                    placeholder="α"
                    className="w-8 h-4 text-[9px] text-center bg-background/80 border border-border rounded-sm focus:border-primary focus:ring-0 outline-none p-0"
                    title="Alpha"
                    disabled={isPruned}
                 />
                 <input 
                    value={learnBeta || ''} 
                    onChange={e => onLearnAlphaBetaChange?.(node.id, 'beta', e.target.value)}
                    placeholder="β"
                    className="w-8 h-4 text-[9px] text-center bg-background/80 border border-border rounded-sm focus:border-primary focus:ring-0 outline-none p-0"
                    title="Beta"
                    disabled={isPruned}
                 />
             </div>
        ) : (
             // Simulate Mode: Display Values
             (alpha !== undefined || beta !== undefined) && !isPruned && (
                <div className="flex gap-1 text-[8px] font-mono mt-0.5 bg-background/50 rounded px-1 backdrop-blur-sm">
                    <span title="Alpha" className="text-blue-600 dark:text-blue-400 font-medium">α:{formatVal(animatedAlpha)}</span>
                    <span className="opacity-30">|</span>
                    <span title="Beta" className="text-red-600 dark:text-red-400 font-medium">β:{formatVal(animatedBeta)}</span>
                </div>
            )
        )}
      </div>
    </div>
  );
};
