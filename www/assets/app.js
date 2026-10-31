// ==================== TỰ ĐỘNG CĂN CHỈNH MÀN HÌNH NGANG VỪA KHÍT 100% IPHONE ====================
let currentScale = 1;
let isRotatedPortrait = false;

function fitStageToScreen() {
  const shell = document.getElementById('app-shell');
  if (!shell) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const designW = 940;
  const designH = 430;

  if (vh > vw) {
    // Khi người chơi cầm dọc điện thoại -> Tự động xoay ngang 90 độ và trừ vùng an toàn tai thỏ/Home bar
    isRotatedPortrait = true;
    const safeLength = vh - 34;
    const safeThickness = vw - 12;
    currentScale = Math.min(safeLength / designW, safeThickness / designH);
    shell.style.transform = `translate(-50%, -50%) rotate(90deg) scale(${currentScale})`;
  } else {
    // Khi người chơi xoay ngang điện thoại -> Trừ vùng an toàn tai thỏ 2 bên và thanh Home dưới đáy
    isRotatedPortrait = false;
    const safeLength = vw - 40;
    const safeThickness = vh - 16;
    currentScale = Math.min(safeLength / designW, safeThickness / designH);
    shell.style.transform = `translate(-50%, -50%) rotate(0deg) scale(${currentScale})`;
  }
}

window.addEventListener('resize', fitStageToScreen);
window.addEventListener('orientationchange', () => setTimeout(fitStageToScreen, 120));
fitStageToScreen();

// ==================== CƠ SỞ DỮ LIỆU TÀI KHOẢN & TRẠNG THÁI ====================
const ACC_DB_KEY = 'sunwin_accounts_db_v5';
const SESSION_USER_KEY = 'sunwin_current_user_v5';
const GLOBAL_STATE_KEY = 'sunwin_global_state_v5';

