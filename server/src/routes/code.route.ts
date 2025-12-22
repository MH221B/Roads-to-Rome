import { Router } from 'express';
import codeController from '../controllers/code.controller';
const codeRouter = Router();

// POST /api/code/runCodeSandbox
codeRouter.post('/runCodeSandbox', codeController.RunSandbox);

export { codeRouter };