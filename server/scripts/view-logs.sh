#!/bin/bash

# 日志查看辅助脚本
# 用于本地开发时快速查看和分析日志

LOG_DIR="../logs"
ENV=${NODE_ENV:-development}

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo -e "${GREEN}日志查看工具${NC}"
    echo ""
    echo "用法: ./view-logs.sh [选项]"
    echo ""
    echo "选项:"
    echo "  -t, --tail [n]     实时查看最后n行日志 (默认50)"
    echo "  -e, --error        只显示错误日志"
    echo "  -w, --warn         只显示警告和错误日志"
    echo "  -s, --search <关键词>  搜索包含关键词的日志"
    echo "  -d, --date <日期>  查看指定日期的日志 (格式: YYYY-MM-DD)"
    echo "  -c, --clean        清理旧日志文件"
    echo "  -l, --list         列出所有日志文件"
    echo "  -h, --help         显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./view-logs.sh -t 100          # 实时查看最后100行"
    echo "  ./view-logs.sh -e              # 只看错误"
    echo "  ./view-logs.sh -s \"user login\"  # 搜索登录相关日志"
    echo "  ./view-logs.sh -d 2025-12-16   # 查看指定日期日志"
}

# 获取最新日志文件
get_latest_log() {
    ls -t "$LOG_DIR"/app-$ENV-*.log 2>/dev/null | head -1
}

# 列出所有日志文件
list_logs() {
    echo -e "${BLUE}可用的日志文件:${NC}"
    ls -lh "$LOG_DIR"/app-*.log 2>/dev/null || echo "没有找到日志文件"
}

# 实时查看日志
tail_logs() {
    local lines=${1:-50}
    local logfile=$(get_latest_log)
    
    if [ -z "$logfile" ]; then
        echo -e "${RED}未找到日志文件${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}实时查看日志: $logfile${NC}"
    tail -f -n "$lines" "$logfile"
}

# 查看错误日志
view_errors() {
    local logfile=$(get_latest_log)
    
    if [ -z "$logfile" ]; then
        echo -e "${RED}未找到日志文件${NC}"
        exit 1
    fi
    
    echo -e "${RED}错误日志:${NC}"
    grep -i '"level":"error"' "$logfile" || echo "没有错误日志"
}

# 查看警告和错误
view_warnings() {
    local logfile=$(get_latest_log)
    
    if [ -z "$logfile" ]; then
        echo -e "${RED}未找到日志文件${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}警告和错误日志:${NC}"
    grep -iE '"level":"(warn|error)"' "$logfile" || echo "没有警告或错误日志"
}

# 搜索日志
search_logs() {
    local keyword="$1"
    local logfile=$(get_latest_log)
    
    if [ -z "$logfile" ]; then
        echo -e "${RED}未找到日志文件${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}搜索关键词: $keyword${NC}"
    grep -i "$keyword" "$logfile" || echo "未找到匹配的日志"
}

# 查看指定日期的日志
view_date() {
    local date="$1"
    local logfile="$LOG_DIR/app-$ENV-$date.log"
    
    if [ ! -f "$logfile" ]; then
        echo -e "${RED}未找到日期 $date 的日志文件${NC}"
        list_logs
        exit 1
    fi
    
    echo -e "${GREEN}查看日志: $logfile${NC}"
    less "$logfile"
}

# 清理旧日志
clean_logs() {
    echo -e "${YELLOW}清理7天前的日志文件...${NC}"
    find "$LOG_DIR" -name "app-*.log" -mtime +7 -delete
    echo -e "${GREEN}清理完成${NC}"
    list_logs
}

# 主逻辑
case "$1" in
    -t|--tail)
        tail_logs "$2"
        ;;
    -e|--error)
        view_errors
        ;;
    -w|--warn)
        view_warnings
        ;;
    -s|--search)
        if [ -z "$2" ]; then
            echo -e "${RED}请提供搜索关键词${NC}"
            exit 1
        fi
        search_logs "$2"
        ;;
    -d|--date)
        if [ -z "$2" ]; then
            echo -e "${RED}请提供日期 (格式: YYYY-MM-DD)${NC}"
            exit 1
        fi
        view_date "$2"
        ;;
    -c|--clean)
        clean_logs
        ;;
    -l|--list)
        list_logs
        ;;
    -h|--help|*)
        show_help
        ;;
esac
