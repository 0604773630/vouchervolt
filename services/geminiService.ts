import { GoogleGenAI } from "@google/genai";
import { Transaction, FraudAnalysisResult } from '../types';

export const analyzeFraudPatterns = async (transactions: Transaction[]): Promise<FraudAnalysisResult> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key missing");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare data for the model
    const txLog = transactions.map(t => ({
      time: t.timestamp,
      type: t.type,
      amount: t.amount,
      status: t.status,
      reason: t.metadata?.failureReason
    }));

    const prompt = `
      Act as a Senior Financial Fraud Analyst for a South African remittance app.
      Analyze the following transaction log (JSON) for suspicious activity.
      
      Specific Risk Indicators to look for:
      1. Velocity attacks: Multiple failed voucher attempts in short succession (Brute force).
      2. Replay attacks: Attempts to use previously successful vouchers again.
      3. Smurfing: Many small deposits just under reportable limits.
      
      Transactions:
      ${JSON.stringify(txLog, null, 2)}
      
      Return a JSON response (strictly valid JSON) with this schema:
      {
        "riskScore": number (0-100),
        "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        "analysis": "A concise paragraph explaining the findings.",
        "recommendedAction": "One sentence on what the system should do (e.g., Block User, Flag for Review, None)."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    
    return {
      riskScore: result.riskScore || 0,
      riskLevel: result.riskLevel || 'LOW',
      analysis: result.analysis || 'No anomalies detected.',
      recommendedAction: result.recommendedAction || 'None'
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      riskScore: 0,
      riskLevel: 'LOW',
      analysis: "AI Service unavailable. Defaulting to rule-based checks.",
      recommendedAction: "Manual Review"
    };
  }
};