document.addEventListener('DOMContentLoaded', () => {

    // ===== PLAYER DATABASE =====
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

    const BUDGET = 70;
    let selectedPlayers = {};
    let totalSpent = 0;
    let captainSlot = null;
    let viceSlot = null;
    let isSaved = false;

    // ===== TOAST =====
    function showToast(message, type) {
        let toast = document.querySelector('.save-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'save-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.className = `save-toast ${type}`;
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // ===== RESET ALL SLOTS =====
    function resetAllSlots() {
        document.querySelectorAll('.player-slot').forEach(slot => {
            const nameEl = slot.querySelector('.player-name');
            nameEl.textContent = 'Pick a Player';
            nameEl.style.color = '';
            nameEl.style.fontWeight = '';

            const jersey = slot.querySelector('.player-jersey');
            const badges = jersey.querySelectorAll('.jersey-badge');
            badges.forEach(b => b.remove());
        });
        selectedPlayers = {};
        totalSpent = 0;
        captainSlot = null;
        viceSlot = null;
        isSaved = false;
        updateBudget();
        updateSaveBtn();
    }

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

        // Build saved data
        const savedData = {
            players: {},
            totalSpent: totalSpent,
            captain: captainSlot ? captainSlot.dataset.position : null,
            vice: viceSlot ? viceSlot.dataset.position : null,
        };

        Object.keys(selectedPlayers).forEach(pos => {
            savedData.players[pos] = { name: selectedPlayers[pos].name, price: selectedPlayers[pos].price };
        });

        localStorage.setItem('pharo_saved_team', JSON.stringify(savedData));
        isSaved = true;
        updateSaveBtn();
        showToast('Team saved successfully!', 'success');
    }

    function updateSaveBtn() {
        const btn = document.getElementById('save-team-btn');
        if (!btn) return;
        if (isSaved) {
            btn.textContent = 'Team Saved';
            btn.classList.add('saved');
        } else {
            btn.textContent = 'Save Team';
            btn.classList.remove('saved');
        }
    }

    // ===== LOAD SAVED TEAM ON PAGE LOAD =====
    function loadSavedTeam() {
        const data = localStorage.getItem('pharo_saved_team');
        if (!data) return;

        try {
            const saved = JSON.parse(data);
            const allSlots = document.querySelectorAll('.player-slot');

            Object.keys(saved.players).forEach(pos => {
                const savedPlayer = saved.players[pos];
                // Find the matching slot
                allSlots.forEach(slot => {
                    if (slot.dataset.position === pos) {
                        const players = playerDB[pos];
                        const player = players.find(p => p.name === savedPlayer.name);
                        if (player) {
                            selectedPlayers[pos] = player;
                            totalSpent += player.price;

                            const nameEl = slot.querySelector('.player-name');
                            nameEl.textContent = player.name;
                            nameEl.style.color = '#fff';
                            nameEl.style.fontWeight = '700';
                        }
                    }
                });
            });

            // Restore captain
            if (saved.captain) {
                allSlots.forEach(slot => {
                    if (slot.dataset.position === saved.captain) {
                        captainSlot = slot;
                        addBadge(slot, 'C', 'badge-c');
                    }
                });
            }

            // Restore vice
            if (saved.vice) {
                allSlots.forEach(slot => {
                    if (slot.dataset.position === saved.vice) {
                        viceSlot = slot;
                        addBadge(slot, 'V', 'badge-v');
                    }
                });
            }

            isSaved = true;
    updateBudget();

    // Load any previously saved team
    loadSavedTeam();
            updateSaveBtn();
        } catch (e) {
            localStorage.removeItem('pharo_saved_team');
        }
    }

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

    // ===== PITCH MODAL =====
    const pitchModal = document.getElementById('pitch-modal');
    const openBtn = document.getElementById('open-pitch');
    const closeBtn = document.getElementById('pitch-close');
    const pickerPopup = document.getElementById('picker-popup');
    const pickerTitle = document.getElementById('picker-title');
    const pickerList = document.getElementById('picker-list');
    const pickerCloseBtn = document.getElementById('picker-close');
    const budgetDisplay = document.getElementById('budget-left');

    function openModal() {
        pitchModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        pitchModal.classList.remove('open');
        document.body.style.overflow = '';
        closePicker();

        // If team was NOT saved, reset everything back to original
        if (!isSaved) {
            resetAllSlots();
        }
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Save button
    const saveBtn = document.getElementById('save-team-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveTeam);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (pickerPopup.classList.contains('visible')) {
                closePicker();
            } else {
                closeModal();
            }
        }
    });

    // ===== PLAYER PICKER =====
    function updateBudget() {
        const remaining = BUDGET - totalSpent;
        budgetDisplay.textContent = `$${remaining}M`;
        if (remaining < 10) {
            budgetDisplay.style.color = '#e8443a';
        } else {
            budgetDisplay.style.color = '#00d4e8';
        }
    }

    function getUsedPlayers() {
        return Object.values(selectedPlayers).map(p => p.name);
    }

    function openPicker(slot) {
        const position = slot.dataset.position;
        const players = playerDB[position];
        const used = getUsedPlayers();
        const posLabel = position.replace(/[0-9]/g, '');

        pickerTitle.textContent = `Choose ${posLabel}`;
        pickerList.innerHTML = '';

        players.forEach(player => {
            const isTaken = used.includes(player.name);

            const item = document.createElement('div');
            item.className = 'picker-item' + (isTaken ? ' unavailable' : '');

            // Check if this player is already captain or vice
            const isCaptain = captainSlot && captainSlot.dataset.position === position;
            const isVice = viceSlot && viceSlot.dataset.position === position;

            item.innerHTML = `
                <div class="picker-item-info">
                    <span class="picker-item-name">${player.name}</span>
                    <span class="picker-item-role">${posLabel}</span>
                </div>
                <span class="picker-item-price">$${player.price}M</span>
                <div class="picker-item-actions">
                    <button class="picker-cv-btn btn-c ${isCaptain ? 'active' : ''}" data-role="captain" title="Make Captain">C</button>
                    <button class="picker-cv-btn btn-v ${isVice ? 'active' : ''}" data-role="vice" title="Make Vice Captain">V</button>
                </div>
            `;

            if (!isTaken) {
                // Click row to select player
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.picker-cv-btn')) return;
                    selectPlayer(slot, player, position);
                });

                // Captain button
                const cBtn = item.querySelector('.btn-c');
                cBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setCaptain(slot, player, position, cBtn);
                });

                // Vice button
                const vBtn = item.querySelector('.btn-v');
                vBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setVice(slot, player, position, vBtn);
                });
            } else {
                // Disable C/V for taken players
                item.querySelectorAll('.picker-cv-btn').forEach(b => b.classList.add('disabled'));
            }

            pickerList.appendChild(item);
        });

        // Position the popup near the clicked slot
        const slotRect = slot.getBoundingClientRect();
        const pickerHeight = 360;
        const topbarHeight = 70;
        const gap = 10;

        let top = slotRect.bottom + gap;
        let left = slotRect.left + slotRect.width / 2 - 140;

        // If not enough space below, open above
        if (top + pickerHeight > window.innerHeight) {
            top = slotRect.top - pickerHeight - gap;
        }

        // If above the topbar, clamp it
        if (top < topbarHeight) {
            top = topbarHeight + 5;
        }

        // Horizontal clamping
        if (left < 10) left = 10;
        if (left + 280 > window.innerWidth) left = window.innerWidth - 290;

        pickerPopup.style.top = top + 'px';
        pickerPopup.style.left = left + 'px';
        pickerPopup.classList.add('visible');
    }

    function setCaptain(slot, player, position, btn) {
        // Can't be both captain and vice
        if (viceSlot && viceSlot === slot) {
            removeBadge(viceSlot, 'badge-v');
            viceSlot = null;
        }

        // If someone else is captain, remove their badge
        if (captainSlot && captainSlot !== slot) {
            removeBadge(captainSlot, 'badge-c');
        }

        captainSlot = slot;
        addBadge(slot, 'C', 'badge-c');

        // Update active state in picker
        pickerList.querySelectorAll('.btn-c').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    function setVice(slot, player, position, btn) {
        // Can't be both captain and vice
        if (captainSlot && captainSlot === slot) {
            removeBadge(captainSlot, 'badge-c');
            captainSlot = null;
        }

        // If someone else is vice, remove their badge
        if (viceSlot && viceSlot !== slot) {
            removeBadge(viceSlot, 'badge-v');
        }

        viceSlot = slot;
        addBadge(slot, 'V', 'badge-v');

        // Update active state in picker
        pickerList.querySelectorAll('.btn-v').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    function addBadge(slot, letter, badgeClass) {
        const jersey = slot.querySelector('.player-jersey');
        // Remove existing badge first
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

    function closePicker() {
        pickerPopup.classList.remove('visible');
    }

    function selectPlayer(slot, player, position) {
        // If this slot already had a player, refund
        if (selectedPlayers[position]) {
            totalSpent -= selectedPlayers[position].price;
        }

        selectedPlayers[position] = player;
        totalSpent += player.price;

        // Update the slot display
        const nameEl = slot.querySelector('.player-name');
        nameEl.textContent = player.name;
        nameEl.style.color = '#fff';
        nameEl.style.fontWeight = '700';

        // Flash effect on jersey
        const jersey = slot.querySelector('.player-jersey');
        jersey.style.boxShadow = '0 0 30px rgba(0, 212, 232, 0.6)';
        setTimeout(() => { jersey.style.boxShadow = ''; }, 600);

        // Auto-assign captain if no captain yet
        if (!captainSlot) {
            captainSlot = slot;
            addBadge(slot, 'C', 'badge-c');
        }

        updateBudget();
        closePicker();
    }

    // Click on any player slot
    document.querySelectorAll('.player-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            openPicker(slot);
        });
    });

    // Close picker
    if (pickerCloseBtn) pickerCloseBtn.addEventListener('click', closePicker);

    // Close picker when clicking outside
    document.addEventListener('click', (e) => {
        if (pickerPopup.classList.contains('visible') &&
            !pickerPopup.contains(e.target) &&
            !e.target.closest('.player-slot')) {
            closePicker();
        }
    });

    updateBudget();

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
