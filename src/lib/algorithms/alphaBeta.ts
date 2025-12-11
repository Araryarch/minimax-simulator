import { TreeNode, SimulationStep, StepType } from '@/types/tree';

export function* alphaBeta(
  node: TreeNode,
  depth: number,
  alpha: number,
  beta: number,
  isMax: boolean,
  path: string[] = [],
  reverse: boolean = false
): Generator<SimulationStep, number, void> {
  const currentPath = [...path, node.id];

  yield {
    id: `visit-${node.id}`,
    type: StepType.VISIT,
    nodeId: node.id,
    description: `Mengunjungi ${node.id} [\u03B1=${alpha === -Infinity ? '-\u221E' : alpha}, \u03B2=${beta === Infinity ? '\u221E' : beta}]`,
    alpha,
    beta,
    visitedIds: [...currentPath],
    activePath: currentPath,
  };

  if (depth === 0 || node.children.length === 0) {
    const val = node.value ?? 0;
    yield {
      id: `eval-${node.id}`,
      type: StepType.EVALUATE,
      nodeId: node.id,
      description: `Evaluasi Daun: ${val}`,
      currentValue: val,
      alpha,
      beta,
      visitedIds: [...currentPath],
      activePath: currentPath,
    };
    return val;
  }

  let value = isMax ? -Infinity : Infinity;

  const childrenToVisit = reverse ? [...node.children].reverse() : node.children;

  for (const child of childrenToVisit) {
    const childValue: number = yield* alphaBeta(child, depth - 1, alpha, beta, !isMax, currentPath, reverse);

    if (isMax) {
      value = Math.max(value, childValue);
      alpha = Math.max(alpha, value);
    } else {
      value = Math.min(value, childValue);
      beta = Math.min(beta, value);
    }

    const alphaStr = alpha === -Infinity ? '-\u221E' : (alpha === Infinity ? '\u221E' : alpha);
    const betaStr = beta === Infinity ? '\u221E' : (beta === -Infinity ? '-\u221E' : beta);
    const valStr = value === Infinity ? '\u221E' : (value === -Infinity ? '-\u221E' : value);

    yield {
      id: `update-${node.id}-${child.id}`,
      type: StepType.UPDATE_BOUNDS,
      nodeId: node.id,
      description: `Update batas: Nilai=${valStr}, \u03B1=${alphaStr}, \u03B2=${betaStr}`,
      currentValue: value,
      alpha,
      beta,
      visitedIds: [...currentPath],
      activePath: currentPath,
    };

    if (alpha >= beta) {
      yield {
        id: `prune-${node.id}`,
        type: StepType.PRUNE,
        nodeId: node.id,
        description: `PANGKAS (PRUNE)! \u03B1 (${alphaStr}) >= \u03B2 (${betaStr})`,
        alpha,
        beta,
        visitedIds: [...currentPath],
        activePath: currentPath,
      };
      break; 
    }
  }

  yield {
    id: `backtrack-${node.id}`,
    type: StepType.BACKTRACK,
    nodeId: node.id,
    description: `Backtrack dari ${node.id}. Final: ${value}`,
    currentValue: value,
    alpha,
    beta,
    visitedIds: [...currentPath],
    activePath: currentPath.slice(0, -1),
  };

  return value;
}
