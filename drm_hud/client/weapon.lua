if not Config.CustomWeaponHud then return end

local hidden = {}
for _, hash in ipairs(Config.WeaponHudHidden or {}) do
    hidden[hash] = true
end

local iconOnlyGroups = {
    [`GROUP_MELEE`] = true,
    [`GROUP_UNARMED`] = true,
    [`GROUP_PARACHUTE`] = true,
    [`GROUP_STUNGUN`] = true,
    [`GROUP_PETROLCAN`] = true,
}

local currentWeapon = nil
local last = nil

HUD.Reset[#HUD.Reset + 1] = function()
    last = nil
    currentWeapon = nil
end

RegisterNetEvent('ox_inventory:currentWeapon', function(data)
    currentWeapon = data
    last = nil
end)

local function getOxWeapon()
    if not currentWeapon and GetResourceState('ox_inventory') == 'started' then
        currentWeapon = exports.ox_inventory:getCurrentWeapon()
    end
    return currentWeapon
end

local function getWeaponIconPath()
    if Config.WeaponIconPath and Config.WeaponIconPath ~= 'auto' then
        return Config.WeaponIconPath
    end
    if GetResourceState('ox_inventory') == 'started' then
        return 'nui://ox_inventory/web/images/'
    elseif GetResourceState('qb-inventory') == 'started' then
        return 'nui://qb-inventory/html/images/'
    elseif GetResourceState('ps-inventory') == 'started' then
        return 'nui://ps-inventory/html/images/'
    elseif GetResourceState('lj-inventory') == 'started' then
        return 'nui://lj-inventory/html/images/'
    end
    return 'nui://ox_inventory/web/images/'
end

local weaponNames = {}
local defaultWeapons = {
    'gadget_parachute', 'weapon_advancedrifle', 'weapon_appistol', 'weapon_assaultrifle',
    'weapon_assaultrifle_mk2', 'weapon_assaultshotgun', 'weapon_assaultsmg', 'weapon_autoshotgun',
    'weapon_ball', 'weapon_bat', 'weapon_battleaxe', 'weapon_bottle', 'weapon_bullpuprifle',
    'weapon_bullpuprifle_mk2', 'weapon_bullpupshotgun', 'weapon_bzgas', 'weapon_carbinerifle',
    'weapon_carbinerifle_mk2', 'weapon_ceramicpistol', 'weapon_combatmg', 'weapon_combatmg_mk2',
    'weapon_combatpdw', 'weapon_combatpistol', 'weapon_combatshotgun', 'weapon_compactlauncher',
    'weapon_compactrifle', 'weapon_crowbar', 'weapon_dagger', 'weapon_dbshotgun',
    'weapon_doubleaction', 'weapon_fireextinguisher', 'weapon_firework', 'weapon_flare',
    'weapon_flaregun', 'weapon_flashlight', 'weapon_gadgetpistol', 'weapon_golfclub',
    'weapon_grenade', 'weapon_grenadelauncher', 'weapon_grenadelauncher_smoke', 'weapon_gusenberg',
    'weapon_hammer', 'weapon_hatchet', 'weapon_hazardcan', 'weapon_heavypistol', 'weapon_heavyrifle',
    'weapon_heavyshotgun', 'weapon_heavysniper', 'weapon_heavysniper_mk2', 'weapon_hominglauncher',
    'weapon_knife', 'weapon_knuckle', 'weapon_machete', 'weapon_machinepistol', 'weapon_marksmanpistol',
    'weapon_marksmanrifle', 'weapon_marksmanrifle_mk2', 'weapon_mg', 'weapon_microsmg',
    'weapon_militaryrifle', 'weapon_minigun', 'weapon_minismg', 'weapon_molotov', 'weapon_musket',
    'weapon_navyrevolver', 'weapon_nightstick', 'weapon_petrolcan', 'weapon_pipebomb',
    'weapon_pistol', 'weapon_pistol50', 'weapon_pistol_mk2', 'weapon_poolcue', 'weapon_precisionrifle',
    'weapon_proxmine', 'weapon_pumpshotgun', 'weapon_pumpshotgun_mk2', 'weapon_railgun',
    'weapon_raycarbine', 'weapon_rayminigun', 'weapon_raypistol', 'weapon_revolver',
    'weapon_revolver_mk2', 'weapon_rpg', 'weapon_sawnoffshotgun', 'weapon_smg', 'weapon_smg_mk2',
    'weapon_smokegrenade', 'weapon_sniperrifle', 'weapon_snowball', 'weapon_snspistol',
    'weapon_snspistol_mk2', 'weapon_specialcarbine', 'weapon_specialcarbine_mk2', 'weapon_stickybomb',
    'weapon_stone_hatchet', 'weapon_stungun', 'weapon_switchblade', 'weapon_tacticalrifle',
    'weapon_unarmed', 'weapon_vintagepistol', 'weapon_wrench'
}
for _, name in ipairs(defaultWeapons) do
    weaponNames[joaat(name)] = name
end

local function getWeaponName(hash)
    if weaponNames[hash] then return weaponNames[hash] end
    if QBCore and QBCore.Shared and QBCore.Shared.Weapons and QBCore.Shared.Weapons[hash] then
        return QBCore.Shared.Weapons[hash].name
    end
    return tostring(hash)
end

local function readWeapon(ped)
    local selectedWeapon = GetSelectedPedWeapon(ped)
    if selectedWeapon == `WEAPON_UNARMED` or hidden[selectedWeapon] then
        return nil
    end

    local isOx = GetResourceState('ox_inventory') == 'started'
    local iconPath = getWeaponIconPath()

    if isOx then
        local curWeapon = getOxWeapon()
        if curWeapon and curWeapon.name then
            local weaponHash = curWeapon.hash or selectedWeapon
            local info = { icon = curWeapon.name, iconPath = iconPath }
            local group = curWeapon.group or GetWeapontypeGroup(weaponHash)

            if curWeapon.melee or iconOnlyGroups[group] then
                return info
            end

            if curWeapon.throwable or group == `GROUP_THROWN` then
                info.count = exports.ox_inventory:Search('count', curWeapon.name) or 1
                return info
            end

            local _, clip = GetAmmoInClip(ped, weaponHash)
            if clip == 0 and type(curWeapon.ammo) == 'number' and curWeapon.ammo > 0 then
                clip = curWeapon.ammo
            end
            info.clip = clip
            -- In ox_inventory, the ammo on the side of main always stays 0, so hide reserve
            return info
        end
    end

    if selectedWeapon == `GADGET_PARACHUTE` then
        return { icon = 'parachute', iconPath = iconPath }
    end

    local group = GetWeapontypeGroup(selectedWeapon)
    local wName = getWeaponName(selectedWeapon)
    local info = { icon = wName, iconPath = iconPath }
    if iconOnlyGroups[group] then return info end

    local total = GetAmmoInPedWeapon(ped, selectedWeapon)
    local _, clip = GetAmmoInClip(ped, selectedWeapon)
    if group == `GROUP_THROWN` or GetMaxAmmoInClip(ped, selectedWeapon, true) <= 0 then
        info.count = total
    else
        info.clip = clip
        info.reserve = math.max(total - clip, 0)
    end
    return info
end

CreateThread(function()
    while true do
        local info = readWeapon(PlayerPedId())
        local key = info and ('%s|%s|%s|%s|%s'):format(info.icon or '', info.iconPath or '', info.count or '', info.clip or '', info.reserve or '') or ''
        if key ~= last then
            last = key
            SendNUIMessage({ action = 'weapon', show = info ~= nil, data = info })
        end
        Wait(info and 100 or 250)
    end
end)

CreateThread(function()
    while true do
        DisplayAmmoThisFrame(false)
        HideHudComponentThisFrame(2)
        HideHudComponentThisFrame(20)
        HideHudComponentThisFrame(22)
        Wait(0)
    end
end)