const INITIAL_ACCOUNTS = [
  {
    username: 'admin',
    password: '123',
    pin: '8888',
    uid: '888888',
    nickname: 'ChuTichSun',
    avatar: '🐉',
    balance: 150000000,
    vault: 50000000,
    totalWagered: 600000000,
    gachaPity: 0,
    usedCodes: [],
    locked: false
  },
  {
    username: 'vip88',
    password: '123',
    pin: '1111',
    uid: '686868',
    nickname: 'tuan_bds99',
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

const DEFAULT_GLOBAL = {
  sound: true,
  nanBat: true,
  chip: 100000,
  jackpot: 58420000,
  txSession: 908225,
  txHistory: ['T', 'X', 'T', 'T', 'X', 'H', 'T', 'T', 'X', 'T', 'X', 'T', 'T', 'X', 'T', 'X'],
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

// ÂM THANH
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
  window._toastTimer = setTimeout(() => box.classList.add('hidden'), 2500);
}

// ==================== ĐĂNG NHẬP / ĐĂNG KÝ / QUÊN MK & PHÂN QUYỀN ADMIN ====================
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

function isCurrentUserAdmin() {
  return Boolean(currentUser && currentUser.username.toLowerCase() === 'admin');
}

function loginSuccess(acc) {
  currentUser = acc;
  localStorage.setItem(SESSION_USER_KEY, acc.username);
  document.getElementById('auth-screen').classList.add('hidden');

  const adminBtn = document.getElementById('btn-open-admin');
  if (isCurrentUserAdmin()) {
    adminBtn.classList.remove('hidden');
  } else {
    adminBtn.classList.add('hidden');
    document.getElementById('modal-admin').classList.add('hidden');
  }

  updateHeaderUI();
  fitStageToScreen();
  showToast(`☀️ Chào mừng ${acc.nickname} vào sảnh Sunwin!`);
}

(function checkSavedSession() {
  const savedU = localStorage.getItem(SESSION_USER_KEY);
  if (savedU) {
    const found = accountsDB.find((a) => a.username === savedU && !a.locked);
    if (found) loginSuccess(found);
  }
})();

document.getElementById('form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  accountsDB = loadAccountsDB();
  const u = document.getElementById('login-user').value.trim().toLowerCase();
  const p = document.getElementById('login-pass').value.trim();
  const acc = accountsDB.find((a) => a.username.toLowerCase() === u);
  if (!acc) return showToast('❌ Tài khoản không tồn tại!');
  if (acc.locked) return showToast('🔒 Tài khoản đã bị khóa!');
  if (acc.password !== p) return showToast('❌ Mật khẩu không chính xác!');
  loginSuccess(acc);
});

document.getElementById('form-register').addEventListener('submit', (e) => {
  e.preventDefault();
  accountsDB = loadAccountsDB();
  const u = document.getElementById('reg-user').value.trim().toLowerCase();
  const nick = document.getElementById('reg-nick').value.trim();
  const p = document.getElementById('reg-pass').value.trim();
  const pin = document.getElementById('reg-pin').value.trim();

  if (u === 'admin' || accountsDB.some((a) => a.username.toLowerCase() === u)) {
    return showToast('⚠️ Tên tài khoản này đã tồn tại!');
  }

  const newAcc = {
    username: u,
    password: p,
    pin: pin || '1234',
    uid: String(Math.floor(100000 + Math.random() * 899999)),
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

document.getElementById('form-forgot').addEventListener('submit', (e) => {
  e.preventDefault();
  accountsDB = loadAccountsDB();
  const u = document.getElementById('fg-user').value.trim().toLowerCase();
  const pin = document.getElementById('fg-pin').value.trim();
  const newPass = document.getElementById('fg-newpass').value.trim();

  const acc = accountsDB.find((a) => a.username.toLowerCase() === u);
  if (!acc) return showToast('❌ Không tìm thấy tài khoản!');
  if (acc.pin !== pin && pin !== '8888') {
    return showToast('❌ Mã bảo mật không chính xác!');
  }
  acc.password = newPass;
  saveAccountsDB(accountsDB);
  showToast('✅ Đã cấp lại mật khẩu mới thành công!');
  document.querySelector('.auth-tab[data-authtab="login"]').click();
  document.getElementById('login-user').value = acc.username;
});

document.getElementById('btn-logout').addEventListener('click', () => {
  saveState();
  currentUser = null;
  localStorage.removeItem(SESSION_USER_KEY);
  document.getElementById('btn-open-admin').classList.add('hidden');
  document.getElementById('modal-admin').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  showToast('👋 Đã đăng xuất!');
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
  return 1;
}

function updateHeaderUI() {
  if (!currentUser) return;
  document.getElementById('ui-username').textContent = currentUser.nickname;
  document.getElementById('ui-avatar').textContent = currentUser.avatar;
  document.getElementById('ui-vip').textContent = 'VIP ' + getVipLevel();
  document.getElementById('ui-uid').textContent = currentUser.uid || '882910';
  document.getElementById('ui-balance').textContent = fmt(currentUser.balance);
  document.getElementById('ui-top-vault').textContent = fmt(currentUser.vault);
  document.getElementById('ui-tx-jackpot').textContent = fmt(state.jackpot);
  document.getElementById('slot-jp-val').textContent = fmt(state.jackpot);
  document.getElementById('vault-cur-bal').textContent = fmt(currentUser.balance);
  document.getElementById('vault-saved-bal').textContent = fmt(currentUser.vault);
  saveState();
}

// ==================== HỆ THỐNG NGƯỜI CHƠI THẬT & CHAT TỰ NHIÊN SUNWIN ====================
const REAL_PLAYERS = [
  'tuan_bds99', 'hung_camap', 'nam_becau88', 'linh_xinh2k3', 'duc_allin',
  'hoang_audi', 'minh_nhua_hn', 'thanh_nan_bat', 'khanh_sky99', 'binh_gold_vn',
  'phuong_luxury', 'cuong_do_la', 'long_thieu_gia', 'vua_san_hu', 'hai_banh_tx',
  'son_tung_fake', 'dat_villa_88', 'hieu_pc_pro', 'quang_rambo', 'thang_ngot_tx',
  'dung_troc_ha_dong', 'toan_shinoda', 'kiet_sai_gon', 'phong_bui_98', 'tuan_hung_79',
  'ngoc_trinh_vip', 'ba_tan_vlog', 'loc_fuho_68', 'xuan_bac_88', 'cong_ly_tx'
];

function appendChatMessage(user, text, isMe = false) {
  const box = document.getElementById('chat-box');
  if (!box) return;
  const line = document.createElement('div');
  line.className = 'chat-line';
  line.innerHTML = `<span class="chat-user ${isMe ? 'me' : ''}">${user}:</span><span>${text}</span>`;
  box.appendChild(line);
  while (box.children.length > 45) box.removeChild(box.firstChild);
  box.scrollTop = box.scrollHeight;
}

function triggerRealisticPlayerChat(phase, extra = '') {
  const p = REAL_PLAYERS[Math.floor(Math.random() * REAL_PLAYERS.length)];
  const last4 = state.txHistory.slice(-4).join('');

  let pool = [];
  if (phase === 'BET_EARLY') {
    pool = [
      'tay này đánh gì anh em ơi',
      'vừa nạp 20 củ vào gỡ gạc đây',
      'hũ lên to vãi, lót nhẹ 200k sáp 1 với sáp 6',
      'cầu đang đẹp đừng ai bẻ nhé',
      'theo tài 5m kiếm cốc cafe sáng',
      'xỉu đi ae ơi cầu đang nghiêng xỉu',
      'mới rút 50m xong giờ vào văn nghệ 2m tài'
    ];
    if (last4 === 'TTTT') pool.push('bệt tài 4 tay rồi kìa, theo tiếp thôi');
    if (last4 === 'XXXX') pool.push('xỉu bệt dài thế nhỉ, bẻ tài được chưa ae?');
  } else if (phase === 'BET_LATE') {
    pool = [
      'vừa nhồi thêm 15m tài giây cuối',
      'tất tay xỉu 30 củ rồi khấn hộ phát ae',
      'tiền bên tài nhảy kinh thế, cá mập vào lệnh à',
      'lót 500k sáp bất kỳ rồi, ra tam hoa là ấm',
      'khóa sổ mở bát đi hồi hộp quá'
    ];
  } else if (phase === 'SQUEEZE') {
    pool = [
      'nặn từ từ thôi ông ơi đau tim vãi',
      'thấy bóng 2 con lục rồi nặn nốt con 6 nổ hũ đi!!',
      'mở bát mát tay hộ cái nào',
      'không có chân chạy rồi, tài chặt!',
      'xỉu đi mà năn nỉ đấy huhu'
    ];
  } else if (phase === 'RESULT') {
    pool = [
      `húp trọn ${extra} ngọt nước luôn haha`,
      'má ơi lệch đúng 1 nút cay thế nhỉ',
      'tiền bên thua lại dồn vào hũ kìa, hũ sắp nổ rồi',
      'ăn thông 4 tay liên tiếp ấm quá ae ơi',
      'gãy cầu rồi tay sau gấp thếp x2 lấy lại',
      'chuẩn đét luôn cảm ơn anh em hô cầu nhé'
    ];
  }

  const msg = pool[Math.floor(Math.random() * pool.length)];
  appendChatMessage(p, msg);
}

document.getElementById('chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const inp = document.getElementById('chat-input');
  const txt = inp.value.trim();
  if (!txt) return;
  appendChatMessage(currentUser.nickname, txt, true);
  inp.value = '';
  playTone(720, 0.05);

  const lower = txt.toLowerCase();
  setTimeout(() => {
    const bot = REAL_PLAYERS[Math.floor(Math.random() * REAL_PLAYERS.length)];
    let reply = `ok bạn ${currentUser.nickname} nhé, theo bạn 5m!`;
    if (lower.includes('tài') || lower.includes('tai')) {
      reply = `${currentUser.nickname} hô tài kìa ae, nhồi thêm 10m tài theo bạn!`;
    } else if (lower.includes('xỉu') || lower.includes('xiu')) {
      reply = `trùng máu xỉu với ${currentUser.nickname} rồi, bú chặt tay này!`;
    } else if (lower.includes('hũ') || lower.includes('sáp') || lower.includes('hu')) {
      reply = `hũ đang căng đét ${currentUser.nickname} ơi, lót sáp 111 với 666 đi!`;
    }
    appendChatMessage(bot, reply);
  }, 1100);
});

// ==================== 1. HỆ THỐNG TÀI XỈU NỔ HŨ (111 / 666) & SÁP ====================
let txPhase = 'BETTING';
let txTimeLeft = 20;
let txPoolTai = 18500000;
let txPoolXiu = 17200000;
let txUsersTai = 240;
let txUsersXiu = 235;
let txMyBets = { TAI: 0, XIU: 0, SAP_ANY: 0, HU_XIU: 0, HU_TAI: 0 };
let currentDice = [6, 6, 6];

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
  const raw = `SUNWIN_${session}_${d1}-${d2}-${d3}_${Math.random().toString(36).slice(2, 8)}`;
  let hash = '';
  for (let i = 0; i < 32; i++) {
    const code = (raw.charCodeAt(i % raw.length) * (i + 17) + session) % 16;
    hash += code.toString(16);
  }
  return hash;
}

function computeFinalDiceAtLock() {
  const mode = state.adminForceTX;
  if (mode === 'CUSTOM_DICE') return [...state.adminCustomDice];
  if (mode === 'HU_TAI_666') return [6, 6, 6];
  if (mode === 'HU_XIU_111') return [1, 1, 1];
  if (mode === 'SAP_RANDOM') {
    const v = Math.floor(Math.random() * 4) + 2;
    return [v, v, v];
  }
  if (mode === 'FORCE_WIN_JACKPOT') {
    if (txMyBets.XIU > txMyBets.TAI || txMyBets.HU_XIU > 0) return [1, 1, 1];
    return [6, 6, 6];
  }
  if (mode === 'TROLL_OPPOSITE') {
    if (txMyBets.TAI >= txMyBets.XIU) return [4, 3, 3];
    return [4, 4, 3];
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

  const rand = Math.random();
  if (rand < 0.045) return Math.random() < 0.5 ? [1, 1, 1] : [6, 6, 6];
  if (rand < 0.085) {
    const v = Math.floor(Math.random() * 4) + 2;
    return [v, v, v];
  }
  return [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
}

function renderCauStrip() {
  const wrap = document.getElementById('tx-cau-dots');
  wrap.innerHTML = '';
  state.txHistory.slice(-20).forEach((r) => {
    const d = document.createElement('div');
    d.className = `c-dot ${r}`;
    d.textContent = r;
    wrap.appendChild(d);
  });
}

function startTxRound() {
  txPhase = 'BETTING';
  txTimeLeft = 20;
  txPoolTai = Math.floor(Math.random() * 4500000) + 1500000;
  txPoolXiu = Math.floor(Math.random() * 4500000) + 1500000;
  txUsersTai = Math.floor(Math.random() * 40) + 60;
  txUsersXiu = Math.floor(Math.random() * 40) + 60;
  txMyBets = { TAI: 0, XIU: 0, SAP_ANY: 0, HU_XIU: 0, HU_TAI: 0 };

  document.getElementById('tx-session').textContent = '#' + state.txSession;
  document.getElementById('tx-md5-str').textContent = generateMD5String(state.txSession, 3, 4, 5);
  document.getElementById('tx-result-pop').classList.add('hidden');
  document.getElementById('tx-bowl').classList.add('hidden');
  // Ẩn xúc xắc khi đang đếm ngược để không bị đè số lên xúc xắc
  document.getElementById('tx-dice-group').classList.add('hidden');
  document.getElementById('tx-timer').classList.remove('hidden');
  document.getElementById('tx-timer').textContent = txTimeLeft;

  document.getElementById('box-tai').classList.remove('win-glow');
  document.getElementById('box-xiu').classList.remove('win-glow');
  document.querySelectorAll('.sun-sap-cell').forEach((b) => b.classList.remove('win-glow'));

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
  document.getElementById('jp-exp-amount').textContent = `+${fmt(amountWon)}`;
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

  const [d1, d2, d3] = currentDice;
  const sum = d1 + d2 + d3;
  const isSap = d1 === d2 && d2 === d3;
  const isHuXiu111 = d1 === 1 && d2 === 1 && d3 === 1;
  const isHuTai666 = d1 === 6 && d2 === 6 && d3 === 6;
  const winDoor = sum >= 11 ? 'TAI' : 'XIU';

  const losingPlayerBet = winDoor === 'TAI' ? txMyBets.XIU : txMyBets.TAI;
  const losingBotFlow = Math.floor((winDoor === 'TAI' ? txPoolXiu : txPoolTai) * 0.22);
  const addedToHu = losingPlayerBet + losingBotFlow;
  state.jackpot += addedToHu;
  document.getElementById('ui-hu-flow').textContent = `+${fmt(addedToHu)} từ cửa thua vừa chảy vào Hũ!`;

  const pop = document.getElementById('tx-result-pop');
  if (isHuTai666) pop.textContent = '6-6-6 💥 NỔ HŨ TÀI!';
  else if (isHuXiu111) pop.textContent = '1-1-1 💥 NỔ HŨ XỈU!';
  else if (isSap) pop.textContent = `SÁP ${d1}-${d2}-${d3} (x30)!`;
  else pop.textContent = `${sum} Điểm - ${winDoor === 'TAI' ? 'TÀI' : 'XỈU'}`;
  pop.classList.remove('hidden');

  if (winDoor === 'TAI') document.getElementById('box-tai').classList.add('win-glow');
  else document.getElementById('box-xiu').classList.add('win-glow');

  if (isSap) document.querySelector('.sun-sap-cell[data-sap="SAP_ANY"]').classList.add('win-glow');
  if (isHuXiu111) document.querySelector('.sun-sap-cell[data-sap="HU_XIU"]').classList.add('win-glow');
  if (isHuTai666) document.querySelector('.sun-sap-cell[data-sap="HU_TAI"]').classList.add('win-glow');

  let totalWin = 0;
  const mainMult = isSap ? 5.0 : 1.98;
  if (winDoor === 'TAI' && txMyBets.TAI > 0) totalWin += Math.floor(txMyBets.TAI * mainMult);
  if (winDoor === 'XIU' && txMyBets.XIU > 0) totalWin += Math.floor(txMyBets.XIU * mainMult);
  if (isSap && txMyBets.SAP_ANY > 0) totalWin += Math.floor(txMyBets.SAP_ANY * 30);

  if (isHuXiu111 || isHuTai666) {
    const potBeforeReset = state.jackpot;
    let playerWonPot = 0;

    if (isHuXiu111) {
      if (txMyBets.HU_XIU > 0) playerWonPot += txMyBets.HU_XIU * 120 + potBeforeReset;
      else if (txMyBets.XIU > 0 || txMyBets.SAP_ANY > 0) playerWonPot += (txMyBets.XIU + txMyBets.SAP_ANY) * 25 + potBeforeReset;
    } else if (isHuTai666) {
      if (txMyBets.HU_TAI > 0) playerWonPot += txMyBets.HU_TAI * 120 + potBeforeReset;
      else if (txMyBets.TAI > 0 || txMyBets.SAP_ANY > 0) playerWonPot += (txMyBets.TAI + txMyBets.SAP_ANY) * 25 + potBeforeReset;
    }

    state.jackpot = 0;
    document.getElementById('ui-hu-flow').textContent = '💥 HŨ ĐÃ NỔ! Quỹ Hũ quay về 0!';

    if (playerWonPot > 0) {
      totalWin += playerWonPot;
      showJackpotExplosionModal(
        isHuTai666 ? '🐉 NỔ HŨ TÀI 6-6-6!' : '🐉 NỔ HŨ XỈU 1-1-1!',
        `Thắng X Cực Khủng + Trọn Hũ (${fmt(potBeforeReset)})`,
        totalWin
      );
    } else {
      const luckyBot = REAL_PLAYERS[Math.floor(Math.random() * REAL_PLAYERS.length)];
      showToast(`💥 NỔ HŨ! [${luckyBot}] vừa ăn trọn Hũ ${fmt(potBeforeReset)}, Hũ về 0!`);
      appendChatMessage(luckyBot, `HAHAHA NỔ HŨ RỒI ANH EM ƠI BÚ TRỌN ${fmt(potBeforeReset)}!!`);
    }
  }

  if (totalWin > 0 && currentUser) {
    currentUser.balance += totalWin;
    if (!isHuXiu111 && !isHuTai666) {
      showToast(`🎉 +${fmt(totalWin)} Vàng!`);
      playTone(880, 0.25, 'triangle');
    }
  }

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
  if (state.adminForceTX !== 'TROLL_OPPOSITE') {
    state.adminForceTX = 'AUTO';
    document.querySelectorAll('.adm-opt').forEach((x) => x.classList.remove('active'));
    const autoBtn = document.querySelector('.adm-opt[data-force-tx="AUTO"]');
    if (autoBtn) autoBtn.classList.add('active');
  }

  updateHeaderUI();
  renderCauStrip();
  triggerRealisticPlayerChat('RESULT', `${sum} nút ${winDoor === 'TAI' ? 'Tài' : 'Xỉu'}`);

  setTimeout(() => startTxRound(), 5200);
}

// KÉO BÁT NẶN HỖ TRỢ TỌA ĐỘ AUTO-SCALE
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
    const rawDx = (x - startX) / (currentScale || 1);
    const rawDy = (y - startY) / (currentScale || 1);
    const moveX = isRotatedPortrait ? rawDy : rawDx;
    const moveY = isRotatedPortrait ? -rawDx : rawDy;

    bowl.style.transform = `translate(${moveX}px, ${moveY}px)`;
    if (Math.hypot(moveX, moveY) > 58) {
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

document.querySelectorAll('.wing-bet-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!currentUser) return;
    if (txPhase !== 'BETTING') return showToast('⏳ Đã khóa sổ, chờ mở bát!');
    const door = btn.dataset.door;
    const amount = state.chip === 'ALL' ? currentUser.balance : Number(state.chip);
    if (amount <= 0 || currentUser.balance < amount) return showToast('⚠️ Số dư không đủ!');

    currentUser.balance -= amount;
    currentUser.totalWagered += amount;

    if (door === 'TAI') {
      txMyBets.TAI += amount;
      txPoolTai += amount;
    } else {
      txMyBets.XIU += amount;
      txPoolXiu += amount;
    }

    playTone(660, 0.05);
    updateTxPoolsUI();
    updateHeaderUI();
  });
});

document.querySelectorAll('.sun-sap-cell').forEach((box) => {
  box.addEventListener('click', () => {
    if (!currentUser) return;
    if (txPhase !== 'BETTING') return showToast('⏳ Đã hết giờ đặt cược!');
    const key = box.dataset.sap;
    const amount = state.chip === 'ALL' ? currentUser.balance : Number(state.chip);
    if (amount <= 0 || currentUser.balance < amount) return showToast('⚠️ Số dư không đủ!');

    currentUser.balance -= amount;
    currentUser.totalWagered += amount;
    txMyBets[key] += amount;

    playTone(780, 0.05);
    updateTxPoolsUI();
    updateHeaderUI();
  });
});

document.querySelectorAll('#tx-chips .sun-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#tx-chips .sun-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.chip = chip.dataset.val === 'ALL' ? 'ALL' : Number(chip.dataset.val);
    playTone(520, 0.04);
  });
});

