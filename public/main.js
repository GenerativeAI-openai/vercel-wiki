function simpleMarkdownToHTML(text) {
  return text
    .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^---$/gim, '<hr>')
    .replace(/^\s*> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/~~(.*?)~~/gim, '<del>$1</del>')
    .replace(/\n/g, '<br>');
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function htmlToSimpleMarkdown(html) {
  return html
    .replace(/<h5>(.*?)<\/h5>/gim, '##### $1')
    .replace(/<h4>(.*?)<\/h4>/gim, '#### $1')
    .replace(/<h3>(.*?)<\/h3>/gim, '### $1')
    .replace(/<h2>(.*?)<\/h2>/gim, '## $1')
    .replace(/<h1>(.*?)<\/h1>/gim, '# $1')
    .replace(/<li>(.*?)<\/li>/gim, '* $1')
    .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
    .replace(/<em>(.*?)<\/em>/gim, '*$1*')
    .replace(/<del>(.*?)<\/del>/gim, '~~$1~~')
    .replace(/<hr\s*\/?>/gim, '---')
    .replace(/<blockquote>(.*?)<\/blockquote>/gim, '> $1')
    .replace(/<br\s*\/?>/gim, '\n');
}
function choseong(txt) {
  const allChoseongs = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];
  let out = '';
  for (let i = 0; i < txt.length; i++) {
    const code = txt.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const uniVal = code - 0xac00;
      const Cho = Math.floor(uniVal / (21 * 28));
      out += allChoseongs[Cho];
    } else {
      out += txt[i];
    }
  }
  return out;
}

//초성 + 문자열 검색
//예: 'ㅇㄴ123' → '안녕123'만 매칭, 'ㅇㄴ2'는 제외
function jaeum(keyword, list) {
  const keywordChoseong = choseong(keyword);

  return list.filter(word => {
    const wordChoseong = choseong(word);
    return word.includes(keyword) || wordChoseong.includes(keywordChoseong);
  });
}

//한글 포함 여부 확인
function hasHangul(txt) {
  return /[\uAC00-\uD7A3]/.test(txt);
}

function renderPost(post) {
  const postEl = document.createElement("div");
  postEl.innerHTML = `
    <div class="post-item">
      <h3>${post.title}</h3>
      <p style="font-size: 12px;">${post.content.slice(0, 50)}...</p>
      <button class="read-more" onclick="location.href='/${post.id}'">더보기</button>
      ${post.editable ? `<button class="edit-button" data-id="${post.id}" data-title="${escapeHTML(post.title)}" data-content="${escapeHTML(post.content)}">수정</button><div><button class="del-button" data-id="${post.id}">삭제</button>` : ""}
    </div>`;
  postList.appendChild(postEl);
}

function recommendTitleOnlick(title) {
  const searchInput = document.getElementById("searchInput");
  searchInput.value = title
  loadposts(title)
}

function recommendRender(post) {
  const recommend = document.querySelector(".recommend")
  const recommendTitle = document.createElement("button")
  recommendTitle.className = "recommendTitle"
  // recommendTitle.onclick = `recommendTitleOnlick("${post.title}")`
  recommendTitle.onclick = () => recommendTitleOnlick(post.title)
  recommendTitle.textContent = post.title
  recommend.appendChild(recommendTitle) 
}

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("edit-button")) {
    const id = e.target.dataset.id;
    const title = e.target.dataset.title;
    const content = e.target.dataset.content;
    editPost(id, title, content);
  }
  if (e.target.classList.contains("del-button")) {
    const id = e.target.dataset.id;
    delPost(id);
  }
});
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzWZtDMzb4cNoauLA4NvmxqO6C_ot00AA",
  authDomain: "auth.kkomaweb.com",//smssend-b82b3.firebaseapp.com
  databaseURL: "https://smssend-b82b3-default-rtdb.firebaseio.com",
  projectId: "smssend-b82b3",
  storageBucket: "smssend-b82b3.firebasestorage.app",
  messagingSenderId: "734888172114",
  appId: "1:734888172114:web:0b2c99fee212f6487c1d8b",
  measurementId: "G-J3VJPW92L2"
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
let canThisUserEdit = false
let postStartIndex = 0;
let postEndIndex = 9;
let contents = {};
// var searchFilter = "";
function loginAndLoad() {
  signInWithPopup(auth, provider).then(async (result) => {
    currentUser = result.user;
    // console.log(reslt)
    currentToken = await currentUser.getIdToken();
    await loadPosts();
  });
}

