import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

fs.mkdirSync(path.join(UPLOADS_ROOT, 'establishments'), { recursive: true });

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);
const EXT_FOR_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    if (!req.establishmentId) return cb(new Error('NO_ESTABLISHMENT'));
    const dir = path.join(UPLOADS_ROOT, 'establishments', String(req.establishmentId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = EXT_FOR_MIME[file.mimetype] || path.extname(file.originalname) || '';
    cb(null, `cover-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

export const uploadCoverImage = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('UNSUPPORTED_MEDIA'));
      return;
    }
    cb(null, true);
  },
}).single('file');

const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
]);
const EXT_FOR_VIDEO_MIME = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-m4v': '.m4v',
};

const videoStorage = multer.diskStorage({
  destination(req, _file, cb) {
    if (!req.establishmentId) return cb(new Error('NO_ESTABLISHMENT'));
    const dir = path.join(UPLOADS_ROOT, 'establishments', String(req.establishmentId), 'videos');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = EXT_FOR_VIDEO_MIME[file.mimetype] || path.extname(file.originalname) || '.mp4';
    cb(null, `video-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

export const uploadVideoFile = multer({
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter(_req, file, cb) {
    if (!ALLOWED_VIDEO_MIME.has(file.mimetype)) {
      cb(new Error('UNSUPPORTED_MEDIA'));
      return;
    }
    cb(null, true);
  },
}).single('file');

const articleMediaStorage = multer.diskStorage({
  destination(req, _file, cb) {
    if (!req.establishmentId) return cb(new Error('NO_ESTABLISHMENT'));
    const dir = path.join(UPLOADS_ROOT, 'establishments', String(req.establishmentId), 'articles');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = EXT_FOR_MIME[file.mimetype] || path.extname(file.originalname) || '';
    cb(null, `article-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

export const uploadArticleImage = multer({
  storage: articleMediaStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('UNSUPPORTED_MEDIA'));
      return;
    }
    cb(null, true);
  },
}).single('file');

// Wraps a multer middleware to normalize errors into the JSON envelope used by the rest of the API.
export function handleUploadError(middleware, { sizeLabel = '8 Mo' } = {}) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (!err) return next();
      if (err.message === 'NO_ESTABLISHMENT') {
        return res.status(403).json({
          error: { code: 'NO_ESTABLISHMENT', message: 'Aucun établissement associé.' },
        });
      }
      if (err.message === 'UNSUPPORTED_MEDIA') {
        return res.status(415).json({
          error: { code: 'UNSUPPORTED_MEDIA', message: 'Format de fichier non supporté.' },
        });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: { code: 'FILE_TOO_LARGE', message: `Fichier trop volumineux (max ${sizeLabel}).` },
        });
      }
      return res.status(400).json({
        error: { code: 'UPLOAD_FAILED', message: 'Échec de l\'upload.' },
      });
    });
  };
}

export function buildPublicUrl(req, filePath) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(UPLOADS_ROOT + path.sep) && resolved !== UPLOADS_ROOT) {
    throw new Error('Invalid upload path');
  }
  const relPath = path
    .relative(path.resolve(process.cwd()), resolved)
    .split(path.sep)
    .join('/');
  return `${req.protocol}://${req.get('host')}/${relPath}`;
}
