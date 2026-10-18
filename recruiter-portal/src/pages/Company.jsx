import { useEffect, useState } from 'react';
import api from '../api';

export default function Company() {
  const [company, setCompany] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/recruiter/company')
      .then((r) => setCompany(r.data.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load company'));
  }, []);

  if (error) return <p className="text-marker-red font-bold">{error}</p>;
  if (!company) return <p className="text-pencil-faint">Loading company profile…</p>;

  const rows = [
    ['Industry', company.industry],
    ['Website', company.website],
    ['Location', company.location],
    ['Contact email', company.contactEmail],
    ['Contact phone', company.contactPhone],
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-3xl font-bold">Company Profile</h1>

      <div className="card-hand max-w-2xl">
        <h2 className="font-heading text-2xl font-bold mb-2">{company.name}</h2>
        {company.description && <p className="mb-4 text-pencil-light">{company.description}</p>}
        <table className="w-full text-left">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b border-erased">
                <th className="py-2 pr-4 font-heading w-40">{label}</th>
                <td className="py-2">{value || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
