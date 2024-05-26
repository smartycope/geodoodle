import {preservable, saveable} from "./options";
import {filterObjectByKeys} from "./utils";
import { Parser as HtmlToReactParser } from "html-to-react";
import { toPng, toJpeg, toBlob, toPixelData, toSvg } from 'html-to-image';


export function serialize(state){
    let saveme = Object.fromEntries(Object.entries(state).filter(([key]) => saveable.includes(key)));
    saveme['repeating'] = state.openMenus.repeat
    const svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
        '<!-- ' + JSON.stringify(saveme) + ' -->\n' +
        '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">\n' +
        document.querySelector('#lines').outerHTML +
        '\n</svg>'
    return svg
}

export function deserialize(str){
    // First, check if there's a script element in it. If it is, red flag that it's a hacking attempt
    if (str.includes('script'))
        if (!window.confirm('The uploaded file may be trying to run malitious code. Only continue if you\'re sure it\'s safe. Continue?'))
            return {}
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
export function image_not_working(state, format='png', func, dots=false){
    var toFormat
    switch (format) {
        case 'png':  toFormat = toPng;  break;
        case 'jpeg': toFormat = toJpeg; break;
        case 'svg':  toFormat = toSvg;  break;
        case 'blob':  toFormat = toBlob;  break;
        default: console.error('Invalid format given:', format); break;
    }
    console.log('TODO: add dots option to downloadImage')
    console.log(document.querySelector('#lines'))
    toFormat(document.querySelector('#lines')).then(func).catch(err => window.alert("Error downloading image: " + String(err)))
}

export function image_almost_working(state, format='png', func, dots=false){
    const dataHeader = 'data:image/svg+xml;charset=utf-8'
    const $svg = document.querySelector('#paper')
    // const $holder = document.getElementById('img-container')
    // const $label = document.getElementById('img-format')

    // const destroyChildren = $element => {
    //   while ($element.firstChild) {
    //     const $lastChild = $element.lastChild ?? false
    //     if ($lastChild) $element.removeChild($lastChild)
    //   }
    // }

    const loadImage = async url => {
      const $img = document.createElement('img')
      $img.src = url
      return new Promise((resolve, reject) => {
        $img.onload = () => resolve($img)
        $img.onerror = reject
      })
    }

    const serializeAsXML = $e => (new XMLSerializer()).serializeToString($e)

    const encodeAsUTF8 = s => `${dataHeader},${encodeURIComponent(s)}`
    // const encodeAsB64 = s => `${dataHeader};base64,${btoa(s)}`

    const convertSVGtoImg = async e => {
    //   $label.textContent = format

    //   destroyChildren($holder)

      const svgData = encodeAsUTF8(serializeAsXML($svg))

      const img = await loadImage(svgData)

      const $canvas = document.createElement('canvas')
      $canvas.width = $svg.clientWidth
      $canvas.height = $svg.clientHeight
      $canvas.getContext('2d').drawImage(img, 0, 0, $svg.clientWidth, $svg.clientHeight)

      const dataURL = await $canvas.toDataURL(`image/${format}`, 1.0)
      console.log(dataURL)

      func(dataURL)

    //   const $img = document.createElement('img')
    //   $img.src = dataURL
    //   $holder.appendChild($img)
    }
    convertSVGtoImg()
}

export function image(state, format='png', width, height, dots=false, func, blob=false){
    // function triggerDownload(imgURI) {
    //     const a = document.createElement('a');
    //     a.download = 'MY_COOL_IMAGE.png'; // filename
    //     a.target = '_blank';
    //     a.href = imgURI;

    //     // trigger download button
    //     // (set `bubbles` to false here.
    //     // or just `a.click()` if you don't care about bubbling)
    //     a.dispatchEvent(new MouseEvent('click', {
    //       view: window,
    //       bubbles: false,
    //       cancelable: true
    //     }));
    //   }

    //   const btn = document.querySelector('button');
    //   btn.addEventListener('click', function () {
        // const svgNode = document.querySelector('#paper');
        // const svgString = (new XMLSerializer()).serializeToString(svgNode);
        // const svgBlob = new Blob([svgString], {
        const svgBlob = new Blob([serialize(state)], {
        type: 'image/svg+xml;charset=utf-8'
        });

        const DOMURL = window.URL || window.webkitURL || window;
        const url = DOMURL.createObjectURL(svgBlob);

        const image = new Image();
        image.width = width;
        image.height = height;
        image.src = url;
        image.onload = function () {
        const canvas = document.getElementById('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = state.paperColor
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(image, 0, 0);
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
    return JSON.stringify({...filterObjectByKeys(state, preservable), lines: state.lines.map(i => i.props)})
}

export function deserializeState(str){
    const parsed = JSON.parse(str)
    return {...parsed, lines: parsed.lines.map((i, cnt) => <line key={`loaded-line-${cnt}`} {...i}/>)}
}

// Currently unused
export function getFileName(state){
    return "pattern.svg"
}
