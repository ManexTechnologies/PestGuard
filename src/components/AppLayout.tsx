import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navigation, { type TabId } from './pest/Navigation';
import HeroSection from './pest/HeroSection';
import PestScanner from './pest/PestScanner';
import PestMap from './pest/PestMap';
import PestHistory from './pest/PestHistory';
import KnowledgeBase from './pest/KnowledgeBase';
import EmergencyModal from './pest/EmergencyModal';
import AuthModal from './pest/AuthModal';
import ProfileModal from './pest/ProfileModal';
import Footer from './pest/Footer';
import type { PestReport } from '@/data/pestData';
import { getStoredSession, verifySession, logout as doLogout, type User, type FarmerProfile } from '@/lib/auth';

const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reports, setReports] = useState<PestReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const token = getStoredSession();
    if (token) {
      setSessionToken(token);
      verifySession(token).then(result => {
        if (result) {
          setUser(result.user);
          setProfile(result.profile);
        } else {
          setSessionToken(null);
        }
      }).catch(() => setSessionToken(null));
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const reportsRef = collection(db, 'pest_reports');
      const q = query(reportsRef, orderBy('created_at', 'desc'), limit(100));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PestReport[];
      setReports(data || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRateEffectiveness = async (reportId: string, rating: number) => {
    try {
      const reportRef = doc(db, 'pest_reports', reportId);
      await updateDoc(reportRef, { effectiveness_rating: rating });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, effectiveness_rating: rating } : r));
    } catch (err) { console.error('Failed to rate:', err); }
  };

  const handleAuthSuccess = (u: User, p: FarmerProfile, token: string) => {
    setUser(u);
    setProfile(p);
    setSessionToken(token);
  };

  const handleLogout = async () => {
    await doLogout(sessionToken);
    setUser(null);
    setProfile(null);
    setSessionToken(null);
  };

  const stats = {
    totalReports: reports.length,
    activeAlerts: reports.filter(r => r.status === 'active').length,
    criticalAlerts: reports.filter(r => r.severity === 'critical').length,
    provincesAffected: new Set(reports.map(r => r.province)).size,
  };

  const recentAlerts = reports
    .filter(r => r.status === 'active')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onEmergencyClick={() => setEmergencyOpen(true)}
        onSignInClick={() => setAuthOpen(true)}
        onProfileClick={() => setProfileOpen(true)}
        onLogout={handleLogout}
        user={user}
        profile={profile}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <HeroSection onTabChange={handleTabChange} stats={stats} recentAlerts={recentAlerts} />
        )}
        {activeTab === 'scan' && (
          <PestScanner onReportSaved={fetchReports} userId={user?.id} onSignInRequired={() => setAuthOpen(true)} />
        )}
        {activeTab === 'map' && (
          <PestMap reports={reports} loading={reportsLoading} />
        )}
        {activeTab === 'history' && (
          <PestHistory reports={reports} loading={reportsLoading} onRateEffectiveness={handleRateEffectiveness} userId={user?.id} />
        )}
        {activeTab === 'resources' && <KnowledgeBase />}
      </main>

      <Footer onTabChange={handleTabChange} />

      <EmergencyModal isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onAuthSuccess={handleAuthSuccess} />
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        sessionToken={sessionToken}
        onProfileUpdated={(p) => setProfile(p)}
      />
    </div>
  );
};

export default AppLayout;
