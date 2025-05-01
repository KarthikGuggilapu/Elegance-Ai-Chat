const API_KEY = "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"; // Replace with your key

document.getElementById("askBtn").addEventListener("click", askGroq);

async function askGroq() {
  const question = document.getElementById("question").value;
  const answerBox = document.getElementById("answer");
  answerBox.innerHTML = "<p class='text-gray-500 italic'>Thinking...</p>";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: question }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No answer received.";
    answerBox.innerHTML = formatResponseWithCodeBlocks(answer);
  } catch (error) {
    answerBox.innerHTML = `<p class="text-red-600">Error: ${error.message}</p>`;
  }
}

function formatResponseWithCodeBlocks(text) {
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const parts = text.split(codeBlockRegex);

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return `<pre class="bg-black text-green-400 text-sm rounded-lg p-4 overflow-auto"><code>${escapeHTML(part)}</code></pre>`;
    } else {
      return `<p>${part.replace(/\n/g, "<br>")}</p>`;
    }
  }).join("");
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
}
