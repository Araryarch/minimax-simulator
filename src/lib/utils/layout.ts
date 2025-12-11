import { TreeNode } from '@/types/tree';

export interface LayoutNode extends TreeNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const calculateTreeLayout = (
  root: TreeNode,
  width: number,
  height: number,
  nodeSize = 50,
  levelHeight = 120
): { nodes: LayoutNode[]; width: number; height: number } => {
  const nodes: LayoutNode[] = [];
  
  const levels: TreeNode[][] = [];
  const traverse = (node: TreeNode, depth: number) => {
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push(node);
    node.children.forEach(c => traverse(c, depth + 1));
  };
  traverse(root, 0);

  const getLeafCount = (node: TreeNode): number => {
    if (node.children.length === 0) return 1;
    return node.children.reduce((acc, c) => acc + getLeafCount(c), 0);
  };

  const leafCount = getLeafCount(root);
  const totalWidth = leafCount * (nodeSize * 2); 
  const totalHeight = levels.length * levelHeight;

  let currentLeafIndex = 0;
  
  const layout = (node: TreeNode, depth: number): number => {
      let x = 0;
      if (node.children.length === 0) {
          x = currentLeafIndex * (nodeSize * 2.5) + (nodeSize / 2);
          currentLeafIndex++;
      } else {
        const childrenX = node.children.map(c => layout(c, depth + 1));
        const minX = Math.min(...childrenX);
        const maxX = Math.max(...childrenX);
        x = (minX + maxX) / 2;
      }

    nodes.push({
        ...node,
        x,
        y: depth * levelHeight + 50,
        width: nodeSize,
        height: nodeSize
    });

    return x;
  };

  layout(root, 0);
  
  return { nodes, width: totalWidth, height: totalHeight };
};
