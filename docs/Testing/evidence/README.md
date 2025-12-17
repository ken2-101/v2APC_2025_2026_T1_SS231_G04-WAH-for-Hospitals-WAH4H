## 📁 Testing Artifacts & Evidence

This directory contains visual evidence and documentation for each system analysis phase.

### Folder Structure
* **Parent Folders:** Named `testing_artifacts_DD-MM-YYYY`, representing the **date the test was conducted**.
* **Screenshots/Files:** Named by the feature followed by the **date of the last commit** for that version. 
* **Multiple Files:** If there are multiple screenshots for a single feature, an identifier is added in parentheses at the end (e.g., `login_15-12-2025(1)`).

> [!NOTE]
> The date in the filename (e.g., `15-12-2025`) may differ from the folder name (e.g., `17-12-2025`). This is because the filename tracks when the specific code branch was last updated in GitHub, while the folder tracks when the actual manual testing occurred.

### Example
`testing_artifacts_17-12-2025/`
├── `login_15-12-2025(1).png` *(First screenshot of Login feature from Dec 15 commit)*
└── `login_15-12-2025(2).png` *(Second screenshot of Login feature from Dec 15 commit)*