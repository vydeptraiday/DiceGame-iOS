const ACC_DB_KEY = 'royal_accounts_db_v4';
const SESSION_USER_KEY = 'royal_current_user_v4';
const GLOBAL_STATE_KEY = 'royal_global_state_v4';

// TÀI KHOẢN MẪU BAN ĐẦU
const INITIAL_ACCOUNTS = [
  {
    username: 'admin',
    password: '123',
    pin: '8888',
    nickname: 'TrùmNhàCáiVIP',
    avatar: '🐉',
    balance: 100000000,
    vault: 50000000,
    totalWagered: 500000000,
    gachaPity: 0,
    usedCodes: [],
    locked: false
  },
  {
    username: 'vip88',
    password: '123',
    pin: '1111',
    nickname: 'ĐạiGiaPhốNúi',
    avatar: '👑',
    balance: 35000000,
    vault: 0,
    totalWagered: 25000000,
    gachaPity: 0,
    usedCodes: [],
    locked: false
  }
];

function loadAccountsDB() {
  try {
    const raw = localStorage.getItem(ACC_DB_KEY);
    if (!raw) {
      localStorage.setItem(ACC_DB_KEY, JSON.stringify(INITIAL_ACCOUNTS));
      return [...INITIAL_ACCOUNTS];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [...INITIAL_ACCOUNTS];
  }
}

function saveAccountsDB(list) {
  try {
    localStorage.setItem(ACC_DB_KEY, JSON.stringify(list));
  } catch (e) {}
}

let accountsDB = loadAccountsDB();
let currentUser = null;

// TRẠNG THÁI CHUNG CỦA BÀN CHƠI & HŨ
const DEFAULT_GLOBAL = {
  sound: true,
  nanBat: true,
  chip: 100000,
  jackpot: 50000000,
  txSession: 88901,
  txHistory: ['T', 'X', 'T', 'T', 'X', 'H', 'T', 'T', 'X', 'T', 'X', 'T'],
  txDetailLog: [],
  xdSession: 55201,
  xdHistory: ['C', 'L', 'C', 'C', 'L', 'C', 'L', 'C'],
  adminForceTX: 'AUTO',
  adminCustomDice: [6, 6, 6]
};

let state = (function () {
  try {
    const raw = localStorage.getItem(GLOBAL_STATE_KEY);
    return raw ? { ...DEFAULT_GLOBAL, ...JSON.parse(raw) } : { ...DEFAULT_GLOBAL };
  } catch (e) {
    return { ...DEFAULT_GLOBAL };
  }
})();

function saveState() {
  try {
    localStorage.setItem(GLOBAL_STATE_KEY, JSON.stringify(state));
    if (currentUser) {
      const idx = accountsDB.findIndex((a) => a.username === currentUser.username);
      if (idx !== -1) {
        accountsDB[idx] = { ...currentUser };
        saveAccountsDB(accountsDB);
      }
    }
  } catch (e) {}
}

function fmt(n) {
  return Math.floor(Number(n) || 0).toLocaleString('en-US');
}

// SOUND ENGINE
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;
function playTone(freq = 600, dur = 0.08, type = 'sine') {
  if (!state.sound) return;
  try {
    if (!actx) actx = new AudioCtx();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.14, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + dur);
  } catch (e) {}
}

function showToast(msg) {
  const box = document.getElementById('toast-box');
  box.textContent = msg;
  box.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => box.classList.add('hidden'), 2600);
}

// ==================== HỆ THỐNG ĐĂNG NHẬP / ĐĂNG KÝ / QUÊN MẬT KHẨU ====================
document.querySelectorAll('.auth-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const mode = tab.dataset.authtab;
    document.getElementById('form-login').classList.toggle('hidden', mode !== 'login');
    document.getElementById('form-register').classList.toggle('hidden', mode !== 'register');
    document.getElementById('form-forgot').classList.toggle('hidden', mode !== 'forgot');
  });
});

function loginSuccess(acc) {
  currentUser = acc;
  localStorage.setItem(SESSION_USER_KEY, acc.username);
  document.getElementById('auth-screen').classList.add('hidden');
  updateHeaderUI();
  showToast(`👑 Chào mừng đại gia ${acc.nickname}!`);
}

// Tự động đăng nhập nếu đã có phiên
(function checkSavedSession() {
  const savedU = localStorage.getItem(SESSION_USER_KEY);
  if (savedU) {
    const found = accountsDB.find((a) => a.username === savedU && !a.locked);
    if (found) loginSuccess(found);
  }
})();

// Xử lý Đăng nhập
document.getElementById('form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  accountsDB = loadAccountsDB();
  const u = document.getElementById('login-user').value.trim().toLowerCase();
  const p = document.getElementById('login-pass').value.trim();
  const acc = accountsDB.find((a) => a.username.toLowerCase() === u);
  if (!acc) return showToast('❌ Tài khoản không tồn tại!');
  if (acc.locked) return showToast('🔒 Tài khoản này đã bị Admin khóa!');
  if (acc.password !== p) return showToast('❌ Mật khẩu không chính xác!');
  loginSuccess(acc);
});

// Xử lý Đăng ký
document.getElementById('form-register').addEventListener('submit', (e) => {
  e.preventDefault();
  accountsDB = loadAccountsDB();
  const u = document.getElementById('reg-user').value.trim().toLowerCase();
  const nick = document.getElementById('reg-nick').value.trim();
  const p = document.getElementById('reg-pass').value.trim();
  const pin = document.getElementById('reg-pin').value.trim();

  if (accountsDB.some((a) => a.username.toLowerCase() === u)) {
    return showToast('⚠️ Tên đăng nhập này đã có người sử dụng!');
  }

  const newAcc = {
    username: u,
    password: p,
    pin: pin || '1234',
    nickname: nick || u,
    avatar: '🐉',
    balance: 25000000,
    vault: 0,
    totalWagered: 0,
    gachaPity: 0,
    usedCodes: [],
    locked: false
  };
  accountsDB.push(newAcc);
  saveAccountsDB(accountsDB);
  loginSuccess(newAcc);
});

// Xử lý Quên & Cấp lại mật khẩu
document.getElementById('form-forgot').addEventListener('submit', (e) => {
  e.preventDefault();
  accountsDB = loadAccountsDB();
  const u = document.getElementById('fg-user').value.trim().toLowerCase();
  const pin = document.getElementById('fg-pin').value.trim();
  const newPass = document.getElementById('fg-newpass').value.trim();

  const acc = accountsDB.find((a) => a.username.toLowerCase() === u);
  if (!acc) return showToast('❌ Không tìm thấy tên tài khoản này!');
  if (acc.pin !== pin && pin !== '8888') {
    return showToast('❌ Mã khôi phục không đúng! (Hoặc liên hệ Admin cấp lại)');
  }
  acc.password = newPass;
  saveAccountsDB(accountsDB);
  showToast('✅ Đã cấp lại mật khẩu mới thành công! Hãy đăng nhập.');
  document.querySelector('.auth-tab[data-authtab="login"]').click();
  document.getElementById('login-user').value = acc.username;
});

// Nút Đăng xuất
document.getElementById('btn-logout').addEventListener('click', () => {
  saveState();
  currentUser = null;
  localStorage.removeItem(SESSION_USER_KEY);
  document.getElementById('auth-screen').classList.remove('hidden');
  showToast('👋 Đã đăng xuất tài khoản!');
});

