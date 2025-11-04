# agent-config Tests

This package follows the [Agent Testing Strategy](../../../docs/testing-strategy.md).

## Test Structure

```
packages/agent-config/
├── features/              # BDD feature files (80%)
│   └── api/               # Public API behavior tests
│       ├── get-config.feature
│       ├── update-config.feature
│       └── validate-config.feature
├── src/
│   └── core/
│       └── ConfigManager.test.ts  # Unit tests (20%)
└── tests/
    ├── support/           # Loaded FIRST
    │   ├── hooks.ts       # Before/After hooks
    │   └── world.ts       # Test context
    └── steps/             # Loaded SECOND
        ├── common.steps.ts
        ├── get-config.steps.ts
        ├── update-config.steps.ts
        └── validate-config.steps.ts
```

## Running Tests

```bash
# Watch mode (recommended during development)
pnpm test:watch

# Run all tests
pnpm test

# Run with UI
pnpm test:ui

# Coverage report
pnpm test:coverage

# CI mode (no watch)
pnpm test:ci
```

## Test Coverage

### BDD Tests (API Behavior)

**get-config.feature**: Tests configuration loading and merging

- Load from environment variables
- Multi-source priority merging (ENV < DB < UI)
- Caching and reload behavior
- Get specific config values

**update-config.feature**: Tests configuration updates

- Update without persistence
- Update with persistence
- Update from UI (highest priority)
- Validation on update
- Production vs development mode

**validate-config.feature**: Tests configuration validation

- Valid configuration
- Invalid types and values
- Development vs production mode validation
- Default value application

### Unit Tests (Core Logic)

**ConfigManager.test.ts**: Tests internal implementation

- Priority-based merging algorithm
- Loader sorting by priority
- Schema validation edge cases
- Cache management
- Unavailable loader handling
- Edge cases (empty config, null values, etc.)

## What We Test

### Priority ✅

- Public API methods (`api/`)
- Multi-source config merging
- Priority-based overrides
- Validation logic

### Secondary ✅

- Core merging algorithm
- Edge cases and boundaries
- Cache behavior
- Error handling

### Not Tested ❌

- Type definitions (`types/`)
- Simple exports (`index.ts`)
- Loader/Persister implementations (tested indirectly through BDD)

## Writing New Tests

### Adding BDD Scenarios

1. Identify the user behavior to test
2. Write feature file in `features/api/`
3. Implement step definitions in `tests/steps/`
4. Use existing steps when possible

Example:

```gherkin
Scenario: New behavior to test
  Given some precondition
  When I perform an action
  Then I expect a result
```

### Adding Unit Tests

1. Identify critical logic or edge case
2. Co-locate test with source file
3. Test one thing per test
4. Use descriptive names

Example:

```typescript
it("should handle edge case X correctly", () => {
  const result = functionUnderTest(edgeCaseInput);
  expect(result).toBe(expectedOutput);
});
```

## Test Helpers

### World Context (tests/support/world.ts)

Shared test context available in all steps:

```typescript
interface TestWorld {
  manager?: ConfigManager;
  config?: Config;
  envData: Record<string, string>;
  dbData: Record<string, unknown>;
  uiData: Record<string, unknown>;

  mockEnvFile(data: Record<string, string>): void;
  mockDatabase(data: Record<string, unknown>): void;
  mockUIConfig(data: Record<string, unknown>): void;
  cleanupMocks(): void;
}
```

### Hooks (tests/support/hooks.ts)

Setup and teardown:

- `BeforeAll`: Global setup
- `Before`: Reset state before each scenario
- `After`: Cleanup after each scenario
- `AfterAll`: Global cleanup

## Debugging Tests

### View Test Results

```bash
# UI mode (visual feedback)
pnpm test:ui

# Watch mode (see output immediately)
pnpm test:watch
```

### Debug Specific Test

```bash
# Run specific feature
pnpm vitest run features/api/get-config.feature

# Run specific unit test
pnpm vitest run src/core/ConfigManager.test.ts
```

### Common Issues

**"Step not found"**

- Check step definition matches feature file text exactly
- Verify step file is in `tests/steps/`
- Check for typos in step pattern

**"Validation fails unexpectedly"**

- Check if using correct mode (development vs runtime)
- Verify required fields are present
- Check type conversions (string vs number)

**"Config not loaded"**

- Ensure `Given the config manager is initialized` runs first
- Check if mocks are set up correctly
- Verify cleanup happens between tests

## Coverage Goals

- **Overall**: 70-80%
- **BDD**: 60-70% (focus on happy paths + critical failures)
- **Unit**: 80-90% (thorough edge case coverage)

Run coverage report:

```bash
pnpm test:coverage
```

View HTML report:

```bash
open coverage/index.html
```

## Best Practices

### BDD

- ✅ Write from user perspective
- ✅ Use domain language
- ✅ Keep scenarios independent
- ✅ Reuse step definitions
- ❌ Don't test implementation details
- ❌ Don't couple tests to specific data

### Unit Tests

- ✅ Test one thing per test
- ✅ Use descriptive names
- ✅ Test edge cases
- ✅ Make tests deterministic
- ❌ Don't test private methods directly
- ❌ Don't mock everything

## CI Integration

Tests run automatically on:

- Every push to feature branches
- Pull request creation
- Before deployment

CI command: `pnpm test:ci`
