# Native-Notes

A feature-rich notes application built with React Native and Expo, designed around a familiar file-and-folder organization system.

Native-Notes aims to provide a flexible place for writing, organizing, and managing notes while keeping the experience closer to a lightweight file manager than a traditional flat list of notes.

## ✨ Features

- 📝 Create, edit, and manage notes
- 📁 Organize notes using folders and nested folders
- 🎨 Rich-text editing
- 🔤 Font size and text formatting controls
- 🎨 Custom text colors
- Bold, italic, underline, and other formatting options
- 🌐 Custom HTML editor powered by "react-native-webview"
- 💾 Auto-save support
- 🔒 Locked notes
- 🔐 Device authentication / app locking
- 🗑️ Trash system
- 📚 View all notes in one place
- 🌙 Dark mode
- 🎨 Theme customization
- 🔀 Sorting and layout options
- 📍 Remember your last folder/location
- 💽 Local SQLite storage architecture
- 👤 User accounts and authentication
- 🔄 Server-backed note and folder data

## 📱 About

Native-Notes is an Android-focused notes application built using React Native and Expo.

Instead of treating every note as an item in one large collection, Native-Notes uses a hierarchical organization system similar to a computer's file system:

Folders
├── Work
│ ├── Projects
│ │ └── Project Ideas
│ └── Meeting Notes
├── Personal
│ ├── Recipes
│ └── Shopping List
└── Random Ideas

Folders can contain both notes and additional folders, allowing large collections of notes to remain organized without requiring everything to live in a single list.

## ✍️ Rich Text Editor

Native-Notes includes a custom rich-text editor built inside a WebView.

The editor communicates between React Native and an HTML/JavaScript editing environment, allowing Native-Notes to provide formatting capabilities beyond a standard React Native "TextInput".

The editor is being developed to support features such as:

- Bold
- Italic
- Underline
- Font sizes
- Text colors
- Rich HTML content
- Selection-aware formatting
- Persistent formatting while typing
- Expandable toolbar controls

This architecture also makes it possible to continue adding more advanced editor functionality over time.

## 🛠️ Built With

Native-Notes currently uses:

- React Native
- React 19
- Expo
- JavaScript
- HTML / CSS / JavaScript WebView editor
- react-native-webview
- Expo SQLite
- AsyncStorage
- Expo Local Authentication
- React Router Native
- Axios
- UUID
- Expo Vector Icons

## 📂 Project Structure

Native-Notes/
├── assets/ # Application assets
├── components/ # Reusable React Native UI components
├── constants/ # Application constants
├── states/ # Major application screens/states
├── utils/ # API and utility functions
├── webView/ # Rich-text WebView editor
├── App.js # Main application component
├── app.json # Expo configuration
├── eas.json # Expo Application Services configuration
├── babel.config.js
└── package.json

## 🚀 Getting Started

### Prerequisites

Before running Native-Notes, make sure you have:

- Node.js
- npm
- Expo tooling / Expo Go or an Android development environment
- Git

### Clone the Repository

```
git clone https://github.com/RyanLarge13/Native-Notes.git
cd Native-Notes
```

Install Dependencies

```
npm install
```

Start the Development Server

```
npm start
```

or:

```
npx expo start
```

Run on Android

```
npm run android
```

You can also launch the application through Expo Go when the currently used native dependencies are supported by Expo Go.

## 🏗️ Technology Overview

### React Native + Expo

The primary application interface is built using React Native with Expo providing the native development environment and access to device functionality.

### WebView Editor

Rich-text editing is handled through a custom HTML editor running inside "react-native-webview".

React Native communicates with the editor through messages, allowing the native toolbar and application UI to control formatting inside the HTML document.

### SQLite

Native-Notes uses "expo-sqlite" as part of its local storage architecture.

The local database contains structures for:

user
folders
notes

This provides a foundation for persistent local note storage and synchronization with remote account data.

### Authentication

Native-Notes supports user accounts and authentication, with authentication tokens stored locally using AsyncStorage.

### Device Security

Expo Local Authentication is used to provide device-level authentication functionality for protecting access to notes.

## 🧭 Development Status

Native-Notes is under active development.

The project is being continuously expanded and parts of the architecture are currently being rewritten or improved. Some functionality may therefore be experimental, incomplete, or change between commits.

Current development is particularly focused on improving the rich-text editing experience, editor toolbar, formatting behavior, and overall note creation workflow.

## 🗺️ Planned Improvements

Native-Notes is intended to continue growing into a more complete notes platform.

Potential and ongoing improvements include:

- Expanded rich-text formatting
- Improved editor toolbar
- Better selection and cursor handling
- Improved offline/local storage
- More reliable local/remote synchronization
- Additional organization tools
- Search
- Improved note security
- Editor performance improvements
- UI/UX refinements
- Additional customization and themes

## 🤝 Contributing

Native-Notes is currently a personal project, but suggestions, bug reports, and contributions are welcome.

### To contribute:

1. Fork the repository
2. Create a feature branch

git checkout -b feature/my-feature

3. Make your changes
4. Commit your changes

git commit -m "Add my feature"

5. Push the branch

git push origin feature/my-feature

6. Open a Pull Request

Bug reports and feature suggestions can also be submitted through GitHub Issues.

## 📦 Repository

The source code for Native-Notes is hosted on GitHub:

"github.com/RyanLarge13/Native-Notes"

## 👨‍💻 Author

Created and maintained by Ryan Large.

**GitHub: @RyanLarge13**

## 📄 License

A license has not yet been specified for this project.

Until a license is added, the source code remains subject to the repository owner's copyright and should not be assumed to be open-source for unrestricted reuse.

---

Native-Notes — organize your thoughts like you organize your files.
