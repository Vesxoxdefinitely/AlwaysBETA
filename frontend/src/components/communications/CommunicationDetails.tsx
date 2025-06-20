import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Grid,
    Chip,
    Divider,
    IconButton,
    TextField,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Send as SendIcon,
    EditNote as EditNoteIcon
} from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import { useRef } from 'react';
import { api } from '../../utils/axios';

interface Message {
    author: string;
    authorType: 'client' | 'staff' | 'internal';
    text: string;
    createdAt: string;
}

interface Communication {
    _id: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    subject: string;
    status: 'new' | 'in_progress' | 'resolved';
    messages: Message[];
    createdAt: string;
    updatedAt: string;
}

const CommunicationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [communication, setCommunication] = useState<Communication | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isInternalMode, setIsInternalMode] = useState(false);
    const [internalCommentError, setInternalCommentError] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateSearch, setTemplateSearch] = useState('');
    const messageRef = useRef<HTMLInputElement | null>(null);
    const templates = [
        { name: 'Базовый ответ', text: 'Здравствуйте! Спасибо за обращение. Мы рассмотрим ваш вопрос в ближайшее время.' },
        { name: 'Взято в работу', text: 'Добрый день! Ваше обращение принято в работу.' },
        { name: 'Запрос уточнения', text: 'Уточните, пожалуйста, дополнительную информацию по вашему вопросу.' },
        { name: 'Длинный шаблон', text: 'Это очень длинный шаблон, который может содержать много текста и подробные инструкции для клиента. Здесь может быть несколько абзацев, примеры, ссылки и т.д. Всё это будет видно во всплывающей подсказке при наведении.' }
    ];

    const insertMarkdown = (tag: '**' | '_') => {
        const textarea = messageRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;
        const before = inputValue.slice(0, start);
        const selected = inputValue.slice(start, end);
        const after = inputValue.slice(end);
        const newValue = `${before}${tag}${selected}${tag}${after}`;
        setInputValue(newValue);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + tag.length, end + tag.length);
        }, 0);
    };

    const handleTemplateSelect = (template: string) => {
        setInputValue(template);
        setShowTemplates(false);
        setTimeout(() => {
            messageRef.current?.focus();
        }, 0);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleAddReplyWithFiles = async () => {
        if ((!inputValue.trim() && files.length === 0) || !communication) return;
        try {
            setError(null);
            if (isInternalMode) {
                await api.post(`/communications/${id}/internal-comment`, {
                    text: inputValue,
                    author: 'Сотрудник'
                });
            } else {
                const formData = new FormData();
                formData.append('text', inputValue);
                files.forEach((file) => formData.append('files', file));
                await api.post(`/communications/${id}/reply-with-files`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setInputValue('');
            setFiles([]);
            setInternalCommentError(null);
            fetchCommunication();
        } catch (err: any) {
            if (isInternalMode) {
                setInternalCommentError(err.response?.data?.message || 'Ошибка при добавлении внутреннего ком��ентария');
            } else {
                setError(err.response?.data?.message || 'Ошибка при добавлении ответа');
            }
        }
    };

    useEffect(() => {
        if (id) {
            fetchCommunication();
        }
        // eslint-disable-next-line
    }, [id]);

    const fetchCommunication = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/communications/${id}`);
            setCommunication(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при загрузке сообщения');
            setCommunication(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить это сообщение?')) return;
        try {
            setError(null);
            await api.delete(`/communications/${id}`);
            navigate('/communications');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при удалении сообщения');
        }
    };

    const handleAddReply = async () => {
        if (!inputValue.trim() || !communication) return;
        try {
            setError(null);
            if (isInternalMode) {
                await api.post(`/communications/${id}/internal-comment`, {
                    text: inputValue,
                    author: 'Сотрудник'
                });
            } else {
                await api.post(`/communications/${id}/replies`, {
                    text: inputValue
                });
            }
            setInputValue('');
            setInternalCommentError(null);
            fetchCommunication();
        } catch (err: any) {
            if (isInternalMode) {
                setInternalCommentError(err.response?.data?.message || 'Ошибка при добавлении внутреннего комментария');
            } else {
                setError(err.response?.data?.message || 'Ошибка при добавлении ответа');
            }
        }
    };

    const getStatusColor = (status: Communication['status']) => {
        switch (status) {
            case 'new':
                return '#2196f3';
            case 'in_progress':
                return '#ff9800';
            case 'resolved':
                return '#4caf50';
            default:
                return '#9e9e9e';
        }
    };

    const getStatusLabel = (status: Communication['status']) => {
        switch (status) {
            case 'new':
                return 'Новое';
            case 'in_progress':
                return 'В работе';
            case 'resolved':
                return 'Решено';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error || !communication) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 4 }}>
                    {error || 'Сообщение не найдено'}
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/communications')}
                    sx={{ mt: 2 }}
                >
                    Вернуться к списку
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/communications')}
                >
                    К списку сообщений
                </Button>
                <Box>
                    <IconButton onClick={() => navigate(`/communications/${id}/edit`)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={handleDelete} color="error">
                        <DeleteIcon />
                    </IconButton>
                </Box>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h5" component="h1">
                                {communication.subject}
                            </Typography>
                            <Chip
                                label={getStatusLabel(communication.status)}
                                sx={{
                                    backgroundColor: getStatusColor(communication.status),
                                    color: 'white'
                                }}
                            />
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Информация о клиенте
                            </Typography>
                            <Typography variant="body1">{communication.clientName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {communication.clientEmail}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {communication.clientPhone}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    {/* Чат-переписка */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2, mb: 2, maxHeight: '60vh', overflowY: 'auto', p: 1 }}>
                            {communication.messages && communication.messages.map((msg, idx) => {
                                const isClient = msg.authorType === 'client';
                                const isStaff = msg.authorType === 'staff';
                                const isInternal = msg.authorType === 'internal';
                                return (
                                    <Box key={idx} sx={{
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: isClient ? 'flex-start' : 'flex-end',
                                        mb: 1
                                    }}>
                                        {isClient && (
                                            <Box sx={{ width: 32, height: 32, mr: 1 }}>
                                                <Box sx={{ width: 32, height: 32, bgcolor: '#bdbdbd', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                                                    {msg.author?.[0]?.toUpperCase() || 'C'}
                                                </Box>
                                            </Box>
                                        )}
                                        <Box sx={{
                                            maxWidth: '70%',
                                            bgcolor: isInternal
                                              ? '#fff8e1' // светло-жёлтый для внутренних комментариев
                                              : isClient
                                                ? '#F5F5F5'
                                                : '#E3F2FD',
                                            color: '#222',
                                            borderRadius: isClient ? '0 12px 12px 12px' : '12px 0 12px 12px',
                                            p: 1.5,
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                            minWidth: 120,
                                            mr: isClient ? 0 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: isInternal ? 1 : 0,
                                            wordBreak: 'break-word',
                                            overflowWrap: 'anywhere',
                                        }}>
                                            {isInternal && <EditNoteIcon fontSize="small" sx={{ color: '#ffa726', mr: 1 }} />}
                                            <Box>
                                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Typography>
                                                <Typography sx={{ fontSize: 10, color: '#999', mt: 0.5, textAlign: 'right' }}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {isClient ? '✓✓' : isInternal ? '✓' : '✓✓'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {!isClient && (
                                            <Box sx={{ width: 32, height: 32 }}>
                                                <Box sx={{ width: 32, height: 32, bgcolor: '#1976d2', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                                                    Я
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    {/* Форма отправки сообщения */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                variant="outlined"
                                placeholder={isInternalMode ? "Внутренний комментарий (видно только коллегам)" : "Написать ответ..."}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                sx={{
                                    mb: 1,
                                    background: isInternalMode ? '#232b3b' : undefined,
                                    color: isInternalMode ? '#fff' : undefined,
                                    transition: 'background 0.2s',
                                    '& .MuiOutlinedInput-root': isInternalMode ? {
                                        '& fieldset': {
                                            borderColor: '#ffa726',
                                            borderWidth: 2,
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#ffb74d',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#ffa726',
                                        },
                                    } : {},
                                }}
                                error={!!internalCommentError && isInternalMode}
                                helperText={isInternalMode ? internalCommentError : undefined}
                            />
                            <IconButton
                                color={isInternalMode ? "warning" : "default"}
                                sx={{ ml: 1 }}
                                onClick={() => setIsInternalMode((v) => !v)}
                                title={isInternalMode ? "Писать клиенту" : "Внутренний комментарий"}
                            >
                                <EditNoteIcon />
                            </IconButton>
                        </Box>
                        <Button
                            variant={isInternalMode ? "outlined" : "contained"}
                            color={isInternalMode ? "warning" : "primary"}
                            endIcon={<SendIcon />}
                            onClick={handleAddReplyWithFiles}
                            disabled={!inputValue.trim() && files.length === 0}
                        >
                            {isInternalMode ? "Добавить внутренний коммент��рий" : "Отправить ответ"}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default CommunicationDetails;
