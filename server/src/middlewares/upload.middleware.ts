import multer from 'multer';

// Keep file in memory and let the controller handle uploads to Supabase
const storage = multer.memoryStorage();

export const upload = multer({ storage });
