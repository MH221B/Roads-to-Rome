import api from './axiosClient';

export interface ConfirmMockPaymentPayload {
  amount: number;
  reference?: string;
}

export interface ConfirmMockPaymentResponse {
  userId: string;
  budget: number;
  reference?: string | null;
  message?: string;
}

export async function confirmMockPayment(
  payload: ConfirmMockPaymentPayload
): Promise<ConfirmMockPaymentResponse> {
  const resp = await api.post('/api/payments/mock', payload);
  const data = resp.data ?? {};

  const budget = typeof data.budget === 'number' && Number.isFinite(data.budget) ? data.budget : 0;

  return {
    userId: data.userId ?? '',
    budget,
    reference: data.reference ?? null,
    message: data.message,
  };
}

export default { confirmMockPayment };