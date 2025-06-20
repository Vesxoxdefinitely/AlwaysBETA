export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    avatar: string;
    mustChangePassword?: boolean;
}

export interface Client {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
}

export interface Comment {
    text: string;
    author: User;
    createdAt: Date;
    attachments?: {
        filename: string;
        path: string;
        uploadedAt: Date;
    }[];
}

export interface Attachment {
    filename: string;
    path: string;
    uploadedBy?: User;
    uploadedAt: Date;
}

export interface HistoryRecord {
    field: string;
    oldValue: any;
    newValue: any;
    changedBy?: User;
    changedAt: Date;
}

export interface CustomField {
    name: string;
    value: any;
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
}

export interface AutoAssignRule {
    condition: 'type' | 'priority' | 'client' | 'label';
    value: any;
    assignee: string;
}

export interface TimeTracking {
    estimated?: number;
    spent?: number;
    remaining?: number;
}

export interface Ticket {
    _id: string;
    ticketId: string;
    title: string;
    description: string;
    status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'task' | 'bug' | 'feature' | 'epic' | 'client_request';
    assignee?: User;
    reporter: User;
    sprint?: string;
    storyPoints?: number;
    dueDate?: Date;
    labels: string[];
    client?: Client;
    emailThread?: {
        messageId: string;
        subject: string;
        from: string;
        to: string[];
        cc: string[];
        date: Date;
        body: string;
        attachments: {
            filename: string;
            path: string;
            contentType: string;
        }[];
    }[];
    autoAssign: {
        enabled: boolean;
        rules: AutoAssignRule[];
    };
    customFields: CustomField[];
    dependencies: string[];
    timeTracking: TimeTracking;
    comments: Comment[];
    attachments: Attachment[];
    history: HistoryRecord[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export interface TicketState {
    tickets: Ticket[];
    currentTicket: Ticket | null;
    loading: boolean;
    error: string | null;
} 