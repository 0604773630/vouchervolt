import { VoucherRedemptionResult, UserProfile, KycTier } from '../types';

// MOCK DATABASE / USER PROFILE
// In a real Python/Node backend, we would use PBKDF2 or Argon2 for hashing.
// Logic: hash = PBKDF2(password=pin, salt=user_salt, iterations=100000, algorithm=SHA256)
export const MOCK_USER: UserProfile = {
  id: 'usr_839201',
  name: 'Test User',
  kycTier: KycTier.UNVERIFIED,
  pinHash: '123456', // Simplified for prototype. Real world: $pbkdf2-sha256$i=100000...
  hasBiometrics: false
};

const VALID_VOUCHERS: Record<string, { amount: number; provider: string; used: boolean }> = {
  '1234567890': { amount: 500.00, provider: 'FNB eWallet', used: false },
  '0987654321': { amount: 250.00, provider: 'Absa CashSend', used: false },
  '1122334455': { amount: 1000.00, provider: 'Standard Bank Instant Money', used: false },
  '998877665511': { amount: 150.00, provider: 'Capitec Send', used: true },
};

export const verifyPin = async (inputPin: string, userHash: string): Promise<boolean> => {
  // Simulate cryptographic delay (prevent timing attacks)
  await new Promise(resolve => setTimeout(resolve, 500));
  // In real app: return verify(inputPin, userHash)
  return inputPin === userHash;
};

export const validateVoucher = async (code: string): Promise<VoucherRedemptionResult> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Network simulation

  if (!/^\d{10,12}$/.test(code)) {
    return { success: false, error: "Invalid Format. Code must be 10-12 digits." };
  }

  const voucher = VALID_VOUCHERS[code];

  if (!voucher) {
    return { success: false, error: "Invalid Voucher Code." };
  }

  if (voucher.used) {
    return { success: false, error: "REPLAY DETECTED: Voucher already redeemed." };
  }

  return {
    success: true,
    amount: voucher.amount,
    provider: voucher.provider,
    fee: 7.50
  };
};

export const redeemVoucherFinalize = async (code: string): Promise<void> => {
    // Finalize the transaction on the "Bank Switch"
    if(VALID_VOUCHERS[code]) {
        VALID_VOUCHERS[code].used = true;
    }
};

export const generateVirtualCard = () => {
  return {
    cardNumber: "4532 0192 8374 1928",
    cvv: "837",
    expiry: "12/28",
    holderName: "VoucherVault User",
    balance: 0.00,
    currency: "ZAR",
    isHidden: true
  };
};