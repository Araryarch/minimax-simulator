import { TreeNode, SimulationStep, StepType } from '@/types/tree';

export function* minimax(
  node: TreeNode,
  depth: number,
  isMax: boolean,
  path: string[] = [],
  reverse: boolean = false
): Generator<SimulationStep, number, void> {
  const currentPath = [...path, node.id];

  yield {
    id: `visit-${node.id}`,
    type: StepType.VISIT,
    nodeId: node.id,
    description: `Mengunjungi Node ${node.id}`,
    visitedIds: [...currentPath],
    activePath: currentPath,
  };

  if (depth === 0 || node.children.length === 0) {
    const val = node.value ?? 0;
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
  
  const childrenToVisit = reverse ? [...node.children].reverse() : node.children;

  for (const child of childrenToVisit) {
    const childValue: number = yield* minimax(child, depth - 1, !isMax, currentPath, reverse);

    if (isMax) {
      bestValue = Math.max(bestValue, childValue);
    } else {
      bestValue = Math.min(bestValue, childValue);
    }

    const bestValStr = bestValue === Infinity ? '\u221E' : (bestValue === -Infinity ? '-\u221E' : bestValue);
    
    yield {
      id: `update-${node.id}-${child.id}`,
      type: StepType.UPDATE_BOUNDS,
      nodeId: node.id,
      description: `Perbarui nilai ${isMax ? 'Max' : 'Min'} jadi ${bestValStr} dari anak ${child.id}`,
      currentValue: bestValue,
      visitedIds: [...currentPath],
      activePath: currentPath,
    };
  }

  const valStr = bestValue === Infinity ? '\u221E' : (bestValue === -Infinity ? '-\u221E' : bestValue);

  yield {
    id: `backtrack-${node.id}`,
    type: StepType.BACKTRACK,
    nodeId: node.id,
    description: `Selesai memproses ${node.id}. Nilai Akhir: ${valStr}`,
    currentValue: bestValue,
    visitedIds: [...currentPath],
    activePath: currentPath.slice(0, -1),
  };

  return bestValue;
}
