import { createVideoSchema, updateVideoSchema, idParamSchema } from '../validators/proVideo.js';
import {
  listMyVideos,
  createMyVideo,
  updateMyVideo,
  deleteMyVideo,
} from '../services/proVideo.service.js';
import { handleProError } from './proEstablishment.controller.js';
import { buildPublicUrl } from '../middleware/upload.js';

export async function listVideos(req, res) {
  try {
    const data = await listMyVideos(req.establishmentId);
    return res.status(200).json({ results: data });
  } catch (err) {
    return handleProError(err, res, 'pro-video');
  }
}

export async function createVideo(req, res) {
  try {
    const input = createVideoSchema.parse(req.body);
    const data = await createMyVideo(req.establishmentId, input);
    return res.status(201).json(data);
  } catch (err) {
    return handleProError(err, res, 'pro-video');
  }
}

export async function patchVideo(req, res) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateVideoSchema.parse(req.body);
    const data = await updateMyVideo(req.establishmentId, id, input);
    return res.status(200).json(data);
  } catch (err) {
    return handleProError(err, res, 'pro-video');
  }
}

export async function removeVideo(req, res) {
  try {
    const { id } = idParamSchema.parse(req.params);
    await deleteMyVideo(req.establishmentId, id);
    return res.status(204).send();
  } catch (err) {
    return handleProError(err, res, 'pro-video');
  }
}

export async function uploadVideoFileHandler(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { code: 'NO_FILE', message: 'Aucun fichier fourni.' },
      });
    }
    const mediaUrl = buildPublicUrl(req, req.file.path);
    return res.status(200).json({ mediaUrl });
  } catch (err) {
    return handleProError(err, res, 'pro-video');
  }
}
