const Parser = require('rss-parser');
const fs = require('fs-extra');
const path = require('path');

const parser = new Parser({
    customFields: {
        feed: ['language', 'copyright', 'managingEditor'],
        item: ['author', 'guid', 'category', 'enclosure']
    }
});

// Configuration
const RSS_FEEDS = [
    {
        url: process.env.RSS_FEED_1,
        name: 'LessWrong',
        category: 'LessWrong',
        dateFilter: null // No date filtering
    },
    {
        url: process.env.RSS_FEED_2,
        name: 'Newsletter',
        category: 'Newsletter',
        dateFilter: new Date('2025-05-01T00:00:00Z') // Only items after May 1, 2025
    }
];

const MAX_ITEMS = parseInt(process.env.MAX_ITEMS) || 10;
const OUTPUT_DIR = 'data';
const OUTPUT_FILE = 'feed.json';

// Ensure data directory exists
async function ensureDataDirectory() {
    await fs.ensureDir(OUTPUT_DIR);
}

// Fetch and parse a single RSS feed
async function fetchFeed(feedConfig) {
    try {
        console.log(`Fetching feed: ${feedConfig.name} (${feedConfig.url})`);

        const feed = await parser.parseURL(feedConfig.url);

        // Transform GreaterWrong links to LessWrong links and clean up titles
        let items = feed.items.map(item => {
            const originalLink = item.link;
            const originalGuid = item.guid || item.link;

            const transformedLink = originalLink ? originalLink.replace(/greaterwrong\.com/g, 'lesswrong.com') : originalLink;
            const transformedGuid = originalGuid ? originalGuid.replace(/greaterwrong\.com/g, 'lesswrong.com') : originalGuid;

            // Clean up title by removing trailing "by Alice Blair"
            let cleanedTitle = item.title;
            if (cleanedTitle && cleanedTitle.endsWith(' by Alice Blair')) {
                cleanedTitle = cleanedTitle.replace(/ by Alice Blair$/, '');
                console.log(`Cleaned title: "${item.title}" -> "${cleanedTitle}"`);
            }

            // Log link transformations for debugging
            if (originalLink && originalLink !== transformedLink) {
                console.log(`Transformed link: ${originalLink} -> ${transformedLink}`);
            }

            // Clean up description by removing LaTeX artifacts and keeping only preview
            let cleanedDescription = item.contentSnippet || item.content || '';

            // Remove MathJax CSS and styling artifacts that appear at the beginning of descriptions
            cleanedDescription = cleanedDescription
                // Remove MathJax CSS blocks that start with .mjx-chtml
                .replace(/\.mjx-chtml\s*\{[^}]*\}/g, '')
                // Remove other MathJax-related CSS classes and styles
                .replace(/\.[a-zA-Z-]*mjx[a-zA-Z-]*\s*\{[^}]*\}/g, '')
                // Remove any remaining CSS-like blocks
                .replace(/\.[a-zA-Z-]+\s*\{[^}]*\}/g, '')
                // Remove excessive whitespace and normalize
                .replace(/\s+/g, ' ')
                .trim();

            // Truncate description to a reasonable preview length (first 300 characters)
            if (cleanedDescription.length > 100) {
                cleanedDescription = cleanedDescription.substring(0, 297) + '...';
            }

            return {
                title: cleanedTitle,
                link: transformedLink,
                description: cleanedDescription,
                pubDate: item.pubDate,
                isoDate: item.isoDate,
                author: item.author || item.creator || 'Unknown',
                guid: transformedGuid,
                category: item.category || feedConfig.category,
                source: feedConfig.name,
                feedTitle: feed.title
            };
        });

        // Apply date filtering if specified
        if (feedConfig.dateFilter) {
            const filterDate = feedConfig.dateFilter;
            items = items.filter(item => {
                const itemDate = new Date(item.isoDate || item.pubDate);
                const isAfterFilter = itemDate >= filterDate;
                if (!isAfterFilter) {
                    console.log(`Filtering out item "${item.title}" (${itemDate.toISOString()}) - before ${filterDate.toISOString()}`);
                }
                return isAfterFilter;
            });
            console.log(`Applied date filter for ${feedConfig.name}: ${items.length} items remain after filtering`);
        }

        return {
            feedInfo: {
                title: feed.title,
                description: feed.description,
                link: feed.link,
                category: feedConfig.category,
                name: feedConfig.name,
                dateFilter: feedConfig.dateFilter ? feedConfig.dateFilter.toISOString() : null
            },
            items: items
        };
    } catch (error) {
        console.error(`Error fetching feed ${feedConfig.name}:`, error.message);
        return {
            feedInfo: {
                title: `Error: ${feedConfig.name}`,
                description: 'Failed to fetch feed',
                link: feedConfig.url,
                category: feedConfig.category,
                name: feedConfig.name,
                dateFilter: feedConfig.dateFilter ? feedConfig.dateFilter.toISOString() : null
            },
            items: []
        };
    }
}

