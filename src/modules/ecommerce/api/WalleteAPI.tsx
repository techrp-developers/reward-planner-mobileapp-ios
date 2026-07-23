import api from "../../common/auth/api/axios";

/**
 * Types (optional but recommended)
 */
export type WalletBalanceResponse = {
  success: boolean;
  data: {
    balance: number;
    total_earned_points?: number;
    total_earned?: number;
    total_earned_coins?: number;
    earned_points?: number;
    earned_coins?: number;
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
  expiry_date: string | null;
  is_expired: number;
};

export type WalletTransactionResponse = {
  success: boolean;
  data: WalletTransaction[];
};

export type WalletTransactionType = "all" | "credit" | "debit" | "expired";

export type WalletTransactionParams = {
  page?: number;
  limit?: number;
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
      __DEV__ && console.log("Wallet balance API unavailable (503)");
      return {
        success: false,
        data: {
          balance: 0,
          expiring_coins: 0,
          expiry_date: null,
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
  type: WalletTransactionType = "all",
  options: WalletTransactionParams = {}
): Promise<WalletTransactionResponse> => {
  try {
    const res = await api.get("/v1/wallet/transactions", {
      params: {
        type,
        page: options.page ?? 1,
        limit: options.limit ?? 50,
      },
    });
    return res.data;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);

    if (status === 503) {
      __DEV__ && console.log("Wallet transactions API unavailable (503)");
      return { success: false, data: [] };
    }

    throw error;
  }
};

/**
 * 🔹 CREDIT Transactions
 */
export const fetchCreditTransactions = async (): Promise<WalletTransactionResponse> => {
  return fetchWalletTransactions("credit");
};

/**
 * 🔹 DEBIT Transactions
 */
export const fetchDebitTransactions = async (): Promise<WalletTransactionResponse> => {
  return fetchWalletTransactions("debit");
};
