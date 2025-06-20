import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import BugReportIcon from '@mui/icons-material/BugReport';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ForumIcon from '@mui/icons-material/Forum';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import ProfileDialog from '../auth/ProfileDialog';
// import Messenger from '../messenger/Messenger';

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const [openProfile, setOpenProfile] = useState(false);
const [profileState, setProfileState] = useState(() => {
    try {
        return JSON.parse(localStorage.getItem('profile') || '{}');
    } catch {
        return {};
    }
});
const handleProfileSave = (data: any) => {
    const newProfile = { ...profileState, ...data };
    setProfileState(newProfile);
    localStorage.setItem('profile', JSON.stringify(newProfile));
    setOpenProfile(false);
};
    // const [messengerOpen, setMessengerOpen] = useState(false);

    const handleLogout = () => {
        // Очистка токена/сессии
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        // Перенаправление на страницу входа
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 2, display: 'flex', alignItems: 'center' }}>
                        Always
                        <IconButton color="inherit" sx={{ ml: 1 }} onClick={() => navigate('/messenger')}
                            title="Мессенджер">
                            <ChatIcon />
                        </IconButton>
                        {/* Название организации */}
                        {(() => {
                            const token = localStorage.getItem('token');
                            if (!token) return null;
                            try {
                                const payload = JSON.parse(atob(token.split('.')[1]));
                                const orgName = payload.organizationName;
                                if (orgName) {
                                    return (
                                        <Typography variant="body1" sx={{ ml: 2, color: '#90caf9', fontWeight: 600, maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {orgName}
                                        </Typography>
                                    );
                                }
                                return null;
                            } catch {
                                return null;
                            }
                        })()}
                    </Typography>
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                        <Button color="inherit" onClick={() => navigate('/bug-tracker')} sx={{ mx: 2 }} title="Баг-трекер">
                            <BugReportIcon />
                        </Button>
                        <Button color="inherit" onClick={() => navigate('/tickets')} sx={{ mx: 2 }} title="Задачи">
                            <AssignmentIcon />
                        </Button>
                        <Button color="inherit" onClick={() => navigate('/communications')} sx={{ mx: 2 }} title="Коммуникации">
                            <ForumIcon />
                        </Button>
                        <Button color="inherit" onClick={() => navigate('/boards')} sx={{ mx: 2 }} title="Доски">
                            <DashboardIcon />
                        </Button>
                        <Button color="inherit" onClick={() => navigate('/knowledge-base')} sx={{ mx: 2 }} title="База знаний">
                            <MenuBookIcon />
                        </Button>
                    </Box>
                    {/* Показываем email пользователя, если есть токен */}
                {(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const orgName = payload.organizationName;
        return (
            <>
                <Typography variant="body1" sx={{ mx: 2, color: 'white', fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>
                    {profileState.avatar ? (
                        <img src={profileState.avatar} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', marginRight: 8, objectFit: 'cover', border: '2px solid #90caf9' }} />
                    ) : null}
                    {payload.email}{orgName ? ` (${orgName})` : ''}
                    <IconButton size="small" sx={{ ml: 1, color: '#90caf9' }} onClick={() => setOpenProfile(true)}>
                        <span className="material-icons"><svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg></span>
                    </IconButton>
                </Typography>
                <ProfileDialog
                    open={openProfile}
                    onClose={() => setOpenProfile(false)}
                    user={{
                        name: payload.email,
                        email: payload.email,
                        avatar: profileState.avatar,
                        position: profileState.position
                    }}
                    onSave={handleProfileSave}
                />
            </>
        );
    } catch {
        return null;
    }
})()}
                    <Button color="inherit" onClick={handleLogout}>
                        Выйти
                    </Button>
                </Toolbar>
            </AppBar>
            {/* <Messenger open={messengerOpen} onClose={() => setMessengerOpen(false)} /> */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;
