import React, { useState, useEffect } from 'react';
import { Board, Sticker as StickerType } from './Boards';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Box, Typography, IconButton, TextField, Stack, Tooltip, Fade, Paper, Button, Popover } from '@mui/material';
import PaletteIcon from './PaletteIcon';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import StickerDialog from './StickerDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const defaultColumns = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

interface Sticker extends StickerType {
  _id: string;
  status: string;
  description: string;
  color?: string;
  createdAt?: string;
  assignees?: { id: string; name: string }[];
}

interface BoardViewProps {
  board?: Board;
  stickers: Sticker[];
  onUpdateStickers: (stickers: Sticker[]) => void;
}

function StickerTextWithToggle({ text, expanded }: { text: string, expanded: boolean }) {
  const limit = 100;
  const isLong = text.length > limit;


  return (
    <Typography sx={{ flex: 1, fontSize: 16, wordBreak: 'break-word', overflowWrap: 'break-word', color: '#222' }}>
      {expanded || !isLong ? text : text.slice(0, limit) + '...'}
    </Typography>
  );
}

export default function BoardView({ board, stickers, onUpdateStickers }: BoardViewProps) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('kanban_columns');
    return saved ? JSON.parse(saved) : defaultColumns;
  });
  const [editColIdx, setEditColIdx] = useState<number | null>(null);
  const [editColValue, setEditColValue] = useState('');
  const [expandedStickers, setExpandedStickers] = useState<{ [id: string]: boolean }>({});
  const [addFormCol, setAddFormCol] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