function showLoadingBar() {
  let loadingBar = document.getElementById("loading-gif");
  loadingBar.style.display = "block";//"inline-block";
}

function hideLoadingBar() {
  let loadingBar = document.getElementById("loading-gif");
  loadingBar.style.display = "none";
}
async function loadPosts(filter = "", isItFirstRequest = false, postStartIndex = 0, postEndIndex = 9) {
  // searchFilter = filter;
  const res = await fetch("/api/posts", {
    headers: {
      Authorization: `Bearer ${currentToken}`,
    },
  });
  const posts = await res.json();
  contents = posts;
  // contents = posts;
  if (isItFirstRequest) {
    postList.innerHTML = '<h1>최근 글</h1><br><div id="loading-gif"></div>';
  } else {
    postList.innerHTML = '<div id="loading-gif"></div>';
  }
  canThisUserEdit = posts?.[0].editable
  hideLoadingBar()
  if (canThisUserEdit) {
    document.getElementById("editor").style.display = "block";
  }
  posts
  .filter(post => jaeum(filter, [post.title]).length > 0)
  .slice(0, isItFirstRequest ? 5 : undefined)
  .forEach(renderPost);
//   if (isItFirstRequest) {
//     // const matchedPosts = posts.filter(post => jaeum(filter, [post.title]).length > 0);
//     posts
//       .filter(post => jaeum(filter, [post.title]).length > 0)//post.title.toLowerCase().includes(filter.toLowerCase())
//       .slice(0, 5)
//       .forEach((post) => {
//         const postEl = document.createElement("div");
//         //postEl.onclick = `location.href='/posts/${post.id}';`
//         // postEl.className = "post-item";//<p>${post.content}</p>
//         postEl.innerHTML = `<div class="post-item">
//   <h3>${post.title}</h3>
//   <p style="font-size: 12px;">${post.content.slice(0, 50)}...</p>
//   <button class="read-more" onclick="location.href='/${post.id}'">더보기</button>
//   ${post.editable ? `<button onclick="editPost('${post.id}', '${escapeJS(post.title)}', '${escapeJS(post.content)}')">수정</button>` : ""}
// </div>`;
//         // postEl.innerHTML = simpleMarkdownToHTML(`<h3>${post.title}</h3><p style="font-size: 12px;">${post.content.slice(1, 50)}</p>${post.editable ? `<button onclick="editPost('${post.id}', \`${post.title}\`, \`${post.content}\`)">수정</button>`: ""}`);
//         // postEl.innerHTML = `<div class="post-item"><h3>${post.title}</h3><p style="font-size: 12px;">${post.content.slice(0, 50)}...</p><button class="read-more" onclick="location.href='/${post.id}'">더보기</button>${post.editable ? `<button onclick=\`editPost('${post.id}', \`${post.title}\`, \`${post.content}\`)\`>수정</button></div>`: ""}`;
//         postList.appendChild(postEl);//onclick="location.href='/posts.html?id=${post.id}'"
//       });
//   } else {
//     posts
//       .filter(post => jaeum(filter, [post.title]).length > 0)
//       .forEach((post) => {
//         const postEl = document.createElement("div");
//         //postEl.onclick = `location.href='/posts/${post.id}';`
//         // postEl.className = "post-item";//<p>${post.content}</p>
//         postEl.innerHTML = `<div class="post-item">
//   <h3>${post.title}</h3>
//   <p style="font-size: 12px;">${post.content.slice(0, 50)}...</p>
//   <button class="read-more" onclick="location.href='/${post.id}'">더보기</button>
//   ${post.editable ? `<button onclick="editPost('${post.id}', '${escapeJS(post.title)}', '${escapeJS(post.content)}')">수정</button>` : ""}
// </div>`;
//         // postEl.innerHTML = simpleMarkdownToHTML(`<h3>${post.title}</h3><p style="font-size: 12px;">${post.content.slice(1, 50)}</p>${post.editable ? `<button onclick="editPost('${post.id}', \`${post.title}\`, \`${post.content}\`)">수정</button>`: ""}`);
//         // postEl.innerHTML = `<div class="post-item"><h3>${post.title}</h3><p style="font-size: 12px;">${post.content.slice(0, 50)}...</p><button class="read-more" onclick="location.href='/${post.id}'">더보기</button>${post.editable ? `<button onclick=\`editPost('${post.id}', \`${post.title}\`, \`${post.content}\`)\`>수정</button></div>`: ""}`;
//         postList.appendChild(postEl);//onclick="location.href='/posts.html?id=${post.id}'"
//       });
//   }
}

