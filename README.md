# Elegance AI Chat

A beautiful, intuitive interface for meaningful interactions with advanced artificial intelligence.

![Elegance AI Chat Screenshot](screenshot.png)

## Features

- **Elegant UI**: Clean, modern interface with smooth transitions and animations
- **Dark/Light Mode**: Toggle between themes based on preference
- **Conversation Management**: Create, rename, and delete conversations
- **Markdown Support**: Rich text formatting in AI responses
- **Code Highlighting**: Syntax highlighting for multiple programming languages
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Local Storage**: Conversations persist between sessions
- **Regenerate Responses**: Option to regenerate AI responses if needed

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **UI Framework**: Tailwind CSS
- **Icons**: Lucide Icons
- **AI Integration**: GROQ API (LLaMA 3 8B model)
- **Storage**: Browser LocalStorage

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- GROQ API key (for AI functionality)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/elegance-ai-chat.git
   ```

2. Navigate to the project directory:
   ```
   cd elegance-ai-chat
   ```

3. Open `app.js` and replace the placeholder API key with your GROQ API key:
   ```javascript
   const API_KEY = "your-groq-api-key-here";
   ```

4. Open `index.html` in your browser or serve it using a local server:
   ```
   npx serve
   ```

## Usage

### Starting a Conversation

1. Click the "Start Conversation" button on the landing page
2. Type your message in the input field at the bottom
3. Press Enter or click the send button to submit

### Managing Conversations

- **New Chat**: Click the "New Chat" button in the sidebar
- **Rename Chat**: Click the three dots menu on a chat and select "Rename"
- **Delete Chat**: Click the three dots menu on a chat and select "Delete"
- **Switch Chats**: Click on any chat in the sidebar to switch to it

### Changing Theme

- Click the theme toggle button at the bottom of the sidebar to switch between light and dark mode

## Customization

### Changing Colors

The app uses a custom "navy" color palette. You can modify the colors in the Tailwind configuration in `index.html`:

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        navy: {
          // Customize colors here
        }
      }
    }
  }
}
```

### Modifying AI Model

To use a different AI model, update the model parameter in the fetch request in `app.js`:

```javascript
body: JSON.stringify({
  model: "your-preferred-model",
  messages: chats[currentChatId],
}),
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide Icons](https://lucide.dev/) for the beautiful icon set
- [GROQ](https://groq.com/) for the AI API
- [Inter Font](https://rsms.me/inter/) for the typography