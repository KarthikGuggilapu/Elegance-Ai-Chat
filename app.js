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
  chats[currentChatId] = [];
  localStorage.setItem("chats", JSON.stringify(chats));
  renderChatList();
  renderChat();
  questionInput.focus();
};

// Load selected chat
function loadChat(chatId) {
  currentChatId = chatId;
  renderChat();
  questionInput.focus();
}

// Ask question
askBtn.onclick = async () => {
  const q = questionInput.value.trim();
  if (!q || !currentChatId) return;
  questionInput.value = "";
  questionInput.style.height = 'auto';

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
        model: "llama3-8b-8192",
        messages: chats[currentChatId],
      }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Error getting response";

    chats[currentChatId].push({ role: "assistant", content: reply });
    localStorage.setItem("chats", JSON.stringify(chats));
    renderChat();
  } catch (error) {
    chats[currentChatId].push({ role: "assistant", content: "Error: Failed to fetch response" });
    localStorage.setItem("chats", JSON.stringify(chats));
    renderChat();
  }
};

// Render sidebar
function renderChatList() {
  chatList.innerHTML = "";
  Object.keys(chats).reverse().forEach(id => {
    const firstMessage = chats[id]?.[0]?.content || "New Chat";
    const previewText = firstMessage.length > 30 
      ? firstMessage.substring(0, 30) + '...' 
      : firstMessage;
    
    const lastMessageTime = id.split('_')[1] ? new Date(parseInt(id.split('_')[1])) : new Date();
    const timeString = lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const el = document.createElement("div");
    el.className = `flex items-center justify-between cursor-pointer px-3 py-2.5 rounded-lg hover:bg-navy-50 transition-colors ${id === currentChatId ? "bg-navy-50 font-medium text-navy-700" : ""}`;
    el.innerHTML = `
      <div class="flex items-center min-w-0">
        <div class="w-3 h-3 rounded-full mr-2 ${id === currentChatId ? "bg-navy-600" : "bg-gray-300"}"></div>
        <span class="truncate">${escapeHTML(previewText)}</span>
      </div>
      <span class="text-xs text-gray-500 whitespace-nowrap ml-2">${timeString}</span>
    `;
    el.onclick = () => loadChat(id);
    chatList.appendChild(el);
  });
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

// Show loading dots
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

// Code formatting & copy
function formatWithCodeBlocks(text, idx, isUser) {
  const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts = text.split(codeRegex);
  let html = "";

  parts.forEach((part, i) => {
    if (i % 3 === 2) { // Code block
      const language = parts[i-1] || '';
      html += `
        <div class="my-2 relative">
          ${language ? `<div class="text-xs text-gray-500 mb-1">${language}</div>` : ''}
          <pre class="bg-gray-800 text-gray-100 text-sm rounded-lg p-3 overflow-x-auto">
            <code>${escapeHTML(part)}</code>
          </pre>
        </div>
      `;
    } else if (i % 3 === 0 && part) { // Regular text
      html += `<div class="whitespace-pre-wrap">${escapeHTML(part)}</div>`;
    }
  });

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

// Init
if (!currentChatId && Object.keys(chats).length > 0) {
  currentChatId = Object.keys(chats)[0];
}
renderChatList();
renderChat();

// Focus input on load
questionInput.focus();
