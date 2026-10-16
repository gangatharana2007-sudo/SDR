import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { SEED_USERS } from '../data/seedData';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  login: (phone: string, role?: UserRole) => Promise<{ success: boolean; error?: string; isPendingApproval?: boolean }>;
  register: (data: Partial<User>) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  availableUsers: User[];
  refreshUsers: () => Promise<void>;
  isAdmin: boolean;
  isRescueOrMedical: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('disaster_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    // Default to citizen for instant accessibility
    return SEED_USERS[0];
  });

  const [availableUsers, setAvailableUsers] = useState<User[]>(SEED_USERS);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data);
      }
    } catch (e) {
      // Offline fallback: keep seed
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('disaster_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('disaster_current_user');
    }
  }, [currentUser]);

  const login = async (phone: string, preferredRole?: UserRole) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error, isPendingApproval: data.isPendingApproval };
      }
      setCurrentUser(data.user);
      return { success: true };
    } catch (e) {
      // Offline simulated login against seed
      const match = availableUsers.find(u => u.phone === phone);
      if (match) {
        setCurrentUser(match);
        return { success: true };
      }
      return { success: false, error: 'Network error or account not found' };
    }
  };

  const register = async (userData: Partial<User>) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      setCurrentUser(data.user);
      await fetchUsers();
      return { success: true, message: data.message };
    } catch (e) {
      return { success: false, error: 'Registration failed due to connection error.' };
    }
  };

  const logout = () => {
    // Return to citizen profile rather than broken state
    const defaultCitizen = availableUsers.find(u => u.role === 'citizen') || SEED_USERS[0];
    setCurrentUser(defaultCitizen);
  };

  const switchRole = (newRole: UserRole) => {
    const target = availableUsers.find(u => u.role === newRole) || {
      id: `usr-sim-${newRole}`,
      name: `Officer (${newRole.replace('_', ' ')})`,
      phone: '9444000000',
      role: newRole,
      district: 'Chennai',
      isApproved: true,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(target);
  };

  const role: UserRole = currentUser?.role || 'citizen';
  const isAdmin = role === 'state_admin' || role === 'district_officer';
  const isRescueOrMedical = role === 'rescue_team' || role === 'medical_team';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        login,
        register,
        logout,
        switchRole,
        availableUsers,
        refreshUsers: fetchUsers,
        isAdmin,
        isRescueOrMedical,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
