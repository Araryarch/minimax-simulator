
import { TreeNode } from '../../types/tree';
import { minimax } from './minimax';
import { alphaBeta } from './alphaBeta';
import { StepType } from '../../types/tree';

// Helper to create leaf
const leaf = (id: string, value: number): TreeNode => ({
    id,
    value,
    children: [],
    isMaxNode: false // Leaf doesn't really matter, parent determines max/min usually, but let's be consistent
});

// Helper to create node
const node = (id: string, children: TreeNode[], isMaxNode: boolean): TreeNode => ({
    id,
    value: null,
    children,
    isMaxNode
});

// Test Case 1: Simple Tree
//       Root (Max)
//      /      \
//   A(Min)    B(Min)
//   /  \      /   \
//  3    5    2     9

const testTree1: TreeNode = node('root', [
    node('A', [leaf('L1', 3), leaf('L2', 5)], false),
    node('B', [leaf('L3', 2), leaf('L4', 9)], false)
], true);

// Test Case 2: Deep Pruning
// Root(Max)
// A(Min) -> 3
// B(Min) -> [2, 9] (Should prune after 2)
// This is effectively the same as above but explicitly checking pruning count.

function runMinimaxTest() {
    console.log("--- Testing Minimax ---");
    const gen = minimax(testTree1, 10, true, [], false, 0);
    let result;
    let steps = 0;
    for (const step of gen) {
        steps++;
        if (typeof step === 'number') { // Should not differ
             // Generator returns value at end, but we iterate yields.
             // The return value is not "yielded" in standard for..of loop unless we capture it?
             // Ah, for..of loop iterates yielded values. The return value is ignored in for..of.
             // But my generator yields the final result?
             // Let's check minimax.ts: yield { BACKTRACK ... currentValue: bestValue }; return bestValue;
             // We can get the final value from the last BACKTRACK step or verify the return.
        }
        if (step.type === StepType.BACKTRACK && step.nodeId === 'root') {
             result = step.currentValue;
        }
    }
    
    if (result === 3) {
        console.log("PASS: Minimax Result is 3");
    } else {
        console.error(`FAIL: Minimax Result is ${result}, expected 3`);
    }
}

function runAlphaBetaTest() {
    console.log("\n--- Testing Alpha-Beta ---");
    const gen = alphaBeta(testTree1, 10, -Infinity, Infinity, true, [], false, 0);
    let result;
    let visitedNodes = new Set<string>();
    let pruneCount = 0;

    for (const step of gen) {
        if (step.nodeId) visitedNodes.add(step.nodeId);
        if (step.type === StepType.PRUNE) pruneCount++;
        if (step.type === StepType.BACKTRACK && step.nodeId === 'root') {
            result = step.currentValue;
        }
    }

    if (result === 3) {
         console.log("PASS: Alpha-Beta Result is 3");
    } else {
         console.error(`FAIL: Alpha-Beta Result is ${result}, expected 3`);
    }

    // Validation for Pruning
    // A visits 3, 5 -> A=3. Root Alpha becomes 3.
    // B visits 2. B=2. Beta becomes 2.
    // Check Root Alpha (3) >= Beta (2)? No, checking happens in Child? 
    // Wait.
    // At B (Min node): 
    // Passes Alpha=3, Beta=Inf. 
    // Function start: Alpha=3, Beta=Inf.
    // Loop child '2'. Returns 2.
    // isMax=False. value = min(Inf, 2) = 2. Beta=min(Inf, 2) = 2.
    // check Alpha (3) >= Beta (2)? YES. Prune.
    // Child '9' (node id L4) should NOT be visited.
    
    if (pruneCount > 0) {
        console.log("PASS: Pruning occurred");
    } else {
        console.error("FAIL: No pruning occurred");
    }

    if (!visitedNodes.has('L4')) { // L4 is the node with value 9
        console.log("PASS: Node with value 9 was correctly pruned (not visited)");
    } else {
        console.error("FAIL: Node with value 9 was visited but should have been pruned");
    }
}

runMinimaxTest();
runAlphaBetaTest();
