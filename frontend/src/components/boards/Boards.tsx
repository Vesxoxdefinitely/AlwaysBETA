import React, { useEffect, useState } from 'react';
import BoardList from './BoardList';
import BoardView from './BoardView';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import {
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  Board as ApiBoard,
  Sticker as ApiSticker,
  Column as ApiColumn,
} from '../../api/boards';

export interface Sticker extends ApiSticker {}
export interface Board extends ApiBoard {}
export interface Column extends ApiColumn {}

export default function Boards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getBoards();
      setBoards(data);
      setSelectedId(data[0]?._id || '');
      setLoading(false);
    })();
  }, []);

  const handleAddBoard = async (name: string) => {
    const newBoard = await createBoard({ name });
    setBoards(prev => [...prev, newBoard]);
    setSelectedId(newBoard._id!);
  };

  const handleDeleteBoard = async (id: string) => {
    await deleteBoard(id);
    setBoards(prev => prev.filter(b => b._id !== id));
    if (selectedId === id && boards.length > 1) {
      const next = boards.find(b => b._id !== id);
      setSelectedId(next ? next._id! : '');
    }
  };

  const handleSelectBoard = (id: string) => setSelectedId(id);

  const handleUpdateBoard = async (boardId: string, data: Partial<Board>) => {
    const updated = await updateBoard(boardId, data);
    setBoards(prev => prev.map(b => b._id === boardId ? updated : b));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const boardIdx = boards.findIndex(b => b._id === selectedId);
    if (boardIdx === -1) return;
    const stickers = Array.from(boards[boardIdx].stickers);
    const [removed] = stickers.splice(result.source.index, 1);
    stickers.splice(result.destination.index, 0, removed);
    handleUpdateBoard(selectedId, { stickers });
  };

  const selectedBoard = boards.find(b => b._id === selectedId);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', padding: 32 }}>
      <BoardList
        boards={boards.map(b => ({ ...b, id: b._id! }))}
        selectedId={selectedId}
        onAdd={handleAddBoard}
        onDelete={handleDeleteBoard}
        onSelect={handleSelectBoard}
      />
      <DragDropContext onDragEnd={onDragEnd}>
        <BoardView
          board={selectedBoard}
          stickers={selectedBoard ? selectedBoard.stickers.map(s => ({ ...s, _id: s._id || String(Date.now() + Math.random()) })) : []}
          onUpdateStickers={stickers => selectedBoard && handleUpdateBoard(selectedBoard._id!, { stickers })}
        />
      </DragDropContext>
    </div>
  );
}
