// Resolve repository files referenced by source/asset regression tests.
export function projectURL(value) {
 const name=String(value).replace(/^\.\//,'');
 const prefix=name.endsWith('.css')?'styles/':name.endsWith('.mjs')&&name!=='server.mjs'?'src/':'';
 return new URL('../'+prefix+name,import.meta.url);
}
