import React, { useState, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Avatar, Box } from '@mui/material';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user: { name: string; email: string; avatar?: string; position?: string };
  onSave: (data: { avatar?: string; position?: string }) => void;
}

export default function ProfileDialog({ open, onClose, user, onSave }: ProfileDialogProps) {
  const [avatar, setAvatar] = useState<string | undefined>(user.avatar);
  const [position, setPosition] = useState(user.position || '');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) { // 200 KB
        setError('Размер файла не должен превышать 200 КБ');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = ev => setAvatar(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Профиль</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar src={avatar} sx={{ width: 80, height: 80, mb: 2 }} />
          <Button variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ mb: 2 }}>
            Загрузить аватар
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>
        <TextField
          label="Должность"
          fullWidth
          value={position}
          onChange={e => setPosition(e.target.value)}
          sx={{ mb: 2 }}
        />
      {error && <Box sx={{ color: 'red', mb: 1 }}>{error}</Box>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={() => onSave({ avatar, position })} disabled={!!error}>Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
}