function getVipLevel() {
  const w = currentUser ? currentUser.totalWagered : 0;
  if (w >= 500000000) return 10;
  if (w >= 200000000) return 9;
  if (w >= 100000000) return 8;
  if (w >= 50000000) return 7;
  if (w >= 20000000) return 6;
  if (w >= 10000000) return 5;
  if (w >= 5000000) return 4;
  if (w >= 2000000) return 3;
  if (w >= 500000) return 2;
  return 1;
}

function updateHeaderUI() {
  if (!currentUser) return;
  document.getElementById('ui-username').textContent = currentUser.nickname;
  document.getElementById('ui-avatar').textContent = currentUser.avatar;
  document.getElementById('ui-vip').textContent = 'VIP ' + getVipLevel();
  document.getElementById('ui-balance').textContent = fmt(currentUser.balance);
  document.getElementById('ui-tx-jackpot').textContent = fmt(state.jackpot);
  document.getElementById('slot-jp-val').textContent = fmt(state.jackpot);
  document.getElementById('vault-cur-bal').textContent = fmt(currentUser.balance);
  document.getElementById('vault-saved-bal').textContent = fmt(currentUser.vault);
  saveState();
}

// ==================== CAO THỦ & BOT CHAT THỜI GIAN THỰC ====================
const PRO_PLAYERS = [
  { name: 'LongThiếuGia', vip: 9 },
  { name: 'VuaBẻCầu88', vip: 10 },
  { name: 'HùngBáThiênHạ', vip: 8 },
  { name: 'ĐạiGiaPhốNúi', vip: 9 },
  { name: 'ThánhSănSáp', vip: 9 },
  { name: 'ThánhNặnBát', vip: 8 },
  { name: 'KẻHủyDiệtCầu', vip: 10 },
  { name: 'BốGiàHàThành', vip: 9 },
  { name: 'TrùmSănHũ666', vip: 10 }
];

function appendChatMessage(user, vip, text, isMe = false) {
  const box = document.getElementById('chat-box');
  if (!box) return;
  const line = document.createElement('div');
  line.className = 'chat-line';
  line.innerHTML = `<span class="chat-vip">VIP ${vip}</span><span class="chat-user ${isMe ? 'me' : ''}">${user}:</span><span>${text}</span>`;
  box.appendChild(line);
  while (box.children.length > 40) box.removeChild(box.firstChild);
  box.scrollTop = box.scrollHeight;
}

function triggerBotContextChat(phase, extra = '') {
  const bot = PRO_PLAYERS[Math.floor(Math.random() * PRO_PLAYERS.length)];
  const msgsBet = [
    `Hũ lên ${fmt(state.jackpot)} rồi anh em ơi, lót nhẹ Sáp 1 với Sáp 6 săn nổ hũ!`,
    'Cầu đang đẹp quá, tay này đập 20M Tài lót thêm 1M Sáp bất kỳ!',
    'Vừa vào 15 củ Xỉu kèm Sáp 111, nổ hũ phát là đổi đời luôn ae!',
    'Tiền bên thua dồn vào Hũ to kỷ lục rồi kìa, sắp nổ 666 hoặc 111 đấy!'
  ];
  const msgsSqueeze = [
    'Nặn từ từ thôi anh em ơi, thấy 2 con lục rồi nặn nốt con lục nữa nổ hũ nào!',
    'Lên 1-1-1 hoặc 6-6-6 nổ banh hũ đi nào!',
    'Run tay quá anh em ơi mở bát lẹ đi!'
  ];
  const msgsResult = [
    `Về ${extra} chuẩn đét! Lại húp ngọt nước rồi hahaha!`,
    `Tiền bên thua lại dồn thêm vào Hũ kìa, tay sau nuôi Sáp tiếp anh em!`,
    'Đỏ quên đi, làm thêm vài chục củ tay tới nào!'
  ];
  const list = phase === 'BET' ? msgsBet : phase === 'SQUEEZE' ? msgsSqueeze : msgsResult;
  appendChatMessage(bot.name, bot.vip, list[Math.floor(Math.random() * list.length)]);
}

document.getElementById('chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const inp = document.getElementById('chat-input');
  const txt = inp.value.trim();
  if (!txt) return;
  appendChatMessage(currentUser.nickname, getVipLevel(), txt, true);
  inp.value = '';
  playTone(720, 0.05);

  setTimeout(() => {
    const responder = PRO_PLAYERS[Math.floor(Math.random() * PRO_PLAYERS.length)];
    const replies = [
      `Chuẩn bài luôn đại gia @${currentUser.nickname} ơi, lót thêm Sáp săn Hũ đi!`,
      `Trùng máu với @${currentUser.nickname} tay này nhé, chúc nổ hũ rực rỡ!`,
      `Ok @${currentUser.nickname}, theo bạn 20M tay này kiếm lộc!`
    ];
    appendChatMessage(responder.name, responder.vip, replies[Math.floor(Math.random() * replies.length)]);
  }, 1300);
});

// ==================== 1. TÀI XỈU NỔ HŨ (111 / 666) & SÁP X CAO ====================
let txPhase = 'BETTING';
let txTimeLeft = 20;
let txPoolTai = 14000000;
let txPoolXiu = 13500000;
let txUsersTai = 128;
let txUsersXiu = 124;

let txMyBets = {
  TAI: 0,
  XIU: 0,
  SAP_ANY: 0,
  HU_XIU: 0,
  HU_TAI: 0
};

let currentDice = [6, 6, 6];
let naturalJackpotFlag = false;

const PIP_MAP = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

function renderDie3D(el, val) {
  el.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    if (PIP_MAP[val].includes(i)) {
      cell.className = 'pip' + (val === 1 || val === 4 ? ' red-pip' : '');
    }
    el.appendChild(cell);
  }
}

function generateMD5String(session, d1, d2, d3) {
  const raw = `ROYAL_${session}_${d1}-${d2}-${d3}_${Math.random().toString(36).slice(2, 8)}`;
  let hash = '';
  for (let i = 0; i < 32; i++) {
    const code = (raw.charCodeAt(i % raw.length) * (i + 17) + session) % 16;
    hash += code.toString(16);
  }
  return hash;
}

