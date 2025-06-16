#!/bin/bash

# Remix Playwright Test Runner Script
# Usage: ./run-tests.sh [environment] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
PROJECT=""
HEADED=false
DEBUG=false
UI=false
REPORT=false
UPDATE_SNAPSHOTS=false

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Set environment (development|staging|production|ci)"
    echo "  -p, --project PROJECT    Run specific project (chromium|firefox|webkit|remix-dev|remix-prod)"
    echo "  -h, --headed            Run tests in headed mode"
    echo "  -d, --debug             Run tests in debug mode"
    echo "  -u, --ui                Run tests with UI mode"
    echo "  -r, --report            Show HTML report after tests"
    echo "  -s, --update-snapshots  Update visual snapshots"
    echo "  --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e development -p chromium"
    echo "  $0 -e production -h"
    echo "  $0 -d -u"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--project)
            PROJECT="$2"
            shift 2
            ;;
        -h|--headed)
            HEADED=true
            shift
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -u|--ui)
            UI=true
            shift
            ;;
        -r|--report)
            REPORT=true
            shift
            ;;
        -s|--update-snapshots)
            UPDATE_SNAPSHOTS=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_color $RED "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
case $ENVIRONMENT in
    development|staging|production|ci)
        ;;
    *)
        print_color $RED "Invalid environment: $ENVIRONMENT"
        print_color $YELLOW "Valid environments: development, staging, production, ci"
        exit 1
        ;;
esac

print_color $BLUE "🎭 Starting Playwright tests for Remix application"
print_color $BLUE "Environment: $ENVIRONMENT"

# Set environment variables
export NODE_ENV=$ENVIRONMENT
export PLAYWRIGHT_ENVIRONMENT=$ENVIRONMENT

# Load environment-specific variables
if [ -f ".env.test" ]; then
    print_color $YELLOW "Loading test environment variables..."
    export $(cat .env.test | grep -v '^#' | xargs)
fi

# Build command
CMD="npx playwright test"

# Add project if specified
if [ ! -z "$PROJECT" ]; then
    CMD="$CMD --project=$PROJECT"
    print_color $BLUE "Project: $PROJECT"
fi

# Add options based on flags
if [ "$HEADED" = true ]; then
    CMD="$CMD --headed"
    print_color $YELLOW "Running in headed mode"
fi

if [ "$DEBUG" = true ]; then
    CMD="$CMD --debug"
    print_color $YELLOW "Running in debug mode"
fi

if [ "$UI" = true ]; then
    CMD="$CMD --ui"
    print_color $YELLOW "Running with UI mode"
fi

if [ "$UPDATE_SNAPSHOTS" = true ]; then
    CMD="$CMD --update-snapshots"
    print_color $YELLOW "Updating visual snapshots"
fi

# Environment-specific configurations
case $ENVIRONMENT in
    development)
        print_color $GREEN "🔧 Development mode - starting dev server if needed"
        ;;
    staging)
        export PLAYWRIGHT_TEST_BASE_URL=${PLAYWRIGHT_STAGING_BASE_URL:-"https://staging.timetable-hideskick.net"}
        print_color $GREEN "🚀 Staging mode - testing against $PLAYWRIGHT_TEST_BASE_URL"
        ;;
    production)
        export PLAYWRIGHT_TEST_BASE_URL=${PLAYWRIGHT_PROD_BASE_URL:-"https://timetable-hideskick.net"}
        print_color $GREEN "🌍 Production mode - testing against $PLAYWRIGHT_TEST_BASE_URL"
        ;;
    ci)
        CMD="$CMD --reporter=github"
        print_color $GREEN "🤖 CI mode - using GitHub reporter"
        ;;
esac

# Run the tests
print_color $BLUE "Executing: $CMD"
print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if eval $CMD; then
    print_color $GREEN "✅ Tests completed successfully!"
    
    # Show report if requested
    if [ "$REPORT" = true ]; then
        print_color $BLUE "📊 Opening HTML report..."
        npx playwright show-report
    fi
else
    print_color $RED "❌ Tests failed!"
    
    # Always show report on failure for debugging
    print_color $YELLOW "📊 Opening HTML report for debugging..."
    npx playwright show-report
    exit 1
fi

print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_color $GREEN "🎉 Remix Playwright tests completed for $ENVIRONMENT environment"