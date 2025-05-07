
import { Camera, Save } from 'lucide-react';
import { Button } from '../components/ui/button';

interface ImagePreviewProps {
  imageUrl: string;
  onSave: () => void;
  onRetake: () => void;
}

const ImagePreview = ({ imageUrl, onSave, onRetake }: ImagePreviewProps) => {
  return (
    <div className="relative w-full h-full">
      <img 
        src={imageUrl} 
        alt="Captured" 
        className="w-full h-full object-cover"
      />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={onRetake}
            className="bg-camera-dark hover:bg-camera-dark/90 text-white flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Retake
          </Button>
          
          <Button
            onClick={onSave}
            className="bg-camera-primary hover:bg-camera-primary/90 text-white flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
