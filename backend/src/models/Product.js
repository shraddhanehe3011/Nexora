const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema(
  {
    energyKcal100g: { type: Number, default: null },
    fat100g: { type: Number, default: null },
    saturatedFat100g: { type: Number, default: null },
    carbohydrates100g: { type: Number, default: null },
    sugars100g: { type: Number, default: null },
    fibre100g: { type: Number, default: null },
    proteins100g: { type: Number, default: null },
    salt100g: { type: Number, default: null },
    sodium100g: { type: Number, default: null },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    source: { type: String, default: 'openfoodfacts' },
    sourceProductId: { type: String, index: true },
    barcode: { type: String, index: true, sparse: true },
    productName: { type: String, default: null },
    brand: { type: String, default: null },
    imageUrl: { type: String, default: null },
    categories: [{ type: String }],
    ingredientsText: { type: String, default: null },
    ingredients: [{ type: String }],
    nutrition: { type: nutritionSchema, default: () => ({}) },
    servingSize: { type: String, default: null },
    additives: [{ type: String }],
    allergens: [{ type: String }],
    labels: [{ type: String }],
    novaGroup: { type: Number, default: null },
    nutriScore: { type: String, default: null },
    countries: [{ type: String }],
    packaging: { type: String, default: null },
    rawSourceData: { type: mongoose.Schema.Types.Mixed, default: null },
    lastFetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

productSchema.index({ productName: 'text', brand: 'text' });
productSchema.index(
  { source: 1, sourceProductId: 1 },
  { unique: true, partialFilterExpression: { sourceProductId: { $type: 'string' } } }
);

module.exports = mongoose.model('Product', productSchema);
