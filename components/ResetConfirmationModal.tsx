import React from 'react';
import { AlertTriangleIcon } from './Icons';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[60] animate-fade-in-fast" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
      <div 
        className="bg-netflix-dark rounded-xl shadow-2xl w-full max-w-md text-white animate-zoom-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-900/50 flex items-center justify-center">
                    <AlertTriangleIcon className="w-8 h-8 text-red-400"/>
                </div>
            </div>
            <h2 id="reset-modal-title" className="text-2xl font-bold mb-2">Are you sure?</h2>
            <p className="text-neutral-400 mb-6">
                This will permanently delete all your data, including your 'Continue Watching' list. This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
                <button onClick={onCancel} className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 px-6 rounded-md transition-colors w-32">
                    Cancel
                </button>
                <button onClick={onConfirm} className="bg-netflix-red-dark hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md transition-colors w-32">
                    Reset
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmationModal;
