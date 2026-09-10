const { parentPort, workerData } = require('worker_threads');
const Tesseract = require('tesseract.js');

async function run() {
  try {
    const result = await Tesseract.recognize(workerData.filePath, 'eng', {
      logger: () => {},
    });
    parentPort.postMessage({ ok: true, text: result?.data?.text || '' });
  } catch (err) {
    parentPort.postMessage({
      ok: false,
      error: err?.message || 'OCR recognition failed',
    });
  }
}

run();
