const app = document.getElementById("app");
const toc = document.getElementById("toc");
const navLinks = document.querySelectorAll(".nav-link[data-route]");

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

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function buildArticleTOC() {
  const headings = app.querySelectorAll(".article-content h1, .article-content h2, .article-content h3");
  if (!headings.length) {
    toc.innerHTML = "";
    return;
  }

  const usedIds = new Set();

  headings.forEach((heading, index) => {
    let baseId = slugify(heading.textContent) || `section-${index + 1}`;
    let finalId = baseId;

    let counter = 1;
    while (usedIds.has(finalId)) {
      finalId = `${baseId}-${counter}`;
      counter++;
    }

    usedIds.add(finalId);
    heading.id = finalId;
  });

  const items = Array.from(headings).map(heading => {
    return `
      <li>
        <a href="#${heading.id}" class="toc-anchor">${heading.textContent}</a>
      </li>
    `;
  }).join("");

  toc.innerHTML = `
    <div class="toc-title">On this page</div>
    <ul class="toc-list">
      ${items}
    </ul>
  `;

  document.querySelectorAll(".toc-anchor").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const targetId = link.getAttribute("href").replace("#", "");
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function renderWritings() {
  setActiveNav("writings");
  toc.innerHTML = `
    <div class="toc-title">Topics</div>
    <ul class="toc-list">
      ${articles.map(article => `
        <li><a href="#article-${article.id}">${article.title}</a></li>
      `).join("")}
    </ul>
  `;

  app.innerHTML = `
    <section class="page-wrap">
      <h1 class="page-title">My Writings</h1>
      <p class="page-subtitle">A collection of articles and notes.</p>

      <ul class="topic-list">
        ${articles.map(article => `
          <li class="topic-item" data-article-id="${article.id}">
            <div class="topic-title">${article.title}</div>
            <div class="topic-desc">${article.description || ""}</div>
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
  toc.innerHTML = "";

  const experienceHtml = `
    <div class="experience-list">
      <div class="experience-item">
        <h3>Your Job Title</h3>
        <p class="experience-meta">Company Name · Start Date - End Date</p>
        <p>Brief description of your responsibilities and achievements.</p>
      </div>

      <div class="experience-item">
        <h3>Your Previous Job Title</h3>
        <p class="experience-meta">Company Name · Start Date - End Date</p>
        <p>Brief description of your responsibilities and achievements.</p>
      </div>
    </div>
  `;

  app.innerHTML = `
    <section class="page-wrap profile-page">
      <div class="profile-top">
        <div class="profile-photo-wrap">
          <img
            src="./profile.jpg"
            alt="Profile photo"
            class="profile-photo"
          />
        </div>

        <div class="profile-details">
          <h1 class="page-title">Santosh Shet</h1>
          <p><strong>About:</strong> I write about technology, learning, and personal ideas.</p>
          <p><strong>Interests:</strong> LLM, Language Models, Jailbraking, Context Engineering, Agents </p>
          <p><strong>Contact:</strong> santo.shet@gmail.com</p>
        </div>
      </div>

      <div class="profile-section">
        <h2 class="section-title">Experience</h2>
        ${experienceHtml}
      </div>
    </section>
  `;
}

async function renderArticle(articleId) {
  const article = articles.find(item => item.id === articleId);

  if (!article) {
    toc.innerHTML = "";
    app.innerHTML = `
      <section class="page-wrap">
        <h1 class="page-title">Article not found</h1>
        <p class="muted-text">The requested article could not be found.</p>
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
      <article class="article-shell">
        <a class="back-link" href="#writings">← Back to My Writings</a>
        <h1 class="article-title">${article.title}</h1>
        <p class="article-meta">${article.date || ""}</p>
        <div class="article-content">
          ${articleHtml}
        </div>
      </article>
    `;

    buildArticleTOC();
  } catch (error) {
    toc.innerHTML = "";
    app.innerHTML = `
      <section class="page-wrap">
        <a class="back-link" href="#writings">← Back to My Writings</a>
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
    toc.innerHTML = "";
    app.innerHTML = `
      <section class="page-wrap">
        <h1 class="page-title">Setup error</h1>
        <p class="muted-text">Could not load the article list.</p>
        <p class="error-text">Make sure articles/articles.json exists and is valid JSON.</p>
      </section>
    `;
  }
}

init();
