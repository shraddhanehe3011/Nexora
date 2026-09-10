import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';

export default function ScanPage() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [manual, setManual] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    let scanner;
    let cancelled = false;

    async function start() {
      try {
        setStatus('requesting_camera');
        scanner = new Html5Qrcode('nexora-barcode-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          async (decoded) => {
            if (cancelled) return;
            setStatus('detected');
            try {
              await scanner.stop();
            } catch {
              // ignore
            }
            await lookup(decoded);
          },
          () => {}
        );
        if (!cancelled) setStatus('scanning');
      } catch {
        if (!cancelled) setStatus('camera_error');
      }
    }

    start();

    return () => {
      cancelled = true;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookup = async (barcode) => {
    setLookingUp(true);
    try {
      const data = await productService.barcode(barcode);
      toast.success('Product found');
      navigate(`/app/products/${data.product.id || barcode}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Barcode not found in Open Food Facts'));
      setStatus('retry');
    } finally {
      setLookingUp(false);
    }
  };

  const onManual = async (e) => {
    e.preventDefault();
    if (!manual.trim()) return;
    await lookup(manual.trim());
  };

  const retry = () => window.location.reload();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Scan Barcode</h1>
        <p className="mt-2 text-sm text-muted">
          Camera-based detection with manual fallback. Detected codes are sent to the backend.
        </p>
      </div>

      <div className="card overflow-hidden p-4">
        <div id="nexora-barcode-reader" className="overflow-hidden rounded-xl" />
        <p className="mt-3 text-sm text-muted" role="status">
          Status:{' '}
          {lookingUp
            ? 'Looking up product…'
            : status === 'scanning'
              ? 'Scanning — point at a barcode'
              : status === 'requesting_camera'
                ? 'Requesting camera permission…'
                : status === 'camera_error'
                  ? 'Camera unavailable — use manual entry'
                  : status === 'detected'
                    ? 'Barcode detected'
                    : status === 'retry'
                      ? 'Ready to retry'
                      : 'Initializing'}
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn-secondary" onClick={retry}>
            Retry scanner
          </button>
        </div>
      </div>

      <form onSubmit={onManual} className="card space-y-3 p-4">
        <h2 className="font-semibold text-ink">Manual barcode input</h2>
        <input
          className="input"
          inputMode="numeric"
          placeholder="Enter barcode digits"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          aria-label="Manual barcode"
        />
        <button className="btn-primary" disabled={lookingUp}>
          {lookingUp ? 'Looking up…' : 'Look up barcode'}
        </button>
      </form>
    </div>
  );
}
