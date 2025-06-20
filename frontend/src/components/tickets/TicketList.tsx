import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    TextField,
    IconButton,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Popover,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Visibility as VisibilityIcon,
    Close as CloseIcon
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

const TicketList: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    // Фильтры
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        type: ''
    });
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tickets', {
                params: {
                    search: search || undefined,
                    status: filters.status || undefined,
                    priority: filters.priority || undefined,
                    type: filters.type || undefined
                }
            });
            setTickets(response.data);
        } catch (error) {
            console.error('Ошибка при получении тикетов:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [search, filters]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
    };

    const handleViewTicket = (id: string) => {
        navigate(`/tickets/${id}`);
    };

    const handleCreateTicket = () => {
        navigate('/tickets/create');
    };

    const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setAnchorEl(null);
    };

    const handleFilterChange = (field: string) => (event: any) => {
        setFilters(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            priority: '',
            type: ''
        });
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'backlog': return 'Бэклог';
            case 'todo': return 'К выполнению';
            case 'in_progress': return 'В работе';
            case 'review': return 'На проверке';
            case 'done': return 'Выполнено';
            default: return status;
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'low': return 'Низкий';
            case 'medium': return 'Средний';
            case 'high': return 'Высокий';
            case 'critical': return 'Критический';
            default: return priority;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'task': return 'Задача';
            case 'bug': return 'Ошибка';
            case 'feature': return 'Функция';
            case 'epic': return 'Эпик';
            case 'client_request': return 'Запрос клиента';
            default: return type;
        }
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== '');

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Задачи
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateTicket}
                >
                    Создать задачу
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Поиск по названию, описанию, клиенту или ID тикета..."
                            value={search}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item>
                        <IconButton 
                            onClick={handleFilterClick}
                            color={hasActiveFilters ? "primary" : "default"}
                        >
                            <FilterListIcon />
                        </IconButton>
                    </Grid>
                </Grid>

                <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={handleFilterClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <Box sx={{ p: 2, width: 300 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Фильтры</Typography>
                            {hasActiveFilters && (
                                <Button
                                    size="small"
                                    onClick={clearFilters}
                                    startIcon={<CloseIcon />}
                                >
                                    Сбросить
                                </Button>
                            )}
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Статус</InputLabel>
                                    <Select
                                        value={filters.status}
                                        onChange={handleFilterChange('status')}
                                        label="Статус"
                                    >
                                        <MenuItem value="">Все</MenuItem>
                                        <MenuItem value="backlog">Бэклог</MenuItem>
                                        <MenuItem value="todo">К выполнению</MenuItem>
                                        <MenuItem value="in_progress">В работе</MenuItem>
                                        <MenuItem value="review">На проверке</MenuItem>
                                        <MenuItem value="done">Выполнено</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Приоритет</InputLabel>
                                    <Select
                                        value={filters.priority}
                                        onChange={handleFilterChange('priority')}
                                        label="Приоритет"
                                    >
                                        <MenuItem value="">Все</MenuItem>
                                        <MenuItem value="low">Низкий</MenuItem>
                                        <MenuItem value="medium">Средний</MenuItem>
                                        <MenuItem value="high">Высокий</MenuItem>
                                        <MenuItem value="critical">Критический</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Тип</InputLabel>
                                    <Select
                                        value={filters.type}
                                        onChange={handleFilterChange('type')}
                                        label="Тип"
                                    >
                                        <MenuItem value="">Все</MenuItem>
                                        <MenuItem value="task">Задача</MenuItem>
                                        <MenuItem value="bug">Ошибка</MenuItem>
                                        <MenuItem value="feature">Функция</MenuItem>
                                        <MenuItem value="epic">Эпик</MenuItem>
                                        <MenuItem value="client_request">Запрос клиента</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                </Popover>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Название</TableCell>
                                    <TableCell>Тип</TableCell>
                                    <TableCell>Статус</TableCell>
                                    <TableCell>Приоритет</TableCell>
                                    <TableCell>Клиент</TableCell>
                                    <TableCell>Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tickets.map((ticket) => (
                                    <TableRow key={ticket._id}>
                                        <TableCell>{ticket.ticketId}</TableCell>
                                        <TableCell>{ticket.title}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getTypeLabel(ticket.type)}
                                                size="small"
                                                sx={{
                                                    backgroundColor: typeColors[ticket.type],
                                                    color: 'white'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(ticket.status)}
                                                size="small"
                                                sx={{
                                                    backgroundColor: statusColors[ticket.status],
                                                    color: 'white'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getPriorityLabel(ticket.priority)}
                                                size="small"
                                                sx={{
                                                    backgroundColor: priorityColors[ticket.priority],
                                                    color: 'white'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {ticket.client?.name || 'Не указан'}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                onClick={() => handleViewTicket(ticket._id)}
                                                size="small"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Container>
    );
};

export default TicketList; 