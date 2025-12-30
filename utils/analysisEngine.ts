
import { Project } from "../types";
import { dataService } from "../services/dataService";

/**
 * 🧠 ANALYSIS ENGINE CORE (v6.0)
 * ==========================================
 * Pure Logic Layer. Separates Math from UI.
 */

// 1. SCORING ENGINE
export const calculateDeepScore = (p: Project | undefined) => {
    if (!p) return { location: 50, price: 50, legal: 50, utility: 50, liquid: 50, potential: 50, overall: 50 };
    
    const loc = p.location.toLowerCase();
    const dev = p.developer.toLowerCase();
    const legal = p.legalStatus.toLowerCase();
    const priceStr = p.priceRange;
    const type = p.type.join(' ').toLowerCase();

    // Location (30%)
    let locScore = 70; 
    if (loc.includes('quận 1') || loc.includes('thủ thiêm')) locScore = 98;
    else if (loc.includes('thảo điền') || loc.includes('an phú')) locScore = 94;
    else if (loc.includes('thủ đức') || loc.includes('quận 9')) locScore = 82;
    if (loc.includes('cảng') || loc.includes('nguyễn duy trinh')) locScore -= 5;

    // Legal & Developer (25%)
    let legalScore = 60; 
    const tier1Devs = ['masterise', 'keppel', 'capitaland', 'gamuda', 'vinhomes', 'sonkim'];
    const isTier1 = tier1Devs.some(t => dev.includes(t));
    if (legal.includes('sổ hồng') || legal.includes('lâu dài')) legalScore = 100;
    else if (legal.includes('gpxd') || legal.includes('hđmb')) legalScore = 90;
    else if (legal.includes('1/500')) legalScore = 75;
    if (isTier1) legalScore = Math.min(100, legalScore + 10);

    // Utility (15%)
    let utilScore = 75;
    if (type.includes('hạng sang') || type.includes('penhouse') || type.includes('biệt thự')) utilScore = 95;
    if (dev.includes('masterise') || dev.includes('keppel')) utilScore = 96;

    // Price & Market (20%)
    let priceScore = 80;
    const currentFloatingRate = dataService.getFloatingInterestRate();
    const marketPenalty = Math.max(0, (currentFloatingRate - 8) * 3);
    priceScore -= marketPenalty;
    if (priceStr.includes('400') && !loc.includes('quận 1')) priceScore -= 5;

    // Liquidity (10%)
    let liquidScore = 70;
    if (p.status.includes('bàn giao') || p.status.includes('sắp')) liquidScore = 88;
    if (isTier1) liquidScore += 5;

    const overall = (locScore * 0.30 + legalScore * 0.25 + utilScore * 0.15 + priceScore * 0.20 + liquidScore * 0.10);

    return {
        location: Math.round(locScore),
        price: Math.round(priceScore),
        legal: Math.round(legalScore),
        utility: Math.round(utilScore),
        liquid: Math.round(liquidScore),
        potential: Math.round(overall * 0.95),
        overall: Math.round(overall)
    };
};

// 2. CONFIDENCE ENGINE
export const calculateAIConfidence = (p: Project | undefined) => {
    if (!p) return 0;
    let dataPoints = 0;
    const maxPoints = 10;
    if (p.priceRange) dataPoints += 1.5;
    if (p.developer) dataPoints += 1;
    if (p.legalStatus.length > 5) dataPoints += 1.5;
    if (p.richDetails?.marketAnalysis?.yield) dataPoints += 1.5;
    if (p.richDetails?.marketAnalysis?.competitors?.length) dataPoints += 1;
    if (p.richDetails?.legalScore) dataPoints += 1.5;
    if (p.image) dataPoints += 1;
    if (p.priceRange.includes("Đang cập nhật")) dataPoints -= 2;
    return Math.min(99, Math.round((dataPoints / maxPoints) * 100));
};

