import { TreeNode, SimulationStep, StepType } from '@/types/tree';

function getNodeLabel(node: TreeNode, depth: number): string {
  const type = node.isMaxNode ? 'MAX' : 'MIN';
  if (node.children.length === 0) {
    return `Daun (nilai: ${node.value ?? '?'})`;
  }
  if (depth === 0) {
    return `Root (${type})`;
  }
  return `Node ${type} level ${depth}`;
}

export function* minimax(
  node: TreeNode,
  depth: number,
  isMax: boolean,
  path: string[] = [],
  reverse: boolean = false,
  treeDepth: number = 0
): Generator<SimulationStep, number, void> {
  const currentPath = [...path, node.id];
  const nodeLabel = getNodeLabel(node, treeDepth);

  yield {
    id: `visit-${node.id}`,
    type: StepType.VISIT,
    nodeId: node.id,
    description: `Mengunjungi ${nodeLabel}`,
    visitedIds: [...currentPath],
    activePath: currentPath,
  };

  if (depth === 0 || node.children.length === 0) {
    const val = node.value ?? 0;
    yield {
      id: `eval-${node.id}`,
      type: StepType.EVALUATE,
      nodeId: node.id,
      description: `Evaluasi daun: nilai = ${val}`,
      currentValue: val,
      visitedIds: [...currentPath],
      activePath: currentPath,
    };
    return val;
  }

  let bestValue = isMax ? -Infinity : Infinity;
  
  const childrenToVisit = reverse ? [...node.children].reverse() : node.children;
  let childIndex = 0;

  for (const child of childrenToVisit) {
    childIndex++;
    const childValue: number = yield* minimax(child, depth - 1, !isMax, currentPath, reverse, treeDepth + 1);

    const prevBest = bestValue;
    if (isMax) {
      bestValue = Math.max(bestValue, childValue);
    } else {
      bestValue = Math.min(bestValue, childValue);
    }

    const bestValStr = bestValue === Infinity ? '∞' : (bestValue === -Infinity ? '-∞' : bestValue);
    const comparison = isMax ? 'max' : 'min';
    const updated = prevBest !== bestValue;
    
    yield {
      id: `update-${node.id}-${child.id}`,
      type: StepType.UPDATE_BOUNDS,
      nodeId: node.id,
      description: updated 
        ? `${isMax ? 'MAX' : 'MIN'}: Anak ke-${childIndex} = ${childValue}, perbarui nilai jadi ${bestValStr}`
        : `${isMax ? 'MAX' : 'MIN'}: Anak ke-${childIndex} = ${childValue}, tetap ${bestValStr}`,
      currentValue: bestValue,
      visitedIds: [...currentPath],
      activePath: currentPath,
    };
  }

  const valStr = bestValue === Infinity ? '∞' : (bestValue === -Infinity ? '-∞' : bestValue);

  yield {
    id: `backtrack-${node.id}`,
    type: StepType.BACKTRACK,
    nodeId: node.id,
    description: `Kembali ke parent dengan nilai ${valStr}`,
    currentValue: bestValue,
    visitedIds: [...currentPath],
    activePath: currentPath.slice(0, -1),
  };

  return bestValue;
}
