import React, { useEffect, useState } from 'react';
import {
    Container, Typography, Box, Paper, TextField, Button, Grid, MenuItem, Chip, InputLabel, Select, FormControl, OutlinedInput, CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../utils/axios';

const priorities = [
    { value: 'low', label: 'Низкий' },
    { value: 'medium', label: 'Средний' },
    { value: 'high', label: 'Высокий' },
    { value: 'critical', label: 'Критичный' }
];

const statuses = [
    { value: 'new', label: 'Новая' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done', label: 'Завершена' },
    { value: 'archived', label: 'Архив' }
];

const EditTask: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('new');
    const [author, setAuthor] = useState('');
    const [assignee, setAssignee] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        fetchTask();
        // eslint-disable-next-line
    }, [id]);

    const fetchTask = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/tasks/${id}`);
            const t = response.data;
            setTitle(t.title);
            setDescription(t.description);
            setPriority(t.priority);
            setStatus(t.status);
            setAuthor(t.author);
            setAssignee(t.assignee || '');
            setTags(t.tags || []);
            setDueDate(t.dueDate ? t.dueDate.slice(0, 10) : '');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await api.put(`/tasks/${id}`, {
                title,
                description,
                priority,
                status,
                author,
                assignee,
                tags,
                dueDate
            });
            navigate(`/tasks/${id}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при сохранении задачи');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Container>;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Редактировать задачу</Typography>
                <Button variant="outlined" onClick={() => navigate(`/tasks/${id}`)}>К задаче</Button>
            </Box>
            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Название задачи"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Описание задачи"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                multiline
                                rows={4}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Приоритет</InputLabel>
                                <Select value={priority} onChange={e => setPriority(e.target.value)} label="Приоритет">
                                    {priorities.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Статус</InputLabel>
                                <Select value={status} onChange={e => setStatus(e.target.value)} label="Статус">
                                    {statuses.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Автор"
                                value={author}
                                onChange={e => setAuthor(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Исполнитель"
                                value={assignee}
                                onChange={e => setAssignee(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Дедлайн"
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Теги</InputLabel>
                                <Select
                                    multiple
                                    value={tags}
                                    onChange={e => setTags(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                                    input={<OutlinedInput label="Теги" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(selected as string[]).map((value) => (
                                                <Chip key={value} label={value} />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {['bug', 'feature', 'urgent', 'frontend', 'backend', 'design'].map(tag => (
                                        <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Button type="submit" variant="contained" disabled={saving}>
                                {saving ? 'Сохранение...' : 'Сохранить изменения'}
                            </Button>
                        </Grid>
                        {error && (
                            <Grid item xs={12}>
                                <Typography color="error">{error}</Typography>
                            </Grid>
                        )}
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default EditTask;
