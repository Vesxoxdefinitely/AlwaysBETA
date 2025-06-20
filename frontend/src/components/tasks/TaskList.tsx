import React, { useEffect, useState } from 'react';
import {
    Container, Typography, Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
    createdAt: string;
}

const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tasks');
            setTasks(response.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    БАГ-ТРЕКЕР
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/bug-tracker/create')}>
                    Новый баг-репорт
                </Button>
            </Box>
            <Paper sx={{ p: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Название</TableCell>
                                    <TableCell>Статус</TableCell>
                                    <TableCell>Приоритет</TableCell>
                                    <TableCell>Исполнитель</TableCell>
                                    <TableCell>Дедлайн</TableCell>
                                    <TableCell>Теги</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tasks.map((task) => (
                                    <TableRow
                                        key={task._id}
                                        hover
                                        onClick={() => navigate(`/bug-tracker/${task._id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>{task.title}</TableCell>
                                        <TableCell>
                                            <Chip label={task.status} color={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'warning' : 'default'} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={task.priority} color={task.priority === 'critical' ? 'error' : task.priority === 'high' ? 'warning' : 'default'} />
                                        </TableCell>
                                        <TableCell>{task.assignee || '-'}</TableCell>
                                        <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell>
                                            {task.tags && task.tags.length > 0 ? task.tags.map(tag => <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />) : '-'}
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

export default TaskList;
