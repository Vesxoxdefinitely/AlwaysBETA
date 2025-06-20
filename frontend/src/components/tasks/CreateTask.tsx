import React, { useState } from 'react';
import {
    Container, Typography, Box, Paper, TextField, Button, Grid, MenuItem, Chip, InputLabel, Select, FormControl, OutlinedInput
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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

const CreateTask: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('new');
    const [author, setAuthor] = useState('');
    const [assignee, setAssignee] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('priority', priority);
            formData.append('status', status);
            formData.append('author', author);
            formData.append('assignee', assignee);
            tags.forEach(tag => formData.append('tags', tag));
            if (dueDate) formData.append('dueDate', dueDate);
            attachments.forEach(file => formData.append('attachments', file));
            await api.post('/tasks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/tasks');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при создании задачи');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Новая задача</Typography>
                <Button variant="outlined" onClick={() => navigate('/tasks')}>К списку задач</Button>
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
                            <Button variant="outlined" component="label">
                                Прикрепить файлы
                                <input type="file" hidden multiple onChange={handleFileChange} />
                            </Button>
                            {attachments.length > 0 && (
                                <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                                    {attachments.map(f => f.name).join(', ')}
                                </Typography>
                            )}
                        </Grid>
                        <Grid item xs={12}>
                            <Button type="submit" variant="contained" disabled={loading}>
                                {loading ? 'Создание...' : 'Создать задачу'}
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

export default CreateTask;