// 3. FINANCIAL PROJECTION (DCF Model)
export const calculateProjection = (priceBillions: number, baseYield: number, loanRatio: number) => {
    const years = 10;
    const appreciationRate = 0.08; 
    const rentGrowthRate = 0.03; 
    const interestRate = dataService.getFloatingInterestRate() / 100;
    
    const initialPrice = priceBillions * 1_000_000_000;
    const loanAmount = initialPrice * loanRatio;
    const equity = initialPrice - loanAmount;
    
    let chartData = [];
    let currentAssetValue = initialPrice;
    let currentRent = initialPrice * baseYield;
    
    const annualInterestExpense = loanAmount * interestRate; 

    for (let i = 1; i <= years; i++) {
        const cashflow = currentRent - annualInterestExpense;
        const appreciation = currentAssetValue * appreciationRate;
        currentAssetValue += appreciation;
        currentRent += (currentRent * rentGrowthRate);

        chartData.push({
            year: `Năm ${i}`,
            cashflow: Math.round(cashflow / 1_000_000), 
            assetValue: Math.round((currentAssetValue - initialPrice) / 1_000_000), 
            totalEquity: Math.round((equity + (currentAssetValue - initialPrice)) / 1_000_000_000 * 10) / 10
        });
    }

    const exitValue = currentAssetValue - loanAmount;
    const totalCashflow = chartData.reduce((acc, cur) => acc + cur.cashflow * 1_000_000, 0);
    const moneyMultiple = (exitValue + totalCashflow) / equity;
    const irr = (Math.pow(moneyMultiple, 1/years) - 1) * 100;

    return { chartData, irr, moneyMultiple, equity };
};

// 4. MONTE CARLO SIMULATION
export const runMonteCarloSimulation = (years: number = 6) => {
    const currentRate = dataService.getFloatingInterestRate();
    const cpi = 4.0; 
    const mu = (cpi/100 + 0.02) - Math.max(0, (currentRate - 7) * 0.015);
    const sigma = 0.08; 
    const dt = 1; 
    const simulations = 100;

    const paths: number[][] = Array(simulations).fill(0).map(() => [100]); 

    for (let i = 0; i < simulations; i++) {
        for (let t = 1; t < years; t++) {
            const prevPrice = paths[i][t-1];
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            
            const drift = (mu - 0.5 * sigma * sigma) * dt;
            const diffusion = sigma * Math.sqrt(dt) * z;
            
            const newPrice = prevPrice * Math.exp(drift + diffusion);
            paths[i].push(newPrice);
        }
    }

    const aggregatedData = [];
    for (let t = 0; t < years; t++) {
        const pricesAtT = paths.map(p => p[t]);
        pricesAtT.sort((a, b) => a - b);
        
        const mean = pricesAtT.reduce((a, b) => a + b, 0) / simulations;
        const p5 = pricesAtT[Math.floor(simulations * 0.05)];
        const p95 = pricesAtT[Math.floor(simulations * 0.95)];
        
        aggregatedData.push({
            year: 2024 + t,
            mean: Math.round(mean),
            range: [Math.round(p5), Math.round(p95)],
            upper: Math.round(p95),
            lower: Math.round(p5)
        });
    }
    return aggregatedData;
};

// 5. FENG SHUI ENGINE
export const calculateFengShui = (year: number, gender: 'male' | 'female', projectDirs: string[]) => {
    const can = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"][year % 10];
    const chi = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"][year % 12];
    
    let sum = Array.from(String(year)).reduce((a, b) => a + parseInt(b), 0);
    while (sum > 9) sum = Array.from(String(sum)).reduce((a, b) => a + parseInt(b), 0);
    
    let kua = 0;
    if (year < 2000) kua = gender === 'male' ? (11 - sum) : (4 + sum);
    else kua = gender === 'male' ? (10 - sum) : (5 + sum);
    
    while (kua > 9) kua -= 9;
    if (kua === 0) kua = 9;
    if (kua === 5) kua = gender === 'male' ? 2 : 8;

    const isEast = [1, 3, 4, 9].includes(kua);
    const groupName = isEast ? "Đông Tứ Trạch" : "Tây Tứ Trạch";
    const elements = ["Kim", "Thủy", "Hỏa", "Mộc", "Thổ"];
    const element = elements[year % 5];

    const goodDirectionsMap: Record<number, string[]> = {
        1: ['Đông Nam', 'Đông', 'Nam', 'Bắc'],
        2: ['Đông Bắc', 'Tây', 'Tây Bắc', 'Tây Nam'],
        3: ['Nam', 'Bắc', 'Đông Nam', 'Đông'],
        4: ['Bắc', 'Nam', 'Đông', 'Đông Nam'],
        6: ['Tây', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'],
        7: ['Tây Bắc', 'Tây Nam', 'Đông Bắc', 'Tây'],
        8: ['Tây Nam', 'Tây Bắc', 'Tây', 'Đông Bắc'],
        9: ['Đông', 'Đông Nam', 'Bắc', 'Nam']
    };

    const goodDirs = goodDirectionsMap[kua] || [];
    
    let isMatch = false;
    if (projectDirs.length > 0) {
        isMatch = projectDirs.some(pd => goodDirs.some(gd => gd.toLowerCase().includes(pd.toLowerCase()) || pd.toLowerCase().includes(gd.toLowerCase())));
    }

    return { canChi: `${can} ${chi}`, group: groupName, kua, goodDirs, element, isMatch, hasProject: projectDirs.length > 0 };
};
