export interface ContactMessage {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    subject?: string;
    message: string;
    status: "UNREAD" | "READ" | "replied";
    createdAt: string;
}
