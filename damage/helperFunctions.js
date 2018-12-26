const a =require('./kcEQDATA.js');
const eqdata = a.EQDATA;
const eqtdata = a.EQTDATA;
const shipdata = require('./kcSHIPDATA.js').shipdata;

// Anti-installation preset
const uninstall = true;

global.datafilter = function(instance) {
    // Nelson Touch should be OK, but can't tell FS mult on Nagato Cutin
    if (instance.ship.spAttackType >= 100) {return false;}
    
    // In case of misalignment
    if (instance.enemy.hp <= 0) {return false;}

    // Ship filter
    if (![176, 177].includes(instance.ship.id)) {return false;}
    // Scratch filter
    if (instance.damageinstance.actualDamage > (instance.enemy.hp*0.06 + (instance.enemy.hp-1)*0.08 || 100)) { 

    
    //Anti-installation equipment filters
    /* if (!instance.ship.equip.some( ele => [126].includes(ele))) { return;}
    if (instance.ship.equip.some( ele => [35,68,193,230,167,166].includes(ele))) { return;} */

    // Equipment type filters
        var TB = 0;
        var DB = 0;
        var F = 0;
        var spb = 0;
        let key = 0;
        var spf =0;
        var aa = 0;
        var keycount = 0;
        
        const equip = instance.ship.equip;
        equip.forEach((ele,idx) => {
            const eq = eqdata[ele];
            if (eq === undefined) {return;}
            if (eq.type === 7) {DB++;}
            if (eq.type === 8) {TB++;}
            if (eq.type === 11) {spb++;}
            if (eq.type === 21) {aa++;}
            if (eq.type === 45) {spf++}
            if (ele === 126) {key = idx; keycount++}
        });        
        /*        
        const index = instance.ship.equip.findIndex(eq => eq===166)
        if (instance.ship.improvements[index] === -1) {return;} */
        // if (DB || spb || spf) {return;}
        // if (keycount != 2) {return;}
        const imprv = instance.ship.improvements[key];
        return true;
    }
    return false;
}

const doUntilValid = (power, instance, realPowers, additive, increment, step, final) => {
    const mods = [];
    for (let i = 0; i < 2; i++) {
        const realPower = realPowers[i];
        let mod = additive ? 0 : 1, fakePower = power;
        while (simulateDamage(instance, fakePower, step, final) < realPower) {
            if (additive) {
                fakePower = power + mod;
            }
            else { fakePower = power * mod; }
            mod += increment;
        }
        mods.push(mod);
    }
    return mods;
};

global.checkMods = function(instance) {
    const res = {
        precapMod: [0,0],
        precapAdd: [0,0],
        postcapMod: [0,0],
        postcapAdd: [0,0],
    }
    const realDamage = instance.damageinstance.actualDamage;
    const realPowers = [];
    // Equipment armour value already included
    const armor = instance.enemy.armor;
    const rAmmoMod = instance.ship.rAmmoMod;
    realPowers.push(realDamage/rAmmoMod + armor * 0.7 + (armor - 1) * 0.6);
    realPowers.push(realDamage/rAmmoMod + armor * 0.7);
   

    const precapPower = simulateDamage(instance, 0, 0, 2);
    res.precapMod = doUntilValid(precapPower, instance, realPowers, false, 0.01, 3, 7);
    res.precapAdd = doUntilValid(precapPower, instance, realPowers, true, 1, 3, 7);

    if (instance.damageinstance.isCritical) {
        const criticalPower = simulateDamage(instance, 0, 0, 5);
        res.criticalMod = doUntilValid(criticalPower, instance, realPowers, false, 0.01, 6, 7)
    }

    const postcapPower = simulateDamage(instance, 0, 0, 7);
    res.postcapMod = doUntilValid(postcapPower,instance, realPowers, false, 0.01, 8, 8);
    res.postcapAdd = doUntilValid(postcapPower,instance, realPowers, true, 1, 8, 8);
    return res;
};

const countEquipmentType = (equipment, types) => {
    types = Array.isArray(types) ? types : [types];
    let counter = 0;
    for (let idx = 0; idx < equipment.length; idx++) {
        const equip = equipment[idx];
        if (types.includes(equip.type)) counter++;
    }
    return counter;
}

