const RESOURCE = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'gta6_hud';
let speedUnit = 'KMPH';
const VEHICLE_NAME_MS = 3500;
const DEG_PER_U = 4 / 3;

const $ = (sel) => document.querySelector(sel);
const num = (v, d = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : d);
const clamp = (v) => Math.max(0, Math.min(100, v));
const fmt = new Intl.NumberFormat('en-US');

function post(name, data = {}) {
    fetch(`https://${RESOURCE}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(() => { });
}

/* ==========================================================================
   DEFAULT CUSTOMIZATIONS (SEPARATE ON-FOOT & IN-VEHICLE PROFILES)
   ========================================================================== */
const DEFAULT_CUSTOMS = {
    onFoot: {
        status: { x: 0, y: 0, scale: 100, barW: 220, barH: 10, gap: 8, radius: 1 },
        chips: { x: 0, y: 0, scale: 100 },
        compass: { x: 0, y: 0, scale: 100, width: 240 },
        weapon: { x: 0, y: 0, scale: 100 },
        money: { x: 0, y: 0, scale: 100 },
        logo: { x: 0, y: 0, scale: 100 },
    },
    inVehicle: {
        status: { x: 0, y: 0, scale: 100, barW: 220, barH: 10, gap: 8, radius: 1 },
        chips: { x: 0, y: 0, scale: 100 },
        vehicle: { x: 0, y: 0, scale: 100 },
        vnav: { x: 0, y: 0, scale: 100, width: 28.4 },
        compass: { x: 0, y: 0, scale: 100, width: 240 },
        weapon: { x: 0, y: 0, scale: 100 },
        money: { x: 0, y: 0, scale: 100 },
        logo: { x: 0, y: 0, scale: 100 },
    },
    fonts: {
        status: 'Inter',
        vehicle: 'Montserrat',
        vnav: 'Montserrat',
        compass: 'Inter',
        weapon: 'Pricedown Bl',
        money: 'Pricedown Bl',
    },
    colors: {
        status: {
            health: '#f3adc4',
            armor: '#9db4ff',
            stamina: '#74e8d4',
            hunger: '#ffc879',
            thirst: '#8ecbff',
            stress: '#d9a8ff',
            circle: '#2b2c31',
        },
        chips: {
            voice: '#d5d9e0',
            talking: '#f6e08b',
            radio: '#f3adc4',
            circle: '#2b2c31',
        },
        vehicle: {
            speed: '#f1f3f7',
            unit: '#cfd3da',
        },
        vnav: {
            bg: '#1b1920',
            border: '#2c2a33',
            text: '#e8e8ed',
            accent: '#0fe5ca',
        },
        compass: {
            ruler: '#f1f3f7',
            pointer: '#f3adc4',
            text: '#f1f3f7',
        },
        weapon: {
            clip: '#f7f7f7',
            reserve: 'rgba(247, 247, 247, 0.42)',
        },
        money: {
            bank: '#be88f1',
            cash: '#78d876',
            plus: '#78d876',
            minus: '#ff4d6d',
        },
    },
};

const THEME_PRESETS = {
    gta6: {
        health: '#f3adc4',
        armor: '#9db4ff',
        stamina: '#74e8d4',
        hunger: '#ffc879',
        thirst: '#8ecbff',
        stress: '#d9a8ff',
        circle: '#2b2c31',
    },
    drm: {
        health: '#f04438',
        armor: '#38bdf8',
        stamina: '#10b981',
        hunger: '#fb923c',
        thirst: '#38bdf8',
        stress: '#e0382d',
        circle: '#1a1d22',
    },
    cyber: {
        health: '#ff0055',
        armor: '#00ffff',
        stamina: '#ffe600',
        hunger: '#ff7700',
        thirst: '#00ffaa',
        stress: '#aa00ff',
        circle: '#15181c',
    },
    emerald: {
        health: '#10b981',
        armor: '#059669',
        stamina: '#34d399',
        hunger: '#6ee7b7',
        thirst: '#a7f3d0',
        stress: '#047857',
        circle: '#14171c',
    },
    slate: {
        health: '#e2e8f0',
        armor: '#cbd5e1',
        stamina: '#94a3b8',
        hunger: '#64748b',
        thirst: '#cbd5e1',
        stress: '#475569',
        circle: '#1a1d22',
    },
};

function cloneObj(obj) {
    return JSON.parse(JSON.stringify(obj));
}

let customs = cloneObj(DEFAULT_CUSTOMS);
customs.sync = customs.sync || {
    status: true,
    chips: true,
    compass: true,
    weapon: true,
    money: true,
};
let currentHudMode = 'onFoot'; // 'onFoot' | 'inVehicle'
let isEditMode = false;
let editSnapshot = null;
let activeDrag = null;
let dragStartX = 0;
let dragStartY = 0;
let initialX = 0;
let initialY = 0;

function updateLayoutProperty(id, prop, value) {
    if (!customs[currentHudMode] || !customs[currentHudMode][id]) return;
    customs[currentHudMode][id][prop] = value;

    // If sync is enabled for this element, mirror change to the other profile
    if (customs.sync && customs.sync[id]) {
        const otherMode = currentHudMode === 'onFoot' ? 'inVehicle' : 'onFoot';
        if (customs[otherMode] && customs[otherMode][id]) {
            customs[otherMode][id][prop] = value;
        }
    }
}

function copyElementToOtherMode(id) {
    if (!id) return;
    const fromMode = currentHudMode;
    const toMode = fromMode === 'onFoot' ? 'inVehicle' : 'onFoot';
    if (!customs[fromMode][id] || !customs[toMode] || !customs[toMode][id]) return;

    customs[toMode][id] = cloneObj(customs[fromMode][id]);
    applyCustoms();
    saveCustoms();
    syncLayoutInputs();
    if (isEditMode && selectedInspectorComp === id) selectInspectorElement(id);
}

function toggleElementSync(id) {
    if (!id) return;
    if (!customs.sync) customs.sync = {};
    customs.sync[id] = !customs.sync[id];
    if (customs.sync[id]) {
        copyElementToOtherMode(id);
    }
    updateSyncUI();
    saveCustoms();
}

function updateSyncUI() {
    const id = isEditMode ? selectedInspectorComp : activeLayoutComp;
    const isVehComp = id === 'vehicle' || id === 'vnav';
    const otherModeName = currentHudMode === 'onFoot' ? 'In-Vehicle' : 'On-Foot';

    // Inspector sync button
    const inspSyncBtn = $('#btnInspSync');
    const inspSyncText = $('#inspSyncText');
    const inspCopyBtn = $('#btnInspCopy');
    const inspCopyText = $('#inspCopyText');
    const inspSyncRow = $('#inspSyncRow');

    if (inspSyncRow) {
        if (isVehComp) {
            inspSyncRow.hidden = true;
        } else {
            inspSyncRow.hidden = false;
            const isSynced = !!(customs.sync && customs.sync[id]);
            inspSyncBtn.classList.toggle('active', isSynced);
            inspSyncText.textContent = isSynced ? 'Sync: ON' : 'Sync: OFF';
            inspCopyText.textContent = `Copy to ${otherModeName}`;
        }
    }

    // Tablet Layout Tab sync button
    const tabSyncBtn = $('#btn-sync-tab-layout');
    const tabSyncText = $('#syncTabText');
    const tabCopyBtn = $('#btn-copy-tab-layout');
    const tabCopyText = $('#copyTabText');

    if (tabSyncBtn) {
        if (isVehComp) {
            tabSyncBtn.hidden = true;
            tabCopyBtn.hidden = true;
        } else {
            tabSyncBtn.hidden = false;
            tabCopyBtn.hidden = false;
            const isSynced = !!(customs.sync && customs.sync[id]);
            tabSyncBtn.classList.toggle('active', isSynced);
            tabSyncText.textContent = isSynced ? 'Sync: ON' : 'Sync: OFF';
            tabCopyText.textContent = `Copy to ${otherModeName}`;
        }
    }
}

function mergeCustoms(data) {
    if (!data || typeof data !== 'object') return;
    if (data.onFoot && typeof data.onFoot === 'object') {
        for (const k in data.onFoot) {
            if (!customs.onFoot[k]) customs.onFoot[k] = {};
            Object.assign(customs.onFoot[k], data.onFoot[k]);
        }
    }
    if (data.inVehicle && typeof data.inVehicle === 'object') {
        for (const k in data.inVehicle) {
            if (!customs.inVehicle[k]) customs.inVehicle[k] = {};
            Object.assign(customs.inVehicle[k], data.inVehicle[k]);
        }
    }
    if (data.sync && typeof data.sync === 'object') {
        customs.sync = Object.assign({}, customs.sync, data.sync);
    }
    if (data.fonts && typeof data.fonts === 'object') {
        Object.assign(customs.fonts, data.fonts);
    }
    if (data.colors && typeof data.colors === 'object') {
        for (const k in data.colors) {
            if (!customs.colors[k]) customs.colors[k] = {};
            Object.assign(customs.colors[k], data.colors[k]);
        }
    }
    // Backward compatibility for old flat structure
    if (data.status && typeof data.status === 'object' && !data.onFoot) {
        ['status', 'chips', 'compass', 'weapon', 'money'].forEach((key) => {
            if (data[key]) {
                Object.assign(customs.onFoot[key], data[key]);
                Object.assign(customs.inVehicle[key], data[key]);
            }
        });
        if (data.vehicle) Object.assign(customs.inVehicle.vehicle, data.vehicle);
        if (data.vnav) Object.assign(customs.inVehicle.vnav, data.vnav);
    }
}

// Load from LocalStorage
try {
    const local = localStorage.getItem('gta6_hud_custom_layout');
    if (local) {
        mergeCustoms(JSON.parse(local));
    }
} catch (e) { }

const settings = {
    isOutMapChecked: false,
    isOutCompassChecked: false,
    isCompassFollowChecked: true,
    isOpenMenuSoundsChecked: true,
    isResetSoundsChecked: true,
    isListSoundsChecked: true,
    isLowFuelChecked: true,
    isCinematicNotifChecked: true,
    isDynamicHealthChecked: false,
    isDynamicArmorChecked: true,
    isDynamicHungerChecked: false,
    isDynamicThirstChecked: false,
    isDynamicStressChecked: true,
    isDynamicOxygenChecked: true,
    isChangeFPSChecked: true,
    isShowNavChecked: true,
    isHideMapChecked: false,
    isDynamicEngineChecked: true,
    isDynamicNitroChecked: true,
    isShowLogoChecked: true,
    isLogoAnimChecked: true,
    isChangeCompassFPSChecked: true,
    isCompassShowChecked: true,
    isShowStreetsChecked: true,
    isPointerShowChecked: true,
    isDegreesShowChecked: true,
    isCinematicModeChecked: false,
    isShowHealthPercentChecked: true,
    isShowArmorPercentChecked: true,
    isShowOxygenPercentChecked: true,
    isShowHungerPercentChecked: true,
    isShowThirstPercentChecked: true,
    isShowStressPercentChecked: true,
    isShowNitroPercentChecked: true,
    isShowHarnessPercentChecked: true,
};

const MENU = [
    ['map', [
        ['isOutMapChecked', 'showOutMap'],
        ['isHideMapChecked', 'HideMap'],
    ]],
    ['compass', [
        ['isOutCompassChecked', 'showOutCompass'],
        ['isCompassFollowChecked', 'showFollowCompass'],
        ['isCompassShowChecked', 'showCompassBase'],
        ['isShowStreetsChecked', 'showStreetsNames'],
        ['isPointerShowChecked', 'showPointerIndex'],
        ['isDegreesShowChecked', 'showDegreesNum'],
        ['isChangeCompassFPSChecked', 'changeCompassFPS'],
    ]],
    ['status', [
        ['isDynamicHealthChecked', 'dynamicHealth'],
        ['isDynamicArmorChecked', 'dynamicArmor'],
        ['isDynamicOxygenChecked', 'dynamicOxygen'],
        ['isDynamicHungerChecked', 'dynamicHunger'],
        ['isDynamicThirstChecked', 'dynamicThirst'],
        ['isDynamicStressChecked', 'dynamicStress'],
    ]],
    ['percentages', [
        ['isShowHealthPercentChecked', 'showHealthPercent'],
        ['isShowArmorPercentChecked', 'showArmorPercent'],
        ['isShowOxygenPercentChecked', 'showOxygenPercent'],
        ['isShowHungerPercentChecked', 'showHungerPercent'],
        ['isShowThirstPercentChecked', 'showThirstPercent'],
        ['isShowStressPercentChecked', 'showStressPercent'],
        ['isShowNitroPercentChecked', 'showNitroPercent'],
        ['isShowHarnessPercentChecked', 'showHarnessPercent'],
    ]],
    ['vehicle', [
        ['isChangeFPSChecked', 'changeFPS'],
        ['isShowNavChecked', 'showNav'],
        ['isDynamicEngineChecked', 'dynamicEngine'],
        ['isDynamicNitroChecked', 'dynamicNitro'],
        ['isLowFuelChecked', 'showFuelAlert'],
    ]],
    ['logo', [
        ['isShowLogoChecked', 'showLogo'],
        ['isLogoAnimChecked', 'toggleLogoAnim'],
    ]],
    ['sound', [
        ['isOpenMenuSoundsChecked', 'openMenuSounds'],
        ['isResetSoundsChecked', 'resetHudSounds'],
        ['isListSoundsChecked', 'checklistSounds'],
        ['isCinematicNotifChecked', 'showCinematicNotif'],
    ]],
    ['cinematic', [
        ['isCinematicModeChecked', 'cinematicMode'],
    ]],
];

const STATS = [
    { id: 'health', icon: 'heart', colorKey: 'health', notch: false },
    { id: 'armor', icon: 'shield', colorKey: 'armor' },
    { id: 'stamina', icon: 'bolt', colorKey: 'stamina' },
    { id: 'hunger', icon: 'food', colorKey: 'hunger' },
    { id: 'thirst', icon: 'drop', colorKey: 'thirst' },
    { id: 'stress', icon: 'stress', colorKey: 'stress' },
];

const VEHICLE_ROWS = [
    { id: 'nitro', icon: 'nitro', color: 'var(--pink)' },
    { id: 'harness', icon: 'harness', color: 'var(--lilac)' },
];

const STAT_PERCENT_KEYS = {
    health: 'isShowHealthPercentChecked',
    armor: 'isShowArmorPercentChecked',
    stamina: 'isShowOxygenPercentChecked',
    hunger: 'isShowHungerPercentChecked',
    thirst: 'isShowThirstPercentChecked',
    stress: 'isShowStressPercentChecked',
    nitro: 'isShowNitroPercentChecked',
    harness: 'isShowHarnessPercentChecked',
};

const rows = {};
const pctTargets = {};
const pctCurrent = {};
let pctRaf = 0;
let pctLastTime = 0;

function animatePercentages() {
    const now = performance.now();
    const dt = Math.min(now - pctLastTime, 100);
    pctLastTime = now;
    let keepAnimating = false;

    for (const id in pctTargets) {
        const target = pctTargets[id];
        let curr = pctCurrent[id];
        if (curr === undefined) {
            curr = target;
            pctCurrent[id] = target;
        }

        const diff = target - curr;
        if (Math.abs(diff) < 0.2) {
            pctCurrent[id] = target;
        } else {
            pctCurrent[id] += diff * (1 - Math.exp(-dt / 180));
            keepAnimating = true;
        }

        const pctEl = rows[id]?.querySelector('.row-pct');
        if (pctEl) {
            pctEl.textContent = `${Math.round(pctCurrent[id])}%`;
        }
    }

    if (keepAnimating) {
        pctRaf = requestAnimationFrame(animatePercentages);
    } else {
        pctRaf = 0;
    }
}

function updateRowPercent(id, value) {
    const clamped = Math.round(clamp(num(value)));
    pctTargets[id] = clamped;
    if (pctCurrent[id] === undefined) {
        pctCurrent[id] = clamped;
        const pctEl = rows[id]?.querySelector('.row-pct');
        if (pctEl) {
            pctEl.textContent = `${clamped}%`;
        }
    } else if (!pctRaf) {
        pctLastTime = performance.now();
        pctRaf = requestAnimationFrame(animatePercentages);
    }
}

function syncPercentVisibilities() {
    for (const id in STAT_PERCENT_KEYS) {
        const row = rows[id];
        if (!row) continue;
        const pctEl = row.querySelector('.row-pct');
        if (!pctEl) continue;
        const key = STAT_PERCENT_KEYS[id];
        pctEl.hidden = settings[key] === false;
    }
}

function makeRow({ id, icon, notch }) {
    const row = document.createElement('div');
    row.className = 'row';
    row.dataset.stat = id;
    row.hidden = true;
    row.innerHTML = `<div class="icon"><svg><use href="#i-${icon}"/></svg></div><div class="track"><div class="fill">${notch ? '<div class="notch"></div>' : ''}</div></div><div class="row-pct" id="pct-${id}">100%</div>`;
    rows[id] = row;
    return row;
}

function setRow(id, visible, pct, low) {
    const row = rows[id];
    if (!row) return;
    row.hidden = !visible;
    if (!visible) return;
    const clamped = clamp(num(pct));
    row.querySelector('.fill').style.width = `${clamped}%`;
    row.classList.toggle('low', !!low);

    updateRowPercent(id, clamped);

    const pctKey = STAT_PERCENT_KEYS[id];
    const pctEl = row.querySelector('.row-pct');
    if (pctEl && pctKey) {
        pctEl.hidden = settings[pctKey] === false;
    }
}

const lastValues = {};
const hitTimers = {};

function playHit(id, icon) {
    icon.classList.remove('hit');
    void icon.offsetWidth;
    icon.classList.add('hit');
    hitTimers[id] = setTimeout(() => {
        hitTimers[id] = 0;
        icon.classList.remove('hit');
        if (icon.dataset.again) {
            delete icon.dataset.again;
            playHit(id, icon);
        }
    }, 720);
}

function hit(id, value) {
    const prev = lastValues[id];
    lastValues[id] = value;
    if (prev === undefined || value >= prev) return;
    const icon = rows[id]?.querySelector('.icon');
    if (!icon) return;
    if (hitTimers[id]) {
        icon.dataset.again = '1';
        return;
    }
    playHit(id, icon);
}

STATS.forEach((s) => $('#status').appendChild(makeRow(s)));
VEHICLE_ROWS.forEach((s) => $('#vehicle-rows').appendChild(makeRow(s)));
$('#speed-unit').textContent = speedUnit;

const hud = $('#hud');
const player = {};
const vehicle = {};

/* ==========================================================================
   APPLY CUSTOMS TO DOM / CSS VARIABLES (STATE-AWARE: ON-FOOT VS VEHICLE)
   ========================================================================== */
function applyCustoms() {
    const s = hud.style;
    const mode = isEditMode ? currentHudMode : (vehicle.show ? 'inVehicle' : 'onFoot');
    const layout = customs[mode] || customs.onFoot;
    const colors = customs.colors;
    const fonts = customs.fonts;

    // Status Bars
    const st = layout.status || DEFAULT_CUSTOMS[mode].status;
    s.setProperty('--status-x', `${st.x || 0}px`);
    s.setProperty('--status-y', `${st.y || 0}px`);
    s.setProperty('--status-scale', st.scale || 100);
    s.setProperty('--status-bar-w', st.barW || 220);
    const barH = st.barH || 10;
    const rowH = Math.max(22, Math.round(barH + 8));
    s.setProperty('--status-bar-h', barH);
    s.setProperty('--status-row-h', rowH);
    s.setProperty('--status-gap', st.gap || 8);
    const rad = st.radius !== undefined ? st.radius : 1;
    s.setProperty('--status-bar-radius', rad >= 20 ? '9999px' : `calc(${rad} * var(--u))`);
    s.setProperty('--font-status', fonts.status || 'Inter');
    s.setProperty('--c-circle', colors.status.circle || '#2b2c31');

    STATS.forEach((stat) => {
        const color = colors.status[stat.colorKey] || '#ffffff';
        if (rows[stat.id]) {
            rows[stat.id].style.setProperty('--c', color);
        }
    });

    // Chips
    const ch = layout.chips || DEFAULT_CUSTOMS[mode].chips;
    s.setProperty('--chips-x', `${ch.x || 0}px`);
    s.setProperty('--chips-y', `${ch.y || 0}px`);
    s.setProperty('--chips-scale', ch.scale || 100);
    s.setProperty('--c-chip-voice-normal', colors.chips.voice || '#d5d9e0');
    s.setProperty('--c-chip-voice-talking', colors.chips.talking || '#f6e08b');
    s.setProperty('--c-chip-voice-radio', colors.chips.radio || '#f3adc4');

    // Vehicle Speedometer
    const veh = (mode === 'inVehicle' ? layout.vehicle : customs.inVehicle.vehicle) || DEFAULT_CUSTOMS.inVehicle.vehicle;
    s.setProperty('--vehicle-x', `${veh.x || 0}px`);
    s.setProperty('--vehicle-y', `${veh.y || 0}px`);
    s.setProperty('--vehicle-scale', veh.scale || 100);
    s.setProperty('--font-vehicle', fonts.vehicle || 'Montserrat');
    s.setProperty('--c-speed-num', colors.vehicle.speed || '#f1f3f7');
    s.setProperty('--c-speed-unit', colors.vehicle.unit || '#cfd3da');

    // GPS Navigation Card
    const vn = (mode === 'inVehicle' ? layout.vnav : customs.inVehicle.vnav) || DEFAULT_CUSTOMS.inVehicle.vnav;
    s.setProperty('--vnav-x', `${vn.x || 0}px`);
    s.setProperty('--vnav-y', `${vn.y || 0}px`);
    s.setProperty('--vnav-scale', vn.scale || 100);
    s.setProperty('--vnav-w', vn.width || 28.4);
    s.setProperty('--font-vnav', fonts.vnav || 'Montserrat');
    s.setProperty('--c-vnav-bg', (colors.vnav && colors.vnav.bg) || '#1b1920');
    s.setProperty('--c-vnav-border', (colors.vnav && colors.vnav.border) || '#2c2a33');
    s.setProperty('--c-vnav-text', (colors.vnav && colors.vnav.text) || '#e8e8ed');
    s.setProperty('--c-vnav-accent', (colors.vnav && colors.vnav.accent) || '#0fe5ca');

    // Logo
    const lg = layout.logo || DEFAULT_CUSTOMS[mode].logo;
    s.setProperty('--logo-x', `${lg.x || 0}px`);
    s.setProperty('--logo-y', `${lg.y || 0}px`);
    s.setProperty('--logo-scale', lg.scale || 100);

    // Compass
    const cp = layout.compass || DEFAULT_CUSTOMS[mode].compass;
    s.setProperty('--compass-x', `${cp.x || 0}px`);
    s.setProperty('--compass-y', `${cp.y || 0}px`);
    s.setProperty('--compass-scale', cp.scale || 100);
    s.setProperty('--compass-w', cp.width || 240);
    s.setProperty('--font-compass', fonts.compass || 'Inter');
    s.setProperty('--c-compass-ruler', colors.compass.ruler || '#f1f3f7');
    s.setProperty('--c-compass-pointer', colors.compass.pointer || '#f3adc4');
    s.setProperty('--c-compass-text', colors.compass.text || '#f1f3f7');

    // Weapon
    const wp = layout.weapon || DEFAULT_CUSTOMS[mode].weapon;
    s.setProperty('--weapon-x', `${wp.x || 0}px`);
    s.setProperty('--weapon-y', `${wp.y || 0}px`);
    s.setProperty('--weapon-scale', wp.scale || 100);
    s.setProperty('--font-weapon', fonts.weapon || 'Pricedown Bl');
    s.setProperty('--c-ammo-clip', colors.weapon.clip || '#f7f7f7');
    s.setProperty('--c-ammo-reserve', colors.weapon.reserve || 'rgba(247, 247, 247, 0.42)');

    // Money
    const mn = layout.money || DEFAULT_CUSTOMS[mode].money;
    s.setProperty('--money-x', `${mn.x || 0}px`);
    s.setProperty('--money-y', `${mn.y || 0}px`);
    s.setProperty('--money-scale', mn.scale || 100);
    s.setProperty('--font-money', fonts.money || 'Pricedown Bl');
    s.setProperty('--c-money-bank', colors.money.bank || '#be88f1');
    s.setProperty('--c-money-cash', colors.money.cash || '#78d876');
    s.setProperty('--c-money-plus', colors.money.plus || '#78d876');
    s.setProperty('--c-money-minus', colors.money.minus || '#ff4d6d');

    renderLogo();
}

function renderLogo() {
    const logoEl = $('#hud-logo');
    if (!logoEl) return;
    const show = !!settings.isShowLogoChecked;
    logoEl.hidden = !show && !isEditMode;
    const logoImg = $('#logo-img');
    if (logoImg) {
        logoImg.classList.toggle('anim-active', !!settings.isLogoAnimChecked);
    }
}

function saveCustoms() {
    try {
        localStorage.setItem('gta6_hud_custom_layout', JSON.stringify(customs));
    } catch (e) { }
    post('saveCustomLayout', customs);
}

// Initial application
applyCustoms();

function applyMapClasses() {
    const mapShown = vehicle.show ? !settings.isHideMapChecked : settings.isOutMapChecked;
    hud.classList.toggle('map-hidden', !mapShown);
}

function syncMenuInputs() {
    document.querySelectorAll('#menu input[data-key]').forEach((input) => {
        input.checked = !!settings[input.dataset.key];
    });
}

function onSetting(key, value) {
    if (!(key in settings)) return;
    settings[key] = value;
    applyMapClasses();
    syncMenuInputs();
    renderLogo();
    if (key.includes('PercentChecked')) {
        syncPercentVisibilities();
    }
    if (key === 'isShowNavChecked' && !isEditMode) {
        renderNav();
    }
}

let hudVisible = false;
let compassShown = false;
let fullHealthInVehicle = false;
let vehicleHealthTimeout = 6000;
let vehicleHealthLow = 50;
let statusTimeout = 6000;
let statusAlways = false;
const statusLast = {};
const statusShownUntil = {};
const statusTimers = {};

function noteStatusChange(id, value) {
    const prev = statusLast[id];
    statusLast[id] = value;
    if (prev === undefined || value === prev) return;
    statusShownUntil[id] = performance.now() + statusTimeout;
    clearTimeout(statusTimers[id]);
    statusTimers[id] = setTimeout(applyNeedsRows, statusTimeout + 50);
}

function statusRecent(id) {
    return performance.now() < (statusShownUntil[id] || 0);
}

function applyNeedsRows() {
    const p = player;
    const hunger = num(p.hunger, 100);
    const thirst = num(p.thirst, 100);
    const stress = num(p.stress);
    setRow('hunger', true, hunger, hunger <= 30);
    setRow('thirst', true, thirst, thirst <= 30);
    setRow('stress', statusAlways || !p.dynamicStress || stress >= 75 || statusRecent('stress'), stress, stress >= 75);
}

let navText = {};
let navUnits = 'imperial';
const NAV = {
    1: { key: 'recalc', icon: 'n-recalc' },
    2: { key: 'proceed', icon: 'n-straight' },
    3: { key: 'left', icon: 'n-left', distance: true },
    4: { key: 'right', icon: 'n-right', distance: true },
    5: { key: 'straight', icon: 'n-straight' },
    6: { key: 'sharpLeft', icon: 'n-sharpleft', distance: true },
    7: { key: 'sharpRight', icon: 'n-sharpright', distance: true },
    8: { key: 'recalc', icon: 'n-recalc' },
    9: { key: 'arrived', icon: 'n-arrived' },
};

function formatDistance(metres) {
    if (navUnits === 'metric') {
        if (metres >= 1000) return `${(metres / 1000).toFixed(1)} ${navText.km || 'km'}`;
        return `${Math.max(10, Math.round(metres / 10) * 10)} ${navText.m || 'm'}`;
    }
    const feet = metres * 3.28084;
    if (feet >= 1000) return `${(metres / 1609.344).toFixed(1)} ${navText.mi || 'mi'}`;
    return `${Math.max(10, Math.round(feet / 10) * 10)} ${navText.ft || 'ft'}`;
}

function renderNav() {
    const navCard = $('#vehicle-nav');
    const nav = $('#nav');
    const step = NAV[num(vehicle.navDir, 0)];
    const shouldShow = !!(vehicle.show && step && settings.isShowNavChecked !== false);
    if (navCard) navCard.hidden = !shouldShow && !isEditMode;
    if (nav) nav.hidden = !shouldShow && !isEditMode;
    if (!step) {
        measureVnav();
        return;
    }
    $('#nav-t1').textContent = navText[step.key] || step.key;
    $('#nav-t2').textContent = step.distance && num(vehicle.navDist) > 0 ? formatDistance(num(vehicle.navDist)) : '';
    $('#nav-icon').setAttribute('href', `#${step.icon}`);
    measureVnav();
}

let lastHealthValue;
let healthShownUntil = 0;
let healthTimer = 0;

function applyHealthRow() {
    const health = num(player.health, 100);
    const dead = !!player.playerDead;
    setRow('health', true, dead ? 100 : health, dead || health <= 25);
}

function renderCompass() {
    $('#compass').hidden = !(hudVisible && compassShown) && !isEditMode;
}

function onHudTick(data) {
    Object.assign(player, data);
    const p = player;
    const show = !!data.show;
    hudVisible = show;
    renderWeapon();
    renderCompass();
    $('#status').hidden = !show && !isEditMode;
    $('#chips').hidden = !show && !isEditMode;
    if (!show && !isEditMode) return;
    if (isEditMode) return;

    const health = num(p.health, 100);
    const armor = num(p.armor);
    const stamina = num(p.oxygen, 100);
    const hunger = num(p.hunger, 100);
    const thirst = num(p.thirst, 100);
    const stress = num(p.stress);

    if (lastHealthValue !== undefined && health < lastHealthValue) {
        healthShownUntil = performance.now() + vehicleHealthTimeout;
        clearTimeout(healthTimer);
        healthTimer = setTimeout(applyHealthRow, vehicleHealthTimeout + 50);
    }
    lastHealthValue = health;
    applyHealthRow();
    setRow('armor', p.dynamicArmor ? armor > 0 : true, armor, false);
    setRow('stamina', p.dynamicOxygen ? stamina < 100 : true, stamina, stamina <= 20);
    rows.stamina.querySelector('use').setAttribute('href', p.underwater ? '#i-o2' : '#i-bolt');
    noteStatusChange('hunger', hunger);
    noteStatusChange('thirst', thirst);
    noteStatusChange('stress', stress);
    applyNeedsRows();
    hit('health', health);
    hit('armor', armor);
    hit('stamina', stamina);
    hit('hunger', hunger);
    hit('thirst', thirst);

    $('#chip-armed').hidden = !p.armed;
    $('#chip-parachute').hidden = num(p.parachute, -1) < 0;
    $('#chip-cruise').hidden = !p.cruise;
    $('#chip-dev').hidden = !p.dev;

    const engine = clamp(num(p.engine));
    const eng = $('#chip-engine');
    eng.classList.toggle('damaged', p.dynamicEngine ? engine < 95 : true);
    eng.classList.toggle('warn', engine <= 75);
    eng.classList.toggle('low', engine <= 45);
    eng.style.setProperty('--off', (62.83 * (1 - engine / 100)).toFixed(2));

    const nos = num(p.nos, -1);
    setRow('nitro', p.dynamicNitro ? nos > 0 : nos >= 0, nos, false);
    rows.nitro.classList.toggle('active', !!p.nitroActive);
    setRow('harness', !!p.harness, num(p.hp) <= 20 ? num(p.hp) * 5 : num(p.hp), false);
}

const voiceChip = $('#chip-voice');

function onVoice(data) {
    voiceChip.style.setProperty('--off', (62.83 * (1 - Math.min(num(data.level), 1))).toFixed(2));
    voiceChip.classList.toggle('talking', !!data.talking);
    voiceChip.classList.toggle('radio', !!data.radioActive);
    $('#voice-icon').setAttribute('href', data.radio ? '#i-headset' : '#i-mic');
}

const speedEl = $('#speed');
let speedTarget = 0;
let speedShown = 0;
let speedRaf = 0;
let speedLast = 0;

function animateSpeed() {
    const now = performance.now();
    const dt = Math.min(now - speedLast, 100);
    speedLast = now;
    speedShown += (speedTarget - speedShown) * (1 - Math.exp(-dt / 220));
    if (Math.abs(speedTarget - speedShown) < 0.05) {
        speedShown = speedTarget;
        speedRaf = 0;
    } else {
        speedRaf = requestAnimationFrame(animateSpeed);
    }
    speedEl.textContent = Math.round(speedShown);
}

function setSpeed(value) {
    speedTarget = value;
    if (!speedRaf) {
        speedLast = performance.now();
        speedRaf = requestAnimationFrame(animateSpeed);
    }
}

const rpmFillEl = $('#rpm-fill');
const gearValEl = $('#gear-val');
const gearBadgeEl = $('#gear-badge');
const rpmWrapEl = $('#rpm-wrap');

let rpmTarget = 0;
let rpmShown = 0;
let rpmRaf = 0;
let rpmLast = 0;

function getProgressiveRpmColor(val) {
    if (val < 0.45) {
        return 'rgb(241, 243, 247)';
    } else if (val < 0.75) {
        const t = (val - 0.45) / 0.30;
        const r = Math.round(241 + (255 - 241) * t);
        const g = Math.round(243 + (175 - 243) * t);
        const b = Math.round(247 + (45 - 247) * t);
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        const t = Math.min(1, (val - 0.75) / 0.20);
        const r = 255;
        const g = Math.round(175 + (26 - 175) * t);
        const b = Math.round(45 + (45 - 45) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }
}

function renderRpm(value) {
    if (!rpmFillEl) return;
    const clamped = Math.max(0, Math.min(1, value));
    rpmFillEl.style.transform = `scaleX(${clamped.toFixed(4)})`;
    rpmFillEl.style.fill = getProgressiveRpmColor(clamped);

    const isHigh = clamped >= 0.75;
    const isRedline = clamped >= 0.92;
    rpmFillEl.classList.toggle('high-rpm', isHigh && !isRedline);
    rpmFillEl.classList.toggle('redline', isRedline);
    if (gearBadgeEl) {
        gearBadgeEl.classList.toggle('gear-redline', isRedline);
    }
}

function animateRpm() {
    const now = performance.now();
    const dt = Math.min(now - rpmLast, 50);
    rpmLast = now;
    rpmShown += (rpmTarget - rpmShown) * (1 - Math.exp(-dt / 32));
    if (Math.abs(rpmTarget - rpmShown) < 0.0005) {
        rpmShown = rpmTarget;
        rpmRaf = 0;
    } else {
        rpmRaf = requestAnimationFrame(animateRpm);
    }
    renderRpm(rpmShown);
}

function setRpm(value) {
    rpmTarget = Math.max(0, Math.min(1, num(value, 0)));
    if (!rpmRaf) {
        rpmLast = performance.now();
        rpmRaf = requestAnimationFrame(animateRpm);
    }
}

function setGear(gear) {
    if (!gearValEl || !gearBadgeEl) return;
    const g = gear !== undefined && gear !== null ? String(gear) : 'N';
    gearValEl.textContent = g;
    gearBadgeEl.className = 'gear-badge';
    if (g === 'R') {
        gearBadgeEl.classList.add('gear-r');
    } else if (g === 'P') {
        gearBadgeEl.classList.add('gear-p');
    } else if (g === 'N') {
        gearBadgeEl.classList.add('gear-n');
    } else if (g === 'D') {
        gearBadgeEl.classList.add('gear-d');
    }
}

function measureVnav() {
    const navEl = $('#vehicle-nav');
    if (navEl && !navEl.hidden) {
        hud.style.setProperty('--vnav-h', `calc(${navEl.offsetHeight}px + var(--map-gap))`);
    } else {
        hud.style.setProperty('--vnav-h', '0px');
    }
}

const vnavObsEl = $('#vehicle-nav');
if (vnavObsEl) {
    new ResizeObserver(() => {
        measureVnav();
    }).observe(vnavObsEl);
}

const vehObsEl = $('#vehicle');
if (vehObsEl) {
    new ResizeObserver(() => {
        hud.style.setProperty('--vehicle-h', `${vehObsEl.offsetHeight}px`);
    }).observe(vehObsEl);
}

let lastCarShow = null;
let lastCarZone = null;
let lastCarFuel = null;
let lastCarAltitude = null;
let lastCarAltShow = null;
let lastCarBelt = null;
let lastCarBeltDisabled = null;

function onCar(data) {
    Object.assign(vehicle, data);
    const show = !!data.show;
    vehicle.show = show;

    if (lastCarShow !== show) {
        lastCarShow = show;
        applyHealthRow();
        $('#vehicle').hidden = !show && !isEditMode;
        renderNav();
        const voiceHome = $('#chips');
        if (!isEditMode && voiceChip.parentElement !== voiceHome) voiceHome.prepend(voiceChip);
        if (!isEditMode) {
            hud.classList.toggle('in-vehicle', show);
            applyMapClasses();
            applyCustoms();
        }
    }

    if (isEditMode) return;

    if (!show) {
        $('#nav').hidden = true;
        const vnavCard = $('#vehicle-nav');
        if (vnavCard) vnavCard.hidden = true;
        measureVnav();
        cancelAnimationFrame(speedRaf);
        speedRaf = 0;
        speedTarget = speedShown = 0;
        speedEl.textContent = '0';
        cancelAnimationFrame(rpmRaf);
        rpmRaf = 0;
        rpmTarget = rpmShown = 0;
        renderRpm(0);
        setGear('N');
        lastCarFuel = null;
        lastCarBelt = null;
        lastCarBeltDisabled = null;
        lastCarZone = null;
        lastCarAltitude = null;
        lastCarAltShow = null;
        return;
    }

    setSpeed(num(vehicle.speed));
    setRpm(vehicle.rpm !== undefined ? vehicle.rpm : 0);
    setGear(vehicle.gear !== undefined ? vehicle.gear : 'N');

    if (rpmWrapEl) {
        rpmWrapEl.hidden = !!vehicle.isBicycle;
    }
    if (vehicle.unit && speedUnit !== vehicle.unit) {
        speedUnit = vehicle.unit;
        $('#speed-unit').textContent = speedUnit;
    }
    if (vehicle.navUnits) {
        navUnits = vehicle.navUnits;
    }

    if (lastCarAltShow !== vehicle.showAltitude || lastCarAltitude !== vehicle.altitude) {
        lastCarAltShow = vehicle.showAltitude;
        lastCarAltitude = vehicle.altitude;
        $('#altitude-row').hidden = !vehicle.showAltitude;
        $('#altitude').textContent = Math.round(num(vehicle.altitude));
    }

    if (lastCarZone !== vehicle.zone) {
        lastCarZone = vehicle.zone;
        const zone = $('#zone');
        if (zone) {
            zone.textContent = vehicle.zone || '';
            zone.hidden = !vehicle.zone;
        }
    }

    renderNav();

    const fuel = clamp(num(vehicle.fuel));
    if (lastCarFuel !== fuel) {
        lastCarFuel = fuel;
        const fuelChip = $('#chip-fuel');
        fuelChip.style.setProperty('--off', (62.83 * (1 - fuel / 100)).toFixed(2));
        fuelChip.classList.toggle('low', fuel <= 20);
    }

    if (lastCarBelt !== vehicle.seatbelt || lastCarBeltDisabled !== vehicle.seatbeltDisabled) {
        lastCarBelt = vehicle.seatbelt;
        lastCarBeltDisabled = vehicle.seatbeltDisabled;
        const belt = $('#chip-belt');
        if (belt) {
            belt.hidden = !vehicle.showSeatbelt;
            const isDisabled = !!vehicle.seatbeltDisabled;
            belt.classList.toggle('disabled', isDisabled);
            belt.classList.toggle('buckled', !isDisabled && !!vehicle.seatbelt);
            belt.classList.toggle('unbuckled', !isDisabled && !vehicle.seatbelt);
            belt.title = isDisabled ? 'Seatbelt: Not Installed' : (vehicle.seatbelt ? 'Seatbelt: Buckled (ON)' : 'Seatbelt: Unbuckled (OFF)');
        }
    }
}

const ruler = $('#ruler');
const NAMES = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
for (let deg = -180; deg <= 540; deg += 45) {
    const name = NAMES[((deg % 360) + 360) % 360];
    const el = document.createElement('span');
    el.className = `lbl${name.length > 1 ? ' minor' : ''}${name === 'N' ? ' n' : ''}`;
    el.textContent = name;
    el.style.left = `calc(${(deg + 180) * DEG_PER_U} * var(--u))`;
    ruler.appendChild(el);
}

let currentHeading = 0;
let targetHeading = 0;
let headingRaf = 0;

function updateHeadingLoop() {
    let diff = (targetHeading - currentHeading + 540) % 360 - 180;
    if (Math.abs(diff) < 0.04) {
        currentHeading = targetHeading;
        headingRaf = 0;
    } else {
        currentHeading += diff * 0.22;
        if (currentHeading >= 360) currentHeading -= 360;
        else if (currentHeading < 0) currentHeading += 360;
        headingRaf = requestAnimationFrame(updateHeadingLoop);
    }
    ruler.style.transform = `translateX(calc(${(120 - (currentHeading + 180) * DEG_PER_U).toFixed(2)} * var(--u)))`;
    $('#degrees').textContent = `${Math.round(currentHeading)}°`;
}

function onHeading(data) {
    if (data.value === undefined) return;
    targetHeading = Number(data.value) || 0;
    if (!headingRaf) {
        headingRaf = requestAnimationFrame(updateHeadingLoop);
    }
}

function onBaseplate(data) {
    compassShown = !!data.show;
    renderCompass();
    if (!data.show && !isEditMode) return;
    if (isEditMode) return;
    $('#strip').hidden = !data.showCompass;
    $('#pointer').hidden = !data.showPointer;
    const streets = !!data.showStreets;
    $('#street1').hidden = !streets;
    $('#street2').hidden = !streets;
    $('#street1').textContent = streets ? data.street1 || '' : '';
    $('#street2').textContent = streets ? data.street2 || '' : '';
    $('#degrees').hidden = !data.showDegrees;
    $('#streets').classList.toggle('blank', !streets && !data.showDegrees);
}

const timers = {};
function flash(id, ms) {
    const el = $(id);
    if (!el) return;
    el.hidden = false;
    clearTimeout(timers[id]);
    timers[id] = setTimeout(() => {
        if (!isEditMode) el.hidden = true;
    }, ms);
}

function hideMoneyDisplay() {
    clearTimeout(timers['#money-lines']);
    clearTimeout(timers['#money-delta']);
    const lines = $('#money-lines');
    const delta = $('#money-delta');
    const bank = $('#money-bank');
    const cash = $('#money-cash');
    if (lines) lines.hidden = true;
    if (delta) delta.hidden = true;
    if (bank) bank.hidden = true;
    if (cash) cash.hidden = true;
}

function setMoney(type, value) {
    $(`#${type}`).textContent = `$${fmt.format(value)}`;
    $(`#money-${type}`).hidden = false;
}

function onShowMoney(data) {
    if (data.type !== 'cash' && data.type !== 'bank') return;
    $(`#money-${data.type === 'cash' ? 'bank' : 'cash'}`).hidden = true;
    setMoney(data.type, num(data.amount));
    flash('#money-lines', 3500);
}

function onUpdateMoney(data) {
    const showType = (data.type === 'bank' || data.type === 'cash') ? data.type : null;
    if (showType === 'cash') {
        setMoney('cash', num(data.cash));
        $('#money-bank').hidden = true;
    } else if (showType === 'bank') {
        setMoney('bank', num(data.bank));
        $('#money-cash').hidden = true;
    } else {
        setMoney('cash', num(data.cash));
        setMoney('bank', num(data.bank));
    }
    const delta = $('#money-delta');
    delta.textContent = `${data.minus ? '-' : '+'}$${fmt.format(num(data.amount))}`;
    delta.className = `delta ${data.minus ? 'minus' : 'plus'}`;
    flash('#money-delta', 3500);
    flash('#money-lines', 3500);
}

const weaponEl = $('#weapon');
const weaponIcon = $('#weapon-icon');
let weaponShown = false;

function renderWeapon() {
    weaponEl.hidden = !(hudVisible && weaponShown) && !isEditMode;
}

let weaponFallbackTried = false;

function setWeaponIcon(name, customPath) {
    if (!name) {
        weaponIcon.hidden = true;
        weaponIcon.removeAttribute('src');
        weaponFallbackTried = false;
        return;
    }
    weaponFallbackTried = false;
    let basePath = customPath || 'nui://ox_inventory/web/images/';
    if (!basePath.endsWith('/')) basePath += '/';
    const src = `${basePath}${name}.png`;
    if (weaponIcon.getAttribute('src') !== src) {
        weaponIcon.src = src;
        weaponIcon.classList.remove('swap');
        void weaponIcon.offsetWidth;
        weaponIcon.classList.add('swap');
    }
    weaponIcon.hidden = false;
}

function onWeapon(data) {
    if (isEditMode) return;
    weaponShown = !!data.show;
    if (weaponShown) {
        const w = data.data || {};
        const hasClip = w.clip !== undefined && w.clip !== null;
        const hasCount = w.count !== undefined && w.count !== null;
        $('#ammo').hidden = !(hasClip || hasCount);
        const clip = $('#ammo-clip');
        clip.textContent = fmt.format(hasClip ? w.clip : (w.count || 0));
        clip.classList.toggle('empty', (hasClip && w.clip === 0) || (hasCount && w.count === 0));

        const hasReserve = w.reserve !== undefined && w.reserve !== null;
        $('#ammo-reserve').hidden = !hasReserve;
        if (hasReserve) {
            $('#ammo-reserve').textContent = fmt.format(w.reserve);
        }
        setWeaponIcon(w.icon, w.iconPath);
    }
    renderWeapon();
}

weaponIcon.addEventListener('error', () => {
    if (!weaponFallbackTried && weaponIcon.src) {
        weaponFallbackTried = true;
        const cur = weaponIcon.src;
        if (cur.includes('WEAPON_')) {
            weaponIcon.src = cur.replace(/WEAPON_[A-Za-z0-9_]+/g, (m) => m.toLowerCase());
            return;
        }
        if (cur.includes('weapon_')) {
            weaponIcon.src = cur.replace(/weapon_[a-z0-9_]+/g, (m) => m.toUpperCase());
            return;
        }
    }
    setWeaponIcon(null);
});

/* ==========================================================================
   MENU CONTROLLER & DRM INDUSTRIAL THEME
   ========================================================================== */
const menu = $('#menu');
const sections = $('#menu-sections');

function buildMenu(text) {
    sections.textContent = '';
    MENU.forEach(([id, options]) => {
        const card = document.createElement('div');
        card.className = 'setting-section-card';
        const h = document.createElement('h3');
        h.innerHTML = `<i class="fa-solid fa-circle-dot"></i> <span>${text.sections[id] || id}</span>`;
        card.appendChild(h);

        options.forEach(([key, callback]) => {
            const opt = document.createElement('label');
            opt.className = 'opt';
            opt.innerHTML = `<span></span><input type="checkbox" data-key="${key}" data-cb="${callback}"><i class="sw"></i>`;
            opt.querySelector('span').textContent = text.options[key] || key;
            card.appendChild(opt);
        });

        sections.appendChild(card);
    });
    syncMenuInputs();
}

function applyMenuText(text) {
    $('#menu-title').textContent = text.title || 'HUD SETTINGS';
    $('#btn-restart').innerHTML = `<i class="fa-solid fa-arrow-rotate-right"></i> ${text.restart || 'Restart HUD'}`;
    $('#btn-reset').innerHTML = `<i class="fa-solid fa-trash-can"></i> ${text.reset || 'Restore Defaults'}`;
    buildMenu(text);
}

sections.addEventListener('change', (e) => {
    const input = e.target;
    if (!input.dataset.key) return;
    settings[input.dataset.key] = input.checked;
    post(input.dataset.cb);
    applyMapClasses();
    renderLogo();
    if (input.dataset.key.includes('PercentChecked')) {
        syncPercentVisibilities();
    }
    if (input.dataset.key === 'isShowVehicleInfoChecked' && !isEditMode) {
        $('#vehicle-info').hidden = (!vehicle.show || !input.checked);
    }
    if (input.dataset.key === 'isShowNavChecked' && !isEditMode) {
        renderNav();
    }
});

function closeMenu() {
    if (isEditMode) {
        exitEditMode(false);
    }
    hideMoneyDisplay();
    if (menu.hidden) return;
    menu.hidden = true;
    post('closeMenu');
}

$('#menu-close').addEventListener('click', closeMenu);
$('#btn-restart').addEventListener('click', () => { closeMenu(); post('restartHud'); });
$('#btn-reset').addEventListener('click', () => { closeMenu(); post('resetStorage'); });

/* Tab Switching */
document.querySelectorAll('.header-nav .nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.header-nav .nav-item').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        const tab = $(`#tab-${btn.dataset.tab}`);
        if (tab) tab.classList.add('active');
    });
});

