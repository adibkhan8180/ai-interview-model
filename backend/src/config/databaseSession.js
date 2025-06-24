export class InMemoryStorage {
    constructor() {
        this.sessions = new Map();
    }

    createSession(sessionId, data) {
        this.sessions.set(sessionId, {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    updateSession(sessionId, data) {
        const existing = this.sessions.get(sessionId);
        if (existing) {
            this.sessions.set(sessionId, {
                ...existing,
                ...data,
                updatedAt: new Date(),
            });
        }
    }

    deleteSession(sessionId) {
        this.sessions.delete(sessionId);
    }
}

export const storage = new InMemoryStorage();
