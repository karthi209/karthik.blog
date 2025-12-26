import { X } from 'lucide-react';
import '../styles/components/SpecialEditionModal.css';

export default function SpecialEditionModal({ open, onClose, onProceed, editionName = 'Victorian' }) {
  if (!open) return null;

  return (
    <div className="special-edition-modal-overlay" onClick={onClose}>
      <div className="special-edition-modal" onClick={(e) => e.stopPropagation()}>
        <button className="special-edition-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        
        <div className="special-edition-modal-content">
          <div className="special-edition-modal-header">
            <h2 className="special-edition-modal-title">SPECIAL EDITION</h2>
            <p className="special-edition-modal-subtitle">{editionName} Edition</p>
          </div>
          
          <div className="special-edition-modal-body">
            <p>
              This post is presented as a special edition with unique typography and styling.
            </p>
            <p>
              You will enter a full-page reading experience. To return, use the close button or navigate back.
            </p>
          </div>
          
          <div className="special-edition-modal-actions">
            <button className="special-edition-btn special-edition-btn--secondary" onClick={onClose}>
              Go Back
            </button>
            <button className="special-edition-btn special-edition-btn--primary" onClick={onProceed}>
              Enter Reading Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

