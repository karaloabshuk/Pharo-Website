document.addEventListener('DOMContentLoaded', () => {

    const playerDB = {
        GK: [
            { name: 'Robel', price: 5 },
            { name: 'Samuel', price: 3 },
            { name: 'Daniel', price: 4 },
        ],
        LB: [
            { name: 'Adoni', price: 4 },
            { name: 'Yonas', price: 3 },
            { name: 'Ephrem', price: 3.5 },
        ],
        CB1: [
            { name: 'Halid', price: 6 },
            { name: 'Tomas', price: 4.5 },
            { name: 'Isaac', price: 5 },
        ],
        CB2: [
            { name: 'Muaz', price: 5.5 },
            { name: 'Natan', price: 4 },
            { name: 'Joel', price: 3.5 },
        ],
        RB: [
            { name: 'Canto', price: 4.5 },
            { name: 'Riki', price: 3 },
            { name: 'Dawit', price: 3.5 },
        ],
        CM1: [
            { name: 'Karalo', price: 10 },
            { name: 'Mikiyas', price: 5 },
            { name: 'Abel', price: 4.5 },
        ],
        CM2: [
            { name: 'Nahom', price: 6 },
            { name: 'Bereket', price: 4 },
            { name: 'Sami', price: 5 },
        ],
        CM3: [
            { name: 'Hiruy', price: 5 },
            { name: 'Luel', price: 3.5 },
            { name: 'Fanuel', price: 4 },
        ],
        LW: [
            { name: 'Kedus', price: 8 },
            { name: 'Matios', price: 6 },
            { name: 'Habtamu', price: 5.5 },
        ],
        ST: [
            { name: 'Abel', price: 9 },
            { name: 'Biniam', price: 7 },
            { name: 'Surafel', price: 6.5 },
        ],
        RW: [
            { name: 'Bombe', price: 7.5 },
            { name: 'Kidus', price: 5 },
            { name: 'Yohannes', price: 6 },
        ],
    };

    const BUDGET = 50;
    let selectedPlayers = {};
    let totalSpent = 0;
    let captainSlot = null;
    let viceSlot = null;
    let isSaved = false;
    let activeTab = 'GKP';

    // Group -> slot positions on the pitch
    const groupAllocations = {
        GKP: ['GKP1'],
        DEF: ['DEF1', 'DEF2', 'DEF3', 'DEF4'],
        MID: ['MID1', 'MID2', 'MID3'],
        FWD: ['FWD1', 'FWD2', 'FWD3'],
    };

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
    const panelList = document.getElementById('panel-list');
    const panelSelectedList = document.getElementById('panel-selected-list');
    const saveBtn = document.getElementById('save-team-btn');

    function getAllSlots() {
        return Array.from(document.querySelectorAll('.player-slot'));
    }

    function getSlot(pos) {
        return getAllSlots().find(s => s.dataset.position === pos);
    }

    // Group label for a slot
    function posGroupLabel(pos) {
        if (pos.startsWith('GKP')) return 'GKP';
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

    function getUsedPlayers() {
        return Object.values(selectedPlayers).map(p => p.name);
    }

    function updateSaveBtn() {
        if (!saveBtn) return;
        if (isSaved) {
            saveBtn.textContent = 'Team Saved';
            saveBtn.classList.add('saved');
        } else {
            saveBtn.textContent = 'Save Team';
            saveBtn.classList.remove('saved');
        }
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
        captainSlot = null;
        viceSlot = null;
        isSaved = false;
        updateBudget();
        updateSaveBtn();
        renderPanelList();
        renderSelectedPanel();
    }

    function openModal() {
        pitchModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        pitchModal.classList.remove('open');
        document.body.style.overflow = '';
        if (!isSaved) resetAllSlots();
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && pitchModal.classList.contains('open')) closeModal();
    });

    // ===== TABS =====
    document.querySelectorAll('.panel-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeTab = tab.dataset.tab;
            renderPanelList();
        });
    });

    // ===== RENDER PANEL LIST (all players of this group) =====
    function renderPanelList() {
        const sources = groupSources[activeTab];
        const used = getUsedPlayers();
        panelList.innerHTML = '';

        sources.forEach(srcPos => {
            const players = playerDB[srcPos];
            players.forEach(player => {
                const isTaken = used.includes(player.name);
                const item = document.createElement('div');
                item.className = 'panel-player' + (isTaken ? ' unavailable' : '');
                const short = srcPos.replace(/[0-9]/g, '');

                item.innerHTML = `
                    <div class="panel-player-left">
                        <div class="panel-player-avatar ${avClass[srcPos]}">${short}</div>
                        <div class="panel-player-info">
                            <span class="panel-player-name">${player.name}</span>
                            <span class="panel-player-pos">${activeTab}</span>
                        </div>
                    </div>
                    <div class="panel-player-right">
                        <span class="panel-player-price">$${player.price}M</span>
                    </div>
                `;

                if (!isTaken) {
                    item.addEventListener('click', () => selectPlayer(player));
                }
                panelList.appendChild(item);
            });
        });
    }

    // ===== SELECT PLAYER (fill first empty slot in group) =====
    function selectPlayer(player) {
        const group = activeTab;
        const slots = groupAllocations[group];
        // Find the first empty slot
        let targetPos = null;
        for (const pos of slots) {
            if (!selectedPlayers[pos]) {
                targetPos = pos;
                break;
            }
        }
        if (!targetPos) {
            showToast(`${group} slots are full!`, 'error');
            return;
        }

        const slot = getSlot(targetPos);
        selectedPlayers[targetPos] = player;
        totalSpent += player.price;

        const nameEl = slot.querySelector('.player-name');
        nameEl.textContent = player.name;
        nameEl.style.color = '#fff';
        nameEl.style.fontWeight = '700';

        const jersey = slot.querySelector('.player-jersey');
        jersey.style.boxShadow = '0 0 30px rgba(0, 212, 232, 0.6)';
        setTimeout(() => { jersey.style.boxShadow = ''; }, 600);

        updateBudget();
        renderPanelList();
        renderSelectedPanel();
    }

    // ===== REMOVE PLAYER =====
    function removePlayer(pos) {
        if (!selectedPlayers[pos]) return;

        const slot = getSlot(pos);
        if (slot) {
            const nameEl = slot.querySelector('.player-name');
            nameEl.textContent = 'Pick a Player';
            nameEl.style.color = '';
            nameEl.style.fontWeight = '';
        }

        if (captainSlot && captainSlot === slot) {
            removeBadge(slot, 'badge-c');
            captainSlot = null;
        }
        if (viceSlot && viceSlot === slot) {
            removeBadge(slot, 'badge-v');
            viceSlot = null;
        }

        totalSpent -= selectedPlayers[pos].price;
        delete selectedPlayers[pos];

        updateBudget();
        renderPanelList();
        renderSelectedPanel();
    }

    // ===== SET CAPTAIN / VICE =====
    function setCaptain(pos) {
        const slot = getSlot(pos);
        if (!slot) return;

        // Can't be both captain and vice
        if (viceSlot && viceSlot === slot) {
            removeBadge(slot, 'badge-v');
            viceSlot = null;
        }
        // Remove captain from another player
        if (captainSlot && captainSlot !== slot) {
            removeBadge(captainSlot, 'badge-c');
        }

        captainSlot = slot;
        addBadge(slot, 'C', 'badge-c');
        renderSelectedPanel();
    }

    function setVice(pos) {
        const slot = getSlot(pos);
        if (!slot) return;

        // Can't be both captain and vice
        if (captainSlot && captainSlot === slot) {
            removeBadge(slot, 'badge-c');
            captainSlot = null;
        }
        // Remove vice from another player
        if (viceSlot && viceSlot !== slot) {
            removeBadge(viceSlot, 'badge-v');
        }

        viceSlot = slot;
        addBadge(slot, 'V', 'badge-v');
        renderSelectedPanel();
    }

    // ===== RENDER SELECTED PANEL =====
    function renderSelectedPanel() {
        const keys = Object.keys(selectedPlayers);
        if (keys.length === 0) {
            panelSelectedList.innerHTML = '<p class="panel-empty-msg">No players selected yet</p>';
            return;
        }
        panelSelectedList.innerHTML = '';
        keys.forEach(pos => {
            const player = selectedPlayers[pos];
            const label = posGroupLabel(pos);
            const isCap = captainSlot && captainSlot.dataset.position === pos;
            const isVC = viceSlot && viceSlot.dataset.position === pos;
            const div = document.createElement('div');
            div.className = 'panel-selected-player';
            div.innerHTML = `
                <div class="panel-selected-player-left">
                    <span class="panel-selected-pos">${label}</span>
                    <span class="panel-selected-name">${player.name}</span>
                </div>
                <div class="panel-selected-actions">
                    <button class="panel-cv-btn btn-c ${isCap ? 'active' : ''}" title="Make Captain">C</button>
                    <button class="panel-cv-btn btn-v ${isVC ? 'active' : ''}" title="Make Vice Captain">V</button>
                    <button class="panel-selected-remove" title="Remove">&times;</button>
                </div>
            `;
            div.querySelector('.btn-c').addEventListener('click', (e) => {
                e.stopPropagation();
                setCaptain(pos);
            });
            div.querySelector('.btn-v').addEventListener('click', (e) => {
                e.stopPropagation();
                setVice(pos);
            });
            div.querySelector('.panel-selected-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removePlayer(pos);
            });
            panelSelectedList.appendChild(div);
        });
    }

    // ===== CLICK ON PITCH SLOTS -> switch to that group tab =====
    getAllSlots().forEach(slot => {
        slot.addEventListener('click', () => {
            const group = posGroupLabel(slot.dataset.position);
            const tabKey = Object.keys(groupAllocations).find(k => k === group);
            if (tabKey) {
                document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
                document.querySelector(`.panel-tab[data-tab="${tabKey}"]`).classList.add('active');
                activeTab = tabKey;
                renderPanelList();
            }
        });
    });

    // ===== SAVE TEAM =====
    if (saveBtn) saveBtn.addEventListener('click', () => {
        if (Object.keys(selectedPlayers).length === 0) {
            showToast('Pick at least one player first!', 'error');
            return;
        }
        if (totalSpent > BUDGET) {
            showToast('Over budget! Remove some players.', 'error');
            return;
        }
        const savedData = {
            players: {},
            totalSpent,
            captain: captainSlot ? captainSlot.dataset.position : null,
            vice: viceSlot ? viceSlot.dataset.position : null,
        };
        Object.keys(selectedPlayers).forEach(pos => {
            savedData.players[pos] = { name: selectedPlayers[pos].name, price: selectedPlayers[pos].price, src: selectedPlayers[pos].src };
        });
        localStorage.setItem('pharo_saved_team', JSON.stringify(savedData));
        isSaved = true;
        updateSaveBtn();
        showToast('Team saved successfully!', 'success');
    });

    // ===== LOAD SAVED TEAM =====
    function loadSavedTeam() {
        const data = localStorage.getItem('pharo_saved_team');
        if (!data) return;
        try {
            const saved = JSON.parse(data);
            getAllSlots().forEach(slot => {
                const pos = slot.dataset.position;
                const savedPlayer = saved.players[pos];
                if (savedPlayer) {
                    // Find player in DB by name (position order: from group sources)
                    const group = posGroupLabel(pos);
                    const sources = groupSources[group];
                    let found = null;
                    for (const src of sources) {
                        const p = playerDB[src].find(x => x.name === savedPlayer.name);
                        if (p) { found = { ...p, src }; break; }
                    }
                    if (found) {
                        selectedPlayers[pos] = found;
                        if (found.price !== undefined) totalSpent += found.price;
                        const nameEl = slot.querySelector('.player-name');
                        nameEl.textContent = found.name;
                        nameEl.style.color = '#fff';
                        nameEl.style.fontWeight = '700';
                    }
                }
            });

            if (saved.captain) {
                const cSlot = getSlot(saved.captain);
                if (cSlot) {
                    captainSlot = cSlot;
                    addBadge(cSlot, 'C', 'badge-c');
                }
            }
            if (saved.vice) {
                const vSlot = getSlot(saved.vice);
                if (vSlot) {
                    viceSlot = vSlot;
                    addBadge(vSlot, 'V', 'badge-v');
                }
            }

            isSaved = true;
            updateBudget();
            updateSaveBtn();
            renderPanelList();
            renderSelectedPanel();
        } catch (e) {
            localStorage.removeItem('pharo_saved_team');
        }
    }

    loadSavedTeam();

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