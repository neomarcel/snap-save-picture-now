
import { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, CameraOff, Save } from 'lucide-react';
import { toast } from '../components/ui/use-toast';
import CameraControls from './CameraControls';
import ImagePreview from './ImagePreview';

const Camera = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
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
    
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `photo-${new Date().toISOString()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Photo Saved",
      description: "Photo downloaded to your device."
    });
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
