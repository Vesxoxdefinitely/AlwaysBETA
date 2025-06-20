import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, IconButton, List, ListItem, ListItemAvatar, ListItemText, Avatar, Divider, TextField, Button, Paper, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SendIcon from '@mui/icons-material/Send';
import TagIcon from '@mui/icons-material/Tag';
import GroupIcon from '@mui/icons-material/Group';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';
import apiMessenger from '../../utils/axiosMessenger';
import { useSelector } from 'react-redux';
import { AuthState, User } from '../../types';

const mockUser = { name: 'Вы', avatar: 'https://ui-avatars.com/api/?name=Вы&background=0D8ABC&color=fff' };

// Типы
interface Channel {
  _id: string;
  name: string;
  type: string;
}
interface Reply {
  _id?: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
}
interface Message {
  _id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
  replies?: Reply[];
}

const Messenger: React.FC = () => {
  // Получаем текущего пользователя из AuthState
  const currentUser = useSelector((state: { auth: AuthState }) => state.auth.user) as User | null;
  const [chats, setChats] = useState<Channel[]>([]);
  const [selectedChat, setSelectedChat] = useState<string>('');
  const [input, setInput] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [threadOpen, setThreadOpen] = useState(false);
  const [threadMessage, setThreadMessage] = useState<Message | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [threadReplies, setThreadReplies] = useState<Reply[]>([]);
  // --- Для поиска сотрудников и DM ---
  const [openUserSearch, setOpenUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchTimeout, setUserSearchTimeout] = useState<any>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Поиск сотрудников
  const handleUserSearch = (query: string) => {
    setUserSearchQuery(query);
    if (userSearchTimeout) clearTimeout(userSearchTimeout);
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await apiMessenger.get(`/users/search?query=${encodeURIComponent(query)}`);
        setUserSearchResults(res.data);
      } catch {
        setUserSearchResults([]);
      }
    }, 400);
    setUserSearchTimeout(timeout);
  };

  // Начать личный чат
  const handleStartDM = async (user: any) => {
    try {
      console.log('Попытка начать DM с', user);
      const testUserId = '684c9982243eb32722aa33e2';
      const userId = currentUser?._id || testUserId;
      if (!userId) {
        console.error('Нет _id у текущего пользователя');
        return;
      }
      const res = await apiMessenger.post('/dm', { user1: userId, user2: user._id });
      console.log('Ответ от /dm:', res.data);
      let channel = res.data;
      if (!chats.find(c => c._id === channel._id)) {
        setChats(prev => [...prev, channel]);
      }
      setSelectedChat(channel._id);
      setOpenUserSearch(false);
      setUserSearchQuery('');
      setUserSearchResults([]);
    } catch (e) {
      console.error('Ошибка при создании DM:', e);
    }
  };

  // Загрузка каналов при монтировании
  useEffect(() => {
    apiMessenger.get('/channels').then(res => {
      setChats(res.data);
      if (res.data.length > 0 && !selectedChat) setSelectedChat(res.data[0]._id);
    });
  }, []);

  // Загрузка сообщений выбранного канала
  useEffect(() => {
    if (!selectedChat) return;
    setLoading(true);
    apiMessenger.get(`/channels/${selectedChat}/messages`).then(res => {
      setMessages(res.data);
      setLoading(false);
    });
  }, [selectedChat]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Загрузка треда
  useEffect(() => {
    if (threadOpen && threadMessage) {
      setLoadingReplies(true);
      apiMessenger.get(`/messages/${threadMessage._id}/replies`).then(res => {
        setThreadReplies(res.data);
        setLoadingReplies(false);
      });
    }
  }, [threadOpen, threadMessage]);

  // Создать канал
  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    const res = await apiMessenger.post('/channels', { name: newChannelName, type: 'channel' });
    setChats(prev => [...prev, res.data]);
    setNewChannelName('');
    setOpenDialog(false);
    setSelectedChat(res.data._id);
  };

  // Отправить сообщение
  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;
    const res = await apiMessenger.post(`/channels/${selectedChat}/messages`, {
      author: mockUser.name,
      avatar: mockUser.avatar,
      text: input,
      time: new Date().toLocaleTimeString().slice(0, 5),
    });
    setMessages(prev => [...prev, res.data]);
    setInput('');
  };

  // Открыть тред
  const openThread = (msg: Message) => {
    setThreadMessage(msg);
    setThreadOpen(true);
  };

  // Отправить ответ в тред
  const handleSendReply = async () => {
    if (!replyInput.trim() || !threadMessage) return;
    const res = await apiMessenger.post(`/messages/${threadMessage._id}/replies`, {
      author: mockUser.name,
      avatar: mockUser.avatar,
      text: replyInput,
      time: new Date().toLocaleTimeString().slice(0, 5),
    });
    setThreadReplies(prev => [...prev, res.data]);
    setReplyInput('');
    // обновить replies в основном списке сообщений
    setMessages(msgs => msgs.map(m => m._id === threadMessage._id ? { ...m, replies: [...(m.replies || []), res.data] } : m));
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#181c24' }}>
      {/* Sidebar */}
      <Box sx={{ width: 270, bgcolor: '#20232a', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid #23272f' }}>
        <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #23272f' }}>
          <Avatar src={mockUser.avatar} />
          <Box>
            <Typography fontWeight={700} fontSize={18}>{mockUser.name}</Typography>
            <Typography fontSize={13} color="#b0b8c1">online</Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', pt: 1 }}>
          <Typography sx={{ pl: 3, pb: 1, color: '#b0b8c1', fontSize: 13, fontWeight: 700 }}>Каналы</Typography>
          <List>
            {chats.map(chat => (
              <ListItem
                button
                key={chat._id}
                selected={selectedChat === chat._id}
                onClick={() => setSelectedChat(chat._id)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  bgcolor: selectedChat === chat._id ? '#23272f' : 'transparent',
                  '&:hover': { bgcolor: '#23272f' },
                  transition: 'background 0.2s',
                }}
              >
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: '#23272f' }}>{chat.type === 'group' ? <GroupIcon sx={{ color: '#00bcd4' }} /> : <TagIcon color="primary" />}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography fontWeight={600} fontSize={15}>{chat.name}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </Box>
        <Box sx={{ p: 2, borderTop: '1px solid #23272f', textAlign: 'center' }}>
          <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" color="primary" size="small" sx={{ borderRadius: 2, fontWeight: 600, mb: 1 }}
            onClick={() => setOpenDialog(true)}>
            Новый канал
          </Button>
          <Button startIcon={<GroupIcon />} variant="outlined" color="secondary" size="small" sx={{ borderRadius: 2, fontWeight: 600, mb: 1, ml: 1 }}
            onClick={() => setOpenUserSearch(true)}>
            Поиск сотрудников
          </Button>
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>Создать новый канал</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Название канала"
                fullWidth
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateChannel(); }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
              <Button onClick={handleCreateChannel} disabled={!newChannelName.trim()} variant="contained">Создать</Button>
            </DialogActions>
          </Dialog>
          {/* Диалог поиска сотрудников */}
          <Dialog open={openUserSearch} onClose={() => setOpenUserSearch(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Поиск сотрудников</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Имя или email"
                fullWidth
                value={userSearchQuery}
                onChange={e => handleUserSearch(e.target.value)}
              />
              <List>
                {userSearchResults.map(user => (
                  <ListItem key={user._id} secondaryAction={
                    <Button size="small" variant="contained" onClick={() => handleStartDM(user)}>
                      Начать чат
                    </Button>
                  }>
                    <ListItemAvatar>
                      <Avatar src={user.avatar} />
                    </ListItemAvatar>
                    <ListItemText primary={user.name} secondary={user.email} />
                  </ListItem>
                ))}
                {userSearchQuery && !userSearchResults.length && (
                  <Typography sx={{ p: 2, color: '#b0b8c1' }}>Ничего не найдено</Typography>
                )}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenUserSearch(false)}>Закрыть</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>

      {/* Main area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#181c24' }}>
        {/* Top bar */}
        <Box sx={{ height: 64, px: 3, display: 'flex', alignItems: 'center', borderBottom: '1px solid #23272f', bgcolor: '#20232a' }}>
          <IconButton onClick={() => setSelectedChat('')} sx={{ color: '#b0b8c1', mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography fontWeight={700} fontSize={20} color="#fff">
            {chats.find(c => c._id === selectedChat)?.name}
          </Typography>
        </Box>
        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 0, py: 2, display: 'flex', flexDirection: 'column', bgcolor: '#181c24' }}>
          {!selectedChat ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#b0b8c1' }}>
              <img src="/logo512.png" alt="Always" style={{ width: 120, marginBottom: 24, opacity: 0.7 }} />
              <Typography variant="h5" fontWeight={700}>Always</Typography>
              <Typography sx={{ mt: 1 }}>Выберите чат или канал для начала общения</Typography>
            </Box>
          ) : loading ? (
            <Typography color="#b0b8c1" align="center" sx={{ mt: 4 }}>Загрузка сообщений...</Typography>
          ) : (
            messages.map((msg) => (
              <Box key={msg._id} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, px: 3, position: 'relative' }}>
                <Avatar src={msg.avatar} sx={{ width: 36, height: 36, mr: 2, mt: 0.5 }} />
                <Paper elevation={0} sx={{ bgcolor: msg.author === mockUser.name ? '#2196f3' : '#23272f', color: msg.author === mockUser.name ? '#fff' : '#e3e3e3', borderRadius: 3, px: 2, py: 1, minWidth: 80, maxWidth: '70%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography fontWeight={700} fontSize={15} sx={{ mr: 1 }}>{msg.author}</Typography>
                    <Typography fontSize={12} color={msg.author === mockUser.name ? '#cbe6ff' : '#b0b8c1'}>{msg.time}</Typography>
                  </Box>
                  <Typography fontSize={15}>{msg.text}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                    <Tooltip title="Ответить в канал">
                      <IconButton size="small" color="inherit" sx={{ color: '#90caf9' }} onClick={() => setInput(`@${msg.author}: ${msg.text}\n`)}>
                        <ReplyOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Открыть тред">
                      <IconButton size="small" color="inherit" sx={{ color: '#b39ddb' }} onClick={() => openThread(msg)}>
                        <ForumOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {msg.replies && msg.replies.length > 0 && (
                      <Typography sx={{ ml: 1, fontSize: 12, color: '#b0b8c1' }}>
                        {msg.replies.length} ответ(а)
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>
        {/* Input */}
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid #23272f', bgcolor: '#20232a', position: 'sticky', bottom: 0 }}>
          <TextField
            size="medium"
            fullWidth
            placeholder="Написать сообщение..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            InputProps={{
              sx: { bgcolor: '#23272f', borderRadius: 3, color: '#fff' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton color="primary" onClick={handleSend} disabled={!input.trim()}>
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* Thread (reply) panel */}
      <Dialog open={threadOpen} onClose={() => setThreadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Тред</DialogTitle>
        <DialogContent dividers>
          {threadMessage && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Avatar src={threadMessage.avatar} sx={{ width: 32, height: 32, mr: 2, mt: 0.5 }} />
                <Box>
                  <Typography fontWeight={700} fontSize={15}>{threadMessage.author}</Typography>
                  <Typography fontSize={13} color="#b0b8c1">{threadMessage.time}</Typography>
                  <Typography fontSize={15} sx={{ mt: 1 }}>{threadMessage.text}</Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography fontWeight={600} fontSize={14} sx={{ mb: 1 }}>Ответы</Typography>
              {loadingReplies ? (
                <Typography color="#b0b8c1">Загрузка...</Typography>
              ) : (
                threadReplies.length > 0 ? (
                  threadReplies.map((reply) => (
                    <Box key={reply._id || reply.time} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar src={reply.avatar} sx={{ width: 28, height: 28, mr: 2, mt: 0.5 }} />
                      <Box>
                        <Typography fontWeight={700} fontSize={14}>{reply.author}</Typography>
                        <Typography fontSize={12} color="#b0b8c1">{reply.time}</Typography>
                        <Typography fontSize={14} sx={{ mt: 0.5 }}>{reply.text}</Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography color="#b0b8c1">Нет ответов</Typography>
                )
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, p: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Написать ответ..."
            value={replyInput}
            onChange={e => setReplyInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSendReply(); }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton color="primary" onClick={handleSendReply} disabled={!replyInput.trim()}>
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Messenger;
