import prisma from '../utils/prisma.js';

export const getBanners = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const { all } = req.query;

  try {
    const paginationEnabled = req.query.page || req.query.limit;

    let banners;
    try {
      banners = await prisma.banner.findMany({
        where: all === 'true' ? {} : { isActive: true },
        skip,
        take: limit,
        orderBy: { order: 'asc' }
      });
    } catch (innerErr) {
      // Fallback when 'order' is not present or not accepted in schema
      if (/Unknown argument `order`/.test(innerErr.message)) {
        banners = await prisma.banner.findMany({
          where: all === 'true' ? {} : { isActive: true },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        });
      } else {
        throw innerErr;
      }
    }

    if (!paginationEnabled) {
      return res.json(banners);
    }

    const total = await prisma.banner.count({ where: all === 'true' ? {} : { isActive: true } });
    res.json({ data: banners, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Banner fetch failed:', error);
    res.status(500).json({ message: error.message });
  }
};


export const createBanner = async (req, res) => {
  try {
    const banner = await prisma.banner.create({
      data: req.body
    });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    await prisma.banner.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
