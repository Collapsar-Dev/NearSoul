import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // The Soul Engine must stay pure: no I/O, no framework, no clock.
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@nestjs/*', '@prisma/*', 'fs', 'http', 'https', 'net', 'axios'] }],
      'no-restricted-syntax': ['error',
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'Engine is clock-free: pass time in.' },
        { selector: "MemberExpression[object.name='Date'][property.name='now']", message: 'Engine is clock-free: pass time in.' },
        { selector: "MemberExpression[object.name='Math'][property.name='random']", message: 'Engine is deterministic.' },
      ],
    },
  },
);
