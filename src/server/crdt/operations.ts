import * as Y from 'yjs';

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  clientId: number;
  clock: number;
}

export interface TransformResult {
  ops: Operation[];
  clock: number;
}

export class OperationalTransform {
  private history: Map<number, Operation[]> = new Map();
  private pendingOps: Operation[] = [];
  private clock: number = 0;

  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    const transformed1 = { ...op1 };
    const transformed2 = { ...op2 };

    if (op2.type === 'insert' && op2.position <= op1.position && op1.type === 'insert') {
      transformed1.position += op2.content?.length || 0;
    } else if (op2.type === 'insert' && op2.position < op1.position && op1.type === 'delete') {
      transformed1.position += op2.content?.length || 0;
    } else if (op2.type === 'delete' && op2.position < op1.position) {
      if (op1.type === 'insert') {
        transformed1.position = Math.max(op2.position, op1.position - (op2.length || 0));
      } else if (op1.type === 'delete') {
        transformed1.position -= Math.min(op2.length || 0, op1.position - op2.position);
      }
    }

    if (op1.type === 'insert' && op1.position <= op2.position && op2.type === 'insert') {
      transformed2.position += op1.content?.length || 0;
    } else if (op1.type === 'insert' && op1.position < op2.position && op2.type === 'delete') {
      transformed2.position = Math.max(op1.position, op2.position - (op1.content?.length || 0));
    } else if (op1.type === 'delete' && op1.position < op2.position) {
      if (op2.type === 'insert') {
        transformed2.position += op1.length || 0;
      } else if (op2.type === 'delete') {
        transformed2.position -= Math.min(op1.length || 0, op2.position - op1.position);
      }
    }

    return [transformed1, transformed2];
  }

  static transformAgainstHistory(operations: Operation[], history: Operation[]): Operation[] {
    let transformed = [...operations];

    for (const historyOp of history) {
      transformed = transformed.map(op => {
        const [, transformedOp] = OperationalTransform.transform(op, historyOp);
        return transformedOp;
      });
    }

    return transformed;
  }

  static compose(op1: Operation, op2: Operation): Operation | null {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position + (op1.content?.length || 0) === op2.position) {
        return {
          ...op1,
          content: (op1.content || '') + (op2.content || ''),
          clock: Math.max(op1.clock, op2.clock) + 1,
        };
      }
    }

    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position === op2.position) {
        return {
          ...op1,
          length: (op1.length || 0) + (op2.length || 0),
          clock: Math.max(op1.clock, op2.clock) + 1,
        };
      }
    }

    return null;
  }

  addOperation(operation: Operation): void {
    this.pendingOps.push(operation);
    this.clock = Math.max(this.clock, operation.clock + 1);

    const clientHistory = this.history.get(operation.clientId) || [];
    clientHistory.push(operation);
    this.history.set(operation.clientId, clientHistory);
  }

  getPendingOperations(): Operation[] {
    return [...this.pendingOps];
  }

  clearPending(): void {
    this.pendingOps = [];
  }

  getClock(): number {
    return this.clock;
  }

  getHistory(clientId?: number): Operation[] {
    if (clientId !== undefined) {
      return this.history.get(clientId) || [];
    }

    const allOps: Operation[] = [];
    this.history.forEach(ops => allOps.push(...ops));
    return allOps.sort((a, b) => a.clock - b.clock);
  }
}

export class CRDTDocument {
  private doc: Y.Doc;
  private text: Y.Text;
  private clientId: number;
  private pendingUpdates: Uint8Array[] = [];

  constructor(clientId: number, initialContent?: string) {
    this.doc = new Y.Doc();
    this.clientId = clientId;
    this.text = this.doc.getText('content');

    if (initialContent) {
      this.text.insert(0, initialContent);
    }

    this.doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'remote') {
        this.pendingUpdates.push(update);
      }
    });
  }

  insert(position: number, content: string): Uint8Array {
    this.text.insert(position, content);
    return Y.encodeStateAsUpdate(this.doc);
  }

  delete(position: number, length: number): Uint8Array {
    this.text.delete(position, length);
    return Y.encodeStateAsUpdate(this.doc);
  }

  applyUpdate(update: Uint8Array): void {
    Y.applyUpdate(this.doc, update, 'remote');
  }

  getContent(): string {
    return this.text.toString();
  }

  getLength(): number {
    return this.text.length;
  }

  getState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  applyRemoteUpdate(update: Uint8Array): Uint8Array {
    Y.applyUpdate(this.doc, update, 'remote');
    return Y.encodeStateAsUpdate(this.doc);
  }

  getPendingUpdates(): Uint8Array[] {
    return [...this.pendingUpdates];
  }

  clearPendingUpdates(): void {
    this.pendingUpdates = [];
  }

  destroy(): void {
    this.doc.destroy();
  }
}
