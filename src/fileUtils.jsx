import {saveable} from "./options";
const HtmlToReactParser = require('html-to-react').Parser;

export function serialize(state){
    const saveme = Object.fromEntries(Object.entries(state).filter(([key]) => saveable.includes(key)));
    const svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
        '<!-- ' + JSON.stringify(saveme) + ' -->\n' +
        '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">\n' +
        document.querySelector('#lines').outerHTML +
        '\n</svg>'
    return svg
}

export function deserialize(str){
    // Parse the comment and get the data from it
    const match = /<!-- (.+) -->/.exec(str)
    let metadata = JSON.parse(match[1])
    // const htmlInput = str.substring(match.index + match[0].length)

    const htmlToReactParser = new HtmlToReactParser()
    const parsed = htmlToReactParser.parse(str.replace('\n', ''))
    metadata.lines = parsed[parsed.length-1].props.children.filter(i => i !== '\n')[0].props.children
    return metadata
}

// Currently unused
export function getFileName(state){
    return "pattern.svg"
}
