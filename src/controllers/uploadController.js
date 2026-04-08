import supabase from "../config/supabase.js";

export const uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const productName = req.body.productName || "product";
    const sanitizedName = String(productName).toLowerCase().replace(/[^a-z0-9]/g, "-");
    
    console.log(`Uploading file: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);

    const fileName = `${sanitizedName}-${Date.now()}.${file.originalname.split('.').pop()}`;

    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ 
        error: "Storage service error", 
        details: error.message || error 
      });
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from("uploads")
      .getPublicUrl(fileName);

    if (!publicUrl) {
      console.error('Failed to generate public URL for:', fileName);
      return res.status(500).json({ error: "Failed to generate image URL" });
    }

    res.json({
      url: publicUrl
    });
  } catch (err) {
    console.error('Critical upload error:', err);
    res.status(500).json({ 
      error: "Server error during upload", 
      message: err.message 
    });
  }
};
export const deleteImage = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Extract filename from Supabase public URL
    // Format: https://[project-id].supabase.co/storage/v1/object/public/ecommerce/[filename]
    const parts = url.split("/");
    const fileName = parts[parts.length - 1];

    if (!fileName) {
      return res.status(400).json({ error: "Invalid image URL" });
    }

    const { error } = await supabase.storage
      .from("uploads")
      .remove([fileName]);

    if (error) {
      console.error('Supabase deletion error:', error);
      return res.status(500).json({ 
        error: "Supabase storage error", 
        details: error.message || error 
      });
    }

    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error('Delete image controller error:', err);
    res.status(500).json({ 
      error: "Internal server error during deletion", 
      message: err.message 
    });
  }
};
