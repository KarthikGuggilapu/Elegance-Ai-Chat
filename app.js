const API_KEY = "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";
const chatBox = document.getElementById("chatBox");
const askBtn = document.getElementById("askBtn");
const questionInput = document.getElementById("question");
const chatList = document.getElementById("chatList");
const newChatBtn = document.getElementById("newChatBtn");

let chats = JSON.parse(localStorage.getItem("chats") || "{}");
let currentChatId = null;

// Initialize Tailwind config with custom navy palette
document.addEventListener('DOMContentLoaded', () => {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          navy: {
            50: '#f0f4ff',
            100: '#e0e9fe',
            200: '#c7d7fe',
            300: '#a4bcfd',
            400: '#7f95fa',
            500: '#6172f5',
            600: '#4d55eb',
            700: '#3f43d7',
            800: '#3438ae',
            900: '#2f3389',
          }
        }
      }
    }
  }
});

// New Chat
newChatBtn.onclick = () => {
  currentChatId = "chat_" + Date.now();
  chats[currentChatId] = [
    { role: "user", content: "New conversation with Elegance AI" },
    { role: "assistant", content: "Hello! I'm Elegance AI, your intelligent assistant. How can I help you today?" }
  ];
  localStorage.setItem("chats", JSON.stringify(chats));
  renderChatList();
  renderChat();
  questionInput.focus();
};

// Load selected chat
function loadChat(chatId) {
  currentChatId = chatId;
  renderChat();
  renderChatList(); // Re-render chat list to update selection
  questionInput.focus();
  
  // Close sidebar on mobile/tablet after selecting a chat
  if (window.innerWidth < 1024) {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  }
}

// Ask question
askBtn.onclick = async () => {
  const q = questionInput.value.trim();
  if (!q || !currentChatId) return;
  questionInput.value = "";
  questionInput.style.height = 'auto';

  // Update document title to show activity
  document.title = "Typing... - Elegance AI Chat";

  chats[currentChatId].push({ role: "user", content: q });
  renderChat();
  showLoading();

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: chats[currentChatId],
      }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Error getting response";

    chats[currentChatId].push({ role: "assistant", content: reply });
    localStorage.setItem("chats", JSON.stringify(chats));
    renderChat();
    
    // Reset document title
    document.title = "Elegance AI Chat";
  } catch (error) {
    chats[currentChatId].push({ role: "assistant", content: "Error: Failed to fetch response" });
    localStorage.setItem("chats", JSON.stringify(chats));
    renderChat();
    
    // Reset document title
    document.title = "Elegance AI Chat";
  }
};

