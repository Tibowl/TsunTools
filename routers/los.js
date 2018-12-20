exports.nodesToIgnore = [];
exports.nodeColors = {};

let Cn = 0;

exports.getType = (entry, edgeNames) => {
    let edge = edgeNames[1];
    let s = getStypeCount(entry).all;
    // let h = getHistoricalCount(entry).all;
    let sc = getSpecialCombines(s);
    
    let los;
    type = /*getDifficulty(entry) +*/ pad(Math.floor(los = getLoS(entry, Cn)))
    if(los < 0) type = "neg los"
    if(s.CL >= 2) return ">= 2 CL"
    if(edge == "F") console.log(entry)
    //if(edge == "L") console.log(entry)
    // 1-6
    //if(s.CVL + s.BBV + s.CA + s.CAV >= 3) return ">= 3 CVL/BBV/CA(V)"
    //if(s.DD+s.DE < 3) return "< 3 DD+DE"

    // 3-5
    //if(sc.aBB + sc.aCV >= 2 && s.LHA) return "LHA WatFace"
    //if(sc.aBB + sc.aCV >= 4) return ">=4 CV+BB"

    // 5-4, 5-5
    // if(sc.aBB + sc.aCV >= 5) return ">= 5 BB+CV"

    // 6-1
    //if(sc.aSS <= 2) return "<= 2 SS"
    //if(sc.aBB+ sc.aCV+sc.aCA >= 2) return ">=2 BB+CV+CA"
    //if(s.AS) type = "T" + type;

    return type;
}

exports.args = (args) => {
    // 1-5 D 1

    if (args.length < 3) {
        console.log("los requires 3 args <map> <node> <Cn>")
        return;
    }

    exports.map = args[0];
    exports.node = args[1];
    Cn = parseFloat(args[2]);
}