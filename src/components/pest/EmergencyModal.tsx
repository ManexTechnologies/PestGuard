import React from 'react';
import { Phone, X, AlertTriangle, ExternalLink, MapPin, Clock } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '@/data/pestData';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-red-50 border-b border-red-100 px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-gray-900">🚨 Emergency Contacts</h2>
              <p className="text-sm text-red-600 font-medium">Agricultural & Pest Control Experts</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {EMERGENCY_CONTACTS.map((contact, idx) => (
            <a
              key={idx}
              href={`tel:${contact.phone}`}
              className="flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                <Phone className="w-6 h-6 text-green-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base">{contact.name}</p>
                <p className="text-sm text-gray-600 mt-1">{contact.description}</p>
                <div className="flex items-center gap-2 mt-2.5">
                  <div className="bg-green-100 px-3 py-1.5 rounded-lg">
                    <p className="text-lg font-bold text-green-700 font-mono">{contact.phone}</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-green-600 flex-shrink-0" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Info Box */}
        <div className="px-5 pb-5">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mt-2">
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Available 24/7</p>
                <p className="text-xs text-gray-600 mt-1">For severe pest outbreaks or emergency situations, contact AGRITEX immediately. Report locust swarms and quelea bird flocks as priority.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Tap any contact to call directly. For detailed pest information, visit the Learn section or upload a photo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
