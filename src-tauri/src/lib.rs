pub mod library_service;
pub mod tree_service;
pub mod file_service;
pub mod git_service;
pub mod watcher_service;
pub mod node_operations;
pub mod compiler_service;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      library_service::get_library,
      library_service::save_book_to_library,
      library_service::delete_book_from_library,
      library_service::update_book_in_library,
      tree_service::fetch_tree,
      file_service::read_file,
      file_service::write_file,
      git_service::get_file_history,
      git_service::get_file_content_at_commit,
      watcher_service::broadcast_tree_update,
      node_operations::create_node,
      node_operations::rename_node,
      node_operations::delete_node,
      node_operations::create_variation,
      compiler_service::fetch_chapter_config,
      compiler_service::save_chapter_config,
      compiler_service::compile_manuscript
    ])
    .setup(|app| {
      watcher_service::init_watcher(app.handle().clone());
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
