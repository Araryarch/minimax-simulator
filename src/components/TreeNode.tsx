import React from 'react';
import { LayoutNode } from '@/lib/utils/layout';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

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
}

export const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  activeId,
  visitedIds,
  isPruned,
  value,
  alpha,
  beta,
  onNodeClick,
  onNodeContextMenu,
  ...props
}) => {
  const isActive = activeId === node.id;
  const isVisited = visitedIds?.includes(node.id);

  const baseClass = "tree-node";
  const activeClass = isActive ? "active" : "";
  const visitedClass = isVisited ? "visited" : "";
  const prunedClass = isPruned ? "pruned" : "";
  const typeClass = node.isMaxNode ? "max-node" : "min-node";

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
    if (!props.isRoot) {
        props.onDeleteNode(node.id);
    }
  };

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className={`${baseClass} ${activeClass} ${visitedClass} ${prunedClass} ${typeClass}`}
      onMouseDown={props.onMouseDown}
    >
      <circle r={50} fill="transparent" /> {/* Hit area */}

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

      {/* Value - Animated */}
      {!isPruned && (
        <foreignObject x={-30} y={-12} width={60} height={30}>
          <div className="flex items-center justify-center h-full">
            <span 
              className={`node-value text-[16px] font-bold transition-all duration-200 ${
                value !== undefined ? 'scale-110 text-primary' : ''
              }`}
              style={{ color: 'hsl(var(--foreground))' }}
            >
              {value !== undefined ? value : ((node.value !== null) ? node.value : '?')}
            </span>
          </div>
        </foreignObject>
      )}
      
      {/* Alpha Beta - Animated */}
      {(alpha !== undefined || beta !== undefined) && !isPruned && (
        <foreignObject x={-50} y={32} width={100} height={24}>
          <div className="flex items-center justify-center gap-2 text-[11px] font-medium">
            {alpha !== undefined && (
              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 transition-all duration-200">
                α:{alpha === Infinity ? '∞' : alpha === -Infinity ? '-∞' : alpha}
              </span>
            )}
            {beta !== undefined && (
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 transition-all duration-200">
                β:{beta === Infinity ? '∞' : beta === -Infinity ? '-∞' : beta}
              </span>
            )}
          </div>
        </foreignObject>
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
              </div>
            </foreignObject>
          </g>
        );
      })()}
    </g>
  );
};
