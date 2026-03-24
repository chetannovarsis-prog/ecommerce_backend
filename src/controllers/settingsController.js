import prisma from '../utils/prisma.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await prisma.globalSetting.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.globalSetting.create({
        data: { id: 'default', codEnabled: false }
      });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  const { codEnabled } = req.body;
  try {
    const settings = await prisma.globalSetting.upsert({
      where: { id: 'default' },
      update: { codEnabled },
      create: { id: 'default', codEnabled }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