window.editPost = (id, title, content) => {
  currentEditId = id;
  titleInput.value = title;
  contentInput.value = htmlToSimpleMarkdown(content);
  const editor = document.getElementById("editor");
  editor.style.display = "block";
};

window.delPost = async (id) => {
  const res = await fetch(`/api/posts/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentToken}`,
    },
    body: JSON.stringify({ id }),
  });
  await loadPosts(); // 삭제 후 목록 새로고침
};

saveBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) return alert("제목과 내용을 모두 입력하세요");
  if (canThisUserEdit) {
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
//(!res.ok) {
  if (res.status == "405") {
    alert("저장에 실패했습니다");
    return;
  }
  if (res.status == "403") {
    alert("권한 없음");
    return;
  }
  if (res.status == "401") {
    alert("권한 없음");
    return;
  }
  if (res.status == "400") {
    alert("중복되는 제목입니다");
    return;
  }
  if (res.status == "404") {
    alert("저장에 실패했습니다");
    return;
  }

  currentEditId = null;
  titleInput.value = "";
  contentInput.value = "";
  await loadPosts();
  } else {
    alert("권한 없음")
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
    <button class="read-more" onclick="location.href='/${post.id}'">더보기</button>
    <p>❤️ 좋아요: <span id="like-${post.id}">${post.likes || 0}</span> <button onclick="likePost('${post.id}')">좋아요</button></p>
  `);
}

// function loadContents(list) {
//   list
//     .filter(post => jaeum(filter, [post.title]).length > 0)
//     .slice(postStartIndex, postEndIndex)
//     .forEach((post) => {
//       const postEl = document.createElement("div");
//       postEl.innerHTML = `<div class="post-item"><h3>${post.title}</h3><p style="font-size: 12px;">${post.content.slice(0, 50)}...</p><button class="read-more" onclick="location.href='/${post.id}'">더보기</button>${post.editable ? `<button onclick="editPost('${post.id}', \`${post.title}\`, \`${post.content}\`)">수정</button></div>`: ""}`;
//       postList.appendChild(postEl);
//     });
//   postStartIndex += 10
//   postEndIndex += 10
// }

function likePost(postId) {
  fetch('/api/posts?id=' + postId + '&like=true', { method: 'POST' })
    .then(() => {
      const el = document.getElementById('like-' + postId);
      if (el) el.innerText = parseInt(el.innerText) + 1;
    });
}

function updateFontControls() {
  const content = document.getElementById(".content");
  if (!content) return;
  document.getElementById("font-size").addEventListener("change", e => {
    content.style.fontSize = e.target.value;
  });
  document.getElementById("font-family").addEventListener("change", e => {
    content.style.fontFamily = e.target.value;
  });
}
// window.addEventListener("scroll", () => {
//   if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight) {
//       loadContents();
//     }
//   });

document.addEventListener("click", function(e) {
  const recommend = document.querySelector("recommend")
  if (e.target.id == "searchInput") {
    if (searchInput.value) {
      contents
      .filter(post => jaeum(searchInput.value, [post.title]).length > 0)
      .slice(0, 5)
      .forEach(recommendRender);
      recommend.style.display = "block"
    } else {
      recommend.style.display = "none"
    }
  } else {
    recommend.style.display = "none"
  }
})

document.addEventListener("DOMContentLoaded", updateFontControls);
// document.addEventListener("DOMContentLoaded", async () => {
//   await loadPosts();
// });

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


// document.getElementById("searchInput").addEventListener("input", function () {
//   //<button class="recommend" style="width: 268px;height: 35px;background-color: white;border-radius: 4px;border: none;margin-top: 10px;text-align: center;">공룡</button>
//   const recommend = document.querySelectorAll(".recommend")
//   if (recommend) {
//     recommend.forEach((El) => {
//       El.remove()
//     })
//   }
//   const div = document.querySelector(".header-main-div")
//   contents
//     .filter(post => jaeum(searchFilter, [post.title]).length > 0)//post.title.toLowerCase().includes(filter.toLowerCase())
//     .slice(0, 5)
//     .forEach((post) => {
//       const postEl = document.createElement("button");
//       postEl.onclick = `document.getElementById("searchInput").value = ${post.title}`
//       postEl.style.width = "268px";
//       postEl.style.height = "35px";
//       postEl.style.backgroundColor = "white";
//       postEl.style.borderRadius = "4px";
//       postEl.style.border = "none";
//       postEl.style.marginTop = "10px";
//       postEl.style.textAlign = "center";
//       postEl.className = "recommend";
//       postEl.innerHTML = `공룡<br>`
//       // postEl.textContent = post.title;
//       div.appendChild(postEl);//onclick="location.href='/posts.html?id=${post.id}'"
//   });
// })


document.addEventListener("DOMContentLoaded", () => {
  const boldBtn = document.getElementById("boldBtn");
  const italicBtn = document.getElementById("italicBtn");
  const strikeBtn = document.getElementById("strikeBtn");

  if (boldBtn) boldBtn.addEventListener("click", () => wrapSelectionWith("bold"));
  if (italicBtn) italicBtn.addEventListener("click", () => wrapSelectionWith("italic"));
  if (strikeBtn) strikeBtn.addEventListener("click", () => wrapSelectionWith("strike"));
});
document.querySelector(".login-button").addEventListener("click", function () {
  // document.querySelector(".login-dropdown").innerHTML = `<div class="login-option" id="googleLogin"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" /></div>`
  // document.querySelector(".login-dropdown").textContent = ""
  // document.getElementById("googleLogin").style.display = "block"
  if (document.querySelector(".login-dropdown").style.display == "none") {
    document.querySelector(".login-dropdown").style.display = "block"
  } else {
    document.querySelector(".login-dropdown").style.display = "none"
  }
})
const googleBtn = document.getElementById("googleLogin");
if (googleBtn) {
  googleBtn.addEventListener("click", () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider)
  })
};
// document.addEventListener("DOMContentLoaded", async () => {
//   getRedirectResult(auth)
//   .then(async (result) => {
//     if (result && result.user) {
//       currentUser = result.user;
//       currentToken = await result.user.getIdToken();
//       console.log("로그인 성공:", result.user);
//       document.querySelector(".login-button").style.display = "none";
//       document.querySelector(".login-dropdown").style.display = "none";
//       document.querySelector(".google-profile-image").src = currentUser.photoURL
//       document.querySelector(".google-profile-image").style.display = "block";
//     }
//   })
//   .catch((error) => {
//     console.error("로그인 실패:", error);
//   });
// })
let redirectLoginHandled = false;

