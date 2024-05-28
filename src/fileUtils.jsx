import {version} from "./globals";
import {preservable, saveable} from "./options";
import {filterObjectByKeys, getSelected} from "./utils";
import { Parser as HtmlToReactParser } from "html-to-react";
import { renderToStaticMarkup } from 'react-dom/server';


export function serialize(state, selectedOnly=false, transform=''){
    const {scalex, scaley, lines} = state

    const _lines = lines.filter(i => i !== undefined && i.props.x1 && i.props.x2 && i.props.y1 && i.props.y2)

    const left   = Math.min(..._lines.map(i => i.props.x1), ..._lines.map(i => i.props.x2))
    const top    = Math.min(..._lines.map(i => i.props.y1), ..._lines.map(i => i.props.y2))

    const rescaleFunc = i => <line
        // Remove the translation (so it's absolutely positioned with respect to the cursor)
        {...i.props}
        x1={i.props.x1 - left}
        x2={i.props.x2 - left}
        y1={i.props.y1 - top}
        y2={i.props.y2 - top}
    />

    let saveme = Object.fromEntries(Object.entries(state).filter(([key]) => saveable.includes(key)));
    saveme['repeating'] = state.openMenus.repeat

    const svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
        '<!-- ' + JSON.stringify(saveme) + ' -->\n' +
        `<svg width="100%" height="100%" transform="${transform}" xmlns="http://www.w3.org/2000/svg">\n` +
        `<g id='lines' transform="scale(${scalex} ${scaley})">\n` +
            renderToStaticMarkup(selectedOnly
                ? getSelected(state)
                : _lines.map(rescaleFunc)
            ) +
        "\n</g>" +
        '\n</svg>'
    return svg
}

export function deserialize(str){
    console.error('here');
    // First, check if there's a script element in it. If it is, red flag that it's a hacking attempt
    if (str.includes('/script')){
        window.alert('The uploaded file may be trying to run malitious code. To continue, remove any script tags in the file.')
        return {}
    }

    // Parse the comment and get the data from it
    const match = /<!-- (.+) -->/.exec(str)
    // TODO: This won't auto-enable repeating until "repeating" state is implemented
    let state = JSON.parse(match[1])

    const htmlToReactParser = new HtmlToReactParser()
    const parsed = htmlToReactParser.parse(str.replace('\n', ''))
    state.lines = parsed[parsed.length-1].props.children.filter(i => i !== '\n')[0].props.children
    return state
}

// format is one of: 'png', 'jpeg', 'svg', 'blob'
// `func` gets passed the dataUrl or blob (if format == 'blob')
// Coords: width, height: scalar, scaled
// Coords: x, y: relative?, scaled
// eslint-disable-next-line no-unused-vars
export function image(state, format='png', width, height, x, y, dots=false, selectedOnly, func, blob=false, margin=10){
    // This serializes the state (with the function above), then creates a canvas, draws the serialized svg onto the
    // canvas, creates an image from the canvas
    const svgBlob = new Blob([serialize(state, selectedOnly, `translate(${x} ${y})`)], {
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
    return JSON.stringify({...filterObjectByKeys(state, preservable), lines: state.lines.map(i => i.props), version: version})
}

// Returns {} if it can't deserialize properly (like if there's a version mismatch)
export function deserializeState(str){
    const parsed = JSON.parse(str)
    if (parsed.version !== version){
        console.log(`Current version == ${version}, but preserved state had ${parsed.version}, abandoning state`);
        return {}
    }
    return {...parsed, lines: parsed.lines.map((i, cnt) => <line key={`loaded-line-${cnt}`} {...i}/>)}
}

// Currently unused
// eslint-disable-next-line no-unused-vars
export function getFileName(state){
    return "pattern.svg"
}
