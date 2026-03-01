import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { MAX_FILE_SIZE, UPLOAD_PATH } from "../../config/config.service.js";
import { badRequestException } from "../common/utils/response/error.response.js";

const uploadPath = path.resolve(UPLOAD_PATH);

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
})


const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        return cb(null, true);
    }

    return cb( badRequestException({ message: "Only image files allowed" }),false);
};

export const uploadSingleImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
}).single("image")

export const uploadMultipleImages = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE * 2 },
}).array("images", 5)