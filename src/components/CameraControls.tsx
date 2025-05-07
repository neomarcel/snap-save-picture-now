
import { Camera, ImagePlus } from 'lucide-react';
import { Button } from '../components/ui/button';

interface CameraControlsProps {
  isCapturing: boolean;
  hasPermission: boolean | null;
  capturedImage: string | null;
  onStartCamera: () => void;
  onCapturePhoto: () => void;
}

const CameraControls = ({ 
  isCapturing, 
  hasPermission, 
  capturedImage, 
  onStartCamera, 
  onCapturePhoto 
}: CameraControlsProps) => {
  
  if (capturedImage) {
    return null; // Controls are handled by ImagePreview when we have a captured image
  }
  
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {isCapturing ? (
        <button 
          onClick={onCapturePhoto}
          className="w-16 h-16 bg-camera-primary rounded-full flex items-center justify-center border-4 border-white shadow-lg relative mb-4"
          aria-label="Take photo"
        >
          <span className="absolute inset-0 rounded-full animate-pulse-ring bg-camera-primary opacity-50"></span>
        </button>
      ) : (
        <Button 
          onClick={onStartCamera}
          className="bg-camera-primary hover:bg-camera-primary/90 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Camera className="w-5 h-5" />
          Start Camera
        </Button>
      )}
      
      {isCapturing && (
        <p className="text-sm text-camera-gray mt-2">Tap the button to capture</p>
      )}
    </div>
  );
};

export default CameraControls;
