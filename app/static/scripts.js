const defaultCoverUrl = 'https://media.licdn.com/dms/image/C4D0BAQFNClv9kGYqBw/company-logo_200_200/0/1630463726779/bmat_logo?e=1730937600&v=beta&t=OeGSEn6tQe4JzjNZ_e5PlWwET7sB_q4v_Jpc5qVeBc4';
let currentGenres = [];
let activeSuggestionIndex = -1;
let currentPage = 1;
const itemsPerPage = 10;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', () => {
    try {
        fetchAlbums();
        showNoRecommendationsMessage(true);
        initializeCountdown(new Date('September 13, 2024 12:00:00'));
    } catch (error) {
        console.error("Error during initial fetch:", error);
    }

    const allAlbumsHeader = document.getElementById('all-albums-header');
    if (allAlbumsHeader) {
        allAlbumsHeader.addEventListener('click', (event) => {
            event.preventDefault();
            fetchAlbums();
        });
    }
});

// Initialize countdown
function initializeCountdown(endDate) {
    const countdownContainer = document.getElementById('countdown-container');
    const daysSpan = document.getElementById('days');
    const hoursSpan = document.getElementById('hours');
    const minutesSpan = document.getElementById('minutes');
    const secondsSpan = document.getElementById('seconds');

    if (!countdownContainer || !daysSpan || !hoursSpan || !minutesSpan || !secondsSpan) {
        console.error("Countdown elements not found.");
        return;
    }

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endDate.getTime() - now;

        if (distance < 0) {
            clearInterval(interval);
            document.getElementById('headline').innerText = "The event has started!";
            countdownContainer.style.display = 'none';
            countdownEnded();
            return;
        }

        daysSpan.innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
        hoursSpan.innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        minutesSpan.innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        secondsSpan.innerText = Math.floor((distance % (1000 * 60)) / 1000);
    }

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();
}

// Function to execute when countdown ends
function countdownEnded() {
    // Clear the entire page content and show "Project Down"
    document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-size:24px;color:red;">Project Down</div>';
}

// Handle errors more safely
function handleError(error, elementId) {
    console.error(`Error fetching ${elementId}:`, error);
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<li class="list-group-item text-center text-danger">Error fetching ${elementId}. Please try again later.</li>`;
    }
    showNoSearchResultsMessage(true);
    clearRecommendations();
}

function fetchAlbums(page = 1) {
    fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `
            {
                allAlbums(page: ${page}, perPage: ${itemsPerPage}) {
                    albums {
                        album
                        artist
                        album_cover_url
                        spotify_link
                        name
                        title
                        genre
                    }
                    totalCount
                }
            }
            `
        })
    })
    .then(response => response.json())
    .then(data => {
        displayAlbums(data.data.allAlbums.albums);
        totalPages = Math.ceil(data.data.allAlbums.totalCount / itemsPerPage);
        updatePaginationInfo('all-albums-pagination-info', data.data.allAlbums.totalCount, page, itemsPerPage);
        updatePaginationButtons('all-albums-pagination-buttons', totalPages, page, fetchAlbums);
    })
    .catch(error => handleError(error, 'all-albums'));
}

function searchAlbums() {
    const query = document.getElementById('search').value.trim();
    if (!query) return;

    fetch(`/api/albums/search?query=${query}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                showNoSearchResultsMessage(true);
                clearRecommendations();
                clearAlbums();
                clearPagination('all-albums-pagination-info', 'all-albums-pagination-buttons');
                document.getElementById('recommendations-header').textContent = 'Recommendations';
            } else {
                showNoSearchResultsMessage(false);
                displayAlbums(data);
                showRecommendations(data[0].genre, data[0].album);
            }
            // Hide pagination buttons after search
            document.getElementById('all-albums-pagination-info').style.display = 'none';
            document.getElementById('all-albums-pagination-buttons').style.display = 'none';
        })
        .catch(error => handleError(error, 'all-albums'));
}

