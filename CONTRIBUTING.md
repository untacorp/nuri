# Contributing to Nuri

Thank you for your interest in contributing to Nuri! We welcome bug reports, feature requests, documentation updates, and code submissions from writers and developers alike.

By participating in this project, you agree to abide by our Code of Conduct (detailed below).

## How Can I Contribute?

### Reporting Bugs
- Search existing issues to see if the bug has already been reported.
- If not, create a new issue using the **Bug Report** template.
- Provide a clear summary, steps to reproduce, expected vs. actual behavior, and system environment info (OS version, etc.).

### Suggesting Enhancements
- Open an issue using the **Feature Request** template.
- Describe the feature, why it is useful to writers, and how it could work.

### Submitting Pull Requests (PRs)
1. Fork the repository and create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Write clean, commented code. If you make backend changes (Rust):
   - Format with `cargo fmt`.
   - Ensure `cargo clippy` has no warnings:
     ```bash
     cargo clippy -- -D warnings
     ```
   - Ensure the app compiles and runs.
3. Keep frontend (React) changes compliant with the project's Tailwind and TypeScript configurations.
4. Push your branch to GitHub and submit a Pull Request to the `main` branch.
5. Reference any related issues in the PR description using the pull request template.

---

## Code of Conduct

### Our Pledge
We are committed to providing a friendly, safe, and welcoming environment for everyone, regardless of experience, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### Our Standards
Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language.
- Being respectful of differing viewpoints and experiences.
- Gracefully accepting constructive criticism.
- Focusing on what is best for the community.
- Showing empathy towards other community members.

Examples of unacceptable behavior:
- The use of sexualized language or imagery and unwelcome sexual attention or advances.
- Trolling, insulting/derogatory comments, and personal or political attacks.
- Public or private harassment.
- Publishing others' private information, such as a physical or electronic address, without explicit permission.
- Other conduct which could reasonably be considered inappropriate in a professional setting.
