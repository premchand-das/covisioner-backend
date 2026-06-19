export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image file uploaded",
      });
    }

    return res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: req.file.path,
    });
  } catch (err) {
    console.error("UPLOAD IMAGE ERROR:", err);

    return res.status(500).json({
      message: err.message || "Image upload failed",
    });
  }
};