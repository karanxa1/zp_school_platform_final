import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AcademicYear, SchoolProfile } from '../types';

interface SchoolContextType {
  schoolProfile: SchoolProfile | null;
  activeAcademicYear: AcademicYear | null;
  loading: boolean;
  refresh: () => void;
}

const SchoolContext = createContext<SchoolContextType | null>(null);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [activeAcademicYear, setActiveAcademicYear] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'settings', 'schoolProfile'));
        if (profileDoc.exists()) setSchoolProfile(profileDoc.data() as SchoolProfile);

        const q = query(collection(db, 'academic_years'), where('isActive', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) setActiveAcademicYear(snap.docs[0].data() as AcademicYear);
      } catch (err) {
        console.error('SchoolContext load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tick]);

  return (
    <SchoolContext.Provider value={{ schoolProfile, activeAcademicYear, loading, refresh: () => setTick(t => t + 1) }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used within SchoolProvider');
  return ctx;
};
