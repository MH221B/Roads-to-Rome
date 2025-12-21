import { Request, Response } from 'express';
import paymentService from '../services/payment.service';

const paymentController = {
  async ConfirmMockPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User ID not found in token' });
        return;
      }

      const { amount, reference, transactionId } = req.body || {};
      const parsedAmount = Number(amount);

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'amount must be greater than zero' });
        return;
      }

      const result = await paymentService.creditUserBudget({
        userId,
        amount: parsedAmount,
        reference: reference || transactionId || null,
      });

      res.status(200).json({
        message: 'Mock payment processed and budget credited',
        budget: result.budget,
        userId: result.userId,
        reference: result.reference,
      });
    } catch (error) {
      const message = (error as Error).message;

      if (message === 'User not found') {
        res.status(404).json({ error: message });
        return;
      }

      if (message === 'Invalid user id' || message.startsWith('Amount')) {
        res.status(400).json({ error: message });
        return;
      }

      res.status(500).json({ error: message });
    }
  },
};

export default paymentController;