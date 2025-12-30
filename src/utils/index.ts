


export function createPageUrl(pageName: string) {
    const [path, query] = pageName.split('?');
    return '/' + path.toLowerCase().replace(/ /g, '-') + (query ? '?' + query : '');
}