export function loadPersistentSearch(extensionName, extension_settings, serviceName) {
    if (!extension_settings[extensionName].persistentSearchEnabled) {
        return null;
    }
    try {
        const key = `botBrowser_lastSearch_${serviceName}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            const data = JSON.parse(saved);
            console.log(`[Bot Browser] Loaded persistent search for ${serviceName}:`, data.filters);
            return data;
        }
    } catch (error) {
        console.error('[Bot Browser] Error loading persistent search:', error);
    }
    return null;
}

// Save search state to localStorage (per-service)
export function savePersistentSearch(extensionName, extension_settings, serviceName, filters, sortBy) {
    if (!extension_settings[extensionName].persistentSearchEnabled) {
        return;
    }
    try {
        const data = {
            filters: filters,
            sortBy: sortBy
        };
        const key = `botBrowser_lastSearch_${serviceName}`;
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('[Bot Browser] Error saving persistent search:', error);
    }
}

// Load search collapsed state from localStorage
export function loadSearchCollapsed() {
    try {
        const saved = localStorage.getItem('botBrowser_searchCollapsed');
        if (saved !== null) {
            const collapsed = JSON.parse(saved);
            console.log('[Bot Browser] Loaded search collapsed state:', collapsed);
            return collapsed;
        }
    } catch (error) {
        console.error('[Bot Browser] Error loading search collapsed state:', error);
    }
    return false;
}

// Save search collapsed state to localStorage
export function saveSearchCollapsed(collapsed) {
    try {
        localStorage.setItem('botBrowser_searchCollapsed', JSON.stringify(collapsed));
    } catch (error) {
        console.error('[Bot Browser] Error saving search collapsed state:', error);
    }
}

// Load recently viewed cards from localStorage
export function loadRecentlyViewed(extensionName, extension_settings) {
    if (!extension_settings[extensionName].recentlyViewedEnabled) {
        return [];
    }
    try {
        const saved = localStorage.getItem('botBrowser_recentlyViewed');
        if (saved) {
            let recentlyViewed = JSON.parse(saved);
            // Trim to max setting
            const maxRecent = extension_settings[extensionName].maxRecentlyViewed || 10;
            if (recentlyViewed.length > maxRecent) {
                recentlyViewed = recentlyViewed.slice(0, maxRecent);
            }
            console.log('[Bot Browser] Loaded recently viewed:', recentlyViewed.length, 'cards');
            return recentlyViewed;
        }
    } catch (error) {
        console.error('[Bot Browser] Error loading recently viewed:', error);
    }
    return [];
}

// Add card to recently viewed
export function addToRecentlyViewed(extensionName, extension_settings, recentlyViewed, card) {
    if (!extension_settings[extensionName].recentlyViewedEnabled) {
        return recentlyViewed;
    }
    try {
        // Remove if already in list
        recentlyViewed = recentlyViewed.filter(c => c.id !== card.id);

        // Add to front
        recentlyViewed.unshift({
            id: card.id,
            name: card.name,
            creator: card.creator,
            avatar_url: card.avatar_url || card.image_url,
            service: card.service,
            chunk: card.chunk,
            chunk_idx: card.chunk_idx,
            sourceService: card.sourceService,
            possibleNsfw: card.possibleNsfw || false
        });

        // Keep only max allowed
        const maxRecent = extension_settings[extensionName].maxRecentlyViewed || 10;
        if (recentlyViewed.length > maxRecent) {
            recentlyViewed = recentlyViewed.slice(0, maxRecent);
        }

        // Save to localStorage
        localStorage.setItem('botBrowser_recentlyViewed', JSON.stringify(recentlyViewed));

        return recentlyViewed;
    } catch (error) {
        console.error('[Bot Browser] Error adding to recently viewed:', error);
        return recentlyViewed;
    }
}

// Load import stats from localStorage
export function loadImportStats() {
    try {
        const saved = localStorage.getItem('botBrowser_importStats');
        if (saved) {
            const stats = JSON.parse(saved);
            console.log('[Bot Browser] Loaded import stats:', stats.totalCharacters, 'characters,', stats.totalLorebooks, 'lorebooks');
            return stats;
        }
    } catch (error) {
        console.error('[Bot Browser] Error loading import stats:', error);
    }
    return {
        totalCharacters: 0,
        totalLorebooks: 0,
        imports: [],
        bySource: {},
        byCreator: {}
    };
}

// Save import stats to localStorage
export function saveImportStats(importStats) {
    try {
        localStorage.setItem('botBrowser_importStats', JSON.stringify(importStats));
    } catch (error) {
        console.error('[Bot Browser] Error saving import stats:', error);
    }
}
