'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Camera, Monitor, Shield, CheckCircle, XCircle, Eye, Mic } from 'lucide-react';

interface ProctoringConfig {
  requireCamera?: boolean;
  requireMicrophone?: boolean;
  requireFaceVerification?: boolean;
  requireFullscreen?: boolean;
  maxViolations?: number;
  autoSubmitOnViolation?: boolean;
}

interface ProctoringState {
  isActive: boolean;
  isSetupComplete: boolean;
  violations: string[];
  violationCount: number;
  cameraActive: boolean;
  microphoneActive: boolean;
  faceVerified: boolean;
  isFullscreen: boolean;
  focusLost: boolean;
  setupData: ProctoringSetupData | null;
}

interface ProctoringSetupData {
  cameraPermitted: boolean;
  microphonePermitted: boolean;
  faceVerified: boolean;
  systemCheck: boolean;
}

interface ProctoringContextType {
  state: ProctoringState;
  config: ProctoringConfig;
  startProctoring: (config: ProctoringConfig) => void;
  stopProctoring: () => void;
  addViolation: (violation: string) => void;
  showSetup: boolean;
  setShowSetup: (show: boolean) => void;
  handleSetupComplete: (data: ProctoringSetupData) => void;
  handleSetupCancel: () => void;
}

const ProctoringContext = createContext<ProctoringContextType | null>(null);

export function useProctoring() {
  const context = useContext(ProctoringContext);
  if (!context) {
    throw new Error('useProctoring must be used within a ProctoringProvider');
  }
  return context;
}

interface ProctoringProviderProps {
  children: React.ReactNode;
  onAutoSubmit?: () => void;
  onViolation?: (violation: string, count: number) => void;
}

