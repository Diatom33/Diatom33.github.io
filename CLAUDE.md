# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a personal portfolio website for Alice Blair (aliceblair.net) hosted on GitHub Pages. The site features:

- A responsive personal portfolio with bio and links
- Automated RSS feed aggregation from LessWrong posts and ML Safety Newsletter
- Dark/light theme with system preference sync
- Static HTML/CSS/JavaScript architecture

## Key Commands

### RSS Feed Updates
- **Manual feed update**: `node scripts/update-feed.js`
- **Install dependencies**: `npm install --no-package-lock --no-save rss-parser@^3.13.0 fs-extra@^11.1.1`
- Automated updates run every 6 hours via GitHub Actions

### Development
No build process required - direct HTML/CSS/JavaScript served by GitHub Pages.

## Architecture

### Core Files
- **index.html**: Main portfolio page with embedded CSS/JavaScript
- **scripts/update-feed.js**: RSS aggregation script (Node.js)
- **data/feed.json**: Generated RSS feed data consumed by frontend
- **data/feed.xml**: Generated RSS XML feed
- **.github/workflows/update-rss.yml**: Automated feed updates

### RSS Feed System
- Aggregates from LessWrong (Alice Blair's posts) and ML Safety Newsletter
- Transforms GreaterWrong links to LessWrong equivalents
- Cleans post titles (removes "by Alice Blair" suffix)
- Applies date filtering for Newsletter posts (after May 1, 2025)
- Frontend consumes JSON data with graceful fallback to example content

### Theme System
- CSS custom properties for light/dark themes
- JavaScript manages theme persistence and system preference sync
- Three-state toggle: manual light, manual dark, or follow system

### Styling Architecture
- Embedded CSS in index.html using CSS custom properties
- Responsive design with mobile-first approach
- Card-based layout with consistent spacing and shadows
- Grid system for main content and coverage sections

## Environment Variables (GitHub Actions)
- `RSS_FEED_1`: LessWrong RSS URL
- `RSS_FEED_2`: ML Safety Newsletter RSS URL  
- `MAX_ITEMS`: Maximum feed items to display (default: 10)

## Content Management
- Bio and personal links manually edited in index.html
- Coverage section manually maintained in index.html
- RSS feeds automatically updated and committed by GitHub Actions
- All content changes require direct HTML editing