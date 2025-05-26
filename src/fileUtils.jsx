import {version} from "./globals";
import {preservable, saveable} from "./options";
import {filterObjectByKeys, getSelected} from "./utils";
import { renderToStaticMarkup } from 'react-dom/server';
import Line from "./helper/Line";
import Point from "./helper/Point";
import Dist from "./helper/Dist";
import Poly from "./helper/Poly";

export function serializePattern(state, selectedOnly=false, transform=''){
    const {scalex, scaley, lines} = state

    const left = Math.min(...lines.map(i => (i.a._x, i.b._x)).flat())
    const top  = Math.min(...lines.map(i => (i.a._y, i.b._y)).flat())
    const origin = new Point(left, top)

    let saveme = Object.fromEntries(Object.entries(state).filter(([key]) => saveable.includes(key)));
    saveme.repeating = state.openMenus.repeat
    saveme.bounds = state.bounds.map(i => i.relativeTo(origin))

    const svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
        '<!-- ' + JSON.stringify(saveme) + ' -->\n' +
        `<svg width="100%" height="100%" transform="${transform}" xmlns="http://www.w3.org/2000/svg">\n` +
        `<g id='lines' transform="scale(${scalex} ${scaley})">\n` +
            renderToStaticMarkup((selectedOnly
                ? getSelected(state, 'topLeft')
                : lines.map(i => i.relativeTo(origin))
            ).map(i => i.render(state))) +
        "\n</g>" +
        '\n</svg>'
    return svg
}

// Deserialize parts of the state that can't be done with JSON.parse
function customDeserialize(state){
    console.log(state)
    state.bounds = state?.bounds?.map(i => Point.fromJSON(i)) || []
    state.translation = Dist.fromJSON(state?.translation || {x: 0, y: 0})
    state.filledPolys = state?.filledPolys?.map(i => Poly.fromJSON(i)) || []
    return state
}

// This will overwrite part of the state with the data from the svg, but not the entire state
export function deserializePattern(str){
    // First, check if there's a script element in it. If it is, red flag that it's a hacking attempt
    if (str.includes('/script')){
        window.alert('The uploaded file may be trying to run malicious code. To continue, remove any script tags in the file.')
        return {}
    }

    // Parse the comment and get the data from it
    const match = /<!-- (.+) -->/.exec(str)
    // TODO: This won't auto-enable repeating until "repeating" state is implemented
    let state = JSON.parse(match[1]) || {}
    if (state)
        state = customDeserialize(state)

    const parser = new DOMParser();
    const parsed = parser.parseFromString(str.replace('\n', ''), 'text/html');
    const lines = Array.from(parsed.querySelector('#lines').children)
    state.lines = lines.map(i => Line.fromHTML(i))
    return state
}

// format is one of: 'png', 'jpeg', 'svg', 'blob'
// `func` gets passed the dataUrl or blob (if format == 'blob')
// Coords: width, height: Dist, scaled
// eslint-disable-next-line no-unused-vars
export function image(state, format='png', rect, dots=false, selectedOnly, func, blob=false, margin=10){
    const {left, top, width, height} = rect.asSvg(state)
    // This serializes the state (with the function above), then creates a canvas, draws the serialized svg onto the
    // canvas, creates an image from the canvas
    const svgBlob = new Blob([serializePattern(state, selectedOnly, `translate(${left} ${top})`)], {
        type: 'image/svg+xml;charset=utf-8'
    });

    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);

    const img = new Image();
    img.width = width+margin*2;
    img.height = height+margin*2;
    img.src = url;
    img.onload = function () {
        const canvas = document.getElementById('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = state.paperColor
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, margin, margin);
        DOMURL.revokeObjectURL(url);

        if (!blob)
            func(canvas
                .toDataURL(`image/${format}`)
                .replace(`image/${format}`, 'image/octet-stream')
            )
        else
            canvas.toBlob(func)
    }
}

export function download(name, mime, {str, blob, url}){
    if (str)
        blob = new Blob([str], { type: mime });

    // Create a link (anchor) element
    const link = document.createElement('a');
    // Set the download attribute and href with the Blob
    link.download = name.trim()
    link.href = url || URL.createObjectURL(blob);
    // Append the link to the body and trigger a click event
    document.body.appendChild(link);
    link.click();
    // Remove the link from the body
    document.body.removeChild(link);
}

export function serializeState(state){
    return JSON.stringify({...filterObjectByKeys(state, preservable), lines: state.lines, version: version})
}

// Returns {} if it can't deserialize properly (like if there's a version mismatch)
export function deserializeState(str){
    const parsed = JSON.parse(str)
    if (parsed.version !== version){
        console.log(`Current version == ${version}, but preserved state had ${parsed.version}, abandoning state`);
        return {}
    }

    return {
        ...customDeserialize({...parsed, lines: parsed.lines.map(i => Line.fromJSON(i))}),
        // Because all the lines have their translation reset
        translation: Dist.zero()
    }
}

// TODO
// Currently unused
// eslint-disable-next-line no-unused-vars
export function getFileName(state){
    return "pattern.svg"
}