// Render sidebar
function renderChatList() {
  chatList.innerHTML = "";
  
  // Group chats by date
  const chatsByDate = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  Object.keys(chats).reverse().forEach(id => {
    const timestamp = id.split('_')[1] ? parseInt(id.split('_')[1]) : Date.now();
    const chatDate = new Date(timestamp);
    chatDate.setHours(0, 0, 0, 0);
    
    let dateGroup;
    if (chatDate.getTime() === today.getTime()) {
      dateGroup = "Today";
    } else if (chatDate.getTime() === yesterday.getTime()) {
      dateGroup = "Yesterday";
    } else {
      dateGroup = chatDate.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: chatDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
    
    if (!chatsByDate[dateGroup]) {
      chatsByDate[dateGroup] = [];
    }
    
    chatsByDate[dateGroup].push(id);
  });
  
  // Render chats by date groups
  Object.keys(chatsByDate).forEach(dateGroup => {
    // Add date header
    const dateHeader = document.createElement("div");
    dateHeader.className = "date-header text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wider mt-2 mb-1";
    dateHeader.textContent = dateGroup;
    chatList.appendChild(dateHeader);
    
    // Add chats for this date
    chatsByDate[dateGroup].forEach(id => {
      const firstMessage = chats[id]?.[0]?.content || "New Chat";
      // Ensure all chat names are displayed with the same width by using fixed-width container
      const previewText = firstMessage.length > 30 
        ? firstMessage.substring(0, 30) + '...' 
        : firstMessage;
      
      const lastMessageTime = id.split('_')[1] ? new Date(parseInt(id.split('_')[1])) : new Date();
      const timeString = lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const el = document.createElement("div");
      el.className = `chat-item flex items-center px-3 py-2 cursor-pointer rounded-lg transition-colors group ${id === currentChatId ? "selected-chat" : ""}`;
      el.innerHTML = `
        <div class="w-2 h-2 ${id === currentChatId ? "bg-blue-500" : "bg-gray-400"} rounded-full mr-3 flex-shrink-0"></div>
        <div class="flex-1 min-w-0">
          <div class="truncate ${id === currentChatId ? "text-blue-600 font-medium" : "text-gray-700"}">${escapeHTML(previewText)}</div>
          <div class="text-xs text-gray-400 mt-0.5">${timeString}</div>
        </div>
        <button class="menu-btn opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-blue-600 ml-2 flex-shrink-0" data-chat-id="${id}" title="Menu">
          <i data-lucide="more-vertical" class="w-4 h-4"></i>
        </button>
      `;
      
      // Single click to load chat
      el.onclick = () => loadChat(id);
      
      chatList.appendChild(el);
    });
  });
  
  // Add empty state if no chats
  if (Object.keys(chats).length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "flex flex-col items-center justify-center text-center p-6 text-gray-500";
    emptyState.innerHTML = `
      <div class="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center mb-3 empty-state-icon">
        <i data-lucide="message-square" class="w-6 h-6 text-navy-400"></i>
      </div>
      <p class="text-sm mb-1">Welcome to Elegance AI</p>
      <p class="text-xs">Start a new chat to begin</p>
    `;
    chatList.appendChild(emptyState);
  }
  
  // Attach event listeners to menu buttons
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation(); // Prevent triggering the chat selection
      showChatMenu(btn.getAttribute('data-chat-id'), e);
    };
  });
  
  // Initialize Lucide icons for the newly added elements
  lucide.createIcons();
}

// Render chat messages
function renderChat() {
  chatBox.innerHTML = "";
  if (!currentChatId) return;

  chats[currentChatId].forEach((msg, idx) => {
    const isUser = msg.role === "user";
    const messageId = `msg-${idx}`;
    
    const wrap = document.createElement("div");
    wrap.className = `message-container flex ${isUser ? "justify-end" : "justify-start"} mb-6`;
    
    const box = document.createElement("div");
    box.className = `relative ${isUser ? "bg-navy-700 text-white" : "bg-white border border-gray-200"} rounded-xl p-4 max-w-[85%] shadow-sm`;
    box.innerHTML = formatWithCodeBlocks(msg.content, idx, isUser);

    // Add avatar and message actions
    const avatar = document.createElement("div");
    avatar.className = `flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "ml-3 mr-2 bg-navy-100" : "mr-3 bg-gray-100"}`;
    avatar.innerHTML = `<i data-lucide="${isUser ? "user" : "bot"}" class="w-4 h-4 ${isUser ? "text-navy-600" : "text-gray-600"}"></i>`;
    
    const messageRow = document.createElement("div");
    messageRow.className = `flex ${isUser ? "flex-row-reverse" : ""}`;
    
    if (!isUser) messageRow.appendChild(avatar);
    messageRow.appendChild(box);
    if (isUser) messageRow.appendChild(avatar);
    
    wrap.appendChild(messageRow);
    chatBox.appendChild(wrap);
    
    // Attach event listeners to buttons after they're added to DOM
    const copyBtns = box.querySelectorAll('.copy-btn');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(msg.content);
        btn.innerHTML = `<i data-lucide="check" class="w-3 h-3 mr-1"></i> Copied!`;
        setTimeout(() => {
          btn.innerHTML = `<i data-lucide="copy" class="w-3 h-3 mr-1"></i> Copy`;
          lucide.createIcons();
        }, 2000);
      });
    });
    
    const codeCopyBtns = box.querySelectorAll('.code-copy-btn');
    codeCopyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const codeId = btn.getAttribute('data-code-id');
        const codeElement = document.getElementById(codeId);
        navigator.clipboard.writeText(codeElement.textContent);
        btn.innerHTML = `<i data-lucide="check" class="w-3 h-3 mr-1"></i> Copied!`;
        setTimeout(() => {
          btn.innerHTML = `<i data-lucide="copy" class="w-3 h-3 mr-1"></i> Copy`;
          lucide.createIcons();
        }, 2000);
      });
    });
    
    const regenerateBtns = box.querySelectorAll('.regenerate-btn');
    regenerateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        regenerate(parseInt(btn.getAttribute('data-idx')));
      });
    });
  });

  chatBox.scrollTop = chatBox.scrollHeight;
  lucide.createIcons();
}

