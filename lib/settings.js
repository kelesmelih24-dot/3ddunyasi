import { createClient } from '@/lib/supabase/server';

export const VARSAYILAN_AYARLAR = {
  shipping_fee: 89.9, free_shipping_limit: 750, whatsapp: '', contact_email: '', contact_phone: '',
  address: '', bank_name: '', iban: '', account_holder: '', instagram: '',
};

export async function getSettings() {
  try {
    const supabase = createClient();
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
    return { ...VARSAYILAN_AYARLAR, ...(data || {}) };
  } catch {
    return VARSAYILAN_AYARLAR;
  }
}