// QUYẾT ĐỊNH KẾT QUẢ XÚC XẮC (HỖ TRỢ NỔ HŨ TỰ NHIÊN & ADMIN GIAN LẬN TROLL BẠN BÈ)
function computeFinalDiceAtLock() {
  naturalJackpotFlag = false;
  const mode = state.adminForceTX;

  if (mode === 'CUSTOM_DICE') {
    return [...state.adminCustomDice];
  }
  if (mode === 'HU_TAI_666') {
    return [6, 6, 6];
  }
  if (mode === 'HU_XIU_111') {
    return [1, 1, 1];
  }
  if (mode === 'SAP_RANDOM') {
    const v = Math.floor(Math.random() * 4) + 2; // 222, 333, 444, 555
    return [v, v, v];
  }
  if (mode === 'FORCE_WIN_JACKPOT') {
    // Người chơi đặt bên nào nổ hũ đúng bên đó
    if (txMyBets.XIU > txMyBets.TAI || txMyBets.HU_XIU > 0) return [1, 1, 1];
    return [6, 6, 6];
  }
  if (mode === 'TROLL_OPPOSITE') {
    // Bạn bè đặt Tài -> ép về Xỉu 10 nút (4-3-3); đặt Xỉu -> ép về Tài 11 nút (4-4-3)
    if (txMyBets.TAI >= txMyBets.XIU) {
      return [4, 3, 3]; // 10 điểm Xỉu sát nút
    } else {
      return [4, 4, 3]; // 11 điểm Tài sát nút
    }
  }
  if (mode === 'TAI') {
    while (true) {
      const d = [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
      if (d[0] + d[1] + d[2] >= 11 && !(d[0] === d[1] && d[1] === d[2])) return d;
    }
  }
  if (mode === 'XIU') {
    while (true) {
      const d = [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
      if (d[0] + d[1] + d[2] <= 10 && !(d[0] === d[1] && d[1] === d[2])) return d;
    }
  }

  // CHẾ ĐỘ TỰ NHIÊN: Có xác suất tự nhiên ra 1-1-1, 6-6-6 hoặc Sáp để Nổ Hũ bất kỳ
  const rand = Math.random();
  if (rand < 0.045) {
    // 4.5% tự nhiên Nổ Hũ 1-1-1 hoặc 6-6-6
    naturalJackpotFlag = true;
    return Math.random() < 0.5 ? [1, 1, 1] : [6, 6, 6];
  }
  if (rand < 0.085) {
    // 4% tự nhiên ra Sáp (222 - 555)
    const v = Math.floor(Math.random() * 4) + 2;
    return [v, v, v];
  }
  return [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
}

function renderCauStrip() {
  const wrap = document.getElementById('tx-cau-dots');
  wrap.innerHTML = '';
  state.txHistory.slice(-16).forEach((r) => {
    const d = document.createElement('div');
    d.className = `c-dot ${r}`;
    d.textContent = r;
    wrap.appendChild(d);
  });
}

function startTxRound() {
  txPhase = 'BETTING';
  txTimeLeft = 20;
  txPoolTai = Math.floor(Math.random() * 6000000) + 4000000;
  txPoolXiu = Math.floor(Math.random() * 6000000) + 4000000;
  txUsersTai = Math.floor(Math.random() * 50) + 80;
  txUsersXiu = Math.floor(Math.random() * 50) + 80;
  txMyBets = { TAI: 0, XIU: 0, SAP_ANY: 0, HU_XIU: 0, HU_TAI: 0 };

  document.getElementById('tx-session').textContent = '#' + state.txSession;
  document.getElementById('tx-md5-str').textContent = generateMD5String(state.txSession, 3, 4, 5);
  document.getElementById('tx-result-pop').classList.add('hidden');
  document.getElementById('tx-bowl').classList.add('hidden');
  document.getElementById('tx-timer').classList.remove('hidden');
  document.getElementById('box-tai').classList.remove('win-glow');
  document.getElementById('box-xiu').classList.remove('win-glow');
  document.querySelectorAll('.sap-box').forEach((b) => b.classList.remove('win-glow'));

  // Luôn hiển thị MD5 XANH CHÍN để troll bạn bè kín đáo 100%
  document.getElementById('tx-mode-badge').textContent = 'MD5 XANH CHÍN';

  updateTxPoolsUI();
  renderCauStrip();
}

function updateTxPoolsUI() {
  document.getElementById('tx-pool-tai').textContent = fmt(txPoolTai);
  document.getElementById('tx-pool-xiu').textContent = fmt(txPoolXiu);
  document.getElementById('tx-users-tai').textContent = txUsersTai;
  document.getElementById('tx-users-xiu').textContent = txUsersXiu;
  document.getElementById('tx-my-tai').textContent = fmt(txMyBets.TAI);
  document.getElementById('tx-my-xiu').textContent = fmt(txMyBets.XIU);
  document.getElementById('tx-my-sap').textContent = fmt(txMyBets.SAP_ANY);
  document.getElementById('tx-my-huxiu').textContent = fmt(txMyBets.HU_XIU);
  document.getElementById('tx-my-hutai').textContent = fmt(txMyBets.HU_TAI);
}

function showJackpotExplosionModal(title, sub, amountWon) {
  document.getElementById('jp-exp-title').textContent = title;
  document.getElementById('jp-exp-sub').textContent = sub;
  document.getElementById('jp-exp-amount').textContent = `+${fmt(amountWon)} XU`;
  document.getElementById('jackpot-explosion').classList.remove('hidden');
  playTone(880, 0.45, 'triangle');
}

document.getElementById('btn-close-jp-exp').addEventListener('click', () => {
  document.getElementById('jackpot-explosion').classList.add('hidden');
});

function revealTxResult() {
  if (txPhase === 'RESULT') return;
  txPhase = 'RESULT';
  document.getElementById('tx-bowl').classList.add('hidden');

  const d1 = currentDice[0];
  const d2 = currentDice[1];
  const d3 = currentDice[2];
  const sum = d1 + d2 + d3;
  const isSap = d1 === d2 && d2 === d3;
  const isHuXiu111 = d1 === 1 && d2 === 1 && d3 === 1;
  const isHuTai666 = d1 === 6 && d2 === 6 && d3 === 6;
  const winDoor = sum >= 11 ? 'TAI' : 'XIU';

  // 1. TIỀN BÊN THUA TỰ ĐỘNG CHẢY VÀO HŨ (Đúng nguyên tắc bạn yêu cầu)
  const losingPlayerBet = winDoor === 'TAI' ? txMyBets.XIU : txMyBets.TAI;
  const losingBotFlow = Math.floor((winDoor === 'TAI' ? txPoolXiu : txPoolTai) * 0.25);
  const addedToHu = losingPlayerBet + losingBotFlow;
  state.jackpot += addedToHu;
  document.getElementById('ui-hu-flow').textContent = `+${fmt(addedToHu)} Xu bên thua vừa chảy vào Hũ!`;

  // 2. HIỂN THỊ KẾT QUẢ TRÊN ĐĨA
  const pop = document.getElementById('tx-result-pop');
  if (isHuTai666) {
    pop.textContent = '6-6-6 💥 NỔ HŨ TÀI!';
  } else if (isHuXiu111) {
    pop.textContent = '1-1-1 💥 NỔ HŨ XỈU!';
  } else if (isSap) {
    pop.textContent = `SÁP ${d1}-${d2}-${d3} (x30)!`;
  } else {
    pop.textContent = `${sum} Điểm - ${winDoor === 'TAI' ? 'TÀI' : 'XỈU'}`;
  }
  pop.classList.remove('hidden');

  if (winDoor === 'TAI') document.getElementById('box-tai').classList.add('win-glow');
  else document.getElementById('box-xiu').classList.add('win-glow');

  if (isSap) document.querySelector('.sap-box[data-sap="SAP_ANY"]').classList.add('win-glow');
  if (isHuXiu111) document.querySelector('.sap-box[data-sap="HU_XIU"]').classList.add('win-glow');
  if (isHuTai666) document.querySelector('.sap-box[data-sap="HU_TAI"]').classList.add('win-glow');

  // 3. TÍNH TIỀN THẮNG CHO NGƯỜI CHƠI (BÊN THẮNG + SÁP + NỔ HŨ)
  let totalWin = 0;

  // Cửa Tài / Xỉu chính (nếu ra Sáp thì được nhân X5 ngay cả khi chỉ đặt Tài/Xỉu!)
  const mainMult = isSap ? 5.0 : 1.98;
  if (winDoor === 'TAI' && txMyBets.TAI > 0) {
    totalWin += Math.floor(txMyBets.TAI * mainMult);
  }
  if (winDoor === 'XIU' && txMyBets.XIU > 0) {
    totalWin += Math.floor(txMyBets.XIU * mainMult);
  }

  // Cửa Sáp Bất Kỳ (ăn X30)
  if (isSap && txMyBets.SAP_ANY > 0) {
    totalWin += Math.floor(txMyBets.SAP_ANY * 30);
  }

  // XỬ LÝ NỔ HŨ (3 CON 1 XỈU HOẶC 3 CON 6 TÀI -> ĂN X CỰC CAO + HÚP HŨ & HŨ VỀ 0)
  if (isHuXiu111 || isHuTai666) {
    const potBeforeReset = state.jackpot;
    let playerWonPot = 0;

    if (isHuXiu111) {
      if (txMyBets.HU_XIU > 0) {
        playerWonPot += txMyBets.HU_XIU * 120 + potBeforeReset;
      } else if (txMyBets.XIU > 0 || txMyBets.SAP_ANY > 0) {
        playerWonPot += (txMyBets.XIU + txMyBets.SAP_ANY) * 25 + potBeforeReset;
      }
    } else if (isHuTai666) {
      if (txMyBets.HU_TAI > 0) {
        playerWonPot += txMyBets.HU_TAI * 120 + potBeforeReset;
      } else if (txMyBets.TAI > 0 || txMyBets.SAP_ANY > 0) {
        playerWonPot += (txMyBets.TAI + txMyBets.SAP_ANY) * 25 + potBeforeReset;
      }
    }

    // SAU KHI NỔ HŨ -> QUỸ HŨ VỀ 0 NGAY LẬP TỨC
    state.jackpot = 0;
    document.getElementById('ui-hu-flow').textContent = '💥 HŨ VỪA NỔ! Quỹ Hũ đã về 0 Xu!';

    if (playerWonPot > 0) {
      totalWin += playerWonPot;
      showJackpotExplosionModal(
        isHuTai666 ? '🐉 NỔ HŨ TÀI 6-6-6!' : '🐉 NỔ HŨ XỈU 1-1-1!',
        `Ăn X Cực Khủng + Toàn Bộ Quỹ Hũ (${fmt(potBeforeReset)} Xu)`,
        totalWin
      );
    } else {
      showToast(`💥 NỔ HŨ ${isHuTai666 ? '6-6-6 TÀI' : '1-1-1 XỈU'}! Cao thủ trong bàn vừa húp ${fmt(potBeforeReset)} Xu, Hũ đã về 0!`);
      appendChatMessage('HỆ THỐNG', 10, `💥 NỔ HŨ ${isHuTai666 ? '6-6-6 TÀI' : '1-1-1 XỈU'}! Quỹ Hũ ${fmt(potBeforeReset)} Xu đã nổ và quay về 0!`);
    }
  }

  if (totalWin > 0 && currentUser) {
    currentUser.balance += totalWin;
    if (!isHuXiu111 && !isHuTai666) {
      showToast(`🎉 Thắng lớn +${fmt(totalWin)} Xu!${isSap ? ' (Nhân Sáp Cực Đỉnh!)' : ''}`);
      playTone(880, 0.25, 'triangle');
    }
  }

  // Ghi lịch sử cầu
  state.txHistory.push(isHuXiu111 || isHuTai666 ? 'H' : winDoor === 'TAI' ? 'T' : 'X');
  if (state.txHistory.length > 50) state.txHistory.shift();
  state.txDetailLog.unshift({
    session: state.txSession,
    dice: [d1, d2, d3],
    sum,
    winDoor: isHuTai666 ? 'NỔ HŨ 666' : isHuXiu111 ? 'NỔ HŨ 111' : isSap ? `SÁP ${d1}${d2}${d3}` : winDoor
  });
  if (state.txDetailLog.length > 25) state.txDetailLog.pop();

  state.txSession++;
  // Nếu không phải chế độ Bẻ ngược liên tục thì trả về AUTO sau 1 ván ép
  if (state.adminForceTX !== 'TROLL_OPPOSITE') {
    state.adminForceTX = 'AUTO';
    document.querySelectorAll('.adm-opt').forEach((x) => x.classList.remove('active'));
    const autoBtn = document.querySelector('.adm-opt[data-force-tx="AUTO"]');
    if (autoBtn) autoBtn.classList.add('active');
  }

  updateHeaderUI();
  renderCauStrip();
  triggerBotContextChat('RESULT', `${d1}-${d2}-${d3} (${sum} nút)`);

  setTimeout(() => startTxRound(), 5500);
}

// BÁT NẶN KÉO THẢ
(function initBowlDrag() {
  const bowl = document.getElementById('tx-bowl');
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function onStart(x, y) {
    if (txPhase !== 'SQUEEZING') return;
    dragging = true;
    startX = x;
    startY = y;
  }

  function onMove(x, y) {
    if (!dragging) return;
    const dx = x - startX;
    const dy = y - startY;
    bowl.style.transform = `translate(${dx}px, ${dy}px)`;
    if (Math.hypot(dx, dy) > 65) {
      dragging = false;
      bowl.style.transform = 'translate(0,0)';
      revealTxResult();
    }
  }

  function onEnd() {
    dragging = false;
  }

  bowl.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onEnd);

  bowl.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    onStart(t.clientX, t.clientY);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    onMove(t.clientX, t.clientY);
  }, { passive: true });
  window.addEventListener('touchend', onEnd);
})();

