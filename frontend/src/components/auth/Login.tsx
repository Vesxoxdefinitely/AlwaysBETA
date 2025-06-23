import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert
} from '@mui/material';
import { login } from '../../store/slices/authSlice';
import PasswordChangeModal from './PasswordChangeModal';
import { RootState, AppDispatch } from '../../store';
import { api } from '../../utils/axios';

const Login: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { loading, error, user } = useSelector((state: RootState) => state.auth);

    // Проверяем, авторизован ли пользователь при загрузке компонента
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/tickets');
        }
    }, [navigate]);

    // Обычный вход для сотрудников
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await dispatch(login(formData)).unwrap();
            if (result.user && result.user.mustChangePassword) {
                setShowPasswordModal(true);
            } else {
                navigate('/tickets');
            }
        } catch (err) {
            // Ошибка обрабатывается в slice
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminFormData, setAdminFormData] = useState({
        email: '',
        password: '',
        otp: ''
    });
    const [adminStep, setAdminStep] = useState<'login' | '2fa'>('login');
    const [adminError, setAdminError] = useState<string | null>(null);
    const [qrData, setQrData] = useState<string | null>(null);
    const [qrSecret, setQrSecret] = useState<string | null>(null);
    const [adminLoading, setAdminLoading] = useState(false);

    const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAdminFormData({
            ...adminFormData,
            [e.target.name]: e.target.value
        });
    };

    // Этап 1: Проверка email/пароля, если 2FA не настроена — показать QR, иначе — запросить OTP
    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminError(null);
        setAdminLoading(true);
        try {
            // Сначала проверяем email и пароль
            await api.post('/auth/admin/verify', {
                email: adminFormData.email,
                password: adminFormData.password
            });
            
            // Если проверка прошла успешно, получаем QR-код
            const resp = await api.get('/auth/admin/2fa/setup', { params: { email: adminFormData.email } });
            if (resp.data && resp.data.qr) {
                setQrData(resp.data.qr);
                setQrSecret(resp.data.secret);
                setAdminStep('2fa');
            } else {
                setAdminError('Ошибка генерации QR-кода');
            }
        } catch (err: any) {
            setAdminError(err?.response?.data?.message || 'Ошибка авторизации');
        } finally {
            setAdminLoading(false);
        }
    };

    // Этап 2: Отправка email, password, otp на /admin/login
    const handleAdmin2FALogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminError(null);
        setAdminLoading(true);
        try {
            const resp = await api.post('/auth/admin/login', {
                email: adminFormData.email,
                password: adminFormData.password,
                otp: adminFormData.otp
            });
            // Сохраняем токен и редиректим
            localStorage.setItem('token', resp.data.token);
            navigate('/admin-setup');
        } catch (err: any) {
            setAdminError(err?.response?.data?.message || 'Ошибка 2FA');
        } finally {
            setAdminLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(120deg, #e0eafc 0%, #cfdef3 100%)' }}>
            <Box sx={{ mt: 8 }}>
                <Paper elevation={3} sx={{ p: 4, background: 'rgba(30,32,40,0.85)', color: '#fff' }}>
                    <Typography variant="h4" component="h1" align="center" gutterBottom>
                        Войти в Always
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <PasswordChangeModal
                        open={showPasswordModal || Boolean(user && user.mustChangePassword)}
                        onSuccess={() => {
                            setShowPasswordModal(false);
                            navigate('/tickets');
                        }}
                    />
                    {!showAdminLogin ? (
                        <>
                            <form onSubmit={handleSubmit}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    margin="normal"
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Пароль"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    margin="normal"
                                    required
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    disabled={loading}
                                    sx={{ mt: 3 }}
                                >
                                    {loading ? 'Вход...' : 'Войти'}
                                </Button>
                            </form>
                            <Button
                                fullWidth
                                variant="outlined"
                                color="secondary"
                                sx={{ mt: 2 }}
                                onClick={() => setShowAdminLogin(true)}
                            >
                                Вход для администратора
                            </Button>
                        </>
                    ) : (
                        <>
                            <Typography variant="h6" align="center" sx={{ mt: 2 }}>
                                Вход для администратора
                            </Typography>
                            {adminError && (
                                <Alert severity="error" sx={{ mb: 2 }}>{adminError}</Alert>
                            )}
                            {adminStep === 'login' && (
                                <form onSubmit={handleAdminLogin}>
                                    <TextField
                                        fullWidth
                                        label="Email администратора"
                                        name="email"
                                        type="email"
                                        value={adminFormData.email}
                                        onChange={handleAdminChange}
                                        margin="normal"
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        label="Пароль администратора"
                                        name="password"
                                        type="password"
                                        value={adminFormData.password}
                                        onChange={handleAdminChange}
                                        margin="normal"
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        sx={{ mt: 3 }}
                                        disabled={adminLoading}
                                    >
                                        {adminLoading ? 'Проверка...' : 'Далее'}
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="text"
                                        color="primary"
                                        sx={{ mt: 1 }}
                                        onClick={() => setShowAdminLogin(false)}
                                    >
                                        Назад
                                    </Button>
                                </form>
                            )}
                            {adminStep === '2fa' && (
                                <form onSubmit={handleAdmin2FALogin}>
                                    {qrData && (
                                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                                            <Typography variant="body1" sx={{ mb: 1 }}>
                                                Отсканируйте QR-код в Google Authenticator или аналоге:
                                            </Typography>
                                            <img src={qrData} alt="QR для 2FA" style={{ maxWidth: 200 }} />
                                            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                                                Секрет: {qrSecret}
                                            </Typography>
                                        </Box>
                                    )}
                                    <TextField
                                        fullWidth
                                        label="Код из приложения"
                                        name="otp"
                                        type="text"
                                        value={adminFormData.otp}
                                        onChange={handleAdminChange}
                                        margin="normal"
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        sx={{ mt: 3 }}
                                        disabled={adminLoading}
                                    >
                                        {adminLoading ? 'Вход...' : 'Войти как админ'}
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="text"
                                        color="primary"
                                        sx={{ mt: 1 }}
                                        onClick={() => {
                                            setAdminStep('login');
                                            setQrData(null);
                                            setQrSecret(null);
                                            setAdminFormData({ ...adminFormData, otp: '' });
                                        }}
                                    >
                                        Назад
                                    </Button>
                                </form>
                            )}
                        </>
                    )}
                </Paper>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <img src="/logo.png" alt="Логотип" style={{ width: '50%' }} />
                </Box>
            </Box>
        </Container>
    );
};

export default Login; 