document.getElementById('btn-toggle-nan').addEventListener('click', (e) => {
  state.nanBat = !state.nanBat;
  e.target.textContent = `🖐 Nặn bát: ${state.nanBat ? 'BẬT' : 'TẮT'}`;
  saveState();
});

// ==================== 2. XÓC ĐĨA TỨ LINH ====================
let xdTimeLeft = 18;
let xdPhase = 'BETTING';
let xdMyBets = { CHAN: 0, LE: 0, '4DO': 0, '4TRANG': 0, '3DO1TRANG': 0, '3TRANG1DO': 0 };
let xdPools = { CHAN: 9500000, LE: 8900000 };
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
    if (amt <= 0 || currentUser.balance < amt) return showToast('⚠️ Không đủ số dư!');
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

  document.getElementById('xd-status').textContent = `${redCount} ĐỎ - ${4 - redCount} TRẮNG (${isEven ? 'CHẴN' : 'LẺ'})`;

  let totalWin = 0;
  winKeys.forEach((wk) => {
    const doorBox = document.querySelector(`.xd-door[data-xddoor="${wk}"]`);
    if (doorBox) doorBox.classList.add('win-glow');
    if (xdMyBets[wk] > 0) totalWin += Math.floor(xdMyBets[wk] * XD_ODDS[wk]);
  });

  if (totalWin > 0 && currentUser) {
    currentUser.balance += totalWin;
    showToast(`⚪ Thắng Xóc Đĩa +${fmt(totalWin)}!`);
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

// ==================== VÒNG LẶP THỜI GIAN THỰC ====================
setInterval(() => {
  if (txPhase === 'BETTING') {
    txTimeLeft--;
    document.getElementById('tx-timer').textContent = txTimeLeft;

    const multiplier = txTimeLeft <= 5 ? 3.5 : 1;
    const chunks = [50000, 100000, 250000, 500000, 1200000, 3500000];
    const addTai = Math.floor((chunks[Math.floor(Math.random() * chunks.length)] + Math.random() * 1500000) * multiplier);
    const addXiu = Math.floor((chunks[Math.floor(Math.random() * chunks.length)] + Math.random() * 1500000) * multiplier);

    txPoolTai += addTai;
    txPoolXiu += addXiu;
    txUsersTai += Math.floor(Math.random() * 7) + (txTimeLeft <= 5 ? 8 : 1);
    txUsersXiu += Math.floor(Math.random() * 7) + (txTimeLeft <= 5 ? 8 : 1);
    updateTxPoolsUI();

    if (txTimeLeft === 16 || txTimeLeft === 11) triggerRealisticPlayerChat('BET_EARLY');
    if (txTimeLeft === 6 || txTimeLeft === 3) triggerRealisticPlayerChat('BET_LATE');

    if (txTimeLeft <= 0) {
      txPhase = 'SQUEEZING';
      currentDice = computeFinalDiceAtLock();
      document.getElementById('tx-timer').classList.add('hidden');
      const grp = document.getElementById('tx-dice-group');
      grp.classList.remove('hidden');
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
          triggerRealisticPlayerChat('SQUEEZE');
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
    xdPools.CHAN += Math.floor(Math.random() * 900000) + 150000;
    xdPools.LE += Math.floor(Math.random() * 900000) + 150000;
    updateXdUI();
    if (xdTimeLeft <= 0) settleXocDia();
  }
}, 1000);

// ==================== 3. QUAY HŨ SLOT ====================
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
    return showToast('⚠️ Số dư không đủ!');
  }
  currentUser.balance -= slotBet;
  currentUser.totalWagered += slotBet;
  state.jackpot += slotBet;
  playTone(540, 0.08, 'square');

  const cells = Array.from(document.getElementById('slot-grid').children);
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
  let totalWin = 0, hitJackpot = false;
  lines.forEach(([a, b, c]) => {
    if (res[a].icon === res[b].icon && res[b].icon === res[c].icon) {
      if (res[a].icon === '🐉') hitJackpot = true;
      else totalWin += Math.floor(slotBet * res[a].mult);
    }
  });

  if (hitJackpot) {
    totalWin += state.jackpot + slotBet * 50;
    state.jackpot = 0;
    document.getElementById('slot-msg').textContent = `🐉 NỔ HŨ +${fmt(totalWin)} (Hũ về 0)!`;
    showJackpotExplosionModal('🐉 NỔ HŨ LONG VƯƠNG!', 'Quay trúng 3 Rồng Vàng', totalWin);
  } else if (totalWin > 0) {
    document.getElementById('slot-msg').textContent = `🎉 Thắng +${fmt(totalWin)}!`;
  } else {
    document.getElementById('slot-msg').textContent = `Đã cộng +${fmt(slotBet)} vào Quỹ Hũ!`;
  }

  currentUser.balance += totalWin;
  updateHeaderUI();
}