const dayCap = 180;
const nightCap = 300;

const engageMods = {
    1: 1,
    2: 0.8,
    3: 1.2,
    4: 0.6,
};

const formMods = {
    1: 1,
    2: 0.8,
    3: 0.7,
    4: 0.6,
    5: 0.6,
    11: 0.8,
    12: 1,
    13: 0.7,
    14: 1.1,
};

const formASW = {
    1: 0.6,
    2: 0.8,
    3: 1.2,
    4: 1,
    5: 1.3,
    11: 1.3,
    12: 1.1,
    13: 1,
    14: 0.7,
};

const daySpecials = {
    0: 1,
    2: 1.2,
    3: 1.1,
    4: 1.2,
    5: 1.3,
    6: 1.5,
    7: 1.25
};

const nightSpecials = {
    0: 1,
    1: 1.2,
    2: 1.3,
    3: 1.5,
    4: 1.75,
    5: 2,
    6: 1.25,
    7: 1.3,
    8: 1.2
};

const cap = (power, cap) => {
    if (power > cap ) {
        power = cap + Math.sqrt(power - cap);
    }
    return Math.floor(power);
}

const simulateDamage = (instance, power, step = 0, final = 7) => {
    /**
     * Steps
     * 0: Get basic power
     * 1: Anti-installation mult/add
     * 2: Precap mult
     * 3: Precap add
     * 4: Cap
     * 5: Critical mult
     * 6: Anti-installation postcap
     * 7: Postcap mult
     * 8: Postcap add
     */
    for (; step <= final; step++) {
        if (step == 0) { power = basicPower(instance); }
        else if (uninstall && step == 1) {
            power = uninstallMod(power, instance, true);
        }
        else if (step == 2) {
            power = precap(power, instance);
        }
        else if (step == 4) {
            power = cap(power, instance.ship.time == 'Day' ? dayCap : nightCap);
        }
        else if (step == 5 && instance.damageinstance.isCritical == true) {
            power = critical(power, instance);
        }
        else if (uninstall && step == 6) {
            power = uninstallMod(Math.floor(power), instance, false)
        }
        else if (step == 7) {
            power = postcap(Math.floor(power), instance);
        }
    }
    return power;
};

const getGearTotalPower = (equips, improvements, time, type, slots) => {
    let pow = 0, db = 0;
    for (let idx = 0; idx < equips.length; idx++) {
        let key;
        const equip = eqdata[equips[idx]] || {};
        const imprv = improvements[idx] > 0 ? improvements[idx] : 0;
        if (type == 'ASW') {
            if (equip.type != 10) {
                pow += 1.5 * equip.ASW || 0;
                key = 'Pasw';
            }
        }
        else if (time == 'Day') {
            key = 'Pshell';
            pow += equip.FP || 0;
            if (type == 'carrier') {
                pow += equip.TP || 0;
                db += equip.DIVEBOMB;
            }
        }
        else {
            key = 'Pnb';
            pow += equip.FP || 0;
            pow += equip.TP || 0;
            if (type == 'carrier') {
                key = '';
                if ([14, 15, 16].includes(equip.btype)) {
                    const slot = slots[idx];
                    pow += Math.sqrt(imprv);
                    let nb2 = 0.3;
                    if ([14, 15].includes(equip.btype)) {
                        nb2 = 0.45;
                        pow += 3 * slot;
                    }
                    pow += nb2 * Math.sqrt(slot) * ((equip.FP || 0) + (equip.TP || 0) + (equip.DB || 0) + (equip.ASW || 0));
                }
            }
        }
        pow += Math.sqrt(imprv) * ((eqtdata[equip.type] || {})[key] || 0);
    }
    return pow + Math.floor(1.3 * db);
};

