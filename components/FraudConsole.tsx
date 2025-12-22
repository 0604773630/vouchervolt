import React, { useState } from 'react';
import { Transaction, FraudAnalysisResult } from '../types';
import { analyzeFraudPatterns } from '../services/geminiService';

const FraudConsole: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const [analysis, setAnalysis] = useState<FraudAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState(false);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setCriticalAlert(false);
    const result = await analyzeFraudPatterns(transactions);
    setAnalysis(result);
    setIsAnalyzing(false);

    if (result.riskLevel === 'CRITICAL') {
      setCriticalAlert(true);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-yellow-400';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-slate-300">
      
      {/* Critical Alert Banner */}
      {criticalAlert && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-4 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-radiation text-2xl"></i>
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-lg text-white">CRITICAL THREAT DETECTED</h3>
                <p className="text-sm">High-risk fraud pattern identified by Gemini Sentinel. Automatic circuit breakers have been engaged.</p>
            </div>
            <button 
                onClick={() => setCriticalAlert(false)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 text-sm font-bold whitespace-nowrap shadow-lg"
            >
                ACKNOWLEDGE
            </button>
        </div>
      )}

      <div className={`bg-slate-900 border ${criticalAlert ? 'border-red-500' : 'border-slate-800'} rounded-lg p-6 mb-6 transition-colors duration-500`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className={`fa-solid fa-robot ${criticalAlert ? 'text-red-500' : 'text-brand-accent'}`}></i> 
            Gemini Fraud Sentinel
          </h2>
          <button 
            onClick={runAnalysis}
            disabled={isAnalyzing || transactions.length === 0}
            className={`
                border px-4 py-2 rounded-md transition disabled:opacity-50 flex items-center gap-2
                ${criticalAlert 
                    ? 'bg-red-900/20 border-red-500 text-red-400 hover:bg-red-900/40' 
                    : 'bg-brand-card hover:bg-slate-800 border-brand-accent text-brand-accent'
                }
            `}
          >
            {isAnalyzing ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-magnifying-glass-chart"></i>}
            Analyze Live Logs
          </button>
        </div>

        <div className="bg-black p-4 rounded-md font-mono text-xs overflow-y-auto max-h-48 mb-6 border border-slate-800">
          <p className="text-slate-500 mb-2">-- LIVE TRANSACTION STREAM --</p>
          {transactions.length === 0 ? (
            <p className="text-slate-600 italic">No transactions recorded yet. Use the App Simulator to generate data.</p>
          ) : (
            transactions.map(t => (
              <div key={t.id} className="mb-1">
                <span className="text-slate-500">[{new Date(t.timestamp).toLocaleTimeString()}]</span>
                <span className={`mx-2 ${t.status === 'SUCCESS' ? 'text-green-500' : 'text-red-500'}`}>{t.status}</span>
                <span className="text-slate-300">{t.description} ({t.amount})</span>
                {t.metadata?.failureReason && <span className="text-red-400 ml-2">Err: {t.metadata.failureReason}</span>}
              </div>
            ))
          )}
        </div>

        {analysis && (
          <div className="animate-fade-in bg-slate-800 rounded-lg p-6 border border-slate-700">
             <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-4">
                <div>
                   <span className="text-xs uppercase tracking-widest text-slate-400">Threat Level</span>
                   <h3 className={`text-2xl font-black ${getRiskColor(analysis.riskLevel)}`}>{analysis.riskLevel}</h3>
                </div>
                <div className="text-right">
                   <span className="text-xs uppercase tracking-widest text-slate-400">Risk Score</span>
                   <h3 className="text-2xl font-bold text-white">{analysis.riskScore}/100</h3>
                </div>
             </div>
             
             <div className="space-y-4">
                <div>
                   <h4 className="font-bold text-white mb-1">AI Analysis</h4>
                   <p className="text-sm leading-relaxed">{analysis.analysis}</p>
                </div>
                <div className={`p-3 rounded border ${analysis.riskLevel === 'CRITICAL' ? 'bg-red-900/20 border-red-500' : 'bg-slate-900 border-slate-700'}`}>
                   <h4 className={`font-bold mb-1 text-sm ${analysis.riskLevel === 'CRITICAL' ? 'text-red-400' : 'text-brand-accent'}`}>Recommended Action</h4>
                   <p className="text-sm">{analysis.recommendedAction}</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudConsole;