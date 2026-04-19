import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from './AuthContext.jsx';
import { withinRange, daysBetween } from '../lib/utils.js';

const DataCtx = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [generalExpenses, setGeneralExpenses] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Real-time handlers (defined outside useEffect to keep nesting shallow) ──
  const onExpense = (p) => {
    if (p.eventType === 'INSERT') setExpenses((x) => x.some((e) => e.id === p.new.id) ? x : [p.new, ...x]);
    else if (p.eventType === 'DELETE') setExpenses((x) => x.filter((e) => e.id !== p.old.id));
    else if (p.eventType === 'UPDATE') setExpenses((x) => x.map((e) => (e.id === p.new.id ? p.new : e)));
  };
  const onGeneral = (p) => {
    if (p.eventType === 'INSERT') setGeneralExpenses((x) => x.some((e) => e.id === p.new.id) ? x : [p.new, ...x]);
    else if (p.eventType === 'DELETE') setGeneralExpenses((x) => x.filter((e) => e.id !== p.old.id));
    else if (p.eventType === 'UPDATE') setGeneralExpenses((x) => x.map((e) => (e.id === p.new.id ? p.new : e)));
  };
  const onPayment = (p) => {
    if (p.eventType === 'INSERT') setVendorPayments((x) => x.some((e) => e.id === p.new.id) ? x : [p.new, ...x]);
    else if (p.eventType === 'DELETE') setVendorPayments((x) => x.filter((e) => e.id !== p.old.id));
    else if (p.eventType === 'UPDATE') setVendorPayments((x) => x.map((e) => (e.id === p.new.id ? p.new : e)));
  };
  const onClient = (p) => {
    if (p.eventType === 'INSERT') setClients((x) => x.some((e) => e.id === p.new.id) ? x : [...x, p.new]);
    else if (p.eventType === 'DELETE') setClients((x) => x.filter((e) => e.id !== p.old.id));
    else if (p.eventType === 'UPDATE') setClients((x) => x.map((e) => (e.id === p.new.id ? p.new : e)));
  };
  const onVendor = (p) => {
    if (p.eventType === 'INSERT') setVendors((x) => x.some((e) => e.id === p.new.id) ? x : [...x, p.new]);
    else if (p.eventType === 'DELETE') setVendors((x) => x.filter((e) => e.id !== p.old.id));
    else if (p.eventType === 'UPDATE') setVendors((x) => x.map((e) => (e.id === p.new.id ? p.new : e)));
  };

  useEffect(() => {
    if (!user) {
      setClients([]);
      setVendors([]);
      setExpenses([]);
      setGeneralExpenses([]);
      setVendorPayments([]);
      return;
    }
    loadAll();

    const channel = supabase
      .channel(`data-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` }, onExpense)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'general_expenses', filter: `user_id=eq.${user.id}` }, onGeneral)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_payments', filter: `user_id=eq.${user.id}` }, onPayment)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `user_id=eq.${user.id}` }, onClient)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors', filter: `user_id=eq.${user.id}` }, onVendor)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    const [c, v, e, g, p] = await Promise.all([
      supabase.from('clients').select('*').order('created_at'),
      supabase.from('vendors').select('*').order('created_at'),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('general_expenses').select('*').order('date', { ascending: false }),
      supabase.from('vendor_payments').select('*').order('date', { ascending: false }),
    ]);
    setClients(c.data || []);
    setVendors(v.data || []);
    setExpenses(e.data || []);
    setGeneralExpenses(g.data || []);
    setVendorPayments(p.data || []);
    setLoading(false);
  };

  const uploadReceipt = async (blob, filename) => {
    if (!blob || !user) return null;
    const path = `${user.id}/${Date.now()}_${filename}`;
    const { error } = await supabase.storage
      .from('receipts')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    return supabase.storage.from('receipts').getPublicUrl(path).data.publicUrl;
  };

  // ── Clients ──────────────────────────────────────────────
  const addClient = async (c) => {
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...c, user_id: user.id })
      .select()
      .single();
    if (error) { alert(error.message); return; }
    setClients((x) => [...x, data]);
  };

  const updateClient = async (id, p) => {
    const { error } = await supabase.from('clients').update(p).eq('id', id);
    if (error) { alert(error.message); return; }
    setClients((x) => x.map((c) => (c.id === id ? { ...c, ...p } : c)));
  };

  const toggleClient = async (id) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    const active = !client.active;
    const { error } = await supabase.from('clients').update({ active }).eq('id', id);
    if (error) { alert(error.message); return; }
    setClients((x) => x.map((c) => (c.id === id ? { ...c, active } : c)));
  };

  // ── Vendors ───────────────────────────────────────────────
  const addVendor = async (v) => {
    const { data, error } = await supabase
      .from('vendors')
      .insert({ ...v, user_id: user.id })
      .select()
      .single();
    if (error) { alert(error.message); return; }
    setVendors((x) => [...x, data]);
  };

  const updateVendor = async (id, p) => {
    const { error } = await supabase.from('vendors').update(p).eq('id', id);
    if (error) { alert(error.message); return; }
    setVendors((x) => x.map((v) => (v.id === id ? { ...v, ...p } : v)));
  };

  // ── Expenses ──────────────────────────────────────────────
  const addExpense = async (e) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...e, user_id: user.id })
      .select()
      .single();
    if (error) { alert(error.message); return; }
    setExpenses((x) => [data, ...x]);
  };

  const deleteExpense = async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setExpenses((x) => x.filter((e) => e.id !== id));
  };

  // ── General Expenses ──────────────────────────────────────
  const addGeneralExpense = async (e) => {
    const { data, error } = await supabase
      .from('general_expenses')
      .insert({ ...e, user_id: user.id })
      .select()
      .single();
    if (error) { alert(error.message); return; }
    setGeneralExpenses((x) => [data, ...x]);
  };

  const deleteGeneralExpense = async (id) => {
    const { error } = await supabase.from('general_expenses').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setGeneralExpenses((x) => x.filter((e) => e.id !== id));
  };

  // ── Vendor Payments ───────────────────────────────────────
  const addVendorPayment = async (p) => {
    const { data, error } = await supabase
      .from('vendor_payments')
      .insert({ ...p, user_id: user.id })
      .select()
      .single();
    if (error) { alert(error.message); return; }
    setVendorPayments((x) => [data, ...x]);
  };

  const deleteVendorPayment = async (id) => {
    const { error } = await supabase.from('vendor_payments').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setVendorPayments((x) => x.filter((p) => p.id !== id));
  };

  const resetAll = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    clients,
    vendors,
    expenses,
    generalExpenses,
    vendorPayments,
    loading,

    addClient,
    updateClient,
    toggleClient,

    addVendor,
    updateVendor,

    addExpense,
    deleteExpense,

    addGeneralExpense,
    deleteGeneralExpense,

    addVendorPayment,
    deleteVendorPayment,

    uploadReceipt,
    resetAll,

    getClientExpenses: (cid, f) => {
      const v = expenses
        .filter((e) => e.client_id === cid && withinRange(e.date, f))
        .reduce((a, b) => a + b.amount, 0);
      const g = generalExpenses
        .filter((e) => e.client_id === cid && withinRange(e.date, f))
        .reduce((a, b) => a + b.amount, 0);
      return { vendorTotal: v, genTotal: g, total: v + g };
    },
    getCellAmount: (vid, cid, f) =>
      expenses
        .filter(
          (e) => e.vendor_id === vid && e.client_id === cid && withinRange(e.date, f)
        )
        .reduce((a, b) => a + b.amount, 0),
    getCellExpenses: (vid, cid, f) =>
      expenses.filter(
        (e) => e.vendor_id === vid && e.client_id === cid && withinRange(e.date, f)
      ),
    getVendorTotal: (vid, f) =>
      expenses
        .filter((e) => e.vendor_id === vid && withinRange(e.date, f))
        .reduce((a, b) => a + b.amount, 0),
    getVendorPaid: (vid) =>
      vendorPayments
        .filter((p) => p.vendor_id === vid)
        .reduce((a, b) => a + b.amount, 0),
    getClientAllExpenses: (cid) => ({
      vendor: expenses.filter((e) => e.client_id === cid),
      general: generalExpenses.filter((e) => e.client_id === cid),
    }),
    getVendorAllExpenses: (vid) => expenses.filter((e) => e.vendor_id === vid),
    getGeneralByClient: (cid, f) =>
      generalExpenses
        .filter((e) => e.client_id === cid && withinRange(e.date, f))
        .reduce((a, b) => a + b.amount, 0),
    getCellSeries: (vid, cid, days = 30) => {
      const arr = new Array(days).fill(0);
      const end = new Date().toISOString().slice(0, 10);
      expenses
        .filter((e) => e.vendor_id === vid && e.client_id === cid)
        .forEach((e) => {
          const diff = daysBetween(e.date, end);
          if (diff >= 0 && diff < days) arr[days - 1 - diff] += e.amount;
        });
      return arr;
    },
  };

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export const useData = () => useContext(DataCtx);
