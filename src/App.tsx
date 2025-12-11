import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import './components/TreeComponents.css';
import { TreeCanvas } from './components/TreeCanvas';
import { Controls } from './components/Controls';
import { generateTree } from './utils/treeGen';
import { TreeNode, SimulationStep, StepType } from './types/tree';
import { minimax } from './algorithms/minimax';
import { alphaBeta } from './algorithms/alphaBeta';

import { EditNodeModal } from './components/EditNodeModal';

function App() {
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms delay
  const [algorithm, setAlgorithm] = useState<'minimax' | 'alphabeta'>('minimax');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeValue, setEditingNodeValue] = useState<number | null>(null);

  // Refs for interval management
  const playTimer = useRef<NodeJS.Timeout | number | null>(null);

// ... (Effect hooks remain the same) ...

  const handleGenerateTree = () => {
      // Create a nice random tree
      const newRoot = generateTree(3, 2); // Depth 3, Branching 2
      setRoot(newRoot);
  };

// ... (Playback Logic remains the same) ...

  const addChild = (parentId: string) => {
      // ... (Same add child logic)
      if (!root) return;
      const clone = JSON.parse(JSON.stringify(root));
      
      const findAndAdd = (node: TreeNode) => {
          if (node.id === parentId) {
              const newChild: TreeNode = {
                  id: `node-${Math.random().toString(36).substr(2, 5)}`,
                  value: Math.floor(Math.random() * 50),
                  children: [],
                  isMaxNode: !node.isMaxNode
              };
              node.children.push(newChild);
              node.value = null; 
          } else {
              node.children.forEach(findAndAdd);
          }
      };
      findAndAdd(clone);
      setRoot(clone);
  };

  const openEditModal = (nodeId: string) => {
      if (!root) return;
      // Find current value
      const findNode = (n: TreeNode): TreeNode | undefined => {
          if (n.id === nodeId) return n;
          for (const c of n.children) {
              const res = findNode(c);
              if (res) return res;
          }
      };
      
      const node = findNode(root);
      if (node && node.children.length === 0) { // Only edit leaves for now
          setEditingNodeId(nodeId);
          setEditingNodeValue(node.value);
          setIsModalOpen(true);
      } else {
          alert("Hanya node daun (leaf) yang bisa diedit nilainya.");
      }
  };

  const handleEditConfirm = (newVal: number) => {
      if (!root || !editingNodeId) return;
      
      const clone = JSON.parse(JSON.stringify(root));
      const updateNode = (n: TreeNode) => {
          if (n.id === editingNodeId) {
              n.value = newVal;
          } else {
              n.children.forEach(updateNode);
          }
      };
      updateNode(clone);
      setRoot(clone);
  };

  return (
    <div className="app-layout">
      {/* ... Sidebar ... */}
      <div className="sidebar">
          <h1>Simulator Minimax</h1>
          <Controls 
             currentStep={currentStepIndex}
             totalSteps={steps.length}
             isPlaying={isPlaying}
             onPlay={() => { 
                 if (currentStepIndex >= steps.length - 1) setCurrentStepIndex(-1);
                 setIsPlaying(true); 
             }}
             onPause={() => setIsPlaying(false)}
             onNext={nextStep}
             onPrev={() => setCurrentStepIndex(p => Math.max(-1, p - 1))}
             onReset={() => { setIsPlaying(false); setCurrentStepIndex(-1); }}
             playbackSpeed={playbackSpeed}
             onSpeedChange={setPlaybackSpeed}
             algorithm={algorithm}
             onAlgorithmChange={setAlgorithm}
             onGenerateTree={handleGenerateTree}
          />
          
          <div className="log-panel">
              <h3>Log Simulasi</h3>
              <div className="logs">
                  {steps.map((s, i) => (
                      <div 
                        key={s.id} 
                        className={`log-item ${i === currentStepIndex ? 'active' : ''}`}
                        onClick={() => {
                            setIsPlaying(false);
                            setCurrentStepIndex(i);
                        }}
                      >
                          <span className="step-num">{i+1}.</span>
                          <span className="step-desc">{s.description}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
      
      <div className="main-canvas">
         {root && (
             <TreeCanvas 
                root={root} 
                simulationState={currentSimulationState}
                onAddChild={addChild}
                onEditNode={openEditModal}
             />
         )}
      </div>

      <EditNodeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleEditConfirm}
        initialValue={editingNodeValue}
      />
    </div>
  );
}

export default App;
