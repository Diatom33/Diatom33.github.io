# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a personal portfolio website for Alice Blair (aliceblair.net) hosted on GitHub Pages. The site features:

- A single-page portfolio built around a portrait photo, with bio and links
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
- **alice.jpg**: Portrait photo (1100x1650, studio backdrop `#f4f4f4`, which the light theme's page colour matches)
- **scripts/update-feed.js**: RSS aggregation script (Node.js)
- **data/feed.json**: Generated RSS feed data consumed by frontend
- **data/feed.xml**: Generated RSS XML feed
- **.github/workflows/update-rss.yml**: Automated feed updates

### RSS Feed System
- Aggregates from LessWrong (Alice Blair's posts) and ML Safety Newsletter
- Transforms GreaterWrong links to LessWrong equivalents
- Cleans post titles (removes "by Alice Blair" suffix)
- Applies date filtering for Newsletter posts (after May 1, 2025)
- Frontend consumes JSON data and shows titles + dates only; on failure it shows a short "unavailable" note

### Theme System
- CSS custom properties for light/dark themes, set via `data-theme` on `<html>` before first paint
- Follows the system preference until the footer "light / dark" button is used; choosing the
  theme that matches the system clears the stored preference, so it goes back to following

### Layout
- Embedded CSS in index.html; one font (Figtree), one muted mauve "sheet" under all the text
- Below 900px: the photo sits on top of the sheet, cropped at the table edge, and is capped at
  two thirds of the window height (it shrinks and stays centred on short windows)
- 900px and up, light: the photo is fixed to the bottom-right corner, the page colour matches
  its backdrop so it has no visible edges, and a `.desk` strip continues her table across the window
- 900px and up, dark: the backdrop can't match, so the photo becomes a framed square inside the
  sheet beside the bio

## Environment Variables (GitHub Actions)
- `RSS_FEED_1`: LessWrong RSS URL
- `RSS_FEED_2`: ML Safety Newsletter RSS URL  
- `MAX_ITEMS`: Maximum feed items to display (default: 10)

## Content Management
- Bio and personal links manually edited in index.html
- Papers and "Coverage & talks" lists manually maintained in index.html (keep llms.txt in step)
- RSS feeds automatically updated and committed by GitHub Actions
- All content changes require direct HTML editing