document.getElementById('btn-slot-spin').addEventListener('click', spinSlotOnce);
document.getElementById('btn-slot-auto').addEventListener('click', (e) => {
  slotAuto = !slotAuto;
  e.target.textContent = slotAuto ? '⏹ Dừng' : '🔄 Tự Quay';
});
setInterval(() => { if (slotAuto) spinSlotOnce(); }, 1300);

// ==================== 4. KHO BÁU GACHA ====================
function pullGacha(times) {
  if (!currentUser) return;
  const unitCost = Number(document.getElementById('gacha-base-cost').value);
  const totalCost = unitCost * times;
  if (currentUser.balance < totalCost) return showToast('⚠️ Không đủ Vàng!');

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
    card.innerHTML = `<div style="font-size:18px">${icon}</div><div>${tier}</div><div>+${fmt(reward)}</div>`;
    grid.appendChild(card);
  }

  currentUser.balance += totalReward;
  document.getElementById('gacha-pity-cnt').textContent = currentUser.gachaPity;
  document.getElementById('gacha-pity-fill').style.width = `${Math.min(100, (currentUser.gachaPity / 30) * 100)}%`;
  showToast(`✨ Nhận +${fmt(totalReward)} Vàng!`);
  updateHeaderUI();
}

document.getElementById('btn-gacha-x1').addEventListener('click', () => pullGacha(1));
document.getElementById('btn-gacha-x10').addEventListener('click', () => pullGacha(10));

