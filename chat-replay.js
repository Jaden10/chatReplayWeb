let chatData = [];
let isPlaying = false;
let startTime = null;
let lastPlayedTime = 0;
let chatIndex = 0;
let maxDuration = 0;
let timerInterval;

// 读取 JSON 文件并解析
async function loadChatData() {
  const response = await fetch(
    "【ストグラ】6日目 本署に配属されました 狼恋エギ【ローレン・イロアス⧸にじさんじ】-byGXWheGB8o.live_chat.json"
  );
  const chatLines = await response.text();

  chatData = chatLines
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      try {
        const entry = JSON.parse(line);
        const action =
          entry.replayChatItemAction.actions[0].addChatItemAction.item
            .liveChatTextMessageRenderer;
        return {
          time: parseInt(entry.replayChatItemAction.videoOffsetTimeMsec),
          user: action.authorName.simpleText,
          message: action.message.runs.map((run) => run.text).join(""),
          avatar: action.authorPhoto.thumbnails[0].url
        };
      } catch (e) {
        console.error("解析错误", e);
        return null;
      }
    })
    .filter((item) => item !== null);

  if (chatData.length > 0) {
    maxDuration = Math.max(...chatData.map((c) => c.time)); // 获取最大时间点
    updateProgressBar();
  }
}

// 播放 / 暂停 聊天回放
function playPauseChat() {
  isPlaying = !isPlaying;

  if (isPlaying) {
    startTime = Date.now() - lastPlayedTime;
    processChat();
    timerInterval = setInterval(updateProgressBar, 500);
  } else {
    lastPlayedTime = Date.now() - startTime;
    clearInterval(timerInterval);
  }
}

// 重新播放
function restartChat() {
  document.getElementById("chat-container").innerHTML = "";
  chatIndex = 0;
  lastPlayedTime = 0;
  startTime = null;
  isPlaying = false;
  clearInterval(timerInterval);
  updateProgressBar();
}

// 按时间顺序回放聊天消息
function processChat() {
  if (!isPlaying || chatIndex >= chatData.length) return;

  const elapsedTime = Date.now() - startTime;

  while (
    chatIndex < chatData.length &&
    chatData[chatIndex].time <= elapsedTime
  ) {
    addChatMessage(
      chatData[chatIndex].user,
      chatData[chatIndex].message,
      chatData[chatIndex].avatar
    );
    chatIndex++;
  }

  setTimeout(processChat, 100);
}

// 添加聊天消息
function addChatMessage(user, message, avatar) {
  const chatContainer = document.getElementById("chat-container");
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");

  messageElement.innerHTML = `
        <img src="${avatar}" alt="${user}" class="avatar">
        <span class="username">${user}: </span>
        <span class="text">${message}</span>
    `;

  chatContainer.appendChild(messageElement);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 更新进度条 & 时间显示
function updateProgressBar() {
  const elapsedTime = isPlaying ? Date.now() - startTime : lastPlayedTime;
  const progress = Math.min(elapsedTime / maxDuration, 1) * 100;

  document.getElementById("progress-bar").style.width = `${progress}%`;

  const currentTime = formatTime(elapsedTime);
  const totalTime = formatTime(maxDuration);
  document.getElementById(
    "time-display"
  ).innerText = `⏳ 进度: ${currentTime} / ${totalTime}`;
}

// 时间格式转换（毫秒 -> 小时:分钟:秒）
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

// ⏩ 跳转到指定时间
function jumpToTime() {
  const input = document.getElementById("jump-time").value.trim();
  const timeInMs = parseTime(input);

  if (timeInMs !== null && timeInMs <= maxDuration) {
    // 1️⃣ 清除当前所有 setTimeout，防止页面卡死
    clearTimeout(timerInterval);

    // 2️⃣ 找到最接近的聊天索引
    chatIndex = findClosestChatIndex(timeInMs);
    if (chatIndex < 0) chatIndex = 0; // 防止越界

    // 3️⃣ 立即更新播放时间
    lastPlayedTime = timeInMs;
    startTime = Date.now() - lastPlayedTime;

    // 4️⃣ 清空旧聊天并重新渲染
    document.getElementById("chat-container").innerHTML = "";
    isPlaying = true;

    //重新启用定时器以每秒更新进度条
    if (timerInterval) {
      clearInterval(timerInterval); // 清除已有定时器
    }
    timerInterval = setInterval(updateProgressBar, 1000); // 每秒更新进度条

    processChat(); // 立刻渲染跳转后的聊天
    updateProgressBar();
  } else {
    alert("⚠️ 请输入正确的时间格式 (小时:分钟:秒) 并确保时间有效！");
  }
}

// 🔍 用 **二分查找** 找到最接近 `targetTime` 的聊天索引
function findClosestChatIndex(targetTime) {
  let left = 0,
    right = chatData.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (chatData[mid].time < targetTime) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return left < chatData.length ? left : chatData.length - 1; // 防止越界
}

// 🕒 解析用户输入的时间格式 (小时:分钟:秒) -> 毫秒
function parseTime(timeStr) {
  const timeParts = timeStr.split(":").map((num) => parseInt(num, 10));

  if (timeParts.length === 3) {
    const [hours, minutes, seconds] = timeParts;
    if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }
  }
  return null;
}

// 加载并解析 JSON 数据
loadChatData();
