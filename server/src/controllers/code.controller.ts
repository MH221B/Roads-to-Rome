import codeService from '../services/code.service';
import { Request, Response } from 'express';

interface ICodeController {
  RunSandbox(req: Request, res: Response): Promise<Response | void>;
}

const codeController: ICodeController = {
  async RunSandbox(req: Request, res: Response) {
    try {
      const { code, language } = req.body;
      console.log('Received code run request:', { language, codeSnippet: code ? code : 'no code' });
      if (!code || !language || code.trim() === '' || language.trim() === '' || typeof code !== 'string' || typeof language !== 'string') {
        return res.status(400).json({ message: 'Code and language are required' });
        //safety checkbox that code and language are non-empty strings
      }
      // Call the service to run the code
      const result = await codeService.runCode(code, language);
      return res.status(200).json(result);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
      res.status(500).json({ message: 'Failed to run code', error: errMsg });
    }
  }

  // if expand to something like LeetCode style test cases, we can RunCodeWithTests here
};

export default codeController;