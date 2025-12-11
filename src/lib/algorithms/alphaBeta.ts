import { TreeNode, SimulationStep, StepType } from '@/types/tree';

function formatValue(val: number): string {
  if (val === Infinity) return '\\infty';
  if (val === -Infinity) return '-\\infty';
  return val.toString();
}

function getPruneExplanation(
  isMax: boolean,
  alpha: number,
  beta: number,
  prunedCount: number
): string {
  const alphaStr = formatValue(alpha);
  const betaStr = formatValue(beta);
  
  if (isMax) {
    // MAX node pruning (beta cutoff)
    return `### ✂️ Pemangkasan Beta
Kondisi $\\alpha \\ge \\beta$ terpenuhi ($${alphaStr} \\ge ${betaStr}$).

| Sisi | Nilai |
|---|---|
| $\\alpha$ (Max) | $${alphaStr}$ |
| $\\beta$ (Parent Min) | $${betaStr}$ |

Node **PARENT (MIN)** tidak akan memilih cabang ini karena sudah memiliki opsi $\\le ${betaStr}$.
Apapun yang ditemukan MAX di sini $\\ge ${alphaStr}$ tidak akan dipilih oleh Parent.

**${prunedCount} cabang dipangkas.**`;
  } else {
    // MIN node pruning (alpha cutoff)
    return `### ✂️ Pemangkasan Alpha
Kondisi $\\alpha \\ge \\beta$ terpenuhi ($${alphaStr} \\ge ${betaStr}$).

| Sisi | Nilai |
|---|---|
| $\\alpha$ (Parent Max) | $${alphaStr}$ |
| $\\beta$ (Min) | $${betaStr}$ |

Node **PARENT (MAX)** tidak akan memilih cabang ini karena sudah memiliki opsi $\\ge ${alphaStr}$.
Apapun yang ditemukan MIN di sini $\\le ${betaStr}$ tidak akan dipilih oleh Parent.

**${prunedCount} cabang dipangkas.**`;
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
  const alphaStr = formatValue(alpha);
  const betaStr = formatValue(beta);
  const nodeType = isMax ? 'MAX' : 'MIN';

  yield {
    id: `visit-${node.id}`,
    type: StepType.VISIT,
    nodeId: node.id,
    description: `### Mengunjungi Node ${nodeType}
Membawa rentang pencarian:

| Parameter | Nilai |
|:---:|:---:|
| $\\alpha$ (Terbaik MAX) | $${alphaStr}$ |
| $\\beta$ (Terbaik MIN) | $${betaStr}$ |`,
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
      description: `### 📊 Evaluasi Daun
Nilai daun ditemukan: **${val}**
`,
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

  for (const child of childrenToVisit) {
    childIndex++;
    const childValue: number = yield* alphaBeta(child, depth - 1, alpha, beta, !isMax, currentPath, reverse, treeDepth + 1);

    const prevValue = value;
    const prevAlpha = alpha;
    const prevBeta = beta;
    let updated = false;

    if (isMax) {
      if (childValue > value) {
          value = childValue;
          updated = true;
      }
      alpha = Math.max(alpha, value);
    } else {
      if (childValue < value) {
          value = childValue;
          updated = true;
      }
      beta = Math.min(beta, value);
    }

    const valStr = formatValue(value);
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
| Bandingkan | $${childValStr} ${compareOp} ${formatValue(prevValue)}$ ? **${updated ? 'Ya' : 'Tidak'}** |
| Formula | $v = ${mathOp}(${formatValue(prevValue)}, ${childValStr})$ |
| **Hasil** | **$v = ${valStr}$** |
| Update Rentang | $\\alpha=${formatValue(alpha)}, \\beta=${formatValue(beta)}$ |`,
      currentValue: value,
      alpha,
      beta,
      visitedIds: [...currentPath],
      activePath: currentPath,
    };

    if (alpha >= beta) {
      const remainingChildren = childrenToVisit.length - childIndex;
      if (remainingChildren > 0) {
        yield {
          id: `prune-${node.id}`,
          type: StepType.PRUNE,
          nodeId: node.id,
          description: getPruneExplanation(isMax, alpha, beta, remainingChildren),
          currentValue: value,
          alpha,
          beta,
          visitedIds: [...currentPath],
          activePath: currentPath,
        };
        break; 
      }
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
