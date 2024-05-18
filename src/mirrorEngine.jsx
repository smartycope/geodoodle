import {MIRROR_AXIS, MIRROR_METHOD} from "./globals";
import {calc, toRadians} from "./utils";

export function applyManualRotation(payload, angle, originx, originy){
    let {x, y} = payload
    // For some reason, the math breaks on 180 degrees. No idea why, but this is more efficient anyway
    if (angle === 180)
        return {
            x: x * -1 + originx*2,
            y: y * -1 + originy*2,
        }
    else
        return {
            x: (x * Math.cos(toRadians(angle))) +
                (y * -Math.sin(toRadians(angle))) +
                originx*(1-Math.cos(toRadians(angle))) + originy*Math.sin(toRadians(angle)),
            y: (x * Math.sin(toRadians(angle))) +
                (y * -Math.cos(toRadians(angle))) +
                originy*(1-Math.cos(toRadians(angle))) - originx*Math.sin(toRadians(angle)),
        }
}

export function applyManualFlip(payload, mirrorAxis, originx, originy){
    let {x, y} = payload
    if (mirrorAxis === MIRROR_AXIS.VERT_90 || mirrorAxis === MIRROR_AXIS.BOTH_360)
        x = x * -1 + originx*2
    if (mirrorAxis === MIRROR_AXIS.HORZ_180 || mirrorAxis === MIRROR_AXIS.BOTH_360)
        y = y * -1 + originy*2
    return {x, y}
}

export function applyTransformationRotation(payload, angle, originx, originy){
    return payload + ` rotate(${angle}, ${originx}, ${originy})`
}

export function applyTransformationFlip(payload, mirrorAxis, originx, originy){
    if (mirrorAxis === MIRROR_AXIS.VERT_90 || mirrorAxis === MIRROR_AXIS.BOTH_360)
        payload += `matrix(-1, 0, 0, 1, ${originx*2}, 0)`
    if (mirrorAxis === MIRROR_AXIS.HORZ_180 || mirrorAxis === MIRROR_AXIS.BOTH_360)
        payload += `matrix(1, 0, 0, -1, 0, ${originy*2})`
    return payload
}

// This works in absolute, not scaled coords (it'll probably work in scaled coords too, but not relative coords)
export function getMirrored(mirrorMethod, mirrorAxis, mirrorAxis2, originx, originy, create, rotate, flip){
    var array = [create()]
    const o = [originx, originy]

    // mirrorAxis controls the flip axis
    // mirrorAxis2 controls the rotation angle
    if ([MIRROR_METHOD.FLIP, MIRROR_METHOD.BOTH].includes(mirrorMethod)){
        array.push(flip(create(), mirrorAxis, ...o))
        if (mirrorAxis === MIRROR_AXIS.BOTH_360){
            array.push(flip(create(), MIRROR_AXIS.VERT_90, ...o))
            array.push(flip(create(), MIRROR_AXIS.HORZ_180, ...o))
        }
    }
    if ([MIRROR_METHOD.ROTATE, MIRROR_METHOD.BOTH].includes(mirrorMethod)){
        // Optimization: 180 degree rotation == flipping both vertically & horizontally: that line already exists
        // if (mirrorAxis !== MIRROR_AXIS.BOTH_360 || (mirrorAxis2 !== MIRROR_AXIS.HORZ_180 && mirrorMethod === MIRROR_METHOD.BOTH))
        if (!(mirrorMethod === MIRROR_METHOD.BOTH && mirrorAxis === MIRROR_AXIS.BOTH_360 && mirrorAxis2 === MIRROR_AXIS.HORZ_180))
            array.push(rotate(create(), mirrorAxis2, ...o))
        if (mirrorAxis2 === MIRROR_AXIS.BOTH_360){
            array.push(rotate(create(), MIRROR_AXIS.VERT_90, ...o))
            if (!(mirrorMethod === MIRROR_METHOD.BOTH && mirrorAxis === MIRROR_AXIS.BOTH_360 && mirrorAxis2 === MIRROR_AXIS.BOTH_360))
                array.push(rotate(create(), MIRROR_AXIS.HORZ_180, ...o))
        }
    }
    if (mirrorMethod === MIRROR_METHOD.BOTH){
        if (mirrorAxis === MIRROR_AXIS.BOTH_360 && mirrorAxis2 === MIRROR_AXIS.BOTH_360){
            array.push(rotate(flip(create(), MIRROR_AXIS.HORZ_180, ...o), MIRROR_AXIS.BOTH_360, ...o))
            array.push(rotate(flip(create(), MIRROR_AXIS.HORZ_180, ...o), MIRROR_AXIS.VERT_90, ...o))
        }
        // The extra if here is just because when we add the extra line, it behaves identically to crossed flipping
        else if (mirrorAxis2 !== MIRROR_AXIS.HORZ_180)
            array.push(rotate(flip(create(), mirrorAxis, ...o), mirrorAxis2, ...o))
    }

    return array
}

// Just a convenience function, because I want getMirrored to remain "pure"
export function getStateMirrored(state, create, manual){
    const {mirrorMethod, mirrorAxis, mirrorAxis2} = state
    const {mirrorOriginx, mirrorOriginy} = calc(state)

    return getMirrored(
        mirrorMethod,
        mirrorAxis,
        mirrorAxis2,
        mirrorOriginx,
        mirrorOriginy,
        create,
        manual ? applyManualRotation : applyTransformationRotation,
        manual ? applyManualFlip : applyTransformationFlip,
    )
}
