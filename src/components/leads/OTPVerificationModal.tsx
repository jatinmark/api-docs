'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Phone, Shield, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  expiresIn: number;
  onSubmit: (otp: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function OTPVerificationModal({
  isOpen,
  onClose,
  message,
  expiresIn,
  onSubmit,
  isLoading = false,
  error
}: OTPVerificationModalProps) {
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [internalError, setInternalError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOTP(['', '', '', '', '', '']);
      setTimeLeft(expiresIn);
      setInternalError('');
      // Focus first input when modal opens
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen, expiresIn]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0) {
          setInternalError('OTP expired. Please request a new verification.');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setInternalError('Please enter all 6 digits');
      return;
    }

    setInternalError('');
    
    try {
      await onSubmit(otpString);
    } catch (err) {
      // Error is handled by parent component
      setOTP(['', '', '', '', '', '']); // Clear OTP on error
      inputRefs.current[0]?.focus();
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= 1) {
      const newOTP = [...otp];
      newOTP[index] = numericValue;
      setOTP(newOTP);
      setInternalError('');
      
      // Auto-focus next input
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOTP = pastedData.split('');
      while (newOTP.length < 6) newOTP.push('');
      setOTP(newOTP);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  if (!isOpen) return null;

  const isExpired = timeLeft === 0;
  const isComplete = otp.every(digit => digit !== '');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 rounded-lg p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-100 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 text-white p-4 rounded-full">
                <Shield className="h-8 w-8" />
              </div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Verify Your Phone</h3>
          <p className="text-gray-600 text-center text-sm">{message}</p>
        </div>

        <div className="p-6">
          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 text-center mb-4">
              Enter verification code
            </label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el!; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`
                    w-12 h-14 text-center text-xl font-semibold
                    border-2 rounded-xl transition-all duration-200
                    ${digit ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'}
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:bg-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  disabled={isExpired || isLoading}
                />
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Clock className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
              {isExpired ? 'Code expired' : `Expires in ${formatTime(timeLeft)}`}
            </span>
          </div>

          {/* Error Message */}
          {(error || internalError) && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error || internalError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!isComplete || isExpired || isLoading}
              className="flex-1 h-12 text-base font-medium"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-12 text-base font-medium"
            >
              Cancel
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Didn&apos;t receive the code? Contact support if the issue persists.
          </p>
        </div>
      </div>
    </div>
  );
}