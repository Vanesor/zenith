'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Mic, CheckCircle, XCircle, AlertTriangle, Eye, Monitor, Shield } from 'lucide-react';

interface ProctoringSetupProps {
  onSetupComplete: (setupData: {
    cameraPermitted: boolean;
    microphonePermitted: boolean;
    faceVerified: boolean;
    systemCheck: boolean;
  }) => void;
  onCancel: () => void;
  requireCamera: boolean;
  requireMicrophone: boolean;
  requireFaceVerification: boolean;
}

interface SystemCheck {
  browserSupported: boolean;
  javascriptEnabled: boolean;
  cookiesEnabled: boolean;
  fullscreenAvailable: boolean;
}

export function ProctoringSetup({ 
  onSetupComplete, 
  onCancel, 
  requireCamera, 
  requireMicrophone, 
  requireFaceVerification 
}: ProctoringSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
  const [cameraPermitted, setCameraPermitted] = useState(false);
  const [microphonePermitted, setMicrophonePermitted] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [systemCheck, setSystemCheck] = useState<SystemCheck>({
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
      required: requireCamera
    },
    {
      id: 'microphone',
      title: 'Microphone Access',
      description: 'Enable microphone for audio monitoring',
      icon: Mic,
      required: requireMicrophone
    },
    {
      id: 'face',
      title: 'Face Verification',
      description: 'Verify your identity using facial recognition',
      icon: Eye,
      required: requireFaceVerification
    }
  ].filter(step => step.required);

  useEffect(() => {
    performSystemCheck();
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup streams on unmount
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
      javascriptEnabled: true, // If this runs, JS is enabled
      cookiesEnabled: checkCookiesEnabled(),
      fullscreenAvailable: checkFullscreenSupport()
    };

    setSystemCheck(checks);
    setIsLoading(false);

    // Auto-advance if all checks pass
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

      // Auto-advance to next step
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

      // Auto-advance to next step
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
      // Simple face detection simulation
      // In a real implementation, you would use a face detection library
      // like face-api.js or TensorFlow.js
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas context not available');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Simulate face detection with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simple brightness check to ensure someone is in front of camera
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const brightness = calculateBrightness(imageData);
      
      if (brightness > 30 && brightness < 200) { // Reasonable brightness range
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
    
    return <IconComponent className={`w-6 h-6 ${status === 'current' ? 'text-primary' : 'text-zenith-muted'}`} />;
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-primary p-6 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Proctoring Setup</h2>
              <p className="text-blue-100">Secure examination environment verification</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-custom dark:border-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                    status === 'completed' ? 'border-green-600 bg-green-100 dark:bg-green-900' :
                    status === 'current' ? 'border-blue-600 bg-blue-100 dark:bg-blue-900' :
                    'border-custom bg-zenith-section dark:bg-gray-700'
                  }`}>
                    {getStepIcon(step, status)}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    status === 'current' ? 'text-primary dark:text-blue-400' : 'text-zenith-secondary dark:text-zenith-muted'
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
            <h3 className="text-xl font-semibold text-primary mb-2">
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
              className="px-6 py-2 border border-custom dark:border-gray-600 text-zenith-secondary dark:text-gray-300 rounded-lg hover:bg-zenith-section dark:hover:bg-zenith-secondary/90"
            >
              Cancel
            </button>
            
            <button
              onClick={handleStepAction}
              disabled={isLoading}
              className="px-6 py-2 bg-zenith-primary hover:bg-zenith-primary/90 text-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
