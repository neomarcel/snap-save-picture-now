
import Camera from "../components/Camera";

const Index = () => {
  return (
    <div className="min-h-screen bg-camera-dark py-8 px-4">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">SnapSave</h1>
          <p className="text-camera-gray">Take photos and save them instantly</p>
        </header>
        
        <Camera />
        
        <footer className="mt-12 text-center text-sm text-camera-gray">
          <p>Make sure to allow camera permissions when prompted.</p>
          <p className="mt-2">Photos are saved locally and not uploaded anywhere.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
