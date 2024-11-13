# @bylo/websocket

A WebSocket client with built-in heartbeat mechanism, automatic reconnection, and message format support.

## Installation

```bash
npm install @bylo/websocket
```

## Usage

### Basic Usage

```typescript
import { WebSocket } from '@bylo/websocket'

// Recommended: Define your message types using enum starting from 2
enum MessageType {
  CHAT = 2,
  STATUS = 3,
  NOTIFICATION = 4
}

const ws = new WebSocket('ws://example.com', {
  debug: true
})

ws.onopen = () => {
  console.log('Connected')
  ws.send({ 
    type: MessageType.CHAT,
    message: 'Hello'
  })
}

ws.onmessage = (ev: MessageEvent) => {
  console.log('Received:', ev.data)
}

ws.onclose = () => {
  console.log('Disconnected')
}

ws.onerror = () => {
  console.error('Connection error')
}

// Start connection
ws.connect()

// Close connection
ws.close()
```

### Options

```typescript
interface WebSocketOptions {
  // Interval between heartbeats (default: 30000ms)
  heartbeatInterval?: number
  
  // Delay before reconnection attempts (default: 5000ms)
  reconnectionDelay?: number
  
  // Heartbeat response timeout (default: 5000ms)
  timeout?: number
  
  // Enable debug logs (default: false)
  debug?: boolean
  
  // Message format (default: MessageFormat.JSON)
  messageFormat?: MessageFormat
}

enum MessageFormat {
  JSON = 'json',
  BINARY = 'binary'
}
```

### Message Format

Messages must follow this structure:

```typescript
interface WebSocketMessage {
  type: number
  [key: string]: any
}

// Best Practice: Define your message types using enum
enum MessageType {
  // Reserved for internal use
  // PING = 0
  // PONG = 1
  
  // Start your message types from 2
  CHAT = 2,
  STATUS = 3,
  NOTIFICATION = 4
}

// Type-safe message interfaces
interface ChatMessage extends WebSocketMessage {
  type: MessageType.CHAT
  message: string
}

interface StatusMessage extends WebSocketMessage {
  type: MessageType.STATUS
  status: 'online' | 'offline'
}
```

Reserved message types:
- `0`: PING (internal heartbeat, reserved)
- `1`: PONG (internal heartbeat response, reserved)
- `≥2`: Available for custom message types (recommended to use enum)

### Advanced Usage

#### Custom Heartbeat Interval

```typescript
const ws = new WebSocket('ws://example.com', {
  heartbeatInterval: 60000,  // 60 seconds
  timeout: 10000            // 10 seconds timeout for heartbeat response
})
```

#### Binary Message Format

```typescript
const ws = new WebSocket('ws://example.com', {
  messageFormat: MessageFormat.BINARY
})

ws.onmessage = (ev: MessageEvent) => {
  // Message is automatically parsed from binary to JSON
  console.log(ev.data)
}
```

#### Automatic Reconnection

```typescript
const ws = new WebSocket('ws://example.com', {
  reconnectionDelay: 3000  // Retry connection every 3 seconds
})
```

## Features

- Automatic heartbeat mechanism
- Automatic reconnection on connection loss
- Support for JSON and binary message formats
- Debug logging
- TypeScript support
- Customizable options

## License

MIT