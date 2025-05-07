
import { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, CameraOff, Save } from 'lucide-react';
import { toast } from '../components/ui/use-toast';
import CameraControls from './CameraControls';
import ImagePreview from './ImagePreview';

const Camera = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState<number>(0);
  const [deviceRotation, setDeviceRotation] = useState<number>(0);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Detect iOS
  useEffect(() => {
    // iOS detection using userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                        !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    console.log("Detected iOS device:", isIOSDevice);
  }, []);

  // Track screen orientation
  useEffect(() => {
    const handleScreenOrientation = () => {
      // Get screen orientation in degrees (0, 90, 180, or 270)
      const orientation = window.screen.orientation 
        ? window.screen.orientation.angle 
        : window.orientation || 0;
      
      setDeviceOrientation(orientation);
      console.log("Screen orientation:", orientation);
    };

    // Set initial orientation
    handleScreenOrientation();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', handleScreenOrientation);
    
    if (window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleScreenOrientation);
    }
    
    return () => {
      window.removeEventListener('orientationchange', handleScreenOrientation);
      if (window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleScreenOrientation);
      }
    };
  }, []);

  // Track actual device orientation using device motion sensors
  useEffect(() => {
    // Handle device orientation event
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      // On iOS, we need to request permission for DeviceOrientation events
      if (isIOS && event.alpha === null && event.beta === null && event.gamma === null) {
        console.log("No orientation data available - may need permission on iOS");
        return;
      }
      
      // Beta value represents front-to-back tilt in degrees, where front is positive
      // Gamma value represents left-to-right tilt in degrees, where right is positive
      const { beta, gamma } = event;
      
      if (beta === null || gamma === null) return;
      
      console.log("Device orientation data:", { beta, gamma });
      
      // Determine device rotation based on beta and gamma values
      let rotation = 0;
      
      // For iOS, we need different orientation detection logic
      if (isIOS) {
        // iOS-specific orientation detection
        if (Math.abs(gamma!) > 45) {
          // Device is in landscape
          rotation = gamma! > 0 ? 90 : -90;
        } else {
          // Device is in portrait
          rotation = beta! < 0 ? 180 : 0;
        }
      } else {
        // Android orientation detection (existing logic)
        // Portrait mode (normal holding position)
        if (Math.abs(gamma!) < 45) {
          if (beta! > 45) rotation = 0; // normal portrait
          else if (beta! < -45) rotation = 180; // upside down portrait
        }
        // Landscape mode
        else {
          if (gamma! > 45) rotation = 90; // landscape right
          else if (gamma! < -45) rotation = 270; // landscape left
        }
      }
      
      console.log("Calculated device rotation:", rotation);
      setDeviceRotation(rotation);
    };

    // Add event listener for device orientation
    window.addEventListener('deviceorientation', handleDeviceOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [isIOS]);

  const requestCameraPermission = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasPermission(false);
      toast({
        title: "Camera Access Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Set canvas dimensions based on video dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // First draw the video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Store the orientation with the image
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        
        // Store the captured image along with the current device orientation data
        setCapturedImage(imageDataUrl);
        stopCamera();
        toast({
          title: "Photo Captured",
          description: "Your photo has been taken successfully."
        });
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      toast({
        title: "Capture Error",
        description: "Failed to capture photo.",
        variant: "destructive"
      });
    }
  };

  const savePhoto = () => {
    if (!capturedImage) return;
    
    // Create a new canvas to apply orientation before saving
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Log the orientation values we'll use for debugging
      console.log("Saving with orientation data:", {
        deviceRotation,
        deviceOrientation,
        isIOS
      });
      
      // Use deviceRotation from motion sensors first, fall back to screen orientation if needed
      let actualRotation = deviceRotation;
      
      // For iOS devices, we need special handling
      if (isIOS) {
        // Normalize iOS rotation values
        if (actualRotation === -90) actualRotation = 270;
        console.log("iOS normalized rotation:", actualRotation);
      }
      
      // Apply rotation based on device orientation
      let width = img.width;
      let height = img.height;
      
      if (actualRotation === 90 || actualRotation === 270) {
        // For landscape orientations, swap dimensions
        canvas.width = height;
        canvas.height = width;
        
        ctx.save();
        // Move to the center of the canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);
        // Rotate based on the determined rotation
        ctx.rotate((actualRotation * Math.PI) / 180);
        // Draw the image, accounting for the rotation
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();
      } else if (actualRotation === 180) {
        // For upside down portrait
        canvas.width = width;
        canvas.height = height;
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI); // 180 degrees in radians
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();
      } else {
        // Normal portrait orientation (0 degrees)
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
      }
      
      // Get the corrected image data URL
      const orientedImageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      // Create download link with the oriented image
      const link = document.createElement('a');
      link.href = orientedImageDataUrl;
      link.download = `photo-${new Date().toISOString()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Photo Saved",
        description: "Photo downloaded to your device with correct orientation."
      });
    };
    
    img.src = capturedImage;
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    requestCameraPermission();
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      <div className="relative w-full aspect-[3/4] bg-camera-dark rounded-lg overflow-hidden shadow-lg mb-4">
        {capturedImage ? (
          <ImagePreview 
            imageUrl={capturedImage} 
            onSave={savePhoto} 
            onRetake={retakePhoto} 
          />
        ) : (
          <>
            {isCapturing && (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />
            )}
            {!isCapturing && (
              <div className="flex flex-col items-center justify-center h-full text-camera-light">
                {hasPermission === false ? (
                  <>
                    <CameraOff className="w-16 h-16 mb-4 text-camera-primary" />
                    <p className="text-lg font-medium mb-2">Camera Access Denied</p>
                    <p className="text-sm text-camera-gray">Please check your browser permissions</p>
                  </>
                ) : (
                  <>
                    <CameraIcon className="w-16 h-16 mb-4 text-camera-primary" />
                    <p className="text-lg font-medium mb-2">Ready to Capture</p>
                    <p className="text-sm text-camera-gray">Tap the button below to start</p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      <CameraControls 
        isCapturing={isCapturing} 
        hasPermission={hasPermission} 
        onStartCamera={requestCameraPermission} 
        onCapturePhoto={capturePhoto} 
        capturedImage={capturedImage}
      />
    </div>
  );
};

export default Camera;
