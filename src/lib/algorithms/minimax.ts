import { TreeNode, SimulationStep, StepType } from '@/types/tree';

function formatValue(val: number): string {
  if (val === Infinity) return '\\infty';
  if (val === -Infinity) return '-\\infty';
  return val.toString();
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
  const nodeType = isMax ? 'MAX' : 'MIN';

  yield {
    id: `visit-${node.id}`,
    type: StepType.VISIT,
    nodeId: node.id,
    description: `### Mengunjungi Node ${nodeType}
Mencari nilai optimal untuk **${nodeType}**.

*   Jika **MAX**: Cari nilai terbesar dari anak.
*   Jika **MIN**: Cari nilai terkecil dari anak.`,
    visitedIds: [...currentPath],
    activePath: currentPath,
  };

  if (depth === 0 || node.children.length === 0) {
    const val = node.value ?? 0;
    yield {
      id: `eval-${node.id}`,
      type: StepType.EVALUATE,
      nodeId: node.id,
      description: `### 📊 Evaluasi Daun
Nilai daun ditemukan: **${val}**`,
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
    let updated = false;

    if (isMax) {
      if (childValue > bestValue) {
        bestValue = childValue;
        updated = true;
      }
    } else {
      if (childValue < bestValue) {
        bestValue = childValue;
        updated = true;
      }
    }

    const valStr = formatValue(bestValue);
    const childValStr = formatValue(childValue);
    const mathOp = isMax ? '\\max' : '\\min';
    const compareOp = isMax ? '>' : '<';

    yield {
      id: `update-${node.id}-${child.id}`,
      type: StepType.UPDATE_BOUNDS,
      nodeId: node.id,
      description: `### Update Nilai ${nodeType}
Menerima nilai **${childValStr}** dari anak.

| Kondisi | Perhitungan |
|---|---|
| Bandingkan | $${childValStr} ${compareOp} ${formatValue(prevBest)}$ ? **${updated ? 'Ya' : 'Tidak'}** |
| Formula | $v = ${mathOp}(${formatValue(prevBest)}, ${childValStr})$ |
| **Hasil** | **$v = ${valStr}$** |`,
      currentValue: bestValue,
      visitedIds: [...currentPath],
      activePath: currentPath,
    };
  }

  const valStr = formatValue(bestValue);

  yield {
    id: `backtrack-${node.id}`,
    type: StepType.BACKTRACK,
    nodeId: node.id,
    description: `### 🔙 Selesai
Node **${nodeType}** telah mengevaluasi semua anaknya.
Nilai akhir yang dikembalikan ke parent: **$${valStr}$**`,
    currentValue: bestValue,
    visitedIds: [...currentPath],
    activePath: currentPath.slice(0, -1),
  };

  return bestValue;
}
