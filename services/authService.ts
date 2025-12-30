
/**
 * 🔐 SECURITY CRITICAL: AUTHENTICATION & TENANCY 🔐
 * =============================================================================
 * MOCKS A SECURE BACKEND AUTHENTICATION SYSTEM.
 * 
 * ⚠️ DANGER ZONE:
 * 1. Password hashing here is basic. IN PRODUCTION, THIS MUST BE REPLACED WITH BCRYPT/ARGON2.
 * 2. 'DEMO_TENANT' defines the default fallback behavior. Modifying it affects the "Guest" experience.
 * 3. Session management relies on LocalStorage (SESSION_KEY). Clearing this logs the user out immediately.
 * 
 * @module AuthService
 * =============================================================================
 */

import { TenantProfile } from "../types";

const USERS_KEY = 'advisor_users_db';
const SESSION_KEY = 'advisor_session_user';

// --- VALIDATION UTILS ---
const validators = {
    // RFC 5322 Standard Email Regex
    email: (email: string) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    },
    // Vietnam Phone Regex (Vinaphone, Viettel, Mobifone, etc.)
    phone: (phone: string) => {
        const re = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
        return re.test(phone);
    },
    // Min 6 chars
    password: (pass: string) => pass.length >= 6
};

// --- SECURITY UTILS (MOCK) ---
const mockHash = (str: string) => {
    // Simple mock hash to simulate security best practices
    // In production, use bcrypt or argon2
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `hashed_${Math.abs(hash)}`;
};

// --- DEMO AGENT ---
export const DEMO_TENANT: TenantProfile = {
  id: 'demo_agent',
  type: 'individual_agent',
  name: 'Advisor Luxury Homes',
  email: 'demo@advisor.ai',
  phone: '0909 888 999',
  subscription: 'free', // SET TO FREE TO TEST UPGRADE FLOW
  assignedProjects: ['empire', 'tgc', 'gms', 'metropole'],
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
  welcomeMessage: 'Chào mừng quý khách đến với Advisor Luxury Homes. Em là trợ lý chuyên gia chuyên trách các dự án hạng sang tại TP.HCM. Em có thể hỗ trợ thông tin gì cho quý khách ạ?'
};

// --- AUTH SERVICE ---
export const authService = {
  getUsers: (): TenantProfile[] => {
    try {
        const usersStr = localStorage.getItem(USERS_KEY);
        const users = usersStr ? JSON.parse(usersStr) : [];
        return Array.isArray(users) ? users : [];
    } catch (e) {
        console.error("Lỗi đọc dữ liệu Users:", e);
        return [];
    }
  },

  register: (data: Partial<TenantProfile> & { password: string }): { success: boolean, message?: string, user?: TenantProfile } => {
    // 1. DATA SANITIZATION
    const cleanEmail = data.email?.trim().toLowerCase() || '';
    const cleanPhone = data.phone?.trim() || '';
    const cleanName = data.name?.trim() || 'New Agent';
    const cleanPass = data.password || '';

    // 2. STRICT VALIDATION LAYER
    if (!cleanEmail || !validators.email(cleanEmail)) {
        return { success: false, message: 'Email không đúng định dạng.' };
    }
    
    if (!cleanPhone || !validators.phone(cleanPhone)) {
        return { success: false, message: 'Số điện thoại không hợp lệ (Yêu cầu SĐT Việt Nam 10 số).' };
    }

    if (!validators.password(cleanPass)) {
        return { success: false, message: 'Mật khẩu quá yếu (Tối thiểu 6 ký tự).' };
    }

    const users = authService.getUsers();
    
    // 3. DUPLICATE CHECK
    if (users.find(u => u.email === cleanEmail)) {
      return { success: false, message: 'Email này đã được sử dụng.' };
    }

    const newUser: TenantProfile = {
      id: `agent_${Date.now()}`,
      type: 'individual_agent',
      name: cleanName,
      email: cleanEmail,
      password: mockHash(cleanPass), // SECURE: Storing hashed password
      phone: cleanPhone,
      subscription: data.subscription || 'free', 
      assignedProjects: ['empire', 'metropole', 'tgc', 'gms', 'vhgr', 'vhcp'],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random&color=fff`
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // UPDATED: AUTO-LOGIN LOGIC FOR UX
    // Store session immediately
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    
    return { success: true, message: 'Đăng ký thành công.', user: newUser };
  },

  login: (email: string, pass: string): { success: boolean, message?: string, user?: TenantProfile } => {
    const cleanEmail = email.trim().toLowerCase();
    const users = authService.getUsers();
    const hashedPass = mockHash(pass);
    const user = users.find(u => u.email === cleanEmail && u.password === hashedPass);

    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: 'Email hoặc mật khẩu không đúng.' };
  },

  // STEP 1: Request OTP
  requestPasswordReset: (email: string): { success: boolean, message: string } => {
      const cleanEmail = email.trim().toLowerCase();
      
      if (!validators.email(cleanEmail)) {
          return { success: false, message: 'Email không đúng định dạng.' };
      }

      const users = authService.getUsers();
      const user = users.find(u => u.email === cleanEmail);
      
      if (!user) {
          // Security: In production, do not reveal if email exists. But for demo, we warn the user.
          return { success: false, message: 'Email này chưa được đăng ký.' };
      }
      
      return { success: true, message: `Mã xác nhận đã được gửi đến ${cleanEmail}. (Mã demo: 123456)` };
  },

  // STEP 2: Confirm & Change Password
  confirmPasswordReset: (email: string, otp: string, newPass: string): { success: boolean, message: string } => {
      // Mock OTP verification
      if (otp !== '123456') {
          return { success: false, message: 'Mã xác nhận không đúng.' };
      }

      if (!validators.password(newPass)) {
          return { success: false, message: 'Mật khẩu mới quá yếu.' };
      }

      const users = authService.getUsers();
      const index = users.findIndex(u => u.email === email.trim().toLowerCase());
      
      if (index !== -1) {
          users[index].password = mockHash(newPass);
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
          return { success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
      }

      return { success: false, message: 'Có lỗi xảy ra. Vui lòng thử lại.' };
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): TenantProfile | null => {
    try {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        return sessionStr ? JSON.parse(sessionStr) : null;
    } catch (e) {
        console.error("Session corruption:", e);
        authService.logout();
        return null;
    }
  },

  updateProfile: (updatedData: Partial<TenantProfile>) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    const users = authService.getUsers();
    const index = users.findIndex(u => u.id === currentUser.id);
    
    if (index !== -1) {
      const newUser = { ...users[index], ...updatedData };
      // Keep password intact if not updating it
      if (!updatedData.password) newUser.password = users[index].password; 
      
      users[index] = newUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      return newUser;
    }
    return currentUser;
  }
};
