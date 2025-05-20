async function fetchPost() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  try {
    document.getElementById("post").innerText = "게시물을 불러오는 중입니다...";
    const res = await fetch(`/api/posts/${id}`);
    const post = await res.json();
    document.getElementById("post-title").innerText = post.title;
    // document.getElementById("post-likes").innerText = `❤️ 좋아요: ${post.likes || 0}`;
    document.getElementById("post-content").innerHTML = simpleMarkdownToHTML(post.content || "");
  } catch (e) {
    document.getElementById("post").innerText = "게시물을 불러오는 데 실패했습니다.";
  }
}

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

document.addEventListener("DOMContentLoaded", fetchPost);
