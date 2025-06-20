import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography,
    Chip,
    IconButton,
    Paper,
    Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/axios';

interface CustomField {
    name: string;
    value: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
}

interface AutoAssignRule {
    condition: 'type' | 'priority' | 'client' | 'label';
    value: string;
    assignee: string;
}

const CreateTicket: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Основные поля
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('task');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('backlog');
    const [storyPoints, setStoryPoints] = useState<number | ''>('');
    const [dueDate, setDueDate] = useState('');

    // Клиент
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientCompany, setClientCompany] = useState('');

    // Метки
    const [labels, setLabels] = useState<string[]>([]);
    const [newLabel, setNewLabel] = useState('');

    // Автоназначение
    const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
    const [autoAssignRules, setAutoAssignRules] = useState<AutoAssignRule[]>([]);

    // Дополнительные поля
    const [customFields, setCustomFields] = useState<CustomField[]>([]);

    // Время выполнения
    const [estimatedTime, setEstimatedTime] = useState<number | ''>('');
    const [remainingTime, setRemainingTime] = useState<number | ''>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Валидация обязательных полей
        if (!title.trim()) {
            setError('Заголовок тикета обязателен');
            setLoading(false);
            return;
        }

        if (!description.trim()) {
            setError('Описание тикета обязательно');
            setLoading(false);
            return;
        }

        try {
            // Подготавливаем данные для отправки
            const ticketData: Record<string, any> = {
                title: title.trim(),
                description: description.trim(),
                type,
                priority,
                client: clientName || clientEmail || clientPhone || clientCompany ? {
                    name: clientName?.trim(),
                    email: clientEmail?.trim(),
                    phone: clientPhone?.trim(),
                    company: clientCompany?.trim()
                } : undefined,
                labels: labels.length > 0 ? labels : undefined,
                autoAssign: autoAssignEnabled ? {
                    enabled: true,
                    rules: autoAssignRules
                } : undefined,
                customFields: customFields.length > 0 ? customFields : undefined,
                timeTracking: estimatedTime ? {
                    estimated: estimatedTime,
                    remaining: estimatedTime,
                    spent: 0
                } : undefined,
                storyPoints: storyPoints || undefined,
                dueDate: dueDate || undefined
            };

            // Удаляем undefined значения
            Object.keys(ticketData).forEach(key => {
                if (ticketData[key] === undefined) {
                    delete ticketData[key];
                }
            });

            console.log('Отправляемые данные:', ticketData);

            const response = await api.post('/tickets', ticketData);
            console.log('Ответ сервера:', response.data);

            navigate(`/tickets/${response.data._id}`);
        } catch (error: any) {
            console.error('Ошибка при создании тикета:', error.response?.data || error);
            
            if (error.response?.data?.details) {
                // Если сервер вернул детали ошибок валидации
                const errorDetails = error.response.data.details;
                const errorMessages = Object.entries(errorDetails)
                    .map(([field, message]) => `${field}: ${message}`)
                    .join('\n');
                setError(errorMessages);
            } else {
                setError(error.response?.data?.message || 'Ошибка при создании тикета');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddLabel = () => {
        if (newLabel && !labels.includes(newLabel)) {
            setLabels([...labels, newLabel]);
            setNewLabel('');
        }
    };

    const handleRemoveLabel = (labelToRemove: string) => {
        setLabels(labels.filter(label => label !== labelToRemove));
    };

    const handleAddCustomField = () => {
        setCustomFields([
            ...customFields,
            { name: '', value: '', type: 'text' }
        ]);
    };

    const handleRemoveCustomField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const handleAddAutoAssignRule = () => {
        setAutoAssignRules([
            ...autoAssignRules,
            { condition: 'type', value: '', assignee: '' }
        ]);
    };

    const handleRemoveAutoAssignRule = (index: number) => {
        setAutoAssignRules(autoAssignRules.filter((_, i) => i !== index));
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/tickets')}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mr: 2 }}
                >
                    К списку задач
                </Button>
                <Typography variant="h4" component="h1">
                    Создание тикета
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Основная информация
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Название"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Описание"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Тип</InputLabel>
                                    <Select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        label="Тип"
                                    >
                                        <MenuItem value="task">Задача</MenuItem>
                                        <MenuItem value="bug">Ошибка</MenuItem>
                                        <MenuItem value="feature">Функция</MenuItem>
                                        <MenuItem value="epic">Эпик</MenuItem>
                                        <MenuItem value="client_request">Запрос клиента</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Приоритет</InputLabel>
                                    <Select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        label="Приоритет"
                                    >
                                        <MenuItem value="low">Низкий</MenuItem>
                                        <MenuItem value="medium">Средний</MenuItem>
                                        <MenuItem value="high">Высокий</MenuItem>
                                        <MenuItem value="critical">Критический</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Story Points"
                                    value={storyPoints}
                                    onChange={(e) => setStoryPoints(e.target.value ? Number(e.target.value) : '')}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Срок выполнения"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Информация о клиенте
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Имя клиента"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
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
                                <TextField
                                    fullWidth
                                    label="Компания"
                                    value={clientCompany}
                                    onChange={(e) => setClientCompany(e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Метки
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Grid container spacing={1}>
                                {labels.map((label) => (
                                    <Grid item key={label}>
                                        <Chip
                                            label={label}
                                            onDelete={() => handleRemoveLabel(label)}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                        <Grid container spacing={1}>
                            <Grid item xs>
                                <TextField
                                    fullWidth
                                    label="Новая метка"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                />
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    onClick={handleAddLabel}
                                    disabled={!newLabel}
                                >
                                    Добавить
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Автоматическое назначение
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={autoAssignEnabled}
                                    onChange={(e) => setAutoAssignEnabled(e.target.checked)}
                                />
                            }
                            label="Включить автоназначение"
                        />
                        {autoAssignEnabled && (
                            <Box sx={{ mt: 2 }}>
                                {autoAssignRules.map((rule, index) => (
                                    <Paper key={index} sx={{ p: 2, mb: 2 }}>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} sm={4}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Условие</InputLabel>
                                                    <Select
                                                        value={rule.condition}
                                                        onChange={(e) => {
                                                            const newRules = [...autoAssignRules];
                                                            newRules[index].condition = e.target.value as any;
                                                            setAutoAssignRules(newRules);
                                                        }}
                                                        label="Условие"
                                                    >
                                                        <MenuItem value="type">Тип</MenuItem>
                                                        <MenuItem value="priority">Приоритет</MenuItem>
                                                        <MenuItem value="client">Клиент</MenuItem>
                                                        <MenuItem value="label">Метка</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <TextField
                                                    fullWidth
                                                    label="Значение"
                                                    value={rule.value}
                                                    onChange={(e) => {
                                                        const newRules = [...autoAssignRules];
                                                        newRules[index].value = e.target.value;
                                                        setAutoAssignRules(newRules);
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Ответственный"
                                                    value={rule.assignee}
                                                    onChange={(e) => {
                                                        const newRules = [...autoAssignRules];
                                                        newRules[index].assignee = e.target.value;
                                                        setAutoAssignRules(newRules);
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={1}>
                                                <IconButton
                                                    onClick={() => handleRemoveAutoAssignRule(index)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                ))}
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={handleAddAutoAssignRule}
                                    variant="outlined"
                                >
                                    Добавить правило
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Дополнительные поля
                        </Typography>
                        {customFields.map((field, index) => (
                            <Paper key={index} sx={{ p: 2, mb: 2 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            fullWidth
                                            label="Название поля"
                                            value={field.name}
                                            onChange={(e) => {
                                                const newFields = [...customFields];
                                                newFields[index].name = e.target.value;
                                                setCustomFields(newFields);
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Тип поля</InputLabel>
                                            <Select
                                                value={field.type}
                                                onChange={(e) => {
                                                    const newFields = [...customFields];
                                                    newFields[index].type = e.target.value as any;
                                                    setCustomFields(newFields);
                                                }}
                                                label="Тип поля"
                                            >
                                                <MenuItem value="text">Текст</MenuItem>
                                                <MenuItem value="number">Число</MenuItem>
                                                <MenuItem value="date">Дата</MenuItem>
                                                <MenuItem value="select">Выбор</MenuItem>
                                                <MenuItem value="multiselect">Множественный выбор</MenuItem>
                                                <MenuItem value="boolean">Да/Нет</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            fullWidth
                                            label="Значение"
                                            value={field.value}
                                            onChange={(e) => {
                                                const newFields = [...customFields];
                                                newFields[index].value = e.target.value;
                                                setCustomFields(newFields);
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={1}>
                                        <IconButton
                                            onClick={() => handleRemoveCustomField(index)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}
                        <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddCustomField}
                            variant="outlined"
                        >
                            Добавить поле
                        </Button>
                    </CardContent>
                </Card>

                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Время выполнения
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Оценка времени (минуты)"
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(e.target.value ? Number(e.target.value) : '')}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Оставшееся время (минуты)"
                                    value={remainingTime}
                                    onChange={(e) => setRemainingTime(e.target.value ? Number(e.target.value) : '')}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/tickets')}
                    >
                        Отмена
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? 'Создание...' : 'Создать тикет'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default CreateTicket; 