// ĐẶT CƯỢC TÀI / XỈU CHÍNH
document.querySelectorAll('.bet-trigger-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!currentUser) return;
    if (txPhase !== 'BETTING') return showToast('⏳ Đã hết giờ đặt cược!');
    const door = btn.dataset.door;
    const amount = state.chip === 'ALL' ? currentUser.balance : Number(state.chip);
    if (amount <= 0 || currentUser.balance < amount) return showToast('⚠️ Số dư không đủ! Hãy bấm nút + để nhận lộc.');

    currentUser.balance -= amount;
    currentUser.totalWagered += amount;

    if (door === 'TAI') {
      txMyBets.TAI += amount;
      txPoolTai += amount;
    } else {
      txMyBets.XIU += amount;
      txPoolXiu += amount;
    }

    playTone(660, 0.06);
    updateTxPoolsUI();
    updateHeaderUI();
  });
});

// ĐẶT CƯỢC SÁP & SĂN HŨ (X30 / X120 + HŨ)
document.querySelectorAll('.sap-box').forEach((box) => {
  box.addEventListener('click', () => {
    if (!currentUser) return;
    if (txPhase !== 'BETTING') return showToast('⏳ Đã hết giờ đặt cược!');
    const key = box.dataset.sap;
    const amount = state.chip === 'ALL' ? currentUser.balance : Number(state.chip);
    if (amount <= 0 || currentUser.balance < amount) return showToast('⚠️ Số dư không đủ!');

    currentUser.balance -= amount;
    currentUser.totalWagered += amount;
    txMyBets[key] += amount;

    playTone(780, 0.06);
    updateTxPoolsUI();
    updateHeaderUI();
  });
});

document.querySelectorAll('#tx-chips .chip-item').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#tx-chips .chip-item').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.chip = chip.dataset.val === 'ALL' ? 'ALL' : Number(chip.dataset.val);
    playTone(520, 0.04);
  });
});

