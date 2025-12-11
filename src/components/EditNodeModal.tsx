import React, { useState, useEffect, useRef } from 'react';

interface EditNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  initialValue: number | null;
  isLeaf?: boolean;
}

export const EditNodeModal: React.FC<EditNodeModalProps> = ({ isOpen, onClose, onConfirm, initialValue }) => {
  const [value, setValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue !== null ? initialValue.toString() : '');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      onConfirm(num);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card border border-border text-card-foreground p-6 rounded-lg w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Edit Nilai Node</h3>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2 mb-6">
            <label className="text-sm font-medium">Masukkan Nilai Baru:</label>
            <input 
              ref={inputRef}
              type="number" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={value} 
              onChange={e => setValue(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-muted transition-colors">Batal</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};
