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

function formatValue(val: number): string {
  if (val === Infinity) return '∞';
  if (val === -Infinity) return '-∞';
  return val.toString();
}

function getPruneExplanation(
  isMax: boolean,
  alpha: number,
  beta: number,
  prunedCount: number,
  childValue: number
): string {
  const alphaStr = formatValue(alpha);
  const betaStr = formatValue(beta);
  
  if (isMax) {
    // MAX node pruning (beta cutoff)
    return `🚫 PEMANGKASAN BETA! ` +
      `Alpha (${alphaStr}) ≥ Beta (${betaStr}). ` +
      `Node MIN di atas sudah punya opsi ≤ ${betaStr}, ` +
      `jadi tidak akan memilih jalur ini yang sudah menghasilkan ≥ ${alphaStr}. ` +
      `${prunedCount} cabang DILEWATI karena tidak akan mengubah keputusan!`;
  } else {
    // MIN node pruning (alpha cutoff)
    return `🚫 PEMANGKASAN ALPHA! ` +
      `Alpha (${alphaStr}) ≥ Beta (${betaStr}). ` +
      `Node MAX di atas sudah punya opsi ≥ ${alphaStr}, ` +
      `jadi tidak akan memilih jalur ini yang sudah menghasilkan ≤ ${betaStr}. ` +
      `${prunedCount} cabang DILEWATI karena tidak akan mengubah keputusan!`;
  }
}

export function* alphaBeta(
  node: TreeNode,
  depth: number,
  alpha: number,
  beta: number,
  isMax: boolean,
  path: string[] = [],
  reverse: boolean = false,
  treeDepth: number = 0
): Generator<SimulationStep, number, void> {
  const currentPath = [...path, node.id];
  const nodeLabel = getNodeLabel(node, treeDepth);
  const alphaStr = formatValue(alpha);
  const betaStr = formatValue(beta);

  yield {
    id: `visit-${node.id}`,
    type: StepType.VISIT,
    nodeId: node.id,
    description: `Mengunjungi ${nodeLabel} [α=${alphaStr}, β=${betaStr}]`,
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
      description: `📊 Evaluasi daun: nilai = ${val}`,
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
  let childIndex = 0;
  let lastChildValue = 0;

  for (const child of childrenToVisit) {
    childIndex++;
    const childValue: number = yield* alphaBeta(child, depth - 1, alpha, beta, !isMax, currentPath, reverse, treeDepth + 1);
    lastChildValue = childValue;

    const prevValue = value;
    if (isMax) {
      value = Math.max(value, childValue);
      alpha = Math.max(alpha, value);
    } else {
      value = Math.min(value, childValue);
      beta = Math.min(beta, value);
    }

    const newAlphaStr = formatValue(alpha);
    const newBetaStr = formatValue(beta);
    const valStr = formatValue(value);
    const updated = prevValue !== value;

    yield {
      id: `update-${node.id}-${child.id}`,
      type: StepType.UPDATE_BOUNDS,
      nodeId: node.id,
      description: updated
        ? `${isMax ? '⬆️ MAX' : '⬇️ MIN'}: Anak ke-${childIndex} = ${childValue} → nilai diperbarui jadi ${valStr} | α=${newAlphaStr}, β=${newBetaStr}`
        : `${isMax ? '⬆️ MAX' : '⬇️ MIN'}: Anak ke-${childIndex} = ${childValue}, nilai tetap ${valStr} | α=${newAlphaStr}, β=${newBetaStr}`,
      currentValue: value,
      alpha,
      beta,
      visitedIds: [...currentPath],
      activePath: currentPath,
    };

    if (alpha >= beta) {
      const prunedCount = childrenToVisit.length - childIndex;
      const pruneExplanation = getPruneExplanation(isMax, alpha, beta, prunedCount, childValue);
      
      yield {
        id: `prune-${node.id}`,
        type: StepType.PRUNE,
        nodeId: node.id,
        description: pruneExplanation,
        alpha,
        beta,
        visitedIds: [...currentPath],
        activePath: currentPath,
      };
      break; 
    }
  }

  const finalValStr = formatValue(value);

  yield {
    id: `backtrack-${node.id}`,
    type: StepType.BACKTRACK,
    nodeId: node.id,
    description: `↩️ Kembali ke parent dengan nilai ${finalValStr}`,
    currentValue: value,
    alpha,
    beta,
    visitedIds: [...currentPath],
    activePath: currentPath.slice(0, -1),
  };

  return value;
}
