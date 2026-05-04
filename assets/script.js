let N = 3, BOARD_PX = 520, tiles = [], emptyIdx = 0, moves = 0, elapsed = 0;
let timerInt = null, won = false, showingAnswer = false, imgSrc = null;
let bestRecord = {}, gameStarted = false, showingAnswerMode = false;

const boardEl = document.getElementById('game-board');
const movesEl = document.getElementById('moves-val');
const timerEl = document.getElementById('timer-val');
const bestEl = document.getElementById('best-val');
const winOverlay = document.getElementById('win-overlay');
const placeholder = document.getElementById('placeholder');
const recordBadge = document.getElementById('record-badge');

function responsiveSize() {
    const vw = Math.min(window.innerWidth, 1060);
    if (window.innerWidth <= 720) { BOARD_PX = Math.min(vw - 48, 400) }
    else { BOARD_PX = Math.min(vw - 280 - 80, 520) }
}
responsiveSize();
window.addEventListener('resize', () => { responsiveSize(); if (gameStarted) renderBoard() });
function ts() { return Math.floor(BOARD_PX / N) }

function selectImg(el, label) {
    document.querySelectorAll('.img-item').forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');
    imgSrc = el.dataset.url;
    showPreview(imgSrc);
}

function showPreview(src) {
    document.getElementById('no-preview').style.display = 'none';
    document.getElementById('preview-wrap').style.display = 'block';
    document.getElementById('preview-img').src = src;
    document.getElementById('start-btn').disabled = false;
}

function toggleGallery() {
    document.getElementById('preview-wrap').style.display = 'none';
    document.getElementById('no-preview').style.display = 'flex';
    imgSrc = null;
    document.getElementById('start-btn').disabled = true;
    document.querySelectorAll('.img-item').forEach(x => x.classList.remove('selected'));
}

function handleUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { imgSrc = ev.target.result; showPreview(imgSrc) };
    reader.readAsDataURL(file); e.target.value = '';
}

function setN(n, el) {
    N = n;
    document.querySelectorAll('.diff-row').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    if (gameStarted && imgSrc) startGame();
}

function startGame() {
    if (!imgSrc) return;
    gameStarted = true; won = false; moves = 0; elapsed = 0; showingAnswer = false; showingAnswerMode = false;
    clearInterval(timerInt);
    movesEl.textContent = '0'; timerEl.textContent = '0:00';
    winOverlay.classList.remove('show');
    recordBadge.style.display = 'none';
    placeholder.style.display = 'none';
    document.getElementById('show-btn').textContent = '👁 Tampilkan Jawaban';
    responsiveSize();
    const size = ts() * N;
    boardEl.style.width = size + 'px'; boardEl.style.height = size + 'px';
    tiles = Array.from({ length: N * N }, (_, i) => i); emptyIdx = N * N - 1;
    renderBoard(); shuffleBoard(); startTimer();
    ['shuffle-btn', 'hint-btn', 'show-btn', 'submit-btn'].forEach(id => document.getElementById(id).disabled = false);
    const key = N;
    bestEl.textContent = bestRecord[key] ? bestRecord[key] : '—';
}

function shuffleGame() {
    if (!imgSrc || !gameStarted) return;
    won = false; moves = 0; elapsed = 0; showingAnswer = false; showingAnswerMode = false;
    clearInterval(timerInt); movesEl.textContent = '0'; timerEl.textContent = '0:00';
    winOverlay.classList.remove('show'); recordBadge.style.display = 'none';
    document.getElementById('show-btn').textContent = '👁 Tampilkan Jawaban';
    shuffleBoard(); startTimer();
}

function submitGame() {
    if (isSolved()) endGame();
    else {
        const prev = boardEl.style.boxShadow;
        boardEl.style.boxShadow = '0 0 0 3px #ff4d4d,0 0 40px rgba(255,77,77,0.3)';
        setTimeout(() => boardEl.style.boxShadow = prev, 600);
    }
}

function renderBoard() {
    const tsize = ts(); boardEl.innerHTML = '';
    for (let tileId = 0; tileId < N * N; tileId++) {
        const pos = tiles.indexOf(tileId);
        const pr = Math.floor(pos / N), pc = pos % N;
        const origR = Math.floor(tileId / N), origC = tileId % N;
        const div = document.createElement('div');
        div.className = 'tile' + (tileId === N * N - 1 ? ' empty' : '');
        div.style.cssText = `width:${tsize}px;height:${tsize}px;top:${pr * tsize}px;left:${pc * tsize}px`;
        if (tileId !== N * N - 1) {
            div.style.backgroundImage = `url(${imgSrc})`;
            div.style.backgroundSize = `${tsize * N}px ${tsize * N}px`;
            div.style.backgroundPosition = `-${origC * tsize}px -${origR * tsize}px`;
            const lbl = document.createElement('span'); lbl.className = 'tile-num'; lbl.textContent = tileId + 1;
            div.appendChild(lbl);
        }
        div.dataset.tileid = tileId;
        div.addEventListener('click', () => handleClick(tileId));
        boardEl.appendChild(div);
    }
}

