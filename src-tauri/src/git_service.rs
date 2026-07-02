use std::process::Command;
use std::path::Path;
use serde::Serialize;

#[derive(Serialize)]
pub struct GitCommitHistory {
    hash: String,
    date: String,
    message: String,
}

pub fn git_commit(book_path: &str, message: &str) -> bool {
    let path = Path::new(book_path);
    if !path.exists() {
        return false;
    }
    let git_dir = path.join(".git");
    if !git_dir.exists() {
        let _ = Command::new("git")
            .arg("init")
            .current_dir(book_path)
            .output();
    }
    let _ = Command::new("git")
        .arg("add")
        .arg(".")
        .current_dir(book_path)
        .output();

    let output = Command::new("git")
        .arg("commit")
        .arg("-m")
        .arg(message)
        .current_dir(book_path)
        .output();

    if let Ok(out) = output {
        if out.status.success() {
            return true;
        }
        let stdout = String::from_utf8_lossy(&out.stdout);
        let stderr = String::from_utf8_lossy(&out.stderr);
        if stdout.contains("nothing to commit") || stderr.contains("nothing to commit") {
            return true;
        }
    }
    false
}

#[tauri::command]
pub fn get_file_history(app: tauri::AppHandle, absolute_path: String) -> Result<Vec<GitCommitHistory>, String> {
    let lib = crate::library_service::get_library(app)?;
    let book = lib.iter().find(|b| absolute_path.starts_with(&b.path))
        .ok_or("Book not found")?;
    let book_path = &book.path;

    if !Path::new(book_path).exists() {
        return Ok(vec![]);
    }
    
    let path_diff = match pathdiff::diff_paths(&absolute_path, book_path) {
        Some(p) => p,
        None => return Ok(vec![]),
    };
    
    let output = Command::new("git")
        .arg("log")
        .arg("--pretty=format:%h|%aI|%s")
        .arg("--")
        .arg(path_diff.to_string_lossy().replace("\\", "/"))
        .current_dir(book_path)
        .output()
        .map_err(|e| e.to_string())?;
        
    if !output.status.success() {
        return Ok(vec![]);
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    if stdout.trim().is_empty() {
        return Ok(vec![]);
    }
    
    let mut history = Vec::new();
    for line in stdout.lines() {
        let parts: Vec<&str> = line.splitn(3, '|').collect();
        if parts.len() == 3 {
            history.push(GitCommitHistory {
                hash: parts[0].to_string(),
                date: parts[1].to_string(),
                message: parts[2].to_string(),
            });
        }
    }
    
    Ok(history)
}

#[tauri::command]
pub fn get_file_content_at_commit(app: tauri::AppHandle, absolute_path: String, hash: String) -> Result<String, String> {
    let lib = crate::library_service::get_library(app)?;
    let book = lib.iter().find(|b| absolute_path.starts_with(&b.path))
        .ok_or("Book not found")?;
    let book_path = &book.path;

    if !Path::new(book_path).exists() {
        return Err("Repo not found".to_string());
    }
    let path_diff = pathdiff::diff_paths(&absolute_path, book_path)
        .ok_or("Cannot diff paths")?;
        
    let relative_path = path_diff.to_string_lossy().replace("\\", "/");
    let target = format!("{}:{}", hash, relative_path);
    
    let output = Command::new("git")
        .arg("show")
        .arg(&target)
        .current_dir(book_path)
        .output()
        .map_err(|e| e.to_string())?;
        
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
