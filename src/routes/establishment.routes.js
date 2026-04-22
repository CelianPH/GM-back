import { Router } from 'express';
import { getQrCode } from '../controllers/establishment.controller.js';

export const establishmentRouter = Router();

establishmentRouter.get('/:id/qrcode', getQrCode);
