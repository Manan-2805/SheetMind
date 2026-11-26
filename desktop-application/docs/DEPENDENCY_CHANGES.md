# Desktop dependency changes

## Audit round 1

Removed `handsontable@17.0.1` and `@handsontable/react@16.2.0` because the desktop source had zero imports of either package. The existing Univer editor and AG Grid results grid remain in use.

The lockfile also removed these now-unreachable dependencies.

- `@handsontable/pikaday@1.0.0`
- `@types/trusted-types@2.0.7`
- `bignumber.js@9.3.1`
- `chevrotain@6.5.0`
- `dompurify@3.4.2`
- `hyperformula@3.2.0`
- `moment@2.30.1`
- `numbro@2.5.0`
- `regexp-to-ast@0.4.0`
- `tiny-emitter@2.1.0`
