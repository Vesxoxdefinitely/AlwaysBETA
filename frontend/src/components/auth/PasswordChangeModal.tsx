import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert } from '@mui/material';
import { api } from '../../utils/axios';

interface PasswordChangeModalProps {
  open: boolean;
  onSuccess: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ open, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    setError(null);
    if (newPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    if (newPassword !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { newPassword });
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка смены пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} disableEscapeKeyDown onClose={() => {}}>
      <DialogTitle>Смена временного пароля</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Для продолжения работы необходимо сменить временный пароль на постоянный.
        </Alert>
        <TextField
          label="Новый пароль"
          type="password"
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />
        <TextField
          label="Повторите пароль"
          type="password"
          fullWidth
          margin="normal"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleChange} variant="contained" color="primary" disabled={loading}>
          Сменить пароль
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordChangeModal;
