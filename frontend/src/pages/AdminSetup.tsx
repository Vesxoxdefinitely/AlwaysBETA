import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, TextField, Button, List, ListItem, ListItemText, IconButton, Paper, Divider, Snackbar, Alert } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { api } from '../utils/axios';

const AdminSetup: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [org, setOrg] = useState<any>(null);
    const [orgName, setOrgName] = useState('');
    const [orgEmail, setOrgEmail] = useState('');
    const [editName, setEditName] = useState(false);
    const [employeeEmail, setEmployeeEmail] = useState('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [newOrgEmployees, setNewOrgEmployees] = useState<string[]>([]);
    const [newOrgEmail, setNewOrgEmail] = useState('');
    const [creatingOrg, setCreatingOrg] = useState(false);

    // Получить данные текущего пользователя и организации
    // Получение пользователя и организации при загрузке страницы
    useEffect(() => {
        const fetchUserAndOrg = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userRes = await api.get(`/auth/user/${payload.userId}`);
                setUser(userRes.data.user);
                if (userRes.data.user.organization) {
                    const orgId = userRes.data.user.organization;
                    const orgRes = await api.get(`/org/${orgId}`);
                    setOrg(orgRes.data);
                    setOrgName(orgRes.data.name);
                    // Получить сотрудников
                    const empRes = await api.get(`/org/${orgId}/employees`);
                    setEmployees(empRes.data);
                } else {
                    setOrg(null);
                    setOrgName('');
                    setEmployees([]);
                }
            } catch (err) {
                setSnackbar({ open: true, message: 'Ошибка загрузки данных организации', severity: 'error' });
            }
        };
        fetchUserAndOrg();
    }, []);

    // После создания организации обновлять пользователя и организацию
    const refreshUserAndOrg = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userRes = await api.get(`/auth/user/${payload.userId}`);
            setUser(userRes.data.user);
            if (userRes.data.user.organization) {
                const orgId = userRes.data.user.organization;
                const orgRes = await api.get(`/org/${orgId}`);
                setOrg(orgRes.data);
                setOrgName(orgRes.data.name);
                const empRes = await api.get(`/org/${orgId}/employees`);
                setEmployees(empRes.data);
            } else {
                setOrg(null);
                setOrgName('');
                setEmployees([]);
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Ошибка обновления данных организации', severity: 'error' });
        }
    };

    // Создание новой организации
    const handleCreateOrg = async () => {
        setCreatingOrg(true);
        try {
            const res = await api.post('/org/register', {
                orgName,
                orgEmail
            });
            setSnackbar({ open: true, message: 'Организация создана', severity: 'success' });
            // После создания организации сразу получить организацию по orgId из ответа
            if (res.data.orgId) {
                const orgRes = await api.get(`/org/${res.data.orgId}`);
                setOrg(orgRes.data);
                setOrgName(orgRes.data.name);
                // Обновить сотрудников
                const empRes = await api.get(`/org/${res.data.orgId}/employees`);
                setEmployees(empRes.data);
                // Обновить пол��зователя (organization)
                const token = localStorage.getItem('token');
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const userRes = await api.get(`/auth/user/${payload.userId}`);
                    setUser(userRes.data.user);
                }
            }
            // Не очищаем orgName вручную — org и orgName обновятся автоматически
        } catch (err: any) {
            setSnackbar({ open: true, message: err?.response?.data?.message || 'Ошибка создания организации', severity: 'error' });
        } finally {
            setCreatingOrg(false);
        }
    };

    const handleNameSave = async () => {
        try {
            const res = await api.put(`/org/${org._id}`, { name: orgName });
            setOrg(res.data);
            setEditName(false);
            setSnackbar({ open: true, message: 'Название обновлено', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Ошибка обновления названия', severity: 'error' });
        }
    };

    const handleAddEmployee = async () => {
        try {
            const res = await api.post(`/org/${org._id}/employees`, { email: employeeEmail });
            setGeneratedPassword(res.data.password);
            setEmployeeEmail('');
            // Обновить список сотрудников
            const empRes = await api.get(`/org/${org._id}/employees`);
            setEmployees(empRes.data);
            setSnackbar({ open: true, message: 'Сотрудник добавлен', severity: 'success' });
        } catch (err: any) {
            setSnackbar({ open: true, message: err?.response?.data?.message || 'Ошибка добавления сотрудника', severity: 'error' });
        }
    };

    // Добавить email сотрудника при создании организации
    const handleAddNewOrgEmployee = () => {
        if (newOrgEmail && !newOrgEmployees.includes(newOrgEmail)) {
            setNewOrgEmployees([...newOrgEmployees, newOrgEmail]);
            setNewOrgEmail('');
        }
    };
    const handleRemoveNewOrgEmployee = (email: string) => {
        setNewOrgEmployees(newOrgEmployees.filter(e => e !== email));
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" gutterBottom>
                        Настройка платформы для организации
                    </Typography>
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ mr: 2, color: '#2196f3' }}>
                                {user.email}
                            </Typography>
                            <Button variant="outlined" color="error" onClick={() => {
                                localStorage.removeItem('token');
                                window.location.reload();
                            }}>
                                Выйти
                            </Button>
                        </Box>
                    )}
                </Box>
                {/* Если нет организации — форма создания */}
                {user && !org && (
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Создать организацию</Typography>
                        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                            Администратор: <b>{user.email || '—'}</b>
                        </Typography>
                        <TextField
                            label="Название организации"
                            value={orgName}
                            onChange={e => setOrgName(e.target.value)}
                            fullWidth
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            label="Рабочий email организации"
                            value={orgEmail}
                            onChange={e => setOrgEmail(e.target.value)}
                            fullWidth
                            sx={{ mb: 2 }}
                        />
                                                <Button
                            variant="contained"
                            onClick={handleCreateOrg}
                            disabled={creatingOrg || !orgName || !user.email}
                            sx={{ mt: 2 }}
                        >
                            Создать организацию
                        </Button>
                    </Paper>
                )}
                {/* Если организация есть — стандартная настройка */}
                {org && (
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ mr: 2 }}>ID организации:</Typography>
                            <Typography variant="body1" sx={{ mr: 1 }}>{org._id}</Typography>
                            <IconButton size="small" onClick={() => {navigator.clipboard.writeText(org._id); setSnackbar({ open: true, message: 'ID скопирован', severity: 'success' });}}>
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ mr: 2 }}>Название:</Typography>
                            {editName ? (
                                <>
                                    <TextField value={orgName} onChange={e => setOrgName(e.target.value)} size="small" sx={{ mr: 1 }} />
                                    <Button onClick={handleNameSave} variant="contained" size="small" sx={{ mr: 1 }}>Сохранить</Button>
                                    <Button onClick={() => { setOrgName(org.name); setEditName(false); }} size="small">Отмена</Button>
                                </>
                            ) : (
                                <>
                                    <Typography variant="body1" sx={{ mr: 1 }}>{org.name}</Typography>
                                    <Button onClick={() => setEditName(true)} size="small">Изменить</Button>
                                </>
                            )}
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>Добавить сотрудника</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <TextField
                                label="Email сотрудника"
                                value={employeeEmail}
                                onChange={e => setEmployeeEmail(e.target.value)}
                                size="small"
                                sx={{ mr: 2 }}
                            />
                            <Button variant="contained" onClick={handleAddEmployee}>Добавить</Button>
                        </Box>
                        {generatedPassword && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Одноразовый пароль для сотрудника: <b>{generatedPassword}</b>
                            </Alert>
                        )}
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>Сотрудники</Typography>
                        <List>
                            {employees.map(emp => (
                                <ListItem key={emp._id || emp.email}>
                                    <ListItemText primary={emp.email} secondary={emp.name !== emp.email ? emp.name : ''} />
                                </ListItem>
                            ))}
                            {employees.length === 0 && <Typography sx={{ p: 2 }}>Нет сотрудников</Typography>}
                        </List>
                    </Paper>
                )}
                {!user && <Alert severity="info">Загрузка данных пользователя...</Alert>}
            </Box>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminSetup;
