import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { Ticket } from '../../types';

interface TicketState {
    tickets: Ticket[];
    currentTicket: Ticket | null;
    loading: boolean;
    error: string | null;
}

const initialState: TicketState = {
    tickets: [],
    currentTicket: null,
    loading: false,
    error: null
};

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Async thunks
export const fetchTickets = createAsyncThunk(
    'tickets/fetchTickets',
    async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/tickets`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
);

export const fetchTicketById = createAsyncThunk(
    'tickets/fetchTicketById',
    async (id: string) => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/tickets/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
);

export const createTicket = createAsyncThunk(
    'tickets/createTicket',
    async (ticketData: Partial<Ticket>) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/tickets`, ticketData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
);

export const updateTicket = createAsyncThunk(
    'tickets/updateTicket',
    async ({ id, data }: { id: string; data: Partial<Ticket> }) => {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/tickets/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
);

export const addComment = createAsyncThunk(
    'tickets/addComment',
    async ({ ticketId, text }: { ticketId: string; text: string }) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            `${API_URL}/tickets/${ticketId}/comments`,
            { text },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    }
);

const ticketSlice = createSlice({
    name: 'tickets',
    initialState,
    reducers: {
        clearCurrentTicket: (state) => {
            state.currentTicket = null;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch tickets
            .addCase(fetchTickets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTickets.fulfilled, (state, action) => {
                state.loading = false;
                state.tickets = action.payload;
            })
            .addCase(fetchTickets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Ошибка при загрузке тикетов';
            })
            // Fetch ticket by id
            .addCase(fetchTicketById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTicketById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentTicket = action.payload;
            })
            .addCase(fetchTicketById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Ошибка при загрузке тикета';
            })
            // Create ticket
            .addCase(createTicket.fulfilled, (state, action) => {
                state.tickets.unshift(action.payload);
            })
            // Update ticket
            .addCase(updateTicket.fulfilled, (state, action) => {
                state.loading = false;
                state.tickets = state.tickets.map(ticket =>
                    ticket._id === action.payload._id ? action.payload : ticket
                );
                if (state.currentTicket?._id === action.payload._id) {
                    state.currentTicket = action.payload;
                }
            })
            // Add comment
            .addCase(addComment.fulfilled, (state, action) => {
                if (state.currentTicket?._id === action.payload._id) {
                    state.currentTicket = action.payload;
                }
            });
    }
});

export const { clearCurrentTicket, clearError } = ticketSlice.actions;
export default ticketSlice.reducer; 