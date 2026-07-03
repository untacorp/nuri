use tauri::AppHandle;
use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use crate::library_service::get_library;

#[derive(Serialize, Deserialize, Debug)]
pub struct TreeNode {
    name: String,
    #[serde(rename = "type")]
    node_type: String,
    path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    children: Option<Vec<TreeNode>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    cover_image: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    auto_compile: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    disabled_chapters: Option<Vec<String>>,
}

fn build_tree(dir_path: &Path, depth: usize) -> Vec<TreeNode> {
    let mut tree = Vec::new();
    if !dir_path.exists() {
        return tree;
    }
    
    let entries = match fs::read_dir(dir_path) {
        Ok(e) => e,
        Err(_) => return tree,
    };
    
    for entry in entries.filter_map(Result::ok) {
        let full_path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();
        
        if file_name.starts_with('.') {
            continue;
        }
        
        let path_str = full_path.to_string_lossy().replace("\\", "/");
        
        if full_path.is_dir() {
            let node_type = if depth == 1 {
                "part-folder"
            } else if depth >= 2 {
                "sub-folder"
            } else {
                "chapter"
            };
            
            tree.push(TreeNode {
                name: file_name,
                node_type: node_type.to_string(),
                path: path_str,
                children: Some(build_tree(&full_path, depth + 1)),
                description: None,
                cover_image: None,
                auto_compile: None,
                disabled_chapters: None,
            });
        } else if full_path.is_file() && file_name.ends_with(".md") {
            if file_name == "chapter.json" || file_name == "assembly.json" {
                continue;
            }
            let node_type = if depth == 2 {
                "version"
            } else {
                "part"
            };
            
            tree.push(TreeNode {
                name: file_name,
                node_type: node_type.to_string(),
                path: path_str,
                children: None,
                description: None,
                cover_image: None,
                auto_compile: None,
                disabled_chapters: None,
            });
        }
    }
    
    tree
}

#[derive(Serialize)]
pub struct TreeResponse {
    pub tree: Vec<TreeNode>,
}

#[tauri::command]
pub fn fetch_tree(app: AppHandle) -> Result<TreeResponse, String> {
    let lib = get_library(app)?;
    let mut tree = Vec::new();
    
    for book in lib {
        let path = Path::new(&book.path);
        if path.exists() {
            tree.push(TreeNode {
                name: book.name,
                node_type: "book".to_string(),
                path: book.path.clone(),
                children: Some(build_tree(path, 0)),
                description: book.description,
                cover_image: book.cover_image,
                auto_compile: book.auto_compile,
                disabled_chapters: book.disabled_chapters,
            });
        }
    }
    
    Ok(TreeResponse { tree })
}
