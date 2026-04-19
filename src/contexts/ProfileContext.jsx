import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from './AuthContext.jsx';

const ProfileCtx = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user]);

  const saveCompanyName = async (company_name) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, company_name }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    setProfile(data);
  };

  return (
    <ProfileCtx.Provider value={{ profile, loading, saveCompanyName }}>
      {children}
    </ProfileCtx.Provider>
  );
}

export const useProfile = () => useContext(ProfileCtx);
