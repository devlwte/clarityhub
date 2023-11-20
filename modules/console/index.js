class ConsoleLogger {
    constructor() {
        this.window = {};
    }

    setWindow(id, window) {
        if (!this.window[id]) {
            this.window[id] = window;
        }
    }

    log(win, ...args) {
        if (this.window[win]) {
            this.window[win].webContents.send('console-log', ...args);
        }
    }

    error(win, ...args) {
        if (this.window[win]) {
            this.window[win].webContents.send('console-error', args);
        }
    }

    warn(win, ...args) {
        if (this.window[win]) {
            this.window[win].webContents.send('console-warn', ...args);
        }
    }

    sendToAllWindows(channel, message) {
        if (this.window) {
            this.window.webContents.send(channel, message);
        }
    }
}

module.exports = ConsoleLogger;