function updateTilePositions() {
    const tsize = ts();
    boardEl.querySelectorAll('.tile').forEach(div => {
        const tileId = parseInt(div.dataset.tileid);
        const pos = tiles.indexOf(tileId);
        const r = Math.floor(pos / N), c = pos % N;
        div.style.top = (r * tsize) + 'px'; div.style.left = (c * tsize) + 'px';
    });
}

function handleClick(tileId) {
    if (won || showingAnswerMode) return;
    const pos = tiles.indexOf(tileId);
    if (!isAdj(pos, emptyIdx)) return;
    doMove(pos);
    if (isSolved()) endGame();
}

function doMove(pos) {
    tiles[emptyIdx] = tiles[pos]; tiles[pos] = N * N - 1; emptyIdx = pos;
    moves++; movesEl.textContent = moves; updateTilePositions();
}

function isAdj(a, b) {
    const ar = Math.floor(a / N), ac = a % N, br = Math.floor(b / N), bc = b % N;
    return (ar === br && Math.abs(ac - bc) === 1) || (ac === bc && Math.abs(ar - br) === 1);
}

function isSolved() { return tiles.every((v, i) => v === i) }

function getNeighbors(pos) {
    const r = Math.floor(pos / N), c = pos % N, res = [];
    if (r > 0) res.push((r - 1) * N + c); if (r < N - 1) res.push((r + 1) * N + c);
    if (c > 0) res.push(r * N + c - 1); if (c < N - 1) res.push(r * N + c + 1);
    return res;
}

function shuffleBoard() {
    const steps = N * N * 30; let lastMoved = -1;
    for (let i = 0; i < steps; i++) {
        const neighbors = getNeighbors(emptyIdx).filter(n => n !== lastMoved);
        const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
        lastMoved = emptyIdx; tiles[emptyIdx] = tiles[pick]; tiles[pick] = N * N - 1; emptyIdx = pick;
    }
    updateTilePositions();
}

function doHint() {
    if (won) return;
    const neighbors = getNeighbors(emptyIdx);
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    doMove(pick); if (isSolved()) endGame();
}

function toggleShowAnswer() {
    showingAnswerMode = !showingAnswerMode;
    const btn = document.getElementById('show-btn');
    const tsize = ts();
    if (showingAnswerMode) {
        btn.textContent = '🙈 Sembunyikan';
        boardEl.querySelectorAll('.tile').forEach(div => {
            const tileId = parseInt(div.dataset.tileid);
            const r = Math.floor(tileId / N), c = tileId % N;
            div.style.opacity = '0.35';
            div.style.top = (r * tsize) + 'px'; div.style.left = (c * tsize) + 'px';
        });
    } else {
        btn.textContent = '👁 Tampilkan Jawaban';
        boardEl.querySelectorAll('.tile').forEach(div => { div.style.opacity = '1' });
        updateTilePositions();
    }
}

function startTimer() {
    clearInterval(timerInt); elapsed = 0;
    timerInt = setInterval(() => {
        elapsed++;
        const m = Math.floor(elapsed / 60), s = elapsed % 60;
        timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }, 1000);
}

function endGame() {
    won = true; clearInterval(timerInt);
    boardEl.querySelectorAll('.tile:not(.empty)').forEach((div, i) => {
        setTimeout(() => div.classList.add('win-flash'), i * 25);
    });
    const key = N;
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    const timeStr = m + ':' + (s < 10 ? '0' : '') + s;
    const isRecord = !bestRecord[key] || elapsed < bestRecord[key];
    if (isRecord) { bestRecord[key] = elapsed; bestEl.textContent = timeStr; recordBadge.style.display = 'block' }
    document.getElementById('win-stats-text').innerHTML =
        `Langkah: <span>${moves}</span> &nbsp;·&nbsp; Waktu: <span>${timeStr}</span>` +
        (isRecord ? '<br><span style="color:#f5c518">🏆 Rekor baru!</span>' : '');
    setTimeout(() => winOverlay.classList.add('show'), 450);
}