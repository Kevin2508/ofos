export interface ChatRequest {
  message: string;
}

export interface IChatPart {
  text?: string;
  functionCall?: {
    name?: string;
    args?: any;
  };
  functionResponse?: {
    name?: string;
    response?: any;
  };
}

export interface IChatMessage {
  role: 'user' | 'model' | 'function';
  parts: IChatPart[];
}
