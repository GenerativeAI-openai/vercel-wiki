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
  const res = await fetch("/api/posts", {
    headers: {
      Authorization: `Bearer ${currentToken}`,
    },
  });
  const posts = await res.json();
  postList.innerHTML = "";

  posts
    .filter(post => post.title.includes(filter))
    .forEach((post) => {
      const postEl = document.createElement("div");
      postEl.className = "post-item";
      postEl.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        ${
          post.editable
            ? `<button onclick="editPost('${post.id}', \`${post.title}\`, \`${post.content}\`)">수정</button>`
            : ""
        }
      `;
      postList.appendChild(postEl);
    });
}

window.editPost = (id, title, content) => {
  currentEditId = id;
  titleInput.value = title;
  contentInput.value = content;
};

saveBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) return alert("제목과 내용을 입력해주세요.");

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
});

searchBtn.addEventListener("click", () => {
  const keyword = searchInput.value.trim();
  loadPosts(keyword);
});