document.addEventListener("DOMContentLoaded", async () => {
  showLoadingBar()
  await getRedirectResult(auth)
    .then(async (result) => {
      if (result && result.user) {
        redirectLoginHandled = true;
        currentUser = result.user;
        currentToken = await result.user.getIdToken();
        console.log("로그인 성공:", currentUser)
        // document.getElementById("review-section-link").style.display = "block";
        updateUserUI(currentUser);
        await loadPosts("", true);
      }
    })
    .catch((error) => {
      console.error("로그인 실패:", error);
    });
  onAuthStateChanged(auth, async (user) => {
    if (redirectLoginHandled) return;
    if (user) {
      currentUser = user;
      currentToken = await user.getIdToken();
      // document.getElementById("review-section-link").style.display = "block";
      updateUserUI(currentUser);
    }
    await loadPosts("", true);
  });
});
function updateUserUI(user) {
  const profileImg = document.querySelector(".google-profile-image");
  const loginBtn = document.querySelector(".login-button");
  const dropdown = document.querySelector(".login-dropdown");
  const googleLoginButton = document.getElementById("googleLogin");
  // document.querySelector(".google-profile-image").style.display = "block"
  if (loginBtn) loginBtn.style.display = "none";
  if (googleLoginButton) googleLoginButton.style.display = "none";
  // if (dropdown) dropdown.style.display = "none";
  if (profileImg) {
    profileImg.src = user.photoURL;
    profileImg.style.display = "block";
  }
  document.querySelector(".login-dropdown").innerHTML += `<div class="login-option" id="logout"><img src="https://cdn-icons-png.flaticon.com/512/992/992680.png"></div>`//`<div class="login-option" id="logout">로그아웃</div>`
  document.getElementById("logout").style.width = "15px"
  document.getElementById("logout").addEventListener("click", function () {
    signOut(auth).then(() => {location.reload()})
  })
  document.querySelector(".google-profile-image").addEventListener("click", function () {
    if (document.querySelector(".login-dropdown").style.display == "none") {
      document.querySelector(".login-dropdown").style.display = "block"
    } else {
      document.querySelector(".login-dropdown").style.display = "none"
    }
  })
}
