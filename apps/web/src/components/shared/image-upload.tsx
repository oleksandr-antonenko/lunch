'use client';

import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@web/lib/utils';

export function ImageUpload({
  onUpload,
  className,
}: {
  onUpload: (file: File) => void;
  className?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setPreview(URL.createObjectURL(file));
      onUpload(file);
    },
    [onUpload],
  );

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
        input.capture = 'environment';
        input.onchange = () => {
          const file = input.files?.[0];
          if (file) handleFile(file);
        };
        input.click();
      }}
    >
      {preview ? (
        <img
          src={preview}
          alt="Upload preview"
          className="max-h-48 rounded object-contain"
        />
      ) : (
        <>
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Drop an image or click to upload
          </p>
        </>
      )}
    </div>
  );
}
