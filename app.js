const HABITS_KEY = "habits";

const habitForm = document.getElementById("habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitGoalSelect = document.getElementById("habit-goal");
const weeklyGoalField = document.getElementById("weekly-goal-field");
const monthlyGoalField = document.getElementById("monthly-goal-field");
const weeklyGoalInput = document.getElementById("weekly-goal");
const monthlyGoalInput = document.getElementById("monthly-goal");
const customDaysField = document.getElementById("custom-days-field");
const habitsList = document.getElementById("habits-list");

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const getDefaultSettings = () => ({
  name: "Meu hábito",
  goal: "daily",
  weeklyTarget: 3,
  monthlyTarget: 12,
  customDays: [1, 2, 3],
});

const createHabit = (settings) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  ...settings,
  completions: {},
});

const loadHabits = () => {
  const stored = localStorage.getItem(HABITS_KEY);
  if (!stored) {
    return [createHabit(getDefaultSettings())];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [createHabit(getDefaultSettings())];
  } catch {
    return [createHabit(getDefaultSettings())];
  }
};

const saveHabits = (habits) => {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
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

const isTargetDate = (date, habit) => {
  if (habit.goal === "custom") {
    return habit.customDays.includes(date.getDay());
  }
  return true;
};

const describeGoal = (habit) => {
  switch (habit.goal) {
    case "daily":
      return "Objetivo diário: marcar todos os dias.";
    case "weekly":
      return `Objetivo semanal: ${habit.weeklyTarget} dias por semana.`;
    case "monthly":
      return `Objetivo mensal: ${habit.monthlyTarget} dias por mês.`;
    case "custom":
      return `Dias específicos: ${habit.customDays
        .map((day) => weekdayLabels[day])
        .join(", ")}.`;
    default:
      return "";
  }
};

const calculateProgress = (habit) => {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const todayDone = Boolean(habit.completions[todayKey]);

  if (habit.goal === "daily") {
    return {
      today: todayDone ? "Feito" : "Pendente",
      progress: todayDone ? "1/1" : "0/1",
    };
  }

  if (habit.goal === "weekly") {
    const start = startOfWeek(today);
    const weekDates = getDatesRange(7).filter((date) => date >= start);
    const done = weekDates.reduce(
      (acc, date) => acc + (habit.completions[formatDateKey(date)] ? 1 : 0),
      0
    );
    return {
      today: todayDone ? "Feito" : "Pendente",
      progress: `${done}/${habit.weeklyTarget}`,
    };
  }

  if (habit.goal === "monthly") {
    const start = startOfMonth(today);
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const monthDates = getDatesRange(daysInMonth).filter((date) => date >= start);
    const done = monthDates.reduce(
      (acc, date) => acc + (habit.completions[formatDateKey(date)] ? 1 : 0),
      0
    );
    return {
      today: todayDone ? "Feito" : "Pendente",
      progress: `${done}/${habit.monthlyTarget}`,
    };
  }

  const weekStart = startOfWeek(today);
  const weekDates = getDatesRange(7).filter((date) => date >= weekStart);
  const targetCount = weekDates.filter((date) => isTargetDate(date, habit)).length;
  const done = weekDates.reduce((acc, date) => {
    if (!isTargetDate(date, habit)) {
      return acc;
    }
    return acc + (habit.completions[formatDateKey(date)] ? 1 : 0);
  }, 0);

  return {
    today: todayDone ? "Feito" : "Pendente",
    progress: `${done}/${targetCount}`,
  };
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

const renderGrid = (habit, container, habits) => {
  container.innerHTML = "";
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

      if (habit.completions[key]) {
        square.classList.add("day--done");
      }

      if (!isTargetDate(date, habit)) {
        square.classList.add("day--inactive");
        square.setAttribute("aria-disabled", "true");
      }

      square.addEventListener("click", () => {
        if (!isTargetDate(date, habit)) {
          return;
        }
        habit.completions[key] = !habit.completions[key];
        saveHabits(habits);
        renderHabits(habits);
      });

      column.appendChild(square);
    }
    container.appendChild(column);
  }
};

const renderHabits = (habits) => {
  habitsList.innerHTML = "";
  habits.forEach((habit) => {
    const card = document.createElement("article");
    card.className = "habit-card";

    const header = document.createElement("header");
    header.className = "habit-card__header";

    const title = document.createElement("div");
    title.className = "habit-card__title";
    title.textContent = habit.name;

    const goalText = document.createElement("div");
    goalText.className = "habit-card__goal";
    goalText.textContent = describeGoal(habit);

    header.appendChild(title);
    header.appendChild(goalText);

    const summary = document.createElement("div");
    summary.className = "summary";
    const { today, progress } = calculateProgress(habit);
    summary.innerHTML = `
      <div class=\"summary__title\">Resumo</div>
      <p class=\"summary__goal\">${describeGoal(habit)}</p>
      <div class=\"summary__stats\">
        <div>
          <span class=\"summary__label\">Hoje</span>
          <span class=\"summary__value\">${today}</span>
        </div>
        <div>
          <span class=\"summary__label\">Progresso</span>
          <span class=\"summary__value\">${progress}</span>
        </div>
      </div>
    `;

    const grid = document.createElement("div");
    grid.className = "grid";

    card.appendChild(header);
    card.appendChild(summary);
    card.appendChild(grid);
    habitsList.appendChild(card);

    renderGrid(habit, grid, habits);
  });
};

const getFormSettings = () => {
  const customDays = Array.from(
    customDaysField.querySelectorAll("input:checked")
  ).map((input) => Number(input.value));

  return {
    name: habitNameInput.value.trim() || "Meu hábito",
    goal: habitGoalSelect.value,
    weeklyTarget: Number(weeklyGoalInput.value),
    monthlyTarget: Number(monthlyGoalInput.value),
    customDays: customDays.length ? customDays : getDefaultSettings().customDays,
  };
};

const updateFormVisibility = (settings) => {
  renderForm(settings);
};

let habits = loadHabits();
let draftSettings = getDefaultSettings();

renderForm(draftSettings);
renderHabits(habits);

habitGoalSelect.addEventListener("change", (event) => {
  draftSettings = { ...draftSettings, goal: event.target.value };
  updateFormVisibility(draftSettings);
});

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const settings = getFormSettings();
  const newHabit = createHabit(settings);
  habits = [...habits, newHabit];
  saveHabits(habits);
  habitForm.reset();
  draftSettings = getDefaultSettings();
  renderForm(draftSettings);
  renderHabits(habits);
});