/* ==========================================================================
   PROFILE MODE SWITCHER (ON-FOOT VS IN-VEHICLE)
   ========================================================================== */
function setHudMode(mode) {
    currentHudMode = mode;

    // Update Profile Pills in Menu
    document.querySelectorAll('.profile-pill-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.profileMode === mode);
    });
    $('#currentProfileNameText').textContent = mode === 'inVehicle' ? 'In Vehicle' : 'On Foot (Out of Vehicle)';

    // Update Edit Mode Pills
    document.querySelectorAll('.btn-mode-pill').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.editMode === mode);
    });

    // Disable or enable vehicle-only components
    const isFoot = mode === 'onFoot';
    document.querySelectorAll('.comp-btn.veh-only').forEach((btn) => {
        btn.classList.toggle('disabled', isFoot);
    });

    if (isFoot && (activeLayoutComp === 'vehicle' || activeLayoutComp === 'vnav')) {
        activeLayoutComp = 'status';
        document.querySelectorAll('#layoutCompTabs .comp-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.comp === 'status');
        });
    }

    if (isEditMode) {
        updateEditModePreview();
    }

    syncLayoutInputs();
    applyCustoms();
}

document.querySelectorAll('.profile-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        setHudMode(btn.dataset.profileMode);
    });
});

document.querySelectorAll('.btn-mode-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
        setHudMode(btn.dataset.editMode);
    });
});

