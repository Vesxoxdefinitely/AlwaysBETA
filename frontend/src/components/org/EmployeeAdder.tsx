import React, { useState } from 'react';
import axios from 'axios';

interface Props {
  orgId: string; // ID организации
}

const EmployeeAdder: React.FC<Props> = ({ orgId }) => {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/org/${orgId}/employees`, { email });
      setResult({ email: res.data.email, password: res.data.password });
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка добавления сотрудника');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '24px auto', padding: 16, background: '#23272f', borderRadius: 8, color: '#fff' }}>
      <h3>Добавить сотрудни��а</h3>
      <input
        type="email"
        placeholder="Email сотрудника"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #90caf9', marginBottom: 8 }}
      />
      <button
        onClick={handleAdd}
        disabled={loading || !email}
        style={{ width: '100%', padding: 10, borderRadius: 4, border: 'none', background: '#90caf9', color: '#23272f', fontWeight: 700, cursor: 'pointer' }}
      >
        {loading ? 'Добавление...' : 'Добавить сотрудника'}
      </button>
      {result && (
        <div style={{ marginTop: 16, color: '#4caf50' }}>
          <div>Сотрудник: <b>{result.email}</b></div>
          <div>Одноразовый пароль: <b>{result.password}</b></div>
        </div>
      )}
      {error && <div style={{ color: '#f44336', marginTop: 16 }}>{error}</div>}
    </div>
  );
};

export default EmployeeAdder;
