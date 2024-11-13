declare enum MessageFormat {
    JSON = "json",
    BINARY = "binary"
}
interface WebSocketOptions {
    heartbeatInterval?: number;
    reconnectionDelay?: number;
    timeout?: number;
    debug?: boolean;
    messageFormat?: MessageFormat;
}
interface WebSocketMessage {
    type: number;
    [key: string]: any;
}
declare class WebSocketWithHeartbeat {
    #private;
    constructor(url: string, options?: WebSocketOptions);
    onopen: (ev: Event) => void;
    onmessage: (ev: MessageEvent) => void;
    onclose: (ev: CloseEvent) => void;
    onerror: (ev: Event) => void;
    send(data: WebSocketMessage): void;
    close(): void;
    connect(): void;
}
export { WebSocketWithHeartbeat as WebSocket, type WebSocketMessage, type WebSocketOptions };
