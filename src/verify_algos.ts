import { minimax } from './algorithms/minimax';
import { alphaBeta } from './algorithms/alphaBeta';
import { TreeNode } from './types/tree';

console.log("Starting verification...");


// Helper to create leaf
const leaf = (id: string, value: number, isMax: boolean): TreeNode => ({
  id,
  value,
  children: [],
  isMaxNode: isMax
});

// Helper to create node
const node = (id: string, children: TreeNode[], isMax: boolean): TreeNode => ({
  id,
  value: null,
  children,
  isMaxNode: isMax
});

// Test Case 1: Simple Tree
//       Max (Root)
//      /   \
//    Min    Min
//   / \    /  \
//  3   5  2    9
//
// Minimax:
// Left Min: min(3, 5) = 3
// Right Min: min(2, 9) = 2
// Root Max: max(3, 2) = 3
const testSimpleTree = () => {
    const tree = node('root', [
        node('L', [leaf('L1', 3, true), leaf('L2', 5, true)], false),
        node('R', [leaf('R1', 2, true), leaf('R2', 9, true)], false)
    ], true);

    const gen = minimax(tree, 10, true);
    let result: number | undefined;
    for (const step of gen) {
         if (step.currentValue !== undefined) result = step.currentValue;
    }
    
    if (result === 3) {
        console.log("PASS: Simple Tree Minimax (Expected 3, Got 3)");
    } else {
        console.error(`FAIL: Simple Tree Minimax (Expected 3, Got ${result})`);
    }

    const genAB = alphaBeta(tree, 10, -Infinity, Infinity, true);
    let resultAB: number | undefined;
    for (const step of genAB) {
        if (step.currentValue !== undefined) resultAB = step.currentValue;
    }

    if (resultAB === 3) {
        console.log("PASS: Simple Tree AlphaBeta (Expected 3, Got 3)");
    } else {
         console.error(`FAIL: Simple Tree AlphaBeta (Expected 3, Got ${resultAB})`);
    }
};

// Test Case 2: Deep Pruning
//       Max (A)
//      /   \
//    Min(B) Min(C)
//    / \      \
//   D   E      F
//  / \ / \    / \
// 2  3 5  9  0   1
//
// Actually simpler pruning case:
//      Max
//     /   \
//   Min   Min
//   / \   / \
//  3  5  6  9
//
// Left Min -> min(3, 5) = 3.
// Root Alpha becomes 3.
// Right Min visits 6. 6 > 3? No. Min will try to minimize.
// Actually, if Right child is 6. Min current val = 6.
// Can Min provide something < 3? Yes. 
// Can Min provide something > 3? Min wants minimal. 
// If min finds 2 (next child), it becomes 2. 2 < 3. 
// If min finds 10, it stays 6 (or whatever previous best). 
// Let's use standard example.
//       Max
//      /   \
//    Min   Min (Prune Target)
//    / \   / \
//   5  6  7   4
// Min1: min(5, 6) = 5. Root Max >= 5. Alpha = 5.
// Min2: visits 7. value = 7. 
//       visits 4. value = 4. min(7, 4) = 4.
// Root Max: max(5, 4) = 5.
// Pruning check:
// Min2 visits 7. Current val = 7. Alpha=5, Beta=Inf. 
//   (Min updates beta). 7 < Inf. Beta=7.
// Min2 visits 4. Current val = 4. 4 < 7. Beta=4. 
//   Backtrack Min2 -> 4.
//   Root Max -> max(5, 4) = 5.
//
// Let's force a prune.
//       Max
//      /   \
//    Min   Min
//    / \   / \
//   5  6  4   ? (Should not visit)
//
// Min1: min(5, 6) = 5. Alpha = 5.
// Min2: Visits 4. 4 < 5 (Alpha).
//       Min node can only lower the value (<= 4).
//       Max node already has 5 guaranteed from left.
//       Max will never choose Right path because it's <= 4.
//       So ? should be pruned.

const testPruning = () => {
    const tree = node('root', [
        node('L', [leaf('L1', 5, true), leaf('L2', 6, true)], false),
        node('R', [leaf('R1', 4, true), leaf('R2', 100, true)], false)
    ], true);

    const genAB = alphaBeta(tree, 10, -Infinity, Infinity, true);
    let steps: any[] = [];
    let finalVal = 0;
    for (const step of genAB) {
        steps.push(step);
        if (step.currentValue !== undefined) finalVal = step.currentValue;
    }

    if (finalVal === 5) {
         console.log("PASS: Pruning Tree Value (Expected 5, Got 5)");
    } else {
         console.error(`FAIL: Pruning Tree Value (Expected 5, Got ${finalVal})`);
    }

    // Check if node 100 was visited
    const visited100 = steps.some(s => s.nodeId === 'R2' && s.type === 'VISIT');
    if (!visited100) {
        console.log("PASS: Pruning Check (Node R2 correctly pruned/not visited)");
    } else {
        console.error("FAIL: Pruning Check (Node R2 was visited but should have been pruned)");
    }
};

testSimpleTree();
testPruning();
