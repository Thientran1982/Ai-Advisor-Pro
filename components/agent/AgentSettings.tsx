
import React, { useState, useEffect } from 'react';
import { TenantProfile, Invoice, Project, UsageStats } from '../../types';
import { dataService } from '../../services/dataService'; 
import { 
    Save, User, CreditCard, Check, Camera, Building, 
    Info, Phone, MessageSquare, Briefcase, Crown, ExternalLink,
    Download, Clock, Zap, Shield, CheckCircle2, Plus, Trash2, MapPin, DollarSign,
    BrainCircuit, Sliders, Volume2, Target, X, Loader2, Calendar, AlertCircle
} from 'lucide-react';

interface AgentSettingsProps {
    tenant: TenantProfile;
    onUpdate: (updatedTenant: TenantProfile) => void;
    onNavigateToProfile?: () => void;
    initialTab?: 'profile' | 'projects' | 'billing'; // NEW: Allow deep linking
}

const AgentSettings: React.FC<AgentSettingsProps> = ({ tenant, onUpdate, onNavigateToProfile, initialTab = 'profile' }) => {
    // 1. SAFE INITIALIZATION
    const defaultTenant: TenantProfile = {
        id: 'guest', 
        name: 'Agent', 
        email: '', 
        phone: '', 
        type: 'individual_agent',
        subscription: 'free', 
        assignedProjects: []
    };
    
    const safeTenant = tenant || defaultTenant;

    // 2. STATE MANAGEMENT
    const [activeTab, setActiveTab] = useState<'profile' | 'projects' | 'billing'>(initialTab);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' });
    
    // FETCH DATA
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
    
    // NEW PROJECT FORM STATE
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [newProject, setNewProject] = useState<Partial<Project>>({ name: '', developer: '', location: '', priceRange: '', status: 'Sắp mở bán', type: ['Căn hộ'] });

    // PAYMENT & BILLING STATE
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [cardLast4, setCardLast4] = useState(''); // Initially empty to simulate "No card"
    const [paymentForm, setPaymentForm] = useState({ number: '', holder: '', expiry: '', cvc: '' });
    const [isSavingCard, setIsSavingCard] = useState(false);

    // Initialize form data
    const [formData, setFormData] = useState<Partial<TenantProfile>>({
        name: safeTenant.name || '',
        phone: safeTenant.phone || '',
        avatar: safeTenant.avatar || '',
        welcomeMessage: safeTenant.welcomeMessage || '',
        assignedProjects: Array.isArray(safeTenant.assignedProjects) ? safeTenant.assignedProjects : [],
        aiConfig: safeTenant.aiConfig || { tone: 'professional', focus: 'investment', language: 'vi_south' }
    });

    // 3. SYNC WITH PROPS & LOAD DATA
    // Listen for initialTab changes to switch tabs externally
    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        setInvoices(dataService.getInvoices());
        setUsage(dataService.getUsageStats(safeTenant.id));
        setAvailableProjects(dataService.getProjects()); 
        
        // Mock: If user is already pro, assume they have a card
        if (safeTenant.subscription === 'pro_agent') {
            setCardLast4('4242');
        }

        const handleStorageChange = () => {
            setAvailableProjects(dataService.getProjects());
        };
        window.addEventListener('storage', handleStorageChange);

        if (tenant) {
            setFormData({
                name: tenant.name || '',
                phone: tenant.phone || '',
                avatar: tenant.avatar || '',
                welcomeMessage: tenant.welcomeMessage || '',
                assignedProjects: Array.isArray(tenant.assignedProjects) ? tenant.assignedProjects : [],
                aiConfig: tenant.aiConfig || { tone: 'professional', focus: 'investment', language: 'vi_south' }
            });
        }
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [tenant, safeTenant.id]);

    // 4. HANDLERS
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            try {
                const updatedProfile: TenantProfile = {
                    ...safeTenant,
                    ...formData,
                    assignedProjects: Array.isArray(formData.assignedProjects) ? formData.assignedProjects : []
                };
                
                onUpdate(updatedProfile);
                showToast("Đã lưu thay đổi thành công!");
            } catch (e) {
                console.error("Save failed:", e);
                showToast("Lỗi khi lưu dữ liệu", "error");
            }
            setIsSaving(false);
        }, 600);
    };

    const handleProjectToggle = (projectId: string) => {
        const currentProjects = Array.isArray(formData.assignedProjects) ? formData.assignedProjects : [];
        const updated = currentProjects.includes(projectId) 
            ? currentProjects.filter(id => id !== projectId)
            : [...currentProjects, projectId];
        setFormData(prev => ({ ...prev, assignedProjects: updated }));
    };

    const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const url = URL.createObjectURL(file);
                setFormData(prev => ({ ...prev, avatar: url }));
            } catch (err) {
                console.error("Avatar upload error:", err);
            }
        }
    };

    // --- NEW PROJECT HANDLERS ---
    const handleAddProject = () => {
        if(!newProject.name || !newProject.location) return showToast("Vui lòng nhập tên và vị trí dự án", "error");
        
        const project: Project = {
            id: `proj_${Date.now()}`,
            name: newProject.name,
            developer: newProject.developer || 'Chưa cập nhật',
            location: newProject.location,
            priceRange: newProject.priceRange || 'Đang cập nhật',
            status: newProject.status || 'Sắp mở bán',
            type: newProject.type || ['Căn hộ'],
            image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80", 
            highlight: "Dự án mới cập nhật.",
            legalStatus: "Đang cập nhật",
            paymentSchedule: "Đang cập nhật"
        };

        dataService.addProject(project);
        
        setFormData(prev => ({
            ...prev,
            assignedProjects: [...(prev.assignedProjects || []), project.id]
        }));

        setIsAddingProject(false);
        setNewProject({ name: '', developer: '', location: '', priceRange: '', status: 'Sắp mở bán', type: ['Căn hộ'] });
        setAvailableProjects(dataService.getProjects()); 
        showToast("Đã thêm dự án mới");
    };

    const handleDeleteProject = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(confirm("Bạn có chắc muốn xóa dự án này khỏi hệ thống?")) {
            dataService.deleteProject(id);
            setAvailableProjects(prev => prev.filter(p => p.id !== id));
            showToast("Đã xóa dự án");
        }
    };

    // --- BILLING & PAYMENT HANDLERS ---
    
    // 1. Subscription Logic
    const handleSubscriptionChange = (plan: 'free' | 'pro_agent') => {
        if (plan === safeTenant.subscription) return;
        
        // CHECK PAYMENT METHOD FIRST
        if (plan === 'pro_agent' && !cardLast4) {
            setIsPaymentModalOpen(true);
            showToast("Vui lòng thêm thẻ thanh toán để nâng cấp", "info");
            return;
        }
        
        setIsProcessingPayment(true);
        // Simulate Payment Gateway Delay
        setTimeout(() => {
            const updated = { ...safeTenant, subscription: plan };
            onUpdate(updated);
            setIsProcessingPayment(false);
            if (plan === 'pro_agent') {
                showToast("🎉 Đã nâng cấp lên gói Pro Agent thành công!");
            } else {
                showToast("Đã hủy gói Pro. Bạn có thể đăng ký lại bất cứ lúc nào.", "info");
            }
        }, 1500);
    };

    // 2. Real CSV Export Logic (FIXED UTF-8 BOM)
    const handleExportInvoice = () => {
        // Define Headers in Vietnamese
        const headers = ["Mã Hóa Đơn", "Ngày", "Nội Dung", "Số Tiền (VND)", "Trạng Thái"];
        
        // Map Data to CSV Rows
        const rows = invoices.map(inv => [
            inv.id,
            inv.date.toLocaleDateString('vi-VN'),
            `"${inv.description.replace(/"/g, '""')}"`, // Escape quotes properly for CSV
            inv.amount.toString(),
            inv.status === 'paid' ? 'Đã Thanh Toán' : 'Chờ Thanh Toán'
        ]);

        // Combine
        const csvContent = [
            headers.join(','), 
            ...rows.map(row => row.join(','))
        ].join('\n');

        // CRITICAL FIX: Add Byte Order Mark (BOM) \uFEFF so Excel recognizes UTF-8
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0,10);
        link.setAttribute('download', `Advisor_HoaDon_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // 3. Payment Method Logic
    const handleSaveCard = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingCard(true);
        
        // Simulate Bank Verification
        setTimeout(() => {
            if (paymentForm.number.length >= 4) {
                setCardLast4(paymentForm.number.slice(-4));
            } else {
                setCardLast4('8888'); // Fallback mock
            }
            setIsSavingCard(false);
            setIsPaymentModalOpen(false);
            setPaymentForm({ number: '', holder: '', expiry: '', cvc: '' });
            showToast("Đã cập nhật phương thức thanh toán!");
        }, 2000);
    };

    // Format helpers for card input
    const formatCardNumber = (val: string) => {
        return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
    };
    const formatExpiry = (val: string) => {
        return val.replace(/\D/g, '').replace(/(.{2})/, '$1/').slice(0, 5);
    };

    // 5. RENDER HELPERS
    const isActive = (id: string) => activeTab === id;
    const tabClass = (id: string) => `flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${isActive(id) ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`;

    return (
        <div className="h-full w-full flex flex-col bg-slate-50">
            
            {/* Header */}
            <div className="flex-shrink-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900">Cài Đặt</h2>
                    <p className="text-xs text-slate-500 font-medium hidden sm:block">Quản lý hồ sơ và cấu hình AI.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="px-4 md:px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-colors shadow-lg disabled:opacity-70 active:scale-95 text-xs md:text-sm"
                >
                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={16}/>}
                    {isSaving ? 'Lưu...' : 'Lưu Thay Đổi'}
                </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <div className="max-w-4xl mx-auto px-4 md:px-6 mt-6 pb-32">
                    {/* Tabs */}
                    <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 mb-8 max-w-lg border border-slate-200 overflow-x-auto">
                        <button onClick={() => setActiveTab('profile')} className={tabClass('profile')}>
                            <User size={16}/> <span className="whitespace-nowrap">Hồ Sơ</span>
                        </button>
                        <button onClick={() => setActiveTab('projects')} className={tabClass('projects')}>
                            <Building size={16}/> <span className="whitespace-nowrap">Dự Án</span>
                        </button>
                        <button onClick={() => setActiveTab('billing')} className={tabClass('billing')}>
                            <CreditCard size={16}/> <span className="whitespace-nowrap">Gói Cước</span>
                        </button>
                    </div>

                    {/* Profile View */}
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in">
                            <div className="md:col-span-4">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                                    {/* Avatar Upload Section */}
                                    <label className="relative inline-block mb-4 cursor-pointer group">
                                        <img 
                                            src={formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=random`} 
                                            className="w-32 h-32 rounded-full object-cover border-4 border-slate-50 shadow-md group-hover:opacity-80 transition-opacity bg-slate-100"
                                            alt="Avatar"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                                            <div className="bg-white p-2 rounded-full shadow-lg">
                                                <Camera size={16} className="text-slate-900"/>
                                            </div>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarFile} />
                                    </label>
                                    
                                    <h3 className="font-bold text-lg text-slate-900 truncate px-2">{formData.name || 'Chưa đặt tên'}</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase mt-1 inline-flex items-center gap-1">
                                        <Briefcase size={12}/>
                                        {safeTenant.type === 'agency' ? 'Sàn BĐS' : 'Môi giới tự do'}
                                    </p>

                                    <div className="mt-6 pt-6 border-t border-slate-100">
                                        <button onClick={onNavigateToProfile} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl">
                                            <ExternalLink size={14} /> Xem trang công khai (Demo)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-8 space-y-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><Info size={18} className="text-indigo-600"/> Thông tin cơ bản</h3>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Tên hiển thị</label>
                                        <div className="relative">
                                            <input 
                                                value={formData.name || ''} 
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-colors"
                                                placeholder="VD: Tuấn Villas"
                                            />
                                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Số điện thoại (Hotline)</label>
                                        <div className="relative">
                                            <input 
                                                value={formData.phone || ''} 
                                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-colors"
                                                placeholder="09..."
                                            />
                                            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><MessageSquare size={18} className="text-indigo-600"/> Cấu hình AI & Lời chào</h3>
                                    
                                    {/* AI PERSONALITY SETTINGS */}
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-2"><Volume2 size={12}/> Giọng văn (Tone)</label>
                                            <div className="space-y-2">
                                                {['professional', 'friendly', 'data_driven'].map((t) => (
                                                    <label key={t} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${formData.aiConfig?.tone === t ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                                        <input type="radio" name="aiTone" className="hidden" 
                                                            checked={formData.aiConfig?.tone === t} 
                                                            onChange={() => setFormData(prev => ({...prev, aiConfig: {...prev.aiConfig, tone: t as any}}))} 
                                                        />
                                                        <span className="text-xs font-bold capitalize">{t === 'professional' ? 'Chuyên gia' : t === 'friendly' ? 'Thân thiện' : 'Sắc sảo (Data)'}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-2"><Target size={12}/> Trọng tâm (Focus)</label>
                                            <div className="space-y-2">
                                                {['investment', 'residence', 'neutral'].map((f) => (
                                                    <label key={f} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${formData.aiConfig?.focus === f ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                                        <input type="radio" name="aiFocus" className="hidden" 
                                                            checked={formData.aiConfig?.focus === f} 
                                                            onChange={() => setFormData(prev => ({...prev, aiConfig: {...prev.aiConfig, focus: f as any}}))} 
                                                        />
                                                        <span className="text-xs font-bold capitalize">{f === 'investment' ? 'Đầu tư & Lãi vốn' : f === 'residence' ? 'An cư & Tiện ích' : 'Cân bằng'}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Lời chào mở đầu</label>
                                        <textarea 
                                            value={formData.welcomeMessage || ''}
                                            onChange={e => setFormData({...formData, welcomeMessage: e.target.value})}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 h-24 resize-none focus:bg-white focus:border-indigo-500 outline-none transition-colors text-sm"
                                            placeholder="VD: Chào anh/chị, em là trợ lý ảo chuyên tư vấn BĐS..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PROJECT MANAGEMENT TAB */}
                    {activeTab === 'projects' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg"><Building size={20} className="text-indigo-600"/> Quản Lý Dự Án</h3>
                                        <p className="text-xs text-slate-500 mt-1">Chọn dự án bạn muốn AI tư vấn hoặc thêm dự án mới.</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsAddingProject(true)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-95"
                                    >
                                        <Plus size={16}/> Thêm Dự Án Mới
                                    </button>
                                </div>

                                {isAddingProject && (
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-indigo-100 mb-6 animate-in slide-in-from-top-2">
                                        <h4 className="font-bold text-sm text-indigo-900 mb-4 uppercase">Nhập thông tin dự án mới</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <input className="p-3 rounded-xl border text-sm font-bold outline-none focus:border-indigo-500" placeholder="Tên dự án (VD: Vinhomes Grand Park)" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
                                            <input className="p-3 rounded-xl border text-sm font-bold outline-none focus:border-indigo-500" placeholder="Chủ đầu tư (VD: Vingroup)" value={newProject.developer} onChange={e => setNewProject({...newProject, developer: e.target.value})} />
                                            <input className="p-3 rounded-xl border text-sm font-bold outline-none focus:border-indigo-500" placeholder="Vị trí (VD: Quận 9, TP.HCM)" value={newProject.location} onChange={e => setNewProject({...newProject, location: e.target.value})} />
                                            <input className="p-3 rounded-xl border text-sm font-bold outline-none focus:border-indigo-500" placeholder="Mức giá (VD: 50 - 70 triệu/m2)" value={newProject.priceRange} onChange={e => setNewProject({...newProject, priceRange: e.target.value})} />
                                        </div>
                                        <div className="flex gap-3 justify-end">
                                            <button onClick={() => setIsAddingProject(false)} className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-200 rounded-lg">Hủy</button>
                                            <button onClick={handleAddProject} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-md">Lưu Dự Án</button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {availableProjects.map(p => {
                                        const currentAssigned = Array.isArray(formData.assignedProjects) ? formData.assignedProjects : [];
                                        const isSelected = currentAssigned.includes(p.id);
                                        return (
                                            <div 
                                                key={p.id}
                                                onClick={() => handleProjectToggle(p.id)}
                                                className={`p-4 rounded-xl border cursor-pointer flex flex-col gap-2 transition-all relative group ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${isSelected ? 'border-white' : 'border-slate-300'}`}>
                                                            {isSelected && <Check size={12}/>}
                                                        </div>
                                                        <span className="text-sm font-bold line-clamp-1">{p.name}</span>
                                                    </div>
                                                    {/* Delete Button (Only for manually added projects or admin) */}
                                                    <button 
                                                        onClick={(e) => handleDeleteProject(e, p.id)}
                                                        className={`p-1.5 rounded-lg transition-colors z-10 ${isSelected ? 'text-indigo-200 hover:text-white hover:bg-indigo-500' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                                                        title="Xóa dự án"
                                                    >
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </div>
                                                <div className={`text-[10px] flex gap-3 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                                                    <span className="flex items-center gap-1"><MapPin size={10}/> {p.location}</span>
                                                    <span className="flex items-center gap-1"><DollarSign size={10}/> {p.priceRange}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Billing View - UPGRADED WITH REAL DATA */}
                    {activeTab === 'billing' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            {/* Current Plan Card */}
                            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-slate-800">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
                                <div className="relative z-10 w-full md:w-auto">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-sm border border-indigo-500/30">
                                            <Crown size={24} className="text-indigo-400"/>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Gói hiện tại</span>
                                            <h3 className="text-2xl font-black">{safeTenant.subscription === 'pro_agent' ? 'PRO AGENT' : 'MIỄN PHÍ'}</h3>
                                        </div>
                                    </div>
                                    <p className="text-slate-400 max-w-md text-sm leading-relaxed mt-2">
                                        {safeTenant.subscription === 'pro_agent' 
                                            ? `Bạn đang sở hữu toàn bộ sức mạnh của AI Advisor. Tự động gia hạn vào 01/${new Date().getMonth() + 2}/${new Date().getFullYear()}.`
                                            : 'Nâng cấp lên gói Pro để mở khóa toàn bộ tính năng CRM, Campaign và AI nâng cao.'}
                                    </p>
                                </div>
                                <div className="relative z-10 flex gap-3">
                                    {safeTenant.subscription === 'free' ? (
                                        <button 
                                            onClick={() => handleSubscriptionChange('pro_agent')}
                                            disabled={isProcessingPayment}
                                            className="px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                                        >
                                            {isProcessingPayment ? <Loader2 size={18} className="animate-spin text-indigo-900"/> : <Zap size={18} fill="currentColor" className="text-yellow-500"/>}
                                            {isProcessingPayment ? 'Đang xử lý...' : 'Nâng cấp ngay'}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleSubscriptionChange('free')}
                                            disabled={isProcessingPayment}
                                            className="px-6 py-3 border border-white/20 text-white hover:bg-white/10 rounded-xl text-xs font-bold transition-colors"
                                        >
                                            Hủy gói Pro
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Usage Stats (Quota) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Dung lượng AI</span>
                                        <Zap size={16} className="text-amber-500"/>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900 mb-2">
                                        {usage ? usage.aiTokens.used.toLocaleString() : '...'} 
                                        <span className="text-sm text-slate-400 font-medium"> / {usage ? (usage.aiTokens.total / 1000) + 'k' : '...'} tokens</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{width: usage ? `${(usage.aiTokens.used / usage.aiTokens.total) * 100}%` : '0%'}}></div>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Lưu trữ Lead</span>
                                        <User size={16} className="text-blue-500"/>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900 mb-2">
                                        {usage ? usage.leads.used : '...'}
                                        <span className="text-sm text-slate-400 font-medium"> / {usage ? usage.leads.total : '...'} khách</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{width: usage ? `${(usage.leads.used / usage.leads.total) * 100}%` : '0%'}}></div>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Chiến dịch Gửi</span>
                                        <MessageSquare size={16} className="text-purple-500"/>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900 mb-2">
                                        {usage ? usage.campaigns.used : '...'}
                                        <span className="text-sm text-slate-400 font-medium"> / {usage ? usage.campaigns.total : '...'} đợt</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 rounded-full" style={{width: usage ? `${(usage.campaigns.used / usage.campaigns.total) * 100}%` : '0%'}}></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Invoice History */}
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Clock size={18} className="text-slate-400"/> Lịch sử thanh toán
                                    </h3>
                                    <button onClick={handleExportInvoice} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                        <Download size={12}/> Xuất Excel
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                                            <tr>
                                                <th className="px-6 py-4">Mã hóa đơn</th>
                                                <th className="px-6 py-4">Ngày</th>
                                                <th className="px-6 py-4">Nội dung</th>
                                                <th className="px-6 py-4">Số tiền</th>
                                                <th className="px-6 py-4">Trạng thái</th>
                                                <th className="px-6 py-4 text-right">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-sm">
                                            {invoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{inv.id}</td>
                                                    <td className="px-6 py-4 text-slate-700">{inv.date.toLocaleDateString('vi-VN')}</td>
                                                    <td className="px-6 py-4 font-medium text-slate-900">{inv.description}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-900">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.amount)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">
                                                            <CheckCircle2 size={10} className="fill-green-700 text-green-100"/> Đã TT
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                            <Download size={16}/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                        <Shield size={24} className="text-slate-500"/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">Phương thức thanh toán</h4>
                                        {cardLast4 ? (
                                            <p className="text-xs text-slate-500">Thẻ Tín Dụng •••• {cardLast4}</p>
                                        ) : (
                                            <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10}/> Chưa có thẻ</p>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setIsPaymentModalOpen(true)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                    {cardLast4 ? 'Thay đổi' : 'Thêm thẻ mới'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Toast */}
            {toast.show && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[110] animate-in fade-in slide-in-from-bottom-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : toast.type === 'info' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-500'}`}>
                        {toast.type === 'error' ? <AlertCircle size={14} className="text-white"/> : <Check size={14} strokeWidth={3} className="text-white"/>}
                    </div>
                    <span className="text-sm font-bold pr-1">{toast.message}</span>
                </div>
            )}

            {/* PAYMENT METHOD MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-xl text-slate-900">Cập nhật thẻ</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                                <X size={20}/>
                            </button>
                        </div>

                        {/* Credit Card Visualization */}
                        <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white shadow-xl relative overflow-hidden h-48 flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px]"></div>
                            <div className="flex justify-between items-start">
                                <div className="text-sm font-bold opacity-70">Thẻ Tín Dụng</div>
                                <Shield size={20} className="opacity-50"/>
                            </div>
                            <div>
                                <div className="text-xl font-mono tracking-widest mb-4 drop-shadow-md">
                                    {paymentForm.number ? formatCardNumber(paymentForm.number) : '•••• •••• •••• ••••'}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-[9px] uppercase opacity-60 font-bold mb-1">Tên Chủ Thẻ</div>
                                        <div className="text-sm font-bold tracking-wide uppercase">{paymentForm.holder || 'NGUYEN VAN A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] uppercase opacity-60 font-bold mb-1">Hết Hạn</div>
                                        <div className="text-sm font-bold font-mono">{paymentForm.expiry ? formatExpiry(paymentForm.expiry) : 'MM/YY'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSaveCard} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Số thẻ</label>
                                <input 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-colors"
                                    placeholder="0000 0000 0000 0000"
                                    maxLength={19}
                                    value={formatCardNumber(paymentForm.number)}
                                    onChange={e => setPaymentForm({...paymentForm, number: e.target.value.replace(/\s/g, '')})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Ngày hết hạn</label>
                                    <input 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-colors"
                                        placeholder="MM/YY"
                                        maxLength={5}
                                        value={formatExpiry(paymentForm.expiry)}
                                        onChange={e => setPaymentForm({...paymentForm, expiry: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">CVC</label>
                                    <input 
                                        type="password"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-colors"
                                        placeholder="123"
                                        maxLength={3}
                                        value={paymentForm.cvc}
                                        onChange={e => setPaymentForm({...paymentForm, cvc: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Tên chủ thẻ</label>
                                <input 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-colors uppercase"
                                    placeholder="NGUYEN VAN A"
                                    value={paymentForm.holder}
                                    onChange={e => setPaymentForm({...paymentForm, holder: e.target.value.toUpperCase()})}
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSavingCard || !paymentForm.number || !paymentForm.expiry || !paymentForm.cvc}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 mt-2"
                            >
                                {isSavingCard ? <Loader2 size={18} className="animate-spin"/> : <CreditCard size={18}/>}
                                {isSavingCard ? 'Đang xác thực...' : 'Lưu Thẻ Mới'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentSettings;
