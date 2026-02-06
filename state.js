// state.js
const TASK_STATUS = {
  IDLE: "idle",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

let currentTask = {
  status: TASK_STATUS.IDLE,
  targetDate: null,
  step: "",
  progress: { total: 0, current: 0, details: [] },
  logs: [],
  error: null,
};

function log(message) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const line = `[${timeStr}] ${message}`;
  console.log(line);
  currentTask.logs.push(line);
  if (currentTask.logs.length > 1000) currentTask.logs.shift();
}

function updateProgress(step, current, total = 0, detail = null) {
  currentTask.step = step;
  if (total > 0) currentTask.progress.total = total;
  if (current !== null) currentTask.progress.current = current;
  if (detail) currentTask.progress.details.push(detail);
}

function resetTask(date) {
  currentTask = {
    status: TASK_STATUS.PROCESSING,
    targetDate: date,
    startTime: Date.now(),
    step: "初始化",
    progress: { total: 0, current: 0, details: [] },
    logs: [],
    error: null,
  };
}

function setTaskStatus(status, error = null) {
  currentTask.status = status;
  if (error) currentTask.error = error;
}

function getTask() {
  return currentTask;
}

module.exports = {
  TASK_STATUS,
  log,
  updateProgress,
  resetTask,
  setTaskStatus,
  getTask,
};
