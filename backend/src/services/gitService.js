const { exec } = require('child_process');
const fs = require('fs');

const gitCommit = (bookPath, message) => {
    return new Promise((resolve) => {
        if (!fs.existsSync(bookPath)) return resolve(false);
        const path = require('path');
        const gitDir = path.join(bookPath, '.git');
        const hasGit = fs.existsSync(gitDir);
        
        const cmd = hasGit 
            ? 'git add . && git commit -m ' + JSON.stringify(message)
            : 'git init && git add . && git commit -m ' + JSON.stringify(message);
            
        exec(cmd, { cwd: bookPath }, (error, stdout, stderr) => {
            if (error) {
                // If there's nothing to commit, resolve successfully
                if (stdout.includes('nothing to commit') || stderr.includes('nothing to commit')) {
                    return resolve(true);
                }
                console.error(`[Git Error] ${error.message}`);
                return resolve(false);
            }
            console.log(`[Git Time Machine] Commit: ${message}`);
            resolve(true);
        });
    });
};

const getFileHistory = (bookPath, absolutePath) => {
    return new Promise((resolve) => {
        if (!fs.existsSync(bookPath)) return resolve([]);
        const path = require('path');
        const relativePath = path.relative(bookPath, absolutePath).replace(/\\/g, '/');
        
        // %h = short hash, %aI = ISO date, %s = commit subject
        const cmd = `git log --pretty=format:"%h|%aI|%s" -- ` + JSON.stringify(relativePath);
        
        exec(cmd, { cwd: bookPath }, (error, stdout) => {
            if (error || !stdout.trim()) return resolve([]);
            const history = stdout.trim().split('\n').map(line => {
                const [hash, date, message] = line.split('|');
                return { hash, date, message };
            });
            resolve(history);
        });
    });
};

const getFileContentAtCommit = (bookPath, absolutePath, hash) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(bookPath)) return reject(new Error("Repo not found"));
        const path = require('path');
        const relativePath = path.relative(bookPath, absolutePath).replace(/\\/g, '/');
        
        const cmd = `git show ${hash}:` + JSON.stringify(relativePath);
        exec(cmd, { cwd: bookPath }, (error, stdout) => {
            if (error) return reject(error);
            resolve(stdout);
        });
    });
};

module.exports = { gitCommit, getFileHistory, getFileContentAtCommit };
