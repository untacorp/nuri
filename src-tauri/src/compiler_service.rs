use tauri::AppHandle;
use std::fs;
use std::path::Path;
use serde::Serialize;
use crate::library_service::get_library;

#[derive(Serialize)]
pub struct ChapterConfigResponse {
    config: Vec<String>,
    available_files: Vec<String>,
}

#[tauri::command]
pub fn fetch_chapter_config(app: AppHandle, path: String) -> Result<ChapterConfigResponse, String> {
    let chapter_path = Path::new(&path);
    if !chapter_path.exists() || !chapter_path.is_dir() {
        return Err("Chapter directory not found".to_string());
    }
    
    let lib = get_library(app)?;
    let is_book = lib.iter().any(|b| b.path == path);
    
    let mut available_files = Vec::new();
    let mut default_config = Vec::new();
    
    let items = fs::read_dir(chapter_path).map_err(|e| e.to_string())?;
    let mut subdirs = Vec::new();
    let mut files = Vec::new();
    
    for entry in items.filter_map(Result::ok) {
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') { continue; }
        if entry.path().is_dir() {
            subdirs.push(name);
        } else if name.ends_with(".md") && name != "chapter.json" && name != "assembly.json" {
            files.push(name);
        }
    }
    
    if is_book {
        subdirs.sort();
        available_files = subdirs.clone();
        default_config = subdirs;
    } else if !subdirs.is_empty() {
        subdirs.sort();
        for subdir in &subdirs {
            let subdir_path = chapter_path.join(subdir);
            if let Ok(subdir_items) = fs::read_dir(subdir_path) {
                let mut md_files = Vec::new();
                for entry in subdir_items.filter_map(Result::ok) {
                    let f = entry.file_name().to_string_lossy().to_string();
                    if f.ends_with(".md") {
                        md_files.push(f);
                    }
                }
                md_files.sort();
                for md in &md_files {
                    available_files.push(format!("{}/{}", subdir, md));
                }
                if !md_files.is_empty() {
                    default_config.push(format!("{}/{}", subdir, md_files[0]));
                }
            }
        }
    } else {
        files.sort();
        available_files = files.clone();
        default_config = files;
    }
    
    let assembly_path = chapter_path.join("assembly.json");
    let legacy_path = chapter_path.join("chapter.json");
    let config_path = if assembly_path.exists() { assembly_path } else { legacy_path };
    
    let mut config = default_config;
    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(config_path) {
            if let Ok(parsed) = serde_json::from_str::<Vec<String>>(&content) {
                config = parsed.into_iter().filter(|f| available_files.contains(f)).collect();
            }
        }
    }
    
    Ok(ChapterConfigResponse { config, available_files })
}

