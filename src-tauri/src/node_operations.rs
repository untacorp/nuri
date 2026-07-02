use tauri::AppHandle;
use std::fs;
use std::path::Path;
use crate::library_service::save_book_to_library;
use crate::git_service::git_commit;
use crate::library_service::get_library;

#[tauri::command]
pub fn create_node(app: AppHandle, node_type: String, name: String, parent_path: String, custom_path: Option<String>) -> Result<bool, String> {
    let target_path = if node_type == "book" {
        custom_path.ok_or("Absolute path required for new book")?
    } else if node_type == "version" {
        let file_name = if name.ends_with(".md") { name.clone() } else { format!("{}.md", name) };
        Path::new(&parent_path).join(&file_name).to_string_lossy().to_string()
    } else {
        Path::new(&parent_path).join(&name).to_string_lossy().to_string()
    };

    let p = Path::new(&target_path);

    if (node_type == "book" || node_type == "chapter" || node_type == "part")
        && !p.exists() {
            fs::create_dir_all(p).map_err(|e| e.to_string())?;
        }

    if node_type == "book" {
        save_book_to_library(app.clone(), name.clone(), target_path.clone())?;
        git_commit(&target_path, "Initial commit: Membuat buku baru");
    } else if node_type == "chapter" || node_type == "part" || node_type == "version" {
        if node_type == "version" {
            let content = format!("# {}\n\nMulai menulis di sini...", name.replace(".md", ""));
            fs::write(p, content).map_err(|e| e.to_string())?;
        }
        
        let lib = get_library(app)?;
        let root_book = lib.iter().find(|b| target_path.starts_with(&b.path));
        
        if let Some(book) = root_book {
            let msg = match node_type.as_str() {
                "chapter" => format!("Membuat bab baru: {}", name),
                "part" => format!("Membuat bagian (part) baru: {}", name),
                "version" => format!("Membuat versi baru: {}", p.file_name().unwrap().to_str().unwrap()),
                _ => String::new()
            };
            git_commit(&book.path, &msg);
        }
    }
    
    Ok(true)
}

#[tauri::command]
pub fn rename_node(app: AppHandle, path: String, new_name: String) -> Result<bool, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("Path not found".to_string());
    }
    
    let parent = p.parent().ok_or("No parent dir")?;
    let new_path = parent.join(&new_name);
    
    fs::rename(p, &new_path).map_err(|e| e.to_string())?;
    
    let lib = get_library(app)?;
    if let Some(book) = lib.iter().find(|b| path.starts_with(&b.path)) {
        git_commit(&book.path, &format!("Mengubah nama {} menjadi {}", p.file_name().unwrap().to_str().unwrap(), new_name));
    }
    
    Ok(true)
}

#[tauri::command]
pub fn delete_node(app: AppHandle, path: String) -> Result<bool, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("Path not found".to_string());
    }
    
    let file_name = p.file_name().unwrap().to_str().unwrap().to_string();
    
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| e.to_string())?;
    } else {
        fs::remove_file(p).map_err(|e| e.to_string())?;
    }
    
    let lib = get_library(app)?;
    if let Some(book) = lib.iter().find(|b| path.starts_with(&b.path)) {
        git_commit(&book.path, &format!("Menghapus {}", file_name));
    }
    
    Ok(true)
}

#[tauri::command]
pub fn create_variation(app: AppHandle, path: String, suffix: String, hash: Option<String>) -> Result<String, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("Original file not found".to_string());
    }
    let ext = p.extension().unwrap_or_default().to_string_lossy();
    let ext_str = if ext.is_empty() { String::new() } else { format!(".{}", ext) };
    let base = p.file_stem().unwrap_or_default().to_string_lossy();
    let parent = p.parent().unwrap();
    let new_name = format!("{}_{}{}", base, suffix, ext_str);
    let new_path = parent.join(&new_name);

    let lib = get_library(app.clone())?;
    let book = lib.iter().find(|b| path.starts_with(&b.path)).ok_or("Book not found")?;

    if let Some(h) = hash {
        let content = crate::git_service::get_file_content_at_commit(app, path.clone(), h.clone())?;
        fs::write(&new_path, content).map_err(|e| e.to_string())?;
        git_commit(&book.path, &format!("Membuat variasi baru dari commit {}: {}", &h[0..7.min(h.len())], new_name));
    } else {
        fs::copy(p, &new_path).map_err(|e| e.to_string())?;
        git_commit(&book.path, &format!("Membuat variasi baru: {}", new_name));
    }

    Ok(new_path.to_string_lossy().to_string())
}