// Show loading
function showLoading() {
  const el = document.createElement("div");
  el.className = "flex justify-start mb-6";
  el.innerHTML = `
    <div class="flex items-start">
      <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-gray-100">
        <i data-lucide="bot" class="w-4 h-4 text-gray-600"></i>
      </div>
      <div class="typing-indicator bg-white border border-gray-200 rounded-xl px-4 py-3 max-w-[85%] shadow-sm">
        <div class="flex space-x-1">
          <span class="w-2 h-2 rounded-full"></span>
          <span class="w-2 h-2 rounded-full"></span>
          <span class="w-2 h-2 rounded-full"></span>
        </div>
      </div>
    </div>
  `;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Helper function to escape HTML
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to escape HTML in code blocks but preserve formatting
function formatCodeExample(text) {
  // Replace < and > with their HTML entities in code examples
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Code formatting & copy
function formatWithCodeBlocks(text, idx, isUser) {
  // First handle code blocks
  const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
  let codeBlocks = [];
  let processedText = text.replace(codeRegex, (match, language, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({ language, code: formatCodeExample(code) });
    return placeholder;
  });
  
  // Also handle inline code with backticks
  processedText = processedText.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-navy-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Process markdown formatting
  // Bold text
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Headers (h1, h2, h3)
  processedText = processedText.replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold my-2">$1</h1>');
  processedText = processedText.replace(/^## (.*?)$/gm, '<h2 class="text-lg font-bold my-2">$1</h2>');
  processedText = processedText.replace(/^### (.*?)$/gm, '<h3 class="text-base font-bold my-2">$1</h3>');
  
  // Unordered lists
  processedText = processedText.replace(/^\* (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>');
  processedText = processedText.replace(/^\+ (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>');
  processedText = processedText.replace(/^\- (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>');
  
  // Convert consecutive list items into proper lists
  processedText = processedText.replace(/<li class="ml-4 list-disc">(.*?)<\/li>(\s*)<li class="ml-4 list-disc">/g, 
    '<li class="ml-4 list-disc">$1</li>$2<li class="ml-4 list-disc">');
  
  // Wrap lists in ul tags
  const listItemRegex = /<li class="ml-4 list-disc">(.*?)<\/li>/g;
  let match;
  let listItems = [];
  
  while ((match = listItemRegex.exec(processedText)) !== null) {
    listItems.push(match[0]);
  }
  
  if (listItems.length > 0) {
    for (let item of listItems) {
      if (!processedText.includes(`<ul class="my-2 pl-4">${item}`)) {
        processedText = processedText.replace(item, `<ul class="my-2 pl-4">${item}</ul>`);
      }
    }
    
    // Fix nested lists
    processedText = processedText.replace(/<\/ul>(\s*)<ul class="my-2 pl-4">/g, '');
  }
  
  // Reinsert code blocks
  codeBlocks.forEach((block, i) => {
    const codeId = `code-${idx}-${i}`;
    
    // Get language display name
    let languageDisplay = getLanguageDisplayName(block.language);
    
    // Try to detect language from code content if not specified
    if (!block.language || block.language === "") {
      const code = block.code.toLowerCase();
      
      // Python detection
      if (code.includes("def ") || 
          (code.includes("import ") && code.includes("from ")) ||
          code.includes("print(") || 
          code.match(/^\s*#.*\n/m) && code.includes(":") ||
          code.includes("if __name__ == '__main__'")) {
        languageDisplay = "Python Code";
      } 
      // JavaScript detection
      else if (code.includes("function ") || 
               code.includes("const ") || 
               code.includes("let ") || 
               code.includes("var ") ||
               code.includes("console.log") || 
               code.includes("document.getElementById") ||
               code.includes("=>") ||
               code.match(/\$\(.*\)\./) ||
               code.includes("new Promise")) {
        languageDisplay = "JavaScript Code";
      } 
      // HTML detection
      else if (code.includes("<html") || 
               code.includes("<!doctype html") || 
               (code.includes("<div") && code.includes("</div>")) ||
               (code.includes("<body") && code.includes("</body>")) ||
               (code.includes("<head") && code.includes("</head>"))) {
        languageDisplay = "HTML Code";
      } 
      // CSS detection
      else if (code.match(/[a-z-]+\s*\{\s*[a-z-]+:/i) || 
               code.includes("@media") || 
               code.includes("@keyframes") ||
               code.includes("@import url(")) {
        languageDisplay = "CSS Code";
      } 
      // Java detection
      else if (code.includes("public class ") || 
               code.includes("private ") || 
               code.includes("protected ") ||
               code.includes("System.out.println") ||
               (code.includes("import java.") && code.includes(";"))) {
        languageDisplay = "Java Code";
      } 
      // C# detection
      else if (code.includes("using System;") || 
               code.includes("namespace ") || 
               code.includes("Console.WriteLine") ||
               code.match(/public\s+class\s+\w+/i) && code.includes(";")) {
        languageDisplay = "C# Code";
      } 
      // PHP detection
      else if (code.includes("<?php") || 
               code.includes("echo ") || 
               code.includes("$_POST") ||
               code.includes("$_GET") ||
               code.match(/\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/) && code.includes(";")) {
        languageDisplay = "PHP Code";
      } 
      // Ruby detection
      else if (code.includes("def ") && code.includes("end") || 
               code.includes("puts ") || 
               code.includes("require '") ||
               code.includes("class ") && code.includes("end") ||
               code.match(/[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[a-zA-Z_][a-zA-Z0-9_]*\.new/)) {
        languageDisplay = "Ruby Code";
      } 
      // Go detection
      else if (code.includes("func ") || 
               code.includes("package main") || 
               code.includes("import (") ||
               code.includes("fmt.Println")) {
        languageDisplay = "Go Code";
      } 
      // Rust detection
      else if (code.includes("fn ") || 
               code.includes("let mut ") || 
               code.includes("impl ") ||
               code.includes("use std::") ||
               code.includes("println!")) {
        languageDisplay = "Rust Code";
      } 
      // Swift detection
      else if (code.includes("func ") && !code.includes("package") || 
               code.includes("var ") && code.includes("->") || 
               code.includes("import UIKit") ||
               code.includes("class ") && code.includes("init(")) {
        languageDisplay = "Swift Code";
      } 
      // Kotlin detection
      else if (code.includes("fun ") || 
               code.includes("val ") || 
               code.includes("var ") && code.includes("->") ||
               code.includes("import kotlin")) {
        languageDisplay = "Kotlin Code";
      } 
      // SQL detection
      else if (code.match(/select\s+[\w\*]+\s+from/i) || 
               code.match(/insert\s+into/i) || 
               code.match(/update\s+\w+\s+set/i) ||
               code.match(/create\s+table/i) ||
               code.match(/alter\s+table/i)) {
        languageDisplay = "SQL Query";
      } 
      // Shell/Bash detection
      else if (code.match(/^\s*#!\s*\/bin\/bash/m) || 
               code.match(/^\s*#!\s*\/bin\/sh/m) || 
               code.includes("echo $") ||
               code.match(/if\s+\[\s+.*\s+\]\s*;/i) ||
               code.includes("chmod ") ||
               code.includes("sudo ")) {
        languageDisplay = "Shell Script";
      } 
      // JSON detection
      else if ((code.match(/^\s*\{/m) && code.match(/\}\s*$/m)) || 
               code.match(/"[^"]+"\s*:\s*("[^"]*"|[\d\[\{])/)) {
        languageDisplay = "JSON Data";
      } 
      // XML detection
      else if (code.match(/<\?xml/) || 
               (code.match(/<[a-z][a-z0-9]*>/i) && code.match(/<\/[a-z][a-z0-9]*>/i))) {
        languageDisplay = "XML Data";
      } 
      // YAML detection
      else if (code.match(/^\s*[a-z_][a-z0-9_]*\s*:/mi) && 
               !code.includes("{") && !code.includes("<")) {
        languageDisplay = "YAML Configuration";
      } 
      // Markdown detection
      else if (code.match(/^#+\s+.+$/m) || 
               code.match(/\[.+\]\(.+\)/) || 
               code.match(/\*\*.+\*\*/) ||
               code.match(/^\s*[\*\-]\s+.+$/m)) {
        languageDisplay = "Markdown Text";
      }
      // TypeScript detection
      else if (code.includes(": string") || 
               code.includes(": number") || 
               code.includes(": boolean") ||
               code.includes("interface ") ||
               code.includes("class ") && code.includes("implements ")) {
        languageDisplay = "TypeScript Code";
      }
      // C/C++ detection
      else if (code.includes("#include <") || 
               code.includes("int main(") || 
               (code.includes("void ") && code.includes(";")) ||
               code.includes("std::") ||
               code.includes("cout <<")) {
        // Differentiate between C and C++
        if (code.includes("std::") || 
            code.includes("cout") || 
            code.includes("class ") ||
            code.includes("namespace ") ||
            code.includes("template <")) {
          languageDisplay = "C++ Code";
        } else {
          languageDisplay = "C Code";
        }
      }
      // R detection
      else if (code.includes("<-") || 
               code.match(/library\([a-zA-Z0-9]+\)/) || 
               code.includes("data.frame") ||
               code.includes("ggplot(")) {
        languageDisplay = "R Code";
      }
      // PowerShell detection
      else if (code.includes("Write-Host") || 
               code.includes("$PSVersionTable") || 
               code.includes("-ErrorAction") ||
               code.match(/\$[a-zA-Z_][a-zA-Z0-9_]* = /)) {
        languageDisplay = "PowerShell Script";
      }
      // Dockerfile detection
      else if (code.match(/^FROM /m) || 
               code.match(/^RUN /m) || 
               code.match(/^CMD /m) ||
               code.match(/^ENTRYPOINT /m)) {
        languageDisplay = "Dockerfile";
      }
      // GraphQL detection
      else if (code.includes("query ") || 
               code.includes("mutation ") || 
               code.includes("type ") && code.includes("{") ||
               code.includes("fragment ")) {
        languageDisplay = "GraphQL Query";
      }
      // LaTeX detection
      else if (code.includes("\\begin{document}") || 
               code.includes("\\section{") || 
               code.includes("\\usepackage{") ||
               code.match(/\$\$.+\$\$/s)) {
        languageDisplay = "LaTeX Document";
      }
    }
    
    const codeHtml = `
      <div class="my-4 flex flex-col rounded-lg overflow-hidden border border-gray-200">
        <div class="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
          <div class="text-sm font-medium text-gray-700">
            ${languageDisplay}
          </div>
          <button class="code-copy-btn flex items-center justify-center text-xs text-gray-500 hover:text-navy-600 transition-colors" data-code-id="${codeId}">
            <i data-lucide="copy" class="w-3 h-3 mr-1"></i> <span>Copy</span>
          </button>
        </div>
        <pre class="bg-gray-900 text-gray-100 text-sm p-4 overflow-x-auto m-0"><code id="${codeId}" class="font-mono">${block.code}</code></pre>
      </div>
    `;
    processedText = processedText.replace(`__CODE_BLOCK_${i}__`, codeHtml);
  });
  
  // Wrap in div for proper formatting
  let html = `<div class="whitespace-pre-wrap break-words markdown-content">${processedText}</div>`;
  
  // Create message actions div
  html += `<div class="flex items-center justify-end gap-2 mt-3 pt-2 ${isUser ? "border-t border-white/20" : "border-t border-gray-100"}">
    <button class="copy-btn flex items-center text-xs ${isUser ? "text-white/80 hover:text-white" : "text-gray-500 hover:text-navy-600"} transition-colors">
      <i data-lucide="copy" class="w-3 h-3 mr-1"></i> Copy
    </button>
    ${!isUser ? `<button class="regenerate-btn flex items-center text-xs text-gray-500 hover:text-navy-600 transition-colors" data-idx="${idx}">
      <i data-lucide="refresh-cw" class="w-3 h-3 mr-1"></i> Regenerate
    </button>` : ''}
  </div>`;

  return html;
}

function regenerate(index) {
  if (!currentChatId) return;
  if (chats[currentChatId][index].role !== "assistant") return;
  
  chats[currentChatId].splice(index, 1);
  localStorage.setItem("chats", JSON.stringify(chats));
  renderChat();
  showLoading();
  
  // Resend last user message
  const lastUserMsgIndex = chats[currentChatId].findLastIndex(msg => msg.role === "user");
  if (lastUserMsgIndex >= 0) {
    fetchAnswer(lastUserMsgIndex);
  }
}

async function fetchAnswer(lastUserMsgIndex) {
  try {
    const messages = chats[currentChatId].slice(0, lastUserMsgIndex + 1);
    
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: messages,
      }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Error getting response";

    chats[currentChatId].push({ role: "assistant", content: reply });
    localStorage.setItem("chats", JSON.stringify(chats));
    renderChat();
  } catch (error) {
    chats[currentChatId].push({ role: "assistant", content: "Error: Failed to regenerate response" });
    localStorage.setItem("chats", JSON.stringify(chats));
    renderChat();
  }
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

// Auto-resize textarea
questionInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

// Send message on Shift+Enter
questionInput.addEventListener('keydown', (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    askBtn.click();
  }
});

// DOM elements
const landingPage = document.getElementById('landingPage');
const chatApp = document.getElementById('chatApp');
const startChatBtn = document.getElementById('startChatBtn');

// Start chat from landing page
startChatBtn.addEventListener('click', () => {
  landingPage.classList.add('hidden');
  chatApp.classList.remove('hidden');
  
  // If no chats exist, create a new one
  if (Object.keys(chats).length === 0) {
    newChatBtn.click();
  } else if (!currentChatId) {
    // If there are chats but none selected, select the first one
    currentChatId = Object.keys(chats)[0];
    renderChat();
  }
  
  // Focus the input
  questionInput.focus();
  
  // Set a flag in localStorage to remember the user has started a chat
  localStorage.setItem("hasUsedApp", "true");
});

// Initialize the app
function initApp() {
  // Load chats from localStorage
  const savedChats = localStorage.getItem("chats");
  if (savedChats) {
    chats = JSON.parse(savedChats);
  }
  
  // If there are saved chats, select the first one
  if (Object.keys(chats).length > 0) {
    // User has used the app before, so skip landing page
    if (!currentChatId) {
      currentChatId = Object.keys(chats)[0];
    }
    
    // Show chat app directly instead of landing page
    landingPage.classList.add('hidden');
    chatApp.classList.remove('hidden');
  }
  
  // Render the chat list
  renderChatList();
  
  // If a chat is selected, render it
  if (currentChatId) {
    renderChat();
  }
  
  // Initialize Lucide icons
  lucide.createIcons();
}

// Call initApp when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Focus input on load
questionInput.focus();

// Helper function to get a nice display name for programming languages
function getLanguageDisplayName(lang) {
  if (!lang || lang === "") return "Code";
  
  const languageMap = {
    // JavaScript and related
    'js': 'JavaScript Code',
    'javascript': 'JavaScript Code',
    'ts': 'TypeScript Code',
    'typescript': 'TypeScript Code',
    'jsx': 'React JSX Code',
    'tsx': 'React TSX Code',
    
    // Web technologies
    'html': 'HTML Code',
    'css': 'CSS Code',
    'scss': 'SCSS Code',
    'sass': 'Sass Code',
    'less': 'Less Code',
    
    // Python and related
    'py': 'Python Code',
    'python': 'Python Code',
    'ipynb': 'Jupyter Notebook',
    
    // JVM languages
    'java': 'Java Code',
    'kotlin': 'Kotlin Code',
    'groovy': 'Groovy Code',
    'scala': 'Scala Code',
    
    // C-family languages
    'c': 'C Code',
    'cpp': 'C++ Code',
    'h': 'C/C++ Header',
    'hpp': 'C++ Header',
    'cs': 'C# Code',
    'csharp': 'C# Code',
    
    // Other popular languages
    'go': 'Go Code',
    'rust': 'Rust Code',
    'rb': 'Ruby Code',
    'ruby': 'Ruby Code',
    'php': 'PHP Code',
    'swift': 'Swift Code',
    'r': 'R Code',
    'perl': 'Perl Code',
    'lua': 'Lua Code',
    'haskell': 'Haskell Code',
    'hs': 'Haskell Code',
    'elixir': 'Elixir Code',
    'ex': 'Elixir Code',
    'dart': 'Dart Code',
    
    // Shell and scripting
    'bash': 'Bash Script',
    'sh': 'Shell Script',
    'shell': 'Shell Script',
    'ps1': 'PowerShell Script',
    'powershell': 'PowerShell Script',
    'bat': 'Batch Script',
    'cmd': 'Batch Script',
    
    // Data formats
    'json': 'JSON Data',
    'xml': 'XML Data',
    'yaml': 'YAML Configuration',
    'yml': 'YAML Configuration',
    'toml': 'TOML Configuration',
    'ini': 'INI Configuration',
    'csv': 'CSV Data',
    'tsv': 'TSV Data',
    
    // Markup and documentation
    'md': 'Markdown Text',
    'markdown': 'Markdown Text',
    'tex': 'LaTeX Document',
    'latex': 'LaTeX Document',
    'rst': 'reStructuredText',
    'asciidoc': 'AsciiDoc',
    
    // Database
    'sql': 'SQL Query',
    'plsql': 'PL/SQL Code',
    'tsql': 'T-SQL Code',
    'mongodb': 'MongoDB Query',
    
    // Configuration and deployment
    'dockerfile': 'Dockerfile',
    'docker': 'Dockerfile',
    'jenkinsfile': 'Jenkins Pipeline',
    'terraform': 'Terraform Configuration',
    'tf': 'Terraform Configuration',
    'k8s': 'Kubernetes Configuration',
    'kubernetes': 'Kubernetes Configuration',
    
    // GraphQL
    'graphql': 'GraphQL Query',
    'gql': 'GraphQL Query',
    
    // Other
    'diff': 'Diff/Patch',
    'regex': 'Regular Expression',
    'makefile': 'Makefile',
    'cmake': 'CMake Configuration'
  };
  
  return languageMap[lang.toLowerCase()] || `${lang.charAt(0).toUpperCase() + lang.slice(1)} Code`;
}

// Rename chat
function renameChat(chatId, event) {
  event.stopPropagation(); // Prevent triggering the click event
  
  const currentName = chats[chatId]?.[0]?.content || "New Chat";
  
  // Create modal for renaming
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 w-80 max-w-full">
      <h3 class="text-lg font-medium mb-4">Rename Chat</h3>
      <input type="text" id="renameInput" class="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-navy-400" 
        value="${escapeHTML(currentName.length > 30 ? currentName.substring(0, 30) : currentName)}">
      <div class="flex justify-end space-x-2">
        <button id="cancelRename" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
          Cancel
        </button>
        <button id="confirmRename" class="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors">
          Save
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus the input
  const input = document.getElementById('renameInput');
  input.focus();
  input.select();
  
  // Handle cancel
  document.getElementById('cancelRename').onclick = () => {
    document.body.removeChild(modal);
  };
  
  // Handle save
  document.getElementById('confirmRename').onclick = () => {
    const newName = input.value.trim();
    if (newName !== "") {
      // If this chat has no messages yet, add the name as first message
      if (!chats[chatId] || chats[chatId].length === 0) {
        chats[chatId] = [{ role: "user", content: newName }];
      } 
      // Otherwise, update the first message
      else {
        chats[chatId][0].content = newName;
      }
      
      localStorage.setItem("chats", JSON.stringify(chats));
      renderChatList();
    }
    document.body.removeChild(modal);
  };
  
  // Handle Enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('confirmRename').click();
    } else if (e.key === 'Escape') {
      document.getElementById('cancelRename').click();
    }
  });
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Show chat menu
function showChatMenu(chatId, event) {
  event.stopPropagation();
  
  // Remove any existing menus
  const existingMenu = document.getElementById('chatMenu');
  if (existingMenu) {
    document.body.removeChild(existingMenu);
  }
  
  // Create menu
  const menu = document.createElement('div');
  menu.id = 'chatMenu';
  menu.className = 'fixed bg-gray-900 text-white rounded-lg shadow-lg z-50 py-2 w-48';
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  
  // Adjust position if menu would go off screen
  setTimeout(() => {
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
  }, 0);
  
  // Add menu items
  menu.innerHTML = `
    <button class="menu-item w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center" data-action="rename" data-chat-id="${chatId}">
      <i data-lucide="edit" class="w-4 h-4 mr-2"></i>
      <span>Rename</span>
    </button>
    <button class="menu-item w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center" data-action="delete" data-chat-id="${chatId}">
      <i data-lucide="trash-2" class="w-4 h-4 mr-2 text-red-500"></i>
      <span class="text-red-500">Delete</span>
    </button>
  `;
  
  document.body.appendChild(menu);
  lucide.createIcons();
  
  // Add event listeners to menu items
  menu.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = item.getAttribute('data-action');
      const id = item.getAttribute('data-chat-id');
      
      if (action === 'rename') {
        renameChat(id, e);
      } else if (action === 'delete') {
        deleteChat(id);
      }
      
      document.body.removeChild(menu);
    });
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', function closeMenu(e) {
    if (!menu.contains(e.target)) {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
      document.removeEventListener('click', closeMenu);
    }
  });
  
  // Close menu on escape key
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
      document.removeEventListener('keydown', escHandler);
    }
  });
}

// Delete chat
function deleteChat(chatId) {
  // Show confirmation dialog
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 w-80 max-w-full">
      <h3 class="text-lg font-medium mb-2">Delete Chat</h3>
      <p class="text-gray-600 mb-4">Are you sure you want to delete this chat? This action cannot be undone.</p>
      <div class="flex justify-end space-x-2">
        <button id="cancelDelete" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
          Cancel
        </button>
        <button id="confirmDelete" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Delete
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle cancel
  document.getElementById('cancelDelete').onclick = () => {
    document.body.removeChild(modal);
  };
  
  // Handle confirm delete
  document.getElementById('confirmDelete').onclick = () => {
    // Delete the chat
    delete chats[chatId];
    localStorage.setItem("chats", JSON.stringify(chats));
    
    // If the deleted chat was the current one, select another chat or clear
    if (chatId === currentChatId) {
      const remainingChats = Object.keys(chats);
      if (remainingChats.length > 0) {
        currentChatId = remainingChats[0];
      } else {
        currentChatId = null;
      }
    }
    
    // Re-render everything
    renderChatList();
    renderChat();
    
    // Close the modal
    document.body.removeChild(modal);
  };
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  // Handle Escape key
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      document.body.removeChild(modal);
      document.removeEventListener('keydown', escHandler);
    }
  });
}

// Theme toggle functionality
const themeToggleBtn = document.getElementById('themeToggleBtn');

// Check for saved theme preference or use system preference
function getThemePreference() {
  if (localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    return 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    return 'light';
  }
}

// Set initial theme
getThemePreference();

// Toggle theme
themeToggleBtn.addEventListener('click', () => {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
  
  // Re-initialize icons to ensure they update
  lucide.createIcons();
});

// Update theme based on system changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (!localStorage.getItem('theme')) {
    getThemePreference();
    // Re-initialize icons to ensure they update
    lucide.createIcons();
  }
});
