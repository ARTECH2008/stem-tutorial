// ---------- storage helpers ----------
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ---------- greeting ----------
function showGreeting() {
  const name = load("studentName", "");
  setText("greeting", name ? "Welcome, " + name : "Welcome, student");
}
const changeBtn = document.getElementById("changeName");
if (changeBtn) {
  changeBtn.addEventListener("click", function () {
    const n = prompt("Enter your name");
    if (n && n.trim()) { save("studentName", n.trim()); showGreeting(); }
  });
}

// ---------- courses ----------
let courses = load("courses", []);

const DAYS = [["Mon", "Monday"], ["Tue", "Tuesday"], ["Wed", "Wednesday"],
              ["Thu", "Thursday"], ["Fri", "Friday"]];

function fmt(t) {
  const parts = t.split(":").map(Number);
  const ap = parts[0] >= 12 ? "pm" : "am";
  const h12 = parts[0] % 12 || 12;
  return h12 + ":" + String(parts[1]).padStart(2, "0") + " " + ap;
}

function updateStats() {
  const units = courses.reduce((s, c) => s + c.units, 0);
  const done = courses.filter(c => c.done).length;
  const pct = courses.length ? Math.round(done / courses.length * 100) : 0;
  setText("statCourses", courses.length);
  setText("statUnits", units);
  setText("statDone", pct + "%");
}

function renderTimetable() {
  const box = document.getElementById("timetable");
  if (!box) return;
  box.innerHTML = "";
  let any = false;

  DAYS.forEach(function (d) {
    const items = courses
      .filter(c => c.day === d[0] && c.start && c.end)
      .sort((a, b) => a.start.localeCompare(b.start));
    if (!items.length) return;
    any = true;

    const h = document.createElement("h4");
    h.textContent = d[1];
    box.appendChild(h);

    items.forEach(function (c) {
      const clash = items.some(o => o !== c && c.start < o.end && o.start < c.end);
      const row = document.createElement("div");
      row.className = "slot" + (clash ? " clash" : "");

      const time = document.createElement("span");
      time.className = "slot-time";
      time.textContent = fmt(c.start) + " – " + fmt(c.end);

      const name = document.createElement("span");
      name.className = "slot-name";
      name.textContent = c.code + (c.venue ? " · " + c.venue : "");

      row.append(time, name);
      if (clash) {
        const tag = document.createElement("span");
        tag.className = "clash-tag";
        tag.textContent = "Clash";
        row.appendChild(tag);
      }
      box.appendChild(row);
    });
  });

  if (!any) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Add a day and time to a course and it will show here.";
    box.appendChild(p);
  }
}

function renderCourses() {
  const list = document.getElementById("courseList");
  if (!list) return;
  list.innerHTML = "";

  courses.forEach(function (c, i) {
    const li = document.createElement("li");
    if (c.done) li.className = "done";

    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = c.done;
    box.addEventListener("change", function () {
      courses[i].done = box.checked;
      save("courses", courses);
      renderCourses();
    });

    const info = document.createElement("div");
    info.className = "course-info";
    const strong = document.createElement("strong");
    strong.textContent = c.code;
    const small = document.createElement("small");
    small.textContent = c.title + " · " + c.units + " units · " + c.status;
    info.append(strong, document.createElement("br"), small);

    const del = document.createElement("button");
    del.className = "remove";
    del.textContent = "×";
    del.setAttribute("aria-label", "Remove " + c.code);
    del.addEventListener("click", function () {
      courses.splice(i, 1);
      save("courses", courses);
      renderCourses();
    });

    li.append(box, info, del);
    list.appendChild(li);
  });

  updateStats();
  renderTimetable();
}

const form = document.getElementById("courseForm");
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const day = document.getElementById("cDay").value;
    const start = document.getElementById("cStart").value;
    const end = document.getElementById("cEnd").value;
    if (day && (!start || !end || start >= end)) {
      alert("Enter a start time and an end time that is later than the start.");
      return;
    }
    courses.push({
      code: document.getElementById("cCode").value.trim().toUpperCase(),
      title: document.getElementById("cTitle").value.trim(),
      units: Number(document.getElementById("cUnits").value),
      status: document.getElementById("cStatus").value,
      day: day,
      start: start,
      end: end,
      venue: document.getElementById("cVenue").value.trim(),
      done: false
    });
    save("courses", courses);
    form.reset();
    renderCourses();
  });
}

const sample = [
  { code: "COS201", title: "Computer Programming I", units: 3, status: "C",
    day: "Tue", start: "14:00", end: "16:00", venue: "H" },
  { code: "CSC213", title: "Discrete structure", units: 2, status: "C" },
  { code: "CSC241", title: "Computer Vision", units: 3, status: "E" },
  { code: "CSC243", title: "Web Design and Data Security", units: 3, status: "E" },
  { code: "ENT211", title: "Entrepreneurship and Innovation", units: 2, status: "C",
    day: "Thu", start: "12:00", end: "14:00", venue: "H" },
  { code: "IFT211", title: "Digital Logic Design", units: 2, status: "C",
    day: "Fri", start: "08:00", end: "10:00" },
  { code: "MTH241", title: "Mathematical Methods I", units: 2, status: "C",
    day: "Tue", start: "14:00", end: "16:00" },
  { code: "SEN201", title: "Introduction to Software Engineering", units: 2, status: "C",
    day: "Thu", start: "10:00", end: "12:00", venue: "NE" }
];
const loadBtn = document.getElementById("loadSample");
if (loadBtn) {
  loadBtn.addEventListener("click", function () {
    if (courses.length && !confirm("Replace your current courses?")) return;
    courses = sample.map(c => ({ ...c, done: false }));
    save("courses", courses);
    renderCourses();
  });
}

showGreeting();
renderCourses();