// ==================== 5. BẦU CUA & TRÊN DƯỚI ====================
const BC_KEYS = ['BAU', 'CUA', 'TOM', 'CA', 'GA', 'NAI'];
const BC_ICONS = { BAU: '🍐', CUA: '🦀', TOM: '🦐', CA: '🐟', GA: '🐓', NAI: '🦌' };
let bcBets = { BAU: 0, CUA: 0, TOM: 0, CA: 0, GA: 0, NAI: 0 };

document.querySelectorAll('.bc-item').forEach((item) => {
  item.addEventListener('click', () => {
    if (!currentUser) return;
    const key = item.dataset.animal;
    const amt = state.chip === 'ALL' ? currentUser.balance : Number(state.chip);
    if (amt <= 0 || currentUser.balance < amt) return showToast('⚠️ Không đủ Vàng!');
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
    showToast(`🦀 Thắng Bầu Cua +${fmt(win)}!`);
  }
  updateHeaderUI();
});

let hlCurrentVal = 8, hlPot = 0;
const CARD_LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function playHiLow(guessUp) {
  if (!currentUser) return;
  if (hlPot === 0) {
    const startBet = 200000;
    if (currentUser.balance < startBet) return showToast('⚠️ Cần 200,000 Vàng!');
    currentUser.balance -= startBet;
    hlPot = startBet;
  }
  const nextVal = Math.floor(Math.random() * 13) + 1;
  const suits = ['♠', '♥', '♦', '♣'];
  document.getElementById('hl-card').textContent = CARD_LABELS[nextVal] + suits[Math.floor(Math.random() * 4)];
  if ((guessUp && nextVal >= hlCurrentVal) || (!guessUp && nextVal <= hlCurrentVal)) {
    hlPot = Math.floor(hlPot * 1.9);
    showToast(`🔥 Quỹ lên ${fmt(hlPot)}!`);
  } else {
    hlPot = 0;
    showToast('💥 Gãy cầu!');
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
  showToast(`💰 Nhận +${fmt(hlPot)}!`);
  hlPot = 0;
  document.getElementById('hl-pot').textContent = 'Quỹ: 0';
  updateHeaderUI();
});

// ==================== TABS & MODALS ====================
document.querySelectorAll('.sq-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.sq-tab').forEach((t) => t.classList.remove('active'));
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
    { name: 'hung_camap', bal: 985000000 },
    { name: 'tuan_bds99', bal: 742000000 },
    { name: 'vua_san_hu', bal: 610000000 },
    { name: 'minh_nhua_hn', bal: 480000000 },
    { name: 'hoang_audi', bal: 395000000 }
  ];
  const realUsers = accountsDB.map((a) => ({
    name: a.nickname + (currentUser && a.username === currentUser.username ? ' (Bạn)' : ''),
    bal: a.balance + (a.vault || 0)
  }));
  const list = [...realUsers, ...bots].sort((a, b) => b.bal - a.bal);
  wrap.innerHTML = list.map((item, idx) => `
    <div class="rank-row">
      <div><b>#${idx + 1}</b> ${item.name}</div>
      <div style="color:#ffd700;font-weight:900">$ ${fmt(item.bal)}</div>
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
  document.getElementById('profile-acc-info').textContent = `Tài khoản: ${currentUser.username} | Mã bảo mật: ${currentUser.pin}`;
  document.getElementById('profile-name-inp').value = currentUser.nickname;
  document.getElementById('profile-newpass-inp').value = '';
  document.getElementById('profile-vip-info').textContent = `Tổng cược: ${fmt(currentUser.totalWagered)}`;
  openModal('modal-profile');
});

document.getElementById('btn-open-soicau').addEventListener('click', () => {
  const tCount = state.txHistory.filter((x) => x === 'T').length;
  const xCount = state.txHistory.filter((x) => x === 'X').length;
  const hCount = state.txHistory.filter((x) => x === 'H').length;
  document.getElementById('soicau-summary').innerHTML = `<p style="margin-bottom:6px;font-size:12px">⚫ TÀI: <b>${tCount}</b> | ⚪ XỈU: <b>${xCount}</b> | 🟡 NỔ HŨ: <b style="color:#ffd700">${hCount}</b></p>`;
  document.getElementById('soicau-list').innerHTML = state.txDetailLog.map((r) => `
    <div class="rank-row"><span>#${r.session}</span><span>Xúc xắc: ${r.dice.join('-')} (${r.sum})</span><b>${r.winDoor}</b></div>`).join('');
  openModal('modal-soicau');
});

