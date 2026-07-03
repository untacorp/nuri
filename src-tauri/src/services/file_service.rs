use std::fs;
use std::path::Path;
use tauri::AppHandle;
use crate::services::library_service::get_library;
use crate::services::git_service::git_commit;

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(app: AppHandle, path: String, content: String) -> Result<bool, String> {
    fs::write(&path, content).map_err(|e| e.to_string())?;
    
    // Auto-save Git commit
    if let Ok(lib) = get_library(app) {
        if let Some(book) = lib.iter().find(|b| path.starts_with(&b.path)) {
            let file_name = Path::new(&path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("file");
            let msg = format!("Auto-save: Mengedit {}", file_name);
            git_commit(&book.path, &msg);
        }
    }
    Ok(true)
}