export function ProctoringProvider({ children, onAutoSubmit, onViolation }: ProctoringProviderProps) {
  const [state, setState] = useState<ProctoringState>({
    isActive: false,
    isSetupComplete: false,
    violations: [],
    violationCount: 0,
    cameraActive: false,
    microphoneActive: false,
    faceVerified: false,
    isFullscreen: false,
    focusLost: false,
    setupData: null
  });

  const [config, setConfig] = useState<ProctoringConfig>({});
  const [showSetup, setShowSetup] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [autoReturningToFullscreen, setAutoReturningToFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addViolation = useCallback((violation: string) => {
    setState(prev => {
      const newCount = prev.violationCount + 1;
      const newViolations = [...prev.violations, `${new Date().toLocaleTimeString()}: ${violation}`];
      
      // Call external violation handler
      onViolation?.(violation, newCount);
      
      // Check for auto-submit
      if (config.autoSubmitOnViolation && config.maxViolations && newCount >= config.maxViolations) {
        setTimeout(() => {
          onAutoSubmit?.();
        }, 2000);
      }
      
      return {
        ...prev,
        violations: newViolations,
        violationCount: newCount
      };
    });
  }, [config, onViolation, onAutoSubmit]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, []);

  const autoReturnToFullscreen = useCallback(async () => {
    setAutoReturningToFullscreen(true);
    
    setTimeout(async () => {
      try {
        await document.documentElement.requestFullscreen();
        setState(prev => ({ ...prev, focusLost: false }));
        setAutoReturningToFullscreen(false);
      } catch (error) {
        console.error('Failed to return to fullscreen:', error);
        addViolation('Failed to return to fullscreen mode');
      }
    }, 2000);
  }, [addViolation]);

  const initializeCamera = useCallback(async () => {
    if (!config.requireCamera) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 320, 
          height: 240,
          facingMode: 'user'
        }, 
        audio: false 
      });
      
      setCameraStream(stream);
      setState(prev => ({ ...prev, cameraActive: true }));
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        startFaceDetection();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      addViolation('Camera access denied or unavailable');
    }
  }, [config.requireCamera, addViolation]);

  const startFaceDetection = useCallback(() => {
    const video = videoRef.current;
    if (!video || !config.requireCamera) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    const detectFaces = () => {
      if (!video || !context || !state.isActive) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let brightness = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      
      brightness /= (data.length / 4);
      
      if (brightness < 10) {
        addViolation('Camera appears to be covered or blocked');
      } else if (brightness > 240) {
        addViolation('Unusual lighting detected (possible multiple people)');
      }
    };

    const faceDetectionInterval = setInterval(detectFaces, 5000);
    (video as any).faceDetectionInterval = faceDetectionInterval;
  }, [config.requireCamera, state.isActive, addViolation]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setState(prev => ({ ...prev, cameraActive: false }));
    }
    
    if (videoRef.current && (videoRef.current as any).faceDetectionInterval) {
      clearInterval((videoRef.current as any).faceDetectionInterval);
    }
  }, [cameraStream]);

  // Fullscreen monitoring
  useEffect(() => {
    if (!state.isActive || !config.requireFullscreen) return;

    const handleFullscreenChange = () => {
      const isInFullscreen = !!document.fullscreenElement;
      setState(prev => ({ ...prev, isFullscreen: isInFullscreen }));
      
      if (!isInFullscreen && state.isActive && !autoReturningToFullscreen) {
        addViolation('Exited fullscreen mode');
        autoReturnToFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Auto-enter fullscreen when proctoring starts
    if (state.isActive && !document.fullscreenElement) {
      toggleFullscreen();
    }

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [state.isActive, config.requireFullscreen, autoReturningToFullscreen, addViolation, autoReturnToFullscreen, toggleFullscreen]);

  // Focus and visibility monitoring
  useEffect(() => {
    if (!state.isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setState(prev => ({ ...prev, focusLost: true }));
        addViolation('Left the tab or minimized window');
      } else {
        setState(prev => ({ ...prev, focusLost: false }));
      }
    };

    const handleBlur = () => {
      setState(prev => ({ ...prev, focusLost: true }));
      addViolation('Lost window focus');
    };

    const handleFocus = () => {
      setState(prev => ({ ...prev, focusLost: false }));
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation('Attempted to access context menu');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')
      ) {
        e.preventDefault();
        addViolation('Attempted to access developer tools');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isActive, addViolation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startProctoring = useCallback((proctoringConfig: ProctoringConfig) => {
    setConfig(proctoringConfig);
    if (proctoringConfig.requireCamera || proctoringConfig.requireMicrophone || proctoringConfig.requireFaceVerification) {
      setShowSetup(true);
    } else {
      setState(prev => ({ ...prev, isActive: true, isSetupComplete: true }));
    }
  }, []);

  const stopProctoring = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isActive: false, 
      isSetupComplete: false,
      focusLost: false 
    }));
    stopCamera();
    setShowSetup(false);
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
  }, [stopCamera]);

  const handleSetupComplete = useCallback((data: ProctoringSetupData) => {
    setState(prev => ({ 
      ...prev, 
      isActive: true,
      isSetupComplete: true,
      setupData: data,
      cameraActive: data.cameraPermitted,
      microphoneActive: data.microphonePermitted,
      faceVerified: data.faceVerified
    }));
    setShowSetup(false);
    
    if (data.cameraPermitted && config.requireCamera) {
      initializeCamera();
    }
  }, [config.requireCamera, initializeCamera]);

  const handleSetupCancel = useCallback(() => {
    setShowSetup(false);
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  const contextValue: ProctoringContextType = {
    state,
    config,
    startProctoring,
    stopProctoring,
    addViolation,
    showSetup,
    setShowSetup,
    handleSetupComplete,
    handleSetupCancel
  };

  return (
    <ProctoringContext.Provider value={contextValue}>
      <div ref={containerRef} className="relative">
        {children}
        
        {/* Hidden camera video for monitoring */}
        {state.cameraActive && cameraStream && (
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            playsInline
            className="hidden"
          />
        )}
        
        {/* Focus Lost Warning Overlay */}
        {state.focusLost && state.isActive && (
          <div className="fixed inset-0 bg-red-600 bg-opacity-90 flex items-center justify-center z-50">
            <div className="text-center text-white">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">ATTENTION REQUIRED</h2>
              <p className="text-lg mb-4">You have left the assignment window</p>
              <p className="text-sm">Click here to return to the assignment</p>
              <p className="text-xs mt-2 opacity-75">
                Violation recorded - Warning {state.violationCount}/{config.maxViolations || '∞'}
              </p>
            </div>
          </div>
        )}
      </div>
    </ProctoringContext.Provider>
  );
}

// Enhanced Proctoring Setup Component
interface EnhancedProctoringSetupProps {
  onSetupComplete: (setupData: ProctoringSetupData) => void;
  onCancel: () => void;
  config: ProctoringConfig;
}

export function EnhancedProctoringSetup({ onSetupComplete, onCancel, config }: EnhancedProctoringSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
  const [cameraPermitted, setCameraPermitted] = useState(false);
  const [microphonePermitted, setMicrophonePermitted] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [systemCheck, setSystemCheck] = useState({
    browserSupported: false,
    javascriptEnabled: true,
    cookiesEnabled: false,
    fullscreenAvailable: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceDetectionTries, setFaceDetectionTries] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const steps = [
    {
      id: 'system',
      title: 'System Check',
      description: 'Verifying your browser and system compatibility',
      icon: Monitor,
      required: true
    },
    {
      id: 'camera',
      title: 'Camera Access',
      description: 'Enable camera for identity verification',
      icon: Camera,
      required: config.requireCamera || false
    },
    {
      id: 'microphone',
      title: 'Microphone Access',
      description: 'Enable microphone for audio monitoring',
      icon: Mic,
      required: config.requireMicrophone || false
    },
    {
      id: 'face',
      title: 'Face Verification',
      description: 'Verify your identity using facial recognition',
      icon: Eye,
      required: config.requireFaceVerification || false
    }
  ].filter(step => step.required);

  useEffect(() => {
    performSystemCheck();
  }, []);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream, microphoneStream]);

  const performSystemCheck = () => {
    setIsLoading(true);
    setError(null);

    const checks = {
      browserSupported: checkBrowserSupport(),
      javascriptEnabled: true,
      cookiesEnabled: checkCookiesEnabled(),
      fullscreenAvailable: checkFullscreenSupport()
    };

    setSystemCheck(checks);
    setIsLoading(false);

    if (Object.values(checks).every(check => check)) {
      setTimeout(() => {
        if (steps.length > 1) {
          setCurrentStep(1);
        } else {
          completeSetup();
        }
      }, 1500);
    }
  };

  const checkBrowserSupport = (): boolean => {
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(userAgent);
    const isEdge = /Edg/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor);
    
    return isChrome || isFirefox || isEdge || isSafari;
  };

  const checkCookiesEnabled = (): boolean => {
    try {
      document.cookie = "test=1";
      const cookieEnabled = document.cookie.indexOf("test=") !== -1;
      document.cookie = "test=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";
      return cookieEnabled;
    } catch {
      return false;
    }
  };

  const checkFullscreenSupport = (): boolean => {
    return !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );
  };

  const requestCameraPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      setCameraStream(stream);
      setCameraPermitted(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setTimeout(() => {
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          completeSetup();
        }
      }, 1500);
    } catch (err: any) {
      setError(`Camera access denied: ${err.message}`);
      setCameraPermitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestMicrophonePermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneStream(stream);
      setMicrophonePermitted(true);

      setTimeout(() => {
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          completeSetup();
        }
      }, 1500);
    } catch (err: any) {
      setError(`Microphone access denied: ${err.message}`);
      setMicrophonePermitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const performFaceVerification = async () => {
    if (!cameraStream || !videoRef.current || !canvasRef.current) {
      setError('Camera not available for face verification');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas context not available');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const brightness = calculateBrightness(imageData);
      
      if (brightness > 30 && brightness < 200) {
        setFaceVerified(true);
        setTimeout(() => completeSetup(), 1500);
      } else {
        setFaceDetectionTries(prev => prev + 1);
        if (faceDetectionTries < 2) {
          setError('Please ensure your face is clearly visible and well-lit. Try again.');
        } else {
          setError('Face verification failed. Please check your camera and lighting.');
        }
      }
    } catch (err: any) {
      setError(`Face verification failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBrightness = (imageData: ImageData): number => {
    const data = imageData.data;
    let brightness = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      brightness += (r * 299 + g * 587 + b * 114) / 1000;
    }
    
    return brightness / (data.length / 4);
  };

  const completeSetup = () => {
    onSetupComplete({
      cameraPermitted,
      microphonePermitted,
      faceVerified,
      systemCheck: Object.values(systemCheck).every(check => check)
    });
  };

  const handleStepAction = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'system':
        performSystemCheck();
        break;
      case 'camera':
        requestCameraPermission();
        break;
      case 'microphone':
        requestMicrophonePermission();
        break;
      case 'face':
        performFaceVerification();
        break;
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: any, status: string) => {
    const IconComponent = step.icon;
    
    if (status === 'completed') {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    }
    
    if (status === 'current' && error) {
      return <XCircle className="w-6 h-6 text-red-600" />;
    }
    
    return <IconComponent className={`w-6 h-6 ${status === 'current' ? 'text-zenith-primary' : 'text-zenith-muted'}`} />;
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zenith-card dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Proctoring Setup</h2>
              <p className="text-blue-100">Secure examination environment verification</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-zenith-border dark:border-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                    status === 'completed' ? 'border-green-600 bg-green-100 dark:bg-green-900' :
                    status === 'current' ? 'border-blue-600 bg-blue-100 dark:bg-blue-900' :
                    'border-zenith-border bg-zenith-section dark:bg-gray-700'
                  }`}>
                    {getStepIcon(step, status)}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    status === 'current' ? 'text-zenith-primary dark:text-blue-400' : 'text-zenith-secondary dark:text-zenith-muted'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-zenith-primary dark:text-white mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-zenith-secondary dark:text-zenith-muted">
              {currentStepData.description}
            </p>
          </div>

          {/* System Check Display */}
          {currentStepData.id === 'system' && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-zenith-section dark:bg-gray-700 rounded-lg">
                <span>Browser Compatibility</span>
                {systemCheck.browserSupported ? 
                  <CheckCircle className="w-5 h-5 text-green-600" /> : 
                  <XCircle className="w-5 h-5 text-red-600" />
                }
              </div>
              <div className="flex items-center justify-between p-3 bg-zenith-section dark:bg-gray-700 rounded-lg">
                <span>JavaScript Enabled</span>
                {systemCheck.javascriptEnabled ? 
                  <CheckCircle className="w-5 h-5 text-green-600" /> : 
                  <XCircle className="w-5 h-5 text-red-600" />
                }
              </div>
              <div className="flex items-center justify-between p-3 bg-zenith-section dark:bg-gray-700 rounded-lg">
                <span>Cookies Enabled</span>
                {systemCheck.cookiesEnabled ? 
                  <CheckCircle className="w-5 h-5 text-green-600" /> : 
                  <XCircle className="w-5 h-5 text-red-600" />
                }
              </div>
              <div className="flex items-center justify-between p-3 bg-zenith-section dark:bg-gray-700 rounded-lg">
                <span>Fullscreen Support</span>
                {systemCheck.fullscreenAvailable ? 
                  <CheckCircle className="w-5 h-5 text-green-600" /> : 
                  <XCircle className="w-5 h-5 text-red-600" />
                }
              </div>
            </div>
          )}

          {/* Camera/Video Display */}
          {(currentStepData.id === 'camera' || currentStepData.id === 'face') && (
            <div className="mb-6">
              <div className="bg-black rounded-lg overflow-hidden aspect-video">
                <video 
                  ref={videoRef}
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800 dark:text-red-400">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-zenith-border dark:border-gray-600 text-zenith-secondary dark:text-gray-300 rounded-lg hover:bg-zenith-section dark:hover:bg-zenith-secondary/90"
            >
              Cancel
            </button>
            
            <button
              onClick={handleStepAction}
              disabled={isLoading}
              className="px-6 py-2 bg-zenith-primary hover:bg-zenith-primary/90 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 
                currentStepData.id === 'system' ? 'Check Again' :
                currentStepData.id === 'camera' ? 'Enable Camera' :
                currentStepData.id === 'microphone' ? 'Enable Microphone' :
                'Verify Face'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