document.getElementById('btn-toggle-nan').addEventListener('click', (e) => {
  state.nanBat = !state.nanBat;
  e.target.textContent = `🖐 Nặn: ${state.nanBat ? 'BẬT' : 'TẮT'}`;
  saveState();
});

// ==================== 2. HỆ THỐNG XÓC ĐĨA ====================
let xdTimeLeft = 18;
let xdPhase = 'BETTING';
let xdMyBets = { CHAN: 0, LE: 0, '4DO': 0, '4TRANG': 0, '3DO1TRANG': 0, '3TRANG1DO': 0 };
let xdPools = { CHAN: 8500000, LE: 7900000 };
const XD_ODDS = { CHAN: 1.98, LE: 1.98, '4DO': 14, '4TRANG': 14, '3DO1TRANG': 3.5, '3TRANG1DO': 3.5 };

function renderXdCau() {
  const strip = document.getElementById('xd-cau-strip');
  strip.innerHTML = '';
  state.xdHistory.slice(-10).forEach((c) => {
    const dot = document.createElement('div');
    dot.className = `c-dot ${c === 'C' ? 'T' : 'X'}`;
    dot.textContent = c;
    strip.appendChild(dot);
  });
}

function updateXdUI() {
  document.getElementById('xd-pool-CHAN').textContent = fmt(xdPools.CHAN);
  document.getElementById('xd-pool-LE').textContent = fmt(xdPools.LE);
  Object.keys(xdMyBets).forEach((k) => {
    const el = document.getElementById(`xd-my-${k}`);
    if (el) el.textContent = fmt(xdMyBets[k]);
  });
}

document.querySelectorAll('.xd-door').forEach((doorEl) => {
  doorEl.addEventListener('click', () => {
    if (!currentUser || xdPhase !== 'BETTING') return;
    const key = doorEl.dataset.xddoor;
    const amt = state.chip === 'ALL' ? currentUser.balance : Number(state.chip);
    if (amt <= 0 || currentUser.balance < amt) return showToast('⚠️ Không đủ Xu!');
    currentUser.balance -= amt;
    currentUser.totalWagered += amt;
    xdMyBets[key] += amt;
    if (xdPools[key] !== undefined) xdPools[key] += amt;
    playTone(680, 0.05);
    updateXdUI();
    updateHeaderUI();
  });
});

function settleXocDia() {
  xdPhase = 'RESULT';
  let redCount = 0;
  for (let i = 0; i < 4; i++) if (Math.random() < 0.5) redCount++;

  const coinsWrap = document.getElementById('xd-coins');
  coinsWrap.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const c = document.createElement('span');
    c.className = 'xd-coin ' + (i < redCount ? 'red' : 'white');
    coinsWrap.appendChild(c);
  }

  document.getElementById('xd-bowl').classList.add('open');
  const isEven = redCount % 2 === 0;
  const winKeys = [isEven ? 'CHAN' : 'LE'];
  if (redCount === 4) winKeys.push('4DO');
  if (redCount === 0) winKeys.push('4TRANG');
  if (redCount === 3) winKeys.push('3DO1TRANG');
  if (redCount === 1) winKeys.push('3TRANG1DO');

  document.getElementById('xd-status').textContent = `KẾT QUẢ: ${redCount} ĐỎ - ${4 - redCount} TRẮNG (${isEven ? 'CHẴN' : 'LẺ'})`;

  let totalWin = 0;
  winKeys.forEach((wk) => {
    const doorBox = document.querySelector(`.xd-door[data-xddoor="${wk}"]`);
    if (doorBox) doorBox.classList.add('win-glow');
    if (xdMyBets[wk] > 0) totalWin += Math.floor(xdMyBets[wk] * XD_ODDS[wk]);
  });

  if (totalWin > 0 && currentUser) {
    currentUser.balance += totalWin;
    showToast(`⚪ Thắng Xóc Đĩa +${fmt(totalWin)} Xu!`);
  }

  state.xdHistory.push(isEven ? 'C' : 'L');
  if (state.xdHistory.length > 20) state.xdHistory.shift();
  state.xdSession++;
  renderXdCau();
  updateHeaderUI();

  setTimeout(() => {
    document.querySelectorAll('.xd-door').forEach((d) => d.classList.remove('win-glow'));
    document.getElementById('xd-bowl').classList.remove('open');
    document.getElementById('xd-status').textContent = 'ĐANG NHẬN CƯỢC...';
    xdMyBets = { CHAN: 0, LE: 0, '4DO': 0, '4TRANG': 0, '3DO1TRANG': 0, '3TRANG1DO': 0 };
    xdTimeLeft = 18;
    xdPhase = 'BETTING';
    document.getElementById('xd-session').textContent = '#' + state.xdSession;
    updateXdUI();
  }, 4500);
}

// ==================== MASTER GAME LOOP (1 GIÂY) ====================
setInterval(() => {
  if (txPhase === 'BETTING') {
    txTimeLeft--;
    document.getElementById('tx-timer').textContent = txTimeLeft;
    txPoolTai += Math.floor(Math.random() * 1900000) + 300000;
    txPoolXiu += Math.floor(Math.random() * 1900000) + 300000;
    txUsersTai += Math.floor(Math.random() * 4);
    txUsersXiu += Math.floor(Math.random() * 4);
    updateTxPoolsUI();

    if (txTimeLeft % 4 === 0) triggerBotContextChat('BET');

    if (txTimeLeft <= 0) {
      txPhase = 'SQUEEZING';
      currentDice = computeFinalDiceAtLock();
      document.getElementById('tx-timer').classList.add('hidden');
      const grp = document.getElementById('tx-dice-group');
      grp.classList.add('shaking');
      playTone(400, 0.2, 'sawtooth');

      setTimeout(() => {
        grp.classList.remove('shaking');
        renderDie3D(document.getElementById('tx-d1'), currentDice[0]);
        renderDie3D(document.getElementById('tx-d2'), currentDice[1]);
        renderDie3D(document.getElementById('tx-d3'), currentDice[2]);

        if (state.nanBat) {
          const bowl = document.getElementById('tx-bowl');
          bowl.style.transform = 'translate(0,0)';
          bowl.classList.remove('hidden');
          triggerBotContextChat('SQUEEZE');
          setTimeout(() => {
            if (txPhase === 'SQUEEZING') revealTxResult();
          }, 5000);
        } else {
          revealTxResult();
        }
      }, 900);
    }
  }

  if (xdPhase === 'BETTING') {
    xdTimeLeft--;
    document.getElementById('xd-timer').textContent = xdTimeLeft;
    xdPools.CHAN += Math.floor(Math.random() * 800000) + 100000;
    xdPools.LE += Math.floor(Math.random() * 800000) + 100000;
    updateXdUI();
    if (xdTimeLeft <= 0) settleXocDia();
  }
}, 1000);

// ==================== 3. QUAY HŨ SLOT (NỔ HŨ VỀ 0) ====================
const SLOT_SYMBOLS = [
  { icon: '🐉', mult: 50 },
  { icon: '👑', mult: 15 },
  { icon: '💰', mult: 8 },
  { icon: '💎', mult: 4 },
  { icon: '🧧', mult: 2.5 },
  { icon: '🪙', mult: 1.5 }
];
let slotBet = 50000;
let slotAuto = false;

document.querySelectorAll('.sbet-btn').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.sbet-btn').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    slotBet = Number(b.dataset.sbet);
  });
});

