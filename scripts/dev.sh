#!/bin/bash

# Development script to manage frontend and backend services
# Usage:
#   ./scripts/dev.sh start   - Start both services
#   ./scripts/dev.sh stop    - Stop both services
#   ./scripts/dev.sh restart - Restart both services
#   ./scripts/dev.sh status  - Check service status
#   ./scripts/dev.sh logs    - Show logs from both services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/services/backend-service"
FRONTEND_DIR="$PROJECT_ROOT/apps/frontend-portal"

# PID files
BACKEND_PID_FILE="$PROJECT_ROOT/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/.frontend.pid"

# Log files
BACKEND_LOG="$PROJECT_ROOT/backend.log"
FRONTEND_LOG="$PROJECT_ROOT/frontend.log"

# Helper functions
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if a service is running
is_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Start backend service
start_backend() {
    if is_running "$BACKEND_PID_FILE"; then
        print_warning "Backend is already running (PID: $(cat $BACKEND_PID_FILE))"
        return
    fi

    print_info "Starting backend service..."
    cd "$BACKEND_DIR"

    # Start backend in background and capture PID
    nohup pnpm start > "$BACKEND_LOG" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"

    sleep 2

    if is_running "$BACKEND_PID_FILE"; then
        print_success "Backend started (PID: $(cat $BACKEND_PID_FILE))"
        print_info "Backend logs: $BACKEND_LOG"
    else
        print_error "Failed to start backend"
        cat "$BACKEND_LOG"
        exit 1
    fi
}

# Start frontend service
start_frontend() {
    if is_running "$FRONTEND_PID_FILE"; then
        print_warning "Frontend is already running (PID: $(cat $FRONTEND_PID_FILE))"
        return
    fi

    print_info "Starting frontend service..."
    cd "$FRONTEND_DIR"

    # Start frontend in background and capture PID
    nohup pnpm dev > "$FRONTEND_LOG" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"

    sleep 2

    if is_running "$FRONTEND_PID_FILE"; then
        print_success "Frontend started (PID: $(cat $FRONTEND_PID_FILE))"
        print_info "Frontend logs: $FRONTEND_LOG"
    else
        print_error "Failed to start frontend"
        cat "$FRONTEND_LOG"
        exit 1
    fi
}

# Stop backend service
stop_backend() {
    if ! is_running "$BACKEND_PID_FILE"; then
        print_warning "Backend is not running"
        return
    fi

    print_info "Stopping backend service..."
    local pid=$(cat "$BACKEND_PID_FILE")

    # Try graceful shutdown first
    kill "$pid" 2>/dev/null || true

    # Wait up to 5 seconds for graceful shutdown
    for i in {1..5}; do
        if ! ps -p "$pid" > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        print_warning "Force killing backend..."
        kill -9 "$pid" 2>/dev/null || true
    fi

    rm -f "$BACKEND_PID_FILE"
    print_success "Backend stopped"
}

# Stop frontend service
stop_frontend() {
    if ! is_running "$FRONTEND_PID_FILE"; then
        print_warning "Frontend is not running"
        return
    fi

    print_info "Stopping frontend service..."
    local pid=$(cat "$FRONTEND_PID_FILE")

    # Try graceful shutdown first
    kill "$pid" 2>/dev/null || true

    # Wait up to 5 seconds for graceful shutdown
    for i in {1..5}; do
        if ! ps -p "$pid" > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        print_warning "Force killing frontend..."
        kill -9 "$pid" 2>/dev/null || true
    fi

    rm -f "$FRONTEND_PID_FILE"
    print_success "Frontend stopped"
}

# Show service status
show_status() {
    echo ""
    echo "=== Service Status ==="
    echo ""

    # Backend status
    if is_running "$BACKEND_PID_FILE"; then
        local pid=$(cat "$BACKEND_PID_FILE")
        print_success "Backend: Running (PID: $pid)"
        echo "  URL: http://localhost:3001"
    else
        print_error "Backend: Stopped"
    fi

    echo ""

    # Frontend status
    if is_running "$FRONTEND_PID_FILE"; then
        local pid=$(cat "$FRONTEND_PID_FILE")
        print_success "Frontend: Running (PID: $pid)"
        echo "  URL: http://localhost:3000"
    else
        print_error "Frontend: Stopped"
    fi

    echo ""
}

# Show logs
show_logs() {
    echo ""
    echo "=== Recent Logs ==="
    echo ""

    if [ -f "$BACKEND_LOG" ]; then
        echo -e "${BLUE}Backend (last 10 lines):${NC}"
        tail -n 10 "$BACKEND_LOG"
    else
        print_warning "No backend logs found"
    fi

    echo ""

    if [ -f "$FRONTEND_LOG" ]; then
        echo -e "${BLUE}Frontend (last 10 lines):${NC}"
        tail -n 10 "$FRONTEND_LOG"
    else
        print_warning "No frontend logs found"
    fi

    echo ""
    echo -e "${BLUE}Tip:${NC} Use 'tail -f $BACKEND_LOG' or 'tail -f $FRONTEND_LOG' to follow logs"
}

# Main command handler
case "${1:-}" in
    start)
        print_info "Starting development environment..."
        start_backend
        start_frontend
        echo ""
        show_status
        ;;

    stop)
        print_info "Stopping development environment..."
        stop_backend
        stop_frontend
        echo ""
        show_status
        ;;

    restart)
        print_info "Restarting development environment..."
        stop_backend
        stop_frontend
        sleep 1
        start_backend
        start_frontend
        echo ""
        show_status
        ;;

    status)
        show_status
        ;;

    logs)
        show_logs
        ;;

    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start both frontend and backend services"
        echo "  stop    - Stop both frontend and backend services"
        echo "  restart - Restart both services"
        echo "  status  - Show service status"
        echo "  logs    - Show recent logs from both services"
        echo ""
        exit 1
        ;;
esac
