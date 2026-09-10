const path = require('path');
const { Worker } = require('worker_threads');
const { extractENumbers } = require('../../services/ingredientAnalyzer');
const { toNumberOrNull } = require('../../utils/helpers');

function extractBarcode(text) {
  const digits = String(text || '').replace(/\D+/g, ' ');
  const candidates = digits.match(/\b\d{8,14}\b/g) || [];
  const preferred = candidates.find((c) => c.length === 13 || c.length === 12 || c.length === 8);
  return preferred || candidates[0] || null;
}

function extractLabeledNumber(text, labels) {
  const lines = String(text || '').split(/\r?\n/);
  for (const line of lines) {
    for (const label of labels) {
      const re = new RegExp(`${label}[^0-9]{0,20}([0-9]+(?:[.,][0-9]+)?)`, 'i');
      const m = line.match(re);
      if (m) return toNumberOrNull(m[1].replace(',', '.'));
    }
  }
  return null;
}

function extractSection(text, startLabels, endLabels = []) {
  const lower = String(text || '');
  let start = -1;
  for (const label of startLabels) {
    const idx = lower.search(new RegExp(label, 'i'));
    if (idx >= 0) {
      start = idx;
      break;
    }
  }
  if (start < 0) return null;

  let end = lower.length;
  for (const label of endLabels) {
    const idx = lower.slice(start + 5).search(new RegExp(label, 'i'));
    if (idx >= 0) {
      end = start + 5 + idx;
      break;
    }
  }

  const chunk = lower.slice(start, end).replace(/^.*?:\s*/i, '').trim();
  return chunk || null;
}

function estimateConfidence(text, fields) {
  const filled = Object.values(fields).filter((v) => v != null && v !== '').length;
  const lengthScore = Math.min(1, String(text || '').length / 400);
  const fieldScore = filled / 8;
  const value = Math.round((lengthScore * 0.4 + fieldScore * 0.6) * 100) / 100;
  let label = 'low';
  if (value >= 0.7) label = 'high';
  else if (value >= 0.45) label = 'medium';
  return { value, label };
}

function runTesseractInWorker(filePath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'tesseractWorker.js'), {
      workerData: { filePath },
    });

    const timer = setTimeout(() => {
      worker.terminate().catch(() => {});
      reject(new Error('OCR timed out'));
    }, 90000);

    worker.on('message', (msg) => {
      clearTimeout(timer);
      if (msg.ok) resolve(msg.text || '');
      else reject(new Error(msg.error || 'OCR failed'));
    });

    worker.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    worker.on('exit', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`OCR worker exited with code ${code}`));
      }
    });
  });
}

async function processImage(filePath) {
  const fs = require('fs');
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Uploaded image file not found');
  }

  const stats = fs.statSync(filePath);
  if (stats.size < 50) {
    throw new Error('Image file is too small or corrupted');
  }

  let extractedText = '';
  try {
    extractedText = await runTesseractInWorker(filePath);
  } catch (err) {
    // Soft-fail OCR so the API stays up; return empty extraction
    extractedText = '';
    const detectedBarcode = null;
    return {
      source: 'User uploaded package image',
      extractedText: '',
      detectedBarcode,
      nutritionData: {
        energyKcal: null,
        sugar: null,
        fat: null,
        protein: null,
        fibre: null,
        salt: null,
        sodium: null,
      },
      ingredientsText: null,
      allergens: [],
      additives: [],
      productName: null,
      brand: null,
      servingSize: null,
      confidence: 'low',
      confidenceValue: 0,
      ocrError: err.message || 'OCR could not read this image',
    };
  }

  const detectedBarcode = extractBarcode(extractedText);

  const ingredientsText = extractSection(
    extractedText,
    ['ingredients', 'ingredient list'],
    ['nutrition', 'allergens', 'manufactured', 'storage', 'nutritional']
  );

  const allergensText = extractSection(
    extractedText,
    ['allergens', 'contains', 'allergy advice'],
    ['ingredients', 'nutrition', 'manufactured', 'storage']
  );

  const nutritionData = {
    energyKcal: extractLabeledNumber(extractedText, ['energy', 'calories', 'kcal']),
    sugar: extractLabeledNumber(extractedText, ['sugars?', 'total sugar']),
    fat: extractLabeledNumber(extractedText, ['total fat', '\\bfat\\b']),
    protein: extractLabeledNumber(extractedText, ['protein']),
    fibre: extractLabeledNumber(extractedText, ['fibre', 'fiber']),
    salt: extractLabeledNumber(extractedText, ['\\bsalt\\b']),
    sodium: extractLabeledNumber(extractedText, ['sodium']),
  };

  const productNameGuess =
    extractedText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 3 && l.length < 60 && !/ingredient|nutrition|allerg/i.test(l)) || null;

  const fields = {
    productName: productNameGuess,
    brand: null,
    ingredientsText,
    allergens: allergensText,
    ...nutritionData,
    detectedBarcode,
  };

  const confidence = estimateConfidence(extractedText, fields);

  return {
    source: 'User uploaded package image',
    extractedText,
    detectedBarcode,
    nutritionData,
    ingredientsText,
    allergens: allergensText
      ? allergensText
          .split(/,|;|\n/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    additives: extractENumbers(extractedText),
    productName: productNameGuess,
    brand: null,
    servingSize: null,
    confidence: confidence.label,
    confidenceValue: confidence.value,
  };
}

module.exports = {
  processImage,
  extractBarcode,
  extractLabeledNumber,
  estimateConfidence,
};
