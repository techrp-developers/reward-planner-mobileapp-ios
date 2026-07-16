import api from "../../common/auth/api/axios";

/**
 * Types (optional but recommended)
 */
export type WalletBalanceResponse = {
  success: boolean;
  data: {
    balance: number;
    expiring_coins: number;
    expiry_date: string | null;
  };
};

export type WalletTransaction = {
  transaction_id: number;
  title: string;
  description: string;
  transaction_type: "credit" | "debit";
  coins: number;
  category: string;
  created_at: string;
  expiry_date: string;
  is_expired: number;
};

export type WalletTransactionResponse = {
  success: boolean;
  data: WalletTransaction[];
};

/**
 * 🔹 Get Wallet Balance
 * GET /v1/wallet/balance
 */
export const fetchWalletBalance = async (): Promise<WalletBalanceResponse> => {
  try {
    const res = await api.get("/v1/wallet/balance");
    return res.data;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);

    if (status === 503) {
      console.log("Wallet balance API unavailable (503)");
      return {
        success: false,
        data: {
          coins: 0,
          balance: 0,
        },
      };
    }

    throw error;
  }
};

/**
 * 🔹 Get Wallet Transactions
 * type = all | credit | debit
 * GET /v1/wallet/transactions?type=all
 */
export const fetchWalletTransactions = async (
  type: "all" | "credit" | "debit" | "expired" = "all"
): Promise<WalletTransactionResponse> => {
  const res = await api.get(`/v1/wallet/transactions?type=${type}`);
  return res.data;
};

/**
 * 🔹 CREDIT Transactions
 */
export const fetchCreditTransactions = async (): Promise<WalletTransactionResponse> => {
  try {
    const res = await api.get("/v1/wallet/transactions?type=credit");
    return res.data;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);

    if (status === 503) {
      console.log("Credit transactions API unavailable (503)");
      return { success: false, data: [] };
    }

    throw error;
  }
};

/**
 * 🔹 DEBIT Transactions
 */
export const fetchDebitTransactions = async (): Promise<WalletTransactionResponse> => {
  try {
    const res = await api.get("/v1/wallet/transactions?type=debit");
    return res.data;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);

    if (status === 503) {
      console.log("Debit transactions API unavailable (503)");
      return { success: false, data: [] };
    }

    throw error;
  }
};