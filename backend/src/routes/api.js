const express = require('express');
const fs = require('fs');
const path = require('path');
const { getLibrary, saveBookToLibrary, deleteBookFromLibrary, updateBookInLibrary } = require('../services/libraryService');
const { gitCommit, getFileHistory, getFileContentAtCommit } = require('../services/gitService');
const watcherService = require('../services/watcherService');

const isSubpath = (parent, child) => {
    const relative = path.relative(parent, child);
    return relative === "" || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const router = express.Router();

router.get('/tree', (req, res) => {
    const buildTree = (dirPath, depth = 0) => {
        if (!fs.existsSync(dirPath)) return [];
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        const tree = [];
        
        items.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });

        for (const item of items) {
            if (item.name.startsWith('.')) continue; // skip hidden (.git)
            const itemFullPath = path.join(dirPath, item.name);
            
            if (item.isDirectory()) {
                let type = 'chapter';
                if (depth === 1) {
                    type = 'part-folder';
                } else if (depth >= 2) {
                    type = 'sub-folder';
                }
                tree.push({
                    name: item.name,
                    type: type,
                    path: itemFullPath,
                    children: buildTree(itemFullPath, depth + 1)
                });
            } else if (item.isFile() && item.name.endsWith('.md')) {
                if (item.name === 'chapter.json' || item.name === 'assembly.json') continue;
                let type = 'part';
                if (depth === 2) {
                    type = 'version';
                }
                tree.push({
                    name: item.name,
                    type: type,
                    path: itemFullPath
                });
            }
        }
        return tree;
    };
    
    try {
        const lib = getLibrary();
        const tree = [];
        lib.forEach(book => {
            if (fs.existsSync(book.path)) {
                tree.push({
                    name: book.name,
                    type: 'book',
                    path: book.path,
                    children: buildTree(book.path, 0)
                });
            }
        });
        res.json({ tree });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/create', (req, res) => {
    const { type, parentPath, name, customPath } = req.body;
    try {
        if (type === 'book') {
            if (!customPath) return res.status(400).json({ error: "Absolute path required for new book" });
            const targetPath = customPath;
            
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }
            if (saveBookToLibrary(name, targetPath)) {
                watcherService.addPath(targetPath);
            }
            gitCommit(targetPath, 'Initial commit: Membuat buku baru');
            
        } else if (type === 'chapter') {
            const targetPath = path.join(parentPath, name);
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }
            const rootBook = getLibrary().find(b => isSubpath(b.path, targetPath));
            if(rootBook) gitCommit(rootBook.path, `Membuat bab baru: ${name}`);
            
        } else if (type === 'part') {
            // A part is now just a folder
            const targetFolder = path.join(parentPath, name);
            if (!fs.existsSync(targetFolder)) {
                fs.mkdirSync(targetFolder, { recursive: true });
            }
            
            const rootBook = getLibrary().find(b => isSubpath(b.path, targetFolder));
            if(rootBook) gitCommit(rootBook.path, `Membuat bagian (part) baru: ${name}`);
            
        } else if (type === 'version') {
            // Adding a version/variation file to a part folder
            const fileName = name.endsWith('.md') ? name : `${name}.md`;
            const targetPath = path.join(parentPath, fileName);
            fs.writeFileSync(targetPath, `# ${name.replace('.md','')}\n\nMulai menulis di sini...`, 'utf-8');
            
            const rootBook = getLibrary().find(b => isSubpath(b.path, targetPath));
            if(rootBook) gitCommit(rootBook.path, `Membuat versi baru: ${fileName}`);
        }
        watcherService.broadcastTreeUpdate();
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

router.get('/file', (req, res) => {
    const { path: fullPath } = req.query;
    if (!fullPath) return res.status(400).json({ error: "path required" });
    try {
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            res.json({ content });
        } else {
            res.status(404).json({ error: "File not found" });
        }
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

router.post('/file', (req, res) => {
    const { path: fullPath, content } = req.body;
    if (!fullPath) return res.status(400).json({ error: "path required" });
    try {
        fs.writeFileSync(fullPath, content, 'utf-8');
        
        const rootBook = getLibrary().find(b => isSubpath(b.path, fullPath));
        const fileName = path.basename(fullPath);
        if(rootBook) gitCommit(rootBook.path, `Auto-save: Mengedit ${fileName}`);
        
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

router.delete('/library', (req, res) => {
    const { path: fullPath } = req.body;
    if (deleteBookFromLibrary(fullPath)) {
        watcherService.removePath(fullPath);
        watcherService.broadcastTreeUpdate();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Book not found in index" });
    }
});

router.put('/library', (req, res) => {
    const { path: fullPath, name } = req.body;
    if (updateBookInLibrary(fullPath, name)) {
        watcherService.broadcastTreeUpdate();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Book not found" });
    }
});

router.get('/history', async (req, res) => {
    const { path: fullPath } = req.query;
    if (!fullPath) return res.status(400).json({ error: "path required" });
    try {
        const rootBook = getLibrary().find(b => isSubpath(b.path, fullPath));
        if (!rootBook) return res.status(404).json({ error: "Book not found in index" });
        const history = await getFileHistory(rootBook.path, fullPath);
        res.json({ history });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/history/content', async (req, res) => {
    const { path: fullPath, hash } = req.query;
    if (!fullPath || !hash) return res.status(400).json({ error: "path and hash required" });
    try {
        const rootBook = getLibrary().find(b => isSubpath(b.path, fullPath));
        if (!rootBook) return res.status(404).json({ error: "Book not found in index" });
        const content = await getFileContentAtCommit(rootBook.path, fullPath, hash);
        res.json({ content });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Endpoint untuk duplikasi file (Variasi)
router.post('/variation', async (req, res) => {
    const { path: fullPath, suffix, hash } = req.body;
    if (!fullPath || !suffix) return res.status(400).json({ error: "path and suffix required" });
    try {
        if (fs.existsSync(fullPath)) {
            const ext = path.extname(fullPath);
            const base = path.basename(fullPath, ext);
            const dir = path.dirname(fullPath);
            const newPath = path.join(dir, `${base}_${suffix}${ext}`);
            
            const rootBook = getLibrary().find(b => isSubpath(b.path, fullPath));
            if (!rootBook) return res.status(404).json({ error: "Book not found in index" });

            if (hash) {
                const content = await getFileContentAtCommit(rootBook.path, fullPath, hash);
                fs.writeFileSync(newPath, content, 'utf8');
                gitCommit(rootBook.path, `Membuat variasi baru dari commit ${hash.substring(0, 7)}: ${path.basename(newPath)}`);
            } else {
                fs.copyFileSync(fullPath, newPath);
                gitCommit(rootBook.path, `Membuat variasi baru: ${path.basename(newPath)}`);
            }
            
            watcherService.broadcastTreeUpdate();
            res.json({ success: true, newPath });
        } else {
            res.status(404).json({ error: "Original file not found" });
        }
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});


// GET /api/assembler/chapter
router.get('/assembler/chapter', (req, res) => {
    const { path: chapterPath } = req.query;
    if (!chapterPath) return res.status(400).json({ error: "path required" });
    try {
        if (!fs.existsSync(chapterPath) || !fs.statSync(chapterPath).isDirectory()) {
            return res.status(404).json({ error: "Chapter directory not found" });
        }
        
        const lib = getLibrary();
        const isBook = lib.some(b => b.path === chapterPath);
        
        let availableFiles = [];
        let defaultConfig = [];
        
        const items = fs.readdirSync(chapterPath, { withFileTypes: true });
        const subdirs = items.filter(item => item.isDirectory() && !item.name.startsWith('.'));
        
        if (isBook) {
            // Book-level assembly: reorder chapters
            const chapterNames = subdirs.map(s => s.name);
            availableFiles = chapterNames;
            defaultConfig = [...chapterNames].sort();
        } else if (subdirs.length > 0) {
            // Chapter-level assembly with subdirectory-based parts
            subdirs.forEach(subdir => {
                const subdirPath = path.join(chapterPath, subdir.name);
                const subdirFiles = fs.readdirSync(subdirPath);
                const mdFiles = subdirFiles
                    .filter(f => f.endsWith('.md'))
                    .map(f => `${subdir.name}/${f}`);
                availableFiles.push(...mdFiles);
            });
            
            // Sort subdirs to create defaultConfig
            subdirs.sort((a, b) => a.name.localeCompare(b.name)).forEach(subdir => {
                const subdirPath = path.join(chapterPath, subdir.name);
                const subdirFiles = fs.readdirSync(subdirPath);
                const mdFiles = subdirFiles.filter(f => f.endsWith('.md')).sort();
                if (mdFiles.length > 0) {
                    defaultConfig.push(`${subdir.name}/${mdFiles[0]}`);
                }
            });
        } else {
            // Chapter-level assembly with legacy file-based parts
            const mdFiles = items.filter(item => item.isFile() && item.name.endsWith('.md') && item.name !== 'chapter.json' && item.name !== 'assembly.json').map(item => item.name);
            availableFiles = mdFiles;
            defaultConfig = [...mdFiles].sort();
        }
        
        // Read assembly.json or chapter.json
        const assemblyPath = path.join(chapterPath, 'assembly.json');
        const legacyPath = path.join(chapterPath, 'chapter.json');
        const configPath = fs.existsSync(assemblyPath) ? assemblyPath : legacyPath;
        
        let config = [];
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            config = config.filter(f => availableFiles.includes(f));
        } else {
            config = defaultConfig;
        }
        
        res.json({ config, availableFiles });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/assembler/chapter
router.post('/assembler/chapter', (req, res) => {
    const { path: chapterPath, config } = req.body;
    if (!chapterPath || !config) return res.status(400).json({ error: "path and config required" });
    try {
        const legacyPath = path.join(chapterPath, 'chapter.json');
        const configPath = fs.existsSync(legacyPath) ? legacyPath : path.join(chapterPath, 'assembly.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/export
router.post('/export', (req, res) => {
    const { path: targetPath } = req.body;
    if (!targetPath || !fs.existsSync(targetPath)) return res.status(404).json({ error: "Path not found" });

    try {
        const lib = getLibrary();
        const isBook = lib.some(b => b.path === targetPath);

        if (isBook) {
            // Compile Book Manuscript
            let compiledText = `# ${path.basename(targetPath)}\n\n`;

            const bookAssemblyPath = path.join(targetPath, 'assembly.json');
            const legacyBookAssemblyPath = path.join(targetPath, 'chapter.json');
            const configBookPath = fs.existsSync(bookAssemblyPath) ? bookAssemblyPath : legacyBookAssemblyPath;
            
            let chaptersToInclude = [];
            const items = fs.readdirSync(targetPath, { withFileTypes: true });
            const allChapters = items
                .filter(item => item.isDirectory() && !item.name.startsWith('.'))
                .map(item => item.name);
                
            if (fs.existsSync(configBookPath)) {
                chaptersToInclude = JSON.parse(fs.readFileSync(configBookPath, 'utf8'));
                chaptersToInclude = chaptersToInclude.filter(c => allChapters.includes(c));
            } else {
                chaptersToInclude = [...allChapters].sort();
            }

            for (const chapterName of chaptersToInclude) {
                const chapterPath = path.join(targetPath, chapterName);
                compiledText += `## ${chapterName}\n\n`;

                const assemblyPath = path.join(chapterPath, 'assembly.json');
                const legacyAssemblyPath = path.join(chapterPath, 'chapter.json');
                const configPath = fs.existsSync(assemblyPath) ? assemblyPath : legacyAssemblyPath;
                
                let partsToInclude = [];

                if (fs.existsSync(configPath)) {
                    partsToInclude = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                } else {
                    const chapterItems = fs.readdirSync(chapterPath, { withFileTypes: true });
                    const chapterSubdirs = chapterItems.filter(item => item.isDirectory() && !item.name.startsWith('.'));
                    
                    if (chapterSubdirs.length > 0) {
                        chapterSubdirs.sort((a, b) => a.name.localeCompare(b.name)).forEach(subdir => {
                            const subdirPath = path.join(chapterPath, subdir.name);
                            const subdirFiles = fs.readdirSync(subdirPath);
                            const md = subdirFiles.filter(f => f.endsWith('.md')).sort();
                            if (md.length > 0) {
                                partsToInclude.push(`${subdir.name}/${md[0]}`);
                            }
                        });
                    } else {
                        const chapterFiles = fs.readdirSync(chapterPath);
                        partsToInclude = chapterFiles.filter(f => f.endsWith('.md') && f !== 'chapter.json' && f !== 'assembly.json').sort();
                    }
                }

                for (const part of partsToInclude) {
                    const partPath = path.join(chapterPath, part);
                    if (fs.existsSync(partPath)) {
                        const content = fs.readFileSync(partPath, 'utf8');
                        compiledText += `${content}\n\n`;
                    }
                }
            }

            const outPath = path.join(targetPath, `Manuscript_${path.basename(targetPath).replace(/\s+/g, '_')}.md`);
            fs.writeFileSync(outPath, compiledText);
            watcherService.broadcastTreeUpdate();
            res.json({ success: true, compiledPath: outPath, type: 'book' });
        } else {
            // Compile Chapter
            const chapterName = path.basename(targetPath);
            let compiledText = `# ${chapterName}\n\n`;

            const assemblyPath = path.join(targetPath, 'assembly.json');
            const legacyAssemblyPath = path.join(targetPath, 'chapter.json');
            const configPath = fs.existsSync(assemblyPath) ? assemblyPath : legacyAssemblyPath;
            
            let partsToInclude = [];

            if (fs.existsSync(configPath)) {
                partsToInclude = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } else {
                const chapterItems = fs.readdirSync(targetPath, { withFileTypes: true });
                const chapterSubdirs = chapterItems.filter(item => item.isDirectory() && !item.name.startsWith('.'));
                
                if (chapterSubdirs.length > 0) {
                    chapterSubdirs.sort((a, b) => a.name.localeCompare(b.name)).forEach(subdir => {
                        const subdirPath = path.join(targetPath, subdir.name);
                        const subdirFiles = fs.readdirSync(subdirPath);
                        const md = subdirFiles.filter(f => f.endsWith('.md')).sort();
                        if (md.length > 0) {
                            partsToInclude.push(`${subdir.name}/${md[0]}`);
                        }
                    });
                } else {
                    const chapterFiles = fs.readdirSync(targetPath);
                    partsToInclude = chapterFiles.filter(f => f.endsWith('.md') && f !== 'chapter.json' && f !== 'assembly.json').sort();
                }
            }

            for (const part of partsToInclude) {
                const partPath = path.join(targetPath, part);
                if (fs.existsSync(partPath)) {
                    const content = fs.readFileSync(partPath, 'utf8');
                    compiledText += `${content}\n\n`;
                }
            }

            const outPath = path.join(targetPath, `${chapterName}_Lengkap.md`);
            fs.writeFileSync(outPath, compiledText);
            watcherService.broadcastTreeUpdate();
            res.json({ success: true, compiledPath: outPath, type: 'chapter' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/rename
router.post('/rename', (req, res) => {
    const { path: targetPath, newName } = req.body;
    if (!targetPath || !newName) return res.status(400).json({ error: "path and newName required" });
    if (!fs.existsSync(targetPath)) return res.status(404).json({ error: "Path not found" });

    try {
        const dir = path.dirname(targetPath);
        const ext = path.extname(targetPath);
        // Keep the extension if it is a file
        let finalName = newName;
        if (fs.statSync(targetPath).isFile()) {
            if (!newName.endsWith(ext)) {
                finalName = newName + ext;
            }
        }
        const destinationPath = path.join(dir, finalName);
        
        if (fs.existsSync(destinationPath)) {
            return res.status(400).json({ error: "A file or folder with that name already exists" });
        }

        fs.renameSync(targetPath, destinationPath);

        const rootBook = getLibrary().find(b => isSubpath(b.path, targetPath));
        if (rootBook) {
            gitCommit(rootBook.path, `Ubah nama ${path.basename(targetPath)} menjadi ${finalName}`);
        }

        watcherService.broadcastTreeUpdate();
        res.json({ success: true, newPath: destinationPath });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/delete
router.post('/delete', (req, res) => {
    const { path: targetPath } = req.body;
    if (!targetPath) return res.status(400).json({ error: "path required" });
    if (!fs.existsSync(targetPath)) return res.status(404).json({ error: "Path not found" });

    try {
        const rootBook = getLibrary().find(b => isSubpath(b.path, targetPath));
        const itemName = path.basename(targetPath);

        // Recursive delete folder or file
        fs.rmSync(targetPath, { recursive: true, force: true });

        if (rootBook) {
            gitCommit(rootBook.path, `Hapus ${itemName}`);
        }

        watcherService.broadcastTreeUpdate();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
