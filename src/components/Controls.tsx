import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, RefreshCcw, Plus, TreeDeciduous } from 'lucide-react';

interface ControlsProps {
    currentStep: number;
    totalSteps: number;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onReset: () => void;
    playbackSpeed: number;
    onSpeedChange: (speed: number) => void;
    algorithm: 'minimax' | 'alphabeta';
    onAlgorithmChange: (algo: 'minimax' | 'alphabeta') => void;
    onGenerateTree: (depth: number, branching: number) => void;
    onCreateEmptyTree: (depth: number, branching: number) => void;
    traversalOrder: 'ltr' | 'rtl';
    onTraversalOrderChange: (order: 'ltr' | 'rtl') => void;
}

export const Controls: React.FC<ControlsProps> = ({
    currentStep,
    totalSteps,
    isPlaying,
    onPlay,
    onPause,
    onNext,
    onPrev,
    onReset,
    playbackSpeed,
    onSpeedChange,
    algorithm,
    onAlgorithmChange,
    onGenerateTree,
    onCreateEmptyTree,
    traversalOrder,
    onTraversalOrderChange
}) => {
  const [treeDepth, setTreeDepth] = useState(3);
  const [treeBranching, setTreeBranching] = useState(2);

  return (
    <div className="flex flex-col gap-6 p-4 bg-card border rounded-xl shadow-sm">
        
        {/* Algo Selector */}
        <div className="flex flex-col gap-2 algorithm-selector">
            <label className="text-sm font-medium text-muted-foreground">Algoritma</label>
            <div className="flex bg-muted p-1 rounded-lg">
                <button 
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${algorithm === 'minimax' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => onAlgorithmChange('minimax')}
                >
                    Minimax
                </button>
                <button 
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${algorithm === 'alphabeta' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => onAlgorithmChange('alphabeta')}
                >
                    Alpha-Beta
                </button>
            </div>
        </div>

        {/* Traversal Settings */}
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Arah Algoritma</label>
            <select
                value={traversalOrder}
                onChange={(e) => onTraversalOrderChange(e.target.value as 'ltr' | 'rtl')}
                className="text-sm bg-muted border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary w-full outline-none"
            >
                <option value="ltr">Kiri → Kanan (Default)</option>
                <option value="rtl">Kanan → Kiri</option>
            </select>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between text-sm">
                 <span className="font-medium">Playback</span>
                 <span className="text-muted-foreground">{currentStep + 1} / {totalSteps}</span>
             </div>
             
             <div className="flex items-center justify-center gap-2">
                 <button onClick={onPrev} className="p-2 hover:bg-muted rounded-full transition-colors" disabled={currentStep < 0}>
                     <SkipBack size={20} />
                 </button>
                 
                 {isPlaying ? (
                     <button onClick={onPause} className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-md">
                         <Pause size={24} fill="currentColor" />
                     </button>
                 ) : (
                     <button onClick={onPlay} className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-md">
                         <Play size={24} fill="currentColor" className="ml-0.5" />
                     </button>
                 )}

                 <button onClick={onNext} className="p-2 hover:bg-muted rounded-full transition-colors" disabled={currentStep >= totalSteps - 1}>
                     <SkipForward size={20} />
                 </button>
             </div>

             <div className="flex items-center justify-between mt-2">
                 <button onClick={onReset} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                     <RotateCcw size={14} /> Reset
                 </button>

                 <div className="flex items-center gap-2">
                     <span className="text-xs text-muted-foreground">Speed:</span>
                     <select 
                        value={playbackSpeed} 
                        onChange={(e) => onSpeedChange(Number(e.target.value))}
                        className="text-xs bg-muted border-none rounded px-2 py-1 focus:ring-1 focus:ring-primary"
                     >
                         <option value={2000}>Slow</option>
                         <option value={1000}>Normal</option>
                         <option value={500}>Fast</option>
                         <option value={100}>Turbo</option>
                     </select>
                 </div>
             </div>
        </div>

        {/* Tree Settings */}
        <div className="pt-4 border-t flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
                <TreeDeciduous size={16} />
                <span>Pengaturan Pohon</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Kedalaman</label>
                    <select 
                        value={treeDepth} 
                        onChange={(e) => setTreeDepth(Number(e.target.value))}
                        className="text-sm bg-muted border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary outline-none"
                    >
                        <option value={2}>2 Level</option>
                        <option value={3}>3 Level</option>
                        <option value={4}>4 Level</option>
                        <option value={5}>5 Level</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Cabang</label>
                    <select 
                        value={treeBranching} 
                        onChange={(e) => setTreeBranching(Number(e.target.value))}
                        className="text-sm bg-muted border-none rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary outline-none"
                    >
                        <option value={2}>2 anak</option>
                        <option value={3}>3 anak</option>
                        <option value={4}>4 anak</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
                <button 
                    onClick={() => onGenerateTree(treeDepth, treeBranching)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
                >
                    <RefreshCcw size={16} />
                    Generate Pohon Acak
                </button>
                <button 
                    onClick={() => onCreateEmptyTree(treeDepth, treeBranching)}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                    <Plus size={16} />
                    Buat Struktur Kosong
                </button>
            </div>
        </div>

    </div>
  );
};