/* ==========================================================================
   LAYOUT & SIZING CONTROLS (TAB 2)
   ========================================================================== */
let activeLayoutComp = 'status';

const COMPONENT_TITLES = {
    status: 'Status Bars (Health, Armor, Needs)',
    chips: 'Action & Voice Chips',
    vehicle: 'Speedometer Cluster',
    vnav: 'GPS Navigation Directions',
    compass: 'Compass & Street Heading',
    weapon: 'Weapon & Ammo Display',
    money: 'Cash & Bank Display',
    logo: 'Server Logo',
};

function formatRadiusLabel(val) {
    if (val === 0) return 'Sharp (0px)';
    if (val >= 20) return 'Full Pill (Cap)';
    return `${val}px`;
}

function updateRadiusPresetButtons(val, scope = 'all') {
    const isSharp = val === 0;
    const isPill = val >= 20;
    const isSoft = val > 0 && val < 20;
    if (scope === 'all' || scope === 'menu') {
        const btnSharp = $('#btn-corner-sharp');
        const btnRounded = $('#btn-corner-rounded');
        const btnPill = $('#btn-corner-pill');
        if (btnSharp) btnSharp.classList.toggle('active', isSharp);
        if (btnRounded) btnRounded.classList.toggle('active', isSoft);
        if (btnPill) btnPill.classList.toggle('active', isPill);
    }
    if (scope === 'all' || scope === 'inspector') {
        const inspSharp = $('#insp-corner-sharp');
        const inspRounded = $('#insp-corner-rounded');
        const inspPill = $('#insp-corner-pill');
        if (inspSharp) inspSharp.classList.toggle('active', isSharp);
        if (inspRounded) inspRounded.classList.toggle('active', isSoft);
        if (inspPill) inspPill.classList.toggle('active', isPill);
    }
}

