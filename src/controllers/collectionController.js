import prisma from '../utils/prisma.js';

export const getCollections = async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        products: {
          select: { id: true }
        }
      },
      orderBy: { order: 'asc' }
    });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    
    // Check for existing collection with same name
    const existing = await prisma.collection.findUnique({
      where: { name }
    });

    if (existing) {
      return res.status(400).json({ message: 'Collection already exists with this name' });
    }

    // Get the highest order number
    const lastCollection = await prisma.collection.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    const nextOrder = lastCollection ? lastCollection.order + 1 : 0;

    const collection = await prisma.collection.create({
      data: { name, description, imageUrl, order: nextOrder }
    });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    const collection = await prisma.collection.update({
      where: { id: req.params.id },
      data: { name, description, imageUrl }
    });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCollectionById = async (req, res) => {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: req.params.id },
      include: { products: true }
    });
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCollection = async (req, res) => {
  try {
    await prisma.collection.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Collection deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const reorderCollections = async (req, res) => {
  const { items } = req.body; // Array of { id, order }
  try {
    await Promise.all(
      items.map((item) =>
        prisma.collection.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );
    res.json({ message: 'Collections reordered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
