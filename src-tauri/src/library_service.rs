use tauri::{AppHandle, Manager};
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Book {
    pub name: String,
    pub path: String,
}

fn get_library_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    }
    Ok(app_data_dir.join("library.json"))
}

#[tauri::command]
pub fn get_library(app: AppHandle) -> Result<Vec<Book>, String> {
    let path = get_library_path(&app)?;
    if !path.exists() {
        fs::write(&path, "[]").map_err(|e| e.to_string())?;
        return Ok(vec![]);
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let books: Vec<Book> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(books)
}

#[tauri::command]
pub fn save_book_to_library(app: AppHandle, name: String, absolute_path: String) -> Result<bool, String> {
    let mut books = get_library(app.clone())?;
    if books.iter().any(|b| b.path == absolute_path) {
        return Ok(false);
    }
    books.push(Book { name, path: absolute_path });
    let path = get_library_path(&app)?;
    let content = serde_json::to_string_pretty(&books).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn delete_book_from_library(app: AppHandle, absolute_path: String) -> Result<bool, String> {
    let books = get_library(app.clone())?;
    let original_len = books.len();
    let new_books: Vec<Book> = books.into_iter().filter(|b| b.path != absolute_path).collect();
    if new_books.len() == original_len {
        return Ok(false);
    }
    let path = get_library_path(&app)?;
    let content = serde_json::to_string_pretty(&new_books).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn update_book_in_library(app: AppHandle, absolute_path: String, new_name: String) -> Result<bool, String> {
    let mut books = get_library(app.clone())?;
    let mut updated = false;
    for book in books.iter_mut() {
        if book.path == absolute_path {
            book.name = new_name.clone();
            updated = true;
            break;
        }
    }
    if !updated {
        return Ok(false);
    }
    let path = get_library_path(&app)?;
    let content = serde_json::to_string_pretty(&books).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(true)
}