function syncLayoutInputs() {
    const layout = customs[currentHudMode] || customs.onFoot;
    const comp = layout[activeLayoutComp];
    if (!comp) return;

    $('#layoutActiveCompTitle').textContent = `[${currentHudMode === 'inVehicle' ? 'Vehicle' : 'On-Foot'}] ${COMPONENT_TITLES[activeLayoutComp]} Sizing & Offset`;
    $('#input-scale').value = comp.scale || 100;
    $('#val-scale').textContent = `${comp.scale || 100}%`;
    $('#input-posX').value = comp.x || 0;
    $('#val-posX').textContent = `${comp.x || 0}px`;
    $('#input-posY').value = comp.y || 0;
    $('#val-posY').textContent = `${comp.y || 0}px`;

    const wrapW = $('#wrap-dimWidth');
    const wrapH = $('#wrap-dimHeight');
    const wrapG = $('#wrap-dimGap');
    const wrapR = $('#wrap-dimRadius');

    if (activeLayoutComp === 'status') {
        wrapW.hidden = false;
        wrapH.hidden = false;
        wrapG.hidden = false;
        if (wrapR) {
            wrapR.hidden = false;
            const rVal = comp.radius !== undefined ? comp.radius : 1;
            $('#input-dimRadius').value = rVal;
            $('#val-dimRadius').textContent = formatRadiusLabel(rVal);
            updateRadiusPresetButtons(rVal, 'menu');
        }
        $('#label-dimWidth').innerHTML = '<i class="fa-solid fa-ruler-horizontal"></i> Bar Length / Width';
        $('#input-dimWidth').min = 80;
        $('#input-dimWidth').max = 500;
        $('#input-dimWidth').step = 1;
        $('#input-dimWidth').value = comp.barW || 220;
        $('#val-dimWidth').textContent = `${comp.barW || 220}px`;

        $('#label-dimHeight').innerHTML = '<i class="fa-solid fa-ruler-vertical"></i> Bar Thickness / Height';
        $('#input-dimHeight').min = 4;
        $('#input-dimHeight').max = 40;
        $('#input-dimHeight').step = 1;
        $('#input-dimHeight').value = comp.barH || 10;
        $('#val-dimHeight').textContent = `${comp.barH || 10}px`;

        $('#label-dimGap').innerHTML = '<i class="fa-solid fa-arrows-split-up-and-left"></i> Row Spacing';
        $('#input-dimGap').min = 1;
        $('#input-dimGap').max = 28;
        $('#input-dimGap').step = 1;
        $('#input-dimGap').value = comp.gap || 8;
        $('#val-dimGap').textContent = `${comp.gap || 8}px`;
    } else if (activeLayoutComp === 'compass') {
        wrapW.hidden = false;
        wrapH.hidden = true;
        wrapG.hidden = true;
        if (wrapR) wrapR.hidden = true;
        $('#label-dimWidth').innerHTML = '<i class="fa-solid fa-ruler-horizontal"></i> Ruler Strip Width';
        $('#input-dimWidth').min = 160;
        $('#input-dimWidth').max = 420;
        $('#input-dimWidth').step = 1;
        $('#input-dimWidth').value = comp.width || 240;
        $('#val-dimWidth').textContent = `${comp.width || 240}px`;
    } else if (activeLayoutComp === 'vnav') {
        wrapW.hidden = false;
        wrapH.hidden = true;
        wrapG.hidden = true;
        if (wrapR) wrapR.hidden = true;
        $('#label-dimWidth').innerHTML = '<i class="fa-solid fa-ruler-horizontal"></i> Card Width (vh)';
        $('#input-dimWidth').min = 15;
        $('#input-dimWidth').max = 48;
        $('#input-dimWidth').step = 0.1;
        $('#input-dimWidth').value = comp.width || 28.4;
        $('#val-dimWidth').textContent = `${comp.width || 28.4}vh`;
    } else {
        wrapW.hidden = true;
        wrapH.hidden = true;
        wrapG.hidden = true;
        if (wrapR) wrapR.hidden = true;
    }
    updateSyncUI();
}

