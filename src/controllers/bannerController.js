import prisma from '../utils/prisma.js';

export const getBanners = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const { all } = req.query;

  try {
    const paginationEnabled = req.query.page || req.query.limit;

    const banners = await prisma.banner.findMany({
      where: all === 'true' ? {} : { isActive: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    if (!paginationEnabled) {
      return res.json(banners);
    }

    const total = await prisma.banner.count({ where: all === 'true' ? {} : { isActive: true } });

    res.json({ data: banners, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    if (/Unknown argument `order`/.test(error.message)) {
      try {
        const banners = await prisma.banner.findMany({
          where: all === 'true' ? {} : { isActive: true },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        });

        if (!paginationEnabled) {
          return res.json(banners);
        }

        const total = await prisma.banner.count({ where: all === 'true' ? {} : { isActive: true } });
        return res.json({ data: banners, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
      } catch (err) {
        return res.status(500).json({ message: err.message });
      }
    }
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