const basicPower = instance => {
    const time = instance.ship.time,
        enemy = shipdata[instance.enemy.id] || {},
        equips = instance.ship.equip,
        id = instance.ship.id,
        stats = instance.ship.stats,
        slots = instance.ship.slots,
        stype = (shipdata[id] || {}).type,
        improvements = instance.ship.improvements;

    let pow = 0;
    if (time == 'Day') {
        pow += stats.fp;
        if (['CV', 'CVL', 'CVB'].includes(stype) || id === 352) {
            pow += stats.tp;
            pow += getGearTotalPower(equips, improvements, time, 'carrier');
            pow = 55 + Math.floor(1.5 * pow);
        }
        else {
            pow += getGearTotalPower(equips, improvements, time);
            pow += 5;
        }
    }
    else {
        pow += stats.fp;
        if (['CV', 'CVL', 'CVB'].includes(stype) && isValidNightCarrier(id, equips)) {
            pow += getGearTotalPower(equips, improvements, time, 'carrier', slots);
        }
        else if (enemy.SPD == 0) {
            pow += getGearTotalPower(equips, improvements, 'Day');
        }
        else {
            pow += getGearTotalPower(equips, improvements, time);
            pow += stats.tp;
        }
    }
    if (enemy.type == 'SS') {
        pow = 2 * Math.sqrt(stats.as);
        pow += getGearTotalPower(equips, improvements, time, 'ASW');
        let sonar = 0, dc = 0, dcp = 0;
        for (let idx = 0; idx < equips.length; idx++) {
            const equip = equips[idx] || {};
            if (equip.type === 14) sonar++;
            if (equip.btype === 7) dcp++;
            if (equip.btype === 13) dc++;
        }
        if (sonar && dcp) { pow *= 1.15; }
        pow *= (1 + (sonar && dc ? 0.15 : 0) + (dc && dcp ? 0.1 : 0));
    }
    return pow;
}

const uninstallMod = (power, instance, precap = true) => {
    // TBD
    return power;
};

// Precap modifiers: CL fit, engagement, formation, night battle special attacks and health mod
const precap = (power, instance) => {

     const time = instance.ship.time,
        enemy = shipdata[instance.enemy.id] || {},
        formation = instance.ship.formation,
        engagement = instance.engagement,
        damageStatus = instance.ship.damageStatus,
        spAttack = instance.ship.spAttackType,
        spEquips = instance.ship.cutinEquips,
        equips = instance.ship.equip,
        id = instance.ship.id,
        stype = (shipdata[id] || {}).type;

    const isSub = enemy.type == 'SS';
    
    let formMod = (!isSub ? formMods[formation] : formASW[formation]) || 1;
    if (formation == 7) {
        const pos = instance.ship.position;
        // Assume it to be a 6 ship fleet for now
        if (pos < 4) formMod = !isSub ? 0.5 : 1;
        else formMod = !isSub ? 1 : 0.6;
    }
    const engageMod = engageMods[engagement];
    const damageMod = {
        1: 0.4,
        2: 0.7,
        3: 1,
        4: 1,
    }[damageStatus];
    let spAttackMod = 1;
    if (time == 'Night') {
        spAttackMod = nightSpecials[spAttack];
        // sub torps
        if (spAttack == 3 && (stype == 'SS' || stype == 'SSV')) {
            let subtorp = subradar = 0;    
            for (let i = 0; i < equips.length; i ++) {
                const equip = eqdata[equips[i]] || {};
                if (equip.specialcutin) subtorp++;
                if (equip.type == 51) subradar++;
            }
            if (subtorp >= 1 && subradar >= 1) spAttackMod = 1.7;
            else if (subtorp >= 2) spAttackMod = 1.6;
        }
        // CVCI
        if (spAttack == 6) {            
            let nf = nb = b = 0;
            for (let idx in spEquips) {
                const equip = eqdata[spEquips[idx]] || {};
                if (equip.btype == 16) b++;
                if (equip.btype == 14) nf++;
                if (equip.btype == 15) nb++;
            }
            if (spEquips.length == 2) spAttackMod = 1.2;
            else if (nf == 2 && nb == 1) spAttackMod =  1.25;
            else spAttackMod = 1.18;
        }
        // GTR
        if (spAttack == 7) {
            if (equips.includes(267)) spAttackMod = 1.625;
        }
    }
    if(['CL', 'CLT', 'CT'].includes(stype)) {
        // 14cm, 15.2cm
        let singleMountCnt = twinMountCnt = 0;
        for (let g = 0; g < equips.length; g++){
            if ([4, 11].includes(equips[g])) singleMountCnt++;
            if ([65, 119, 139].includes(equips[g])) twinMountCnt++;
        }
        power += Math.sqrt(singleMountCnt) + 2 * Math.sqrt(twinMountCnt);
    }

    return power * formMod * engageMod * damageMod * spAttackMod;
};