// Fetch all RSS feeds
async function fetchAllFeeds() {
    console.log('Starting RSS feed fetch...');

    const feedPromises = RSS_FEEDS
        .filter(feed => feed.url && feed.url !== 'https://example.com/feed1.xml' && feed.url !== 'https://example.com/feed2.xml')
        .map(feed => fetchFeed(feed));

    if (feedPromises.length === 0) {
        console.log('No valid RSS feed URLs provided. Using example data.');
        return createExampleData();
    }

    const results = await Promise.allSettled(feedPromises);

    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            console.error(`Failed to fetch feed ${RSS_FEEDS[index].name}:`, result.reason);
            return {
                feedInfo: RSS_FEEDS[index],
                items: []
            };
        }
    });
}

// Create example data when no real feeds are provided
function createExampleData() {
    const now = new Date();
    const exampleItems = [
        {
            title: "Latest Project Update: New Feature Release",
            link: "https://yourblog.com/post1",
            description: "Exciting new features have been added to the project...",
            pubDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            isoDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            author: "Your Name",
            category: "Development",
            source: "Blog",
            feedTitle: "Personal Blog"
        },
        {
            title: "Speaking at Tech Conference 2025",
            link: "https://conference.com/speaker/you",
            description: "Excited to announce my upcoming speaking engagement...",
            pubDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            isoDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            author: "Your Name",
            category: "Events",
            source: "Events",
            feedTitle: "Professional Updates"
        },
        {
            title: "Open Source Contribution Milestone",
            link: "https://github.com/project/milestone",
            description: "Reached an important milestone in open source contributions...",
            pubDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            isoDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            author: "Your Name",
            category: "Open Source",
            source: "GitHub",
            feedTitle: "Development Updates"
        }
    ];

    return [{
        feedInfo: {
            title: "Example Feed",
            description: "Example RSS data",
            category: "Example"
        },
        items: exampleItems
    }];
}

// Merge and sort items from all feeds
function mergeFeeds(feedResults) {
    const allItems = [];
    const feedInfo = [];

    feedResults.forEach(result => {
        feedInfo.push(result.feedInfo);
        allItems.push(...result.items);
    });

    // Sort by publication date (newest first)
    allItems.sort((a, b) => {
        const dateA = new Date(a.isoDate || a.pubDate);
        const dateB = new Date(b.isoDate || b.pubDate);
        return dateB - dateA;
    });

    // Limit to MAX_ITEMS
    const limitedItems = allItems.slice(0, MAX_ITEMS);

    return {
        meta: {
            title: "Merged RSS Feed",
            description: "Combined feed from multiple sources",
            lastUpdated: new Date().toISOString(),
            totalItems: limitedItems.length,
            sources: feedInfo,
            generatedBy: "GitHub Actions RSS Merger"
        },
        items: limitedItems
    };
}

// Save merged feed to JSON file
async function saveFeed(mergedFeed) {
    const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE);

    try {
        await fs.writeJson(outputPath, mergedFeed, { spaces: 2 });
        console.log(`Successfully saved merged feed to ${outputPath}`);
        console.log(`Total items: ${mergedFeed.items.length}`);
        console.log(`Last updated: ${mergedFeed.meta.lastUpdated}`);
    } catch (error) {
        console.error('Error saving feed:', error);
        throw error;
    }
}

// Generate RSS XML file (optional)
async function generateRSSXML(mergedFeed) {
    const rssXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${mergedFeed.meta.title}</title>
    <description>${mergedFeed.meta.description}</description>
    <lastBuildDate>${new Date(mergedFeed.meta.lastUpdated).toUTCString()}</lastBuildDate>
    <generator>${mergedFeed.meta.generatedBy}</generator>
    ${mergedFeed.items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <description><![CDATA[${item.description.substring(0, 500)}...]]></description>
      <pubDate>${new Date(item.isoDate || item.pubDate).toUTCString()}</pubDate>
      <guid>${item.guid || item.link}</guid>
      <category>${item.category}</category>
      <source>${item.source}</source>
    </item>`).join('')}
  </channel>
</rss>`;

    const xmlPath = path.join(OUTPUT_DIR, 'feed.xml');
    await fs.writeFile(xmlPath, rssXML);
    console.log(`Generated RSS XML at ${xmlPath}`);
}

// Main execution function
async function main() {
    try {
        console.log('Starting RSS feed update process...');
        console.log(`Timestamp: ${new Date().toISOString()}`);

        // Ensure output directory exists
        await ensureDataDirectory();

        // Fetch all feeds
        const feedResults = await fetchAllFeeds();

        if (feedResults.length === 0) {
            console.log('No feeds to process');
            return;
        }

        // Merge feeds
        const mergedFeed = mergeFeeds(feedResults);

        // Save merged feed
        await saveFeed(mergedFeed);

        // Optionally generate RSS XML
        await generateRSSXML(mergedFeed);

        console.log('RSS feed update completed successfully!');

        // Print summary
        console.log('\nSummary:');
        mergedFeed.meta.sources.forEach(source => {
            console.log(`  • ${source.name}: ${source.title}`);
        });

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main, fetchFeed, mergeFeeds };