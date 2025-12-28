
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    FileText, UploadCloud, Search, Trash2, CheckCircle2, 
    Loader2, Database, File, FileCode, AlertCircle, X, HardDrive, Plus
} from 'lucide-react';
import { KnowledgeDocument } from '../../types';
import { dataService } from '../../services/dataService';

// Helper to format bytes
const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to parse size string back to bytes (approx) for mock data
const parseSizeToBytes = (sizeStr: string) => {
    const parts = sizeStr.split(' ');
    const num = parseFloat(parts[0]);
    const unit = parts[1];
    if (unit === 'KB') return num * 1024;
    if (unit === 'MB') return num * 1024 * 1024;
    if (unit === 'GB') return num * 1024 * 1024 * 1024;
    return num;
};

const KnowledgeBase = () => {
    // STATE
    const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    // REFS
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. SYNC DATA
    useEffect(() => {
        const sync = () => setDocs(dataService.getDocuments());
        sync();
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    // 2. COMPUTED STATS (DYNAMIC STORAGE)
    const storageStats = useMemo(() => {
        const totalLimit = 50 * 1024 * 1024; // 50MB Free Tier Limit
        const used = docs.reduce((acc, doc) => acc + parseSizeToBytes(doc.size), 0);
        const percentage = Math.min(100, (used / totalLimit) * 100);
        return { used, totalLimit, percentage };
    }, [docs]);

    // 3. HANDLERS
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        // Reset input value to allow selecting same file again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processFile = (file: File) => {
        // Validation
        if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
            showToast("File quá lớn! Vui lòng chọn file dưới 10MB.", "error");
            return;
        }

        setIsUploading(true);
        
        // Extract real metadata
        const docType = file.name.split('.').pop()?.toLowerCase() as any || 'txt';
        const formattedSize = formatSize(file.size);

        // Simulate Network Upload & AI Processing
        setTimeout(() => {
            const newDoc: KnowledgeDocument = {
                id: `doc_${Date.now()}`,
                name: file.name,
                type: ['pdf', 'xlsx', 'docx', 'txt'].includes(docType) ? docType : 'txt',
                size: formattedSize,
                status: 'processing',
                uploadDate: new Date()
            };
            
            dataService.addDocument(newDoc);
            setIsUploading(false);
            showToast(`Đã tải lên: ${file.name}`);
            
            // Simulate AI Indexing
            setTimeout(() => {
                dataService.updateDocumentStatus(newDoc.id, 'indexed');
                showToast(`AI đã học xong: ${file.name}`);
            }, 3000);
        }, 1500);
    };

    const handleDelete = (id: string, name: string) => {
        if(confirm(`Bạn có chắc chắn muốn xóa tài liệu "${name}"? AI sẽ quên các kiến thức từ tài liệu này.`)) {
            dataService.deleteDocument(id);
            showToast("Đã xóa tài liệu.", "success");
        }
    };

    // Drag & Drop
    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };

    const getFileIcon = (type: string) => {
        switch(type) {
            case 'pdf': return <FileText size={20} className="text-red-500" />;
            case 'xlsx': case 'xls': return <FileCode size={20} className="text-green-600" />;
            case 'docx': case 'doc': return <FileText size={20} className="text-blue-600" />;
            default: return <File size={20} className="text-slate-400" />;
        }
    };

    const filteredDocs = docs.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="h-full bg-[#FAFAFA] flex flex-col font-sans relative" onDragEnter={handleDrag}>
            
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-3">
                        Kho Dữ Liệu AI <span className="text-sm font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">{docs.length} files</span>
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">Nạp dữ liệu để huấn luyện Trợ lý ảo của bạn.</p>
                </div>
                <div className="flex gap-3">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".pdf,.docx,.xlsx,.txt" />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isUploading}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95 disabled:opacity-70 text-sm"
                    >
                        {isUploading ? <Loader2 size={18} className="animate-spin"/> : <UploadCloud size={18}/>}
                        {isUploading ? 'Đang tải...' : 'Upload Tài Liệu'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                
                {/* Drag Drop Zone Overlay */}
                {dragActive && (
                    <div 
                        className="absolute inset-4 z-50 bg-indigo-50/95 backdrop-blur-sm border-4 border-dashed border-indigo-400 rounded-[32px] flex flex-col items-center justify-center text-indigo-600 animate-in fade-in"
                        onDragEnter={handleDrag} 
                        onDragLeave={handleDrag} 
                        onDragOver={handleDrag} 
                        onDrop={handleDrop}
                    >
                        <UploadCloud size={64} className="mb-4 animate-bounce"/>
                        <h3 className="text-2xl font-black">Thả file vào đây ngay</h3>
                        <p className="font-medium mt-2">Hỗ trợ PDF, DOCX, XLSX (Max 10MB)</p>
                    </div>
                )}

                {/* Storage Meter & Upgrade CTA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-2 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200">
                            <HardDrive size={28} className="text-slate-500"/>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h4 className="font-bold text-slate-900">Dung lượng gói Free</h4>
                                    <p className="text-xs text-slate-500 font-medium">Đã dùng {formatSize(storageStats.used)} / 50 MB</p>
                                </div>
                                <span className={`text-sm font-black ${storageStats.percentage > 90 ? 'text-red-500' : 'text-slate-900'}`}>
                                    {storageStats.percentage.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${storageStats.percentage > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} 
                                    style={{width: `${storageStats.percentage}%`}}
                                ></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl shadow-xl text-white flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div>
                            <h4 className="font-bold text-lg">Nâng cấp Pro</h4>
                            <p className="text-xs text-indigo-200 mt-1">Mở khóa 10GB lưu trữ & AI đọc bản vẽ.</p>
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-xs font-bold text-yellow-400">
                            <UploadCloud size={16}/> <span>Không giới hạn file</span>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="mb-6 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm tài liệu..." 
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                    />
                </div>

                {/* Documents List */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên tập tin</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái AI</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày tải lên</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredDocs.map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                                                {getFileIcon(doc.type)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-700 truncate max-w-[180px] md:max-w-sm group-hover:text-indigo-600 transition-colors cursor-pointer" title={doc.name}>{doc.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">{doc.type} • {doc.size}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {doc.status === 'indexed' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase border border-emerald-100">
                                                <CheckCircle2 size={12}/> Đã học
                                            </span>
                                        )}
                                        {doc.status === 'processing' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold uppercase border border-blue-100 animate-pulse">
                                                <Loader2 size={12} className="animate-spin"/> Đang đọc...
                                            </span>
                                        )}
                                        {doc.status === 'error' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold uppercase border border-red-100">
                                                <AlertCircle size={12}/> Lỗi
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                        {doc.uploadDate.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(doc.id, doc.name)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                            title="Xóa tài liệu"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* Empty States */}
                    {docs.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <UploadCloud size={32} className="text-slate-300"/>
                            </div>
                            <h3 className="text-slate-900 font-bold mb-1">Kho dữ liệu trống</h3>
                            <p className="text-slate-500 text-sm">Upload tài liệu dự án (PDF, Bảng giá) để AI bắt đầu học.</p>
                            <button onClick={() => fileInputRef.current?.click()} className="mt-6 text-indigo-600 font-bold text-sm hover:underline">Upload ngay</button>
                        </div>
                    )}
                    {docs.length > 0 && filteredDocs.length === 0 && (
                        <div className="py-20 text-center text-slate-400">
                            <p>Không tìm thấy tài liệu phù hợp với "{searchTerm}".</p>
                        </div>
                    )}
                </div>
            </div>

            {/* TOAST NOTIFICATION */}
            {toast.show && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[120] animate-in fade-in slide-in-from-bottom-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                    <span className="text-sm font-bold">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBase;
