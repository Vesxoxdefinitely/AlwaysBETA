import React, { useState, useEffect } from 'react';
import { TextField, List, ListItem, ListItemAvatar, ListItemText, Avatar, Typography, Box, Button } from '@mui/material';
import apiMessenger from '../../utils/axiosMessenger';
import { User } from '../../types';

interface UserSearchProps {
  onStartDM: (user: User) => void;
  currentUserId: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ onStartDM, currentUserId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    apiMessenger.get('/users').then(res => setUsers(res.data));
  }, []);

  const filtered = users.filter(u =>
    u._id !== currentUserId &&
    (u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        label="Поиск сотрудника"
        fullWidth
        value={query}
        onChange={e => setQuery(e.target.value)}
        sx={{ mb: 2 }}
      />
      <List>
        {filtered.length === 0 && <Typography color="textSecondary">Не найдено</Typography>}
        {filtered.map(user => (
          <ListItem key={user._id} secondaryAction={
            <Button variant="outlined" size="small" onClick={() => onStartDM(user)}>
              Личное сообщение
            </Button>
          }>
            <ListItemAvatar>
              <Avatar>{user.name[0]}</Avatar>
            </ListItemAvatar>
            <ListItemText primary={user.name} secondary={user.email} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default UserSearch;
