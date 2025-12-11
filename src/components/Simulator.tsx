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
import { Menu, X, PlayCircle, GraduationCap, HelpCircle, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { sfx } from '@/lib/utils/sfx';
import '@/components/TreeComponents.css';
import { MathRenderer } from '@/components/MathRenderer';

// Helper to strip markdown for list view
const getStepTitle = (desc: string) => {
    const lines = desc.split('\n');
    const firstLine = lines.find(l => l.trim().length > 0) || "Langkah";
    return firstLine.replace(/#/g, '').trim(); 
};

// Helper to run algorithm and get correct values/prunes
const getCorrectSolution = (root: TreeNode, algo: 'minimax' | 'alphabeta') => {
  const correctValues: Record<string, number> = {};
  const prunedIds: Set<string> = new Set();
  
  // Clone to avoid mutation during simulation run
  const rootClone = JSON.parse(JSON.stringify(root));
  
  if (algo === 'alphabeta') {
      const findPruned = (node: TreeNode, alpha: number, beta: number, isMax: boolean): number => {
          let val = isMax ? -Infinity : Infinity;
          if (!node.children || node.children.length === 0) return node.value ?? 0;

          for (const child of node.children) {
              const childVal = findPruned(child, alpha, beta, !isMax);
              if (isMax) {
                  val = Math.max(val, childVal);
                  alpha = Math.max(alpha, val);
              } else {
                  val = Math.min(val, childVal);
                  beta = Math.min(beta, val);
              }
              if (alpha >= beta) {
                 // Subsequent siblings are pruned
                 const idx = node.children.indexOf(child);
                 for (let i = idx + 1; i < node.children.length; i++) {
                     // Add all descendants of pruned sibling
                     const collectIds = (n: TreeNode) => {
                         prunedIds.add(n.id);
                         if(n.children) n.children.forEach(collectIds);
                     };
                     collectIds(node.children[i]);
                 }
                 break;
              }
          }
          correctValues[node.id] = val;
          return val;
      };
      findPruned(rootClone, -Infinity, Infinity, true);
  } else {
      // For minimax, just recurse
      const fillMinimax = (node: TreeNode, isMax: boolean): number => {
          if (!node.children || !node.children.length) return node.value ?? 0;
          const vals = node.children.map(c => fillMinimax(c, !isMax));
          const v = isMax ? Math.max(...vals) : Math.min(...vals);
          correctValues[node.id] = v;
          return v;
      }
      fillMinimax(rootClone, true);
  }

  return { correctValues, prunedIds };
};

export default function Simulator() {
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); 
  const [algorithm, setAlgorithm] = useState<'minimax' | 'alphabeta'>('minimax');
  const [traversalOrder, setTraversalOrder] = useState<'ltr' | 'rtl'>('ltr');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Mode State
  const [mode, setMode] = useState<'simulate' | 'learn'>('simulate');
  
  // Learn Mode State
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [userPruned, setUserPruned] = useState<Set<string>>(new Set());
  const [learnFeedback, setLearnFeedback] = useState<{correct: number, wrong: number, missedPrune: number} | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeValue, setEditingNodeValue] = useState<number | null>(null);

  const playTimer = useRef<NodeJS.Timeout | number | null>(null);
  const logItemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // --- Logic Functions ---

  const findNodeById = (node: TreeNode, id: string): TreeNode | undefined => {
      if (node.id === id) return node;
      for (const child of node.children) {
          const res = findNodeById(child, id);
          if (res) return res;
      }
  };

  const validateAnswers = () => {
    if (!root) return;
    
    const { correctValues, prunedIds } = getCorrectSolution(root, algorithm);
    
    let correct = 0;
    let wrong = 0;
    let missedPrune = 0;
    
    Object.keys(correctValues).forEach(id => {
        if (prunedIds.has(id)) return;

        const node = findNodeById(root, id);
        if (node && node.children.length > 0) {
            if (userAnswers[id] === correctValues[id]) {
                correct++;
            } else {
                wrong++;
            }
        }
    });

    if (algorithm === 'alphabeta') {
        prunedIds.forEach(id => {
            if (userPruned.has(id)) {
                correct++;
            } else {
                missedPrune++;
            }
        });
        
        userPruned.forEach(id => {
            if (!prunedIds.has(id)) wrong++; 
        });
    }

    setLearnFeedback({ correct, wrong, missedPrune });
    
    if (wrong === 0 && missedPrune === 0) {
        sfx.playSuccess();
        toast.success("Selamat! Semua jawaban benar! 🎉");
    } else {
        sfx.playError();
        toast.error(`Masih ada yang salah. Benar: ${correct}, Salah: ${wrong}, Lupa Pangkas: ${missedPrune}`);
    }
  };

  const resetLearnMode = () => {
      setUserAnswers({});
      setUserPruned(new Set());
      setLearnFeedback(null);
      sfx.playClick();
  };

  const toggleMode = (newMode: 'simulate' | 'learn') => {
      setMode(newMode);
      setIsPlaying(false);
      setCurrentStepIndex(-1);
      resetLearnMode();
      sfx.playClick();
      
      if (newMode === 'learn') {
          toast.info("Mode Belajar: Klik node untuk isi nilai, Klik Kanan untuk pangkas.", { duration: 4000 });
      }
  };

  const handleLearnNodeClick = (id: string) => {
      const node = root ? findNodeById(root, id) : null;
      if (node) {
          setEditingNodeId(id);
          const existing = userAnswers[id];
          setEditingNodeValue(existing !== undefined ? existing : (node.value !== null ? node.value : null));
          setIsModalOpen(true);
      }
  };

  const handleLearnContextMenu = (id: string) => {
      // Allow marking prune on ANY node in learn mode (user logic)
      // Actually strictly internal nodes? No, prune usually happens at branch.
      // Let user just mark whatever they think is pruned.
      
      setUserPruned(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
              next.delete(id);
          } else {
              next.add(id);
              sfx.playPrune();
          }
          return next;
      });
  };

  // --- End Logic Functions ---

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
                popoverClass: 'driver-popover driverjs-theme', // Use our custom theme logic
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
      sfx.playDing();
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
      sfx.playDing();
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

  // Auto-scroll log to current step and play sound
  useEffect(() => {
    if (currentStepIndex >= 0) {
      const logItem = logItemRefs.current.get(currentStepIndex);
      if (logItem) {
        logItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      
      // Play pop sound for each step
      sfx.playPop();
      
      // Play success sound when simulation completes
      if (currentStepIndex === steps.length - 1) {
        setTimeout(() => sfx.playSuccess(), 300);
      }
    }
  }, [currentStepIndex, steps.length]);

  // Show toast for pruning events
  useEffect(() => {
    if (currentStepIndex >= 0 && steps[currentStepIndex]) {
      const step = steps[currentStepIndex];
      if (step.type === StepType.PRUNE) {
        // Play scissors sound!
        sfx.playPrune();
        
        toast(
          <div className="w-full text-foreground/90">
             <MathRenderer content={step.description} className="text-sm [&>h3]:text-destructive [&>h3]:mb-2" />
          </div>,
          {
            duration: 10000,
            className: "w-[450px] max-w-[90vw] bg-card border-border",
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
      
      if (mode === 'learn') {
          // Learn Mode: Update User Answer
          setUserAnswers(prev => ({
              ...prev,
              [editingNodeId]: newVal
          }));
          sfx.playPop();
      } else {
          // Simulate Mode: Update Tree Structure
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
      }
      setIsModalOpen(false);
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
              {/* Mode Switcher */}
              <div className="flex p-1 bg-muted/50 rounded-lg mb-4">
                  <button
                    onClick={() => toggleMode('simulate')}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded text-xs font-medium transition-all ${
                        mode === 'simulate' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <PlayCircle size={14} />
                    Simulasi
                  </button>
                  <button
                    onClick={() => toggleMode('learn')}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded text-xs font-medium transition-all ${
                        mode === 'learn' ? 'bg-card text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <GraduationCap size={14} />
                    Belajar
                  </button>
              </div>

              {mode === 'simulate' ? (
                  <>
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
                      
                      {/* Current Step Explanation Panel */}
                      <div className="simulation-explanation mt-4 p-3 bg-muted/40 border border-border rounded-lg min-h-[120px] max-h-[250px] overflow-y-auto">
                           <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                               <HelpCircle size={12} />
                               Penjelasan Langkah {currentStepIndex + 1}
                           </h3>
                           {currentStepIndex >= 0 && steps[currentStepIndex] ? (
                               <MathRenderer content={steps[currentStepIndex].description} />
                           ) : (
                               <p className="text-xs text-muted-foreground italic">Menunggu simulasi dimulai...</p>
                           )}
                      </div>

                      <div className="mt-4 flex flex-col gap-2 simulation-log flex-1 min-h-0">
                        <h3 className="text-sm font-semibold px-1">Riwayat Langkah</h3>
                        <div className="bg-muted/50 rounded-lg p-2 flex-1 border border-border overflow-y-auto min-h-[150px]">
                            {steps.length === 0 && <span className="text-muted-foreground p-2 block text-xs">Belum ada simulasi.</span>}
                            {steps.map((s, i) => (
                                <div 
                                    key={s.id}
                                    ref={(el) => {
                                    if (el) logItemRefs.current.set(i, el);
                                    else logItemRefs.current.delete(i);
                                    }}
                                    className={`p-2 rounded mb-1 cursor-pointer transition-colors text-xs border-l-2 flex gap-2 ${i === currentStepIndex ? 'bg-primary/20 border-primary text-foreground shadow-sm' : 'border-transparent hover:bg-muted/80'}`}
                                    onClick={() => {
                                        setIsPlaying(false);
                                        setCurrentStepIndex(i);
                                    }}
                                >
                                    <span className="font-bold opacity-70 font-mono w-6 text-right">{i+1}.</span>
                                    <span className="font-medium truncate">{getStepTitle(s.description)}</span>
                                </div>
                            ))}
                        </div>
                      </div>
                  </>
              ) : (
                  <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="bg-muted/30 p-4 rounded-lg border border-border">
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                              <HelpCircle size={16} />
                              Mode Belajar
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                              Kerjakan pohon ini sendiri! Klik node untuk mengisi nilai, dan klik kanan untuk memangkas (alpha-beta).
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 mb-4">
                              <div className="bg-card p-2 rounded text-center border border-border">
                                  <div className="text-xs text-muted-foreground">Terisi</div>
                                  <div className="font-bold text-lg">{Object.keys(userAnswers).length}</div>
                              </div>
                              <div className="bg-card p-2 rounded text-center border border-border">
                                  <div className="text-xs text-muted-foreground">Dipangkas</div>
                                  <div className="font-bold text-lg">{userPruned.size}</div>
                              </div>
                          </div>

                          <div className="flex flex-col gap-2">
                              <button 
                                onClick={validateAnswers}
                                className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 size={16} />
                                Cek Jawaban
                              </button>
                              <button 
                                onClick={resetLearnMode}
                                className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                              >
                                <RotateCcw size={16} />
                                Reset
                              </button>
                              
                              <div className="h-px bg-border my-2" />
                              
                              <div className="flex flex-col gap-2">
                                  <button onClick={() => handleGenerateTree(3, 2)} className="text-xs text-start px-2 py-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                                      Generate Soal Baru (Acak)
                                  </button>
                                  <button onClick={() => handleCreateEmptyTree(3, 2)} className="text-xs text-start px-2 py-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                                      Buat Soal Kosong
                                  </button>
                              </div>
                          </div>
                      </div>

                      {learnFeedback && (
                          <div className={`p-4 rounded-lg border ${learnFeedback.wrong === 0 && learnFeedback.missedPrune === 0 ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                              <h4 className="font-bold mb-2 flex items-center gap-2">
                                  {learnFeedback.wrong === 0 && learnFeedback.missedPrune === 0 ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                                  Hasil
                              </h4>
                              <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                      <span>Benar:</span>
                                      <span className="font-mono font-bold text-green-500">{learnFeedback.correct}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span>Salah:</span>
                                      <span className="font-mono font-bold text-red-500">{learnFeedback.wrong}</span>
                                  </div>
                                  {algorithm === 'alphabeta' && (
                                     <div className="flex justify-between">
                                          <span>Lupa Pangkas:</span>
                                          <span className="font-mono font-bold text-orange-500">{learnFeedback.missedPrune}</span>
                                      </div> 
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </aside>
      
      {/* Main Canvas */}
      <main className="main-canvas flex-1 relative bg-dot-pattern min-h-0">
         {root ? (
             <TreeCanvas 
                root={root} 
                simulationState={mode === 'simulate' ? currentSimulationState : {
                    activeId: undefined, // No active step logic in learn mode yet
                    visitedIds: [], // Maybe track clicks?
                    currentValues: userAnswers,
                    alphaValues: {}, // User doesn't input alpha/beta yet
                    betaValues: {},
                    prunedIds: Array.from(userPruned)
                }}
                onAddChild={mode === 'simulate' ? addChild : handleLearnContextMenu} // Hijack: Right click adds child in sim, toggles prune in learn
                onEditNode={mode === 'simulate' ? openEditModal : handleLearnNodeClick} // Edit behavior changes
                onDeleteNode={handleDeleteNode}
                isLearnMode={mode === 'learn'}
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
