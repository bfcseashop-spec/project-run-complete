import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCw, Maximize2, FileText } from "lucide-react";

export interface LightboxImage {
  id: string;
  name: string;
  url: string;
  type: "image" | "pdf";
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImageLightbox = ({ images, initialIndex = 0, open, onOpenChange }: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setRotation(0);
    }
  }, [open, initialIndex]);

  const current = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) { setCurrentIndex((i) => i - 1); setZoom(1); setRotation(0); }
  }, [hasPrev]);

  const goNext = useCallback(() => {
    if (hasNext) { setCurrentIndex((i) => i + 1); setZoom(1); setRotation(0); }
  }, [hasNext]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goPrev, goNext, onOpenChange]);

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none [&>button]:hidden">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="text-white/90">
            <p className="text-sm font-medium truncate max-w-[300px]">{current.name}</p>
            <p className="text-xs text-white/50">{currentIndex + 1} of {images.length}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setZoom((z) => Math.min(z + 0.5, 5))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setZoom((z) => Math.max(z - 0.5, 0.5))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setRotation((r) => r + 90)}>
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={() => { setZoom(1); setRotation(0); }}>
              <Maximize2 className="w-4 h-4" />
            </Button>
            <div className="w-px h-5 bg-white/20 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image area */}
        <div className="flex items-center justify-center w-full h-full overflow-hidden select-none">
          {current.type === "image" ? (
            <img
              src={current.url}
              alt={current.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-grab active:cursor-grabbing"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              draggable={false}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/70">
              <FileText className="w-16 h-16" />
              <p className="text-sm">{current.name}</p>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => window.open(current.url, "_blank")}>
                Open PDF
              </Button>
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {hasPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
            onClick={goPrev}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
            onClick={goNext}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => { setCurrentIndex(i); setZoom(1); setRotation(0); }}
                className={`w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${i === currentIndex ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-90"}`}
              >
                {img.type === "image" ? (
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white/70" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Zoom indicator */}
        {zoom !== 1 && (
          <div className="absolute bottom-16 right-4 z-20 bg-black/60 text-white/80 text-xs px-2 py-1 rounded">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
