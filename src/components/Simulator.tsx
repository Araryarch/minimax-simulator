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
import { Menu, X } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import '@/components/TreeComponents.css';

export default function Simulator() {
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); 
  const [algorithm, setAlgorithm] = useState<'minimax' | 'alphabeta'>('minimax');
  const [traversalOrder, setTraversalOrder] = useState<'ltr' | 'rtl'>('ltr');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeValue, setEditingNodeValue] = useState<number | null>(null);

  const playTimer = useRef<NodeJS.Timeout | number | null>(null);
  const logItemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Tour State
  const mounted = useRef(false);

  // Initialize
  useEffect(() => {
    handleGenerateTree(3, 2); // Default: 3 levels, 2 branches
    
    // Start Tour on Mount
    if (!mounted.current) {
        mounted.current = true;
        
        // Dynamic import to avoid SSR issues with driver.js
        import('driver.js').then(({ driver }) => {
            const isMobile = window.innerWidth < 768;
            
            const driverObj = driver({
                showProgress: true,
                animate: true,
                allowClose: true,
                overlayColor: 'rgba(0, 0, 0, 0.75)',
                steps: isMobile ? [
                    // Mobile Tour - Simpler
                    { 
                        popover: { 
                            title: 'Selamat Datang!', 
                            description: 'Simulator Minimax - visualisasi algoritma pencarian dalam teori permainan.' 
                        } 
                    },
                    { 
                        element: '.simulation-controls', 
                        popover: { 
                            title: 'Kontrol Simulasi', 
                            description: 'Pilih algoritma, atur kecepatan, dan kontrol jalannya simulasi di sini.',
                            side: 'bottom'
                        } 
                    },
                    { 
                        element: '.simulation-log', 
                        popover: { 
                            title: 'Log Langkah', 
                            description: 'Lihat penjelasan setiap langkah. Tap untuk lompat ke langkah tertentu.',
                            side: 'bottom'
                        } 
                    },
                    { 
                        popover: { 
                            title: 'Navigasi', 
                            description: 'Gunakan tombol panah di pojok kanan bawah untuk menggeser pohon, dan +/- untuk zoom.' 
                        } 
                    },
                ] : [
                    // Desktop Tour - Full
                    { 
                        popover: { 
                            title: 'Selamat Datang di Simulator Minimax!', 
                            description: 'Alat interaktif untuk memahami algoritma Minimax dan Alpha-Beta Pruning. Mari mulai tur singkat!' 
                        } 
                    },
                    { 
                        element: '.algorithm-selector', 
                        popover: { 
                            title: 'Pilih Algoritma', 
                            description: '<b>Minimax</b> - eksplorasi penuh semua kemungkinan.<br/><b>Alpha-Beta</b> - lebih efisien dengan pemangkasan.',
                            side: 'right'
                        } 
                    },
                    { 
                        element: '.simulation-controls', 
                        popover: { 
                            title: 'Kontrol Simulasi', 
                            description: 'Tekan <b>Play</b> untuk jalankan otomatis, atau <b>Next/Prev</b> untuk langkah manual.<br/><br/>⌨️ <b>Keyboard Shortcuts:</b><br/>• ← → untuk prev/next<br/>• Spasi untuk play/pause',
                            side: 'right'
                        } 
                    },
                    { 
                        element: '.simulation-log', 
                        popover: { 
                            title: 'Log Simulasi', 
                            description: 'Setiap langkah dijelaskan di sini. <b>Klik langkah mana saja</b> untuk langsung menuju ke momen itu.',
                            side: 'right'
                        } 
                    },
                    { 
                        element: '.main-canvas', 
                        popover: { 
                            title: 'Pohon Permainan', 
                            description: '<b>Klik & drag</b> untuk geser, <b>scroll</b> untuk zoom.<br/>Node MAX = kotak merah, MIN = lingkaran biru.<br/><br/>💡 Gunakan <b>Minimap</b> di pojok kanan atas untuk navigasi cepat!',
                            side: 'left'
                        } 
                    },
                    { 
                        element: '.tree-node', 
                        popover: { 
                            title: 'Interaksi Node', 
                            description: '<b>Hover ke node</b> untuk melihat tombol aksi:<br/>• (+) Tambah anak<br/>• (✏️) Edit nilai (hanya untuk daun)<br/>• (🗑️) Hapus',
                            side: 'bottom'
                        } 
                    },
                    { 
                        popover: { 
                            title: '🎉 Siap Mulai!', 
                            description: 'Tekan <b>Play</b> atau <b>Spasi</b> dan lihat algoritma bekerja!<br/><br/>Saat pemangkasan terjadi, akan ada notifikasi yang menjelaskan apa yang terjadi. Selamat belajar!' 
                        } 
                    },
                ]
            });
            
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

  const handleGenerateTree = (depth: number, branching: number) => {
      const newRoot = generateTree(depth, branching); 
      setRoot(newRoot);
      setCurrentStepIndex(-1);
  };

  // Generate empty tree structure (no values, user fills them)
  const generateEmptyStructure = (depth: number, branching: number, isMax: boolean): TreeNode => {
    const node: TreeNode = {
      id: `node-${Math.random().toString(36).substr(2, 5)}`,
      value: depth === 1 ? 0 : null, // Leaf nodes get default value 0
      children: [],
      isMaxNode: isMax,
    };

    if (depth > 1) {
      for (let i = 0; i < branching; i++) {
        node.children.push(generateEmptyStructure(depth - 1, branching, !isMax));
      }
    }

    return node;
  };

  const handleCreateEmptyTree = (depth: number, branching: number) => {
      const emptyRoot = generateEmptyStructure(depth, branching, true);
      setRoot(emptyRoot);
      setCurrentStepIndex(-1);
      toast.success(`Struktur pohon (${depth} level, ${branching} cabang) dibuat. Edit nilai daun dengan mengklik ✏️.`);
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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setIsPlaying(false);
          setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setIsPlaying(false);
          setCurrentStepIndex(prev => Math.max(-1, prev - 1));
          break;
        case ' ': // Space bar
          e.preventDefault();
          if (isPlaying) {
            setIsPlaying(false);
          } else {
            if (currentStepIndex >= steps.length - 1) setCurrentStepIndex(-1);
            setIsPlaying(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [steps.length, isPlaying, currentStepIndex]);

  // Auto-scroll log to current step
  useEffect(() => {
    if (currentStepIndex >= 0) {
      const logItem = logItemRefs.current.get(currentStepIndex);
      if (logItem) {
        logItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentStepIndex]);

  // Show toast for pruning events
  useEffect(() => {
    if (currentStepIndex >= 0 && steps[currentStepIndex]) {
      const step = steps[currentStepIndex];
      if (step.type === StepType.PRUNE) {
        // Count how many nodes would be visited without pruning
        const remainingSteps = steps.slice(currentStepIndex + 1);
        
        toast(
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-destructive">
              <span className="text-lg">✂️</span>
              <span>Pemangkasan Terjadi!</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Tanpa pemangkasan:</strong> Algoritma akan tetap mengunjungi 
              cabang-cabang yang tersisa meskipun hasilnya tidak akan mengubah keputusan akhir.
            </p>
            <p className="text-sm leading-relaxed">
              <strong>Dengan pemangkasan:</strong> Kita <em>menghemat waktu</em> dengan 
              melewati cabang yang tidak perlu dieksplorasi! 🚀
            </p>
            <div className="mt-1 p-2 bg-muted rounded text-xs">
              💡 <strong>Intinya:</strong> Node parent sudah menemukan pilihan yang lebih baik, 
              jadi cabang ini pasti tidak akan dipilih.
            </div>
          </div>,
          {
            duration: 15000,
            position: 'bottom-right',
          }
        );
      }
    }
  }, [currentStepIndex, steps]);

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
    <div className="flex w-full h-screen bg-background text-foreground overflow-hidden relative">
      
      {/* Mobile Menu Button - floating */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2.5 rounded-lg bg-card border border-border shadow-lg hover:bg-muted transition-colors md:hidden"
        style={{ display: sidebarOpen ? 'none' : 'flex' }}
      >
        <Menu size={20} />
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-80 max-w-[90vw] md:max-w-none
        flex-shrink-0 border-r border-border bg-card backdrop-blur 
        flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="p-4 border-b border-border flex justify-between items-center gap-2">
              <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold tracking-tight text-primary">Simulator Minimax</h1>
                  <p className="text-xs text-muted-foreground mt-1">Interaktif & Visual</p>
              </div>
              <ThemeSwitcher />
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors md:hidden"
              >
                <X size={20} />
              </button>
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
                   onCreateEmptyTree={handleCreateEmptyTree}
                   traversalOrder={traversalOrder}
                   onTraversalOrderChange={setTraversalOrder}
                />
              </div>
              
              <div className="mt-6 flex flex-col gap-2 simulation-log">
                  <h3 className="text-sm font-semibold px-1">Log Simulasi</h3>
                  <div className="bg-muted/50 rounded-lg p-2 h-64 border border-border overflow-y-auto">
                      {steps.length === 0 && <span className="text-muted-foreground p-2 block text-xs">Belum ada simulasi.</span>}
                      {steps.map((s, i) => (
                          <div 
                            key={s.id}
                            ref={(el) => {
                              if (el) logItemRefs.current.set(i, el);
                              else logItemRefs.current.delete(i);
                            }}
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
                  </div>
              </div>
          </div>
      </aside>
      
      {/* Main Canvas */}
      <main className="main-canvas flex-1 relative bg-dot-pattern min-h-0">
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
