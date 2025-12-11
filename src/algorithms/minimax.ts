import { TreeNode, SimulationStep, StepType } from '../types/tree';

export function* minimax(
  node: TreeNode,
  depth: number,
  isMax: boolean,
  path: string[] = []
): Generator<SimulationStep, number, void> {
  const currentPath = [...path, node.id];

  // 1. Visit Node
  yield {
    id: `visit-${node.id}`,
    type: StepType.VISIT,
    nodeId: node.id,
    description: `Mengunjungi Node ${node.id}`,
    visitedIds: [...currentPath],
    activePath: currentPath,
  };

  // Base Case: Leaf Node or Max Depth
  if (depth === 0 || node.children.length === 0) {
    const val = node.value ?? 0; // Default to 0 if null (shouldn't happen for leaves)
    yield {
      id: `eval-${node.id}`,
      type: StepType.EVALUATE,
      nodeId: node.id,
      description: `Daun dievaluasi: ${val}`,
      currentValue: val,
      visitedIds: [...currentPath],
      activePath: currentPath,
    };
    return val;
  }

  let bestValue = isMax ? -Infinity : Infinity;

  for (const child of node.children) {
    // Recurse
    const childValue: number = yield* minimax(child, depth - 1, !isMax, currentPath);

    // Update Best Value
    if (isMax) {
      bestValue = Math.max(bestValue, childValue);
    } else {
      bestValue = Math.min(bestValue, childValue);
    }

    // Report Update
    yield {
      id: `update-${node.id}-${child.id}`,
      type: StepType.UPDATE_BOUNDS,
      nodeId: node.id,
      description: `Perbarui nilai ${isMax ? 'Max' : 'Min'} jadi ${bestValue} dari anak ${child.id}`,
      currentValue: bestValue,
      visitedIds: [...currentPath],
      activePath: currentPath,
    };
  }

  yield {
    id: `backtrack-${node.id}`,
    type: StepType.BACKTRACK,
    nodeId: node.id,
    description: `Selesai memproses ${node.id}. Nilai Akhir: ${bestValue}`,
    currentValue: bestValue,
    visitedIds: [...currentPath],
    activePath: currentPath.slice(0, -1),
  };

  return bestValue;
}
