const chokidar = require('chokidar');
const fs = require('fs');
const { getLibrary } = require('./libraryService');

class WatcherService {
    constructor() {
        this.watcher = null;
        this.clients = [];
    }

    init() {
        const initialPaths = getLibrary().map(b => b.path).filter(p => fs.existsSync(p));
        
        this.watcher = chokidar.watch(initialPaths, { 
            persistent: true, 
            ignoreInitial: true,
            ignored: /(^|[\/\\])\../ 
        });

        this.watcher.on('all', (event, filePath) => {
            const normalizedPath = filePath.replace(/\\/g, '/');
            
            this.clients.forEach(client => {
                if (client.readyState === 1) { 
                    if (event === 'change' && filePath.endsWith('.md')) {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        client.send(JSON.stringify({ type: 'file_update', path: normalizedPath, content }));
                    } else if (event === 'add' || event === 'unlink' || event === 'addDir' || event === 'unlinkDir') {
                        client.send(JSON.stringify({ type: 'tree_update' }));
                    }
                }
            });
        });
    }

    addClient(client) {
        this.clients.push(client);
    }

    removeClient(client) {
        this.clients = this.clients.filter(c => c !== client);
    }

    addPath(absolutePath) {
        if (this.watcher) {
            this.watcher.add(absolutePath);
        }
    }

    removePath(absolutePath) {
        if (this.watcher) {
            this.watcher.unwatch(absolutePath);
        }
    }

    broadcastTreeUpdate() {
        this.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({ type: 'tree_update' }));
            }
        });
    }
}

module.exports = new WatcherService();

