/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
  collectCoverageFrom: ['src/engine/**/*.ts', '!src/engine/**/*.spec.ts', '!src/engine/index.ts', '!src/engine/test-helpers.ts'],
  coverageThreshold: { './src/engine/': { lines: 95, branches: 85, functions: 95, statements: 95 } },
};