function spinSlotOnce() {
  if (!currentUser || currentUser.balance < slotBet) {
    slotAuto = false;
    return showToast('⚠️ Không đủ Xu quay hũ!');
  }
  currentUser.balance -= slotBet;
  currentUser.totalWagered += slotBet;
  state.jackpot += slotBet; // Tiền quay thua chảy thẳng vào Hũ
  playTone(540, 0.08, 'square');

  const gridEl = document.getElementById('slot-grid');
  const cells = Array.from(gridEl.children);
  const res = [];

  for (let i = 0; i < 9; i++) {
    const r = Math.random();
    let sym = SLOT_SYMBOLS[5];
    if (r < 0.08) sym = SLOT_SYMBOLS[0];
    else if (r < 0.2) sym = SLOT_SYMBOLS[1];
    else if (r < 0.36) sym = SLOT_SYMBOLS[2];
    else if (r < 0.56) sym = SLOT_SYMBOLS[3];
    else if (r < 0.78) sym = SLOT_SYMBOLS[4];
    res.push(sym);
    cells[i].textContent = sym.icon;
  }

  const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [2, 4, 6]];
  let totalWin = 0;
  let hitJackpot = false;

  lines.forEach(([a, b, c]) => {
    if (res[a].icon === res[b].icon && res[b].icon === res[c].icon) {
      if (res[a].icon === '🐉') hitJackpot = true;
      else totalWin += Math.floor(slotBet * res[a].mult);
    }
  });

  if (hitJackpot) {
    const potWon = state.jackpot + slotBet * 50;
    totalWin += potWon;
    state.jackpot = 0; // Hũ nổ về 0
    document.getElementById('slot-msg').textContent = `🐉 NỔ HŨ RỒNG VÀNG +${fmt(totalWin)} XU (Hũ về 0)!`;
    showJackpotExplosionModal('🐉 NỔ HŨ THẦN TÀI!', 'Quay trúng 3 Rồng Vàng liên tiếp', totalWin);
  } else if (totalWin > 0) {
    document.getElementById('slot-msg').textContent = `🎉 Trúng thưởng +${fmt(totalWin)} Xu!`;
  } else {
    document.getElementById('slot-msg').textContent = `Tiền trượt vừa cộng vào Hũ (+${fmt(slotBet)} Xu)!`;
  }

  currentUser.balance += totalWin;
  updateHeaderUI();
}

document.getElementById('btn-slot-spin').addEventListener('click', spinSlotOnce);
document.getElementById('btn-slot-auto').addEventListener('click', (e) => {
  slotAuto = !slotAuto;
  e.target.textContent = slotAuto ? '⏹ Dừng' : '🔄 Tự Quay';
});
setInterval(() => {
  if (slotAuto) spinSlotOnce();
}, 1300);

// ==================== 4. GACHA KHO BÁU ====================
function pullGacha(times) {
  if (!currentUser) return;
  const unitCost = Number(document.getElementById('gacha-base-cost').value);
  const totalCost = unitCost * times;
  if (currentUser.balance < totalCost) return showToast('⚠️ Không đủ Xu mở Gacha!');

  currentUser.balance -= totalCost;
  currentUser.totalWagered += totalCost;
  playTone(760, 0.14, 'triangle');

  const grid = document.getElementById('gacha-results-grid');
  document.getElementById('gacha-chest-anim').classList.add('hidden');
  grid.classList.remove('hidden');
  grid.innerHTML = '';

  let totalReward = 0;
  for (let i = 0; i < times; i++) {
    currentUser.gachaPity = (currentUser.gachaPity || 0) + 1;
    let tier = 'N', icon = '🪨', mult = 0.3;
    const r = Math.random();
    if (currentUser.gachaPity >= 30 || r < 0.03) {
      tier = 'UR'; icon = '🐉'; mult = 50; currentUser.gachaPity = 0;
    } else if (r < 0.14) {
      tier = 'SSR'; icon = '🦅'; mult = 10;
    } else if (r < 0.38 || (times === 10 && i === 9)) {
      tier = 'SR'; icon = '🦄'; mult = 3;
    } else if (r < 0.72) {
      tier = 'R'; icon = '🧧'; mult = 1.2;
    }
    const reward = Math.floor(unitCost * mult);
    totalReward += reward;
    const card = document.createElement('div');
    card.className = `gacha-card ${tier}`;
    card.innerHTML = `<div style="font-size:20px">${icon}</div><div>${tier}</div><div>+${fmt(reward)}</div>`;
    grid.appendChild(card);
  }

  currentUser.balance += totalReward;
  document.getElementById('gacha-pity-cnt').textContent = currentUser.gachaPity;
  document.getElementById('gacha-pity-fill').style.width = `${Math.min(100, (currentUser.gachaPity / 30) * 100)}%`;
  showToast(`✨ Mở Gacha nhận +${fmt(totalReward)} Xu!`);
  updateHeaderUI();
}

document.getElementById('btn-gacha-x1').addEventListener('click', () => pullGacha(1));
document.getElementById('btn-gacha-x10').addEventListener('click', () => pullGacha(10));

// ==================== 5. BẦU CUA & CAO THẤP ====================
const BC_KEYS = ['BAU', 'CUA', 'TOM', 'CA', 'GA', 'NAI'];
const BC_ICONS = { BAU: '🍐', CUA: '🦀', TOM: '🦐', CA: '🐟', GA: '🐓', NAI: '🦌' };
let bcBets = { BAU: 0, CUA: 0, TOM: 0, CA: 0, GA: 0, NAI: 0 };

document.querySelectorAll('.bc-item').forEach((item) => {
  item.addEventListener('click', () => {
    if (!currentUser) return;
    const key = item.dataset.animal;
    const amt = state.chip === 'ALL' ? currentUser.balance : Number(state.chip);
    if (amt <= 0 || currentUser.balance < amt) return showToast('⚠️ Không đủ Xu!');
    currentUser.balance -= amt;
    bcBets[key] += amt;
    document.getElementById(`bc-bet-${key}`).textContent = fmt(bcBets[key]);
    updateHeaderUI();
  });
});

document.getElementById('btn-bc-shake').addEventListener('click', () => {
  if (!currentUser) return;
  const picks = [0, 1, 2].map(() => BC_KEYS[Math.floor(Math.random() * 6)]);
  document.getElementById('bc-dice-row').innerHTML = picks.map((k) => `<div class="bc-die">${BC_ICONS[k]}</div>`).join('');
  let win = 0;
  BC_KEYS.forEach((k) => {
    const matches = picks.filter((x) => x === k).length;
    if (matches > 0 && bcBets[k] > 0) win += bcBets[k] * (matches + 1);
    bcBets[k] = 0;
    document.getElementById(`bc-bet-${k}`).textContent = '0';
  });
  if (win > 0) {
    currentUser.balance += win;
    showToast(`🦀 Thắng Bầu Cua +${fmt(win)} Xu!`);
  }
  updateHeaderUI();
});

