import React, { useState, useEffect } from 'react';
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
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    Email as EmailIcon,
    Phone as PhoneIcon
} from '@mui/icons-material';
import { api } from '../../utils/axios';
import { useNavigate } from 'react-router-dom';

interface Communication {
    _id: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    subject: string;
    message: string;
    status: 'new' | 'in_progress' | 'resolved';
    createdAt: string;
    updatedAt: string;
}

const Communications: React.FC = () => {
    const [communications, setCommunications] = useState<Communication[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const fetchCommunications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/communications');
            setCommunications(response.data);
        } catch (error) {
            console.error('Ошибка при получении коммуникаций:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunications();
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
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

    const handleCreateCommunication = () => {
        navigate('/communications/create');
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Диалоги
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateCommunication}
                >
                    Новое сообщение
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Поиск по клиенту, теме или сообщению..."
                        value={search}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                    />
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Клиент</TableCell>
                                    <TableCell>Тема</TableCell>
                                    <TableCell>Статус</TableCell>
                                    <TableCell>Дата</TableCell>
                                    <TableCell>Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {communications
                                    .filter((communication) => {
                                        const q = search.trim().toLowerCase();
                                        if (!q) return true;
                                        return (
                                            communication.clientName?.toLowerCase().includes(q) ||
                                            communication.clientEmail?.toLowerCase().includes(q) ||
                                            communication.subject?.toLowerCase().includes(q) ||
                                            communication.message?.toLowerCase().includes(q)
                                        );
                                    })
                                    .map((communication) => (
                                        <TableRow key={communication._id}>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2">{communication.clientName}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                        <EmailIcon fontSize="small" color="action" />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {communication.clientEmail}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                        <PhoneIcon fontSize="small" color="action" />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {communication.clientPhone}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{communication.subject}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getStatusLabel(communication.status)}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: getStatusColor(communication.status),
                                                        color: 'white'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(communication.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => navigate(`/communications/${communication._id}`)}>
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

export default Communications; 