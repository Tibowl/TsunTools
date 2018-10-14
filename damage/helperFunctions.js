const dayCap = {
    Shelling: 180,
    ASW: 150,
};

const nightCap = {
    Shelling: 300,
    ASW: 150,
};

const deepFind = function(obj, path) {
    var paths = path.split('.')
      , current = obj
      , i;
  
    for (i = 0; i < paths.length; ++i) {
      if (current[paths[i]] == undefined) {
        return undefined;
      } else {
        current = current[paths[i]];
      }
    }
    return current;
};


// Helper Functions

global.isValidInstance = function(instance) {
    for (let key in gimmick){
        if (typeof gimmick[key] == 'object' && gimmick[key]["id"].length){
            let arr = (deepFind(instance, gimmick[key]["path"]));
            arr = arr instanceof Array ? arr : [arr];
            const action = gimmick[key]["action"];
            const idList = gimmick[key]["id"];
            let flag = true;
            if (action == "include") flag = idList.some( element => arr.includes(element));
            else if (action == "exclude") flag = !idList.some( element => arr.includes(element));
            else if (action == "includeAll") flag = idList.every( element => arr.includes(element));
            if (!flag) return false;
        }
    }
    if (instance.debuffed !== gimmick.debuffed) return false;
    const ehp = instance.enemy.hp || shipdata[instance.enemy.id]["HP"];
    if (instance.damageinstance.actualDamage < (instance.damageinstance.expectedDamage[1] + 20) // Remove this part for greater spread for confidence
    || instance.damageinstance.actualDamage < (ehp * 0.06 +  (ehp - 1) * 0.08) || instance.damageinstance.actualDamage == 0) return false;
    return true;
};

global.analyzeInstancePostcap = function(instance) {
    const postcapPower = instance.ship.postcapPower;
    const lowPower = instance.damageinstance.actualDamage / instance.ship.rAmmoMod + 0.7 * instance.enemy.armor;
    const highPower = lowPower + 0.6 * (instance.enemy.armor - 1);
    const lowMod = lowPower/postcapPower || 1;
    const highMod = highPower/postcapPower || 999;
    damage['all'].min = (damage['all'].min || 0) > lowMod ? (damage['all'].min || 0) : lowMod;
    damage['all'].max = (damage['all'].max || 999) < highMod ? (damage['all'].max || 999) : highMod;
    damage[instance.ship.id] = damage[instance.ship.id] || {};
    damage[instance.ship.id].min = (damage[instance.ship.id].min || 0) > lowMod ? (damage[instance.ship.id].min || 0) : lowMod;
    damage[instance.ship.id].max = (damage[instance.ship.id].max || 999) < highMod ? (damage[instance.ship.id].max || 999) : highMod;
}

global.formatNum = function(num){
    return Math.floor(num*100)/100;
}
