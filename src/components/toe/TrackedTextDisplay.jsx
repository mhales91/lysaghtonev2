import React from 'react';

// This is a simplified diffing utility based on Longest Common Subsequence algorithm.
// It's not as powerful as a full library but works well for highlighting changes in sentences.
function generateDiffSegments(original, modified) {
    if (original === modified) return [{ type: 'unchanged', text: original }];
    if (!original) return [{ type: 'added', text: modified }];
    if (!modified) return [{ type: 'removed', text: original }];

    const oldWords = original.split(/(\s+)/); // Split by space but keep spaces
    const newWords = modified.split(/(\s+)/);
    
    // Create a matrix for DP
    const dp = Array(oldWords.length + 1).fill(null).map(() => Array(newWords.length + 1).fill(0));

    // Fill DP matrix
    for (let i = oldWords.length - 1; i >= 0; i--) {
        for (let j = newWords.length - 1; j >= 0; j--) {
            if (oldWords[i] === newWords[j]) {
                dp[i][j] = 1 + dp[i + 1][j + 1];
            } else {
                dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
    }

    // Backtrack to build the diff
    const segments = [];
    let i = 0, j = 0;
    while (i < oldWords.length && j < newWords.length) {
        if (oldWords[i] === newWords[j]) {
            segments.push({ type: 'unchanged', text: oldWords[i] });
            i++;
            j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            segments.push({ type: 'removed', text: oldWords[i] });
            i++;
        } else {
            segments.push({ type: 'added', text: newWords[j] });
            j++;
        }
    }

    // Add any remaining words
    while (i < oldWords.length) {
        segments.push({ type: 'removed', text: oldWords[i] });
        i++;
    }
    while (j < newWords.length) {
        segments.push({ type: 'added', text: newWords[j] });
        j++;
    }

    // Coalesce adjacent segments of the same type for cleaner rendering
    if (segments.length === 0) return [];
    const coalesced = [segments[0]];
    for (let k = 1; k < segments.length; k++) {
        if (segments[k].type === coalesced[coalesced.length - 1].type) {
            coalesced[coalesced.length - 1].text += segments[k].text;
        } else {
            coalesced.push(segments[k]);
        }
    }
    
    return coalesced;
}

export default function TrackedTextDisplay({ originalText, modifiedText, className = "" }) {
    const segments = generateDiffSegments(originalText || '', modifiedText || '');

    return (
        <div className={className}>
            {segments.map((segment, index) => {
                switch (segment.type) {
                    case 'added':
                        return (
                            <span key={index} style={{ backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '4px' }}>
                                {segment.text}
                            </span>
                        );
                    case 'removed':
                        return (
                            <span key={index} style={{ backgroundColor: '#fee2e2', color: '#b91c1c', textDecoration: 'line-through', borderRadius: '4px' }}>
                                {segment.text}
                            </span>
                        );
                    default:
                        return <span key={index}>{segment.text}</span>;
                }
            })}
        </div>
    );
}