#[tauri::command]
pub fn save_chapter_config(path: String, config: Vec<String>) -> Result<bool, String> {
    let chapter_path = Path::new(&path);
    let legacy_path = chapter_path.join("chapter.json");
    let config_path = if legacy_path.exists() { legacy_path } else { chapter_path.join("assembly.json") };
    
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, content).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn compile_manuscript(app: AppHandle, path: String) -> Result<String, String> {
    let target_path = Path::new(&path);
    if !target_path.exists() {
        return Err("Path not found".to_string());
    }
    
    let lib = get_library(app)?;
    let is_book = lib.iter().any(|b| b.path == path);
    let mut compiled_text = format!("# {}\n\n", target_path.file_name().unwrap().to_string_lossy());
    
    if is_book {
        let mut chapters_to_include = Vec::new();
        let book_assembly_path = target_path.join("assembly.json");
        let legacy_book_assembly = target_path.join("chapter.json");
        let config_book_path = if book_assembly_path.exists() { book_assembly_path } else { legacy_book_assembly };
        
        let mut all_chapters = Vec::new();
        if let Ok(items) = fs::read_dir(target_path) {
            for entry in items.filter_map(Result::ok) {
                if entry.path().is_dir() && !entry.file_name().to_string_lossy().starts_with('.') {
                    all_chapters.push(entry.file_name().to_string_lossy().to_string());
                }
            }
        }
        
        if config_book_path.exists() {
            if let Ok(content) = fs::read_to_string(config_book_path) {
                if let Ok(parsed) = serde_json::from_str::<Vec<String>>(&content) {
                    chapters_to_include = parsed.into_iter().filter(|c| all_chapters.contains(c)).collect();
                }
            }
        } else {
            all_chapters.sort();
            chapters_to_include = all_chapters;
        }
        
        for chapter in chapters_to_include {
            let chapter_path = target_path.join(&chapter);
            compiled_text.push_str(&format!("## {}\n\n", chapter));
            
            let assembly_path = chapter_path.join("assembly.json");
            let legacy_path = chapter_path.join("chapter.json");
            let config_path = if assembly_path.exists() { assembly_path } else { legacy_path };
            
            let mut parts_to_include = Vec::new();
            if config_path.exists() {
                if let Ok(content) = fs::read_to_string(config_path) {
                    if let Ok(parsed) = serde_json::from_str::<Vec<String>>(&content) {
                        parts_to_include = parsed;
                    }
                }
            } else {
                let mut subdirs = Vec::new();
                let mut files = Vec::new();
                if let Ok(items) = fs::read_dir(&chapter_path) {
                    for entry in items.filter_map(Result::ok) {
                        let name = entry.file_name().to_string_lossy().to_string();
                        if name.starts_with('.') { continue; }
                        if entry.path().is_dir() {
                            subdirs.push(name);
                        } else if name.ends_with(".md") && name != "chapter.json" && name != "assembly.json" {
                            files.push(name);
                        }
                    }
                }
                
                if !subdirs.is_empty() {
                    subdirs.sort();
                    for subdir in subdirs {
                        let subdir_path = chapter_path.join(&subdir);
                        if let Ok(items) = fs::read_dir(&subdir_path) {
                            let mut md = Vec::new();
                            for entry in items.filter_map(Result::ok) {
                                let f = entry.file_name().to_string_lossy().to_string();
                                if f.ends_with(".md") { md.push(f); }
                            }
                            md.sort();
                            if !md.is_empty() {
                                parts_to_include.push(format!("{}/{}", subdir, md[0]));
                            }
                        }
                    }
                } else {
                    files.sort();
                    parts_to_include = files;
                }
            }
            
            for part in parts_to_include {
                let part_path = chapter_path.join(part);
                if part_path.exists() {
                    if let Ok(content) = fs::read_to_string(part_path) {
                        compiled_text.push_str(&content);
                        compiled_text.push_str("\n\n");
                    }
                }
            }
        }
    } else {
        let assembly_path = target_path.join("assembly.json");
        let legacy_path = target_path.join("chapter.json");
        let config_path = if assembly_path.exists() { assembly_path } else { legacy_path };
        
        let mut parts_to_include = Vec::new();
        if config_path.exists() {
            if let Ok(content) = fs::read_to_string(config_path) {
                if let Ok(parsed) = serde_json::from_str::<Vec<String>>(&content) {
                    parts_to_include = parsed;
                }
            }
        } else {
            let mut subdirs = Vec::new();
            let mut files = Vec::new();
            if let Ok(items) = fs::read_dir(target_path) {
                for entry in items.filter_map(Result::ok) {
                    let name = entry.file_name().to_string_lossy().to_string();
                    if name.starts_with('.') { continue; }
                    if entry.path().is_dir() {
                        subdirs.push(name);
                    } else if name.ends_with(".md") && name != "chapter.json" && name != "assembly.json" {
                        files.push(name);
                    }
                }
            }
            
            if !subdirs.is_empty() {
                subdirs.sort();
                for subdir in subdirs {
                    let subdir_path = target_path.join(&subdir);
                    if let Ok(items) = fs::read_dir(&subdir_path) {
                        let mut md = Vec::new();
                        for entry in items.filter_map(Result::ok) {
                            let f = entry.file_name().to_string_lossy().to_string();
                            if f.ends_with(".md") { md.push(f); }
                        }
                        md.sort();
                        if !md.is_empty() {
                            parts_to_include.push(format!("{}/{}", subdir, md[0]));
                        }
                    }
                }
            } else {
                files.sort();
                parts_to_include = files;
            }
        }
        
        for part in parts_to_include {
            let part_path = target_path.join(part);
            if part_path.exists() {
                if let Ok(content) = fs::read_to_string(part_path) {
                    compiled_text.push_str(&content);
                    compiled_text.push_str("\n\n");
                }
            }
        }
    }
    
    let out_name = format!("Kompilasi_{}.md", target_path.file_name().unwrap().to_string_lossy().replace(" ", "_"));
    let out_path = target_path.join(out_name);
    fs::write(&out_path, compiled_text).map_err(|e| e.to_string())?;
    
    Ok(out_path.to_string_lossy().to_string())
}
