const SETTINGS_KEY = "habit-settings";
const COMPLETIONS_KEY = "habit-completions";

const habitForm = document.getElementById("habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitGoalSelect = document.getElementById("habit-goal");
const weeklyGoalField = document.getElementById("weekly-goal-field");
const monthlyGoalField = document.getElementById("monthly-goal-field");
const weeklyGoalInput = document.getElementById("weekly-goal");
const monthlyGoalInput = document.getElementById("monthly-goal");
const customDaysField = document.getElementById("custom-days-field");
const summaryGoal = document.getElementById("summary-goal");
const summaryToday = document.getElementById("summary-today");
const summaryProgress = document.getElementById("summary-progress");
const habitGrid = document.getElementById("habit-grid");

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const getDefaultSettings = () => ({
  name: "Meu hábito",
  goal: "daily",
  weeklyTarget: 3,
  monthlyTarget: 12,
  customDays: [1, 2, 3],
});

const loadSettings = () => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    return getDefaultSettings();
  }
  try {
    return { ...getDefaultSettings(), ...JSON.parse(stored) };
  } catch {
    return getDefaultSettings();
  }
};

const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const loadCompletions = () => {
  const stored = localStorage.getItem(COMPLETIONS_KEY);
  if (!stored) {
    return {};
  }
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
};

const saveCompletions = (completions) => {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
};

const formatDateKey = (date) => date.toISOString().split("T")[0];

const startOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getDatesRange = (days) => {
  const today = new Date();
  const dates = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }
  return dates;
};

const isTargetDate = (date, settings) => {
  if (settings.goal === "custom") {
    return settings.customDays.includes(date.getDay());
  }
  return true;
};

const describeGoal = (settings) => {
  switch (settings.goal) {
    case "daily":
      return "Objetivo diário: marcar todos os dias.";
    case "weekly":
      return `Objetivo semanal: ${settings.weeklyTarget} dias por semana.`;
    case "monthly":
      return `Objetivo mensal: ${settings.monthlyTarget} dias por mês.`;
    case "custom":
      return `Dias específicos: ${settings.customDays
        .map((day) => weekdayLabels[day])
        .join(", ")}.`;
    default:
      return "";
  }
};

const calculateProgress = (settings, completions) => {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const todayDone = Boolean(completions[todayKey]);

  if (settings.goal === "daily") {
    return {
      today: todayDone ? "Feito" : "Pendente",
      progress: todayDone ? "1/1" : "0/1",
    };
  }

  if (settings.goal === "weekly") {
    const start = startOfWeek(today);
    const weekDates = getDatesRange(7).filter((date) => date >= start);
    const done = weekDates.reduce(
      (acc, date) => acc + (completions[formatDateKey(date)] ? 1 : 0),
      0
    );
    return {
      today: todayDone ? "Feito" : "Pendente",
      progress: `${done}/${settings.weeklyTarget}`,
    };
  }

  if (settings.goal === "monthly") {
    const start = startOfMonth(today);
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const monthDates = getDatesRange(daysInMonth).filter((date) => date >= start);
    const done = monthDates.reduce(
      (acc, date) => acc + (completions[formatDateKey(date)] ? 1 : 0),
      0
    );
    return {
      today: todayDone ? "Feito" : "Pendente",
      progress: `${done}/${settings.monthlyTarget}`,
    };
  }

  const weekStart = startOfWeek(today);
  const weekDates = getDatesRange(7).filter((date) => date >= weekStart);
  const targetCount = weekDates.filter((date) => isTargetDate(date, settings)).length;
  const done = weekDates.reduce((acc, date) => {
    if (!isTargetDate(date, settings)) {
      return acc;
    }
    return acc + (completions[formatDateKey(date)] ? 1 : 0);
  }, 0);

  return {
    today: todayDone ? "Feito" : "Pendente",
    progress: `${done}/${targetCount}`,
  };
};

const renderSummary = (settings, completions) => {
  summaryGoal.textContent = describeGoal(settings);
  const { today, progress } = calculateProgress(settings, completions);
  summaryToday.textContent = today;
  summaryProgress.textContent = progress;
};

const renderForm = (settings) => {
  habitNameInput.value = settings.name;
  habitGoalSelect.value = settings.goal;
  weeklyGoalInput.value = settings.weeklyTarget;
  monthlyGoalInput.value = settings.monthlyTarget;
  Array.from(customDaysField.querySelectorAll("input")).forEach((input) => {
    input.checked = settings.customDays.includes(Number(input.value));
  });

  weeklyGoalField.style.display = settings.goal === "weekly" ? "grid" : "none";
  monthlyGoalField.style.display = settings.goal === "monthly" ? "grid" : "none";
  customDaysField.style.display = settings.goal === "custom" ? "flex" : "none";
};

const renderGrid = (settings, completions) => {
  habitGrid.innerHTML = "";
  const dates = getDatesRange(84);
  const todayKey = formatDateKey(new Date());
  const columns = Math.ceil(dates.length / 7);

  for (let col = 0; col < columns; col += 1) {
    const column = document.createElement("div");
    column.className = "day-column";

    for (let row = 0; row < 7; row += 1) {
      const index = col * 7 + row;
      if (index >= dates.length) {
        break;
      }
      const date = dates[index];
      const key = formatDateKey(date);
      const square = document.createElement("button");
      square.type = "button";
      square.className = "day";
      square.title = `${key} (${weekdayLabels[date.getDay()]})`;
      square.dataset.date = key;

      if (key === todayKey) {
        square.classList.add("day--today");
      }

      if (completions[key]) {
        square.classList.add("day--done");
      }

      if (!isTargetDate(date, settings)) {
        square.classList.add("day--inactive");
        square.setAttribute("aria-disabled", "true");
      }

      square.addEventListener("click", () => {
        if (!isTargetDate(date, settings)) {
          return;
        }
        completions[key] = !completions[key];
        saveCompletions(completions);
        renderGrid(settings, completions);
        renderSummary(settings, completions);
      });

      column.appendChild(square);
    }
    habitGrid.appendChild(column);
  }
};

const updateView = (settings, completions) => {
  renderForm(settings);
  renderSummary(settings, completions);
  renderGrid(settings, completions);
};

let settings = loadSettings();
let completions = loadCompletions();

updateView(settings, completions);

habitGoalSelect.addEventListener("change", (event) => {
  settings = { ...settings, goal: event.target.value };
  updateView(settings, completions);
});

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const customDays = Array.from(
    customDaysField.querySelectorAll("input:checked")
  ).map((input) => Number(input.value));

  settings = {
    ...settings,
    name: habitNameInput.value.trim() || "Meu hábito",
    goal: habitGoalSelect.value,
    weeklyTarget: Number(weeklyGoalInput.value),
    monthlyTarget: Number(monthlyGoalInput.value),
    customDays: customDays.length ? customDays : settings.customDays,
  };

  saveSettings(settings);
  updateView(settings, completions);
});
