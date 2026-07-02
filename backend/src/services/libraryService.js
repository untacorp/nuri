const fs = require('fs');
const config = require('../config');

const getLibrary = () => {
    if (!fs.existsSync(config.LIBRARY_FILE)) {
        fs.writeFileSync(config.LIBRARY_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(config.LIBRARY_FILE, 'utf-8'));
};

const saveBookToLibrary = (name, absolutePath) => {
    const lib = getLibrary();
    if (!lib.find(b => b.path === absolutePath)) {
        lib.push({ name, path: absolutePath });
        fs.writeFileSync(config.LIBRARY_FILE, JSON.stringify(lib, null, 2));
        return true;
    }
    return false;
};

const deleteBookFromLibrary = (absolutePath) => {
    const lib = getLibrary();
    const newLib = lib.filter(b => b.path !== absolutePath);
    if (newLib.length !== lib.length) {
        fs.writeFileSync(config.LIBRARY_FILE, JSON.stringify(newLib, null, 2));
        return true;
    }
    return false;
};

const updateBookInLibrary = (absolutePath, newName) => {
    const lib = getLibrary();
    const book = lib.find(b => b.path === absolutePath);
    if (book) {
        book.name = newName;
        fs.writeFileSync(config.LIBRARY_FILE, JSON.stringify(lib, null, 2));
        return true;
    }
    return false;
};

module.exports = { getLibrary, saveBookToLibrary, deleteBookFromLibrary, updateBookInLibrary };