let hlCurrentVal = 8, hlPot = 0;
const CARD_LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function playHiLow(guessUp) {
  if (!currentUser) return;
  if (hlPot === 0) {
    const startBet = 200000;
    if (currentUser.balance < startBet) return showToast('⚠️ Cần 200,000 Xu!');
    currentUser.balance -= startBet;
    hlPot = startBet;
  }
  const nextVal = Math.floor(Math.random() * 13) + 1;
  const suits = ['♠', '♥', '♦', '♣'];
  document.getElementById('hl-card').textContent = CARD_LABELS[nextVal] + suits[Math.floor(Math.random() * 4)];
  if ((guessUp && nextVal >= hlCurrentVal) || (!guessUp && nextVal <= hlCurrentVal)) {
    hlPot = Math.floor(hlPot * 1.9);
    showToast(`🔥 Chuẩn! Quỹ lên ${fmt(hlPot)} Xu`);
  } else {
    hlPot = 0;
    showToast('💥 Gãy cầu Cao Thấp!');
  }
  hlCurrentVal = nextVal;
  document.getElementById('hl-pot').textContent = 'Quỹ: ' + fmt(hlPot);
  updateHeaderUI();
}

document.getElementById('btn-hl-up').addEventListener('click', () => playHiLow(true));
document.getElementById('btn-hl-down').addEventListener('click', () => playHiLow(false));
document.getElementById('btn-hl-cash').addEventListener('click', () => {
  if (!currentUser || hlPot <= 0) return;
  currentUser.balance += hlPot;
  showToast(`💰 Nhận +${fmt(hlPot)} Xu!`);
  hlPot = 0;
  document.getElementById('hl-pot').textContent = 'Quỹ: 0';
  updateHeaderUI();
});

// ==================== TABS & MODALS ====================
document.querySelectorAll('.nav-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.game-view').forEach((v) => v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('view-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'rank') renderLeaderboard();
  });
});

function renderLeaderboard() {
  accountsDB = loadAccountsDB();
  const wrap = document.getElementById('rank-list');
  const bots = [
    { name: 'VuaBẻCầu88', vip: 10, bal: 985000000 },
    { name: 'LongThiếuGia', vip: 9, bal: 642000000 },
    { name: 'TrùmSănHũ666', vip: 10, bal: 510000000 }
  ];
  const realUsers = accountsDB.map((a) => ({
    name: a.nickname + (currentUser && a.username === currentUser.username ? ' (Bạn)' : ''),
    vip: 8,
    bal: a.balance + (a.vault || 0)
  }));
  const list = [...realUsers, ...bots].sort((a, b) => b.bal - a.bal);
  wrap.innerHTML = list.map((item, idx) => `
    <div class="rank-row">
      <div><b>#${idx + 1}</b> <span class="chat-vip">VIP ${item.vip}</span> ${item.name}</div>
      <div style="color:#ffd700;font-weight:900">${fmt(item.bal)} 🪙</div>
    </div>`).join('');
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => document.getElementById(btn.dataset.close).classList.add('hidden'));
});

document.getElementById('btn-open-bank').addEventListener('click', () => openModal('modal-bank'));
document.getElementById('btn-open-gift').addEventListener('click', () => openModal('modal-gift'));
document.getElementById('btn-open-profile').addEventListener('click', () => {
  if (!currentUser) return;
  document.getElementById('profile-acc-info').textContent = `Tài khoản đăng nhập: ${currentUser.username} | Mã khôi phục: ${currentUser.pin}`;
  document.getElementById('profile-name-inp').value = currentUser.nickname;
  document.getElementById('profile-newpass-inp').value = '';
  document.getElementById('profile-vip-info').textContent = `Tổng cược: ${fmt(currentUser.totalWagered)} Xu`;
  openModal('modal-profile');
});

document.getElementById('btn-open-soicau').addEventListener('click', () => {
  const tCount = state.txHistory.filter((x) => x === 'T').length;
  const xCount = state.txHistory.filter((x) => x === 'X').length;
  const hCount = state.txHistory.filter((x) => x === 'H').length;
  document.getElementById('soicau-summary').innerHTML = `<p style="margin-bottom:8px">TÀI: <b style="color:#ff5252">${tCount}</b> | XỈU: <b style="color:#29b6f6">${xCount}</b> | NỔ HŨ: <b style="color:#ffd700">${hCount}</b></p>`;
  document.getElementById('soicau-list').innerHTML = state.txDetailLog.map((r) => `
    <div class="rank-row"><span>#${r.session}</span><span>Xúc xắc: ${r.dice.join('-')} (${r.sum})</span><b>${r.winDoor}</b></div>`).join('');
  openModal('modal-soicau');
});

// KÉT SẮT & CHUYỂN KHOẢN THẬT GIỮA CÁC TÀI KHOẢN
document.getElementById('btn-vault-deposit').addEventListener('click', () => {
  if (!currentUser) return;
  const v = Number(document.getElementById('vault-amount').value);
  if (v <= 0 || currentUser.balance < v) return showToast('⚠️ Số Xu không hợp lệ!');
  currentUser.balance -= v;
  currentUser.vault += v;
  updateHeaderUI();
  showToast(`🏦 Đã gửi ${fmt(v)} Xu vào Két!`);
});

document.getElementById('btn-vault-withdraw').addEventListener('click', () => {
  if (!currentUser) return;
  const v = Number(document.getElementById('vault-amount').value);
  if (v <= 0 || currentUser.vault < v) return showToast('⚠️ Két sắt không đủ Xu!');
  currentUser.vault -= v;
  currentUser.balance += v;
  updateHeaderUI();
  showToast(`🏦 Đã rút ${fmt(v)} Xu ra ví!`);
});

document.getElementById('btn-send-transfer').addEventListener('click', () => {
  if (!currentUser) return;
  const target = document.getElementById('transfer-target').value.trim().toLowerCase();
  const amt = Number(document.getElementById('transfer-amount').value);
  if (!target || amt <= 0 || currentUser.balance < amt) return showToast('⚠️ Kiểm tra lại thông tin!');

  accountsDB = loadAccountsDB();
  const receiver = accountsDB.find((a) => a.username.toLowerCase() === target || a.nickname.toLowerCase() === target);
  currentUser.balance -= amt;
  if (receiver) {
    receiver.balance += amt;
    saveAccountsDB(accountsDB);
  }
  updateHeaderUI();
  showToast(`💸 Đã chuyển ${fmt(amt)} Xu cho ${target}!`);
});

// GIFTCODE
const GIFTCODES = { SUNWIN888: 25000000, VIP999: 50000000, NOHU68: 40000000, SAP666: 100000000 };
document.getElementById('btn-claim-code').addEventListener('click', () => {
  if (!currentUser) return;
  const code = document.getElementById('giftcode-input').value.trim().toUpperCase();
  if (!GIFTCODES[code]) return showToast('❌ Giftcode không hợp lệ!');
  if (currentUser.usedCodes.includes(code)) return showToast('⚠️ Bạn đã nhận mã này rồi!');
  currentUser.usedCodes.push(code);
  currentUser.balance += GIFTCODES[code];
  updateHeaderUI();
  showToast(`🎁 Nhận thành công +${fmt(GIFTCODES[code])} Xu!`);
});

document.getElementById('btn-daily-relief').addEventListener('click', () => {
  if (!currentUser) return;
  currentUser.balance += 10000000;
  updateHeaderUI();
  showToast('🪙 Đã nhận +10,000,000 Xu cứu trợ!');
});

// HỒ SƠ & ĐỔI MK
document.querySelectorAll('.av-choice').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!currentUser) return;
    currentUser.avatar = btn.textContent;
    updateHeaderUI();
  });
});

