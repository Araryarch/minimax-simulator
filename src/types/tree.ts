export interface TreeNode {
  id: string;
  value: number | null; 
  children: TreeNode[];
  isMaxNode: boolean; 
  alpha?: number; 
  beta?: number; 
  isPruned?: boolean; 
}

export type TreeEdge = {
  source: string;
  target: string;
};

export enum StepType {
  VISIT = 'VISIT',
  EVALUATE = 'EVALUATE',
  UPDATE_BOUNDS = 'UPDATE_BOUNDS',
  PRUNE = 'PRUNE',
  BACKTRACK = 'BACKTRACK',
  FINISHED = 'FINISHED',
}

export interface SimulationStep {
  id: string; 
  type: StepType;
  nodeId: string;
  description: string;
  currentValue?: number; 
  alpha?: number;
  beta?: number;
  visitedIds: string[]; 
  activePath: string[]; 
}
