use tauri::{AppHandle, Manager, Emitter};
use notify::{Watcher, RecursiveMode, EventKind, event::ModifyKind};
use std::sync::{Arc, Mutex};
use std::thread;
use crate::services::library_service::get_library;

pub struct WatcherState {
    pub watcher: Option<notify::RecommendedWatcher>,
}

#[derive(Clone, serde::Serialize)]
struct FileUpdatePayload {
    path: String,
    content: String,
}

#[derive(Clone, serde::Serialize)]
struct TreeUpdatePayload {}

pub fn init_watcher(app: AppHandle) {
    let app_clone = app.clone();
    
    let (tx, rx) = std::sync::mpsc::channel();
    let mut watcher = notify::recommended_watcher(tx).expect("Failed to create watcher");
    
    if let Ok(lib) = get_library(app.clone()) {
        for book in lib {
            let path = std::path::Path::new(&book.path);
            if path.exists() {
                let _ = watcher.watch(path, RecursiveMode::Recursive);
            }
        }
    }

    app.manage(Arc::new(Mutex::new(WatcherState { watcher: Some(watcher) })));

    // Spawn standard background thread for the blocking channel receiver
    thread::spawn(move || {
        for event_result in rx {
            match event_result {
                Ok(event) => {
                    let mut is_tree_update = false;
                    let mut file_update_path = None;

                    match event.kind {
                        EventKind::Create(_) | EventKind::Remove(_) => {
                            is_tree_update = true;
                        },
                        EventKind::Modify(k) => {
                            match k {
                                ModifyKind::Data(_) | ModifyKind::Any => {
                                    if let Some(path_buf) = event.paths.first() {
                                        if let Some(ext) = path_buf.extension() {
                                            if ext == "md" {
                                                file_update_path = Some(path_buf.clone());
                                            }
                                        }
                                    }
                                },
                                ModifyKind::Name(_) => {
                                    is_tree_update = true;
                                },
                                _ => {}
                            }
                        },
                        _ => {}
                    }

                    if is_tree_update {
                        let _ = app_clone.emit("tree_update", TreeUpdatePayload {});
                    }
                    
                    if let Some(path_buf) = file_update_path {
                        let app_emit = app_clone.clone();
                        // Offload file reading to avoid blocking the notify event loop
                        tauri::async_runtime::spawn_blocking(move || {
                            if let Ok(content) = std::fs::read_to_string(&path_buf) {
                                let path_str = path_buf.to_string_lossy().replace("\\", "/");
                                let _ = app_emit.emit("file_update", FileUpdatePayload {
                                    path: path_str,
                                    content,
                                });
                            }
                        });
                    }
                },
                Err(e) => {
                    eprintln!("Watcher error: {:?}", e);
                }
            }
        }
    });
}

pub fn watch_new_path(app: &AppHandle, path: &str) {
    let state = app.state::<Arc<Mutex<WatcherState>>>();
    if let Ok(mut lock) = state.inner().lock() {
        if let Some(watcher) = &mut lock.watcher {
            let p = std::path::Path::new(path);
            if p.exists() {
                let _ = watcher.watch(p, RecursiveMode::Recursive);
            }
        }
    }
}

#[tauri::command]
pub fn broadcast_tree_update(app: AppHandle) {
    let _ = app.emit("tree_update", TreeUpdatePayload {});
}
