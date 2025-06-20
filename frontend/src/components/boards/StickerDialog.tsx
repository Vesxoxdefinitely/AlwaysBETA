import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, Autocomplete, Box } from '@mui/material';

interface StickerDialogProps {
  open: boolean;
  onClose: () => void;
  sticker: any;
  onSave: (data: any) => void;
  users: { id: string; name: string }[];
}

export default function StickerDialog({ open, onClose, sticker, onSave, users }: StickerDialogProps) {
  const [assignees, setAssignees] = useState(sticker.assignees || []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: '50vh', maxWidth: '50vw' } }}>
      <DialogTitle>Стикер: {sticker.title}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Дата создания: {sticker.createdAt ? new Date(sticker.createdAt).toLocaleString() : '—'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {sticker.description}
        </Typography>
        <Autocomplete
          multiple
          options={users}
          getOptionLabel={option => option.name}
          value={assignees}
          onChange={(_, value) => setAssignees(value)}
          renderInput={params => <TextField {...params} label="Ответственные" />}
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={() => onSave({ ...sticker, assignees })}>Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
}
