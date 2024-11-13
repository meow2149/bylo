enum MessageType {
  PING = 0,
  PONG = 1
}

interface WebSocketOptions {
  heartbeatInterval?: number
  reconnectionDelay?: number
  timeout?: number
  debug?: boolean
  messageFormat?: 'json' | 'binary'
}

interface WebSocketMessage {
  type: number
  [key: string]: any
}

const defaultOptions: Required<WebSocketOptions> = {
  heartbeatInterval: 30 * 1000,
  reconnectionDelay: 5 * 1000,
  timeout: 5 * 1000,
  debug: false,
  messageFormat: 'json'
}

class WebSocketWithHeartbeat {
  readonly #options: Required<WebSocketOptions>
  readonly #url: string
  #webSocket: WebSocket | null = null
  #isManualClosed = false
  #heartbeatTimer: ReturnType<typeof setInterval> | undefined
  #heartbeatResponseTimer: ReturnType<typeof setTimeout> | undefined
  #reconnectionTimer: ReturnType<typeof setTimeout> | undefined

  constructor(url: string, options?: WebSocketOptions) {
    this.#options = { ...defaultOptions, ...options }
    this.#url = url.replace(/^http/, 'ws')
  }

  onopen: (ev: Event) => void = () => {}

  onmessage: (ev: MessageEvent) => void = () => {}

  onclose: (ev: CloseEvent) => void = () => {}

  onerror: (ev: Event) => void = () => {}

  send(data: WebSocketMessage) {
    if (this.#webSocket?.readyState === WebSocket.OPEN) {
      try {
        const jsonData = JSON.stringify(data)
        if (this.#options.messageFormat === 'json') {
          this.#webSocket.send(jsonData)
        } else {
          const blob = new Blob([jsonData], { type: 'application/json' })
          this.#webSocket.send(blob)
        }
        this.#debugLog('↑ Message sent:', data)
      } catch (error) {
        this.#debugLog('⚠ Message send failed:', error)
      }
    }
  }

  close() {
    this.#debugLog('✓ Manually closing connection')
    this.#isManualClosed = true
    this.#destroy()
  }

  connect() {
    this.#isManualClosed = false
    this.#connect()
  }

  #onopen = (ev: Event) => {
    this.#debugLog('✓ Connection established')
    this.onopen(ev)
    this.#heartbeat()
  }

  #onmessage = async (ev: MessageEvent) => {
    try {
      let jsonData: string
      if (this.#options.messageFormat === 'json') {
        jsonData = ev.data
      } else {
        const blob: Blob = ev.data
        jsonData = await blob.text()
      }
      const data: WebSocketMessage = JSON.parse(jsonData)
      this.#debugLog('↓ Message received:', data)
      if (data.type === MessageType.PONG && this.#heartbeatResponseTimer) {
        this.#clearHeartbeatResponseTimer()
      } else {
        this.onmessage(new MessageEvent('message', { data }))
      }
    } catch (error) {
      this.#debugLog('⚠ Message parsing failed:', error)
    }
  }

  #onclose = (ev: CloseEvent) => {
    this.#debugLog('✕ Connection closed')
    this.#destroy()
    this.onclose(ev)
    if (!this.#isManualClosed) {
      this.#reconnect()
    }
  }

  #onerror = (ev: Event) => {
    this.#debugLog('⚠ Connection error:', ev)
    this.onerror(ev)
  }

  #heartbeat = () => {
    this.#clearHeartbeatTimer()
    if (this.#webSocket?.readyState === WebSocket.OPEN) {
      this.#heartbeatTimer = setInterval(() => {
        this.send({ type: MessageType.PING })
        this.#awaitHeartbeatResponse()
      }, this.#options.heartbeatInterval)
    }
  }

  #clearHeartbeatTimer = () => {
    clearInterval(this.#heartbeatTimer)
    this.#heartbeatTimer = undefined
  }

  #awaitHeartbeatResponse = () => {
    this.#clearHeartbeatResponseTimer()
    this.#heartbeatResponseTimer = setTimeout(() => {
      this.#debugLog('⚠ Heartbeat timeout, closing connection')
      this.#webSocket?.close()
      this.#clearHeartbeatResponseTimer()
    }, this.#options.timeout)
  }

  #clearHeartbeatResponseTimer = () => {
    clearTimeout(this.#heartbeatResponseTimer)
    this.#heartbeatResponseTimer = undefined
  }

  #reconnect = () => {
    this.#clearReconnectionTimer()
    this.#reconnectionTimer = setTimeout(() => {
      this.#debugLog('↻ Attempting to reconnect')
      this.#connect()
    }, this.#options.reconnectionDelay)
  }

  #clearReconnectionTimer = () => {
    clearTimeout(this.#reconnectionTimer)
    this.#reconnectionTimer = undefined
  }

  #connect() {
    try {
      this.#destroy()
      const ws = new WebSocket(this.#url)
      ws.onopen = (ev: Event) => this.#onopen(ev)
      ws.onmessage = (ev: MessageEvent) => this.#onmessage(ev)
      ws.onclose = (ev: CloseEvent) => this.#onclose(ev)
      ws.onerror = (ev: Event) => this.#onerror(ev)
      this.#webSocket = ws
    } catch (error) {
      this.#debugLog('⚠ Connection failed:', error)
    }
  }

  #destroy = () => {
    this.#clearHeartbeatTimer()
    this.#clearReconnectionTimer()
    this.#clearHeartbeatResponseTimer()
    if (this.#webSocket?.readyState === WebSocket.OPEN) {
      this.#webSocket.close()
    }
    this.#webSocket = null
  }

  #debugLog = (...data: any[]) => {
    if (this.#options.debug) {
      const timestamp = new Date().toISOString()
      console.log(
        `%c[WebSocket][${timestamp}]`,
        'background:#2c3e50;color:#e74c3c;padding:3px 6px;border-radius:3px;font-weight:bold;',
        ...data
      )
    }
  }
}

export { WebSocketWithHeartbeat as WebSocket, type WebSocketMessage, type WebSocketOptions }
