pub mod services;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      services::library_service::get_library,
      services::library_service::save_book_to_library,
      services::library_service::delete_book_from_library,
      services::library_service::update_book_in_library,
      services::tree_service::fetch_tree,
      services::file_service::read_file,
      services::file_service::write_file,
      services::git_service::get_file_history,
      services::git_service::get_file_content_at_commit,
      services::git_service::check_git_installed,
      services::watcher_service::broadcast_tree_update,
      services::node_operations::create_node,
      services::node_operations::rename_node,
      services::node_operations::delete_node,
      services::node_operations::create_variation,
      services::compiler_service::fetch_chapter_config,
      services::compiler_service::save_chapter_config,
      services::compiler_service::compile_manuscript
    ])
    .setup(|app| {
      services::watcher_service::init_watcher(app.handle().clone());
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
