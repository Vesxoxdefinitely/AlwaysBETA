import React, { useEffect, useState, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Chip, Divider, Grid, CircularProgress, TextField
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Delete as DeleteIcon, Send as SendIcon } from '@mui/icons-material';
import { api } from '../../utils/axios';

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    author: string;
    assignee?: string;
    tags?: string[];
    dueDate?: string;
    attachments?: any[];
    comments?: {
        author: string;
        text: string;
        mentions?: string[];
        createdAt: string;
    }[];
    createdAt: string;
    updatedAt: string;
}

const TaskDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [commentFiles, setCommentFiles] = useState<File[]>([]);
    // const [commentLoading, setCommentLoading] = useState(false);
    // const [error, setError] = useState<string | null>(null);
    const commentRef = useRef<HTMLInputElement | null>(null);
    const [imgDialog, setImgDialog] = useState<{ open: boolean, src: string, alt: string }>({ open: false, src: '', alt: '' });

    useEffect(() => {
        fetchTask();
        // eslint-disable-next-line
    }, [id]);

    const fetchTask = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/tasks/${id}`);
            setTask(response.data);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Container>;
    }
    if (!task) {
        return <Container><Typography color="error">Задача не найдена</Typography></Container>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/tasks')}>К списку задач</Button>
                <Box>
                    <Button startIcon={<EditIcon />} variant="outlined" sx={{ mr: 1 }} onClick={() => navigate(`/tasks/${task._id}/edit`)}>Редактировать</Button>
                    <Button startIcon={<DeleteIcon />} variant="outlined" color="error" onClick={async () => {
                        if (window.confirm('Удалить задачу?')) {
                            await api.delete(`/tasks/${task._id}`);
                            navigate('/tasks');
                        }
                    }}>Удалить</Button>
                </Box>
            </Box>
            <Grid container spacing={3}>
                {/* Левая часть: описание и стена комментариев */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h4" gutterBottom>{task.title}</Typography>
                        <Typography variant="subtitle1" gutterBottom color="text.secondary">Автор: {task.author}</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>{task.description}</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" gutterBottom>Вложения:</Typography>
                        {task.attachments && task.attachments.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                                {task.attachments.map((file, i) =>
                                    file.mimetype && file.mimetype.startsWith('image/') ? (
                                        <img
                                            key={i}
                                            src={`http://localhost:5000/uploads/${file.filename}`}
                                            alt={file.originalname}
                                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee', cursor: 'pointer' }}
                                            onClick={() => setImgDialog({ open: true, src: `/uploads/${file.filename}`, alt: file.originalname })}
                                        />
                                    ) : (
                                        <a key={i} href={`/uploads/${file.filename}`} target="_blank" rel="noopener noreferrer">
                                            📎 {file.originalname}
                                        </a>
                                    )
                                )}
                            </Box>
                        ) : (
                            <Typography color="text.secondary">Нет вложений</Typography>
                        )}
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>Комментарии</Typography>
                        <Box sx={{ minHeight: 120, mb: 2 }}>
                            {task.comments && task.comments.length > 0 ? (
                                task.comments.map((c: any, i: number) => (
                                    <Paper key={i} sx={{ p: 2, mb: 1 }}>
                                        <Typography variant="subtitle2">{c.author}</Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{c.text}</Typography>
                                        {c.attachments && c.attachments.length > 0 && (
                                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                {/* DEBUG: {JSON.stringify(c.attachments)} */}
                                                {c.attachments.map((file: any, j: number) =>
                                                    file.mimetype && file.mimetype.startsWith('image/') ? (
                                                        <img
                                                            key={j}
                                                            src={`/uploads/${file.filename}`}
                                                            alt={file.originalname}
                                                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee', cursor: 'pointer' }}
                                                            onClick={() => setImgDialog({ open: true, src: `/uploads/${file.filename}`, alt: file.originalname })}
                                                        />
                                                    ) : (
                                                        <a key={j} href={`/uploads/${file.filename}`} target="_blank" rel="noopener noreferrer">
                                                            📎 {file.originalname}
                                                        </a>
                                                    )
                                                )}
                                                                                            </Box>
                                        )}
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(c.createdAt).toLocaleString()}
                                        </Typography>
                                    </Paper>
                                ))
                            ) : (
                                <Typography color="text.secondary">Нет комментариев</Typography>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Оставить комментарий..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                inputRef={commentRef}
                            />
                            <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                title="Прикрепить файл"
                            >
                                📎
                                <input type="file" hidden multiple onChange={e => setCommentFiles(Array.from(e.target.files || []))} />
                            </Button>
                            <Button
                                variant="contained"
                                endIcon={<SendIcon />}
                                disabled={!comment.trim() && commentFiles.length === 0}
                                onClick={async () => {
                                    try {
                                        const formData = new FormData();
                                        formData.append('author', 'Сотрудник');
                                        formData.append('text', comment);
                                        commentFiles.forEach(file => formData.append('attachments', file));
                                        await api.post(`/tasks/${task._id}/comments`, formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        setComment('');
                                        setCommentFiles([]);
                                        fetchTask();
                                    } finally {
                                        // setCommentLoading(false);
                                    }
                                }}
                            >
                                Отправить
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
                {/* Правая часть: приоритет, статус, фильтры, id тикета */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>Панель задачи</Typography>
                        <Box sx={{ mb: 2 }}>
                            <Chip label={task.status} color={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'warning' : 'default'} sx={{ mr: 1 }} />
                            <Chip label={task.priority} color={task.priority === 'critical' ? 'error' : task.priority === 'high' ? 'warning' : 'default'} />
                        </Box>
                        {task.assignee && <Typography>Исполнитель: {task.assignee}</Typography>}
                        {task.dueDate && <Typography>Дедлайн: {new Date(task.dueDate).toLocaleDateString()}</Typography>}
                        {task.tags && task.tags.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                                {task.tags.map(tag => <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />)}
                            </Box>
                        )}
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body2" color="text.secondary">ID задачи: {task._id}</Typography>
                        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => alert('Здесь будет привязка тикета')}>Привяза��ь тикет</Button>
                    </Paper>
                </Grid>
            </Grid>
            <Dialog open={imgDialog.open} onClose={() => setImgDialog({ open: false, src: '', alt: '' })} maxWidth="md">
                <img src={imgDialog.src} alt={imgDialog.alt} style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'block', margin: 'auto' }} />
                <Typography align="center" sx={{ p: 2 }}>{imgDialog.alt}</Typography>
            </Dialog>
        </Container>
    );
};

export default TaskDetails;
