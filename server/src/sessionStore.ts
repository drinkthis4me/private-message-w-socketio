import type { User } from '../../types/socket'

abstract class SessionStore {
  sessions: Map<string, User> = new Map();
  abstract findSession(id: string): User | undefined;
  abstract saveSession(id: string, session: User): void;
  abstract findAllSessions(): User[];
}

class InMemorySessionStore extends SessionStore {
  constructor() {
    super();
    this.sessions = new Map();
  }

  findSession(id: string) {
    return this.sessions.get(id);
  }

  saveSession(id: string, session: User) {
    this.sessions.set(id, session);
  }

  findAllSessions() {
    return [...this.sessions.values()];
  }

  /** Custom */
  findDuplicateName(name: string) {
    const allValue = this.findAllSessions();
    return allValue.some((v) => v.username === name);
  }
}

export { InMemorySessionStore }