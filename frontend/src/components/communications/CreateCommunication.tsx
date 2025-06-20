import React, { useState, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, FormatBold, FormatItalic, InsertDriveFile, ExpandMore } from '@mui/icons-material';
import { api } from '../../utils/axios';

const CreateCommunication: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Основные поля
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('new');
    const [files, setFiles] = useState<File[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateSearch, setTemplateSearch] = useState('');
    const messageRef = useRef<HTMLInputElement | null>(null);

    // Примеры шаблонов
    // Пример структуры шаблонов: { name, text }
    const templates = [
        { name: 'Базовый ответ', text: 'Здравствуйте! Спасибо за обращение. Мы рассмотрим ваш вопрос в ближайшее время.' },
        { name: 'Взято в работу', text: 'Добрый день! Ваше обращение принято в работу.' },
        { name: 'Запрос уточнения', text: 'Уточните, пожалуйста, дополнительную информацию по вашему вопросу.' },
        { name: 'Длинный шаблон', text: 'Это очень длинный шаблон, который может содержать много текста и подробные инструкции для клиента. Здесь может быть несколько абзацев, примеры, ссылки и т.д. Всё это будет видно во всплывающей подсказке при наведении.' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Валидация обязательных полей
        if (!clientName.trim()) {
            setError('Имя клиента обязательно');
            setLoading(false);
            return;
        }

        if (!subject.trim()) {
            setError('Тема сообщения обязательна');
            setLoading(false);
            return;
        }

        if (!message.trim()) {
            setError('Текст сообщения обязателен');
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('clientName', clientName.trim());
            formData.append('clientEmail', clientEmail.trim());
            formData.append('clientPhone', clientPhone.trim());
            formData.append('subject', subject.trim());
            formData.append('message', message.trim());
            formData.append('status', status);
            files.forEach((file) => formData.append('files', file));

            const response = await api.post('/communications', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate(`/communications/${response.data._id}`);
        } catch (error: any) {
            console.error('Ошибка при создании сообщения:', error);
            setError(error.response?.data?.message || 'Ошибка при создании сообщения');
        } finally {
            setLoading(false);
        }
    };

    // Вставка markdown-тегов
    const insertMarkdown = (tag: '**' | '_') => {
        const textarea = messageRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;
        const before = message.slice(0, start);
        const selected = message.slice(start, end);
        const after = message.slice(end);
        const newValue = `${before}${tag}${selected}${tag}${after}`;
        setMessage(newValue);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + tag.length, end + tag.length);
        }, 0);
    };

    // Вставка шаблона
    const handleTemplateSelect = (template: string) => {
        setMessage(template);
        setShowTemplates(false);
        setTimeout(() => {
            messageRef.current?.focus();
        }, 0);
    };

    // Обработка файлов
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/communications')}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mr: 2 }}
                >
                    К списку сообщений
                </Button>
                <Typography variant="h4" component="h1">
                    Новое сообщение
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Информация о клиенте
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Имя клиента"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email клиента"
                                type="email"
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Телефон клиента"
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Статус</InputLabel>
                                <Select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    label="Статус"
                                >
                                    <MenuItem value="new">Новое</MenuItem>
                                    <MenuItem value="in_progress">В работе</MenuItem>
                                    <MenuItem value="resolved">Решено</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Сообщение
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Тема"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => insertMarkdown('**')}
                                    title="Жирный"
                                >
                                    <FormatBold />
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => insertMarkdown('_')}
                                    title="Курсив"
                                >
                                    <FormatItalic />
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setShowTemplates(true)}
                                    title="Шаблоны"
                                    endIcon={<ExpandMore />}
                                >
                                    Шаблоны
                                </Button>
                                <Dialog open={showTemplates} onClose={() => setShowTemplates(false)} maxWidth="sm" fullWidth>
                                    <DialogTitle>Выберите шаблон</DialogTitle>
                                    <DialogContent>
                                        <TextField
                                            fullWidth
                                            placeholder="Поиск по названию шаблона..."
                                            value={templateSearch}
                                            onChange={e => setTemplateSearch(e.target.value)}
                                            sx={{ mb: 2 }}
                                        />
                                        {templates
                                            .filter(tpl => tpl.name.toLowerCase().includes(templateSearch.toLowerCase()))
                                            .map((tpl, idx) => (
                                                <Tooltip
                                                    key={idx}
                                                    title={<span style={{ fontSize: '1.1rem', lineHeight: 1.5 }}>{tpl.text}</span>}
                                                    placement="right"
                                                    arrow
                                                    enterDelay={300}
                                                    leaveDelay={100}
                                                >
                                                    <Button
                                                        fullWidth
                                                        onClick={() => handleTemplateSelect(tpl.text)}
                                                        sx={{ justifyContent: 'flex-start', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', mb: 1 }}
                                                    >
                                                        {tpl.name}
                                                    </Button>
                                                </Tooltip>
                                            ))}
                                        {templates.filter(tpl => tpl.name.toLowerCase().includes(templateSearch.toLowerCase())).length === 0 && (
                                            <Typography variant="body2" color="text.secondary">Нет шаблонов</Typography>
                                        )}
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={() => setShowTemplates(false)}>Закрыть</Button>
                                    </DialogActions>
                                </Dialog>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    size="small"
                                    title="Прикрепить файл"
                                >
                                    <InsertDriveFile />
                                    <input
                                        type="file"
                                        hidden
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                </Button>
                                {files.length > 0 && (
                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                        {files.map(f => f.name).join(', ')}
                                    </Typography>
                                )}
                            </Box>
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                label="Текст сообщения"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                inputRef={messageRef}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/communications')}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                >
                                    {loading ? 'Создание...' : 'Создать сообщение'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default CreateCommunication; 