import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Chip,
    Button,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemText,
    TextField,
    IconButton,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    AttachFile as AttachFileIcon,
    Comment as CommentIcon,
    ArrowBack as ArrowBackIcon,
    Send as SendIcon
} from '@mui/icons-material';
import { api } from '../../utils/axios';
import { Ticket } from '../../types';

const statusColors: Record<string, string> = {
    backlog: '#9e9e9e',
    todo: '#2196f3',
    in_progress: '#ff9800',
    review: '#9c27b0',
    done: '#4caf50'
};

const priorityColors: Record<string, string> = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336',
    critical: '#d32f2f'
};

const typeColors: Record<string, string> = {
    task: '#2196f3',
    bug: '#f44336',
    feature: '#4caf50',
    epic: '#9c27b0',
    client_request: '#ff9800'
};

const TicketDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (id) {
            fetchTicket();
        }
    }, [id]);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/tickets/${id}`);
            setTicket(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при загрузке тикета');
            setTicket(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim() || !ticket) return;

        try {
            setError(null);
            const response = await api.post(`/tickets/${id}/comments`, {
                text: comment
            });
            setTicket(response.data);
            setComment('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при добавлении комментария');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить этот тикет?')) return;

        try {
            setError(null);
            await api.delete(`/tickets/${id}`);
            navigate('/tickets');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при удалении тикета');
        }
    };

    const getStatusColor = (status: Ticket['status']) => {
        switch (status) {
            case 'backlog':
                return 'default';
            case 'todo':
                return 'info';
            case 'in_progress':
                return 'warning';
            case 'review':
                return 'secondary';
            case 'done':
                return 'success';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status: Ticket['status']) => {
        switch (status) {
            case 'backlog':
                return 'Бэклог';
            case 'todo':
                return 'К выполнению';
            case 'in_progress':
                return 'В работе';
            case 'review':
                return 'На проверке';
            case 'done':
                return 'Выполнено';
            default:
                return status;
        }
    };

    const getPriorityColor = (priority: Ticket['priority']) => {
        switch (priority) {
            case 'critical':
                return 'error';
            case 'high':
                return 'warning';
            case 'medium':
                return 'info';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    const getPriorityLabel = (priority: Ticket['priority']) => {
        switch (priority) {
            case 'critical':
                return 'Критический';
            case 'high':
                return 'Высокий';
            case 'medium':
                return 'Средний';
            case 'low':
                return 'Низкий';
            default:
                return priority;
        }
    };

    const getTypeLabel = (type: Ticket['type']) => {
        switch (type) {
            case 'task':
                return 'Задача';
            case 'bug':
                return 'Ошибка';
            case 'feature':
                return 'Функция';
            case 'epic':
                return 'Эпик';
            case 'client_request':
                return 'Запрос клиента';
            default:
                return type;
        }
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error || !ticket) {
        return (
            <Container>
                <Typography color="error" sx={{ mt: 4 }}>
                    {error || 'Тикет не найден'}
                </Typography>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/tickets')}
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
                    onClick={() => navigate('/tickets')}
                    sx={{
                        color: '#8B0000',
                        '&:hover': {
                            backgroundColor: 'rgba(139, 0, 0, 0.04)'
                        }
                    }}
                >
                    Вернуться к списку
                </Button>
                <Box>
                    <Tooltip title="Редактировать">
                        <IconButton onClick={() => navigate(`/tickets/${id}/edit`)}>
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                        <IconButton onClick={handleDelete} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h5" component="h1" gutterBottom>
                            {ticket.title}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Chip
                                label={ticket.ticketId}
                                size="small"
                                sx={{ mr: 1, backgroundColor: '#8B0000', color: 'white' }}
                            />
                            <Chip
                                label={getTypeLabel(ticket.type)}
                                size="small"
                                sx={{
                                    mr: 1,
                                    backgroundColor: typeColors[ticket.type],
                                    color: 'white'
                                }}
                            />
                            <Chip
                                label={getStatusLabel(ticket.status)}
                                size="small"
                                sx={{
                                    mr: 1,
                                    backgroundColor: statusColors[ticket.status],
                                    color: 'white'
                                }}
                            />
                            <Chip
                                label={getPriorityLabel(ticket.priority)}
                                size="small"
                                sx={{
                                    backgroundColor: priorityColors[ticket.priority],
                                    color: 'white'
                                }}
                            />
                        </Box>

                        <Typography variant="body1" paragraph>
                            {ticket.description}
                        </Typography>

                        {ticket.client && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Информация о клиенте
                                </Typography>
                                <Typography>
                                    Имя: {ticket.client.name}
                                </Typography>
                                {ticket.client.email && (
                                    <Typography>
                                        Email: {ticket.client.email}
                                    </Typography>
                                )}
                                {ticket.client.phone && (
                                    <Typography>
                                        Телефон: {ticket.client.phone}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {ticket.labels && ticket.labels.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Метки
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {ticket.labels.map((label, index) => (
                                        <Chip
                                            key={index}
                                            label={label}
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Комментарии
                        </Typography>
                        {ticket.comments && ticket.comments.length > 0 ? (
                            <List>
                                {ticket.comments.map((comment, index) => (
                                    <ListItem key={index} alignItems="flex-start">
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle2">
                                                    {comment.author?.name || 'Неизвестный пользователь'}
                                                </Typography>
                                            }
                                            secondary={
                                                <>
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        color="text.primary"
                                                    >
                                                        {comment.text}
                                                    </Typography>
                                                    <Typography
                                                        component="span"
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ display: 'block' }}
                                                    >
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography color="text.secondary">
                                Нет комментариев
                            </Typography>
                        )}

                        <Box sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                variant="outlined"
                                placeholder="Добавить комментарий..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                sx={{ mb: 1 }}
                            />
                            <Button
                                variant="contained"
                                endIcon={<SendIcon />}
                                onClick={handleAddComment}
                                disabled={!comment.trim()}
                            >
                                Отправить
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Информация о тикете
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText
                                    primary="Автор"
                                    secondary={ticket.reporter?.name || 'Не указан'}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Исполнитель"
                                    secondary={ticket.assignee?.name || 'Не назначен'}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Дата создания"
                                    secondary={new Date(ticket.createdAt).toLocaleString()}
                                />
                            </ListItem>
                            {ticket.dueDate && (
                                <ListItem>
                                    <ListItemText
                                        primary="Срок выполнения"
                                        secondary={new Date(ticket.dueDate).toLocaleString()}
                                    />
                                </ListItem>
                            )}
                            {ticket.storyPoints && (
                                <ListItem>
                                    <ListItemText
                                        primary="Story Points"
                                        secondary={ticket.storyPoints}
                                    />
                                </ListItem>
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default TicketDetails; 