import AdminGate from '@/components/admin/AdminGate';
import { TENANT_ID } from '@/lib/supabase/tenant';

/**
 * The listing manager. The tenant is resolved here, on the server, from this
 * deployment's tenant (lib/supabase/tenant.ts), and handed down; the browser never chooses it.
 */
export default function AdminPage() {
  return <AdminGate tenantId={TENANT_ID} />;
}