document.querySelectorAll('#layoutCompTabs .comp-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('disabled')) return;
        document.querySelectorAll('#layoutCompTabs .comp-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeLayoutComp = btn.dataset.comp;
        syncLayoutInputs();
    });
});

$('#input-scale').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    $('#val-scale').textContent = `${val}%`;
    updateLayoutProperty(activeLayoutComp, 'scale', val);
    applyCustoms();
    saveCustoms();
});

$('#input-posX').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    $('#val-posX').textContent = `${val}px`;
    updateLayoutProperty(activeLayoutComp, 'x', val);
    applyCustoms();
    saveCustoms();
});

$('#input-posY').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    $('#val-posY').textContent = `${val}px`;
    updateLayoutProperty(activeLayoutComp, 'y', val);
    applyCustoms();
    saveCustoms();
});

$('#input-dimWidth').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    $('#val-dimWidth').textContent = (activeLayoutComp === 'vnav') ? `${val}vh` : `${val}px`;
    if (activeLayoutComp === 'status') updateLayoutProperty('status', 'barW', val);
    else if (activeLayoutComp === 'compass') updateLayoutProperty('compass', 'width', val);
    else if (activeLayoutComp === 'vnav' && customs[currentHudMode].vnav) customs[currentHudMode].vnav.width = val;
    applyCustoms();
    saveCustoms();
});