function showSuggestions(query) {
    if (query.length < 2) return document.getElementById('autocomplete-suggestions').innerHTML = '';

    fetch(`/api/albums/search?query=${query}`)
        .then(response => response.json())
        .then(data => {
            const suggestionsBox = document.getElementById('autocomplete-suggestions');
            suggestionsBox.innerHTML = '';
            activeSuggestionIndex = -1;
            data.forEach((album, index) => {
                const suggestion = document.createElement('div');
                suggestion.className = 'autocomplete-suggestion';
                suggestion.textContent = `${album.album} by ${album.artist}`;
                suggestion.dataset.index = index;
                suggestion.onclick = () => {
                    document.getElementById('search').value = album.album;
                    suggestionsBox.innerHTML = '';
                    searchAlbums();
                    showRecommendations(album.genre, album.album);
                };
                suggestionsBox.appendChild(suggestion);
            });
        })
        .catch(error => {
            console.error("Error fetching suggestions:", error);
        });
}

function showRecommendations(genres, title) {
    try {
        currentGenres = genres;
        document.getElementById('recommendations-header').textContent = `Recommendations for ${title}`;
        fetchRecommendations(genres);
        setTimeout(() => document.getElementById('recommendations-header').scrollIntoView({ behavior: 'smooth' }), 500);
    } catch (error) {
        console.error("Error showing recommendations:", error);
    }
}

