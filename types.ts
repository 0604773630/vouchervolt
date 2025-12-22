export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  SPEND = 'SPEND',
  FEE = 'FEE'
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export enum KycTier {
  UNVERIFIED = 0,
  TIER_1 = 1, // Basic (Green ID)
  TIER_2 = 2  // Full FICA (Proof of Res)
}

export interface UserProfile {
  id: string;
  name: string;
  kycTier: KycTier;
  pinHash: string; // PBKDF2 Hash
  hasBiometrics: boolean;
}

export interface Transaction {
  id: string;
  timestamp: string; // ISO date
  amount: number;
  type: TransactionType;
  description: string;
  status: TransactionStatus;
  metadata?: {
    voucherCodeHash?: string;
    failureReason?: string;
    location?: string;
    fee?: number;
    originalAmount?: number;
  };
}

export interface VirtualCard {
  cardNumber: string;
  cvv: string;
  expiry: string;
  holderName: string;
  balance: number;
  currency: string;
  isHidden: boolean;
}

export interface VoucherRedemptionResult {
  success: boolean;
  amount?: number;
  provider?: string;
  error?: string;
  fee?: number;
}

export interface FraudAnalysisResult {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  analysis: string;
  flaggedIPs?: string[];
  recommendedAction: string;
}

export interface UserContextState {
  user: UserProfile;
  balance: number;
  transactions: Transaction[];
  virtualCard: VirtualCard;
  addTransaction: (tx: Transaction) => void;
  updateBalance: (amount: number) => void;
  upgradeKyc: () => void;
}