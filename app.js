const grid = document.querySelector("#project-grid");
const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}

function formatDate(value) {
  if (!value) return "未标注日期";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function renderProjects(projects) {
  if (!grid) return;

  if (!Array.isArray(projects) || projects.length === 0) {
    grid.innerHTML = '<p class="muted">还没有登记作品。把页面加入 works/ 后，在 projects.json 中添加入口。</p>';
    return;
  }

  grid.innerHTML = projects
    .map((project) => {
      const title = escapeHtml(project.title || "Untitled");
      const href = escapeHtml(project.href || "#");
      const date = escapeHtml(formatDate(project.date));
      const description = escapeHtml(project.description || "通过 EdgeOne Maker 发布的 vibe coding 页面。");

      return `
        <a class="project-card" href="${href}">
          <p class="project-card__meta">${date}</p>
          <h3>${title}</h3>
          <p class="project-card__description">${description}</p>
          <span class="project-card__link">打开页面</span>
        </a>
      `;
    })
    .join("");
}

fetch("projects.json", { cache: "no-store" })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load projects.json: ${response.status}`);
    }

    return response.json();
  })
  .then((projects) => renderProjects(projects))
  .catch(() => {
    renderProjects([]);
  });