const isValidNightCarrier = (id, equips) => {
    if (id === 352) { return false; }
    return (equips.some(ele => [256, 257].includes(ele)) || id === 545) && (equips.some(eq => [14, 15, 16].includes(eqdata[eq] || {}).btype)) 
};

const checkDayCarrierCutin = equips => {
    let tb = 0, db = 0, f = 0;
    if (equips.length == 2) return {db: 1, tb: 1};
    for (let idx = 0; idx < equips.length; idx++) {
        const equip = eqdata[equips[idx]] || {};
        if (equip.type == 6) f++;
        if (equip.type == 7) db++;
        if (equip.type == 8) tb++;
    }
    return {f: f, db: db, tb: tb};
};

const critical = (power, instance) => {
    let profBonus = 1;
    const equips = instance.ship.equipment,
        id = instance.ship.id,
        stype = (shipdata[id] || {}).type,
        prof = instance.ship.proficiency,
        slots = instance.ship.slots,
        time = instance.ship.time,
        spAttack = instance.ship.spAttackType,
        spEquips = instance.ship.cutinEquips;

        if ((['CV', 'CVL', 'CVB'].includes(stype) || id === 352) && (time === 'Day' || (time === 'Night' && isValidNightCarrier(id, equips)))) {
            // CVCI Prof bonus
            if (time === 'Day' && spAttack == 7) {
                profBonus += 0.1;
                const cvci = checkDayCarrierCutin(spEquips);
                const check = (cvci.f === 1 && cvci.db === 1 && cvci.tb === 1) ? [6, 7, 8] : [7, 8];
                const equip = eqdata[equips[0]] || {};
                if (check.includes(equip.type) && slots[0] > 0) profBonus += 0.15; 
            }
            // Regular prof bonus
            else {
                for (let idx = 0; idx < equips.length; idx++) {
                    const equip = eqdata[equips[idx]] || {};
                    if ([7,8,11,41,47,57,58].includes(equip.type)) {
                        const ace = prof[idx];
                        let mod = [0, 4, 7, 9, 11, 13, 16, 20][ace];
                        if (idx > 0) mod /= 2;
                        profBonus += mod/100;
                    }
                }
            }
        }
    return power * 1.5 * profBonus;
}

// Postcap modifiers: Arty spotting, AP shell (pt imp excluded)
const postcap = (power, instance) => {
    const equips = instance.ship.equipment,
        enemy = shipdata[instance.enemy.id] || {},
        time = instance.ship.time,
        spAttack = instance.ship.spAttackType,
        spEquips = instance.ship.cutinEquips;

    let artSpotBonus = apshellModifier = 1;
    
    if (time == 'Day') {
        artSpotBonus = daySpecials[spAttack];
        // CVCI alignment
        if (spAttack == 7) {
            if (spEquips.length == 2) artSpotBonus = 1.15;
            else {
                const cvci = checkDayCarrierCutin(spEquips);
                if (cvci.f === 1 && cvci.db === 1 && cvci.tb === 1) artSpotBonus = 1.25;
                else artSpotBonus = 1.2;
            }
        }
        // AP shell mod
        if (['BB', 'BBV', 'BBVT', 'CV', 'FBB', 'CA'].includes(enemy.type)) {
            const mainGunCnt = countEquipmentType(equips, [1, 2, 3]);
			const apShellCnt = countEquipmentType(equips, 19);
			const secondaryCnt = countEquipmentType(equips, 4);
			const radarCnt = countEquipmentType(equips, [12, 13]);
			if(mainGunCnt >= 1 && secondaryCnt >= 1 && apShellCnt >= 1)
				apshellModifier = 1.15;
			else if(mainGunCnt >= 1 && apShellCnt >= 1 && radarCnt >= 1)
				apshellModifier = 1.1;
			else if(mainGunCnt >= 1 && apShellCnt >= 1)
				apshellModifier = 1.08;
        }
    }
    return power * artSpotBonus * apshellModifier;
};




