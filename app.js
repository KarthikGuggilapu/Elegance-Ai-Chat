const API_KEY = "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";
const chatBox = document.getElementById("chatBox");
const askBtn = document.getElementById("askBtn");
const questionInput = document.getElementById("question");

let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
renderChat();

// Send user question
askBtn.addEventListener("click", async () => {
  const question = questionInput.value.trim();
  if (!question) return;

  addMessage("user", question);
  questionInput.value = "";

  await fetchAnswer();
});

// Generate assistant answer
async function fetchAnswer(previousMessage = null) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: chatHistory,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response.";

    if (previousMessage !== null) {
      chatHistory[previousMessage] = { role: "assistant", content };
    } else {
      chatHistory.push({ role: "assistant", content });
    }

    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    renderChat();
  } catch (err) {
    addMessage("assistant", `Error: ${err.message}`);
  }
}

// Add new message
function addMessage(role, content) {
  chatHistory.push({ role, content });
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  renderChat();
}

// Render messages
function renderChat() {
  chatBox.innerHTML = "";

  chatHistory.forEach((msg, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = `flex ${msg.role === "user" ? "justify-end" : "justify-start"}`;

    const bubble = document.createElement("div");
    bubble.className = `relative bg-${msg.role === "user" ? "blue-500 text-white" : "gray-100 text-gray-800"} rounded-xl px-4 py-3 max-w-[80%] whitespace-pre-wrap`;

    const contentHTML = formatWithCodeBlocks(msg.content, idx, msg.role === "assistant");
    bubble.innerHTML = contentHTML;

    wrapper.appendChild(bubble);
    chatBox.appendChild(wrapper);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Format content with code
function formatWithCodeBlocks(text, idx, isAssistant) {
  const codeRegex = /```([\s\S]*?)```/g;
  const parts = text.split(codeRegex);
  let html = "";

  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      html += `
        <pre class="bg-black text-green-400 text-xs rounded-lg p-2 overflow-x-auto mt-2 mb-2 relative group">
          <code>${escapeHTML(part)}</code>
          <button class="absolute bottom-1 right-1 bg-white/10 text-white text-xs px-2 py-1 rounded hover:bg-white/30 transition" onclick="navigator.clipboard.writeText(\`${escapeBackticks(part)}\`).then(()=>this.innerText='Copied!')">📋 Copy Code</button>
        </pre>`;
    } else {
      html += `<div>${part.replace(/\n/g, "<br>")}</div>`;
    }
  });

  if (isAssistant) {
    html += `
      <div class="text-right mt-2">
        <button onclick="regenerate(${idx})" class="text-xs text-blue-500 hover:underline">🔁 Regenerate</button>
      </div>`;
  }

  return html;
}

// Regenerate an assistant response
function regenerate(index) {
  // Remove current assistant response at index
  chatHistory.splice(index, 1);
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  renderChat();
  fetchAnswer(index); // regenerate response in same index
}

// HTML escaping
function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeBackticks(str) {
  return str.replace(/`/g, "\\`").replace(/\$/g, "\\$");
}
