
import React, { useState, useEffect } from 'react';
import { Calculator, MessageSquare, X } from 'lucide-react';
import { dataService } from '../../services/dataService'; // Use DataService instead of Constants

interface MortgageCalculatorProps {
  initialPrice?: number; // in billions
  onContact?: (message: string) => void;
  onClose?: () => void;
  isEmbedded?: boolean; 
}

const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ initialPrice = 5, onContact, onClose, isEmbedded = false }) => {
  
  const [price, setPrice] = useState(initialPrice); // Tỷ đồng
  const [downPaymentPercent, setDownPaymentPercent] = useState(30); // %
  const [loanTerm, setLoanTerm] = useState(25); // Năm
  // Initialize with Safe Accessor from DataService
  const [interestRate, setInterestRate] = useState(dataService.getFloatingInterestRate()); 
  
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [loanAmount, setLoanAmount] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  useEffect(() => {
    // LOGIC: Simple Amortization Formula
    const principal = price * (1 - downPaymentPercent / 100) * 1_000_000_000;
    setLoanAmount(principal);
    
    // Safety check for zero interest
    if (interestRate <= 0) {
        setMonthlyPayment(principal / (loanTerm * 12));
        setTotalInterest(0);
        return;
    }

    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    const monthly = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    setMonthlyPayment(monthly);
    setTotalInterest((monthly * numberOfPayments) - principal);
  }, [price, downPaymentPercent, loanTerm, interestRate]);

  const formatCurrency = (val: number) => { if (isNaN(val)) return "0 ₫"; return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val); };
  const formatBillions = (val: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(val);
  const handleContactClick = () => { if (onContact) { const message = `Tôi cần tư vấn gói vay cho BĐS giá ${formatBillions(price)} Tỷ.`; onContact(message); } };

  return (
    <div className={`bg-white font-sans ${isEmbedded ? 'rounded-2xl border border-indigo-100 mt-2 w-full max-w-sm' : 'rounded-3xl border border-slate-200 shadow-2xl overflow-hidden'}`}>
      {!isEmbedded && (<div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200"><Calculator size={18} className="text-white" /></div><div><h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Ước tính khoản vay</h3></div></div>{onClose && (<button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={18} /></button>)}</div>)}
      <div className={`${isEmbedded ? 'p-4 space-y-4' : 'p-6 space-y-6'}`}>
        <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg relative overflow-hidden group"><div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full blur-[40px] opacity-20"></div><div className="relative z-10"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Trả hàng tháng</p><p className="text-xl font-black text-white mb-2 tracking-tight">{formatCurrency(monthlyPayment)}</p><div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-2"><div><p className="text-[9px] text-slate-400 uppercase">Vốn vay</p><p className="text-[10px] font-bold">{formatBillions(loanAmount / 1e9)} Tỷ</p></div><div className="text-right"><p className="text-[9px] text-slate-400 uppercase">Tổng lãi</p><p className="text-[10px] font-bold text-indigo-300">{formatBillions(totalInterest / 1e9)} Tỷ</p></div></div></div></div>
        
        {/* Controls */}
        <div className="space-y-3">
            <div>
                <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Giá trị BĐS</label><span className="text-xs font-black text-indigo-600">{formatBillions(price)} Tỷ</span></div>
                <input type="range" min="1" max="50" step="0.5" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Vốn tự có (%)</label>
                    <div className="relative"><input type="number" value={downPaymentPercent} onChange={e => setDownPaymentPercent(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none"/><span className="absolute right-2 top-2 text-xs text-slate-400">%</span></div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Lãi suất (%)</label>
                    <div className="relative"><input type="number" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none"/><span className="absolute right-2 top-2 text-xs text-slate-400">%</span></div>
                </div>
            </div>
        </div>

        <button onClick={handleContactClick} className="w-full py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"><MessageSquare size={14} /> Tư vấn gói vay này</button>
      </div>
    </div>
  );
};

export default MortgageCalculator;
