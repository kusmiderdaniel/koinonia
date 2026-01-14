import { redirect } from 'next/navigation'

export default function AdminPage() {
  // Redirect to legal documents by default
  redirect('/admin/legal-documents')
}
