import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Phone, ShieldCheck } from 'lucide-react';

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onVerify: () => void;
}

export function VerificationRequiredModal({
  isOpen,
  onClose,
  phoneNumber,
  onVerify
}: VerificationRequiredModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center">
          <ShieldCheck className="h-5 w-5 text-yellow-600 mr-2" />
          <span>Phone Verification Required</span>
        </div>
      }
      size="sm"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Phone className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-gray-700 font-medium">
            The phone number <span className="font-semibold">{phoneNumber}</span> is not verified.
          </p>
          <p className="text-gray-600 text-sm">
            Please verify this number first to make a call.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onVerify}
            className="flex-1"
          >
            Verify Number
          </Button>
        </div>
      </div>
    </Modal>
  );
}