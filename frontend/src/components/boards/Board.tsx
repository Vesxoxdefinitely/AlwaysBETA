import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';


type Sticker = {
    id: string;
    title: string;
    ticketId: string;
    assignee: string;
    status: string;
};

const employees = ["Иван", "Мария", "Алексей", "Ольга"];
const columns = [
    { id: "todo", title: "To Do" },
    { id: "inprogress", title: "In Progress" },
    { id: "done", title: "Done" },
];

const Board: React.FC = () => {
    const [stickers, setStickers] = useState<Sticker[]>([]);

    const handleAddSticker = () => {
        setStickers([
            ...stickers,
            {
                id: uuidv4(),
                title: "Новая стикер",
                ticketId: "",
                assignee: "",
                status: "todo",
            },
        ]);
    };

    const handleStickerChange = (id: string, field: keyof Sticker, value: string) => {
        setStickers(stickers.map(sticker =>
            sticker.id === id ? { ...sticker, [field]: value } : sticker
        ));
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;
        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId) {
            // Перемещение внутри одной колонки
            const items = Array.from(stickers.filter(s => s.status === source.droppableId));
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);
            // Обновить порядок только для этой колонки
            const newStickers = [
                ...stickers.filter(s => s.status !== source.droppableId),
                ...items
            ];
            setStickers(newStickers);
        } else {
            // Перемещение между колонками
            setStickers(stickers.map(sticker =>
                sticker.id === draggableId ? { ...sticker, status: destination.droppableId } : sticker
            ));
        }
    };

    return (
        <div>
            <h2>Доска (Канбан)</h2>
            <button onClick={handleAddSticker}>Добавить стикер</button>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', marginTop: 16 }}>
                <DragDropContext onDragEnd={handleDragEnd}>
                    {columns.map(col => (
                        <Droppable droppableId={col.id} key={col.id}>
                            {(provided: DroppableProvided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    style={{
                                        minWidth: 300,
                                        background: '#f4f5f7',
                                        borderRadius: 8,
                                        border: '1px solid #ccc',
                                        padding: 12,
                                        flex: '0 0 300px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        minHeight: 600,
                                    }}
                                >
                                    <h3 style={{ textAlign: 'center', marginBottom: 12 }}>{col.title}</h3>
                                    {stickers.filter(s => s.status === col.id).map((sticker, index) => (
                                        <Draggable key={sticker.id} draggableId={sticker.id} index={index}>
                                            {(provided: DraggableProvided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{
                                                        marginBottom: 8,
                                                        background: "#fffbe6",
                                                        border: "1px solid #f7d560",
                                                        borderRadius: 8,
                                                        padding: 12,
                                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                                        ...provided.draggableProps.style,
                                                    }}
                                                >
                                                    <input
                                                        style={{ width: "100%", marginBottom: 8 }}
                                                        value={sticker.title}
                                                        onChange={e => handleStickerChange(sticker.id, "title", e.target.value)}
                                                        placeholder="Название"
                                                    />
                                                    <input
                                                        style={{ width: "100%", marginBottom: 8 }}
                                                        value={sticker.ticketId}
                                                        onChange={e => handleStickerChange(sticker.id, "ticketId", e.target.value)}
                                                        placeholder="ID тикета"
                                                    />
                                                    <select
                                                        style={{ width: "100%" }}
                                                        value={sticker.assignee}
                                                        onChange={e => handleStickerChange(sticker.id, "assignee", e.target.value)}
                                                    >
                                                        <option value="">Назначить сотрудника</option>
                                                        {employees.map(emp => (
                                                            <option key={emp} value={emp}>{emp}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    ))}
                </DragDropContext>
            </div>
        </div>
    );
};

export default Board;