# Nuri

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Tauri](https://img.shields.io/badge/built%20with-Tauri-blue?logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/frontend-React-blue?logo=react)](https://react.dev/)
[![Rust](https://img.shields.io/badge/backend-Rust-orange?logo=rust)](https://www.rust-lang.org/)

Nuri is a local-first, privacy-respecting writing assistant and manuscript builder designed for novelists, researchers, and creative writers. Unlike traditional word processors or generic markdown editors, Nuri solves the complexity of managing non-linear storylines, branching drafts, and structured manuscripts through an intuitive desktop interface powered by Git and Rust.

## Core Pillars

### Version Control for Storytellers
Stop duplicating files as `chapter1_final_v2_edit.md`. Nuri uses local Git versioning under the hood. It records your writing history automatically on every save, allowing you to easily view past revisions, compare variations, and roll back changes without technical Git knowledge.

### Non-Linear Variations
Need to explore a different plot direction for a scene without losing your original draft? Nuri allows you to create variations of any chapter or section at any point in time. Explore branching narratives freely and choose the path that best fits your story.

### Modular Manuscript Builder
Build your book out of small, manageable pieces. Use the integrated drag-and-drop assembler to group sections into chapters and order chapters into a complete manuscript. When you are ready, Nuri compiles your modular sections into a single, beautifully formatted Markdown file.

### Local-First & Privacy-Focused
Your intellectual property belongs on your machine. Nuri runs entirely locally, saving all library configurations, manuscripts, and histories inside your machine's standard application data directory and local Git repositories. No cloud synchronization, no subscription lock-in.

---

## Architecture & Stack

Nuri is built on top of a modern, lightweight desktop stack:

- **Frontend**: React and Vite, utilizing Tailwind CSS for a clean, distraction-free writing environment.
- **Backend**: Rust (via Tauri v2), providing secure, native filesystem access and local process management.
- **Data & History**: Native Git integration, utilizing local CLI calls to manage revisions and history within each book's directory.
- **File System Monitoring**: Native asynchronous file watching (`notify` crate) to keep the file tree and editor synchronized with external edits.

---

## Getting Started

### Prerequisites

To compile and run Nuri locally, you need the following dependencies installed on your system:

- **Node.js** (v18 or higher) & **pnpm**
- **Rust toolchain** (via `rustup`)
- **System development libraries** (required by Tauri):
  - On Ubuntu/Debian:
    ```bash
    sudo apt-get update
    sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file
    ```

### Running the Development Environment

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/nuri.git
   cd nuri
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the Tauri development server:
   ```bash
   pnpm tauri dev
   ```

---

## Roadmap

- [ ] **Rich-Text / WYSIWYG Enhancements**: Advanced formatting shortcuts, distraction-free focus modes, and word count goals.
- [ ] **Native Diff Viewer**: Visual interface to compare two different chapter variations side-by-side.
- [ ] **Export Options**: Compiling directly to PDF, EPUB, and DOCX via integration with Pandoc.
- [ ] **Offline-First Collaboration**: Secure peer-to-peer syncing for co-authors using Git remote capabilities.

---

## Contributing

We welcome contributions from writers, developers, designers, and translators! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) to learn how to get started, report bugs, or submit pull requests.

## License

This project is licensed under the **GNU Affero General Public License v3 (AGPL-3.0)**. 
For commercial licensing inquiries or alternative licensing agreements, please contact the maintainers.
