document.addEventListener('DOMContentLoaded', () => {

    const playerDB = {
        GK: [
            { name: 'Robel', price: 3.5 },
            { name: 'Samuel', price: 2.5 },
            { name: 'Daniel', price: 3.0 },
        ],
        LB: [
            { name: 'Adoni', price: 3.0 },
            { name: 'Yonas', price: 2.0 },
            { name: 'Ephrem', price: 2.5 },
        ],
        CB1: [
            { name: 'Halid', price: 3.5 },
            { name: 'Tomas', price: 2.5 },
            { name: 'Isaac', price: 3.0 },
        ],
        CB2: [
            { name: 'Muaz', price: 3.0 },
            { name: 'Natan', price: 2.5 },
            { name: 'Joel', price: 2.0 },
        ],
        RB: [
            { name: 'Canto', price: 3.0 },
            { name: 'Riki', price: 2.0 },
            { name: 'Dawit', price: 2.5 },
        ],
        CM1: [
            { name: 'Karalo', price: 4.5 },
            { name: 'Mikiyas', price: 3.5 },
            { name: 'Abel', price: 2.5 },
        ],
        CM2: [
            { name: 'Nahom', price: 4.0 },
            { name: 'Bereket', price: 3.0 },
            { name: 'Sami', price: 3.5 },
        ],
        CM3: [
            { name: 'Hiruy', price: 3.5 },
            { name: 'Luel', price: 2.5 },
            { name: 'Fanuel', price: 3.0 },
        ],
        LW: [
            { name: 'Kedus', price: 4.5 },
            { name: 'Matios', price: 3.5 },
            { name: 'Habtamu', price: 2.5 },
        ],
        ST: [
            { name: 'Abel', price: 4.0 },
            { name: 'Biniam', price: 3.5 },
            { name: 'Surafel', price: 3.0 },
        ],
        RW: [
            { name: 'Bombe', price: 4.0 },
            { name: 'Kidus', price: 2.0 },
            { name: 'Yohannes', price: 2.5 },
        ],
    };

    const BUDGET = 50;
    let selectedPlayers = {};
    let totalSpent = 0;
    let captainPos = null;
    let isSaved = false;
    let swapSlotPos = null;
    let subBenchPos = null;
    let subMode = false;
    let pitchActionPos = null;

    // Group -> slot positions on the pitch
    const groupAllocations = {
        GKP: ['GKP1', 'GK2'],
        DEF: ['DEF1', 'DEF2', 'DEF3', 'DEF4', 'DEF5', 'DEF6'],
        MID: ['MID1', 'MID2', 'MID3', 'MID4'],
        FWD: ['FWD1', 'FWD2', 'FWD3', 'FWD4'],
    };

    // Bench slots are kept in the squad but NOT shown on the pitch
    const benchSlots = ['GK2', 'DEF5', 'DEF6', 'MID4', 'FWD4'];

    // Each group draws players from these DB positions (in order)
    const groupSources = {
        GKP: ['GK'],
        DEF: ['LB', 'CB1', 'CB2', 'RB'],
        MID: ['CM1', 'CM2', 'CM3'],
        FWD: ['LW', 'ST', 'RW'],
    };

    const avClass = {
        GK: 'av-gkp',
        LB: 'av-def', CB1: 'av-def', CB2: 'av-def', RB: 'av-def',
        CM1: 'av-mid', CM2: 'av-mid', CM3: 'av-mid',
        LW: 'av-fwd', ST: 'av-fwd', RW: 'av-fwd',
    };

    const pitchModal = document.getElementById('pitch-modal');
    const openBtn = document.getElementById('open-pitch');
    const closeBtn = document.getElementById('pitch-close');
    const budgetDisplay = document.getElementById('budget-left');
    const pickSummaryList = document.getElementById('pick-summary-list');
    const manageTransfersBtn = document.getElementById('manage-transfers-btn');
    const saveBtn = document.getElementById('save-team-btn');

    const pickView = document.getElementById('pick-view');
    const transferView = document.getElementById('transfer-view');
    const transferSearch = document.getElementById('transfer-search');
    const transferList = document.getElementById('transfer-list');
    const transferSquadList = document.getElementById('transfer-squad-list');
    const transferBudgetDisplay = document.getElementById('transfer-budget-left');
    const transferTotalValue = document.getElementById('transfer-total-value');
    const transferSaveBtn = document.getElementById('transfer-save-btn');
    const autoPickBtn = document.getElementById('auto-pick-btn');
    let transferFilter = 'ALL';

    function getAllSlots() {
        return Array.from(document.querySelectorAll('.player-slot'));
    }

    function getSlot(pos) {
        return getAllSlots().find(s => s.dataset.position === pos);
    }

    // Group label for a slot
    function posGroupLabel(pos) {
        if (pos.startsWith('GK')) return 'GKP';
        if (pos.startsWith('DEF')) return 'DEF';
        if (pos.startsWith('MID')) return 'MID';
        if (pos.startsWith('FWD')) return 'FWD';
        return pos;
    }

    function getGroupByPos(pos) {
        return Object.values(groupAllocations).find(arr => arr.includes(pos)) || [];
    }

    function showToast(message, type) {
        let toast = document.querySelector('.save-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'save-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.className = `save-toast ${type}`;
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function updateBudget() {
        const remaining = BUDGET - totalSpent;
        budgetDisplay.textContent = `$${remaining}M`;
        budgetDisplay.style.color = remaining < 10 ? '#e8443a' : '#00d4e8';
    }

    function updateTransfersBudget() {
        const remaining = BUDGET - totalSpent;
        if (transferBudgetDisplay) transferBudgetDisplay.textContent = `$${remaining}M`;
        if (transferBudgetDisplay) transferBudgetDisplay.style.color = remaining < 10 ? '#e8443a' : '#00d4e8';
        if (transferTotalValue) transferTotalValue.textContent = `$${totalSpent}M`;
        updateBudgetBreakdown();
    }

    function updateBudgetBreakdown() {
        let starterCost = 0;
        let benchCost = 0;
        Object.keys(selectedPlayers).forEach(pos => {
            if (isBenchPos(pos)) benchCost += selectedPlayers[pos].price;
            else starterCost += selectedPlayers[pos].price;
        });
        const remaining = BUDGET - starterCost - benchCost;

        const transferBB = {
            starter: document.getElementById('bb-starter'),
            bench: document.getElementById('bb-bench'),
            remaining: document.getElementById('bb-remaining'),
        };
        if (transferBB.starter) transferBB.starter.textContent = `$${starterCost}M`;
        if (transferBB.bench) transferBB.bench.textContent = `$${benchCost}M`;
        if (transferBB.remaining) {
            transferBB.remaining.textContent = `$${remaining}M`;
            transferBB.remaining.classList.toggle('over', remaining < 0);
        }

        const pickBB = {
            starter: document.getElementById('pb-starter'),
            bench: document.getElementById('pb-bench'),
            remaining: document.getElementById('pb-remaining'),
        };
        if (pickBB.starter) pickBB.starter.textContent = `$${starterCost}M`;
        if (pickBB.bench) pickBB.bench.textContent = `$${benchCost}M`;
        if (pickBB.remaining) {
            pickBB.remaining.textContent = `$${remaining}M`;
            pickBB.remaining.classList.toggle('over', remaining < 0);
        }
    }

    function getUsedPlayers() {
        return Object.values(selectedPlayers).map(p => p.name);
    }

    function updateSaveBtn() {
        const btns = [saveBtn, transferSaveBtn].filter(Boolean);
        btns.forEach(btn => {
            if (isSaved) {
                btn.textContent = 'Team Saved';
                btn.classList.add('saved');
                btn.disabled = true;
            } else {
                btn.textContent = 'Save Team';
                btn.classList.remove('saved');
                btn.disabled = false;
            }
        });
    }

    function markDirty() {
        isSaved = false;
        updateSaveBtn();
    }

    function addBadge(slot, letter, badgeClass) {
        const jersey = slot.querySelector('.player-jersey');
        const existing = jersey.querySelector('.jersey-badge');
        if (existing) existing.remove();
        const badge = document.createElement('span');
        badge.className = `jersey-badge ${badgeClass}`;
        badge.textContent = letter;
        jersey.appendChild(badge);
    }

    function removeBadge(slot, badgeClass) {
        if (!slot) return;
        const jersey = slot.querySelector('.player-jersey');
        const badge = jersey.querySelector(`.${badgeClass}`);
        if (badge) badge.remove();
    }

    function resetAllSlots() {
        removePitchAction();
        getAllSlots().forEach(slot => {
            const nameEl = slot.querySelector('.player-name');
            nameEl.textContent = 'Pick a Player';
            nameEl.style.color = '';
            nameEl.style.fontWeight = '';
            const jersey = slot.querySelector('.player-jersey');
            jersey.querySelectorAll('.jersey-badge').forEach(b => b.remove());
        });
        selectedPlayers = {};
        totalSpent = 0;
        captainPos = null;
        isSaved = false;
        updateBudget();
        updateTransfersBudget();
        updateSaveBtn();
        renderPickSummary();
        renderTransferList();
        renderTransferSquad();
    }

    function openModal() {
        pitchModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        updateBudget();
        updateTransfersBudget();
        renderPickSummary();
        updateSaveBtn();
    }

    function closeModal() {
        pitchModal.classList.remove('open');
        document.body.style.overflow = '';
        exitSubMode();
        swapSlotPos = null;
        if (!isSaved) resetAllSlots();
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && pitchModal.classList.contains('open')) {
            if (subMode || subBenchPos) exitSubMode();
            else closeModal();
        }
    });

    // ===== RENDER PICK SUMMARY (Pick Team right panel) =====
    function isBenchPos(pos) {
        return benchSlots.includes(pos);
    }

    function renderPickSummary() {
        if (!pickSummaryList) return;
        pickSummaryList.innerHTML = '';
        exitSubMode();
        let hasAny = false;
        benchSlots.forEach((pos, i) => {
            const label = posGroupLabel(pos);
            const player = selectedPlayers[pos];
            const div = document.createElement('div');
            div.className = 'panel-selected-player bench' + (player ? '' : ' empty');
            if (player) {
                hasAny = true;
                const isCap = captainPos === pos;
                div.innerHTML = `
                    <div class="panel-selected-player-left">
                        <span class="panel-selected-pos">${label}</span>
                        <span class="panel-selected-name">${player.name}</span>
                    </div>
                    <div class="transfer-player-right">
                        <button class="panel-cv-btn btn-c ${isCap ? 'active' : ''}" title="Make Captain">C</button>
                        <span class="transfer-player-price">$${player.price}M</span>
                    </div>
                `;
                div.querySelector('.panel-cv-btn.btn-c').addEventListener('click', (e) => { e.stopPropagation(); setCaptain(pos); });
            } else {
                div.innerHTML = `
                    <div class="panel-selected-player-left">
                        <span class="panel-selected-pos">${label}</span>
                        <span class="panel-selected-name">Empty</span>
                    </div>
                    <span class="transfer-player-price">-</span>
                `;
            }
            div.addEventListener('click', (e) => {
                if (!e.target.closest('.panel-cv-btn')) showSubOption(pos, div);
            });
            pickSummaryList.appendChild(div);
        });
        if (!hasAny) {
            pickSummaryList.innerHTML = '<p class="panel-empty-msg">No bench players yet</p>';
        }
    }

    // Map a DB source position (GK, LB, CM1...) to its group
    function groupForSource(srcPos) {
        const base = srcPos.replace(/[0-9]/g, '');
        if (base === 'GK') return 'GKP';
        if (base === 'LB' || base === 'CB' || base === 'RB') return 'DEF';
        if (base === 'CM') return 'MID';
        if (base === 'LW' || base === 'ST' || base === 'RW') return 'FWD';
        return '';
    }

    // ===== ADD TO SQUAD (fill first empty slot in group) =====
    function addToSquad(player, srcPos) {
        const group = groupForSource(srcPos);
        const slots = groupAllocations[group];
        exitSubMode();

        let targetPos = null;

        // If a specific slot is selected for swapping, use it (swap mode)
        if (swapSlotPos) {
            const existing = selectedPlayers[swapSlotPos];
            // Use it if it holds a same-group player (swap) or is empty (direct fill)
            if ((existing && groupForSource(existing.src) === group) || !existing) {
                targetPos = swapSlotPos;
            }
            swapSlotPos = null;
        }

        // Otherwise fill the first empty slot in the group
        if (!targetPos) {
            for (const pos of slots) {
                if (!selectedPlayers[pos]) {
                    targetPos = pos;
                    break;
                }
            }
        }
        if (!targetPos) {
            showToast(`${group} slots are full! Remove a player to make space.`, 'error');
            return;
        }

        // Refund the old player if swapping
        if (selectedPlayers[targetPos]) {
            totalSpent -= selectedPlayers[targetPos].price;
        }

        selectedPlayers[targetPos] = { ...player, src: srcPos };
        totalSpent += player.price;

        const slot = getSlot(targetPos);
        if (slot) {
            const nameEl = slot.querySelector('.player-name');
            nameEl.textContent = player.name;
            nameEl.style.color = '#fff';
            nameEl.style.fontWeight = '700';

            const jersey = slot.querySelector('.player-jersey');
            jersey.style.boxShadow = '0 0 30px rgba(0, 212, 232, 0.6)';
            setTimeout(() => { jersey.style.boxShadow = ''; }, 600);
        }

        updateBudget();
        updateTransfersBudget();
        markDirty();
        renderPickSummary();
        renderTransferList();
        renderTransferSquad();
    }

    // ===== REMOVE PLAYER =====
    function removePlayer(pos) {
        if (!selectedPlayers[pos]) return;
        exitSubMode();

        const slot = getSlot(pos);
        if (slot) {
            const nameEl = slot.querySelector('.player-name');
            nameEl.textContent = 'Pick a Player';
            nameEl.style.color = '';
            nameEl.style.fontWeight = '';
        }

        if (captainPos === pos) {
            if (slot) removeBadge(slot, 'badge-c');
            captainPos = null;
        }

        totalSpent -= selectedPlayers[pos].price;
        delete selectedPlayers[pos];

        updateBudget();
        updateTransfersBudget();
        markDirty();
        renderPickSummary();
        renderTransferList();
        renderTransferSquad();
    }

    // ===== SUBSTITUTION SYSTEM =====
    function exitSubMode() {
        subMode = false;
        subBenchPos = null;
        removePitchAction();
        document.querySelectorAll('.sub-option').forEach(el => el.remove());
        document.querySelectorAll('.sub-target').forEach(el => el.classList.remove('sub-target'));
        document.querySelectorAll('.sub-selected').forEach(el => el.classList.remove('sub-selected'));
    }

    // ===== PITCH PLAYER ACTION (make captain) =====
    function removePitchAction() {
        pitchActionPos = null;
        document.querySelectorAll('.pitch-action').forEach(el => el.remove());
    }

    function showPitchAction(pos, slot) {
        document.querySelectorAll('.pitch-action').forEach(el => el.remove());
        if (subMode || !selectedPlayers[pos]) {
            pitchActionPos = null;
            return;
        }
        pitchActionPos = pos;
        const player = selectedPlayers[pos];
        const isCap = captainPos === pos;
        const action = document.createElement('div');
        action.className = 'pitch-action';
        action.innerHTML = `
            <span class="pitch-action-name">${player.name}</span>
            <button class="btn btn-secondary pitch-cap-btn ${isCap ? 'on' : ''}">${isCap ? 'CAPTAIN' : 'MAKE CAPTAIN'}</button>
        `;
        action.addEventListener('click', (e) => e.stopPropagation());
        action.querySelector('.pitch-cap-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            setCaptain(pos);
            removePitchAction();
        });
        slot.appendChild(action);
    }

    function showSubOption(pos, rowEl) {
        if (subBenchPos === pos) {
            exitSubMode();
            return;
        }
        exitSubMode();

        subBenchPos = pos;
        rowEl.classList.add('sub-selected');

        const subOption = document.createElement('div');
        subOption.className = 'sub-option';
        subOption.innerHTML = `
            <button class="btn btn-secondary sub-btn">SUBSTITUTION</button>
            <button class="btn btn-secondary sub-cancel-btn">Cancel</button>
        `;

        subOption.querySelector('.sub-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            enterSubMode(pos);
        });

        subOption.querySelector('.sub-cancel-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            exitSubMode();
        });

        rowEl.after(subOption);
    }

    function enterSubMode(benchPos) {
        exitSubMode();
        subMode = true;
        subBenchPos = benchPos;

        const group = posGroupLabel(benchPos);
        getAllSlots().forEach(slot => {
            if (posGroupLabel(slot.dataset.position) === group) {
                slot.classList.add('sub-target');
            }
        });

        showToast('Pick a player on the pitch to swap', 'info');
    }

    function renderAllBadges() {
        getAllSlots().forEach(slot => {
            const pos = slot.dataset.position;
            slot.querySelector('.player-jersey').querySelectorAll('.jersey-badge').forEach(b => b.remove());
            if (captainPos === pos) addBadge(slot, 'C', 'badge-c');
        });
    }

    function performSwap(posA, posB) {
        const playerA = selectedPlayers[posA];
        const playerB = selectedPlayers[posB];

        if (playerA) selectedPlayers[posB] = playerA;
        else delete selectedPlayers[posB];
        if (playerB) selectedPlayers[posA] = playerB;
        else delete selectedPlayers[posA];

        // If the captain was involved in the substitution, the player who
        // takes their place on the pitch becomes the new captain.
        if (captainPos === posA || captainPos === posB) {
            captainPos = posB;
        }

        [posA, posB].forEach(pos => {
            const slot = getSlot(pos);
            const player = selectedPlayers[pos];
            if (slot) {
                const nameEl = slot.querySelector('.player-name');
                if (player) {
                    nameEl.textContent = player.name;
                    nameEl.style.color = '#fff';
                    nameEl.style.fontWeight = '700';
                } else {
                    nameEl.textContent = 'Pick a Player';
                    nameEl.style.color = '';
                    nameEl.style.fontWeight = '';
                }
            }
        });
        renderAllBadges();

        updateBudget();
        updateTransfersBudget();
        markDirty();
        renderPickSummary();
        renderTransferList();
        renderTransferSquad();
        showToast('Substitution made!', 'success');
    }

    // ===== SET CAPTAIN =====
    function setCaptain(pos) {
        // Remove captain from another player
        if (captainPos && captainPos !== pos) {
            const os = getSlot(captainPos);
            if (os) removeBadge(os, 'badge-c');
        }

        captainPos = pos;
        const slot = getSlot(pos);
        if (slot) addBadge(slot, 'C', 'badge-c');
        markDirty();
        renderPickSummary();
        renderTransferSquad();
    }

    // ===== CLICK ON PITCH SLOT -> substitution or transfers =====
    getAllSlots().forEach(slot => {
        slot.addEventListener('click', () => {
            if (subMode && slot.classList.contains('sub-target')) {
                performSwap(subBenchPos, slot.dataset.position);
                exitSubMode();
                return;
            }
            swapSlotPos = slot.dataset.position;
            showPitchAction(slot.dataset.position, slot);
        });
    });

    document.addEventListener('click', (e) => {
        if (pitchActionPos && !e.target.closest('.pitch-action') && !e.target.closest('.player-slot')) {
            removePitchAction();
        }
    });

    // ===== SAVE TEAM =====
    function saveTeam() {
        if (Object.keys(selectedPlayers).length === 0) {
            showToast('Pick at least one player first!', 'error');
            return;
        }
        if (totalSpent > BUDGET) {
            showToast('Over budget! Remove some players.', 'error');
            return;
        }

        // Check for empty position groups
        const missing = [];
        Object.keys(groupAllocations).forEach(group => {
            const filled = groupAllocations[group].some(pos => selectedPlayers[pos]);
            if (!filled) missing.push(group);
        });
        if (missing.length > 0) {
            showToast(`You have to select ${missing.join(', ')}`, 'error');
            return;
        }

        const savedData = {
            players: {},
            totalSpent,
            captain: captainPos,
        };
        Object.keys(selectedPlayers).forEach(pos => {
            savedData.players[pos] = { name: selectedPlayers[pos].name, price: selectedPlayers[pos].price, src: selectedPlayers[pos].src };
        });
        localStorage.removeItem('pharo_saved_team');
        isSaved = true;
        updateSaveBtn();
        showToast('Team saved successfully!', 'success');
    }

    if (saveBtn) saveBtn.addEventListener('click', saveTeam);
    if (transferSaveBtn) transferSaveBtn.addEventListener('click', saveTeam);

    // ===== AUTO PICK TEAM =====
    function clearSquadDisplay() {
        removePitchAction();
        getAllSlots().forEach(slot => {
            const nameEl = slot.querySelector('.player-name');
            nameEl.textContent = 'Pick a Player';
            nameEl.style.color = '';
            nameEl.style.fontWeight = '';
            slot.querySelector('.player-jersey').querySelectorAll('.jersey-badge').forEach(b => b.remove());
        });
        selectedPlayers = {};
        totalSpent = 0;
        captainPos = null;
        isSaved = false;
    }

    function autoPickTeam() {
        // Build pools per group (dedupe by name), sorted cheapest -> expensive
        const groupPools = {};
        Object.keys(groupSources).forEach(group => {
            groupPools[group] = [];
            groupSources[group].forEach(src => {
                playerDB[src].forEach(p => {
                    if (!groupPools[group].some(x => x.name === p.name)) {
                        groupPools[group].push({ ...p, src });
                    }
                });
            });
            groupPools[group].sort((a, b) => a.price - b.price);
        });

        // 1) Minimal squad (cheapest player per slot)
        const picks = {};
        let cost = 0;
        Object.keys(groupAllocations).forEach(group => {
            groupAllocations[group].forEach(pos => {
                const p = groupPools[group].shift();
                if (p) { picks[pos] = p; cost += p.price; }
            });
        });

        // 2) Upgrade towards the best players while staying in budget
        let improved = true;
        while (improved) {
            improved = false;
            let best = null;
            Object.keys(picks).forEach(pos => {
                const group = posGroupLabel(pos);
                const pool = groupPools[group];
                if (!pool.length) return;
                for (let i = pool.length - 1; i >= 0; i--) {
                    const up = pool[i];
                    if (up.price <= picks[pos].price) continue;
                    if (cost - picks[pos].price + up.price <= BUDGET) {
                        const gain = up.price - picks[pos].price;
                        if (!best || gain > best.gain) best = { pos, up, gain };
                        break;
                    }
                }
            });
            if (best) {
                const group = posGroupLabel(best.pos);
                const pool = groupPools[group];
                const old = picks[best.pos];
                pool.splice(pool.indexOf(best.up), 1);
                pool.push(old);
                pool.sort((a, b) => a.price - b.price);
                cost = cost - old.price + best.up.price;
                picks[best.pos] = best.up;
                improved = true;
            }
        }

        // 3) Apply picks to the pitch
        clearSquadDisplay();
        Object.keys(picks).forEach(pos => {
            const pick = picks[pos];
            selectedPlayers[pos] = pick;
            totalSpent += pick.price;
            const slot = getSlot(pos);
            if (slot) {
                const nameEl = slot.querySelector('.player-name');
                nameEl.textContent = pick.name;
                nameEl.style.color = '#fff';
                nameEl.style.fontWeight = '700';
            }
        });

        // 4) Auto captain = most expensive player
        const ranked = Object.keys(picks).sort((a, b) => picks[b].price - picks[a].price);
        if (ranked.length) {
            captainPos = ranked[0];
            const cSlot = getSlot(ranked[0]);
            if (cSlot) addBadge(cSlot, 'C', 'badge-c');
        }

        updateBudget();
        updateTransfersBudget();
        updateSaveBtn();
        renderPickSummary();
        renderTransferList();
        renderTransferSquad();
        showToast('Auto pick complete!', 'success');
    }

    if (autoPickBtn) autoPickBtn.addEventListener('click', autoPickTeam);

    // ===== TRANSFERS =====
    function allPlayerPool() {
        const pool = [];
        Object.keys(playerDB).forEach(srcPos => {
            playerDB[srcPos].forEach(p => {
                pool.push({ ...p, src: srcPos });
            });
        });
        return pool;
    }

    function renderTransferList() {
        if (!transferList) return;
        const used = getUsedPlayers();
        const pool = allPlayerPool().filter(p => {
            if (transferFilter !== 'ALL' && groupForSource(p.src) !== transferFilter) return false;
            if (transferSearch && transferSearch.value.trim() && !p.name.toLowerCase().includes(transferSearch.value.trim().toLowerCase())) return false;
            return true;
        });

        transferList.innerHTML = '';

        pool.forEach(p => {
            const inSquad = used.includes(p.name);
            const item = document.createElement('div');
            item.className = 'transfer-player';
            const group = groupForSource(p.src);
            const short = p.src.replace(/[0-9]/g, '');

            item.innerHTML = `
                <div class="transfer-player-left">
                    <div class="panel-player-avatar ${avClass[p.src]}">${short}</div>
                    <div class="transfer-player-info">
                        <span class="transfer-player-name">${p.name}</span>
                        <span class="transfer-player-pos">${group} &middot; ${short}</span>
                    </div>
                </div>
                <div class="transfer-player-right">
                    <span class="transfer-player-price">$${p.price}M</span>
                    <button class="transfer-player-action ${inSquad ? 'out' : 'in'}">${inSquad ? 'OUT' : 'IN'}</button>
                </div>
            `;

            const btn = item.querySelector('.transfer-player-action');
            btn.addEventListener('click', () => {
                if (inSquad) {
                    // Find the slot holding this player and remove
                    const posKey = Object.keys(selectedPlayers).find(k => selectedPlayers[k].name === p.name);
                    if (posKey) removePlayer(posKey);
                } else {
                    addToSquad(p, p.src);
                }
            });

            transferList.appendChild(item);
        });

        if (transferList.children.length === 0) {
            transferList.innerHTML = '<p class="panel-empty-msg">No players match your search</p>';
        }
    }

    function renderTransferSquad() {
        if (!transferSquadList) return;
        transferSquadList.innerHTML = '';
        exitSubMode();
        let hasAny = false;
        benchSlots.forEach((pos, i) => {
            const label = posGroupLabel(pos);
            const player = selectedPlayers[pos];
            let div;
            if (player) {
                hasAny = true;
                const isCap = captainPos === pos;
                div = document.createElement('div');
                div.className = 'panel-selected-player bench';
                div.innerHTML = `
                    <div class="panel-selected-player-left">
                        <span class="panel-selected-pos">${label}</span>
                        <span class="panel-selected-name">${player.name}</span>
                    </div>
                    <div class="transfer-player-right">
                        <button class="panel-cv-btn btn-c ${isCap ? 'active' : ''}" title="Make Captain">C</button>
                        <span class="transfer-player-price">$${player.price}M</span>
                        <button class="transfer-player-action out" title="Remove from squad">&times;</button>
                    </div>
                `;
                div.querySelector('.panel-cv-btn.btn-c').addEventListener('click', (e) => { e.stopPropagation(); setCaptain(pos); });
                div.querySelector('.transfer-player-action').addEventListener('click', (e) => { e.stopPropagation(); removePlayer(pos); });
                div.addEventListener('click', (e) => {
                    if (!e.target.closest('.panel-cv-btn') && !e.target.closest('.transfer-player-action')) showSubOption(pos, div);
                });
            } else {
                div = document.createElement('div');
                div.className = 'panel-selected-player bench empty';
                div.innerHTML = `
                    <div class="panel-selected-player-left">
                        <span class="panel-selected-pos">${label}</span>
                        <span class="panel-selected-name">Empty</span>
                    </div>
                    <span class="transfer-player-price">-</span>
                `;
                div.addEventListener('click', () => showSubOption(pos, div));
            }
            transferSquadList.appendChild(div);
        });
        if (!hasAny) {
            transferSquadList.innerHTML = '<p class="panel-empty-msg">No bench players yet</p>';
        }
    }

    // ===== TRANSFER CONTROLS =====
    if (transferSearch) transferSearch.addEventListener('input', renderTransferList);
    document.querySelectorAll('.transfer-filter').forEach(f => {
        f.addEventListener('click', () => {
            document.querySelectorAll('.transfer-filter').forEach(x => x.classList.remove('active'));
            f.classList.add('active');
            transferFilter = f.dataset.filter;
            renderTransferList();
        });
    });

    // ===== MODAL NAV (Pick / Transfers) =====
    function switchView(view) {
        document.querySelectorAll('.modal-nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.modal-nav-btn[data-view="${view}"]`);
        if (btn) btn.classList.add('active');
        if (view === 'pick') {
            pickView.classList.remove('hidden');
            transferView.classList.remove('visible');
            renderPickSummary();
        } else {
            pickView.classList.add('hidden');
            transferView.classList.add('visible');
            renderTransferList();
            renderTransferSquad();
            updateTransfersBudget();
        }
    }

    document.querySelectorAll('.modal-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    if (manageTransfersBtn) manageTransfersBtn.addEventListener('click', () => switchView('transfers'));

    // ===== STATS ANIMATION =====
    const stats = document.querySelectorAll('.stat-number');
    let statsAnimated = false;
    const animateStats = () => {
        stats.forEach(stat => {
            const target = parseInt(stat.textContent);
            const suffix = stat.textContent.replace(/[0-9]/g, '');
            let current = 0;
            const increment = target / 40;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) { current = target; clearInterval(timer); }
                stat.textContent = Math.floor(current) + suffix;
            }, 30);
        });
    };
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !statsAnimated) {
                statsAnimated = true;
                animateStats();
            }
        });
    }, { threshold: 0.5 });
    const statsContainer = document.querySelector('.hero-stats');
    if (statsContainer) statsObserver.observe(statsContainer);

    // ===== CARD FADE-IN =====
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${i * 0.15}s`;
    });
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.2 });
    cards.forEach(card => cardObserver.observe(card));

    // ===== NAV =====
    const navLinks = document.querySelectorAll('.main a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // ===== BRIGHTNESS =====
    const brightnessBtn = document.getElementById('brightness-toggle');
    const brightnessLevels = [1, 1.15, 1.35, 1.6];
    let brightnessIndex = 0;
    if (brightnessBtn) {
        brightnessBtn.addEventListener('click', () => {
            brightnessIndex = (brightnessIndex + 1) % brightnessLevels.length;
            const level = brightnessLevels[brightnessIndex];
            document.body.style.filter = `brightness(${level})`;
            brightnessBtn.title = `Brightness: ${Math.round(level * 100)}%`;
        });
    }

    // ===== PLAYER ENTRANCE ANIMATION =====
    if (pitchModal) {
        const observer = new MutationObserver(() => {
            if (pitchModal.classList.contains('open')) {
                const players = pitchModal.querySelectorAll('.player-slot');
                players.forEach((p, i) => {
                    p.style.opacity = '0';
                    p.style.transform = 'scale(0.5) translateY(20px)';
                    setTimeout(() => {
                        p.style.transition = 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
                        p.style.opacity = '1';
                        p.style.transform = 'scale(1) translateY(0)';
                    }, 200 + i * 70);
                });
            }
        });
        observer.observe(pitchModal, { attributes: true, attributeFilter: ['class'] });
    }
});