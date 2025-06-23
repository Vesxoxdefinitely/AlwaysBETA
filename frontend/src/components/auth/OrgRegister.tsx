import React, { useState } from 'react';
import axios from 'axios';
import EmployeeAdder from '../org/EmployeeAdder';

const API_URL = process.env.REACT_APP_API_URL || '/api';

export default function OrgRegister() {
  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/org/register`, {
        orgName,
        adminEmail
      });
      setOrgId(res.data.orgId);
      setAdminPassword(res.data.adminPassword);
      setSuccess('Организация успешно создана!');
      setOrgName('');
      setAdminEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#23272f', borderRadius: 8, color: '#fff' }}>
      <h2>Создать организацию</h2>
      {!orgId && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label>Название организации</label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              required
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #90caf9', marginTop: 4 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Email администратора</label>
            <input
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              required
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #90caf9', marginTop: 4 }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: 'none', background: '#90caf9', color: '#23272f', fontWeight: 700, cursor: 'pointer' }}
          >
            {loading ? 'Создание...' : 'Создать организацию'}
          </button>
          {success && <div style={{ color: '#4caf50', marginTop: 16 }}>{success}</div>}
          {error && <div style={{ color: '#f44336', marginTop: 16 }}>{error}</div>}
        </form>
      )}
      {orgId && (
        <>
          <div style={{ color: '#4caf50', marginTop: 16 }}>
            Организация создана!<br />
            <b>ID организации:</b> {orgId}
          </div>
          <div style={{ color: '#2196f3', marginTop: 16 }}>
            <b>Одноразовый пароль администратора:</b> {adminPassword}
          </div>
          <EmployeeAdder orgId={orgId} />
        </>
      )}
    </div>
  );
}