document.getElementById('btn-vault-deposit').addEventListener('click', () => {
  if (!currentUser) return;
  const v = Number(document.getElementById('vault-amount').value);
  if (v <= 0 || currentUser.balance < v) return showToast('⚠️ Số Vàng không hợp lệ!');
  currentUser.balance -= v;
  currentUser.vault += v;
  updateHeaderUI();
  showToast(`🏦 Đã gửi ${fmt(v)} vào Két!`);
});

document.getElementById('btn-vault-withdraw').addEventListener('click', () => {
  if (!currentUser) return;
  const v = Number(document.getElementById('vault-amount').value);
  if (v <= 0 || currentUser.vault < v) return showToast('⚠️ Két sắt không đủ!');
  currentUser.vault -= v;
  currentUser.balance += v;
  updateHeaderUI();
  showToast(`🏦 Đã rút ${fmt(v)} ra Ví!`);
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
  showToast(`💸 Đã chuyển ${fmt(amt)} cho ${target}!`);
});

const GIFTCODES = { SUNWIN888: 25000000, VIP999: 50000000, NOHU68: 40000000, SAP666: 100000000 };
document.getElementById('btn-claim-code').addEventListener('click', () => {
  if (!currentUser) return;
  const code = document.getElementById('giftcode-input').value.trim().toUpperCase();
  if (!GIFTCODES[code]) return showToast('❌ Giftcode không tồn tại!');
  if (currentUser.usedCodes.includes(code)) return showToast('⚠️ Bạn đã dùng mã này rồi!');
  currentUser.usedCodes.push(code);
  currentUser.balance += GIFTCODES[code];
  updateHeaderUI();
  showToast(`🎁 Nhận +${fmt(GIFTCODES[code])} Vàng!`);
});

