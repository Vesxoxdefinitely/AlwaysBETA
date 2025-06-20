import { api } from '../utils/axios';

export interface KnowledgeArticle {
  _id?: string;
  title: string;
  content: string;
  author?: { _id: string; name: string; email: string };
  createdAt?: string;
  updatedAt?: string;
}

export async function getArticles(): Promise<KnowledgeArticle[]> {
  const res = await api.get('/knowledge');
  return res.data;
}

export async function getArticle(id: string): Promise<KnowledgeArticle> {
  const res = await api.get(`/knowledge/${id}`);
  return res.data;
}

export async function createArticle(data: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
  const res = await api.post('/knowledge', data);
  return res.data;
}

export async function updateArticle(id: string, data: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
  const res = await api.put(`/knowledge/${id}`, data);
  return res.data;
}

export async function deleteArticle(id: string): Promise<void> {
  await api.delete(`/knowledge/${id}`);
}
