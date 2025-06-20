import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Layout from './components/layout/Layout';
import TicketList from './components/tickets/TicketList';
import TicketDetails from './components/tickets/TicketDetails';
import CreateTicket from './components/tickets/CreateTicket';
import Communications from './components/communications/Communications';
import CreateCommunication from './components/communications/CreateCommunication';
import CommunicationDetails from './components/communications/CommunicationDetails';


import TaskList from './components/tasks/TaskList';
import CreateTask from './components/tasks/CreateTask';
import TaskDetails from './components/tasks/TaskDetails';
import EditTask from './components/tasks/EditTask';
import { useEffect } from 'react';
import Messenger from './components/messenger/Messenger';
import Boards from './components/boards/Boards';
import KnowledgeBase from './pages/KnowledgeBase';
import AdminSetup from './pages/AdminSetup';
// import StarBackground from './components/StarBackground';


const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#2196f3', // Blue
            light: '#64b5f6',
            dark: '#1976d2',
        },
        secondary: {
            main: '#00bcd4', // Cyan
            light: '#4dd0e1',
            dark: '#0097a7',
        },
        background: {
            default: '#1c4737', // Новый цвет фона
            paper: '#1e1e1e', // Оставляем как есть
        },
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: 'linear-gradient(45deg, #121212 30%, #1e1e1e 90%)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    background: 'linear-gradient(45deg, #44488b 30%, #00bcd4 90%)',
                    color: '#ffffff',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                        background: 'linear-gradient(45deg, #353a70 30%, #0097a7 90%)',
                    },
                    '&.MuiButton-outlined': {
                        color: '#ffffff',
                        borderColor: '#ffffff',
                        '&:hover': {
                            borderColor: '#ffffff',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                    },
                    '&.MuiButton-text': {
                        color: '#ffffff',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                    },
                    '&.Mui-disabled': {
                        background: 'linear-gradient(45deg, #666666 30%, #888888 90%)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'not-allowed',
                        '&.MuiButton-outlined': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&.MuiButton-text': {
                            color: 'rgba(255, 255, 255, 0.3)',
                        },
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    background: 'linear-gradient(45deg, #1e1e1e 30%, #2d2d2d 90%)',
                },
            },
        },
    },
});


function App() {
    useEffect(() => {
        function handleScroll() {
            const scrollY = window.scrollY || window.pageYOffset;
            const angle = 120 + Math.floor(scrollY / 200) % 60; // Ещё более плавно
            document.body.style.background = `linear-gradient(${angle}deg, #2196f3 0%, #e3f2fd 100%)`;
            document.body.style.transition = 'background 1s';
        }
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                {/* <StarBackground /> */}
                <CssBaseline />
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Navigate to="/tickets" replace />} />
                            <Route path="bug-tracker" element={<TaskList />} />
                            <Route path="bug-tracker/create" element={<CreateTask />} />
                            <Route path="bug-tracker/:id" element={<TaskDetails />} />
                            <Route path="bug-tracker/:id/edit" element={<EditTask />} />
                            <Route path="tasks/:id" element={<Navigate to="/bug-tracker/:id" replace />} />
                            <Route path="tasks/create" element={<Navigate to="/bug-tracker/create" replace />} />
                            <Route path="tasks/:id/edit" element={<Navigate to="/bug-tracker/:id/edit" replace />} />
                            <Route path="tasks" element={<Navigate to="/bug-tracker" replace />} />
                            <Route path="tickets" element={<TicketList />} />
                            <Route path="tickets/create" element={<CreateTicket />} />
                            <Route path="tickets/:id" element={<TicketDetails />} />
                            <Route path="communications" element={<Communications />} />
                            <Route path="communications/create" element={<CreateCommunication />} />
                            <Route path="communications/:id" element={<CommunicationDetails />} />
                        <Route path="messenger" element={<Messenger />} />
                        <Route path="boards" element={<Boards />} />
                        <Route path="knowledge-base" element={<KnowledgeBase />} />
                        <Route path="admin-setup" element={<AdminSetup />} />
                        </Route>
                    </Routes>
                </Router>
            </ThemeProvider>
        </Provider>
    );
}

export default App; 
