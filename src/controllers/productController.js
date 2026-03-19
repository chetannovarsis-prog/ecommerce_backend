import prisma from '../utils/prisma.js';

export const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        categories: true,
        collections: true,
        variants: true,
        reviews: true
      }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if it's a UUID or a handle
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    const product = await prisma.product.findUnique({
      where: isUuid ? { id } : { handle: id },
      include: {
        categories: true,
        collections: true,
        variants: true,
        reviews: true
      }
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name, subtitle, handle, description, price, images,
      categoryId, categoryIds, collectionId, collectionIds, stock, isDiscountable,
      discountPrice, thumbnailUrl, hoverThumbnailUrl, variants
    } = req.body;

    // Ensure unique name
    if (name) {
      const existingProduct = await prisma.product.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } }
      });
      if (existingProduct) {
        return res.status(400).json({ message: 'A product with this name already exists' });
      }
    }

    const sanitizedPrice = isNaN(parseFloat(price)) ? 0 : parseFloat(price);
    const sanitizedStock = isNaN(parseInt(stock)) ? 0 : parseInt(stock);
    const sanitizedDiscountPrice = isDiscountable ? (isNaN(parseFloat(discountPrice)) ? 0 : parseFloat(discountPrice)) : null;

    const productHandle = handle || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const product = await prisma.product.create({
      data: {
        name,
        subtitle,
        handle: productHandle,
        description,
        price: sanitizedPrice,
        images,
        thumbnailUrl,
        hoverThumbnailUrl,
        categories: (categoryIds || (categoryId ? [categoryId] : null)) ? {
          connect: (categoryIds || [categoryId]).filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
        } : undefined,
        collections: (collectionIds || (collectionId ? [collectionId] : null)) ? {
          connect: (collectionIds || [collectionId]).filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
        } : undefined,
        stock: sanitizedStock,
        isDiscountable: !!isDiscountable,
        discountPrice: sanitizedDiscountPrice,
        variants: {
          create: (variants || []).map(v => ({
            title: v.title,
            price: (v.price === null || v.price === undefined || v.price === '') ? null : parseFloat(v.price),
            stock: parseInt(v.stock) || 0,
            images: v.images || []
          }))
        }
      },
      include: { variants: true }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const {
      name, subtitle, handle, description, price, images,
      categoryId, categoryIds, collectionId, collectionIds, stock, isDiscountable,
      discountPrice, thumbnailUrl, hoverThumbnailUrl, variants
    } = req.body;

    if (name) {
      const existingProduct = await prisma.product.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          id: { not: req.params.id }
        }
      });
      if (existingProduct) {
        return res.status(400).json({ message: 'A product with this name already exists' });
      }
    }

    const sanitizedPrice = isNaN(parseFloat(price)) ? undefined : parseFloat(price);
    const sanitizedStock = isNaN(parseInt(stock)) ? undefined : parseInt(stock);
    const sanitizedDiscountPrice = isDiscountable ? (isNaN(parseFloat(discountPrice)) ? 0 : parseFloat(discountPrice)) : null;

    // Resolve handle
    let productHandle = handle;
    if (!productHandle && name) {
      productHandle = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        subtitle,
        handle: productHandle,
        description,
        price: sanitizedPrice,
        images,
        thumbnailUrl,
        hoverThumbnailUrl,
        stock: sanitizedStock,
        isDiscountable: !!isDiscountable,
        discountPrice: sanitizedDiscountPrice,
        categories: (categoryIds || (categoryId ? [categoryId] : null)) ? {
          set: (categoryIds || [categoryId]).filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
        } : undefined,
        collections: (collectionIds || (collectionId ? [collectionId] : null)) ? {
          set: (collectionIds || [collectionId]).filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
        } : undefined,
        variants: variants ? {
          deleteMany: {},
          create: variants.map(v => ({
            title: v.title,
            price: (v.price === null || v.price === undefined || v.price === '') ? null : parseFloat(v.price),
            stock: parseInt(v.stock) || 0,
            images: v.images || []
          }))
        } : undefined
      },
      include: { variants: true, reviews: true }
    });
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const patchProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    const { id } = req.params;
    
    // Remove fields that should not be updated directly
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.categories;
    delete data.collections;

    // Convert numeric fields if present, handling 0 correctly
    if (data.price !== undefined) data.price = parseFloat(data.price);
    if (data.stock !== undefined) data.stock = parseInt(data.stock);
    if (data.name && !data.handle) {
      data.handle = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    // Handle Variants Sync
    if (data.variants) {
      const variantsData = data.variants;
      delete data.variants; 

      // Delete existing variants and recreate
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      
      data.variants = {
        create: variantsData.map(v => ({
          title: v.title,
          price: (v.price === null || v.price === undefined || v.price === '') ? null : parseFloat(v.price),
          stock: parseInt(v.stock) || 0,
          images: v.images || []
        }))
      };
    }

    // Handle many-to-many updates
    if (data.categoryIds) {
      data.categories = {
        set: data.categoryIds.filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
      };
      delete data.categoryIds;
    }
    if (data.collectionIds) {
      data.collections = {
        set: data.collectionIds.filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
      };
      delete data.collectionIds;
    }

    const product = await prisma.product.update({
      where: { id: id },
      data,
      include: {
        categories: true,
        collections: true,
        variants: true,
        reviews: true
      }
    });
    res.json(product);
  } catch (error) {
    console.error('Patch product error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getBestSellers = async (req, res) => {
  try {
    // Fetch products from the "Best sellers" collection
    const bestSellersCollection = await prisma.collection.findFirst({
      where: {
        name: {
          contains: 'Best sellers',
          mode: 'insensitive'
        }
      },
      include: {
        products: {
          take: 8,
          include: {
            categories: true,
            collections: true,
            variants: true
          }
        }
      }
    });

    if (!bestSellersCollection) {
      return res.json([]);
    }

    res.json(bestSellersCollection.products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNewArrivals = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 8,
      include: {
        categories: true,
        collections: true,
        variants: true
      }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id: id },
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
