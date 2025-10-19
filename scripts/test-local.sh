#!/bin/bash

# Local testing script for the portfolio site
# This script merges arXiv papers with existing RSS feed data and starts a local web server

set -e

echo "🔄 Preparing test feed with arXiv papers..."

# Restore production feed from git (has real LessWrong and Newsletter data)
if git rev-parse --verify HEAD:data/feed.json >/dev/null 2>&1; then
    echo "📥 Restoring production feed from git..."
    git show HEAD:data/feed.json > data/feed.json.prod

    # Merge arXiv papers into the production feed
    node -e "
    const fs = require('fs');
    const prodFeed = JSON.parse(fs.readFileSync('data/feed.json.prod', 'utf8'));

    // Load arXiv papers if available
    let arxivItems = [];
    if (fs.existsSync('data/arxiv-papers.json')) {
        const arxivData = JSON.parse(fs.readFileSync('data/arxiv-papers.json', 'utf8'));
        arxivItems = (arxivData.papers || []).map(p => ({
            ...p,
            category: 'arXiv',
            source: 'arXiv',
            isoDate: p.pubDate
        }));
        console.log(\`   Added \${arxivItems.length} arXiv paper(s)\`);
    }

    // Add arXiv to sources if we have papers
    if (arxivItems.length > 0) {
        prodFeed.meta.sources.push({
            name: 'arXiv',
            category: 'arXiv',
            title: 'arXiv Papers'
        });
    }

    // Merge items and sort by date
    const allItems = [...prodFeed.items, ...arxivItems];
    allItems.sort((a, b) => new Date(b.isoDate || b.pubDate) - new Date(a.isoDate || a.pubDate));

    // Update feed
    prodFeed.items = allItems.slice(0, 10);
    prodFeed.meta.totalItems = prodFeed.items.length;
    prodFeed.meta.lastUpdated = new Date().toISOString();

    fs.writeFileSync('data/feed.json', JSON.stringify(prodFeed, null, 2));
    console.log(\`   Total items in test feed: \${prodFeed.items.length}\`);
    "

    rm data/feed.json.prod
else
    echo "⚠️  No production feed found, running update script..."
    node scripts/update-feed.js
fi

echo ""
echo "🌐 Starting local web server..."
echo "📍 Open http://localhost:8000 in your browser"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Start server in background and open browser
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000 &
    SERVER_PID=$!
elif command -v python &> /dev/null; then
    python -m http.server 8000 &
    SERVER_PID=$!
elif command -v php &> /dev/null; then
    php -S localhost:8000 &
    SERVER_PID=$!
else
    echo "❌ Error: No suitable web server found."
    echo "Please install Python 3 or PHP to run the local server."
    exit 1
fi

# Wait for server to start
sleep 1

# Open browser
firefox http://localhost:8000

# Wait for server process
wait $SERVER_PID