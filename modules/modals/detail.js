import { loadCardChunk } from '../services/cache.js';
import { addToRecentlyViewed } from '../storage/storage.js';
import { buildDetailModalHTML } from '../templates/detailModal.js';
import { prepareCardDataForModal } from '../data/cardPreparation.js';

// Show card detail modal
export async function showCardDetail(card, extensionName, extension_settings, state, save=true) {
    let fullCard = await loadFullCard(card);

    // Verify we're showing the right card
    if (fullCard.name !== card.name) {
        console.error('[Bot Browser] Card name mismatch - clicked:', card.name, 'but loaded:', fullCard.name);
        toastr.error('Error loading card data', 'Error', { timeOut: 3000 });
    }

    state.selectedCard = fullCard;

    if (save) {
        state.recentlyViewed = addToRecentlyViewed(extensionName, extension_settings, state.recentlyViewed, fullCard);
    }

    const { detailOverlay, detailModal } = createDetailModal(fullCard);

    document.body.appendChild(detailOverlay);
    document.body.appendChild(detailModal);

    setupDetailModalEvents(detailModal, detailOverlay, fullCard, state);
}

async function loadFullCard(card) {
    let fullCard = card;
    const chunkService = card.sourceService || card.service;

    if (card.entries && typeof card.entries === 'object' && Object.keys(card.entries).length > 0) {
        return card;
    }

    if (card.chunk && chunkService) {
        const chunkData = await loadCardChunk(chunkService, card.chunk);

        let cardsArray = null;
        if (chunkData && chunkData.cards && Array.isArray(chunkData.cards)) {
            cardsArray = chunkData.cards;
        } else if (chunkData && chunkData.lorebooks && Array.isArray(chunkData.lorebooks)) {
            cardsArray = chunkData.lorebooks;
        } else if (chunkData && Array.isArray(chunkData) && chunkData.length > 0) {
            cardsArray = chunkData;
        }

        if (cardsArray && cardsArray.length > 0) {
            let chunkCard = cardsArray.find(c =>
                c.id === card.id ||
                (c.image_url && c.image_url === card.id) ||
                (c.image_url && c.image_url === card.image_url)
            );

            if (!chunkCard) {
                chunkCard = cardsArray.find(c => c.name === card.name);
            }

            if (chunkCard) {
                fullCard = { ...chunkCard, ...card };
            } else {
                const fallbackCard = cardsArray[card.chunk_idx];
                if (fallbackCard) {
                    fullCard = { ...fallbackCard, ...card };
                }
            }
        } else if (chunkData && !Array.isArray(chunkData) && chunkData.entries && typeof chunkData.entries === 'object') {
            fullCard = { ...card, ...chunkData };
        }
    }

    return fullCard;
}

function createDetailModal(fullCard) {
    const detailOverlay = document.createElement('div');
    detailOverlay.id = 'bot-browser-detail-overlay';
    detailOverlay.className = 'bot-browser-detail-overlay';

    const detailModal = document.createElement('div');
    detailModal.id = 'bot-browser-detail-modal';
    detailModal.className = 'bot-browser-detail-modal';

    // Detect if this is a lorebook based on presence of entries object
    const isLorebook = fullCard.entries && typeof fullCard.entries === 'object' && !Array.isArray(fullCard.entries);

    const cardData = prepareCardDataForModal(fullCard, isLorebook);

    detailModal.innerHTML = buildDetailModalHTML(
        cardData.cardName,
        cardData.imageUrl,
        cardData.isLorebook,
        cardData.cardCreator,
        cardData.tags,
        cardData.creator,
        cardData.websiteDesc,
        cardData.description,
        cardData.descPreview,
        cardData.personality,
        cardData.scenario,
        cardData.firstMessage,
        cardData.alternateGreetings,
        cardData.exampleMsg,
        cardData.processedEntries,
        cardData.entriesCount,
        cardData.metadata
    );

    return { detailOverlay, detailModal };
}

function setupDetailModalEvents(detailModal, detailOverlay, fullCard, state) {
    const closeButton = detailModal.querySelector('.bot-browser-detail-close');
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        closeDetailModal();
    });

    detailOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        closeDetailModal();
    });

    // Prevent all events from bubbling through the overlay
    detailOverlay.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    detailOverlay.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    const backButton = detailModal.querySelector('.bot-browser-detail-back');
    backButton.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        closeDetailModal();
    });

    detailModal.querySelectorAll('.bot-browser-collapse-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const targetId = toggle.dataset.target;
            const content = document.getElementById(targetId);
            const icon = toggle.querySelector('i');

            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.className = 'fa-solid fa-chevron-down';
            } else {
                content.style.display = 'none';
                icon.className = 'fa-solid fa-chevron-right';
            }
        });
    });

    // Prevent modal clicks from closing it
    detailModal.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    detailModal.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    detailModal.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
    });
}

// Close detail modal
export function closeDetailModal() {
    const detailModal = document.getElementById('bot-browser-detail-modal');
    const detailOverlay = document.getElementById('bot-browser-detail-overlay');

    if (detailModal) detailModal.remove();
    if (detailOverlay) detailOverlay.remove();

    console.log('[Bot Browser] Card detail modal closed');
}

// Show image in full-screen lightbox
export function showImageLightbox(imageUrl) {
    // Create lightbox overlay with extremely high z-index
    const lightbox = document.createElement('div');
    lightbox.id = 'bot-browser-image-lightbox';
    lightbox.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.95) !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: zoom-out !important;
        animation: fadeIn 0.2s ease-out !important;
        padding: 20px !important;
        pointer-events: all !important;
    `;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 90% !important;
        max-height: 90% !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
        display: block !important;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
    closeBtn.style.cssText = `
        position: absolute !important;
        top: 20px !important;
        right: 20px !important;
        background: rgba(255, 255, 255, 0.1) !important;
        border: none !important;
        color: white !important;
        font-size: 24px !important;
        width: 40px !important;
        height: 40px !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: background 0.2s !important;
        z-index: 1000000 !important;
        pointer-events: all !important;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';

    lightbox.appendChild(img);
    lightbox.appendChild(closeBtn);
    document.body.appendChild(lightbox);

    let isClosing = false;

    // Close on click (anywhere) or ESC key
    const closeLightbox = () => {
        if (isClosing) return;
        isClosing = true;

        lightbox.remove();
        console.log('[Bot Browser] Image lightbox closed');
    };

    lightbox.addEventListener('click', (e) => {
        // Only close if clicking directly on the lightbox background
        if (e.target === lightbox) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            closeLightbox();
        }
    });

    // Close button handler
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeLightbox();
    });

    // Stop image clicks from propagating
    img.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    // Close on ESC key
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            closeLightbox();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);

    console.log('[Bot Browser] Image lightbox opened');
}
