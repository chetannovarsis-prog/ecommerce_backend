import prisma from '../utils/prisma.js';

export const getBanners = async (req, res) => {
  try {
    const { all } = req.query;
    const banners = await prisma.banner.findMany({
      where: all === 'true' ? {} : { isActive: true },
      orderBy: { order: 'asc' }
    });
    res.json(banners);
  } catch (error) {
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