$('#input-dimHeight').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    $('#val-dimHeight').textContent = `${val}px`;
    if (activeLayoutComp === 'status') updateLayoutProperty('status', 'barH', val);
    applyCustoms();
    saveCustoms();
});

$('#input-dimGap').addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    $('#val-dimGap').textContent = `${val}px`;
    if (activeLayoutComp === 'status') updateLayoutProperty('status', 'gap', val);
    applyCustoms();
    saveCustoms();
});

$('#input-dimRadius')?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    $('#val-dimRadius').textContent = formatRadiusLabel(val);
    updateRadiusPresetButtons(val, 'menu');
    if (activeLayoutComp === 'status') updateLayoutProperty('status', 'radius', val);
    applyCustoms();
    saveCustoms();
    if (isEditMode && selectedInspectorComp === 'status') {
        $('#inspInputRadius').value = val;
        $('#inspValRadius').textContent = formatRadiusLabel(val);
        updateRadiusPresetButtons(val, 'inspector');
    }
});

document.querySelectorAll('#wrap-dimRadius .btn-corner-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.radius, 10);
        $('#input-dimRadius').value = val;
        $('#val-dimRadius').textContent = formatRadiusLabel(val);
        updateRadiusPresetButtons(val, 'menu');
        if (activeLayoutComp === 'status') updateLayoutProperty('status', 'radius', val);
        applyCustoms();
        saveCustoms();
        if (isEditMode && selectedInspectorComp === 'status') {
            $('#inspInputRadius').value = val;
            $('#inspValRadius').textContent = formatRadiusLabel(val);
            updateRadiusPresetButtons(val, 'inspector');
        }
    });
});

$('#btn-sync-tab-layout').addEventListener('click', () => {
    toggleElementSync(activeLayoutComp);
});

$('#btn-copy-tab-layout').addEventListener('click', () => {
    copyElementToOtherMode(activeLayoutComp);
});

$('#btn-reset-single-layout').addEventListener('click', () => {
    const d = DEFAULT_CUSTOMS[currentHudMode][activeLayoutComp];
    if (!d) return;
    customs[currentHudMode][activeLayoutComp] = cloneObj(d);
    if (customs.sync && customs.sync[activeLayoutComp]) {
        const otherMode = currentHudMode === 'onFoot' ? 'inVehicle' : 'onFoot';
        if (customs[otherMode] && customs[otherMode][activeLayoutComp]) {
            customs[otherMode][activeLayoutComp] = cloneObj(d);
        }
    }
    syncLayoutInputs();
    applyCustoms();
    saveCustoms();
});

/* ==========================================================================
   COLORS & FONTS CONTROLS (TAB 3)
   ========================================================================== */
let activeColorComp = 'status';

const COMPONENT_COLOR_SCHEMAS = {
    status: [
        { key: 'health', label: 'Health Bar Color' },
        { key: 'armor', label: 'Armor Bar Color' },
        { key: 'stamina', label: 'Stamina / Oxygen Bar' },
        { key: 'hunger', label: 'Hunger Bar Color' },
        { key: 'thirst', label: 'Thirst Bar Color' },
        { key: 'stress', label: 'Stress Bar Color' },
        { key: 'circle', label: 'Icon Background Circle' },
    ],
    chips: [
        { key: 'voice', label: 'Voice Normal Color' },
        { key: 'talking', label: 'Voice Talking Color' },
        { key: 'radio', label: 'Radio Transmit Color' },
        { key: 'circle', label: 'Chip Background' },
    ],
    vehicle: [
        { key: 'speed', label: 'Speed Number Color' },
        { key: 'unit', label: 'Speed Unit Text Color' },
    ],
    vnav: [
        { key: 'bg', label: 'Card Background' },
        { key: 'border', label: 'Border Color' },
        { key: 'text', label: 'Street & Distance Text' },
        { key: 'accent', label: 'Navigation Icon Accent' },
    ],
    compass: [
        { key: 'ruler', label: 'Ruler Ticks & Minor Text' },
        { key: 'pointer', label: 'Pointer Needle Color' },
        { key: 'text', label: 'Street & Degrees Text' },
    ],
    weapon: [
        { key: 'clip', label: 'Ammo Loaded Count' },
        { key: 'reserve', label: 'Reserve Ammo Count' },
    ],
    money: [
        { key: 'cash', label: 'Cash Amount Color' },
        { key: 'bank', label: 'Bank Amount Color' },
        { key: 'plus', label: 'Income (+) Color' },
        { key: 'minus', label: 'Expense (-) Color' },
    ],
};

