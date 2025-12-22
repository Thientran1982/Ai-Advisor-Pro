import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Calendar, Percent, RefreshCw, PieChart, TrendingUp, Sparkles, MessageSquare, X } from 'lucide-react';

interface MortgageCalculatorProps {
  initialPrice?: number; // in billions
  onContact?: (message: string) => void;
  onClose?: () => void;
}

const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ initialPrice = 5, onContact, onClose }) => {
  const [price, setPrice] = useState(initialPrice); // Tỷ đồng
  const [downPaymentPercent, setDownPaymentPercent] = useState(30); // %
  const [loanTerm, setLoanTerm] = useState(25); // Năm
  const [interestRate, setInterestRate] = useState(8.5); // %/năm

  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [loanAmount, setLoanAmount] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);

  useEffect(() => {
    const principal = price * (1 - downPaymentPercent / 100) * 1_000_000_000;
    setLoanAmount(principal);
    
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    let monthly = 0;
    if (interestRate === 0) {
      monthly = principal / numberOfPayments;
    } else {
      monthly = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }
    
    setMonthlyPayment(monthly);
    setTotalPayment(monthly * numberOfPayments);
    setTotalInterest((monthly * numberOfPayments) - principal);

  }, [price, downPaymentPercent, loanTerm, interestRate]);

  const formatCurrency = (val: number) => {
    if (isNaN(val)) return "0 ₫";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
  };

  const formatBillions = (val: number) => {
      return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(val);
  }

  const handleContactClick = () => {
    if (onContact) {
      const message = `Tôi cần tư vấn gói vay cho BĐS giá ${formatBillions(price)} Tỷ.
- Trả trước: ${downPaymentPercent}% (${formatBillions(price * downPaymentPercent / 100)} Tỷ)
- Thời hạn vay: ${loanTerm} năm
- Trả hàng tháng ước tính: ${formatCurrency(monthlyPayment)}
Hãy tư vấn cho tôi ngân hàng nào có lãi suất tốt nhất hiện nay?`;
      onContact(message);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
            <Calculator size={18} className="text-white" />
            </div>
            <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Ước tính khoản vay</h3>
            <p className="text-[10px] text-slate-500 font-medium">Lãi suất thả nổi dự kiến {interestRate}%/năm</p>
            </div>
        </div>
        {onClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X size={18} />
            </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Price Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Giá trị BĐS</label>
            <span className="text-sm font-black text-indigo-600">{formatBillions(price)} Tỷ</span>
          </div>
          <input 
            type="range" min="1" max="100" step="0.5" 
            value={price} 
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all mb-2"
          />
           <div className="relative">
             <input 
               type="number"
               value={price}
               onChange={e => setPrice(Number(e.target.value))}
               className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-base md:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
             />
             <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           </div>
        </div>

        {/* Down Payment & Loan Term */}
        <div className="grid grid-cols-1 gap-5">
           {/* Down Payment */}
           <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="text-[11px] font-bold text-slate-500 uppercase">Trả trước ({downPaymentPercent}%)</label>
                 <span className="text-xs font-bold text-slate-700">{formatBillions(price * downPaymentPercent / 100)} Tỷ</span>
              </div>
              <div className="flex gap-2 mb-2">
                 {[30, 50, 70].map(pct => (
                    <button 
                        key={pct}
                        onClick={() => setDownPaymentPercent(pct)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                            downPaymentPercent === pct 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        {pct}%
                    </button>
                 ))}
              </div>
              <input 
                type="range" min="0" max="90" step="5" 
                value={downPaymentPercent} 
                onChange={e => setDownPaymentPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
           </div>

           {/* Loan Term */}
           <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="text-[11px] font-bold text-slate-500 uppercase">Thời hạn vay</label>
                 <span className="text-xs font-bold text-slate-700">{loanTerm} Năm</span>
              </div>
              <div className="flex gap-2 mb-2">
                 {[20, 25, 30].map(year => (
                    <button 
                        key={year}
                        onClick={() => setLoanTerm(year)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                            loanTerm === year 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        {year}N
                    </button>
                 ))}
              </div>
              <input 
                type="range" min="5" max="35" step="1" 
                value={loanTerm} 
                onChange={e => setLoanTerm(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
           </div>
        </div>

        {/* Results Card */}
        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
           
           <div className="relative z-10">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Trả hàng tháng (Gốc + Lãi)</p>
               <p className="text-2xl font-black text-white mb-4 tracking-tight">{formatCurrency(monthlyPayment)}</p>
               
               <div className="w-full h-px bg-white/10 mb-4"></div>
               
               <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div>
                      <p className="text-[9px] text-slate-400 uppercase mb-0.5">Vốn vay ngân hàng</p>
                      <p className="text-xs font-bold">{formatBillions(loanAmount / 1_000_000_000)} Tỷ</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] text-slate-400 uppercase mb-0.5">Tổng lãi phải trả</p>
                      <p className="text-xs font-bold text-indigo-300">{formatBillions(totalInterest / 1_000_000_000)} Tỷ</p>
                  </div>
               </div>
           </div>
        </div>
        
        <button 
          onClick={handleContactClick}
          className="w-full py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
        >
            <MessageSquare size={14} /> Gửi yêu cầu tư vấn gói vay này
        </button>
      </div>
    </div>
  );
};

export default MortgageCalculator;