async function fetchRecommendations(genres, page = 1) {
    try {
        const response = await fetch('/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                {
                    albumsByGenre(genres: ${JSON.stringify(genres)}, page: ${page}, perPage: ${itemsPerPage}) {
                        albums {
                            album
                            artist
                            album_cover_url
                            spotify_link
                            name
                            title
                            genre
                        }
                        totalCount
                    }
                }
                `
            })
        });
        const data = await response.json();
        displayRecommendations(data.data.albumsByGenre.albums);
        totalPages = Math.ceil(data.data.albumsByGenre.totalCount / itemsPerPage);
        updatePaginationInfo('recommendations-pagination-info', data.data.albumsByGenre.totalCount, page, itemsPerPage);
        updatePaginationButtons('recommendations-pagination-buttons', totalPages, page, (page) => fetchRecommendations(genres, page));
    } catch (error) {
        handleError(error, 'recommendations');
    }
}

function displayAlbums(albums) {
    const albumList = document.getElementById('all-albums');
    if (!albumList) {
        console.error("Album list element not found.");
        return;
    }

    albumList.innerHTML = '';
    if (albums.length > 0) {
        albums.forEach(album => {
            const coverUrl = (album.album_cover_url === "No image available") ? defaultCoverUrl : album.album_cover_url;
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex align-items-center';
            li.innerHTML = `
                <img src="${coverUrl}" class="album-cover mr-3" onclick='showRecommendations(${JSON.stringify(album.genre)}, "${album.album}")'>
                <div class="album-info">
                    <strong onclick='showRecommendations(${JSON.stringify(album.genre)}, "${album.album}")'>${album.album}</strong>
                    <span>by ${album.artist}</span>
                    <span>Liked by ${album.name} <em>(${album.title})</em></span>
                    <div class="tags">
                        ${formatTags(album.genre)}
                    </div>
                </div>
                ${album.spotify_link ? `<button class="spotify-button btn btn-success ml-3" onclick="window.open('${album.spotify_link}', '_blank')"><i class="fab fa-spotify spotify-icon"></i> Listen on Spotify</button>` : ''}
            `;
            albumList.appendChild(li);
        });
        showNoSearchResultsMessage(false);
    } else {
        albumList.innerHTML = '<li class="list-group-item text-center text-muted">No albums found.</li>';
        showNoSearchResultsMessage(true);
        clearRecommendations();
        clearPagination('all-albums-pagination-info', 'all-albums-pagination-buttons');
        document.getElementById('recommendations-header').textContent = 'Recommendations';
    }
}

function displayRecommendations(albums) {
    const recommendationList = document.getElementById('recommendations');
    recommendationList.innerHTML = '';
    if (albums.length > 0) {
        albums.forEach(album => {
            const coverUrl = (album.album_cover_url === "No image available") ? defaultCoverUrl : album.album_cover_url;
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex align-items-center';
            li.innerHTML = `
                <img src="${coverUrl}" class="album-cover mr-3" onclick='showRecommendations(${JSON.stringify(album.genre)}, "${album.album}")'>
                <div class="album-info">
                    <strong onclick='showRecommendations(${JSON.stringify(album.genre)}, "${album.album}")'>${album.album}</strong>
                    <span>by ${album.artist}</span>
                    <span>Liked by ${album.name} <em>(${album.title})</em></span>
                    <div class="tags">
                        ${formatTags(album.genre)}
                    </div>
                </div>
                ${album.spotify_link ? `<button class="spotify-button btn btn-success ml-3" onclick="window.open('${album.spotify_link}', '_blank')"><i class="fab fa-spotify spotify-icon"></i> Listen on Spotify</button>` : ''}
            `;
            recommendationList.appendChild(li);
        });
        showNoRecommendationsMessage(false);
    } else {
        recommendationList.innerHTML = '<li class="list-group-item text-center text-muted">No recommendations found.</li>';
        showNoRecommendationsMessage(true);
        clearPagination('recommendations-pagination-info', 'recommendations-pagination-buttons');
        document.getElementById('recommendations-header').textContent = 'Recommendations';
    }
}

function formatTags(tags) {
    const maxTagsPerLine = 5;
    let formattedTags = '';
    for (let i = 0; i < tags.length; i += maxTagsPerLine) {
        const tagLine = tags.slice(i, i + maxTagsPerLine).map(tag => `<span class="tag" onclick='toggleActiveTag(this); showRecommendations(["${tag}"], "${tag}")'>${tag}</span>`).join('');
        formattedTags += `<div class="tag-line">${tagLine}</div>`;
    }
    return formattedTags;
}

function updatePaginationInfo(containerId, totalCount, currentPage, itemsPerPage) {
    const container = document.getElementById(containerId);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalCount);
    container.textContent = `Showing ${start} to ${end} of ${totalCount} results`;
}

function updatePaginationButtons(containerId, totalPages, currentPage, fetchFunction) {
    const container = document.getElementById(containerId);
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = '';

    const prevButton = document.createElement('button');
    prevButton.className = 'btn btn-primary mr-2';
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchFunction(currentPage);
        }
    });

    const nextButton = document.createElement('button');
    nextButton.className = 'btn btn-primary ml-2';
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchFunction(currentPage);
        }
    });

    container.appendChild(prevButton);
    container.appendChild(nextButton);
    container.style.display = 'flex';
}

function toggleActiveTag(element) {
    document.querySelectorAll('.tag').forEach(tag => tag.classList.remove('active'));
    element.classList.add('active');
}

function showNoRecommendationsMessage(show) {
    document.getElementById('no-recommendations-message').style.display = show ? 'block' : 'none';
}

function showNoSearchResultsMessage(show) {
    const messageElement = document.getElementById('no-search-results-message');
    if (messageElement) {
        messageElement.style.display = show ? 'block' : 'none';
    }
}

function clearRecommendations() {
    document.getElementById('recommendations').innerHTML = '';
    showNoRecommendationsMessage(true);
    clearPagination('recommendations-pagination-info', 'recommendations-pagination-buttons');
}

function clearAlbums() {
    document.getElementById('all-albums').innerHTML = '';
}

function clearPagination(infoId, buttonsId) {
    document.getElementById(infoId).textContent = '';
    document.getElementById(buttonsId).style.display = 'none';
}

function handleKeyDown(event) {
    const suggestionsBox = document.getElementById('autocomplete-suggestions');
    const suggestions = suggestionsBox.querySelectorAll('.autocomplete-suggestion');

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (activeSuggestionIndex < suggestions.length - 1) {
            activeSuggestionIndex++;
            updateActiveSuggestion(suggestions);
        }
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (activeSuggestionIndex > 0) {
            activeSuggestionIndex--;
            updateActiveSuggestion(suggestions);
        }
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
            suggestions[activeSuggestionIndex].click();
        } else {
            searchAlbums();
        }
    } else if (event.key === 'Tab') {
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
            suggestions[activeSuggestionIndex].click();
        }
    }
}

function updateActiveSuggestion(suggestions) {
    suggestions.forEach((suggestion, index) => {
        suggestion.classList.toggle('active', index === activeSuggestionIndex);
    });
}