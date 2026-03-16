import prisma from '../config/db.js';

export const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
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
        variants: true
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

    const sanitizedPrice = isNaN(parseFloat(price)) ? 0 : parseFloat(price);
    const sanitizedStock = isNaN(parseInt(stock)) ? 0 : parseInt(stock);
    const sanitizedDiscountPrice = isDiscountable ? (isNaN(parseFloat(discountPrice)) ? 0 : parseFloat(discountPrice)) : null;

    const product = await prisma.product.create({
      data: {
        name,
        subtitle,
        handle: handle || null,
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

    const sanitizedPrice = isNaN(parseFloat(price)) ? undefined : parseFloat(price);
    const sanitizedStock = isNaN(parseInt(stock)) ? undefined : parseInt(stock);
    const sanitizedDiscountPrice = isDiscountable ? (isNaN(parseFloat(discountPrice)) ? 0 : parseFloat(discountPrice)) : null;

    // Simple variant sync: delete old, create new (for MVP/Dev simplicity)
    // In production, we'd use upsert or IDs to preserve specific variants
    if (variants) {
      await prisma.productVariant.deleteMany({ where: { productId: req.params.id } });
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        subtitle,
        handle: handle || null,
        description,
        price: sanitizedPrice,
        images,
        thumbnailUrl,
        hoverThumbnailUrl,
        categories: (categoryIds || (categoryId ? [categoryId] : null)) ? {
          set: (categoryIds || [categoryId]).filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
        } : undefined,
        collections: (collectionIds || (collectionId ? [collectionId] : null)) ? {
          set: (collectionIds || [collectionId]).filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
        } : undefined,
        stock: sanitizedStock,
        isDiscountable: !!isDiscountable,
        discountPrice: sanitizedDiscountPrice,
        variants: variants ? {
          create: variants.map(v => ({
            title: v.title,
            price: (v.price === null || v.price === undefined || v.price === '') ? null : parseFloat(v.price),
            stock: parseInt(v.stock) || 0,
            images: v.images || []
          }))
        } : undefined
      },
      include: { variants: true }
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
    if (data.discountPrice !== undefined) {
      data.discountPrice = (data.discountPrice === null || data.discountPrice === '') ? null : parseFloat(data.discountPrice);
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
        variants: true
      }
    });
    res.json(product);
  } catch (error) {
    console.error('Patch product error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