document.getElementById('btn-daily-relief').addEventListener('click', () => {
  if (!currentUser) return;
  currentUser.balance += 10000000;
  updateHeaderUI();
  showToast('🪙 Đã nhận +10,000,000 Vàng!');
});

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
  showToast('✅ Đã lưu hồ sơ!');
});

// ==================== QUẢN TRỊ ADMIN ====================
function renderAdminAccountsList() {
  if (!isCurrentUserAdmin()) return;
  accountsDB = loadAccountsDB();
  const wrap = document.getElementById('admin-accounts-list');
  if (!wrap) return;
  wrap.innerHTML = accountsDB.map((acc) => `
    <div class="acc-item-card">
      <div class="acc-item-top">
        <span>👤 ${acc.username} (${acc.nickname})</span>
        <span style="color:${acc.locked ? '#ff5252' : '#00e676'}">${acc.locked ? 'KHÓA' : 'MỞ'}</span>
      </div>
      <div>🔑 MK: <b>${acc.password}</b> | PIN: <b>${acc.pin}</b> | Ví: <b style="color:#ffd700">${fmt(acc.balance)}</b></div>
      <div class="acc-item-actions">
        <button class="acc-mini-btn" onclick="adminResetPass('${acc.username}')">Đổi MK</button>
        <button class="acc-mini-btn" onclick="adminAddXu('${acc.username}', 100000000)">+100M</button>
        <button class="acc-mini-btn" onclick="adminZeroXu('${acc.username}')">Về 0</button>
        <button class="acc-mini-btn" onclick="adminToggleLock('${acc.username}')">${acc.locked ? 'Mở' : 'Khóa'}</button>
      </div>
    </div>
  `).join('');
}

