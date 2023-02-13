import type { MessagePayload } from '../../types/socket'

abstract class MessageStore {
  messages: MessagePayload[] = [];

  abstract saveMessage(message: MessagePayload): void;
  abstract findMessagesForUser(userID: string): MessagePayload[];
}

class InMemoryMessageStore extends MessageStore {
  constructor() {
    super();
    this.messages = [];
  }

  saveMessage(message: MessagePayload) {
    this.messages.push(message);
  }

  findMessagesForUser(userID: string) {
    return this.messages.filter(
      ({ from, to }) => from === userID || to === userID
    );
  }
}


export { InMemoryMessageStore }