document.getElementById('btn-save-profile').addEventListener('click', () => {
  if (!currentUser) return;
  const name = document.getElementById('profile-name-inp').value.trim();
  const newPass = document.getElementById('profile-newpass-inp').value.trim();
  if (name) currentUser.nickname = name;
  if (newPass) currentUser.password = newPass;
  updateHeaderUI();
  document.getElementById('modal-profile').classList.add('hidden');
  showToast('✅ Đã lưu thông tin tài khoản!');
});

// ==================== ADMIN QUẢN LÝ TÀI KHOẢN & CHỈNH HŨ TROLL BẠN BÈ ====================
function renderAdminAccountsList() {
  accountsDB = loadAccountsDB();
  const wrap = document.getElementById('admin-accounts-list');
  if (!wrap) return;
  wrap.innerHTML = accountsDB.map((acc) => `
    <div class="acc-item-card">
      <div class="acc-item-top">
        <span>👤 TK: ${acc.username} (${acc.nickname})</span>
        <span style="color:${acc.locked ? '#ff5252' : '#00e676'}">${acc.locked ? 'ĐÃ KHÓA' : 'HOẠT ĐỘNG'}</span>
      </div>
      <div class="acc-item-sub">
        🔑 Mật khẩu: <b>${acc.password}</b> | PIN: <b>${acc.pin}</b> | Số dư: <b style="color:#ffd700">${fmt(acc.balance)} Xu</b>
      </div>
      <div class="acc-item-actions">
        <button class="acc-mini-btn" onclick="adminResetPass('${acc.username}')">Cấp Lại MK</button>
        <button class="acc-mini-btn" onclick="adminAddXu('${acc.username}', 100000000)">+100M Xu</button>
        <button class="acc-mini-btn" onclick="adminZeroXu('${acc.username}')">Về 0 Xu</button>
        <button class="acc-mini-btn" onclick="adminToggleLock('${acc.username}')">${acc.locked ? 'Mở Khóa' : 'Khóa TK'}</button>
      </div>
    </div>
  `).join('');
}

window.adminResetPass = function (uname) {
  const newP = prompt(`Nhập mật khẩu mới cấp lại cho tài khoản [${uname}]:`, '123456');
  if (!newP) return;
  accountsDB = loadAccountsDB();
  const target = accountsDB.find((a) => a.username === uname);
  if (target) {
    target.password = newP.trim();
    if (currentUser && currentUser.username === uname) currentUser.password = target.password;
    saveAccountsDB(accountsDB);
    renderAdminAccountsList();
    showToast(`✅ Đã cấp mật khẩu mới [${target.password}] cho ${uname}!`);
  }
};

window.adminAddXu = function (uname, amt) {
  accountsDB = loadAccountsDB();
  const target = accountsDB.find((a) => a.username === uname);
  if (target) {
    target.balance += amt;
    if (currentUser && currentUser.username === uname) currentUser.balance = target.balance;
    saveAccountsDB(accountsDB);
    updateHeaderUI();
    renderAdminAccountsList();
    showToast(`💰 Đã bơm +${fmt(amt)} Xu cho ${uname}!`);
  }
};

window.adminZeroXu = function (uname) {
  accountsDB = loadAccountsDB();
  const target = accountsDB.find((a) => a.username === uname);
  if (target) {
    target.balance = 0;
    if (currentUser && currentUser.username === uname) currentUser.balance = 0;
    saveAccountsDB(accountsDB);
    updateHeaderUI();
    renderAdminAccountsList();
    showToast(`😈 Đã rút sạch Xu của ${uname} về 0!`);
  }
};

window.adminToggleLock = function (uname) {
  accountsDB = loadAccountsDB();
  const target = accountsDB.find((a) => a.username === uname);
  if (target) {
    target.locked = !target.locked;
    saveAccountsDB(accountsDB);
    renderAdminAccountsList();
    showToast(`${target.locked ? '🔒 Đã khóa' : '🔓 Đã mở khóa'} tài khoản ${uname}!`);
  }
};

document.getElementById('btn-open-admin').addEventListener('click', () => {
  renderAdminAccountsList();
  openModal('modal-admin');
});

document.getElementById('btn-unlock-admin').addEventListener('click', () => {
  if (document.getElementById('admin-pin-inp').value === '8888') {
    document.getElementById('admin-lock-view').classList.add('hidden');
    document.getElementById('admin-panel-view').classList.remove('hidden');
    renderAdminAccountsList();
  } else {
    showToast('❌ Sai mã PIN Admin!');
  }
});

document.querySelectorAll('.adm-opt').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.adm-opt').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    state.adminForceTX = b.dataset.forceTx;
    showToast('🎭 Đã gài chế độ ngầm: ' + b.textContent);
  });
});

document.getElementById('btn-adm-set-dice').addEventListener('click', () => {
  const d1 = Math.min(6, Math.max(1, Number(document.getElementById('adm-d1').value) || 6));
  const d2 = Math.min(6, Math.max(1, Number(document.getElementById('adm-d2').value) || 6));
  const d3 = Math.min(6, Math.max(1, Number(document.getElementById('adm-d3').value) || 6));
  state.adminCustomDice = [d1, d2, d3];
  state.adminForceTX = 'CUSTOM_DICE';
  document.querySelectorAll('.adm-opt').forEach((x) => x.classList.remove('active'));
  showToast(`🎯 Đã chốt ngầm phiên tới ra chính xác: ${d1} - ${d2} - ${d3}`);
});

document.getElementById('btn-adm-hu-500m').addEventListener('click', () => {
  state.jackpot += 500000000;
  updateHeaderUI();
  showToast('🔥 Đã bơm Quỹ Hũ thêm +500,000,000 Xu!');
});

document.getElementById('btn-adm-hu-zero').addEventListener('click', () => {
  state.jackpot = 0;
  updateHeaderUI();
  showToast('💨 Đã xả Quỹ Hũ về 0 Xu!');
});

document.getElementById('btn-adm-add50m').addEventListener('click', () => {
  if (!currentUser) return;
  currentUser.balance += 50000000;
  updateHeaderUI();
  showToast('💰 +50,000,000 Xu vào ví!');
});

document.getElementById('btn-adm-add500m').addEventListener('click', () => {
  if (!currentUser) return;
  currentUser.balance += 500000000;
  updateHeaderUI();
  showToast('💰 +500,000,000 Xu vào ví!');
});

document.getElementById('btn-sound').addEventListener('click', (e) => {
  state.sound = !state.sound;
  e.target.textContent = state.sound ? '🔊' : '🔇';
  saveState();
});

document.getElementById('btn-copy-md5').addEventListener('click', () => {
  navigator.clipboard?.writeText(document.getElementById('tx-md5-str').textContent);
  showToast('📋 Đã sao chép chuỗi MD5!');
});

// KHỞI ĐỘNG
renderDie3D(document.getElementById('tx-d1'), 6);
renderDie3D(document.getElementById('tx-d2'), 6);
renderDie3D(document.getElementById('tx-d3'), 6);
startTxRound();
renderXdCau();
updateXdUI();
updateHeaderUI();
appendChatMessage('TrùmSănHũ666', 10, 'Anh em để ý Hũ Tài Xỉu nhé, tiền bên thua đang dồn vào Hũ căng đét rồi!');
appendChatMessage('VuaBẻCầu88', 10, 'Lót nhẹ 500K vào Sáp 111 với Sáp 666 đi ae, nổ hũ phát ăn x120 cộng trọn Hũ luôn!');
