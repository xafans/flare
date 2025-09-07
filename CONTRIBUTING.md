# Contributing to Flare

First off, thank you for considering contributing! 🎉  
We welcome contributions from everyone — bug reports, feature requests, documentation improvements, or code enhancements.

---

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Branching & Commits](#branching--commits)
- [Pull Requests](#pull-requests)
- [Style Guide](#style-guide)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

---

## Code of Conduct
By participating in this project, you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).  
Be respectful, constructive, and welcoming to all contributors.

---

## How to Contribute
You can contribute in many ways:
- **Bug reports:** Open an issue with steps to reproduce.
- **Feature requests:** Suggest new features or enhancements.
- **Documentation:** Improve README, examples, or type definitions.
- **Code contributions:** Add features, fix bugs, or refactor code.

---

## Development Setup
1. **Fork the repo**  
2. **Clone your fork locally:**
   ```bash
   git clone https://github.com/xafans/flare.git
   cd flare
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```
4. **Build the project:**

   ```bash
   npm run build
   ```
5. **Run tests:**

   ```bash
   npm test
   ```
6. **Make changes** in a feature branch (see Branching & Commits below).

---

## Branching & Commits

* Create a **feature branch** from `main`:

  ```bash
  git checkout -b chore/your-feature
  ```
* Use **kebab-case** for branch names.
* Use **conventional commits**:

  * `feat:` for new features
  * `fix:` for bug fixes
  * `docs:` for documentation changes
  * `chore:` for repo maintenance / tooling
* Keep your commits small and descriptive.

---

Perfect! That’s a good workflow to **automatically link PRs to issues**. You can add this guideline to your `CONTRIBUTING.md`. Here’s a suggested section to include under **Pull Requests**:

---

### Pull Requests

1. Push your branch to your fork.
2. Open a **Pull Request** against `main`.
3. **Link PR to an issue** (if applicable):

   * Include the issue number in the PR title:

     ```
     Correct event handling (#12)
     ```
   * In the PR description, add:

     ```
     Closes #12
     ```

     This will automatically close the issue when the PR is merged.
4. PR checklist:

   - [ ] Code passes existing tests.
   - [ ] Added tests for new features/bug fixes.
   - [ ] Update README/docs if needed.
   - [ ] Follows code style and linting rules.

---

## Style Guide

* Use **TypeScript** for new code.
* Prefer **async/await** over raw promises when possible.
* Keep functions **small and focused**.

---

## Reporting Bugs

* Include a **clear description** of the problem.
* Steps to reproduce, expected vs. actual behavior.
* Environment: Node version, OS, package version.

---

## Feature Requests

* Explain **why this feature is useful**.
* Include examples of **how it would work**.

---

Thank you for helping make **Flare** better! 💖