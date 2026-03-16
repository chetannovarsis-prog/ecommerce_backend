import express from "express";
import upload from "../middleware/upload.js";
import { uploadImage, deleteImage } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/", upload.single("image"), uploadImage);
router.delete("/", deleteImage);

export default router;
