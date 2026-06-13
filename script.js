const app = document.getElementById("app");
const navLinks = document.querySelectorAll(".nav-link");

let articles = [];

function setActiveNav(route) {
  navLinks.forEach(link => {
    link.classList.toggle("active", link.dataset.route === route);
  });
}

async function loadArticlesList() {
  const response = await fetch("./articles/articles.json");

  if (!response.ok) {
    throw new Error("Could not load articles.json");
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("articles.json must contain an array");
  }

  return data;
}

function renderWritings() {
  setActiveNav("writings");

  app.innerHTML = `
    <section class="card">
      <h1 class="page-title">My Writings</h1>
      <p class="page-subtitle">Click on a topic to read the full article.</p>
      <ul class="topic-list">
        ${articles.map(article => `
          <li class="topic-item" data-article-id="${article.id}">
            <h2 class="topic-title">${article.title}</h2>
            <p class="topic-desc">${article.description || ""}</p>
          </li>
        `).join("")}
      </ul>
    </section>
  `;

  document.querySelectorAll(".topic-item").forEach(item => {
    item.addEventListener("click", () => {
      const articleId = item.getAttribute("data-article-id");
      location.hash = `article-${articleId}`;
    });
  });
}

function renderProfile() {
  setActiveNav("profile");

  app.innerHTML = `
    <section class="card profile-box">
      <h1 class="page-title">Profile</h1>
      <p><strong>Name:</strong> Your Name</p>
      <p><strong>About:</strong> I write about technology, learning, and personal ideas.</p>
      <p><strong>Interests:</strong> Web development, JavaScript, HTML, CSS, and writing.</p>
      <p><strong>Contact:</strong> your-email@example.com</p>
    </section>
  `;
}

async function renderArticle(articleId) {
  const article = articles.find(item => item.id === articleId);

  if (!article) {
    app.innerHTML = `
      <section class="card">
        <h1 class="page-title">Article not found</h1>
        <button class="back-btn" onclick="location.hash='writings'">Back to My Writings</button>
      </section>
    `;
    return;
  }

  try {
    const response = await fetch(`./articles/${article.file}`);

    if (!response.ok) {
      throw new Error("Article file not found");
    }

    const articleHtml = await response.text();

    setActiveNav("writings");

    app.innerHTML = `
      <section class="card">
        <button class="back-btn" onclick="location.hash='writings'">← Back to My Writings</button>
        <h1 class="article-title">${article.title}</h1>
        <p class="article-meta">${article.date || ""}</p>
        <div class="article-content">
          ${articleHtml}
        </div>
      </section>
    `;
  } catch (error) {
    app.innerHTML = `
      <section class="card">
        <button class="back-btn" onclick="location.hash='writings'">← Back to My Writings</button>
        <h1 class="article-title">${article.title}</h1>
        <p class="error-text">Could not load the article content.</p>
      </section>
    `;
  }
}

async function router() {
  const hash = location.hash.replace("#", "");

  if (!hash || hash === "writings") {
    renderWritings();
    return;
  }

  if (hash === "profile") {
    renderProfile();
    return;
  }

  if (hash.startsWith("article-")) {
    const articleId = hash.replace("article-", "");
    await renderArticle(articleId);
    return;
  }

  renderWritings();
}

async function init() {
  try {
    articles = await loadArticlesList();

    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        const route = link.dataset.route;
        location.hash = route;
      });
    });

    window.addEventListener("hashchange", router);
    await router();
  } catch (error) {
    app.innerHTML = `
      <section class="card">
        <h1 class="page-title">Setup error</h1>
        <p class="page-subtitle">Could not load the article list.</p>
        <p class="error-text">Make sure articles/articles.json exists and is valid JSON.</p>
      </section>
    `;
  }
}

init();
