Config = {}
Config.OpenMenu = 'I'
Config.StressChance = 0.1 -- Backward compatibility fallback
Config.WeaponStress = true -- Toggle weapon shooting stress on/off
Config.WeaponStressChance = 0.1 -- Chance (0.0 - 1.0) to gain stress when shooting
Config.WeaponStressAmount = { min = 0.5, max = 1 } -- Stress amount range given per shot
Config.EnableStressBlackout = false -- Toggle screen blackout fade when reaching 100 stress

Config.MeasurementSystem = 'imperial' -- 'metric' | 'imperial'

Config.MinimumStress = 50
Config.MinimumSpeedUnbuckled = 70
Config.MinimumSpeed = 170
Config.DisableStress = false
Config.ShowCompass = true
Config.ShowFullHealthInVehicle = true
Config.VehicleHealthTimeout = 6000
Config.VehicleHealthLow = 50
Config.StatusTimeout = 6000
Config.ShowStatusAlways = false

Config.ShowNativeCash = false -- Set to false to hide default GTA5 cash & bank UI (top right)
Config.ShowMoney = true       -- Set to false to disable drm_hud money display

Config.ShowZone = true
Config.ShowNavigation = true

Config.Locale = 'en'

Config.WhitelistedWeaponArmed = {
    [`weapon_petrolcan`] = true,
    [`weapon_hazardcan`] = true,
    [`weapon_fireextinguisher`] = true,
    [`weapon_dagger`] = true,
    [`weapon_bat`] = true,
    [`weapon_bottle`] = true,
    [`weapon_crowbar`] = true,
    [`weapon_flashlight`] = true,
    [`weapon_golfclub`] = true,
    [`weapon_hammer`] = true,
    [`weapon_hatchet`] = true,
    [`weapon_knuckle`] = true,
    [`weapon_knife`] = true,
    [`weapon_machete`] = true,
    [`weapon_switchblade`] = true,
    [`weapon_nightstick`] = true,
    [`weapon_wrench`] = true,
    [`weapon_battleaxe`] = true,
    [`weapon_poolcue`] = true,
    [`weapon_briefcase`] = true,
    [`weapon_briefcase_02`] = true,
    [`weapon_garbagebag`] = true,
    [`weapon_handcuffs`] = true,
    [`weapon_bread`] = true,
    [`weapon_stone_hatchet`] = true,
    [`weapon_grenade`] = true,
    [`weapon_bzgas`] = true,
    [`weapon_molotov`] = true,
    [`weapon_stickybomb`] = true,
    [`weapon_proxmine`] = true,
    [`weapon_snowball`] = true,
    [`weapon_pipebomb`] = true,
    [`weapon_ball`] = true,
    [`weapon_smokegrenade`] = true,
    [`weapon_flare`] = true
}

Config.WhitelistedWeaponStress = {
    [`weapon_petrolcan`] = true,
    [`weapon_hazardcan`] = true,
    [`weapon_fireextinguisher`] = true
}

Config.VehClassStress = {
    ['0'] = true,
    ['1'] = true,
    ['2'] = true,
    ['3'] = true,
    ['4'] = true,
    ['5'] = true,
    ['6'] = true,
    ['7'] = true,
    ['8'] = true,
    ['9'] = true,
    ['10'] = true,
    ['11'] = true,
    ['12'] = true,
    ['13'] = false,
    ['14'] = false,
    ['15'] = false,
    ['16'] = false,
    ['18'] = false,
    ['19'] = false,
    ['20'] = false,
    ['21'] = false
}

Config.WhitelistedVehicles = {
}

Config.WhitelistedJobs = {
    ['leo'] = false,
    ['ambulance'] = false
}

Config.Intensity = {
    ['blur'] = {
        [1] = {
            min = 50,
            max = 60,
            intensity = 1500,
        },
        [2] = {
            min = 60,
            max = 70,
            intensity = 2000,
        },
        [3] = {
            min = 70,
            max = 80,
            intensity = 2500,
        },
        [4] = {
            min = 80,
            max = 90,
            intensity = 2700,
        },
        [5] = {
            min = 90,
            max = 100,
            intensity = 3000,
        },
    }
}

Config.EffectInterval = {
    [1] = {
        min = 50,
        max = 60,
        timeout = math.random(50000, 60000)
    },
    [2] = {
        min = 60,
        max = 70,
        timeout = math.random(40000, 50000)
    },
    [3] = {
        min = 70,
        max = 80,
        timeout = math.random(30000, 40000)
    },
    [4] = {
        min = 80,
        max = 90,
        timeout = math.random(20000, 30000)
    },
    [5] = {
        min = 90,
        max = 100,
        timeout = math.random(15000, 20000)
    }
}

Config.Menu = {
    isOutMapChecked = false,
    isOutCompassChecked = false,
    isCompassFollowChecked = true,
    isOpenMenuSoundsChecked = true,
    isResetSoundsChecked = true,
    isListSoundsChecked = true,
    isLowFuelChecked = true,
    isCinematicNotifChecked = true,
    isDynamicHealthChecked = false,
    isDynamicArmorChecked = true,
    isDynamicHungerChecked = false,
    isDynamicThirstChecked = false,
    isDynamicStressChecked = true,
    isDynamicOxygenChecked = true,
    isChangeFPSChecked = true,
    isShowNavChecked = true,
    isHideMapChecked = false,
    isDynamicEngineChecked = true,
    isDynamicNitroChecked = true,
    isShowLogoChecked = true,
    isLogoAnimChecked = true,
    isChangeCompassFPSChecked = true,
    isCompassShowChecked = true,
    isShowStreetsChecked = true,
    isPointerShowChecked = true,
    isDegreesShowChecked = true,
    isCinematicModeChecked = false,
    isShowHealthPercentChecked = true,
    isShowArmorPercentChecked = true,
    isShowOxygenPercentChecked = true,
    isShowHungerPercentChecked = true,
    isShowThirstPercentChecked = true,
    isShowStressPercentChecked = true,
    isShowNitroPercentChecked = true,
    isShowHarnessPercentChecked = true,
}

Config.CustomWeaponHud = true

Config.WeaponHudHidden = {
    `weapon_unarmed`,
}

-- Weapon image base URL / path for weapon HUD icons.
-- Options:
--   'auto' (automatically detects ox_inventory or qb-inventory)
--   'nui://ox_inventory/web/images/'
--   'nui://qb-inventory/html/images/'
--   Or any custom resource path (must end with '/')
Config.WeaponIconPath = 'auto'
