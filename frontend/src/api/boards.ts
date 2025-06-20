import { api } from '../utils/axios';

export interface Sticker {
  _id?: string;
  title: string;
  description: string;
  status: string;
  order?: number;
}

export interface Column {
  id: string;
  title: string;
  order?: number;
}

export interface Board {
  _id?: string;
  name: string;
  columns: Column[];
  stickers: Sticker[];
}

export async function getBoards(): Promise<Board[]> {
  const res = await api.get('/boards');
  return res.data;
}

export async function getBoard(id: string): Promise<Board> {
  const res = await api.get(`/boards/${id}`);
  return res.data;
}

export async function createBoard(data: Partial<Board>): Promise<Board> {
  const res = await api.post('/boards', data);
  return res.data;
}

export async function updateBoard(id: string, data: Partial<Board>): Promise<Board> {
  const res = await api.put(`/boards/${id}`, data);
  return res.data;
}

export async function deleteBoard(id: string): Promise<void> {
  await api.delete(`/boards/${id}`);
}
