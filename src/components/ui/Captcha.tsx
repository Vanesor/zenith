"use client";

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
  className?: string;
}

export interface CaptchaRef {
  validate: () => boolean;
  isValid: () => boolean;
  reset: () => void;
}

const Captcha = forwardRef<CaptchaRef, CaptchaProps>(
  ({ onVerify, className = "" }, ref) => {
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Expose validation methods via ref
  useImperativeHandle(ref, () => ({
    validate: verifyInput,
    isValid: getCurrentValidationState,
    reset: () => {
      generateCaptcha();
      setUserInput('');
      setShowValidation(false);
      setIsValid(false);
      onVerify(false);
    },
  }));

  // Generate a random 5-character alphanumeric code
  const generateCaptcha = () => {
    // Use a mix of letters and numbers but avoid confusing characters like 0/O, 1/l/I
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    
    // Always generate exactly 5 characters
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setCaptchaCode(code);
    setUserInput('');
    setShowValidation(false);
    setIsValid(false);
    onVerify(false);
    drawCaptcha(code);
  };

  // Draw captcha on canvas with distortion and effects
  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas background with gradient
    const isDark = document.documentElement.classList.contains('dark');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    if (isDark) {
      gradient.addColorStop(0, 'rgb(30, 41, 59)');
      gradient.addColorStop(1, 'rgb(51, 65, 85)');
    } else {
      gradient.addColorStop(0, 'rgb(248, 250, 252)');
      gradient.addColorStop(1, 'rgb(226, 232, 240)');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise lines
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      ctx.strokeStyle = isDark 
        ? `rgba(71, 85, 105, ${Math.random() * 0.8 + 0.2})` 
        : `rgba(203, 213, 225, ${Math.random() * 0.8 + 0.2})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Draw characters with distortion
    const chars = code.split('');
    const charWidth = canvas.width / chars.length;
    
    chars.forEach((char, index) => {
      // Random font properties
      const fontSize = 24 + Math.random() * 8;
      const fontFamily = ['Arial', 'Times', 'Courier', 'Helvetica'][Math.floor(Math.random() * 4)];
      const rotation = (Math.random() - 0.5) * 0.5; // Random rotation
      
      ctx.save();
      
      // Position and rotate
      const x = charWidth * index + charWidth / 2 + (Math.random() - 0.5) * 10;
      const y = canvas.height / 2 + (Math.random() - 0.5) * 10;
      
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Set font and color
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add text shadow/stroke
      ctx.strokeStyle = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeText(char, 0, 0);
      
      // Main text color
      const colors = isDark 
        ? ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899']
        : ['#1E40AF', '#7C3AED', '#059669', '#D97706', '#DC2626', '#BE185D'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillText(char, 0, 0);
      
      ctx.restore();
    });

    // Add noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = isDark 
        ? `rgba(148, 163, 184, ${Math.random() * 0.6})` 
        : `rgba(100, 116, 139, ${Math.random() * 0.6})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 2,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  };

  // Verify the user input (called externally)
  const verifyInput = () => {
    // Guard against missing input
    if (!userInput || userInput.length !== 5) {
      setIsValid(false);
      setShowValidation(true);
      onVerify(false);
      return false;
    }
    
    // Strip any spaces and normalize to uppercase for comparison
    const cleanUserInput = userInput.replace(/\s+/g, '').toUpperCase();
    const cleanCaptchaCode = captchaCode.replace(/\s+/g, '').toUpperCase();
    
    // Simple comparison
    const inputValid = cleanUserInput === cleanCaptchaCode;
    
    // Update state and notify parent
    setIsValid(inputValid);
    setShowValidation(true);
    onVerify(inputValid);
    
    return inputValid;
  };

  // Get current validation state without re-validating
  const getCurrentValidationState = () => {
    return isValid && showValidation;
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase();
    setUserInput(value);
    
    // Reset validation state when typing (no auto-validation)
    setShowValidation(false);
    setIsValid(false);
    onVerify(false);
  };

  // Initialize captcha on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Regenerate on theme change
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (captchaCode) {
        setTimeout(() => drawCaptcha(captchaCode), 100);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [captchaCode]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-card border-2 border-custom rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-secondary">Security Verification</span>
          <button
            type="button"
            onClick={generateCaptcha}
            className="p-2 text-muted hover:text-primary rounded-lg hover:bg-hover transition-colors"
            title="Generate new code"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={160}
              height={60}
              className="border border-custom rounded-lg bg-section"
            />
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Enter code"
              className={`w-full h-12 px-4 rounded-xl border-2 transition-all duration-300 text-center text-lg tracking-widest font-mono uppercase
                ${showValidation 
                  ? isValid 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : userInput.length === 5
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-custom bg-card focus:border-accent focus:ring-4 focus:ring-accent/20'
                }`}
              maxLength={5}
            />
            
            {/* Only show validation after form submission */}
            {showValidation && (
              <div className="mt-2 text-sm text-center">
                {isValid ? (
                  <span className="text-green-600 dark:text-green-400 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verified!
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Incorrect code
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <p className="text-xs text-muted mt-2 text-center">
          Enter the 5-character code shown in the image above
        </p>
      </div>
    </div>
  );
});

Captcha.displayName = 'Captcha';

export default Captcha;
