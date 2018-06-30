import {extend} from '../rainbow.js';

/**
 * JSON patterns
 *
 * @author Nijiko Yonskai
 * @author Craig Campbell
 */
extend('json', [
    {
        matches: {
            0: {
                name: 'string',
                matches: {
                    name: 'constant.character.escape',
                    pattern: /\\('|"){1}/g
                }
            }
        },
        pattern: /(\"|\')(\\?.)*?\1/g
    },
    {
        name: 'constant.numeric',
        pattern: /\b(-?(0x)?\d*\.?[\da-f]+|NaN|-?Infinity)\b/gi
    },
    {
        name: 'constant.language',
        pattern: /\b(true|false|null)\b/g
    }
]);
