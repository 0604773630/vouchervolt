import React from 'react';

const BlueprintSection: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="mb-8 p-6 bg-slate-900 border border-slate-800 rounded-lg shadow-xl">
    <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
      <i className={`fa-solid ${icon} text-brand-accent text-xl`}></i>
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
    <div className="text-slate-300 space-y-4">
      {children}
    </div>
  </div>
);

const ArchitectureBlueprint: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Technical Architecture & Security Blueprint</h1>
        <p className="text-slate-400">VoucherVault System Design (SARB Compliant)</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Logic Flow */}
        <BlueprintSection title="Transaction Logic Flow" icon="fa-diagram-project">
          <div className="relative border-l-2 border-brand-accent ml-3 space-y-6">
            <div className="ml-6 relative">
              <span className="absolute -left-[31px] bg-brand-accent h-4 w-4 rounded-full mt-1"></span>
              <h3 className="text-white font-semibold">1. Input Layer</h3>
              <p className="text-sm">User enters 10-12 digit code via USSD (Gateway) or App (HTTPS).</p>
            </div>
            <div className="ml-6 relative">
              <span className="absolute -left-[31px] bg-slate-700 h-4 w-4 rounded-full mt-1 border-2 border-brand-accent"></span>
              <h3 className="text-white font-semibold">2. Validation & Security</h3>
              <p className="text-sm">Rate limiter checks IP/MSISDN. Code is hashed (SHA-256 + Salt). System checks `vouchers` table for `is_redeemed` flag.</p>
            </div>
            <div className="ml-6 relative">
              <span className="absolute -left-[31px] bg-slate-700 h-4 w-4 rounded-full mt-1 border-2 border-brand-accent"></span>
              <h3 className="text-white font-semibold">3. Bank Bridge (Switch)</h3>
              <p className="text-sm">VoucherVault Mock API calls Issuer Bank (e.g., FNB/Absa) via ISO 8583 or Rest API to validate funds.</p>
            </div>
            <div className="ml-6 relative">
              <span className="absolute -left-[31px] bg-slate-700 h-4 w-4 rounded-full mt-1 border-2 border-brand-accent"></span>
              <h3 className="text-white font-semibold">4. Value Exchange</h3>
              <p className="text-sm">Funds confirmed. R7.50 fee deducted. Net amount credited to User's Virtual Ledger.</p>
            </div>
            <div className="ml-6 relative">
              <span className="absolute -left-[31px] bg-green-500 h-4 w-4 rounded-full mt-1"></span>
              <h3 className="text-white font-semibold">5. BaaS Provisioning</h3>
              <p className="text-sm">BaaS Provider (e.g., Ukheshe/Investec) updates Virtual Card balance immediately.</p>
            </div>
          </div>
        </BlueprintSection>

        {/* Security Architecture */}
        <BlueprintSection title="Security & Cryptography" icon="fa-shield-halved">
          <ul className="list-disc ml-4 space-y-2 text-sm">
            <li>
              <strong className="text-white">Anti-Replay:</strong> Uses a unique constraint on <code className="bg-slate-800 px-1 rounded">hash(voucher_code + salt)</code> in the database. Second attempt throws `ConstraintViolation`.
            </li>
            <li>
              <strong className="text-white">Data in Transit:</strong> TLS 1.3 enforced. Certificate Pinning on Mobile App.
            </li>
            <li>
              <strong className="text-white">Data at Rest:</strong> AES-256 encryption for PII (National ID, Phone). Vouchers are strictly hashed (never stored plain).
            </li>
            <li>
              <strong className="text-white">Session Management:</strong> JWT with short expiry (15 min) + Refresh Tokens. Biometric auth for app access.
            </li>
          </ul>
        </BlueprintSection>

        {/* Compliance */}
        <BlueprintSection title="SARB/FICA Compliance" icon="fa-scale-balanced">
           <p className="text-sm mb-3">Aligned with South African Reserve Bank Guidance Note 6/2008.</p>
           <div className="bg-slate-800 p-3 rounded text-sm space-y-2">
             <div className="flex justify-between border-b border-slate-700 pb-2">
               <span>Tier 1 (Low Risk)</span>
               <span className="text-brand-accent">Max R25,000 balance</span>
             </div>
             <p className="text-xs text-slate-400">Req: Valid SA ID number verification against Dept of Home Affairs (HANIS).</p>
             
             <div className="flex justify-between border-b border-slate-700 pb-2 pt-2">
               <span>Tier 2 (Full FICA)</span>
               <span className="text-brand-accent">Unlimited</span>
             </div>
             <p className="text-xs text-slate-400">Req: Proof of Residence + Selfie Verification + Sanction Screening.</p>
           </div>
        </BlueprintSection>

        {/* Database Schema */}
        <BlueprintSection title="Database Schema (SQL)" icon="fa-database">
          <div className="bg-black p-4 rounded overflow-x-auto">
<pre className="text-xs font-mono text-green-400">
{`-- Users (KYC Data)
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  msisdn VARCHAR(15) UNIQUE,
  id_number_hash VARCHAR(255),
  kyc_tier INT DEFAULT 1,
  created_at TIMESTAMP
);

-- Vouchers (Anti-Replay)
CREATE TABLE redeemed_vouchers (
  hash_id VARCHAR(64) PRIMARY KEY, -- SHA256
  user_id UUID REFERENCES users(user_id),
  provider VARCHAR(50),
  amount DECIMAL(10,2),
  redeemed_at TIMESTAMP DEFAULT NOW()
);

-- Ledger (Double Entry)
CREATE TABLE transactions (
  tx_id UUID PRIMARY KEY,
  user_id UUID,
  type VARCHAR(20), -- 'DEPOSIT', 'SPEND'
  amount DECIMAL(10,2),
  balance_after DECIMAL(10,2),
  metadata JSONB
);`}
</pre>
          </div>
        </BlueprintSection>
      </div>
    </div>
  );
};

export default ArchitectureBlueprint;