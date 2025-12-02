#!/bin/bash

# Helper script to view PostgreSQL database
# Usage: ./view-db.sh [command]
# Commands: tables, transactions, recent, count, categories

source .env

DB_HOST=${PGHOST:-localhost}
DB_USER=${PGUSER:-postgres}
DB_NAME=${PGDATABASE:-finance_agent}
DB_PORT=${PGPORT:-5432}

# If password is set, use it
if [ -n "$PGPASSWORD" ]; then
    export PGPASSWORD
    PSQL_CMD="psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT"
else
    PSQL_CMD="psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT"
fi

case "$1" in
    tables)
        echo "📊 Listing all tables:"
        $PSQL_CMD -c "\dt"
        ;;
    transactions)
        echo "💰 Viewing all transactions:"
        $PSQL_CMD -c "SELECT * FROM transactions ORDER BY created_at DESC;"
        ;;
    recent)
        echo "📅 Recent 10 transactions:"
        $PSQL_CMD -c "SELECT id, description, amount, category, source, date, created_at FROM transactions ORDER BY created_at DESC LIMIT 10;"
        ;;
    count)
        echo "🔢 Transaction count:"
        $PSQL_CMD -c "SELECT COUNT(*) as total_transactions FROM transactions;"
        ;;
    categories)
        echo "📊 Transactions by category:"
        $PSQL_CMD -c "SELECT category, COUNT(*) as count, SUM(amount) as total FROM transactions GROUP BY category ORDER BY total DESC;"
        ;;
    structure)
        echo "🏗️  Transactions table structure:"
        $PSQL_CMD -c "\d transactions"
        ;;
    *)
        echo "Usage: ./view-db.sh [command]"
        echo ""
        echo "Commands:"
        echo "  tables      - List all tables"
        echo "  transactions - View all transactions"
        echo "  recent      - View recent 10 transactions"
        echo "  count       - Count total transactions"
        echo "  categories  - Group by category with totals"
        echo "  structure   - Show table structure"
        echo ""
        echo "Or connect interactively:"
        echo "  psql -h $DB_HOST -U $DB_USER -d $DB_NAME"
        ;;
esac

