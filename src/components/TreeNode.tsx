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
          <rect x={-16} y={-10} width={32} height={20} rx={4} fill="hsl(var(--background))" stroke={node.isMaxNode ? "#ef4444" : "#3b82f6"} strokeWidth="1.5" />
          <text y={4} fontSize="10" textAnchor="middle" fill={node.isMaxNode ? "#ef4444" : "#3b82f6"} fontWeight="bold">
              {node.isMaxNode ? "MAX" : "MIN"}
          </text>
      </g>

      {/* Pruned X */}
      {isPruned && (
        <text y={8} fontSize="40" fill="#ef4444" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none', opacity: 0.9 }}>
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
                 <button onClick={handleAddClick} className="p-1 bg-blue-500 rounded-full text-white hover:scale-110 transition-transform shadow-sm" title="Add Child">
                    <PlusCircle size={16} />
                 </button>
                 {(node.children.length === 0 || value !== undefined) && (
                     <button onClick={handleEditClick} className="p-1 bg-amber-500 rounded-full text-white hover:scale-110 transition-transform shadow-sm" title="Edit Value">
                        <Pencil size={16} />
                     </button>
                 )}
                 {!props.isRoot && (
                    <button onClick={handleDeleteClick} className="p-1 bg-red-500 rounded-full text-white hover:scale-110 transition-transform shadow-sm" title="Delete Node">
                        <Trash2 size={16} />
                    </button>
                 )}
             </div>
         </foreignObject>
      </g>

      {/* Explanation Tooltip (Moved to end for Z-index within node group) */}
      {props.explanation && (
         <g transform="translate(0, -65)" style={{ pointerEvents: 'none' }}>
             <path d="M -60 -30 L 60 -30 L 60 10 L 10 10 L 0 20 L -10 10 L -60 10 Z" fill="hsl(var(--popover))" stroke="hsl(var(--primary))" strokeWidth="1" filter="drop-shadow(0 4px 6px rgb(0 0 0 / 0.3))" />
             <foreignObject x="-55" y="-25" width="110" height="35">
                <div className="flex items-center justify-center h-full text-[10px] text-center leading-tight p-1 text-popover-foreground font-medium">
                    {props.explanation}
                </div>
             </foreignObject>
         </g>
      )}
    </g>
  );
};
