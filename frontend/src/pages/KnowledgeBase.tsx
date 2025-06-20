import React, { useEffect, useState } from 'react';
import {
    Container, Typography, Box, Button, List, ListItem, ListItemText, Divider, TextField, IconButton, Paper, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { getArticles, getArticle, createArticle, updateArticle, deleteArticle, KnowledgeArticle } from '../api/knowledgeBase';
import { api } from '../utils/axios';
import ReactMde from 'react-mde';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'react-mde/lib/styles/css/react-mde-all.css';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const KnowledgeBase: React.FC = () => {
    const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
    const [selected, setSelected] = useState<KnowledgeArticle | null>(null);
    const [mode, setMode] = useState<'list' | 'view' | 'edit' | 'create'>('list');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<{ title: string; content: string }>({ title: '', content: '' });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const filteredArticles = search.length > 1
        ? articles.filter(a =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.content.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const data = await getArticles();
            setArticles(data);
        } catch {
            setError('Ошибка загрузки базы знаний');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const handleSelect = async (id: string) => {
        setLoading(true);
        try {
            const art = await getArticle(id);
            setSelected(art);
            setMode('view');
        } catch {
            setError('Ошибка загрузки статьи');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        if (!selected) return;
        setForm({ title: selected.title, content: selected.content });
        setMode('edit');
    };

    const handleCreate = () => {
        setForm({ title: '', content: '' });
        setMode('create');
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (mode === 'edit' && selected) {
                const updated = await updateArticle(selected._id!, form);
                setSelected(updated);
                setArticles(arts => arts.map(a => a._id === updated._id ? updated : a));
                setMode('view');
            } else if (mode === 'create') {
                const created = await createArticle(form);
                setArticles([created, ...articles]);
                setSelected(created);
                setMode('view');
            }
        } catch {
            setError('Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(true);
        try {
            await deleteArticle(deleteId);
            setArticles(arts => arts.filter(a => a._id !== deleteId));
            if (selected && selected._id === deleteId) {
                setSelected(null);
                setMode('list');
            }
            setDialogOpen(false);
            setDeleteId(null);
        } catch {
            setError('Ошибка удаления');
        } finally {
            setLoading(false);
        }
    };

    const renderList = () => (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">База знаний</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                    Добавить статью
                </Button>
            </Box>
            <List component={Paper}>
                {articles.map(article => (
                    <React.Fragment key={article._id}>
                        <ListItem button onClick={() => handleSelect(article._id!)}>
                            <ListItemText
                                primary={article.title}
                                secondary={article.author ? `Автор: ${article.author.name}` : ''}
                            />
                            <IconButton edge="end" onClick={e => { e.stopPropagation(); setDeleteId(article._id!); setDialogOpen(true); }}>
                                <DeleteIcon />
                            </IconButton>
                        </ListItem>
                        <Divider />
                    </React.Fragment>
                ))}
                {articles.length === 0 && <Typography sx={{ p: 2 }}>Нет статей</Typography>}
            </List>
        </Box>
    );

    const renderView = () => (
        <Box>
            <Button startIcon={<ArrowBackIcon />} onClick={() => setMode('list')} sx={{ mb: 2 }}>
                К списку
            </Button>
            <Typography variant="h5" gutterBottom>{selected?.title}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {selected?.author ? `Автор: ${selected.author.name}` : ''}
            </Typography>
            <Box sx={{ mb: 2 }}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        table: ({node, ...props}) => <table style={{borderCollapse: 'collapse', width: '100%', margin: '16px 0'}} {...props} />,
                        th: ({node, ...props}) => <th style={{border: '1px solid #555', padding: 4, background: '#23272f'}} {...props} />,
                        td: ({node, ...props}) => <td style={{border: '1px solid #555', padding: 4}} {...props} />,
                        img: ({node, ...props}) => {
                            let src = props.src || '';
                            // Если путь относительный, подставляем адрес backend
                            if (src.startsWith('/uploads/')) {
                                src = `${process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5000'}${src}`;
                            }
                            return <img style={{maxWidth: '100%', borderRadius: 4, margin: '8px 0'}} src={src} alt={props.alt || ''} />;
                        },
                        // Спо��леры :::spoiler Заголовок\n...\n:::
                        p: ({node, children, ...props}) => {
                            const text = String(children);
                            const spoilerMatch = text.match(/^:::spoiler (.+?):::([\s\S]*)$/);
                            if (spoilerMatch) {
                                return (
                                    <Accordion sx={{ my: 1 }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography>{spoilerMatch[1]}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{spoilerMatch[2]}</ReactMarkdown>
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            }
                            return <p {...props}>{children}</p>;
                        }
                    }}
                >
                    {selected?.content || ''}
                </ReactMarkdown>
            </Box>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit} sx={{ mr: 2 }}>
                Редактировать
            </Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => { setDeleteId(selected!._id!); setDialogOpen(true); }}>
                Удалить
            </Button>
        </Box>
    );

    // Загрузка изображения (заглушка, backend реализуем далее)
    // Загрузка изображения на сервер
    const uploadImageToServer = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/knowledge/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Всегда возвращаем относительный путь
        return res.data.url;
    };

    // react-mde ожидает функцию типа AsyncGenerator<string, boolean, unknown> с параметром ArrayBuffer
    const handleImageUpload = async function* (data: ArrayBuffer): AsyncGenerator<string, boolean, unknown> {
        const blob = new Blob([data]);
        const file = new File([blob], 'image.png', { type: 'image/png' });
        const url = await uploadImageToServer(file);
        yield url;
        return true;
    };

    const renderForm = () => (
        <Box component={Paper} sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => selected ? setMode('view') : setMode('list')} sx={{ mb: 2 }}>
                Назад
            </Button>
            <Typography variant="h6" gutterBottom>{mode === 'edit' ? 'Редактировать статью' : 'Новая статья'}</Typography>
            <TextField
                label="Заголовок"
                fullWidth
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                sx={{ mb: 2 }}
            />
            <Box sx={{ minHeight: 400, height: 500, width: '100%', mb: 2 }}>
                <ReactMde
                    value={form.content}
                    onChange={val => setForm(f => ({ ...f, content: val }))}
                    minEditorHeight={350}
                    maxEditorHeight={600}
                    heightUnits="px"
                    generateMarkdownPreview={markdown =>
                        Promise.resolve(<ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>)
                    }
                    childProps={{
                        writeButton: { tabIndex: -1 },
                    }}
                    paste={{ saveImage: handleImageUpload }}
                    onTabChange={() => {}}
                    selectedTab="write"
                    toolbarCommands={[['bold', 'italic', 'header', 'strikethrough'], ['link', 'quote', 'code', 'image'], ['unordered-list', 'ordered-list', 'checked-list']]}
                    commands={{
                        image: {
                            icon: () => <span>🖼️</span>,
                            execute: async ({ initialState, textApi }) => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/png, image/jpeg';
                                input.onchange = async () => {
                                    if (input.files && input.files[0]) {
                                        const file = input.files[0];
                                        const url = await uploadImageToServer(file);
                                        textApi.replaceSelection(`![](${url})`);
                                    }
                                };
                                input.click();
                            },
                        },
                    }}
                    // style удалён, размеры задаёт Box-обёртка
                />
            </Box>
            <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ mt: 2 }}>
                Сохранить
            </Button>
        </Box>
    );

    return (
        <Container maxWidth="lg" sx={{ background: '#181c24', minHeight: '100vh', borderRadius: 2 }}>
            <Box sx={{ mt: 6, display: 'flex', minHeight: 500 }}>
                {/* Sidebar: Оглавление */}
                <Box sx={{ width: 280, mr: 4, borderRight: '1px solid #333', pr: 2, position: 'relative' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h5">Оглавление</Typography>
                            <Button size="small" variant="contained" onClick={handleCreate} sx={{ minWidth: 0, px: 1, py: 0.5 }}>
                                <AddIcon fontSize="small" />
                            </Button>
                        </Box>
                        {/* Поиск */}
                        <TextField
                            size="small"
                            placeholder="Поиск..."
                            variant="outlined"
                            sx={{ background: '#23272f', borderRadius: 1 }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {/* Выпадающий список результатов */}
                        {search.length > 1 && filteredArticles.length > 0 && (
                            <Paper sx={{
                                position: 'absolute',
                                zIndex: 10,
                                width: 260,
                                mt: 5,
                                maxHeight: 300,
                                overflowY: 'auto',
                                left: '-270px', // смещение левее сайдбара
                                boxShadow: 8
                            }}>
                                <List>
                                    {filteredArticles.map(article => (
                                        <ListItem
                                            key={article._id}
                                            button
                                            onClick={() => { handleSelect(article._id!); setSearch(''); }}
                                        >
                                            <ListItemText primary={article.title} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        )}
                    </Box>
                    <List sx={{ mt: 2 }}>
                        {articles.map(article => (
                            <ListItem
                                key={article._id}
                                button
                                selected={selected?._id === article._id}
                                onClick={() => handleSelect(article._id!)}
                                sx={{ borderRadius: 1, mb: 0.5 }}
                            >
                                <ListItemText primary={article.title} />
                            </ListItem>
                        ))}
                        {articles.length === 0 && <Typography sx={{ p: 2 }}>Нет статей</Typography>}
                    </List>
                </Box>
                {/* Main content */}
                <Box sx={{ flex: 1, pl: 2 }}>
                    {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
                    {mode === 'list' && renderList()}
                    {mode === 'view' && renderView()}
                    {(mode === 'edit' || mode === 'create') && renderForm()}
                </Box>
                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                    <DialogTitle>Удалить статью?</DialogTitle>
                    <DialogContent>
                        <Typography>Вы уверены, что хотите удалить статью? Это действие необратимо.</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
                        <Button color="error" onClick={handleDelete}>Удалить</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

export default KnowledgeBase;
