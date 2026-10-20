import AdminGate from '@/components/admin/AdminGate';

/**
 * The listing manager. The tenant is resolved here, on the server, from this
 * deployment's TENANT_ID, and handed down; the browser never chooses it.
 */
export default function AdminPage() {
  return <AdminGate tenantId={process.env.TENANT_ID ?? ''} />;
}
