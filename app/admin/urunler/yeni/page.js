import { createClient } from '@/lib/supabase/server';
import ProductForm from '@/components/admin/ProductForm';
export default async function Page() {
  const { data: categories } = await createClient().from('categories').select('*').order('sort');
  return <ProductForm categories={categories || []} />;
}