function renderColorPickers() {
    const container = $('#colorPickersContainer');
    container.innerHTML = '';
    const schema = COMPONENT_COLOR_SCHEMAS[activeColorComp] || [];
    const compColors = customs.colors[activeColorComp] || {};

    $('#colorActiveCompTitle').textContent = `${COMPONENT_TITLES[activeColorComp]} Colors`;
    $('#select-comp-font').value = customs.fonts[activeColorComp] || 'Inter';

    schema.forEach(({ key, label }) => {
        const val = compColors[key] || '#ffffff';
        const item = document.createElement('div');
        item.className = 'color-field';
        item.innerHTML = `
            <span class="color-field-label">${label}</span>
            <div class="color-input-wrap">
                <input type="color" class="drm-color-picker" data-colorkey="${key}" value="${val.startsWith('#') ? val : '#ffffff'}">
                <span class="color-hex-text">${val}</span>
            </div>
        `;

        const picker = item.querySelector('.drm-color-picker');
        const hex = item.querySelector('.color-hex-text');

        picker.addEventListener('input', (e) => {
            const newColor = e.target.value;
            hex.textContent = newColor;
            customs.colors[activeColorComp][key] = newColor;
            applyCustoms();
            saveCustoms();
        });

        container.appendChild(item);
    });
}

document.querySelectorAll('#colorCompTabs .comp-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#colorCompTabs .comp-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeColorComp = btn.dataset.colorComp;
        renderColorPickers();
    });
});

$('#select-comp-font').addEventListener('change', (e) => {
    customs.fonts[activeColorComp] = e.target.value;
    applyCustoms();
    saveCustoms();
});

document.querySelectorAll('.preset-badge-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-badge-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const preset = THEME_PRESETS[btn.dataset.preset];
        if (preset) {
            Object.assign(customs.colors.status, preset);
            if (activeColorComp === 'status') renderColorPickers();
            applyCustoms();
            saveCustoms();
        }
    });
});

$('#btn-reset-single-colors').addEventListener('click', () => {
    const d = DEFAULT_CUSTOMS.colors[activeColorComp];
    if (d) {
        customs.colors[activeColorComp] = cloneObj(d);
        if (DEFAULT_CUSTOMS.fonts[activeColorComp]) {
            customs.fonts[activeColorComp] = DEFAULT_CUSTOMS.fonts[activeColorComp];
        }
        renderColorPickers();
        applyCustoms();
        saveCustoms();
    }
});

/* ==========================================================================
   RESET & RECOVERY CONTROLS (TAB 4)
   ========================================================================== */
$('#btn-reset-all-customs').addEventListener('click', () => {
    customs = cloneObj(DEFAULT_CUSTOMS);
    syncLayoutInputs();
    renderColorPickers();
    applyCustoms();
    saveCustoms();
});

$('#btn-factory-reset').addEventListener('click', () => {
    customs = cloneObj(DEFAULT_CUSTOMS);
    applyCustoms();
    saveCustoms();
    closeMenu();
    post('resetStorage');
});

/* ==========================================================================
   INTERACTIVE ON-SCREEN DRAG MODE (RESPECTING ON-FOOT VS IN-VEHICLE)
   ========================================================================== */
function populateMockData() {
    // Status Bars
    $('#status').hidden = false;
    STATS.forEach((s) => setRow(s.id, true, 80));

    // Weapon & Money
    $('#weapon').hidden = false;
    $('#ammo').hidden = false;
    $('#ammo-clip').textContent = '30';
    $('#ammo-reserve').hidden = false;
    $('#ammo-reserve').textContent = '120';
    if (!weaponIcon.getAttribute('src')) {
        weaponIcon.src = 'nui://ox_inventory/web/images/WEAPON_PISTOL.png';
    }
    weaponIcon.hidden = false;
    $('#money-lines').hidden = false;
    $('#money-bank').hidden = false;
    $('#money-cash').hidden = false;
    $('#bank').textContent = '$150,000';
    $('#cash').textContent = '$14,500';

    // Compass
    $('#compass').hidden = false;
    $('#strip').hidden = false;
    $('#pointer').hidden = false;
    $('#street1').hidden = false;
    $('#street1').textContent = 'Vinewood Blvd';
    $('#street2').hidden = false;
    $('#street2').textContent = 'Alta St';
    $('#degrees').hidden = false;
    $('#degrees').textContent = '180°';
    $('#streets').classList.remove('blank');

    if (currentHudMode === 'onFoot') {
        // Action Chips in On-Foot Mode
        $('#chips').hidden = false;
        const voiceHome = $('#chips');
        if (voiceChip.parentElement !== voiceHome) voiceHome.prepend(voiceChip);
        voiceChip.hidden = false;
        voiceChip.style.setProperty('--off', '20');
        voiceChip.classList.add('talking');
        $('#chip-armed').hidden = false;
        $('#chip-parachute').hidden = false;
        $('#chip-dev').hidden = false;

        // Strictly hide vehicle elements
        $('#vehicle').hidden = true;
        setRpm(0);
        setGear('N');
    } else {
        // In Vehicle Mode: Action chips stay visible with voice chip
        $('#chips').hidden = false;
        const voiceHome = $('#chips');
        if (voiceChip.parentElement !== voiceHome) voiceHome.prepend(voiceChip);
        voiceChip.hidden = false;
        voiceChip.style.setProperty('--off', '20');
        voiceChip.classList.add('talking');

        // Speedometer & Gauges
        $('#vehicle').hidden = false;
        $('#speed').textContent = '85';
        $('#speed-unit').textContent = speedUnit || 'MPH';
        setGear('4');
        setRpm(0.68);
        if (rpmWrapEl) rpmWrapEl.hidden = false;
        $('#altitude-row').hidden = false;
        $('#altitude').textContent = '450';
        $('#chip-cruise').hidden = false;
        setRow('nitro', true, 100, false);
        setRow('harness', true, 100, false);

        // Vehicle Gauges & Nav
        $('#chip-engine').hidden = false;
        $('#chip-engine').classList.add('damaged');
        $('#chip-fuel').hidden = false;
        $('#chip-fuel').style.setProperty('--off', '18');
        $('#chip-belt').hidden = false;
        $('#chip-belt').classList.remove('disabled', 'unbuckled');
        $('#chip-belt').classList.add('buckled');
        $('#vehicle-nav').hidden = false;
        $('#nav').hidden = false;
        $('#nav-t1').textContent = 'Legion Square';
        $('#nav-t2').textContent = '0.3 mi';
        $('#nav-icon').setAttribute('href', '#n-straight');
    }
    renderLogo();
}

function updateEditModePreview() {
    const isFoot = currentHudMode === 'onFoot';
    hud.classList.toggle('edit-onfoot', isFoot);
    hud.classList.toggle('edit-invehicle', !isFoot);

    if (isFoot) {
        // Respect minimap setting outside car
        const outMap = !!settings.isOutMapChecked;
        hud.classList.toggle('map-hidden', !outMap);
        hud.classList.remove('in-vehicle');
        $('#vehicle').hidden = true;
        $('#vehicle-nav').hidden = true;
        $('#compass').hidden = !settings.isOutCompassChecked;
    } else {
        hud.classList.remove('map-hidden');
        hud.classList.add('in-vehicle');
        $('#vehicle').hidden = false;
        $('#vehicle-nav').hidden = false;
        $('#compass').hidden = false;
    }
    populateMockData();
    applyCustoms();
}

/* Floating Inspector Logic */
let selectedInspectorComp = null;
const COMP_NAMES = {
    status: 'Status Bars',
    chips: 'Action Chips',
    vehicle: 'Speedometer',
    vnav: 'GPS Navigation',
    compass: 'Compass',
    weapon: 'Weapon HUD',
    money: 'Money Display',
    logo: 'Server Logo'
};

function selectInspectorElement(id) {
    if (!isEditMode) return;
    const profile = customs[currentHudMode];
    if (!profile || !profile[id]) return;

    selectedInspectorComp = id;
    document.querySelectorAll('.hud-draggable').forEach((el) => {
        el.classList.toggle('selected', el.dataset.hudId === id);
    });

    const insp = $('#hud-element-inspector');
    insp.hidden = false;
    $('#inspectorTitle').textContent = COMP_NAMES[id] || id;

    const comp = profile[id];
    $('#inspInputScale').value = comp.scale || 100;
    $('#inspValScale').textContent = `${comp.scale || 100}%`;

    const rowW = $('#inspRowWidth');
    const rowH = $('#inspRowHeight');
    const rowG = $('#inspRowGap');
    const rowR = $('#inspRowRadius');

    if (id === 'status') {
        rowW.hidden = false;
        rowH.hidden = false;
        rowG.hidden = false;
        if (rowR) {
            rowR.hidden = false;
            const rVal = comp.radius !== undefined ? comp.radius : 1;
            $('#inspInputRadius').value = rVal;
            $('#inspValRadius').textContent = formatRadiusLabel(rVal);
            updateRadiusPresetButtons(rVal, 'inspector');
        }
        $('#inspLabelWidth').innerHTML = '<i class="fa-solid fa-ruler-horizontal"></i> Bar Length';
        $('#inspInputWidth').min = 80;
        $('#inspInputWidth').max = 500;
        $('#inspInputWidth').step = 1;
        $('#inspInputWidth').value = comp.barW || 220;
        $('#inspValWidth').textContent = `${comp.barW || 220}px`;

        $('#inspLabelHeight').innerHTML = '<i class="fa-solid fa-ruler-vertical"></i> Thickness';
        $('#inspInputHeight').min = 4;
        $('#inspInputHeight').max = 40;
        $('#inspInputHeight').step = 1;
        $('#inspInputHeight').value = comp.barH || 10;
        $('#inspValHeight').textContent = `${comp.barH || 10}px`;

        $('#inspLabelGap').innerHTML = '<i class="fa-solid fa-arrows-split-up-and-left"></i> Spacing';
        $('#inspInputGap').min = 1;
        $('#inspInputGap').max = 28;
        $('#inspInputGap').step = 1;
        $('#inspInputGap').value = comp.gap || 8;
        $('#inspValGap').textContent = `${comp.gap || 8}px`;
    } else if (id === 'compass') {
        rowW.hidden = false;
        rowH.hidden = true;
        rowG.hidden = true;
        if (rowR) rowR.hidden = true;
        $('#inspLabelWidth').innerHTML = '<i class="fa-solid fa-ruler-horizontal"></i> Strip Width';
        $('#inspInputWidth').min = 160;
        $('#inspInputWidth').max = 420;
        $('#inspInputWidth').step = 1;
        $('#inspInputWidth').value = comp.width || 240;
        $('#inspValWidth').textContent = `${comp.width || 240}px`;
    } else if (id === 'vnav') {
        rowW.hidden = false;
        rowH.hidden = true;
        rowG.hidden = true;
        if (rowR) rowR.hidden = true;
        $('#inspLabelWidth').innerHTML = '<i class="fa-solid fa-ruler-horizontal"></i> Width (vh)';
        $('#inspInputWidth').min = 15;
        $('#inspInputWidth').max = 48;
        $('#inspInputWidth').step = 0.1;
        $('#inspInputWidth').value = comp.width || 28.4;
        $('#inspValWidth').textContent = `${comp.width || 28.4}vh`;
    } else {
        rowW.hidden = true;
        rowH.hidden = true;
        rowG.hidden = true;
        if (rowR) rowR.hidden = true;
    }

    updateSyncUI();
}

