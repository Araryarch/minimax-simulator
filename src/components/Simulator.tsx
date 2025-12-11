"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { TreeCanvas } from '@/components/TreeCanvas';
import { Controls } from '@/components/Controls';
import { EditNodeModal } from '@/components/EditNodeModal';
import { generateTree } from '@/lib/utils/treeGen';
import { TreeNode, SimulationStep, StepType } from '@/types/tree';
import { minimax } from '@/lib/algorithms/minimax';
import { alphaBeta } from '@/lib/algorithms/alphaBeta';
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import '@/components/TreeComponents.css'; // Keep the SVG styles
// import '@/lib/algorithms/validate_algo'; // Automatically run validation on import (optional)

export default function Simulator() {
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); 
  const [algorithm, setAlgorithm] = useState<'minimax' | 'alphabeta'>('minimax');
  const [traversalOrder, setTraversalOrder] = useState<'ltr' | 'rtl'>('ltr');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeValue, setEditingNodeValue] = useState<number | null>(null);

  const playTimer = useRef<NodeJS.Timeout | number | null>(null);

  // Tour State
  const mounted = useRef(false);

  // Initialize
  useEffect(() => {
    handleGenerateTree();
    
    // Start Tour on Mount
    if (!mounted.current) {
        mounted.current = true;
        
        // Dynamic import to avoid SSR issues with driver.js
        import('driver.js').then(({ driver }) => {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                steps: [
                    { 
                        element: '.main-canvas', 
                        popover: { 
                            title: 'Visualisasi Pohon Permainan', 
                            description: 'Ini adalah area utama di mana Anda bisa membangun dan melihat simulasi pohon permainan. Anda bisa menggeser (klik & drag) dan memperbesar/memperkecil (scroll) tampilan ini sesuka hati.' 
                        } 
                    },
                    { 
                        element: '.main-canvas svg g', 
                        popover: { 
                            title: 'Node & Struktur', 
                            description: 'Pohon terdiri dari Node MAX (Kotak Merah) dan Node MIN (Lingkaran Biru). Algoritma akan mencari nilai terbaik dari bawah ke atas.' 
                        } 
                    },
                    { 
                        element: '.node-actions', 
                        popover: { 
                            title: 'Edit Pohon Secara Interaktif', 
                            description: 'Arahkan kursor ke node mana saja! <br/>• Klik <b>(+)</b> untuk menambah anak cabang.<br/>• Klik <b>(Pensil)</b> untuk mengubah nilai (hanya di daun).<br/>• Klik <b>(Sampah)</b> untuk menghapus cabang.<br/>Gunakan tombol <b>Auto Layout</b> di pojok kanan bawah jika posisi berantakan.' 
                        } 
                    },
                    { 
                        element: '.algorithm-selector', 
                        popover: { 
                            title: 'Pilih Algoritma', 
                            description: 'Pilih algoritma yang ingin disimulasikan: <b>Minimax</b> (eksplorasi penuh) atau <b>Alpha-Beta Pruning</b> (lebih efisien dengan pemangkasan cabang yang tidak perlu).' 
                        } 
                    },
                    { 
                        element: '.simulation-controls', 
                        popover: { 
                            title: 'Kontrol Simulasi', 
                            description: 'Jalankan simulasi secara otomatis dengan <b>Play</b>, atau bedah langkah demi langkah dengan tombol <b>Next/Prev</b>. Anda juga bisa mengatur kecepatan animasi!' 
                        } 
                    },
                    { 
                        element: '.simulation-log', 
                        popover: { 
                            title: 'Log & Penjelasan Langkah', 
                            description: 'Setiap langkah algoritma dicatat di sini secara detail. Klik pada baris log mana saja untuk melompat kembali ke momen tersebut dan melihat keadaan pohon saat itu.' 
                        } 
                    },
                ]
            });
            
            // Small delay to ensure render
            setTimeout(() => {
                driverObj.drive();
            }, 1000);
        });
    }
  }, []);

  // Compute Simulation
  useEffect(() => {
      if (!root) return;
      
      const gen = algorithm === 'minimax' 
          ? minimax(root, 10, true, [], traversalOrder === 'rtl', 0) 
          : alphaBeta(root, 10, -Infinity, Infinity, true, [], traversalOrder === 'rtl', 0);

      const computedSteps: SimulationStep[] = [];
      for (const step of gen) {
          computedSteps.push(step as SimulationStep);
      }
      
      setSteps(computedSteps);
      if (currentStepIndex >= computedSteps.length) {
          setCurrentStepIndex(-1);
      }
      setIsPlaying(false);
  }, [root, algorithm, traversalOrder]);

  const handleGenerateTree = () => {
      const newRoot = generateTree(3, 2); 
      setRoot(newRoot);
      setCurrentStepIndex(-1);
  };

  // Playback Logic
  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => {
        if (prev < steps.length - 1) return prev + 1;
        setIsPlaying(false);
        return prev;
    });
  }, [steps.length]);

  useEffect(() => {
      if (isPlaying) {
          playTimer.current = setInterval(nextStep, playbackSpeed);
      } else {
          if (playTimer.current) clearInterval(playTimer.current as number);
      }
      return () => { if (playTimer.current) clearInterval(playTimer.current as number); };
  }, [isPlaying, playbackSpeed, nextStep]);

  // Derived State
  const currentSimulationState = (() => {
      if (currentStepIndex === -1 || !steps[currentStepIndex]) return {};
      
      const step = steps[currentStepIndex];
      const visitedIds = step.visitedIds;
      const activeId = step.nodeId;
      
      const currentValues: Record<string, number> = {};
      const alphaValues: Record<string, number> = {};
      const betaValues: Record<string, number> = {};
      const prunedIds: string[] = [];

      for (let i = 0; i <= currentStepIndex; i++) {
          const s = steps[i];
          if (s.currentValue !== undefined) currentValues[s.nodeId] = s.currentValue;
          if (s.alpha !== undefined) alphaValues[s.nodeId] = s.alpha;
          if (s.beta !== undefined) betaValues[s.nodeId] = s.beta;
          
          if (s.type === StepType.PRUNE) {
              if (root) {
                  // Reconstruct pruning logic similarly to before
                   const findNode = (n: TreeNode): TreeNode | undefined => {
                      if (n.id === s.nodeId) return n;
                      for (const c of n.children) {
                          const res = findNode(c);
                          if (res) return res;
                      }
                  };
                  const parent = findNode(root);
                  if (parent) {
                       const visitedSet = new Set(steps.slice(0, i+1).flatMap(st => st.visitedIds));
                       const markSubtreePruned = (n: TreeNode) => {
                           if (!visitedSet.has(n.id)) {
                               prunedIds.push(n.id);
                               n.children.forEach(markSubtreePruned);
                           }
                       };
                       parent.children.forEach(markSubtreePruned);
                  }
              }
          }
      }

      return {
          activeId,
          visitedIds,
          prunedIds,
          currentValues,
          alphaValues,
          betaValues,
          explanation: step?.description 
      };
  })();

  const addChild = (parentId: string) => {
      if (!root) return;
      const clone = JSON.parse(JSON.stringify(root));
      
      const findAndAdd = (node: TreeNode) => {
          if (node.id === parentId) {
              const newChild: TreeNode = {
                  id: `node-${Math.random().toString(36).substr(2, 5)}`,
                  value: null,
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
      findAndAdd(clone);
      setRoot(clone);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!root || root.id === nodeId) return; // Cannot delete root
    
    // Simple recursive delete
    const clone = JSON.parse(JSON.stringify(root));
    const deleteFrom = (node: TreeNode): boolean => {
        const index = node.children.findIndex(c => c.id === nodeId);
        if (index !== -1) {
            node.children.splice(index, 1);
            return true;
        }
        for (const child of node.children) {
            if (deleteFrom(child)) return true;
        }
        return false;
    };

    deleteFrom(clone);
    setRoot(clone);
  };

  const openEditModal = (nodeId: string) => {
      if (!root) return;
      const findNode = (n: TreeNode): TreeNode | undefined => {
          if (n.id === nodeId) return n;
          for (const c of n.children) {
              const res = findNode(c);
              if (res) return res;
          }
      };
      
      const node = findNode(root);
      if (node && node.children.length === 0) { 
          setEditingNodeId(nodeId);
          setEditingNodeValue(node.value);
          setIsModalOpen(true);
      } else {
          // Toast or simple alert
          toast.warning("Hanya node daun (leaf) yang bisa diedit nilainya.");
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
    <div className="flex w-full h-screen bg-background text-foreground overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 border-r border-border bg-card/50 backdrop-blur flex flex-col transition-all duration-300">
          <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                  <h1 className="text-xl font-bold tracking-tight text-primary">Simulator Minimax</h1>
                  <p className="text-xs text-muted-foreground mt-1">Interaktif & Visual</p>
              </div>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto simulation-sidebar">
              <div className="simulation-controls">
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
                   traversalOrder={traversalOrder}
                   onTraversalOrderChange={setTraversalOrder}
                />
              </div>
              
              <div className="mt-6 flex flex-col gap-2 simulation-log">
                  <h3 className="text-sm font-semibold px-1">Log Simulasi</h3>
                  <ScrollArea className="bg-muted/50 rounded-lg p-2 h-64 border border-border">
                      {steps.length === 0 && <span className="text-muted-foreground p-2 block text-xs">Belum ada simulasi.</span>}
                      {steps.map((s, i) => (
                          <div 
                            key={s.id} 
                            className={`p-2 rounded mb-1 cursor-pointer transition-colors text-xs font-mono border-l-2 ${i === currentStepIndex ? 'bg-primary/20 border-primary text-foreground shadow-sm' : 'border-transparent hover:bg-muted/80'}`}
                            onClick={() => {
                                setIsPlaying(false);
                                setCurrentStepIndex(i);
                            }}
                          >
                              <span className="font-bold opacity-70 mr-2">{i+1}.</span>
                              <span>{s.description}</span>
                          </div>
                      ))}
                  </ScrollArea>
              </div>
          </div>
      </aside>
      
      {/* Main Canvas */}
      <main className="flex-1 relative bg-dot-pattern">
         {root ? (
             <TreeCanvas 
                root={root} 
                simulationState={currentSimulationState}
                onAddChild={addChild}
                onEditNode={openEditModal}
                onDeleteNode={handleDeleteNode}
             />
         ) : (
             <div className="flex items-center justify-center h-full text-muted-foreground">
                 Loading Tree...
             </div>
         )}
      </main>

      <EditNodeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleEditConfirm}
        initialValue={editingNodeValue}
      />
    </div>
  );
}
