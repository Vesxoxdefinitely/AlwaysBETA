import React, { useState } from 'react';
import { Board } from './Boards';

interface BoardListProps {
  boards: Board[];
  selectedId: string;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export default function BoardList({ boards, selectedId, onAdd, onDelete, onSelect }: BoardListProps) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input.trim());
      setInput('');
    }
  };

  const filteredBoards = boards.filter(board =>
    board.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minWidth: 220 }}>
      <h3>Доски</h3>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по доскам"
        style={{
          width: '100%',
          marginBottom: 12,
          padding: 6,
          borderRadius: 4,
          border: '1px solid #90caf9',
        }}
      />
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filteredBoards.map((board) => (
          <li key={board._id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <button
              style={{
                fontWeight: board._id === selectedId ? 700 : 400,
                background: board._id === selectedId ? '#e3f2fd' : 'white',
                border: '1px solid #90caf9',
                borderRadius: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                flex: 1,
                marginRight: 8,
              }}
              onClick={() => onSelect(board._id || '')}
            >
              {board.name}
            </button>
            <button
              style={{ color: '#d32f2f', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => onDelete(board._id || '')}
              title="Удалить доску"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 16 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Название доски"
          style={{ padding: 6, borderRadius: 4, border: '1px solid #90caf9', width: '70%' }}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        />
        <button
          onClick={handleAdd}
          style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 4, border: 'none', background: '#90caf9', color: '#fff', cursor: 'pointer' }}
        >
          +
        </button>
      </div>
    </div>
  );
}