function deselectInspectorElement() {
    selectedInspectorComp = null;
    const insp = $('#hud-element-inspector');
    if (insp) insp.hidden = true;
    document.querySelectorAll('.hud-draggable.selected').forEach((el) => el.classList.remove('selected'));
}

$('#inspInputScale').addEventListener('input', (e) => {
    if (!selectedInspectorComp) return;
    const val = parseInt(e.target.value, 10);
    $('#inspValScale').textContent = `${val}%`;
    updateLayoutProperty(selectedInspectorComp, 'scale', val);
    applyCustoms();
    saveCustoms();
    if (activeLayoutComp === selectedInspectorComp) {
        $('#input-scale').value = val;
        $('#val-scale').textContent = `${val}%`;
    }
});

$('#inspInputWidth').addEventListener('input', (e) => {
    if (!selectedInspectorComp) return;
    const val = parseFloat(e.target.value);
    $('#inspValWidth').textContent = (selectedInspectorComp === 'vnav') ? `${val}vh` : `${val}px`;
    if (selectedInspectorComp === 'status') updateLayoutProperty('status', 'barW', val);
    else if (selectedInspectorComp === 'compass') updateLayoutProperty('compass', 'width', val);
    else if (selectedInspectorComp === 'vnav' && customs[currentHudMode].vnav) customs[currentHudMode].vnav.width = val;
    applyCustoms();
    saveCustoms();
    if (activeLayoutComp === selectedInspectorComp) syncLayoutInputs();
});

$('#inspInputHeight').addEventListener('input', (e) => {
    if (!selectedInspectorComp) return;
    const val = parseInt(e.target.value, 10);
    $('#inspValHeight').textContent = `${val}px`;
    if (selectedInspectorComp === 'status') updateLayoutProperty('status', 'barH', val);
    applyCustoms();
    saveCustoms();
    if (activeLayoutComp === selectedInspectorComp) syncLayoutInputs();
});

$('#inspInputGap').addEventListener('input', (e) => {
    if (!selectedInspectorComp) return;
    const val = parseInt(e.target.value, 10);
    $('#inspValGap').textContent = `${val}px`;
    if (selectedInspectorComp === 'status') updateLayoutProperty('status', 'gap', val);
    applyCustoms();
    saveCustoms();
    if (activeLayoutComp === selectedInspectorComp) syncLayoutInputs();
});

$('#inspInputRadius')?.addEventListener('input', (e) => {
    if (!selectedInspectorComp) return;
    const val = parseInt(e.target.value, 10);
    $('#inspValRadius').textContent = formatRadiusLabel(val);
    updateRadiusPresetButtons(val, 'inspector');
    if (selectedInspectorComp === 'status') updateLayoutProperty('status', 'radius', val);
    applyCustoms();
    saveCustoms();
    if (activeLayoutComp === selectedInspectorComp) {
        $('#input-dimRadius').value = val;
        $('#val-dimRadius').textContent = formatRadiusLabel(val);
        updateRadiusPresetButtons(val, 'menu');
    }
});

document.querySelectorAll('#inspRowRadius .btn-corner-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
        if (!selectedInspectorComp) return;
        const val = parseInt(btn.dataset.radius, 10);
        $('#inspInputRadius').value = val;
        $('#inspValRadius').textContent = formatRadiusLabel(val);
        updateRadiusPresetButtons(val, 'inspector');
        if (selectedInspectorComp === 'status') updateLayoutProperty('status', 'radius', val);
        applyCustoms();
        saveCustoms();
        if (activeLayoutComp === selectedInspectorComp) {
            $('#input-dimRadius').value = val;
            $('#val-dimRadius').textContent = formatRadiusLabel(val);
            updateRadiusPresetButtons(val, 'menu');
        }
    });
});

$('#btnInspSync').addEventListener('click', () => {
    if (!selectedInspectorComp) return;
    toggleElementSync(selectedInspectorComp);
});

$('#btnInspCopy').addEventListener('click', () => {
    if (!selectedInspectorComp) return;
    copyElementToOtherMode(selectedInspectorComp);
});

$('#btnInspectorReset').addEventListener('click', () => {
    if (!selectedInspectorComp) return;
    const d = DEFAULT_CUSTOMS[currentHudMode][selectedInspectorComp];
    if (!d) return;
    customs[currentHudMode][selectedInspectorComp] = cloneObj(d);
    if (customs.sync && customs.sync[selectedInspectorComp]) {
        const otherMode = currentHudMode === 'onFoot' ? 'inVehicle' : 'onFoot';
        if (customs[otherMode] && customs[otherMode][selectedInspectorComp]) {
            customs[otherMode][selectedInspectorComp] = cloneObj(d);
        }
    }
    selectInspectorElement(selectedInspectorComp);
    applyCustoms();
    saveCustoms();
    if (activeLayoutComp === selectedInspectorComp) syncLayoutInputs();
});

$('#btnInspectorClose').addEventListener('click', deselectInspectorElement);

function enterEditMode() {
    isEditMode = true;
    editSnapshot = cloneObj(customs);
    menu.hidden = true;
    $('#hud-edit-bar').hidden = false;
    hud.classList.add('in-edit-mode');

    updateEditModePreview();
    post('setEditMode', { active: true });
}

function exitEditMode(save = true) {
    if (!save && editSnapshot) {
        customs = cloneObj(editSnapshot);
    } else {
        saveCustoms();
    }

    isEditMode = false;
    deselectInspectorElement();
    $('#hud-edit-bar').hidden = true;
    hud.classList.remove('in-edit-mode', 'edit-onfoot', 'edit-invehicle');

    // Immediately apply customs for live game state
    applyCustoms();

    // Restore voiceChip to proper container
    const voiceHome = $('#chips');
    if (voiceChip.parentElement !== voiceHome) voiceHome.prepend(voiceChip);

    // Restore real dynamic HUD visibility
    onHudTick(player);
    onCar(vehicle);
    renderCompass();
    renderWeapon();
    renderLogo();
    hideMoneyDisplay();

    // Close menu and release focus back to game
    menu.hidden = true;
    post('setEditMode', { active: false });
    post('closeMenu');
}

$('#btn-enter-drag-mode').addEventListener('click', enterEditMode);
$('#btn-save-edit-mode').addEventListener('click', () => exitEditMode(true));
$('#btn-cancel-edit-mode').addEventListener('click', () => exitEditMode(false));

// Alt key state tracking
let isAltDown = false;
window.addEventListener('keydown', (e) => {
    if (e.key === 'Alt') {
        isAltDown = true;
        const pill = $('#altSnapPill');
        if (pill) pill.classList.add('active');
    }
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') {
        isAltDown = false;
        const pill = $('#altSnapPill');
        if (pill) pill.classList.remove('active');
    }
});

// Drag Handlers
document.querySelectorAll('.hud-draggable').forEach((el) => {
    el.addEventListener('mousedown', (e) => {
        if (!isEditMode) return;
        e.preventDefault();
        const id = el.dataset.hudId;
        const profile = customs[currentHudMode];
        if (!id || !profile || !profile[id]) return;

        activeDrag = { el, id };
        el.classList.add('dragging');
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        initialX = profile[id].x || 0;
        initialY = profile[id].y || 0;

        selectInspectorElement(id);
    });
});

window.addEventListener('mousemove', (e) => {
    if (!isEditMode || !activeDrag) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    // Snapping is engaged when holding Left Alt
    const snap = e.altKey || isAltDown;

    let targetX = initialX + dx;
    let targetY = initialY + dy;

    if (snap) {
        targetX = Math.round(targetX / 10) * 10;
        targetY = Math.round(targetY / 10) * 10;
    }

    updateLayoutProperty(activeDrag.id, 'x', targetX);
    updateLayoutProperty(activeDrag.id, 'y', targetY);
    applyCustoms();
});

window.addEventListener('mouseup', () => {
    if (activeDrag) {
        activeDrag.el.classList.remove('dragging');
        activeDrag = null;
        if (activeLayoutComp) syncLayoutInputs();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
        if (isEditMode) exitEditMode(true);
        else closeMenu();
    }
});

/* ==========================================================================
   NUI MESSAGE DISPATCHER
   ========================================================================== */
window.addEventListener('message', (e) => {
    const data = e.data || {};
    switch (data.action) {
        case 'hudtick': onHudTick(data); break;
        case 'voice': onVoice(data); break;
        case 'car': onCar(data); break;
        case 'update': onHeading(data); break;
        case 'baseplate': onBaseplate(data); break;
        case 'show': onShowMoney(data); break;
        case 'updatemoney': onUpdateMoney(data); break;
        case 'weapon': onWeapon(data); break;
        case 'setting': onSetting(data.key, data.value); break;
        case 'open':
            // Automatically detect player vehicle status and set appropriate mode
            setHudMode(vehicle.show ? 'inVehicle' : 'onFoot');
            menu.hidden = false;
            syncMenuInputs();
            syncLayoutInputs();
            renderColorPickers();
            break;
        case 'config':
            if (data.unit) {
                speedUnit = data.unit;
                $('#speed-unit').textContent = data.unit;
            }
            fullHealthInVehicle = !!data.fullHealthInVehicle;
            vehicleHealthTimeout = num(data.vehicleHealthTimeout, 6000);
            vehicleHealthLow = num(data.vehicleHealthLow, 50);
            statusTimeout = num(data.statusTimeout, 6000);
            statusAlways = !!data.statusAlways;
            navText = data.nav || {};
            navUnits = data.navUnits === 'metric' ? 'metric' : 'imperial';
            if (data.locale) document.documentElement.lang = data.locale;
            if (data.menu) applyMenuText(data.menu);
            syncPercentVisibilities();
            if (data.customLayout && typeof data.customLayout === 'object') {
                mergeCustoms(data.customLayout);
                applyCustoms();
            }
            break;
    }
});

applyMapClasses();
syncPercentVisibilities();
setHudMode('onFoot');
syncLayoutInputs();
renderColorPickers();

function sendNuiReady() {
    fetch(`https://${RESOURCE}/nuiReady`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    }).catch(() => {
        setTimeout(sendNuiReady, 1000);
    });
}
sendNuiReady();
