# CI/CD E2E Test Integration Guide

## Overview

This document describes the integration of Playwright E2E tests into the GitHub Actions CI/CD pipeline for the Remix timetable reservation application.

## CI/CD Pipeline Structure

### Workflow: `.github/workflows/check.yml`

The CI pipeline consists of two main jobs:

1. **lint-and-typecheck**: Type checking and linting
2. **e2e-tests**: End-to-end testing (runs after lint-and-typecheck succeeds)

### Job Flow

```
Pull Request → Lint & TypeCheck → E2E Tests → (Optional) Deployment
```

## E2E Test Configuration

### CI-Specific Configuration

- **Configuration File**: `tests/config/ci.config.ts`
- **Browser Projects**: Chromium and Firefox (optimized for CI)
- **Workers**: Single worker for stability
- **Retries**: 3 retries on failure
- **Timeout**: 60 seconds per test, 15 seconds for assertions

### Environment Variables

The following environment variables are set for CI:

```bash
CI=true
NODE_ENV=test
PLAYWRIGHT_ENVIRONMENT=ci
PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173
```

## Test Execution Strategy

### 1. Application Build and Serving

```yaml
- name: Build application for testing
  run: pnpm run build
  working-directory: ./new
  env:
    NODE_ENV: production
```

The application is built in production mode and served using `pnpm run preview` for realistic testing conditions.

### 2. Browser Installation

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium firefox webkit
  working-directory: ./new
```

Installs Chromium, Firefox, and WebKit browsers with system dependencies.

### 3. Test Execution

Tests are executed using the CI-specific configuration:

```bash
pnpm run test:e2e:ci
```

This runs `playwright test --config=tests/config/ci.config.ts`.

## Reporting and Artifacts

### Test Reports

1. **GitHub Reporter**: Integrates test results into GitHub UI
2. **HTML Report**: Detailed test results with screenshots/videos
3. **JUnit XML**: For CI integration and test result parsing
4. **JSON Report**: Machine-readable test results

### Artifact Collection

#### Always Collected (30-day retention)
- **playwright-report/**: HTML test reports with detailed results

#### On Failure Only (7-day retention)
- **test-results/**: Screenshots, videos, and trace files

### Automated PR Comments

On test failure, the CI automatically comments on the PR with:
- Failure notification
- Links to test artifacts
- Debugging instructions

## Failure Handling

### Retry Strategy

- **Retries**: 3 automatic retries on test failure
- **Trace Collection**: Full trace collected on retry failures
- **Screenshot/Video**: Captured on every failure

### Error Reporting

1. **GitHub Annotations**: Test failures appear as GitHub annotations
2. **PR Comments**: Automated failure notifications
3. **Artifact Upload**: Debug materials always preserved

## Browser Configuration

### Chromium (Primary)
```typescript
launchOptions: {
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox", 
    "--disable-dev-shm-usage",
    "--disable-web-security",
    "--disable-features=TranslateUI",
    "--disable-ipc-flooding-protection",
  ],
}
```

### Firefox (Secondary)
```typescript
firefoxUserPrefs: {
  "intl.accept_languages": "ja-JP,ja,en",
  "intl.locale.requested": "ja-JP",
}
```

## Performance Optimizations

### CI-Specific Optimizations

1. **Single Worker**: Prevents resource contention
2. **Reduced Parallelism**: More stable test execution
3. **Optimized Browser Flags**: Better CI performance
4. **Selective Browser Testing**: Focus on Chromium/Firefox in CI

### Timeout Configuration

- **Global Timeout**: 60 seconds per test
- **Assertion Timeout**: 15 seconds
- **Web Server Timeout**: 5 minutes (for application startup)

## Local Development vs CI

### Local Development
- Uses `playwright.config.ts`
- All browsers (Chromium, Firefox, WebKit)
- Parallel execution
- Dev server with HMR

### CI Environment
- Uses `tests/config/ci.config.ts`
- Chromium + Firefox only
- Sequential execution
- Production build served statically

## Troubleshooting

### Common CI Issues

1. **Timeout Errors**
   - Check web server startup logs
   - Verify application builds successfully
   - Review network connectivity

2. **Browser Launch Failures**
   - Ensure `--with-deps` flag is used during installation
   - Check browser-specific launch options

3. **Test Flakiness**
   - Review retry configuration
   - Check for timing-dependent tests
   - Verify proper wait conditions

### Debugging in CI

1. **Download Artifacts**: Get screenshots, videos, and traces
2. **Review HTML Report**: Detailed test execution information
3. **Check GitHub Annotations**: Inline error information
4. **Local Reproduction**: Use CI environment variables locally

## Commands Reference

### Local Testing with CI Configuration
```bash
cd new
NODE_ENV=test CI=true pnpm run test:e2e:ci
```

### Running Specific Browser in CI Mode
```bash
npx playwright test --config=tests/config/ci.config.ts --project=ci-chromium
```

### Debugging CI Test Failures
```bash
npx playwright test --config=tests/config/ci.config.ts --debug
```

## Integration with Deployment

The E2E tests act as a quality gate before deployment:

1. **PR Checks**: Tests must pass before PR can be merged
2. **Deployment Blocker**: Failed tests prevent deployment
3. **Quality Assurance**: Ensures application functionality before release

## Monitoring and Maintenance

### Test Result Monitoring

- Monitor test execution times
- Track flaky test patterns  
- Review failure rates and common issues

### Maintenance Tasks

- Update browser versions periodically
- Review and optimize test timeouts
- Clean up old test artifacts
- Update CI configuration as needed

## Future Enhancements

### Planned Improvements

1. **Test Parallelization**: Optimize for faster CI execution
2. **Visual Regression Testing**: Add visual comparison tests
3. **Performance Testing**: Integrate performance metrics
4. **Cross-Browser Matrix**: Expand browser coverage
5. **Test Sharding**: Distribute tests across multiple jobs

This integration provides robust E2E testing in CI while maintaining fast feedback cycles and comprehensive error reporting.