// Открытие диалога стикера
const [openSticker, setOpenSticker] = useState<Sticker | null>(null);
const handleOpenSticker = (sticker: Sticker) => setOpenSticker(sticker);
const handleCloseSticker = () => setOpenSticker(null);
const handleSaveSticker = (data: Sticker) => {
  const updated = normalizedStickers.map((s: Sticker) => s._id === data._id ? { ...s, ...data } : s);
  setLocalStickers(updated);
  onUpdateStickers(updated);
  setOpenSticker(null);
};
  // Стикеры из localStorage если есть
  const [localStickers, setLocalStickers] = useState<Sticker[]>(() => {
    const saved = localStorage.getItem('kanban_stickers');
    return saved ? JSON.parse(saved) : [];
  });
  // Если пропсы stickers не пустые — используем их, иначе localStickers
  const stickersToUse = stickers.length ? stickers : localStickers;
  // Ensure all stickers have a status
  const normalizedStickers: Sticker[] = stickersToUse.map((s: any) => ({
    ...s,
    status: s.status || 'todo',
    description: s.description ?? '',
    _id: s._id || String(Date.now() + Math.random()),
    color: s.color || '#ffe066',
    createdAt: s.createdAt || new Date().toISOString(),
    assignees: s.assignees || [],
  }));

  const handleAdd = (colId: string) => {
    setAddFormCol(colId);
    setNewTitle('');
    setNewDesc('');
  };

  const handleAddSubmit = () => {
    if (newTitle.trim()) {
      const updated: Sticker[] = [
        ...normalizedStickers,
        { _id: String(Date.now() + Math.random()), title: newTitle.trim(), description: newDesc.trim(), status: addFormCol || 'todo' },
      ];
      setLocalStickers(updated);
      onUpdateStickers(updated);
      setAddFormCol(null);
      setNewTitle('');
      setNewDesc('');
    }
  };

  const handleDelete = (id: string) => {
    const updated = normalizedStickers.filter(s => s._id !== id);
    setLocalStickers(updated);
    onUpdateStickers(updated);
  };

  const handleEdit = (id: string) => {
    const idx = normalizedStickers.findIndex(s => s._id === id);
    setEditIdx(idx);
    setEditValue(normalizedStickers[idx].title);
    setEditDesc(normalizedStickers[idx].description || '');
  };

  const handleEditSave = () => {
    if (editIdx !== null && editValue.trim()) {
      const updated = normalizedStickers.map((s, i) => i === editIdx ? { ...s, title: editValue.trim(), description: editDesc } : s);
      setLocalStickers(updated);
      onUpdateStickers(updated);
      setEditIdx(null);
      setEditValue('');
      setEditDesc('');
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) {
      // reorder within column
      const colStickers = normalizedStickers.filter(s => s.status === source.droppableId);
      const [removed] = colStickers.splice(source.index, 1);
      colStickers.splice(destination.index, 0, removed);
      // merge with other stickers
      const newStickers = [
        ...normalizedStickers.filter(s => s.status !== source.droppableId),
        ...colStickers
      ];
      setLocalStickers(newStickers);
      onUpdateStickers(newStickers);
    } else {
      // move to another column
      const updated = normalizedStickers.map(s =>
        s._id === draggableId ? { ...s, status: destination.droppableId } : s
      );
      setLocalStickers(updated);
      onUpdateStickers(updated);
    }
  };

  // Сохраняем стикеры и колонки в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('kanban_stickers', JSON.stringify(localStickers));
  }, [localStickers]);
  useEffect(() => {
    localStorage.setItem('kanban_columns', JSON.stringify(columns));
  }, [columns]);

  // Список пользователей (заглушка)
  const users = [
    { id: '1', name: 'Иван Иванов' },
    { id: '2', name: 'Мария Смирнова' },
    { id: '3', name: 'Петр Петров' },
    { id: '4', name: 'Анна Кузнецова' },
  ];

  // Цвета для выбора
  const stickerColors = ['#ffe066', '#ffb3c6', '#a0c4ff', '#b9fbc0', '#ffd6a5'];
  const [colorAnchor, setColorAnchor] = useState<null | HTMLElement>(null);
  const [colorStickerId, setColorStickerId] = useState<string | null>(null);

  const handlePaletteClick = (event: React.MouseEvent<HTMLElement>, stickerId: string) => {
    setColorAnchor(event.currentTarget);
    setColorStickerId(stickerId);
  };
  const handleColorSelect = (color: string) => {
    if (colorStickerId) {
      const updated = normalizedStickers.map(s => s._id === colorStickerId ? { ...s, color } : s);
      setLocalStickers(updated);
      onUpdateStickers(updated);
    }
    setColorAnchor(null);
    setColorStickerId(null);
  };
  const handlePaletteClose = () => {
    setColorAnchor(null);
    setColorStickerId(null);
  };

  return (
    <Box sx={{ minWidth: 360, flex: 1, p: 2, background: '#121212' }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', minHeight: 320 }}>
          {columns.map((col: any, colIdx: number) => {
            const colStickers = normalizedStickers.filter(s => s.status === col.id);
            return (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      background: snapshot.isDraggingOver ? '#23272f' : '#181a20',
                      border: '2px dashed',
                      borderColor: snapshot.isDraggingOver ? '#90caf9' : '#23272f',
                      minWidth: 400,
                      maxWidth: 520,
                      minHeight: 260,
                      p: 2,
                      borderRadius: 3,
                      transition: 'background 0.2s, border-color 0.2s',
                      boxShadow: snapshot.isDraggingOver ? 6 : 1,
                      flex: '0 0 420px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Название колонки и плюсик */}
                    {editColIdx === colIdx ? (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <TextField
                          value={editColValue}
                          onChange={e => setEditColValue(e.target.value)}
                          size="small"
                          variant="standard"
                          sx={{ flex: 1, input: { color: '#fff', background: '#23272f' }, label: { color: '#fff' } }}
                          InputLabelProps={{ style: { color: '#fff' } }}
                          onKeyDown={e => { if (e.key === 'Enter') {
                            setColumns((cols: any[]) => cols.map((c: any, i: number) => i === colIdx ? { ...c, title: editColValue.trim() || c.title } : c));
                            setEditColIdx(null); setEditColValue('');
                          }}}
                          autoFocus
                        />
                        <IconButton color="success" onClick={() => {
                          setColumns((cols: any[]) => cols.map((c: any, i: number) => i === colIdx ? { ...c, title: editColValue.trim() || c.title } : c));
                          setEditColIdx(null); setEditColValue('');
                        }}>
                          <CheckIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => { setEditColIdx(null); setEditColValue(''); }}>
                          <CloseIcon />
                        </IconButton>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6" align="center" sx={{ flex: 1, color: '#fff', cursor: 'pointer' }} onClick={() => { setEditColIdx(colIdx); setEditColValue(col.title); }}>{col.title}</Typography>
                        <Tooltip title="Переименовать колонку">
                          <IconButton color="primary" onClick={() => { setEditColIdx(colIdx); setEditColValue(col.title); }} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                    {addFormCol === col.id ? (
                      <Box sx={{ mb: 2, background: '#23272f', borderRadius: 2, p: 2 }}>
                        <TextField
                          label="Название стикера"
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          size="small"
                          fullWidth
                          sx={{ mb: 1, input: { color: '#fff', background: '#23272f' }, label: { color: '#fff' } }}
                          InputLabelProps={{ style: { color: '#fff' } }}
                        />
                        <TextField
                          label="Текст стикера"
                          value={newDesc}
                          onChange={e => setNewDesc(e.target.value)}
                          size="small"
                          fullWidth
                          multiline
                          minRows={2}
                          sx={{ mb: 1, input: { color: '#fff', background: '#23272f' }, label: { color: '#fff' } }}
                          InputLabelProps={{ style: { color: '#fff' } }}
                        />
                        <Stack direction="row" spacing={1}>
                          <Button variant="contained" color="primary" onClick={handleAddSubmit} disabled={!newTitle.trim()}>
                            Добавить
                          </Button>
                          <Button variant="outlined" color="inherit" onClick={() => setAddFormCol(null)}>
                            Отмена
                          </Button>
                        </Stack>
                      </Box>
                    ) : (
                      <IconButton
                        color="primary"
                        size="large"
                        sx={{ mb: 2, alignSelf: 'center' }}
                        onClick={() => handleAdd(col.id)}
                      >
                        <AddIcon fontSize="large" />
                      </IconButton>
                    )}
                    {colStickers.length === 0 && (
                      <Fade in={true}>
                        <Typography align="center" sx={{ mt: 4, color: '#fff' }}>
                          Нет стикеров
                        </Typography>
                      </Fade>
                    )}
                    {colStickers.map((sticker: Sticker, idx: number) => {
                      const limit = 100;
                      const isLong = (sticker.description || '').length > limit;
                      return (
                        <Draggable key={sticker._id} draggableId={sticker._id} index={idx}>
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                mb: 2,
                                p: 0,
                                borderRadius: 2,
                                boxShadow: snapshot.isDragging ? 8 : 2,
                                background: sticker.color || '#23272f',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'box-shadow 0.2s',
                                opacity: snapshot.isDragging ? 0.95 : 1,
                                position: 'relative',
                                minHeight: 64,
                                maxWidth: 500,
                                width: '100%',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                border: '1px solid #444',
                              }}
                            >
                              <Box sx={{ px: 1, cursor: 'grab', color: '#90caf9', display: 'flex', alignItems: 'center' }}>
                                <Tooltip title="Перетащить">
                                  <DragIndicatorIcon />
                                </Tooltip>
                              </Box>
                              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 1, pl: 1 }}>
                                {/* Ответственные на шапке стикера */}
                                {sticker.assignees && sticker.assignees.length > 0 && (
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                    {sticker.assignees.map((a: any) => (
                                      <Box key={a.id} sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#23272f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, border: '2px solid #fff' }}>
                                        {a.name ? a.name[0].toUpperCase() : '?'}
                                      </Box>
                                    ))}
                                  </Stack>
                                )}
                                {editIdx !== null && normalizedStickers[editIdx]._id === sticker._id ? (
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 1 }}>
                                    <TextField
                                      label="Название"
                                      value={editValue}
                                      onChange={e => setEditValue(e.target.value)}
                                      size="small"
                                      sx={{ mb: 1, input: { color: '#fff', background: '#23272f' }, label: { color: '#fff' } }}
                                      InputLabelProps={{ style: { color: '#fff' } }}
                                    />
                                    <TextField
                                      label="Текст"
                                      value={editDesc}
                                      onChange={e => setEditDesc(e.target.value)}
                                      size="small"
                                      multiline
                                      minRows={2}
                                      sx={{ mb: 1, input: { color: '#fff', background: '#23272f' }, label: { color: '#fff' } }}
                                      InputLabelProps={{ style: { color: '#fff' } }}
                                    />
                                    <Stack direction="row" spacing={1}>
                                      <IconButton color="success" onClick={handleEditSave}>
                                        <CheckIcon />
                                      </IconButton>
                                      <IconButton color="error" onClick={() => setEditIdx(null)}>
                                        <CloseIcon />
                                      </IconButton>
                                    </Stack>
                                  </Box>
                                ) : (
                                  <>
                                    <Typography sx={{ fontWeight: 700, color: '#222', fontSize: 18, mb: 0.5 }}>
                                      {sticker.title}
                                    </Typography>
                                    <StickerTextWithToggle
                                      text={sticker.description || ''}
                                      expanded={!!expandedStickers[sticker._id]}
                                    />
                                    <Stack direction="row" spacing={1} mt={1}>
                                      <Tooltip title="Открыть подробно">
                                        <IconButton size="small" onClick={() => handleOpenSticker(sticker)} sx={{ color: '#888' }}>
                                          <OpenInFullIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Цвет стикера">
                                        <IconButton size="small" onClick={e => handlePaletteClick(e, sticker._id)} sx={{ color: '#888' }}>
                                          <PaletteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Popover
                                        open={Boolean(colorAnchor) && colorStickerId === sticker._id}
                                        anchorEl={colorAnchor}
                                        onClose={handlePaletteClose}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                        PaperProps={{ sx: { p: 1, display: 'flex', gap: 1, background: '#23272f' } }}
                                      >
                                        {stickerColors.map(color => (
                                          <Box
                                            key={color}
                                            onClick={() => handleColorSelect(color)}
                                            sx={{ width: 24, height: 24, borderRadius: '50%', background: color, cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 0 2px #000', mr: 1 }}
                                          />
                                        ))}
                                      </Popover>
                                      {isLong && (
                                        <IconButton size="small" onClick={() => setExpandedStickers(e => ({ ...e, [sticker._id]: !e[sticker._id] }))} sx={{ color: '#90caf9' }}>
                                          {expandedStickers[sticker._id] ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                      )}
                                      <Tooltip title="Редактировать">
                                        <IconButton color="primary" onClick={() => handleEdit(sticker._id)} size="small">
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Удалить">
                                        <IconButton color="error" onClick={() => handleDelete(sticker._id)} size="small">
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                  </>
                                )}
                              </Box>
                            </Paper>
                          )}
                        </Draggable>
                      );
                    })}
                  </Box>
                )}
              </Droppable>
            );
          })}
        </Box>
      </DragDropContext>
    {openSticker && (
        <StickerDialog
          open={!!openSticker}
          onClose={handleCloseSticker}
          sticker={openSticker}
          onSave={handleSaveSticker}
          users={users}
        />
      )}
    </Box>
  );
}
