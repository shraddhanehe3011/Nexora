import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload as UploadIcon, ImageIcon } from 'lucide-react';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onFile = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) {
      toast.error('Use JPG, JPEG, PNG, or WebP');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const submit = async () => {
    if (!file) {
      toast.error('Choose an image first');
      return;
    }
    setProcessing(true);
    try {
      const data = await productService.analyzeImage(file);
      setResult(data);
      toast.success(data.processing?.message || 'Processing complete');
      if (data.analysis?.id) {
        navigate(`/app/analysis/${data.analysis.id}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Image analysis failed'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Upload Product Image</h1>
        <p className="mt-2 text-sm text-muted">
          Upload a package photo for OCR, Open Food Facts matching, and verification.
        </p>
      </div>

      <div className="card space-y-4 p-6">
        <label
          htmlFor="image"
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-nexora-200 bg-nexora-50/50 px-6 py-10 text-center transition hover:border-nexora-400"
        >
          {preview ? (
            <img
              src={preview}
              alt="Selected package preview"
              className="max-h-72 rounded-xl object-contain"
            />
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-nexora-500" />
              <p className="mt-3 font-semibold text-ink">Tap to upload or take a photo</p>
              <p className="mt-1 text-xs text-muted">JPG, JPEG, PNG, WebP</p>
            </>
          )}
          <input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            capture="environment"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>

        <button className="btn-primary w-full py-3" onClick={submit} disabled={processing || !file}>
          <UploadIcon className="h-4 w-4" />
          {processing ? 'OCR processing…' : 'Upload & analyse'}
        </button>
      </div>

      {processing ? (
        <div className="card p-5 text-sm text-muted" role="status">
          Running OCR and matching against Open Food Facts…
        </div>
      ) : null}

      {result && !result.analysis ? (
        <div className="card space-y-3 p-5 text-sm">
          <h2 className="font-semibold text-ink">Extracted information</h2>
          <p>Match status: {result.matchStatus}</p>
          <p>Detected barcode: {result.ocr?.detectedBarcode || 'Not available'}</p>
          <p>OCR confidence: {result.ocr?.confidence || 'unknown'}</p>
          <p className="text-amber-700">
            OCR completed but no reliable Open Food Facts match was found.
          </p>
        </div>
      ) : null}
    </div>
  );
}
