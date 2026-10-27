if HUD.Framework ~= 'qbx' then return end

local PlayerData = exports.qbx_core:GetPlayerData() or {}
local stateKey = ('player:%s'):format(GetPlayerServerId(PlayerId()))

function HUD.IsLoggedIn()
    return LocalPlayer.state.isLoggedIn == true
end

function HUD.IsDead()
    local meta = PlayerData.metadata
    return meta ~= nil and (meta['isdead'] == true or meta['inlaststand'] == true)
end

function HUD.FrameworkNotify(text, ntype, length)
    exports.qbx_core:Notify(text, ntype, length)
end

local function readPlayer()
    local meta = PlayerData.metadata
    if meta then
        HUD.Data.hunger = meta['hunger'] or HUD.Data.hunger
        HUD.Data.thirst = meta['thirst'] or HUD.Data.thirst
        HUD.Data.stress = meta['stress'] or HUD.Data.stress
    end
    if PlayerData.money then
        HUD.Data.cash = PlayerData.money['cash'] or 0
        HUD.Data.bank = PlayerData.money['bank'] or 0
    end
    local state = LocalPlayer.state
    local hasHarness = state.harness and true or false
    if not hasHarness and GetResourceState('qbx_seatbelt') == 'started' and exports.qbx_seatbelt and exports.qbx_seatbelt.HasHarness then
        local pcallOk, val = pcall(function() return exports.qbx_seatbelt:HasHarness() end)
        if pcallOk and val == true then hasHarness = true end
    end
    HUD.Data.harness = hasHarness
    HUD.Data.seatbelt = (state.seatbelt == true) or hasHarness
end

readPlayer()

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    PlayerData = exports.qbx_core:GetPlayerData() or {}
    readPlayer()
    Wait(2000)
    HUD.ApplySettings()
end)

RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
    PlayerData = {}
end)

RegisterNetEvent('QBCore:Player:SetPlayerData', function(val)
    PlayerData = val
    readPlayer()
end)

local statebags = {
    hunger = function(value) HUD.Data.hunger = value end,
    thirst = function(value) HUD.Data.thirst = value end,
    stress = function(value) HUD.Data.stress = value end,
    seatbelt = function(value) HUD.Data.seatbelt = value == true end,
    harness = function(value) HUD.Data.harness = value and true or false end,
}

for key, apply in pairs(statebags) do
    AddStateBagChangeHandler(key, stateKey, function(_, _, value)
        if value ~= nil then apply(value) end
    end)
end

RegisterNetEvent('seatbelt:client:ToggleSeatbelt', function(status)
    if status ~= nil then
        HUD.Data.seatbelt = status == true
    else
        local state = LocalPlayer.state
        local hasHarness = state.harness and true or false
        if not hasHarness and GetResourceState('qbx_seatbelt') == 'started' and exports.qbx_seatbelt and exports.qbx_seatbelt.HasHarness then
            local pcallOk, val = pcall(function() return exports.qbx_seatbelt:HasHarness() end)
            if pcallOk and val == true then hasHarness = true end
        end
        HUD.Data.harness = hasHarness
        HUD.Data.seatbelt = (state.seatbelt == true) or hasHarness
    end
end)

RegisterNetEvent('seatbelt:client:ToggleCruise', function()
    HUD.Data.cruise = not HUD.Data.cruise
end)

local function handleNitrousUpdate(arg1, arg2, arg3)
    local nitroLevel = 0
    local active = false
    local hasNitro = true

    if type(arg1) == 'number' then
        nitroLevel = arg1
        if type(arg2) == 'boolean' and type(arg3) == 'boolean' then
            -- jim-mechanic signature: (level, hasNitro, active)
            hasNitro = arg2
            active = arg3
        elseif type(arg2) == 'boolean' then
            -- qb-hud signature: (nitroLevel, active)
            active = arg2
            hasNitro = nitroLevel > 0
        else
            active = not not arg3
            hasNitro = nitroLevel > 0
        end
    elseif type(arg1) == 'boolean' then
        -- (hasNitro, nitroLevel, active)
        hasNitro = arg1
        nitroLevel = tonumber(arg2) or 0
        active = not not arg3
    else
        hasNitro = false
        nitroLevel = -1
        active = false
    end

    if not hasNitro or nitroLevel < 0 then
        HUD.Data.nos = -1
        HUD.Data.nitroActive = false
    else
        HUD.Data.nos = math.floor(nitroLevel + 0.5)
        HUD.Data.nitroActive = active
    end
end

RegisterNetEvent('hud:client:UpdateNitrous', handleNitrousUpdate)
RegisterNetEvent('nitrous:client:UpdateNitrous', handleNitrousUpdate)

RegisterNetEvent('hud:client:UpdateHarness', function(harnessHp)
    HUD.Data.hp = harnessHp
end)

RegisterNetEvent('qb-admin:client:ToggleDevmode', function()
    HUD.Data.dev = not HUD.Data.dev
end)

RegisterNetEvent('hud:client:ShowAccounts', function(mtype, amount)
    HUD.ShowAccount(mtype, amount)
end)

RegisterNetEvent('hud:client:OnMoneyChange', function(mtype, amount, isMinus)
    local money = PlayerData.money or {}
    HUD.MoneyChange(mtype, amount, isMinus, money['cash'] or HUD.Data.cash, money['bank'] or HUD.Data.bank)
end)
