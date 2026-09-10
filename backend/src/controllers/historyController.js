const Analysis = require('../models/Analysis');
const { success } = require('../utils/helpers');
const { toPublicProduct } = require('../integrations/openFoodFacts/normalize');

async function getHistory(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const sort = req.query.sort === 'asc' ? 1 : -1;
  const search = (req.query.search || '').trim();

  const filter = { userId: req.user._id };

  const analyses = await Analysis.find(filter)
    .sort({ createdAt: sort })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('productId');

  let items = analyses.map((a) => {
    const product = toPublicProduct(a.productId);
    return {
      id: a._id.toString(),
      analysisId: a._id.toString(),
      product: {
        id: product?.id,
        productName: product?.productName,
        brand: product?.brand,
        imageUrl: product?.imageUrl,
      },
      date: a.createdAt,
      overallScore: a.overallScore,
      personalizedScore: a.personalizedScore,
      status: a.status,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (i) =>
        i.product?.productName?.toLowerCase().includes(q) ||
        i.product?.brand?.toLowerCase().includes(q)
    );
  }

  const total = await Analysis.countDocuments(filter);

  return success(res, {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

module.exports = { getHistory };
