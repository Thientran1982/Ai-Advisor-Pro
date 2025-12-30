
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    FileText, UploadCloud, Search, Trash2, CheckCircle2, 
    Loader2, File, FileCode, AlertCircle, HardDrive, 
    Eye, X, BrainCircuit, CornerDownRight, RefreshCw, Zap
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

// Helper to parse size string back to bytes (approx)
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
    const [isReindexing, setIsReindexing] = useState(false); // NEW: Re-index state
    const [dragActive, setDragActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [previewDoc, setPreviewDoc] = useState<KnowledgeDocument | null>(null);
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' });

    // REFS
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

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

    // 3. DEEP SEARCH LOGIC (UPGRADED)
    const filteredDocs = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return docs;
        return docs.filter(doc => {
            const nameMatch = doc.name.toLowerCase().includes(term);
            const contentMatch = (doc as any).content?.toLowerCase().includes(term); // Deep Search
            return nameMatch || contentMatch;
        });
    }, [docs, searchTerm]);

    // 4. HANDLERS
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processFile = (file: File) => {
        if (file.size > 10 * 1024 * 1024) { 
            showToast("File quá lớn! Vui lòng chọn file dưới 10MB.", "error");
            return;
        }

        setIsUploading(true);
        const docType = file.name.split('.').pop()?.toLowerCase() as any || 'txt';
        const formattedSize = formatSize(file.size);

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
            showToast(`Đang xử lý: ${file.name}`);
            
            // Simulate AI Indexing
            setTimeout(() => {
                dataService.updateDocumentStatus(newDoc.id, 'indexed');
                showToast(`AI đã học xong: ${file.name}`);
            }, 3000);
        }, 1500);
    };

    const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if(confirm(`Bạn có chắc chắn muốn xóa tài liệu "${name}"? AI sẽ quên các kiến thức từ tài liệu này.`)) {
            dataService.deleteDocument(id);
            showToast("Đã xóa tài liệu.", "success");
            if (previewDoc?.id === id) setPreviewDoc(null);
        }
    };

    const handleReindex = () => {
        if (docs.length === 0) return;
        setIsReindexing(true);
        showToast("Đang đồng bộ hóa Vector Database...", "info");
        setTimeout(() => {
            setIsReindexing(false);
            showToast("Đã tối ưu hóa tri thức AI!", "success");
        }, 2500);
    };

    // Drag & Drop
    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragIn = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setDragActive(true);
    };
    const handleDragOut = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) setDragActive(false);
    };
    const handleDrop = (e: React.DragEvent) => { 
        e.preventDefault(); e.stopPropagation(); 
        setDragActive(false); 
        dragCounter.current = 0;
        if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); 
    };

    const getFileIcon = (type: string) => {
        switch(type) {
            case 'pdf': return <FileText size={20} className="text-red-500" />;
            case 'xlsx': case 'xls': return <FileCode size={20} className="text-green-600" />;
            case 'docx': case 'doc': return <FileText size={20} className="text-blue-600" />;
            default: return <File size={20} className="text-slate-400" />;
        }
    };

    return (
        <div 
            className="h-full bg-[#FAFAFA] flex flex-col font-sans relative" 
            onDragEnter={handleDragIn} 
            onDragLeave={handleDragOut} 
            onDragOver={handleDrag} 
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-sm z-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-3">
                        Kho Dữ Liệu AI <span className="text-sm font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">{docs.length} files</span>
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">Nạp tài liệu dự án để AI học và tư vấn chính xác.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    {docs.length > 0 && (
                        <button 
                            onClick={handleReindex}
                            disabled={isReindexing}
                            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                            title="Làm mới tri thức (Re-index)"
                        >
                            <RefreshCw size={20} className={isReindexing ? "animate-spin" : ""} />
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".pdf,.docx,.xlsx,.txt" />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isUploading}
                        className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95 disabled:opacity-70 text-sm"
                    >
                        {isUploading ? <Loader2 size={18} className="animate-spin"/> : <UploadCloud size={18}/>}
                        {isUploading ? 'Đang tải...' : 'Upload Tài Liệu'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
                
                {/* Drag Drop Zone Overlay */}
                {dragActive && (
                    <div className="absolute inset-0 z-50 bg-indigo-50/95 backdrop-blur-md flex flex-col items-center justify-center text-indigo-600 animate-in fade-in border-4 border-indigo-400 border-dashed m-4 rounded-[32px]">
                        <UploadCloud size={80} className="mb-4 animate-bounce drop-shadow-xl"/>
                        <h3 className="text-3xl font-black mb-2">Thả file vào đây</h3>
                        <p className="font-bold text-indigo-400">PDF, Excel, Word (Max 10MB)</p>
                    </div>
                )}

                {/* Storage Meter */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 shadow-inner">
                        <HardDrive size={24} className="text-slate-500"/>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Dung lượng sử dụng</h4>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Gói Free: {formatSize(storageStats.used)} / 50 MB</p>
                            </div>
                            <span className={`text-sm font-black ${storageStats.percentage > 90 ? 'text-red-500' : 'text-indigo-600'}`}>
                                {storageStats.percentage.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${storageStats.percentage > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} 
                                style={{width: `${storageStats.percentage}%`}}
                            ></div>
                        </div>
                    </div>
                    <button className="hidden md:flex px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100">
                        Nâng cấp Pro
                    </button>
                </div>

                {/* Filter Bar with Deep Search Indicator */}
                <div className="mb-6 relative max-w-md group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"/>
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo tên file hoặc nội dung..." 
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                    />
                    {searchTerm && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold border border-indigo-100 animate-in fade-in">
                            Deep Search ON
                        </div>
                    )}
                </div>

                {/* Documents List */}
                <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-8">Tên tập tin</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Trạng thái AI</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Ngày tải</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right pr-8">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredDocs.map(doc => {
                                // Highlight logic if matched by content
                                const isContentMatch = searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase());
                                return (
                                    <tr 
                                        key={doc.id} 
                                        className={`transition-colors group cursor-pointer ${isContentMatch ? 'bg-indigo-50/30 hover:bg-indigo-50' : 'hover:bg-slate-50'}`}
                                        onClick={() => setPreviewDoc(doc)}
                                    >
                                        <td className="px-6 py-4 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm group-hover:border-indigo-200 transition-colors">
                                                    {getFileIcon(doc.type)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800 truncate max-w-[150px] md:max-w-sm group-hover:text-indigo-700 transition-colors">
                                                        {doc.name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase flex items-center gap-2">
                                                        {doc.type} • {doc.size}
                                                        {isContentMatch && (
                                                            <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                                                <Zap size={8} fill="currentColor"/> Tìm thấy trong nội dung
                                                            </span>
                                                        )}
                                                        {/* Mobile Status */}
                                                        <span className={`md:hidden font-bold ${doc.status === 'indexed' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                            {doc.status === 'indexed' ? '• Đã học' : '• Đang đọc'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            {doc.status === 'indexed' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase border border-emerald-100">
                                                    <CheckCircle2 size={12}/> Đã học xong
                                                </span>
                                            )}
                                            {doc.status === 'processing' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold uppercase border border-blue-100 animate-pulse">
                                                    <Loader2 size={12} className="animate-spin"/> Đang đọc...
                                                </span>
                                            )}
                                            {doc.status === 'error' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold uppercase border border-red-100">
                                                    <AlertCircle size={12}/> Lỗi đọc
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 hidden md:table-cell">
                                            {doc.uploadDate.toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-right pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors md:opacity-0 md:group-hover:opacity-100"
                                                    title="Xem nội dung AI học được"
                                                >
                                                    <Eye size={18}/>
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, doc.id, doc.name)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors md:opacity-0 md:group-hover:opacity-100"
                                                    title="Xóa tài liệu"
                                                >
                                                    <Trash2 size={18}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {/* Empty States */}
                    {docs.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                <UploadCloud size={32} className="text-slate-300"/>
                            </div>
                            <h3 className="text-slate-900 font-bold text-lg mb-1">Kho dữ liệu trống</h3>
                            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">Upload tài liệu dự án (PDF, Bảng giá) để AI bắt đầu học và tư vấn cho khách.</p>
                            <button onClick={() => fileInputRef.current?.click()} className="mt-6 text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">Upload ngay <CornerDownRight size={14}/></button>
                        </div>
                    )}
                    {docs.length > 0 && filteredDocs.length === 0 && (
                        <div className="py-16 text-center">
                            <p className="text-slate-400 text-sm font-medium">Không tìm thấy tài liệu nào khớp với từ khóa.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PREVIEW MODAL */}
            {previewDoc && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-[24px] w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <BrainCircuit size={20} className="text-indigo-600"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Góc nhìn của AI</h3>
                                    <p className="text-xs text-slate-500">Dữ liệu trích xuất từ: {previewDoc.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-400 hover:text-slate-900"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-sm font-mono text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {(previewDoc as any).content || "Đang xử lý nội dung... Vui lòng đợi trong giây lát."}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-white text-center">
                            <p className="text-xs text-slate-400 font-medium">AI sẽ dùng thông tin trên để trả lời khi khách hỏi.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            {toast.show && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[120] animate-in fade-in slide-in-from-bottom-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : toast.type === 'info' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18}/> : toast.type === 'info' ? <Loader2 size={18} className="animate-spin"/> : <AlertCircle size={18}/>}
                    <span className="text-sm font-bold">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBase;
