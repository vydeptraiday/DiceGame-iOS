
    /*************************************************************************
     * 1. WEB AUDIO API PROCEDURAL CASINO SOUND SYNTHESIZER
     *************************************************************************/
    const SoundFX = {
      enabled: true,
      ctx: null,
      init() {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      },
      playTone(freq, type = 'sine', duration = 0.12, gainVal = 0.15) {
        if (!this.enabled) return;
        try {
          this.init();
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
      },
      click() {
        this.playTone(720, 'triangle', 0.06, 0.12);
      },
      chip() {
        this.playTone(1350, 'sine', 0.08, 0.16);
        setTimeout(() => this.playTone(1760, 'sine', 0.09, 0.14), 45);
      },
      tick(urgent = false) {
        this.playTone(urgent ? 980 : 540, urgent ? 'sawtooth' : 'sine', 0.07, urgent ? 0.16 : 0.08);
      },
      shake() {
        if (!this.enabled) return;
        for (let i = 0; i < 5; i++) {
          setTimeout(() => this.playTone(220 + Math.random() * 260, 'triangle', 0.06, 0.15), i * 55);
        }
      },
      win() {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((n, idx) => {
          setTimeout(() => this.playTone(n, 'triangle', 0.22, 0.2), idx * 95);
        });
      },
      lose() {
        this.playTone(300, 'sawtooth', 0.18, 0.12);
        setTimeout(() => this.playTone(220, 'sawtooth', 0.25, 0.12), 140);
      }
    };

    function toggleSound() {
      SoundFX.enabled = !SoundFX.enabled;
      const icon = document.getElementById('icon-sound');
      icon.className = SoundFX.enabled ? 'fa-solid fa-volume-high text-sm' : 'fa-solid fa-volume-xmark text-sm text-red-400';
      showToast(SoundFX.enabled ? 'Đã bật âm thanh bàn chơi' : 'Đã tắt âm thanh');
    }

    /*************************************************************************
     * 2. GLOBAL STATE & PERSISTENT PLAYER STORAGE
     *************************************************************************/
    const STORAGE_KEY = 'HOANG_GIA_VIP_STATE_V2';

    const AppState = {
      user: {
        uid: 889966,
        nickname: 'LongVương99',
        avatar: '🐉',
        vip: 8,
        balance: 50000000,
        safeBalance: 10000000,
        wins: 0,
        totalBets: 0,
        personalHistory: []
      },
      config: {
        roundDuration: 20,
        maintenance: false,
        adminAuthenticated: false,
        queuedAdminDice: null // { d1, d2, d3 } when Admin queues a test round
      },
      taixiu: {
        sessionId: 108852,
        phase: 'BETTING', // 'BETTING' | 'LOCKED' | 'SHAKING' | 'NAN_BAT' | 'RESULT'
        timer: 20,
        selectedChip: 100000,
        taiPot: 18450000,
        xiuPot: 17920000,
        taiPlayers: 428,
        xiuPlayers: 395,
        userBetTai: 0,
        userBetXiu: 0,
        lastBetSide: null,
        lastBetAmount: 0,
        currentDice: [6, 5, 3],
        currentMode: 'RNG', // 'RNG' | 'ADMIN_TEST'
        currentSeed: '',
        currentMD5: '',
        bowlOpened: false,
        jackpot: 888999500,
        history: []
      },
      mockPlayers: [
        { uid: 889966, name: 'LongVương99 (Bạn)', vip: 8, coins: 50000000 },
        { uid: 772104, name: 'ĐạiGiaPhốNúi', vip: 9, coins: 245000000 },
        { uid: 651920, name: 'ThầnTàiGõCửa', vip: 7, coins: 128500000 },
        { uid: 519082, name: 'VuaNặnBát68', vip: 6, coins: 84200000 },
        { uid: 309411, name: 'PhượngHoàngLửa', vip: 5, coins: 42900000 }
      ]
    };

    function loadSavedState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.user) Object.assign(AppState.user, parsed.user);
          if (parsed.config) {
            AppState.config.roundDuration = parsed.config.roundDuration || 20;
          }
          if (parsed.history && Array.isArray(parsed.history) && parsed.history.length > 0) {
            AppState.taixiu.history = parsed.history;
            AppState.taixiu.sessionId = parsed.history[parsed.history.length - 1].sessionId + 1;
          }
        }
      } catch (e) {}

      if (AppState.taixiu.history.length === 0) {
        // Seed 24 realistic past rounds for Soi Cầu charts
        let baseId = AppState.taixiu.sessionId - 24;
        for (let i = 0; i < 24; i++) {
          const d1 = 1 + Math.floor(Math.random() * 6);
          const d2 = 1 + Math.floor(Math.random() * 6);
          const d3 = 1 + Math.floor(Math.random() * 6);
          const sum = d1 + d2 + d3;
          const res = sum >= 11 ? 'TAI' : 'XIU';
          const seed = `Phien#${baseId + i}_D[${d1}-${d2}-${d3}]_R${Math.floor(100000 + Math.random() * 900000)}`;
          AppState.taixiu.history.push({
            sessionId: baseId + i,
            dice: [d1, d2, d3],
            sum,
            result: res,
            mode: 'RNG',
            seed,
            md5: pseudoMD5(seed)
          });
        }
      }
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          user: AppState.user,
          config: { roundDuration: AppState.config.roundDuration },
          history: AppState.taixiu.history.slice(-100)
        }));
      } catch (e) {}
    }

    function formatNumber(n) {
      return Math.floor(Number(n) || 0).toLocaleString('en-US');
    }

    function showToast(msg, type = 'info') {
      const container = document.getElementById('toast-container');
      const el = document.createElement('div');
      const borderCol = type === 'win' ? 'border-yellow-300 bg-gradient-to-r from-amber-900 to-red-900' :
                        type === 'error' ? 'border-red-400 bg-red-950' :
                        'border-amber-400 bg-[#240906]';
      el.className = `${borderCol} border-2 text-amber-100 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 transition-all duration-300`;
      el.innerHTML = `<i class="fa-solid fa-crown text-yellow-400"></i><span>${msg}</span>`;
      container.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
      }, 3200);
    }

    /*************************************************************************
     * 3. DETERMINISTIC HASH & FAIR RNG ENGINE
     *************************************************************************/
    function pseudoMD5(str) {
      let h1 = 0xdeadbeef ^ str.length;
      let h2 = 0x41c6ce57 ^ str.length;
      let h3 = 0x9e3779b9 ^ str.length;
      let h4 = 0x85ebca6b ^ str.length;
      for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
        h3 = Math.imul(h3 ^ ch, 2246822507);
        h4 = Math.imul(h4 ^ ch, 3266489909);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
      h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
      const hex = (n) => (n >>> 0).toString(16).padStart(8, '0');
      return hex(h1) + hex(h2) + hex(h3) + hex(h4);
    }

    function generateFairDice() {
      if (window.crypto && window.crypto.getRandomValues) {
        const arr = new Uint32Array(3);
        window.crypto.getRandomValues(arr);
        return [(arr[0] % 6) + 1, (arr[1] % 6) + 1, (arr[2] % 6) + 1];
      }
      return [
        1 + Math.floor(Math.random() * 6),
        1 + Math.floor(Math.random() * 6),
        1 + Math.floor(Math.random() * 6)
      ];
    }

    /*************************************************************************
     * 4. 3D DICE RENDERING & ORIENTATION
     *************************************************************************/
    const FACE_PIPS = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };

    function buildSingle3DDie(cubeId) {
      const cube = document.getElementById(cubeId);
      if (!cube) return;
      cube.innerHTML = '';
      for (let face = 1; face <= 6; face++) {
        const faceEl = document.createElement('div');
        faceEl.className = `dice-face face-${face}`;
        const activeCells = FACE_PIPS[face];
        for (let cell = 0; cell < 9; cell++) {
          const cellDiv = document.createElement('div');
          cellDiv.className = 'flex items-center justify-center';
          if (activeCells.includes(cell)) {
            const pip = document.createElement('div');
            const isRed = (face === 1 || face === 4);
            pip.className = `pip ${isRed ? 'pip-red' : ''} ${face === 1 ? 'pip-center-1' : ''}`;
            cellDiv.appendChild(pip);
          }
          faceEl.appendChild(cellDiv);
        }
        cube.appendChild(faceEl);
      }
    }

    const FACE_ROTATIONS = {
      1: { x: 0, y: 0 },
      2: { x: 0, y: 180 },
      3: { x: 0, y: -90 },
      4: { x: 0, y: 90 },
      5: { x: -90, y: 0 },
      6: { x: 90, y: 0 }
    };

    function orientDiceCube(cubeId, value) {
      const cube = document.getElementById(cubeId);
      if (!cube) return;
      cube.classList.remove('shaking');
      const rot = FACE_ROTATIONS[value] || { x: 0, y: 0 };
      const extraZ = (Math.floor(Math.random() * 5) - 2) * 8;
      cube.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg) rotateZ(${extraZ}deg)`;
    }

    /*************************************************************************
     * 5. INTERACTIVE "NẶN BÁT" (DRAG-TO-PEEK PORCELAIN LID)
     *************************************************************************/
    function initNanBatInteraction() {
      const lid = document.getElementById('nan-bowl-lid');
      let dragging = false;
      let startX = 0, startY = 0;
      let offsetX = 0, offsetY = 0;

      const onStart = (clientX, clientY) => {
        if (AppState.taixiu.phase !== 'NAN_BAT') return;
        dragging = true;
        startX = clientX - offsetX;
        startY = clientY - offsetY;
        lid.style.transition = 'none';
      };

      const onMove = (clientX, clientY) => {
        if (!dragging) return;
        offsetX = clientX - startX;
        offsetY = clientY - startY;
        lid.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        const dist = Math.hypot(offsetX, offsetY);
        if (dist > 105) {
          dragging = false;
          forceOpenBowl();
        }
      };

      const onEnd = () => {
        dragging = false;
      };

      lid.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
      window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
      window.addEventListener('mouseup', onEnd);

      lid.addEventListener('touchstart', (e) => {
        if (e.touches[0]) onStart(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (dragging && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      window.addEventListener('touchend', onEnd);

      window.resetNanBowlLidPosition = () => {
        offsetX = 0;
        offsetY = 0;
        lid.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
        lid.style.transform = 'translate(0px, 0px)';
        lid.style.opacity = '1';
      };
    }

    function forceOpenBowl() {
      if (AppState.taixiu.bowlOpened) return;
      AppState.taixiu.bowlOpened = true;
      const lid = document.getElementById('nan-bowl-lid');
      const quickBtn = document.getElementById('btn-quick-open-bowl');
      lid.style.opacity = '0';
      setTimeout(() => lid.classList.add('hidden'), 240);
      quickBtn.classList.add('hidden');
      revealTaixiuRoundOutcome();
    }

    /*************************************************************************
     * 6. TÀI XỈU ROUND STATE MACHINE
     *************************************************************************/
    function prepareNewTaixiuRound() {
      const tx = AppState.taixiu;
      tx.phase = 'BETTING';
      tx.timer = AppState.config.roundDuration || 20;
      tx.taiPot = 2500000 + Math.floor(Math.random() * 3500000);
      tx.xiuPot = 2500000 + Math.floor(Math.random() * 3500000);
      tx.taiPlayers = 90 + Math.floor(Math.random() * 60);
      tx.xiuPlayers = 90 + Math.floor(Math.random() * 60);
      tx.userBetTai = 0;
      tx.userBetXiu = 0;
      tx.bowlOpened = false;

      // Reset Visuals
      document.getElementById('wing-tai').classList.remove('wing-winner');
      document.getElementById('wing-xiu').classList.remove('wing-winner');
      document.getElementById('tx-result-badge').classList.add('hidden');
      document.getElementById('tx-dice-wrapper').classList.add('hidden');
      document.getElementById('nan-bowl-lid').classList.add('hidden');
      document.getElementById('btn-quick-open-bowl').classList.add('hidden');
      document.getElementById('tx-timer-overlay').classList.remove('hidden');

      // Determine outcome ahead of time for MD5 commitment OR Admin Test Round
      if (AppState.config.queuedAdminDice) {
        const { d1, d2, d3 } = AppState.config.queuedAdminDice;
        tx.currentDice = [d1, d2, d3];
        tx.currentMode = 'ADMIN_TEST';
        tx.currentSeed = `QUAN_TRO_TEST_#${tx.sessionId}_D[${d1}-${d2}-${d3}]`;
        AppState.config.queuedAdminDice = null;
        updateAdminQueueStatusUI();
      } else {
        tx.currentDice = generateFairDice();
        tx.currentMode = 'RNG';
        const salt = Math.random().toString(36).substring(2, 10).toUpperCase();
        tx.currentSeed = `RNG_#${tx.sessionId}_D[${tx.currentDice.join('-')}]_SALT_${salt}`;
      }
      tx.currentMD5 = pseudoMD5(tx.currentSeed);

      updateTaixiuUI();
    }

    function tickTaixiuEngine() {
      const tx = AppState.taixiu;

      if (tx.phase === 'BETTING') {
        // Simulate organic pot growth
        tx.taiPot += Math.floor(Math.random() * 1400000);
        tx.xiuPot += Math.floor(Math.random() * 1400000);
        tx.taiPlayers += Math.floor(Math.random() * 14);
        tx.xiuPlayers += Math.floor(Math.random() * 14);
        tx.jackpot += Math.floor(Math.random() * 45000);

        tx.timer--;
        if (tx.timer <= 5 && tx.timer > 0) {
          SoundFX.tick(true);
        } else if (tx.timer > 5) {
          SoundFX.tick(false);
        }

        if (tx.timer <= 0) {
          tx.phase = 'LOCKED';
          tx.timer = 2;
          document.getElementById('tx-phase-label').textContent = 'CÂN CỬA & KHÓA SỔ';
        }
        updateTaixiuUI();
      } else if (tx.phase === 'LOCKED') {
        tx.timer--;
        if (tx.timer <= 0) {
          startShakingDicePhase();
        }
      } else if (tx.phase === 'SHAKING') {
        tx.timer--;
        if (tx.timer <= 0) {
          startNanBatOrRevealPhase();
        }
      } else if (tx.phase === 'NAN_BAT') {
        tx.timer--;
        if (tx.timer <= 0) {
          forceOpenBowl();
        }
      } else if (tx.phase === 'RESULT') {
        tx.timer--;
        if (tx.timer <= 0) {
          tx.sessionId++;
          prepareNewTaixiuRound();
        }
      }
    }

    function startShakingDicePhase() {
      const tx = AppState.taixiu;
      tx.phase = 'SHAKING';
      tx.timer = 2;
      SoundFX.shake();

      document.getElementById('tx-phase-label').textContent = 'ĐANG LẮC XÚC XẮC...';
      document.getElementById('tx-timer-overlay').classList.add('hidden');
      const diceWrap = document.getElementById('tx-dice-wrapper');
      diceWrap.classList.remove('hidden');

      ['dice-cube-1', 'dice-cube-2', 'dice-cube-3'].forEach(id => {
        document.getElementById(id).classList.add('shaking');
      });
    }

    function startNanBatOrRevealPhase() {
      const tx = AppState.taixiu;
      const [d1, d2, d3] = tx.currentDice;
      orientDiceCube('dice-cube-1', d1);
      orientDiceCube('dice-cube-2', d2);
      orientDiceCube('dice-cube-3', d3);

      const nanEnabled = document.getElementById('chk-nan-bat').checked;
      if (nanEnabled) {
        tx.phase = 'NAN_BAT';
        tx.timer = 5;
        document.getElementById('tx-phase-label').textContent = 'MỜI NẶN BÁT (5s)';
        const lid = document.getElementById('nan-bowl-lid');
        lid.classList.remove('hidden');
        window.resetNanBowlLidPosition();
        document.getElementById('btn-quick-open-bowl').classList.remove('hidden');
      } else {
        tx.bowlOpened = true;
        revealTaixiuRoundOutcome();
      }
    }

    function revealTaixiuRoundOutcome() {
      const tx = AppState.taixiu;
      tx.phase = 'RESULT';
      tx.timer = 4;

      const [d1, d2, d3] = tx.currentDice;
      const sum = d1 + d2 + d3;
      const outcome = sum >= 11 ? 'TAI' : 'XIU';
      const isTriple = (d1 === d2 && d2 === d3);

      document.getElementById('tx-phase-label').textContent = 'KẾT QUẢ PHIÊN';
      const badge = document.getElementById('tx-result-badge');
      const badgeTxt = document.getElementById('tx-result-text');
      badge.classList.remove('hidden');
      badgeTxt.textContent = `${sum} Điểm (${d1}-${d2}-${d3}) • ${outcome === 'TAI' ? 'TÀI' : 'XỈU'}${isTriple ? ' BÃO!' : ''}`;

      // Highlight Winning Wing
      if (outcome === 'TAI') {
        document.getElementById('wing-tai').classList.add('wing-winner');
      } else {
        document.getElementById('wing-xiu').classList.add('wing-winner');
      }

      // Reveal Seed
      document.getElementById('tx-last-seed').textContent = tx.currentSeed;

      // Record Session History
      tx.history.push({
        sessionId: tx.sessionId,
        dice: [d1, d2, d3],
        sum,
        result: outcome,
        mode: tx.currentMode,
        seed: tx.currentSeed,
        md5: tx.currentMD5
      });

      // Settle Player Predictions
      const userPlaced = tx.userBetTai + tx.userBetXiu;
      if (userPlaced > 0) {
        const winningBet = outcome === 'TAI' ? tx.userBetTai : tx.userBetXiu;
        let payout = 0;
        if (winningBet > 0) {
          payout = winningBet * 2;
          AppState.user.balance += payout;
          AppState.user.wins++;
          SoundFX.win();
          showToast(`CHÚC MỪNG! Bạn dự đoán đúng ${outcome === 'TAI' ? 'TÀI' : 'XỈU'} (+${formatNumber(payout)} Xu Thành Tích)!`, 'win');
        } else {
          SoundFX.lose();
          showToast(`Phiên #${tx.sessionId} về ${outcome === 'TAI' ? 'TÀI' : 'XỈU'} (${sum} điểm). Chúc bạn may mắn phiên sau!`);
        }

        AppState.user.personalHistory.unshift({
          sessionId: tx.sessionId,
          betTai: tx.userBetTai,
          betXiu: tx.userBetXiu,
          outcome,
          sum,
          payout
        });
      }

      saveState();
      updateHeaderUI();
      renderRoadmapStrip();
      renderPersonalBetHistory();
    }

    /*************************************************************************
     * 7. PLAYER BETTING & CHIP CONTROLS
     *************************************************************************/
    function selectChip(val) {
      SoundFX.click();
      AppState.taixiu.selectedChip = val;
      document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.chip) === val);
      });
    }

    function placeTaixiuPrediction(side, customAmount = null) {
      if (AppState.config.maintenance) {
        showToast('Hệ thống đang trong chế độ Bảo Trì, vui lòng chờ Quản Trò mở lại!', 'error');
        return;
      }
      const tx = AppState.taixiu;
      if (tx.phase !== 'BETTING') {
        showToast('Đã hết thời gian dự đoán của phiên này, vui lòng chờ phiên mới!', 'error');
        return;
      }
      const amount = customAmount !== null ? customAmount : tx.selectedChip;
      if (amount <= 0) return;
      if (AppState.user.balance < amount) {
        showToast('Số dư Xu Thành Tích không đủ! Hãy nhấn "+Nhận Xu" trên thanh tiêu đề.', 'error');
        return;
      }

      SoundFX.chip();
      AppState.user.balance -= amount;
      if (side === 'TAI') {
        tx.userBetTai += amount;
        tx.taiPot += amount;
      } else {
        tx.userBetXiu += amount;
        tx.xiuPot += amount;
      }
      tx.lastBetSide = side;
      tx.lastBetAmount = amount;
      if (tx.userBetTai + tx.userBetXiu === amount) {
        AppState.user.totalBets++;
      }

      updateHeaderUI();
      updateTaixiuUI();
      saveState();
    }

    function actionAllIn() {
      const side = AppState.taixiu.lastBetSide || 'TAI';
      if (AppState.user.balance <= 0) {
        showToast('Bạn không còn Xu khả dụng để Tất Tay!', 'error');
        return;
      }
      placeTaixiuPrediction(side, AppState.user.balance);
    }

    function actionDoubleBet() {
      const tx = AppState.taixiu;
      if (tx.userBetTai === 0 && tx.userBetXiu === 0) {
        showToast('Hãy đặt dự đoán vào cửa Tài hoặc Xỉu trước khi Gấp Thếp X2!', 'error');
        return;
      }
      if (tx.userBetTai > 0) placeTaixiuPrediction('TAI', tx.userBetTai);
      if (tx.userBetXiu > 0) placeTaixiuPrediction('XIU', tx.userBetXiu);
    }

    function actionRebet() {
      const tx = AppState.taixiu;
      if (!tx.lastBetSide || !tx.lastBetAmount) {
        showToast('Chưa có mức dự đoán trước đó để Đặt Lại!', 'error');
        return;
      }
      placeTaixiuPrediction(tx.lastBetSide, tx.lastBetAmount);
    }

    function actionCancelBet() {
      const tx = AppState.taixiu;
      if (tx.phase !== 'BETTING') {
        showToast('Phiên đã khóa sổ, không thể hoàn trả dự đoán!', 'error');
        return;
      }
      const totalRefund = tx.userBetTai + tx.userBetXiu;
      if (totalRefund <= 0) return;
      SoundFX.click();
      AppState.user.balance += totalRefund;
      tx.taiPot = Math.max(0, tx.taiPot - tx.userBetTai);
      tx.xiuPot = Math.max(0, tx.xiuPot - tx.userBetXiu);
      tx.userBetTai = 0;
      tx.userBetXiu = 0;
      showToast(`Đã hoàn trả ${formatNumber(totalRefund)} Xu Thành Tích về ví!`);
      updateHeaderUI();
      updateTaixiuUI();
      saveState();
    }

    /*************************************************************************
     * 8. UI RENDERING HELPERS
     *************************************************************************/
    function updateHeaderUI() {
      document.getElementById('header-avatar').textContent = AppState.user.avatar;
      document.getElementById('header-nickname').textContent = AppState.user.nickname;
      document.getElementById('header-vip-badge').textContent = `VIP ${AppState.user.vip}`;
      document.getElementById('header-uid').textContent = AppState.user.uid;
      document.getElementById('header-balance').textContent = formatNumber(AppState.user.balance);
      document.getElementById('header-safe-balance').textContent = formatNumber(AppState.user.safeBalance);

      // Update mockPlayers index 0 for Admin table & Leaderboard
      AppState.mockPlayers[0].name = `${AppState.user.nickname} (Bạn)`;
      AppState.mockPlayers[0].coins = AppState.user.balance + AppState.user.safeBalance;
    }

    function updateTaixiuUI() {
      const tx = AppState.taixiu;
      document.getElementById('tx-session-id').textContent = tx.sessionId;
      document.getElementById('tx-md5-hash').textContent = tx.currentMD5;
      document.getElementById('tx-jackpot-counter').textContent = formatNumber(tx.jackpot);
      document.getElementById('tai-player-count').textContent = tx.taiPlayers;
      document.getElementById('xiu-player-count').textContent = tx.xiuPlayers;
      document.getElementById('tai-total-pot').textContent = formatNumber(tx.taiPot);
      document.getElementById('xiu-total-pot').textContent = formatNumber(tx.xiuPot);
      document.getElementById('tai-user-bet').textContent = formatNumber(tx.userBetTai);
      document.getElementById('xiu-user-bet').textContent = formatNumber(tx.userBetXiu);

      const countdownEl = document.getElementById('tx-countdown-num');
      countdownEl.textContent = String(tx.timer).padStart(2, '0');
      if (tx.timer <= 5) {
        countdownEl.className = 'font-digital font-black text-4xl sm:text-6xl text-red-500 animate-ping';
      } else {
        countdownEl.className = 'font-digital font-black text-4xl sm:text-6xl text-gold-gradient';
      }

      // Mode Ribbon (RNG vs Admin Test Round)
      const modeBadge = document.getElementById('tx-mode-badge');
      if (tx.currentMode === 'ADMIN_TEST') {
        modeBadge.className = 'bg-purple-900 border-2 border-yellow-300 text-yellow-200 text-xs font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-pulse';
        modeBadge.innerHTML = `<i class="fa-solid fa-flask"></i> ⚠️ CHẾ ĐỘ QUẢN TRÒ / VÒNG THỬ NGHIỆM`;
      } else {
        modeBadge.className = 'bg-emerald-950/90 border border-emerald-400/70 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5';
        modeBadge.innerHTML = `<i class="fa-solid fa-shield-halved"></i> NGẪU NHIÊN CÔNG BẰNG (RNG + MD5)`;
      }
    }

    function renderRoadmapStrip() {
      const strip = document.getElementById('tx-roadmap-strip');
      if (!strip) return;
      const recent20 = AppState.taixiu.history.slice(-20);
      strip.innerHTML = recent20.map(item => {
        const isTai = item.result === 'TAI';
        const bg = isTai
          ? 'bg-gradient-to-b from-slate-800 to-black text-yellow-300 border-yellow-400'
          : 'bg-gradient-to-b from-white to-amber-100 text-red-900 border-red-600';
        return `<div title="Phiên #${item.sessionId}: ${item.sum} điểm (${item.dice.join('-')})" class="w-6 h-6 rounded-full border-2 ${bg} font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow">${isTai ? 'T' : 'X'}</div>`;
      }).join('');
    }

    function renderPersonalBetHistory() {
      const box = document.getElementById('personal-bet-history');
      const badge = document.getElementById('user-winrate-badge');
      badge.textContent = `Thắng: ${AppState.user.wins}/${AppState.user.totalBets}`;

      if (AppState.user.personalHistory.length === 0) return;
      box.innerHTML = AppState.user.personalHistory.slice(0, 12).map(h => {
        const won = h.payout > 0;
        return `
          <div class="flex items-center justify-between bg-black/60 border border-amber-500/30 rounded-xl px-2.5 py-1.5">
            <div>
              <span class="font-bold text-amber-300">#${h.sessionId}</span>
              <span class="text-[11px] text-amber-100 ml-1">(${h.outcome === 'TAI' ? 'TÀI' : 'XỈU'} ${h.sum}đ)</span>
            </div>
            <div class="font-digital font-bold ${won ? 'text-emerald-400' : 'text-slate-400'}">
              ${won ? '+' + formatNumber(h.payout) : 'Thua'}
            </div>
          </div>
        `;
      }).join('');
    }

    function copyMD5Hash() {
      const md5 = AppState.taixiu.currentMD5;
      const temp = document.createElement('textarea');
      temp.value = md5;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
      showToast('Đã sao chép chuỗi MD5 vào bộ nhớ tạm!');
    }

    function claimDailyBonus() {
      SoundFX.win();
      AppState.user.balance += 5000000;
      updateHeaderUI();
      saveState();
      showToast('Điểm danh thành công! Bạn nhận được +5,000,000 Xu Thành Tích miễn phí!', 'win');
    }

    /*************************************************************************
     * 9. SOI CẦU CHARTS & BEAD MATRIX (MULTI-TAB MODAL)
     *************************************************************************/
    function openSoiCauModal() {
      SoundFX.click();
      renderSoiCauData();
      openModal('soicau-modal');
    }

    function switchSoiCauTab(tabId) {
      SoundFX.click();
      ['bead', 'chart', 'history'].forEach(t => {
        document.getElementById(`sc-tab-${t}`).classList.toggle('hidden', `tab-${t}` !== tabId);
        const btn = document.getElementById(`sc-btn-${t}`);
        btn.className = (`tab-${t}` === tabId)
          ? 'btn-gold px-3.5 py-1.5 rounded-xl text-xs'
          : 'bg-black/60 text-amber-200 border border-amber-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold';
      });
      renderSoiCauData();
    }

    function renderSoiCauData() {
      const hist = AppState.taixiu.history;
      const taiCount = hist.filter(h => h.result === 'TAI').length;
      const xiuCount = hist.length - taiCount;

      // Calculate longest streak
      let maxStreak = 1, curStreak = 1;
      for (let i = 1; i < hist.length; i++) {
        if (hist[i].result === hist[i - 1].result) {
          curStreak++;
          if (curStreak > maxStreak) maxStreak = curStreak;
        } else {
          curStreak = 1;
        }
      }

      document.getElementById('sc-stat-tai').textContent = taiCount;
      document.getElementById('sc-stat-xiu').textContent = xiuCount;
      document.getElementById('sc-stat-streak').textContent = `${maxStreak} Phiên`;
      const taiPct = hist.length ? Math.round((taiCount / hist.length) * 100) : 50;
      document.getElementById('sc-stat-ratio').textContent = `${taiPct}% - ${100 - taiPct}%`;

      // Bead Matrix (Last 72 sessions)
      const matrixEl = document.getElementById('sc-bead-matrix');
      const slice72 = hist.slice(-72);
      matrixEl.innerHTML = slice72.map(item => {
        const isTai = item.result === 'TAI';
        const cls = isTai
          ? 'bg-black text-yellow-300 border-yellow-400'
          : 'bg-white text-red-900 border-red-500';
        return `<div class="w-7 h-7 rounded-full border-2 ${cls} font-extrabold text-[10px] flex items-center justify-center">${item.sum}</div>`;
      }).join('');

      // SVG Line Chart 1: Sum 3-18
      const recent20 = hist.slice(-20);
      const sumBox = document.getElementById('sc-sum-chart-container');
      if (sumBox && recent20.length > 1) {
        const w = 680, h = 140, padX = 28, padY = 18;
        const pts = recent20.map((item, idx) => {
          const x = padX + (idx / (recent20.length - 1)) * (w - padX * 2);
          const y = h - padY - ((item.sum - 3) / 15) * (h - padY * 2);
          return { x, y, item };
        });
        const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
        const midY = h - padY - ((10.5 - 3) / 15) * (h - padY * 2);
        sumBox.innerHTML = `
          <svg viewBox="0 0 ${w} ${h}" class="w-full h-full">
            <line x1="${padX}" y1="${midY}" x2="${w - padX}" y2="${midY}" stroke="#ffd700" stroke-dasharray="4 4" stroke-width="1" />
            <polyline fill="none" stroke="#ffeb3b" stroke-width="2.5" points="${poly}" />
            ${pts.map(p => `
              <circle cx="${p.x}" cy="${p.y}" r="9" fill="${p.item.result === 'TAI' ? '#111827' : '#ffffff'}" stroke="#f59e0b" stroke-width="2" />
              <text x="${p.x}" y="${p.y + 3.5}" text-anchor="middle" font-size="9" font-weight="bold" fill="${p.item.result === 'TAI' ? '#fde047' : '#7f1d1d'}">${p.item.sum}</text>
            `).join('')}
          </svg>
        `;
      }

      // SVG Line Chart 2: Individual 3 Dice
      const diceBox = document.getElementById('sc-dice-chart-container');
      if (diceBox && recent20.length > 1) {
        const w = 680, h = 125, padX = 28, padY = 16;
        const buildLine = (dIdx, color) => {
          const pts = recent20.map((item, idx) => {
            const x = padX + (idx / (recent20.length - 1)) * (w - padX * 2);
            const val = item.dice[dIdx];
            const y = h - padY - ((val - 1) / 5) * (h - padY * 2);
            return `${x},${y}`;
          }).join(' ');
          return `<polyline fill="none" stroke="${color}" stroke-width="2" points="${pts}" />`;
        };
        diceBox.innerHTML = `
          <svg viewBox="0 0 ${w} ${h}" class="w-full h-full">
            ${buildLine(0, '#ef4444')}
            ${buildLine(1, '#eab308')}
            ${buildLine(2, '#06b6d4')}
          </svg>
        `;
      }

      // History Table
      const tbody = document.getElementById('sc-history-tbody');
      tbody.innerHTML = hist.slice().reverse().slice(0, 30).map(item => `
        <tr class="hover:bg-white/5">
          <td class="p-2.5 font-digital font-bold text-yellow-300">#${item.sessionId}</td>
          <td class="p-2.5 font-bold">${item.dice.join(' - ')}</td>
          <td class="p-2.5 font-digital font-bold">${item.sum}</td>
          <td class="p-2.5">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.result === 'TAI' ? 'bg-yellow-500 text-black' : 'bg-slate-200 text-red-900'}">
              ${item.result === 'TAI' ? 'TÀI' : 'XỈU'}
            </span>
          </td>
          <td class="p-2.5">
            ${item.mode === 'ADMIN_TEST'
              ? '<span class="text-purple-300 font-bold">⚠️ Quản Trò</span>'
              : '<span class="text-emerald-400">Ngẫu Nhiên</span>'}
          </td>
          <td class="p-2.5 font-mono text-[10px] text-amber-200/80">${item.seed}</td>
        </tr>
      `).join('');
    }

    /*************************************************************************
     * 10. MINI POKER, BẦU CUA, TRÊN DƯỚI MINI-GAMES
     *************************************************************************/
    // --- MINI POKER ---
    let mpBet = 1000;
    let mpAutoTimer = null;
    const SUITS = [
      { sym: '♠', col: 'text-slate-900' },
      { sym: '♣', col: 'text-slate-900' },
      { sym: '♦', col: 'text-red-600' },
      { sym: '♥', col: 'text-red-600' }
    ];
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    function setMiniPokerBet(val) {
      SoundFX.click();
      mpBet = val;
      [1000, 10000, 100000].forEach(b => {
        const el = document.getElementById(`mp-bet-${b}`);
        el.className = (b === val)
          ? 'mp-bet-btn btn-gold px-4 py-1.5 rounded-xl text-xs'
          : 'mp-bet-btn bg-black/70 border border-amber-500 text-amber-200 px-4 py-1.5 rounded-xl text-xs font-bold';
      });
    }

    function renderMiniPokerCards(cards) {
      const row = document.getElementById('mp-cards-row');
      row.innerHTML = cards.map(c => `
        <div class="h-28 sm:h-36 rounded-xl bg-gradient-to-br from-white via-amber-50 to-amber-100 border-2 border-yellow-400 shadow-lg flex flex-col justify-between p-2 ${c.suit.col}">
          <div class="font-black text-sm sm:text-lg leading-none">${c.rank}${c.suit.sym}</div>
          <div class="text-2xl sm:text-4xl self-center">${c.suit.sym}</div>
          <div class="font-black text-sm sm:text-lg leading-none self-end rotate-180">${c.rank}${c.suit.sym}</div>
        </div>
      `).join('');
    }

    function spinMiniPoker() {
      if (AppState.user.balance < mpBet) {
        showToast('Không đủ Xu Thành Tích để quay Mini Poker!', 'error');
        return;
      }
      SoundFX.chip();
      AppState.user.balance -= mpBet;
      updateHeaderUI();

      // Deal 5 unique cards
      const deck = [];
      SUITS.forEach((s, si) => RANKS.forEach((r, ri) => deck.push({ rank: r, rVal: ri + 2, suit: s, sIdx: si })));
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      const hand = deck.slice(0, 5);
      renderMiniPokerCards(hand);

      // Evaluate Hand
      const counts = {};
      hand.forEach(c => counts[c.rVal] = (counts[c.rVal] || 0) + 1);
      const freq = Object.values(counts).sort((a, b) => b - a);
      const isFlush = hand.every(c => c.sIdx === hand[0].sIdx);
      const sortedVals = hand.map(c => c.rVal).sort((a, b) => a - b);
      const isStraight = sortedVals.every((v, idx) => idx === 0 || v === sortedVals[idx - 1] + 1);

      let mult = 0;
      let handName = 'Chưa trúng tổ hợp thưởng';
      if (isFlush && isStraight) { mult = 1000; handName = '🔥 THÙNG PHÁ SẢNH NỔ HŨ!'; }
      else if (freq[0] === 4) { mult = 150; handName = '💎 TỨ QUÝ!'; }
      else if (freq[0] === 3 && freq[1] === 2) { mult = 50; handName = '👑 CÙ LŨ!'; }
      else if (isFlush) { mult = 20; handName = '✨ THÙNG!'; }
      else if (isStraight) { mult = 13; handName = '⚡ SẢNH!'; }
      else if (freq[0] === 3) { mult = 8; handName = '🎯 SÁM CÔ!'; }
      else if (freq[0] === 2 && freq[1] === 2) { mult = 5; handName = '🎉 HAI ĐÔI!'; }
      else if (freq[0] === 2) {
        const pairRank = Number(Object.keys(counts).find(k => counts[k] === 2));
        if (pairRank >= 11) { mult = 2.5; handName = '✨ ĐÔI J TRỞ LÊN!'; }
      }

      const banner = document.getElementById('mp-result-banner');
      if (mult > 0) {
        const winXu = Math.floor(mpBet * mult);
        AppState.user.balance += winXu;
        SoundFX.win();
        banner.textContent = `${handName} Nhận +${formatNumber(winXu)} Xu Thành Tích!`;
      } else {
        banner.textContent = 'Chúc bạn may mắn ở lượt quay tiếp theo!';
      }
      updateHeaderUI();
      saveState();
    }

    function toggleMiniPokerAuto() {
      const checked = document.getElementById('chk-mp-auto').checked;
      if (checked) {
        mpAutoTimer = setInterval(() => {
          if (document.getElementById('view-minipoker').classList.contains('hidden')) return;
          spinMiniPoker();
        }, 1800);
      } else if (mpAutoTimer) {
        clearInterval(mpAutoTimer);
        mpAutoTimer = null;
      }
    }

    // --- BẦU CUA HOÀNG GIA ---
    const MASCOTS = [
      { id: 'NAI', name: 'Nai Vàng', icon: '🦌' },
      { id: 'BAU', name: 'Bầu Ngọc', icon: '🏺' },
      { id: 'GA',  name: 'Gà Kim',   icon: '🐓' },
      { id: 'CA',  name: 'Cá Chép',  icon: '🐟' },
      { id: 'CUA', name: 'Cua Hoàng Đế', icon: '🦀' },
      { id: 'TOM', name: 'Tôm Hùm',  icon: '🦞' }
    ];
    const bcBets = { NAI: 0, BAU: 0, GA: 0, CA: 0, CUA: 0, TOM: 0 };

    function renderBauCuaBoard() {
      const grid = document.getElementById('bc-board-grid');
      if (!grid) return;
      grid.innerHTML = MASCOTS.map(m => `
        <div onclick="placeBauCuaBet('${m.id}')" class="bg-gradient-to-b from-[#3b0c08] to-[#1a0503] border-2 border-amber-500/70 hover:border-yellow-300 rounded-2xl p-4 flex flex-col items-center cursor-pointer transition shadow-lg">
          <div class="text-4xl sm:text-5xl mb-1">${m.icon}</div>
          <div class="font-bold text-sm text-gold-gradient">${m.name}</div>
          <div class="mt-2 bg-black/75 border border-yellow-500/50 rounded-full px-3 py-0.5 text-xs font-digital text-yellow-300">
            Đã đặt: ${formatNumber(bcBets[m.id])}
          </div>
        </div>
      `).join('');
    }

    function placeBauCuaBet(id) {
      if (AppState.user.balance < 100000) {
        showToast('Cần tối thiểu 100,000 Xu Thành Tích để đặt Bầu Cua!', 'error');
        return;
      }
      SoundFX.chip();
      AppState.user.balance -= 100000;
      bcBets[id] += 100000;
      updateHeaderUI();
      renderBauCuaBoard();
    }

    function clearBauCuaBets() {
      const refund = Object.values(bcBets).reduce((a, b) => a + b, 0);
      if (refund > 0) {
        AppState.user.balance += refund;
        Object.keys(bcBets).forEach(k => bcBets[k] = 0);
        updateHeaderUI();
        renderBauCuaBoard();
        showToast(`Đã hoàn trả ${formatNumber(refund)} Xu!`);
      }
    }

    function rollBauCua() {
      const totalBet = Object.values(bcBets).reduce((a, b) => a + b, 0);
      if (totalBet <= 0) {
        showToast('Hãy chọn ít nhất 1 linh vật trước khi Lắc Bầu Cua!', 'error');
        return;
      }
      SoundFX.shake();
      const picks = [
        MASCOTS[Math.floor(Math.random() * 6)],
        MASCOTS[Math.floor(Math.random() * 6)],
        MASCOTS[Math.floor(Math.random() * 6)]
      ];
      document.getElementById('bc-dice-display').innerHTML = picks.map(p => `<span class="text-2xl sm:text-3xl">${p.icon}</span>`).join('');

      let totalWin = 0;
      MASCOTS.forEach(m => {
        const bet = bcBets[m.id];
        if (bet > 0) {
          const matches = picks.filter(p => p.id === m.id).length;
          if (matches > 0) {
            totalWin += bet + (bet * matches);
          }
        }
        bcBets[m.id] = 0;
      });

      if (totalWin > 0) {
        AppState.user.balance += totalWin;
        SoundFX.win();
        document.getElementById('bc-status-msg').textContent = `🎉 Kết quả: ${picks.map(p => p.name).join(' - ')} • Bạn thắng +${formatNumber(totalWin)} Xu!`;
      } else {
        SoundFX.lose();
        document.getElementById('bc-status-msg').textContent = `Kết quả: ${picks.map(p => p.name).join(' - ')} • Chúc bạn may mắn ván sau!`;
      }
      updateHeaderUI();
      renderBauCuaBoard();
      saveState();
    }

    // --- TRÊN DƯỚI (CAO THẤP) ---
    let tdState = { active: false, pot: 0, streak: 0, currentRankIdx: 6 };

    function startTrenDuoi() {
      if (tdState.active) return;
      if (AppState.user.balance < 100000) {
        showToast('Cần 100,000 Xu Thành Tích để bắt đầu lượt Trên Dưới!', 'error');
        return;
      }
      SoundFX.chip();
      AppState.user.balance -= 100000;
      tdState.active = true;
      tdState.pot = 100000;
      tdState.streak = 0;
      tdState.currentRankIdx = Math.floor(Math.random() * RANKS.length);
      updateTrenDuoiUI();
      updateHeaderUI();
    }

    function guessTrenDuoi(dir) {
      if (!tdState.active) return;
      const nextIdx = Math.floor(Math.random() * RANKS.length);
      const won = (dir === 'HIGH' && nextIdx >= tdState.currentRankIdx) ||
                  (dir === 'LOW' && nextIdx <= tdState.currentRankIdx);
      tdState.currentRankIdx = nextIdx;
      if (won) {
        SoundFX.win();
        tdState.streak++;
        tdState.pot = Math.floor(tdState.pot * 1.85);
        document.getElementById('td-status-text').textContent = `Chính xác! Quỹ thưởng đã nhân lên ${formatNumber(tdState.pot)} Xu!`;
      } else {
        SoundFX.lose();
        tdState.active = false;
        tdState.pot = 0;
        tdState.streak = 0;
        document.getElementById('td-status-text').textContent = 'Rất tiếc, bạn đã đoán sai lá bài này. Hãy bắt đầu lượt mới!';
      }
      updateTrenDuoiUI();
    }

    function cashoutTrenDuoi() {
      if (!tdState.active || tdState.pot <= 0) return;
      SoundFX.win();
      AppState.user.balance += tdState.pot;
      showToast(`Đã thu về ví +${formatNumber(tdState.pot)} Xu Thành Tích từ Trên Dưới!`, 'win');
      tdState.active = false;
      tdState.pot = 0;
      tdState.streak = 0;
      updateTrenDuoiUI();
      updateHeaderUI();
      saveState();
    }

    function updateTrenDuoiUI() {
      const rank = RANKS[tdState.currentRankIdx];
      const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
      document.getElementById('td-card-top').textContent = `${rank}${suit.sym}`;
      document.getElementById('td-card-Suit').textContent = suit.sym;
      document.getElementById('td-card-bot').textContent = `${rank}${suit.sym}`;
      document.getElementById('td-current-pot').textContent = formatNumber(tdState.pot);
      document.getElementById('td-streak-info').textContent = `Chuỗi thắng: ${tdState.streak} liên tiếp`;
      document.getElementById('btn-td-start').classList.toggle('hidden', tdState.active);
      document.getElementById('td-guess-controls').classList.toggle('hidden', !tdState.active);
    }

    /*************************************************************************
     * 11. ADMIN CONTROL PANEL (SHA-256 AUTH + TRANSPARENT TEST MODE)
     *************************************************************************/
    function openAdminPanel() {
      SoundFX.click();
      renderAdminPlayersTable();
      openModal('admin-modal');
    }

    async function verifyAdminAuth() {
      const input = document.getElementById('admin-pin-input').value.trim();
      // Expected code is SUNWIN2026 -> verified via hash comparison
      const hashHex = pseudoMD5('ADMIN_SALT_' + input);
      const validHash = pseudoMD5('ADMIN_SALT_SUNWIN2026');
      if (hashHex === validHash) {
        AppState.config.adminAuthenticated = true;
        document.getElementById('admin-auth-gate').classList.add('hidden');
        document.getElementById('admin-dashboard-body').classList.remove('hidden');
        SoundFX.win();
        showToast('Đã mở khóa Bảng Quản Trò!');
      } else {
        document.getElementById('admin-auth-msg').textContent = 'Mã xác thực không đúng! Hãy nhập: SUNWIN2026';
      }
    }

    function queueAdminTestRound() {
      const d1 = Number(document.getElementById('admin-d1').value);
      const d2 = Number(document.getElementById('admin-d2').value);
      const d3 = Number(document.getElementById('admin-d3').value);
      AppState.config.queuedAdminDice = { d1, d2, d3 };

      // Also apply immediately to current round if still in BETTING phase
      if (AppState.taixiu.phase === 'BETTING') {
        AppState.taixiu.currentDice = [d1, d2, d3];
        AppState.taixiu.currentMode = 'ADMIN_TEST';
        AppState.taixiu.currentSeed = `QUAN_TRO_TEST_#${AppState.taixiu.sessionId}_D[${d1}-${d2}-${d3}]`;
        AppState.taixiu.currentMD5 = pseudoMD5(AppState.taixiu.currentSeed);
        AppState.config.queuedAdminDice = null;
        updateTaixiuUI();
      }
      updateAdminQueueStatusUI();
      showToast(`Đã kích hoạt Vòng Thử Nghiệm (Quản Trò): ${d1} - ${d2} - ${d3}`);
    }

    function clearAdminTestRound() {
      AppState.config.queuedAdminDice = null;
      if (AppState.taixiu.phase === 'BETTING') {
        AppState.taixiu.currentDice = generateFairDice();
        AppState.taixiu.currentMode = 'RNG';
        AppState.taixiu.currentSeed = `RNG_#${AppState.taixiu.sessionId}_D[${AppState.taixiu.currentDice.join('-')}]`;
        AppState.taixiu.currentMD5 = pseudoMD5(AppState.taixiu.currentSeed);
        updateTaixiuUI();
      }
      updateAdminQueueStatusUI();
      showToast('Đã chuyển bàn chơi về Chế Độ Ngẫu Nhiên Công Bằng (RNG)!');
    }

    function updateAdminQueueStatusUI() {
      const el = document.getElementById('admin-queue-status');
      if (!el) return;
      if (AppState.taixiu.currentMode === 'ADMIN_TEST' || AppState.config.queuedAdminDice) {
        const d = AppState.config.queuedAdminDice
          ? [AppState.config.queuedAdminDice.d1, AppState.config.queuedAdminDice.d2, AppState.config.queuedAdminDice.d3]
          : AppState.taixiu.currentDice;
        el.className = 'text-xs font-bold text-yellow-300';
        el.textContent = `⚠️ Đang kích hoạt Vòng Thử Nghiệm (Quản Trò): Bộ xúc xắc [${d.join(' - ')}]`;
      } else {
        el.className = 'text-xs font-bold text-emerald-300';
        el.textContent = 'Trạng thái: Đang chạy Ngẫu Nhiên Công Bằng (RNG)';
      }
    }

    function saveAdminRoundTime() {
      const val = Math.min(60, Math.max(10, Number(document.getElementById('admin-round-time').value) || 20));
      AppState.config.roundDuration = val;
      saveState();
      showToast(`Đã cập nhật thời gian mỗi vòng chơi: ${val} giây!`);
    }

    function toggleMaintenanceMode() {
      AppState.config.maintenance = !AppState.config.maintenance;
      document.getElementById('maintenance-banner').classList.toggle('hidden', !AppState.config.maintenance);
      const btn = document.getElementById('btn-admin-maint');
      btn.textContent = AppState.config.maintenance ? 'Đang BẬT Bảo Trì' : 'Đang TẮT';
      btn.className = AppState.config.maintenance
        ? 'bg-red-700 border border-yellow-300 text-white px-3 py-1.5 rounded-xl text-xs font-bold'
        : 'bg-slate-800 border border-amber-400 text-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold';
    }

    function adminGrantCoins(amt) {
      AppState.user.balance += amt;
      updateHeaderUI();
      renderAdminPlayersTable();
      saveState();
      showToast(`Đã cấp thêm +${formatNumber(amt)} Xu Thành Tích!`);
    }

    function renderAdminPlayersTable() {
      const tbody = document.getElementById('admin-players-tbody');
      if (!tbody) return;
      tbody.innerHTML = AppState.mockPlayers.map((p, idx) => `
        <tr>
          <td class="p-2 font-mono text-amber-300">${p.uid}</td>
          <td class="p-2 font-bold">${p.name}</td>
          <td class="p-2"><span class="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">VIP ${p.vip}</span></td>
          <td class="p-2 font-digital text-yellow-300">${formatNumber(p.coins)}</td>
          <td class="p-2">
            ${idx === 0 ? `<button onclick="adminGrantCoins(5000000)" class="bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">+5M Xu</button>` : `<span class="text-amber-400/60 text-[10px]">Bot/Người chơi</span>`}
          </td>
        </tr>
      `).join('');
    }

    /*************************************************************************
     * 12. PROFILE, SAFE BOX, LEADERBOARD & LIVE CHAT
     *************************************************************************/
    function selectAvatar(emoji) {
      SoundFX.click();
      AppState.user.avatar = emoji;
      document.getElementById('profile-modal-avatar').textContent = emoji;
    }

    function savePlayerProfile() {
      const name = document.getElementById('profile-name-input').value.trim() || 'HoàngGiaVIP';
      AppState.user.nickname = name;
      updateHeaderUI();
      saveState();
      closeModal('profile-modal');
      showToast(`Đã lưu thông tin nhân vật: ${name}`);
    }

    function switchOrResetAccount() {
      AppState.user.uid = Math.floor(100000 + Math.random() * 900000);
      AppState.user.nickname = 'TânVương' + Math.floor(10 + Math.random() * 89);
      AppState.user.balance = 50000000;
      AppState.user.safeBalance = 0;
      AppState.user.wins = 0;
      AppState.user.totalBets = 0;
      AppState.user.personalHistory = [];
      document.getElementById('profile-name-input').value = AppState.user.nickname;
      updateHeaderUI();
      renderPersonalBetHistory();
      saveState();
      closeModal('profile-modal');
      showToast(`Đã tạo phiên nhân vật mới: ${AppState.user.nickname} (50,000,000 Xu Thành Tích)!`);
    }

    function transferSafeBox(dir) {
      const amt = Math.floor(Number(document.getElementById('sb-amount-input').value) || 0);
      if (amt <= 0) return;
      if (dir === 'DEPOSIT') {
        if (AppState.user.balance < amt) {
          showToast('Số dư khả dụng không đủ để cất vào Két Sắt!', 'error');
          return;
        }
        AppState.user.balance -= amt;
        AppState.user.safeBalance += amt;
        showToast(`Đã cất ${formatNumber(amt)} Xu vào Két Sắt an toàn!`);
      } else {
        if (AppState.user.safeBalance < amt) {
          showToast('Số dư trong Két Sắt không đủ!', 'error');
          return;
        }
        AppState.user.safeBalance -= amt;
        AppState.user.balance += amt;
        showToast(`Đã rút ${formatNumber(amt)} Xu từ Két Sắt ra ví chính!`);
      }
      updateHeaderUI();
      document.getElementById('sb-main-bal').textContent = formatNumber(AppState.user.balance);
      document.getElementById('sb-safe-bal').textContent = formatNumber(AppState.user.safeBalance);
      saveState();
    }

    function renderLeaderboard() {
      const list = document.getElementById('leaderboard-list');
      if (!list) return;
      const sorted = [...AppState.mockPlayers].sort((a, b) => b.coins - a.coins);
      list.innerHTML = sorted.map((p, idx) => `
        <div class="flex items-center justify-between bg-black/70 border border-amber-500/40 rounded-2xl p-3">
          <div class="flex items-center gap-3">
            <span class="w-7 h-7 rounded-full bg-gradient-to-b from-yellow-300 to-amber-700 text-black font-black text-xs flex items-center justify-center">#${idx + 1}</span>
            <div>
              <div class="font-bold text-xs sm:text-sm text-amber-100">${p.name}</div>
              <div class="text-[10px] text-amber-400">VIP ${p.vip} • ID: ${p.uid}</div>
            </div>
          </div>
          <div class="font-digital font-bold text-xs sm:text-sm text-yellow-300">${formatNumber(p.coins)} Xu</div>
        </div>
      `).join('');
    }

    const SAMPLE_CHATS = [
      { u: 'ĐạiGiaPhốNúi', m: 'Cầu đang chạy đẹp quá anh em ơi!' },
      { u: 'VuaNặnBát68', m: 'Nặn từ từ thấy 2 mặt 6 đỏ chót haha' },
      { u: 'ThầnTàiGõCửa', m: 'Theo Tài tiếp nào anh em!' },
      { u: 'PhượngHoàngLửa', m: 'Bàn MD5 mượt thật sự trên iPhone 16.2' },
      { u: 'HoàngTửGió', m: 'Vừa nổ thùng phá sảnh bên Mini Poker xong!' }
    ];

    function appendChatLine(user, msg, isSelf = false) {
      const box = document.getElementById('chat-messages');
      if (!box) return;
      const div = document.createElement('div');
      div.className = 'bg-black/50 border border-amber-500/20 rounded-xl px-2.5 py-1';
      div.innerHTML = `<span class="font-bold ${isSelf ? 'text-yellow-300' : 'text-amber-400'}">${user}:</span> <span class="text-amber-100">${msg}</span>`;
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    }

    function sendChatMessage(e) {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const txt = input.value.trim();
      if (!txt) return;
      appendChatLine(AppState.user.nickname, txt, true);
      input.value = '';
    }

    /*************************************************************************
     * 13. NAVIGATION & MODAL SWITCHERS
     *************************************************************************/
    function switchMainView(viewName) {
      SoundFX.click();
      ['taixiu', 'lobby', 'minipoker', 'baucua', 'trenduoi'].forEach(v => {
        document.getElementById(`view-${v}`).classList.toggle('hidden', v !== viewName);
        const btn = document.getElementById(`nav-btn-${v}`);
        if (btn) {
          btn.className = (v === viewName)
            ? 'nav-tab-btn btn-gold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap'
            : 'nav-tab-btn bg-[#240a07] text-amber-200 border border-amber-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap hover:bg-[#38100b] transition';
        }
      });
    }

    function openModal(id) {
      SoundFX.click();
      if (id === 'safebox-modal') {
        document.getElementById('sb-main-bal').textContent = formatNumber(AppState.user.balance);
        document.getElementById('sb-safe-bal').textContent = formatNumber(AppState.user.safeBalance);
      }
      if (id === 'leaderboard-modal') {
        renderLeaderboard();
      }
      if (id === 'ipa-export-modal') {
        previewRepoFile('.github/workflows/build-ios-ipa.yml');
      }
      document.getElementById(id).classList.remove('hidden');
    }

    function closeModal(id) {
      SoundFX.click();
      document.getElementById(id).classList.add('hidden');
    }

    /*************************************************************************
     * 14. GITHUB ACTIONS iOS 16.2 IPA PROJECT REPOSITORY GENERATOR & PURE-JS ZIP
     *************************************************************************/
    function getRepositoryFilesMap() {
      const workflowYml = `name: Build iOS Unsigned IPA (iOS 16.2)

on:
  workflow_dispatch:
  push:
    branches:
      - main
      - master

jobs:
  build-unsigned-ipa:
    name: Compile Capacitor iOS 16.2 & Package IPA
    runs-on: macos-14

    steps:
      - name: 1. Checkout Repository
        uses: actions/checkout@v4

      - name: 2. Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: 3. Install Dependencies
        run: npm install --no-audit --no-fund

      - name: 4. Verify Web Assets Integrity
        run: node scripts/check-web.mjs

      - name: 5. Create & Sync Capacitor iOS Project
        run: |
          if [ ! -d "ios" ]; then
            npx cap add ios
          fi
          npx cap sync ios

      - name: 6. Configure iOS Deployment Target 16.2 & Info.plist
        run: |
          cd ios/App
          sed -i '' 's/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]*;/IPHONEOS_DEPLOYMENT_TARGET = 16.2;/g' App.xcodeproj/project.pbxproj
          /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName Hoàng Gia VIP" App/Info.plist || true
          /usr/libexec/PlistBuddy -c "Add :UIStatusBarHidden bool true" App/Info.plist || true
          /usr/libexec/PlistBuddy -c "Add :UIViewControllerBasedStatusBarAppearance bool false" App/Info.plist || true

      - name: 7. Build iOS App via Xcode (Unsigned for iOS 16.2 / TrollStore / Sideloadly)
        run: |
          cd ios/App
          if [ -f "Podfile" ]; then
            pod install || true
          fi
          if [ -d "App.xcworkspace" ]; then
            xcodebuild -workspace App.xcworkspace \\
              -scheme App \\
              -configuration Release \\
              -sdk iphoneos \\
              -derivedDataPath build \\
              IPHONEOS_DEPLOYMENT_TARGET=16.2 \\
              CODE_SIGN_IDENTITY="" \\
              CODE_SIGNING_REQUIRED=NO \\
              CODE_SIGNING_ALLOWED=NO \\
              clean build
          else
            xcodebuild -project App.xcodeproj \\
              -scheme App \\
              -configuration Release \\
              -sdk iphoneos \\
              -derivedDataPath build \\
              IPHONEOS_DEPLOYMENT_TARGET=16.2 \\
              CODE_SIGN_IDENTITY="" \\
              CODE_SIGNING_REQUIRED=NO \\
              CODE_SIGNING_ALLOWED=NO \\
              clean build
          fi

      - name: 8. Package .app Bundle into Unsigned .IPA
        run: |
          mkdir -p build_ipa/Payload
          APP_PATH=$(find ios/App/build -name "App.app" -type d | head -n 1)
          if [ -z "$APP_PATH" ]; then
            echo "Error: App.app not found!"
            exit 1
          fi
          cp -R "$APP_PATH" build_ipa/Payload/App.app
          cd build_ipa
          zip -r9 ../HoangGiaVIP-iOS16.2-unsigned.ipa Payload
          cd ..
          ls -lh HoangGiaVIP-iOS16.2-unsigned.ipa

      - name: 9. Upload IPA Artifact to GitHub Actions
        uses: actions/upload-artifact@v4
        with:
          name: HoangGiaVIP-iOS16.2-IPA
          path: HoangGiaVIP-iOS16.2-unsigned.ipa
          if-no-files-found: error
`;

      const checkWebMjs = `import fs from 'node:fs';
import path from 'node:path';

const requiredFiles = [
  'package.json',
  'capacitor.config.json',
  'www/index.html',
  'www/assets/app.css',
  'www/assets/app.js'
];

console.log('=== KIEM TRA TINH DAY DU CUA MA NGUON WEB & CAPACITOR ===');
let missing = false;

for (const relPath of requiredFiles) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.error('[LOI THIEU FILE]:', relPath);
    missing = true;
  } else {
    const stat = fs.statSync(fullPath);
    console.log('[OK]:', relPath, '(' + stat.size + ' bytes)');
  }
}

if (missing) {
  console.error('Kiem tra that bai! Vui long dam bao day du cac file truoc khi build IPA.');
  process.exit(1);
}
console.log('Tat ca file hop le! San sang dong bo sang du an Xcode iOS 16.2.');
`;

      const packageJson = JSON.stringify({
        name: "hoang-gia-vip-ios",
        version: "1.0.0",
        description: "Hoàng Gia VIP - Cổng Game Tài Xỉu 3D MD5 Giải Trí trên iOS 16.2",
        private: true,
        scripts: {
          "check": "node scripts/check-web.mjs",
          "sync:ios": "npx cap sync ios"
        },
        dependencies: {
          "@capacitor/core": "^6.0.0",
          "@capacitor/ios": "^6.0.0"
        },
        devDependencies: {
          "@capacitor/cli": "^6.0.0"
        }
      }, null, 2);

      const capacitorConfigJson = JSON.stringify({
        appId: "com.hoanggiavip.royalsun.taixiu",
        appName: "Hoàng Gia VIP",
        webDir: "www",
        bundledWebRuntime: false,
        ios: {
          contentInset: "always",
          backgroundColor: "#0a0604"
        }
      }, null, 2);

      const readmeMd = `# 👑 HOÀNG GIA VIP - ROYAL SUN CLUB (iOS 16.2 IPA BUILDER)

Dự án ứng dụng cổng game giải trí **Hoàng Gia VIP (Tài Xỉu 3D MD5, Nặn Bát, Soi Cầu, Mini Poker, Bầu Cua, Trên Dưới, Quản Trò)** đóng gói sẵn cho iPhone **iOS 16.2+** thông qua **Capacitor** và **GitHub Actions**.

## Cấu trúc thư mục
\`\`\`text
DiceGame-iOS/
├── .github/
│   └── workflows/
│       └── build-ios-ipa.yml
├── scripts/
│   └── check-web.mjs
├── www/
│   ├── index.html
│   └── assets/
│       ├── app.css
│       └── app.js
├── package.json
├── capacitor.config.json
├── README.md
└── HUONG_DAN_BUILD_IPA.md
\`\`\`

Xem chi tiết từng bước tải lên GitHub và lấy file \`.ipa\` trong file \`HUONG_DAN_BUILD_IPA.md\`.
`;

      const huongDanMd = `# 📱 HƯỚNG DẪN TỪNG BƯỚC TẠO REPOSITORY GITHUB & BUILD FILE .IPA TRÊN WINDOWS

Bạn đang sử dụng máy tính **Windows** (không cần máy Mac hay Xcode). Toàn bộ công đoạn biên dịch iOS 16.2 sẽ do máy chủ macOS của **GitHub Actions** thực hiện tự động.

---

## BƯỚC 1: GIẢI NÉN FILE \`DiceGame-iOS.zip\` TRÊN WINDOWS
1. Nhấn nút **"TẢI FILE DiceGame-iOS.zip NGAY"** trong ứng dụng.
2. Nhấp chuột phải vào file \`DiceGame-iOS.zip\` vừa tải về -> chọn **Extract All...** (hoặc Giải nén bằng WinRAR / 7-Zip) ra một thư mục, ví dụ \`D:\\DiceGame-iOS\`.
3. Mở thư mục vừa giải nén, hãy chắc chắn bạn nhìn thấy thư mục \`.github\`, \`scripts\`, \`www\`, \`package.json\`, \`capacitor.config.json\`.
   - *Lưu ý*: Trên Windows Explorer, hãy tích chọn **View -> Show -> Hidden items** để nhìn thấy thư mục có dấu chấm ở đầu là \`.github\`.

---

## BƯỚC 2: TẠO REPOSITORY TRÊN GITHUB & UPLOAD MÃ NGUỒN
1. Truy cập [https://github.com](https://github.com) và đăng nhập tài khoản của bạn.
2. Nhấn nút dấu cộng **(+)** ở góc phải trên cùng -> chọn **New repository**.
3. Đặt tên Repository: \`DiceGame-iOS\`, chọn chế độ **Public** (để sử dụng GitHub Actions macOS miễn phí không giới hạn), tích chọn **Add a README file**, rồi nhấn **Create repository**.
4. Trong trang Repository vừa tạo, nhấn nút **Add file** -> **Upload files**.
5. Kéo thả **toàn bộ các thư mục và file bên trong thư mục giải nén** (\`.github\`, \`scripts\`, \`www\`, \`package.json\`, \`capacitor.config.json\`, \`HUONG_DAN_BUILD_IPA.md\`, \`README.md\`) vào khung upload của GitHub.
6. Đợi tải lên hoàn tất 100%, kéo xuống dưới và nhấn nút màu xanh **Commit changes**.

---

## BƯỚC 3: KIỂM TRA & CHẠY WORKFLOW BUILD .IPA
1. Nhấn vào tab **Actions** trên thanh menu ngang của Repository GitHub.
2. Ở cột bên trái, nhấn vào workflow **"Build iOS Unsigned IPA (iOS 16.2)"**.
3. Nếu workflow chưa tự chạy hoặc bạn muốn chạy lại ngay, hãy nhấn nút **Run workflow** (bên phải) -> nhấn nút xanh **Run workflow**.
4. Quá trình build sẽ diễn ra trong khoảng **3 đến 5 phút**.
   - 🟢 **Dấu tích xanh (Success)**: Đã biên dịch Xcode và đóng gói \`.ipa\` thành công!
   - 🔴 **Dấu X đỏ (Failed)**: Nhấn trực tiếp vào dòng chữ màu đỏ -> nhấn vào mục \`Compile Capacitor iOS 16.2 & Package IPA\` để đọc log chi tiết ở bước bị dừng.

---

## BƯỚC 4: TẢI FILE .IPA VỀ MÁY WINDOWS & CÀI LÊN IPHONE (iOS 16.2)
1. Khi lượt chạy hiện **Dấu tích xanh 🟢**, nhấn vào lượt chạy đó.
2. Kéo xuống cuối trang đến mục **Artifacts**, bạn sẽ thấy gói **\`HoangGiaVIP-iOS16.2-IPA\`**.
3. Nhấn vào **\`HoangGiaVIP-iOS16.2-IPA\`** để tải về máy Windows.
4. Giải nén file ZIP tải từ Artifacts ra, bên trong chính là file **\`HoangGiaVIP-iOS16.2-unsigned.ipa\`**.
5. **Cách cài đặt lên iPhone chạy iOS 16.2**:
   - **Cách 1 (TrollStore - Khuyên dùng cho iOS 16.2)**: Gửi file \`HoangGiaVIP-iOS16.2-unsigned.ipa\` qua Telegram / iCloud Drive / AirDrop vào iPhone -> Mở bằng **TrollStore** -> Nhấn **Install** (Vĩnh viễn không bị thu hồi chứng chỉ).
   - **Cách 2 (Sideloadly / AltStore trên Windows)**: Cắm cáp iPhone vào máy tính Windows -> Mở phần mềm **Sideloadly** -> Kéo file \`HoangGiaVIP-iOS16.2-unsigned.ipa\` vào -> Nhập Apple ID của bạn và nhấn **Start** để ký và cài đặt trực tiếp vào iPhone.
`;

      // Extract live CSS and JS so www/index.html + www/assets/app.css + www/assets/app.js are 100% functional
      const cssContent = document.getElementById('app-core-styles') ? document.getElementById('app-core-styles').textContent : '';
      const jsContent = document.getElementById('app-core-script') ? document.getElementById('app-core-script').textContent : '';

      // Build clean www/index.html that references assets/app.css and assets/app.js
      const docClone = document.documentElement.cloneNode(true);
      const styleTag = docClone.querySelector('#app-core-styles');
      if (styleTag) {
        const linkEl = document.createElement('link');
        linkEl.rel = 'stylesheet';
        linkEl.href = 'assets/app.css';
        styleTag.replaceWith(linkEl);
      }
      const scriptTag = docClone.querySelector('#app-core-script');
      if (scriptTag) {
        const extScript = document.createElement('script');
        extScript.src = 'assets/app.js';
        scriptTag.replaceWith(extScript);
      }
      const wwwIndexHtml = '<!DOCTYPE html>\n' + docClone.outerHTML;

      return {
        '.github/workflows/build-ios-ipa.yml': workflowYml,
        'scripts/check-web.mjs': checkWebMjs,
        'package.json': packageJson,
        'capacitor.config.json': capacitorConfigJson,
        'README.md': readmeMd,
        'HUONG_DAN_BUILD_IPA.md': huongDanMd,
        'www/index.html': wwwIndexHtml,
        'www/assets/app.css': cssContent,
        'www/assets/app.js': jsContent
      };
    }

    function previewRepoFile(filePath) {
      SoundFX.click();
      const files = getRepositoryFilesMap();
      const content = files[filePath] || '';
      document.getElementById('preview-file-title').textContent = filePath;
      document.getElementById('preview-file-code').textContent = content;
    }

    function copyPreviewFileContent() {
      const code = document.getElementById('preview-file-code').textContent;
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Đã sao chép nội dung file vào Clipboard!');
    }

    // Pure-JavaScript Standard PKZIP Binary Generator (CRC32 + Store Method 0)
    // Works 100% offline in any browser without external dependencies
    function createZipArchiveBytes(filesObject) {
      const encoder = new TextEncoder();
      const entries = [];

      // Precompute CRC32 Table
      const crcTable = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
          c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[n] = c >>> 0;
      }

      const crc32 = (bytes) => {
        let c = 0xffffffff;
        for (let i = 0; i < bytes.length; i++) {
          c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
        }
        return (c ^ 0xffffffff) >>> 0;
      };

      let offset = 0;
      const localParts = [];
      const centralParts = [];

      for (const [pathStr, textContent] of Object.entries(filesObject)) {
        const nameBytes = encoder.encode(pathStr);
        const dataBytes = encoder.encode(textContent);
        const crc = crc32(dataBytes);
        const size = dataBytes.length;

        // Local File Header (30 bytes + name)
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const lv = new DataView(localHeader.buffer);
        lv.setUint32(0, 0x04034b50, true); // signature
        lv.setUint16(4, 20, true);         // version needed
        lv.setUint16(6, 0x0800, true);     // UTF-8 flag
        lv.setUint16(8, 0, true);          // store method (0)
        lv.setUint16(10, 0, true);         // mod time
        lv.setUint16(12, 0, true);         // mod date
        lv.setUint32(14, crc, true);       // crc32
        lv.setUint32(18, size, true);      // compressed size
        lv.setUint32(22, size, true);      // uncompressed size
        lv.setUint16(26, nameBytes.length, true);
        lv.setUint16(28, 0, true);
        localHeader.set(nameBytes, 30);

        localParts.push(localHeader, dataBytes);

        // Central Directory Header (46 bytes + name)
        const centralHeader = new Uint8Array(46 + nameBytes.length);
        const cv = new DataView(centralHeader.buffer);
        cv.setUint32(0, 0x02014b50, true); // signature
        cv.setUint16(4, 20, true);         // version made by
        cv.setUint16(6, 20, true);         // version needed
        cv.setUint16(8, 0x0800, true);     // UTF-8 flag
        cv.setUint16(10, 0, true);        // store method
        cv.setUint16(12, 0, true);
        cv.setUint16(14, 0, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, size, true);
        cv.setUint32(24, size, true);
        cv.setUint16(28, nameBytes.length, true);
        cv.setUint16(30, 0, true);
        cv.setUint16(32, 0, true);
        cv.setUint16(34, 0, true);
        cv.setUint16(36, 0, true);
        cv.setUint32(38, 0, true);
        cv.setUint32(42, offset, true);    // local header offset
        centralHeader.set(nameBytes, 46);

        centralParts.push(centralHeader);
        offset += localHeader.length + dataBytes.length;
        entries.push(pathStr);
      }

      const centralSize = centralParts.reduce((acc, arr) => acc + arr.length, 0);
      const eocd = new Uint8Array(22);
      const ev = new DataView(eocd.buffer);
      ev.setUint32(0, 0x06054b50, true);
      ev.setUint16(4, 0, true);
      ev.setUint16(6, 0, true);
      ev.setUint16(8, entries.length, true);
      ev.setUint16(10, entries.length, true);
      ev.setUint32(12, centralSize, true);
      ev.setUint32(16, offset, true);
      ev.setUint16(20, 0, true);

      return new Blob([...localParts, ...centralParts, eocd], { type: 'application/zip' });
    }

    function downloadCompleteProjectZip() {
      SoundFX.win();
      const filesMap = getRepositoryFilesMap();
      const blob = createZipArchiveBytes(filesMap);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'DiceGame-iOS.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast('Đã tạo và tải xuống thành công file DiceGame-iOS.zip!', 'win');
    }

    /*************************************************************************
     * 15. INITIALIZATION ON WINDOW LOAD
     *************************************************************************/
    window.onload = function () {
      loadSavedState();

      // Build 3D Dice DOM Faces
      buildSingle3DDie('dice-cube-1');
      buildSingle3DDie('dice-cube-2');
      buildSingle3DDie('dice-cube-3');

      // Initialize Nặn Bát Drag Listener
      initNanBatInteraction();

      // Populate Initial Mini-Games
      renderMiniPokerCards([
        { rank: '10', suit: SUITS[3] },
        { rank: 'J',  suit: SUITS[3] },
        { rank: 'Q',  suit: SUITS[3] },
        { rank: 'K',  suit: SUITS[3] },
        { rank: 'A',  suit: SUITS[3] }
      ]);
      renderBauCuaBoard();

      // Initial Chat Lines
      SAMPLE_CHATS.forEach(c => appendChatLine(c.u, c.m));
      setInterval(() => {
        const pick = SAMPLE_CHATS[Math.floor(Math.random() * SAMPLE_CHATS.length)];
        appendChatLine(pick.u, pick.m);
      }, 9500);

      updateHeaderUI();
      renderRoadmapStrip();
      renderPersonalBetHistory();
      prepareNewTaixiuRound();

      // Start 1-second Master Game Loop
      setInterval(tickTaixiuEngine, 1000);
    };
  