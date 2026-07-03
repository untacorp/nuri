use tauri::AppHandle;
use std::fs;
use std::path::Path;
use crate::services::library_service::save_book_to_library;
use crate::services::git_service::git_commit;
use crate::services::library_service::get_library;

#[derive(PartialEq)]
enum NodeType {
    Book,
    Chapter,
    Part,
    Version,
    Unknown,
}

impl From<&str> for NodeType {
    fn from(s: &str) -> Self {
        match s {
            "book" => NodeType::Book,
            "chapter" => NodeType::Chapter,
            "part" => NodeType::Part,
            "version" => NodeType::Version,
            _ => NodeType::Unknown,
        }
    }
}

#[tauri::command]
pub fn create_node(
    app: AppHandle, 
    node_type: String, 
    name: String, 
    parent_path: String, 
    custom_path: Option<String>,
    description: Option<String>,
    cover_image: Option<String>,
    auto_compile: Option<bool>,
    disabled_chapters: Option<Vec<String>>
) -> Result<bool, String> {
    let n_type = NodeType::from(node_type.as_str());

    let target_path = match n_type {
        NodeType::Book => {
            custom_path.ok_or("Absolute path required for new book")?
        },
        NodeType::Version => {
            let file_name = if name.ends_with(".md") { name.clone() } else { format!("{}.md", name) };
            Path::new(&parent_path).join(&file_name).to_string_lossy().to_string()
        },
        _ => {
            Path::new(&parent_path).join(&name).to_string_lossy().to_string()
        }
    };

    let p = Path::new(&target_path);

    if (n_type == NodeType::Book || n_type == NodeType::Chapter || n_type == NodeType::Part) && !p.exists() {
        fs::create_dir_all(p).map_err(|e| e.to_string())?;
    }

    match n_type {
        NodeType::Book => {
            save_book_to_library(
                app.clone(), 
                name.clone(), 
                target_path.clone(), 
                description, 
                cover_image,
                auto_compile,
                disabled_chapters
            )?;
            git_commit(&target_path, "Initial commit: Membuat buku baru");
            crate::services::watcher_service::watch_new_path(&app, &target_path);
        },
        NodeType::Chapter | NodeType::Part | NodeType::Version => {
            if n_type == NodeType::Version {
                let content = format!("# {}\n\n", name.replace(".md", ""));
                fs::write(p, content).map_err(|e| e.to_string())?;
            }
            
            let lib = get_library(app)?;
            let root_book = lib.iter().find(|b| target_path.starts_with(&b.path));
            
            if let Some(book) = root_book {
                let filename = p.file_name().and_then(|f| f.to_str()).unwrap_or(&name);
                let msg = match n_type {
                    NodeType::Chapter => format!("Membuat bab baru: {}", name),
                    NodeType::Part => format!("Membuat bagian (part) baru: {}", name),
                    NodeType::Version => format!("Membuat versi baru: {}", filename),
                    _ => String::new()
                };
                git_commit(&book.path, &msg);
            }
        },
        NodeType::Unknown => return Err("Invalid node type".to_string()),
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
        let old_name = p.file_name().and_then(|f| f.to_str()).unwrap_or("Unknown");
        git_commit(&book.path, &format!("Mengubah nama {} menjadi {}", old_name, new_name));
    }
    
    Ok(true)
}

#[tauri::command]
pub fn delete_node(app: AppHandle, path: String) -> Result<bool, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("Path not found".to_string());
    }
    
    let file_name = p.file_name().and_then(|f| f.to_str()).unwrap_or("Unknown").to_string();
    
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
    let parent = p.parent().ok_or("No parent dir")?;
    let new_name = format!("{}_{}{}", base, suffix, ext_str);
    let new_path = parent.join(&new_name);

    let lib = get_library(app.clone())?;
    let book = lib.iter().find(|b| path.starts_with(&b.path)).ok_or("Book not found")?;

    if let Some(h) = hash {
        let content = crate::services::git_service::get_file_content_at_commit(app, path.clone(), h.clone())?;
        fs::write(&new_path, content).map_err(|e| e.to_string())?;
        git_commit(&book.path, &format!("Membuat variasi baru dari commit {}: {}", &h[0..7.min(h.len())], new_name));
    } else {
        fs::copy(p, &new_path).map_err(|e| e.to_string())?;
        git_commit(&book.path, &format!("Membuat variasi baru: {}", new_name));
    }

    Ok(new_path.to_string_lossy().to_string())
}