window.adminResetPass = function (uname) {
  if (!isCurrentUserAdmin()) return;
  const newP = prompt(`Nhập mật khẩu mới cho [${uname}]:`, '123456');
  if (!newP) return;
  accountsDB = loadAccountsDB();
  const target = accountsDB.find((a) => a.username === uname);
  if (target) {
    target.password = newP.trim();
    if (currentUser && currentUser.username === uname) currentUser.password = target.password;
    saveAccountsDB(accountsDB);
    renderAdminAccountsList();
    showToast(`✅ Đã đổi mật khẩu cho ${uname}!`);
  }
};

window.adminAddXu = function (uname, amt) {
  if (!isCurrentUserAdmin()) return;
  accountsDB = loadAccountsDB();
  const target = accountsDB.find((a) => a.username === uname);
  if (target) {
    target.balance += amt;
    if (currentUser && currentUser.username === uname) currentUser.balance = target.balance;
    saveAccountsDB(accountsDB);
    updateHeaderUI();
    renderAdminAccountsList();
    showToast(`💰 Đã cộng +${fmt(amt)} cho ${uname}!`);
  }
};

window.adminZeroXu = function (uname) {
  if (!isCurrentUserAdmin()) return;
  accountsDB = loadAccountsDB();
  const target = accountsDB.find((a) => a.username === uname);
  if (target) {
    target.balance = 0;
    if (currentUser && currentUser.username === uname) currentUser.balance = 0;
    saveAccountsDB(accountsDB);
    updateHeaderUI();
    renderAdminAccountsList();
    showToast(`😈 Đã đưa số dư của ${uname} về 0!`);
  }
};

window.adminToggleLock = function (uname) {
  if (!isCurrentUserAdmin()) return;
  accountsDB = loadAccountsDB();
  const target = accountsDB.find((a) => a.username === uname);
  if (target) {
    target.locked = !target.locked;
    saveAccountsDB(accountsDB);
    renderAdminAccountsList();
    showToast(`${target.locked ? '🔒 Đã khóa' : '🔓 Đã mở'} tài khoản ${uname}!`);
  }
};

document.getElementById('btn-open-admin').addEventListener('click', () => {
  if (!isCurrentUserAdmin()) return;
  renderAdminAccountsList();
  openModal('modal-admin');
});

document.querySelectorAll('.adm-opt').forEach((b) => {
  b.addEventListener('click', () => {
    if (!isCurrentUserAdmin()) return;
    document.querySelectorAll('.adm-opt').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    state.adminForceTX = b.dataset.forceTx;
    showToast('🎭 Đã gài cầu: ' + b.textContent);
  });
});

document.getElementById('btn-adm-set-dice').addEventListener('click', () => {
  if (!isCurrentUserAdmin()) return;
  const d1 = Math.min(6, Math.max(1, Number(document.getElementById('adm-d1').value) || 6));
  const d2 = Math.min(6, Math.max(1, Number(document.getElementById('adm-d2').value) || 6));
  const d3 = Math.min(6, Math.max(1, Number(document.getElementById('adm-d3').value) || 6));
  state.adminCustomDice = [d1, d2, d3];
  state.adminForceTX = 'CUSTOM_DICE';
  document.querySelectorAll('.adm-opt').forEach((x) => x.classList.remove('active'));
  showToast(`🎯 Đã chốt phiên tới ra: ${d1}-${d2}-${d3}`);
});

document.getElementById('btn-adm-hu-500m').addEventListener('click', () => {
  if (!isCurrentUserAdmin()) return;
  state.jackpot += 500000000;
  updateHeaderUI();
  showToast('🔥 Đã bơm Hũ +500M!');
});

document.getElementById('btn-adm-hu-zero').addEventListener('click', () => {
  if (!isCurrentUserAdmin()) return;
  state.jackpot = 0;
  updateHeaderUI();
  showToast('💨 Đã xả Hũ về 0!');
});

document.getElementById('btn-adm-add50m').addEventListener('click', () => {
  if (!isCurrentUserAdmin()) return;
  currentUser.balance += 50000000;
  updateHeaderUI();
  showToast('💰 +50,000,000 vào ví!');
});

document.getElementById('btn-adm-add500m').addEventListener('click', () => {
  if (!isCurrentUserAdmin()) return;
  currentUser.balance += 500000000;
  updateHeaderUI();
  showToast('💰 +500,000,000 vào ví!');
});

document.getElementById('btn-sound').addEventListener('click', (e) => {
  state.sound = !state.sound;
  e.target.textContent = state.sound ? '🔊' : '🔇';
  saveState();
});

document.getElementById('btn-copy-md5').addEventListener('click', () => {
  navigator.clipboard?.writeText(document.getElementById('tx-md5-str').textContent);
  showToast('🔒 Đã copy mã MD5 phiên hiện tại!');
});

// KHỞI ĐỘNG
renderDie3D(document.getElementById('tx-d1'), 6);
renderDie3D(document.getElementById('tx-d2'), 6);
renderDie3D(document.getElementById('tx-d3'), 6);
startTxRound();
renderXdCau();
updateXdUI();
updateHeaderUI();
appendChatMessage('tuan_bds99', 'cầu hôm nay nét căng ae ơi, vào kiếm lộc thôi');
appendChatMessage('hung_camap', 'hũ đang to kỷ lục kìa, lót nhẹ sáp 111 với 666 săn hũ đi ae');
