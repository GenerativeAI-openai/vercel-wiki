
function simpleMarkdownToHTML(text) {
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/~~(.*?)~~/gim, '<del>$1</del>')
    .replace(/^---$/gim, '<hr>')
    .replace(/\n/g, '<br>');
}

function htmlToSimpleMarkdown(html) {
  return html
    .replace(/<h3>(.*?)<\/h3>/gim, '### $1')
    .replace(/<h2>(.*?)<\/h2>/gim, '## $1')
    .replace(/<h1>(.*?)<\/h1>/gim, '# $1')

    .replace(/<li>(.*?)<\/li>/gim, '* $1')

    .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
    .replace(/<em>(.*?)<\/em>/gim, '*$1*')

    .replace(/<del>(.*?)<\/del>/gim, '~~$1~~')

    .replace(/<hr\s*\/?>/gim, '---')

    .replace(/<br\s*\/?>/gim, '\n');
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzWZtDMzb4cNoauLA4NvmxqO6C_ot00AA",
  authDomain: "smssend-b82b3.firebaseapp.com"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let currentToken = null;
let currentEditId = null;

const postList = document.getElementById("post-list");
const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const saveBtn = document.getElementById("saveBtn");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");

function loginAndLoad() {
  signInWithPopup(auth, provider).then(async (result) => {
    currentUser = result.user;
    currentToken = await currentUser.getIdToken();
    await loadPosts();
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    currentToken = await user.getIdToken();
    await loadPosts();
  } else {
    loginAndLoad();
  }
});

async function loadPosts(filter = "") {
  console.log(`검색어: ${filter}`)
  const res = await fetch("/api/posts", {
    headers: {
      Authorization: `Bearer ${currentToken}`,
    },
  });
  const posts = await res.json();
  postList.innerHTML = "";
  const canThisUserEdit = posts?.[0].editable
  if (canThisUserEdit) {
    document.getElementById("editor").style.display = "block";
  }
  posts
    .filter(post => post.title.toLowerCase().includes(filter.toLowerCase()))
    .forEach((post) => {
      const postEl = document.createElement("div");
      //postEl.onclick = `location.href='/posts/${post.id}';`
      // postEl.className = "post-item";//<p>${post.content}</p>
      // postEl.innerHTML = simpleMarkdownToHTML(`<h3>${post.title}</h3><p style="font-size: 12px;">${post.content.slice(1, 50)}</p>${post.editable ? `<button onclick="editPost('${post.id}', \`${post.title}\`, \`${post.content}\`)">수정</button>`: ""}`);
      postEl.innerHTML = `<div class="post-item"><h3>${post.title}</h3><p style="font-size: 12px;">${post.content.slice(0, 50)}...</p><button class="read-more" onclick="location.href='/posts.html?id=${post.id}'">더보기</button>${post.editable ? `<button onclick="editPost('${post.id}', \`${post.title}\`, \`${post.content}\`)">수정</button></div>`: ""}`;
      postList.appendChild(postEl);//onclick="location.href='/posts.html?id=${post.id}'"
    });
}

window.editPost = (id, title, content) => {
  currentEditId = id;
  titleInput.value = title;
  contentInput.value = content;
  const editor = document.getElementById("editor");
  editor.style.display = "block";
};

saveBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) return alert("제목과 내용을 입력해주세요.");
  if (true) {
  const endpoint = currentEditId ? `/api/posts/${currentEditId}` : `/api/posts`;
  const method = currentEditId ? "PUT" : "POST";

  const res = await fetch(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentToken}`,
    },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    alert("저장에 실패했습니다.");
    return;
  }

  currentEditId = null;
  titleInput.value = "";
  contentInput.value = "";
  await loadPosts();
  }
});

searchBtn.addEventListener("click", () => {
  const keyword = searchInput.value.trim();
  loadPosts(keyword);
});



function applyPostFormatting(postEl, post) {
  const contentPreview = post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content;
  postEl.innerHTML = simpleMarkdownToHTML(`
    <h3><a href="/post?id=${post.id}">${post.title}</a></h3>
    <p>${contentPreview}</p>
    <button class="read-more" onclick="location.href='/post?id=${post.id}'">더보기</button>
    <p>❤️ 좋아요: <span id="like-${post.id}">${post.likes || 0}</span> <button onclick="likePost('${post.id}')">좋아요</button></p>
  `);
}

function likePost(postId) {
  fetch('/api/posts?id=' + postId + '&like=true', { method: 'POST' })
    .then(() => {
      const el = document.getElementById('like-' + postId);
      if (el) el.innerText = parseInt(el.innerText) + 1;
    });
}

function updateFontControls() {
  const content = document.getElementById("content");
  if (!content) return;
  document.getElementById("font-size").addEventListener("change", e => {
    content.style.fontSize = e.target.value;
  });
  document.getElementById("font-family").addEventListener("change", e => {
    content.style.fontFamily = e.target.value;
  });
}

document.addEventListener("DOMContentLoaded", updateFontControls);



function wrapSelectionWith(tag) {
  const textarea = document.getElementById("contentInput");
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.substring(0, start);
  const selected = textarea.value.substring(start, end);
  const after = textarea.value.substring(end);

  let wrapper = "";
  if (tag === "bold") wrapper = "**";
  if (tag === "italic") wrapper = "*";
  if (tag === "strike") wrapper = "~~";

  textarea.value = before + wrapper + selected + wrapper + after;
  textarea.focus();
  textarea.selectionStart = start;
  textarea.selectionEnd = end + wrapper.length * 2;
}

document.addEventListener("DOMContentLoaded", () => {
  const boldBtn = document.getElementById("boldBtn");
  const italicBtn = document.getElementById("italicBtn");
  const strikeBtn = document.getElementById("strikeBtn");

  if (boldBtn) boldBtn.addEventListener("click", () => wrapSelectionWith("bold"));
  if (italicBtn) italicBtn.addEventListener("click", () => wrapSelectionWith("italic"));
  if (strikeBtn) strikeBtn.addEventListener("click", () => wrapSelectionWith("strike"));
});
