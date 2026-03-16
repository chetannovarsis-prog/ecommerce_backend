import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getCollections = async (req, res) => {
  try {
    const collections = await prisma.collection.findMany();
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    const collection = await prisma.collection.create({
      data: { name, description, imageUrl }
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
