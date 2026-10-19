// Shared, non-interactive status overlay. A live budget is not a final result.
export function completionSticker(label='Сделано!') {
 return `<span class="completion-sticker"><span aria-hidden="true">${label==='Не по плану'||label==='Не сделано'?'!':'✓'}</span> ${label}</span>`;
}
