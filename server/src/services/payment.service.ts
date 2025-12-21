import mongoose from 'mongoose';
import { User } from '../models/user.model';

interface CreditPayload {
  userId: string;
  amount: number;
  reference?: string | null;
}

interface CreditResult {
  userId: string;
  budget: number;
  reference: string | null;
}

const paymentService = {
  async creditUserBudget(payload: CreditPayload): Promise<CreditResult> {
    const { userId, amount, reference = null } = payload;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user id');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const user = await User.findById(userId).lean().exec();
    if (!user) {
      throw new Error('User not found');
    }

    const currentBudget = typeof (user as any).budget === 'number' ? (user as any).budget : 0;
    const nextBudget = currentBudget + amount;

    await User.updateOne({ _id: userId }, { $set: { budget: nextBudget } }, { runValidators: false });

    return {
      userId: user._id.toString(),
      budget: nextBudget,
      reference,
    };
  },
};

export default paymentService;