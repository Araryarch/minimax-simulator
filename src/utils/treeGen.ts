import { TreeNode } from '../types/tree';

export const generateTree = (depth: number, branchingFactor: number): TreeNode => {
  let nodeIdCounter = 0;

  const createNode = (currentDepth: number, isMax: boolean): TreeNode => {
    const node: TreeNode = {
      id: `node-${nodeIdCounter++}`,
      value: null,
      children: [],
      isMaxNode: isMax,
    };

    if (currentDepth === depth) {
      node.value = Math.floor(Math.random() * 100) - 50; // Random value -50 to 50
      return node;
    }

    for (let i = 0; i < branchingFactor; i++) {
        // Simple logic to add variance: some nodes might have fewer children
        if (Math.random() > 0.1) {
            node.children.push(createNode(currentDepth + 1, !isMax));
        }
    }
    
    // Ensure at least one child if not leaf, unless randomness removed all (rare)
    if (node.children.length === 0 && currentDepth < depth) {
         node.children.push(createNode(currentDepth + 1, !isMax));
    }

    return node;
  };

  return createNode(0, true); // Root is usually Max
};
