
import React from 'react';
import { X, Shield, FileText, Lock, AlertTriangle, Scale } from 'lucide-react';

interface LegalModalProps { type: 'privacy' | 'terms' | null; onClose: () => void; }

const LegalModals: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const renderTerms = () => (
      <div className="space-y-6 text-slate-700">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-sm">
              <AlertTriangle className="text-amber-600 shrink-0" size={20} />
              <div>
                  <strong className="text-amber-800 block mb-1">CẢNH BÁO QUAN TRỌNG VỀ AI:</strong>
                  Advisor Pro sử dụng Trí tuệ nhân tạo (AI) để hỗ trợ tư vấn. Mặc dù chúng tôi nỗ lực đảm bảo độ chính xác, AI có thể tạo ra thông tin không chính xác hoặc lỗi thời (Ảo giác AI). Người dùng có trách nhiệm kiểm chứng lại mọi thông tin trước khi ra quyết định tài chính.
              </div>
          </div>

          <section>
              <h3 className="font-bold text-slate-900 text-lg mb-2">1. Chấp thuận Điều khoản</h3>
              <p>Bằng việc đăng ký, truy cập hoặc sử dụng dịch vụ Advisor Pro ("Dịch vụ"), bạn đồng ý bị ràng buộc bởi các Điều khoản này. Nếu bạn không đồng ý, vui lòng ngừng sử dụng Dịch vụ ngay lập tức.</p>
          </section>

          <section>
              <h3 className="font-bold text-slate-900 text-lg mb-2">2. Miễn trừ Trách nhiệm (Disclaimer)</h3>
              <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Không phải lời khuyên tài chính/pháp lý:</strong> Nội dung do AI tạo ra chỉ mang tính chất tham khảo. Chúng tôi không phải là đơn vị tư vấn tài chính, luật sư hay chuyên gia định giá được cấp phép.</li>
                  <li><strong>Tính chính xác của dữ liệu:</strong> Dữ liệu về giá cả, lãi suất, quy hoạch được tổng hợp từ nhiều nguồn và có thể thay đổi theo thời gian thực. Chúng tôi không đảm bảo tính chính xác tuyệt đối tại mọi thời điểm.</li>
                  <li><strong>Rủi ro đầu tư:</strong> Bạn chịu hoàn toàn trách nhiệm về các quyết định đầu tư hoặc giao dịch bất động sản của mình. Advisor Pro không chịu trách nhiệm cho bất kỳ khoản lỗ hoặc thiệt hại nào phát sinh.</li>
              </ul>
          </section>

          <section>
              <h3 className="font-bold text-slate-900 text-lg mb-2">3. Quyền Sở hữu Trí tuệ & Dữ liệu</h3>
              <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Quyền của chúng tôi:</strong> Toàn bộ giao diện, thuật toán, mã nguồn và thương hiệu Advisor Pro thuộc sở hữu độc quyền của chúng tôi.</li>
                  <li><strong>Dữ liệu của bạn:</strong> Bạn giữ quyền sở hữu đối với dữ liệu khách hàng (Leads) mà bạn nhập vào hệ thống. Bạn cấp cho chúng tôi quyền truy cập, lưu trữ và xử lý dữ liệu này để cung cấp Dịch vụ.</li>
              </ul>
          </section>

          <section>
              <h3 className="font-bold text-slate-900 text-lg mb-2">4. Thanh toán & Hoàn tiền</h3>
              <p>Dịch vụ hoạt động theo mô hình đăng ký (Subscription). Các khoản thanh toán cho gói Pro là không hoàn lại (non-refundable), trừ khi có quy định khác của pháp luật hoặc do lỗi kỹ thuật nghiêm trọng từ phía hệ thống kéo dài quá 24 giờ.</p>
          </section>

          <section>
              <h3 className="font-bold text-slate-900 text-lg mb-2">5. Giới hạn Trách nhiệm</h3>
              <p>Trong mọi trường hợp, tổng trách nhiệm pháp lý của Advisor Pro đối với bất kỳ khiếu nại nào liên quan đến Dịch vụ sẽ không vượt quá số tiền bạn đã thanh toán cho chúng tôi trong 03 tháng gần nhất trước khi sự việc phát sinh.</p>
          </section>

          <section>
              <h3 className="font-bold text-slate-900 text-lg mb-2">6. Luật áp dụng</h3>
              <p>Các điều khoản này được điều chỉnh bởi pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Mọi tranh chấp sẽ được giải quyết tại Tòa án có thẩm quyền tại TP. Hồ Chí Minh.</p>
          </section>
      </div>
  );

  const renderPrivacy = () => (
      <div className="space-y-6 text-slate-700">
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex gap-3 text-sm">
              <Shield className="text-indigo-600 shrink-0" size={20} />
              <div>
                  <strong className="text-indigo-800 block mb-1">TUÂN THỦ NGHỊ ĐỊNH 13/2023/NĐ-CP:</strong>
                  Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn tuân thủ nghiêm ngặt theo Nghị định về Bảo vệ dữ liệu cá nhân của Việt Nam.
              </div>
          </div>

          <section>
              <h3 className="font-bold text-slate-900 text-lg mb-2">1. Dữ liệu chúng tôi thu thập</h3>
              <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Thông tin định danh:</strong> Tên, số điện thoại, email, ảnh đại diện.</li>
                  <li><strong>Dữ liệu công việc:</strong> Danh sách khách hàng (Leads), lịch sử chat, ghi chú, lịch hẹn.</li>
                  <li><strong>Dữ liệu kỹ thuật:</strong> Địa chỉ IP, loại thiết bị, cookie, lịch sử truy cập.</li>
              </ul>
          </section>

          <section>
              <h3 className="font-bold text-slate-900 text-lg mb-2">2. Mục đích xử lý dữ liệu</h3>
              <p>Chúng tôi sử dụng dữ liệu của bạn để:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Cung cấp và duy trì Dịch vụ Advisor Pro.</li>
                  <li>Cá nhân hóa trải nghiệm AI (ví dụ: AI học từ lịch sử chat để tư vấn tốt hơn).</li>
                  <li>Gửi thông báo quan trọng về tài khoản và giao dịch.</li>
                  <li>Phát hiện và ngăn chặn gian lận.</li>
              </ul>
          </section>

          <section>
              <h3 className="font-bold text-slate-900 text-lg mb-2">3. Chia sẻ dữ liệu</h3>
              <p>Chúng tôi <strong>KHÔNG</strong> bán dữ liệu của bạn cho bên thứ ba. Dữ liệu chỉ được chia sẻ trong các trường hợp:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li><strong>Nhà cung cấp dịch vụ:</strong> Máy chủ (Cloud), Cổng thanh toán (Payment Gateway), Dịch vụ SMS/Zalo (theo yêu cầu của bạn).</li>
                  <li><strong>Yêu cầu pháp lý:</strong> Khi có yêu cầu hợp pháp từ cơ quan nhà nước có thẩm quyền.</li>
              </ul>
          </section>

          <section>
              <h3 className="font-bold text-slate-900 text-lg mb-2">4. Bảo mật dữ liệu</h3>
              <p>Dữ liệu của bạn được mã hóa theo tiêu chuẩn công nghiệp (SSL/TLS) khi truyền tải và lưu trữ (AES-256). Tuy nhiên, không có phương thức truyền tải nào qua Internet là an toàn 100%. Bạn có trách nhiệm bảo mật mật khẩu tài khoản của mình.</p>
          </section>

          <section>
              <h3 className="font-bold text-slate-900 text-lg mb-2">5. Quyền của bạn</h3>
              <p>Theo Nghị định 13, bạn có quyền:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân của mình.</li>
                  <li>Rút lại sự đồng ý xử lý dữ liệu (điều này có thể khiến Dịch vụ ngừng hoạt động).</li>
                  <li>Khiếu nại nếu phát hiện vi phạm bảo mật.</li>
              </ul>
              <p className="mt-2 text-sm italic">Để thực hiện quyền này, vui lòng liên hệ: privacy@advisor.ai</p>
          </section>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <div className="flex items-center gap-3 text-indigo-900">
                <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                    {type === 'privacy' ? <Lock size={24} className="text-emerald-600"/> : <Scale size={24} className="text-indigo-600"/>}
                </div>
                <div>
                    <h2 className="text-xl font-black">{type === 'privacy' ? 'Chính Sách Bảo Mật & Dữ Liệu' : 'Điều Khoản Sử Dụng Dịch Vụ'}</h2>
                    <p className="text-xs text-slate-500 font-medium">Cập nhật lần cuối: 24/05/2024</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all border border-transparent hover:border-slate-200">
                <X size={20} className="text-slate-500"/>
            </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar leading-relaxed text-sm md:text-base">
            {type === 'privacy' ? renderPrivacy() : renderTerms()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors">
                Đóng
            </button>
            <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200">
                Tôi Đã Hiểu & Đồng Ý
            </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModals;
