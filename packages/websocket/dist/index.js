(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.WebSocket = {}));
})(this, (function (exports) { 'use strict';

    var MessageType;
    (function (MessageType) {
        MessageType[MessageType["PING"] = 0] = "PING";
        MessageType[MessageType["PONG"] = 1] = "PONG";
    })(MessageType || (MessageType = {}));
    var MessageFormat;
    (function (MessageFormat) {
        MessageFormat["JSON"] = "json";
        MessageFormat["BINARY"] = "binary";
    })(MessageFormat || (MessageFormat = {}));
    const defaultOptions = {
        heartbeatInterval: 30 * 1000,
        reconnectionDelay: 5 * 1000,
        timeout: 5 * 1000,
        debug: false,
        messageFormat: MessageFormat.JSON
    };
    class WebSocketWithHeartbeat {
        #options;
        #url;
        #webSocket = null;
        #isManualClosed = false;
        #heartbeatTimer;
        #heartbeatResponseTimer;
        #reconnectionTimer;
        constructor(url, options) {
            this.#options = { ...defaultOptions, ...options };
            this.#url = url.replace(/^http/, 'ws');
        }
        onopen = () => { };
        onmessage = () => { };
        onclose = () => { };
        onerror = () => { };
        send(data) {
            if (this.#webSocket?.readyState === WebSocket.OPEN) {
                try {
                    const jsonData = JSON.stringify(data);
                    if (this.#options.messageFormat === MessageFormat.JSON) {
                        this.#webSocket.send(jsonData);
                    }
                    else {
                        const blob = new Blob([jsonData], { type: 'application/json' });
                        this.#webSocket.send(blob);
                    }
                    this.#debugLog('→ Message sent:', data);
                }
                catch (error) {
                    this.#debugLog('⚠ Message send failed:', error);
                }
            }
        }
        close() {
            this.#debugLog('✓ Manually closing connection');
            this.#isManualClosed = true;
            this.#destroy();
        }
        connect() {
            this.#isManualClosed = false;
            this.#connect();
        }
        #onopen = (ev) => {
            this.#debugLog('✓ Connection established');
            this.onopen(ev);
            this.#heartbeat();
        };
        #onmessage = async (ev) => {
            try {
                let jsonData;
                if (this.#options.messageFormat === MessageFormat.JSON) {
                    jsonData = ev.data;
                }
                else {
                    const blob = ev.data;
                    jsonData = await blob.text();
                }
                const data = JSON.parse(jsonData);
                this.#debugLog('← Message received:', data);
                if (data.type === MessageType.PONG && this.#heartbeatResponseTimer) {
                    this.#clearHeartbeatResponseTimer();
                }
                else {
                    this.onmessage(new MessageEvent('message', { data }));
                }
            }
            catch (error) {
                this.#debugLog('⚠ Message parsing failed:', error);
            }
        };
        #onclose = (ev) => {
            this.#debugLog('✕ Connection closed');
            this.#destroy();
            this.onclose(ev);
            if (!this.#isManualClosed) {
                this.#reconnect();
            }
        };
        #onerror = (ev) => {
            this.#debugLog('⚠ Connection error:', ev);
            this.onerror(ev);
        };
        #heartbeat = () => {
            this.#clearHeartbeatTimer();
            if (this.#webSocket?.readyState === WebSocket.OPEN) {
                this.#heartbeatTimer = setInterval(() => {
                    this.send({ type: MessageType.PING });
                    this.#awaitHeartbeatResponse();
                }, this.#options.heartbeatInterval);
            }
        };
        #clearHeartbeatTimer = () => {
            clearInterval(this.#heartbeatTimer);
            this.#heartbeatTimer = undefined;
        };
        #awaitHeartbeatResponse = () => {
            this.#clearHeartbeatResponseTimer();
            this.#heartbeatResponseTimer = setTimeout(() => {
                this.#debugLog('⚠ Heartbeat timeout, closing connection');
                this.#webSocket?.close();
                this.#clearHeartbeatResponseTimer();
            }, this.#options.timeout);
        };
        #clearHeartbeatResponseTimer = () => {
            clearTimeout(this.#heartbeatResponseTimer);
            this.#heartbeatResponseTimer = undefined;
        };
        #reconnect = () => {
            this.#clearReconnectionTimer();
            this.#reconnectionTimer = setTimeout(() => {
                this.#debugLog('↻ Attempting to reconnect');
                this.#connect();
            }, this.#options.reconnectionDelay);
        };
        #clearReconnectionTimer = () => {
            clearTimeout(this.#reconnectionTimer);
            this.#reconnectionTimer = undefined;
        };
        #connect() {
            try {
                this.#destroy();
                const ws = new WebSocket(this.#url);
                ws.onopen = (ev) => this.#onopen(ev);
                ws.onmessage = (ev) => this.#onmessage(ev);
                ws.onclose = (ev) => this.#onclose(ev);
                ws.onerror = (ev) => this.#onerror(ev);
                this.#webSocket = ws;
            }
            catch (error) {
                this.#debugLog('⚠ Connection failed:', error);
            }
        }
        #destroy = () => {
            this.#clearHeartbeatTimer();
            this.#clearReconnectionTimer();
            this.#clearHeartbeatResponseTimer();
            if (this.#webSocket?.readyState === WebSocket.OPEN) {
                this.#webSocket.close();
            }
            this.#webSocket = null;
        };
        #debugLog = (...data) => {
            if (this.#options.debug) {
                const timestamp = new Date().toISOString();
                console.log(`%c[WebSocket][${timestamp}]`, 'background:#2c3e50;color:#e74c3c;padding:3px 6px;border-radius:3px;font-weight:bold;', ...data);
            }
        };
    }

    exports.WebSocket = WebSocketWithHeartbeat;

}));
