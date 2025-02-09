const API_KEY = 'f6105af3';

const moviesContainer = document.getElementById('movies-container');

// Search by name
const searchNameForm = document.getElementById('search-name-form');
const searchNameInput = document.getElementById('search-name-input');
const genreFilterName = document.getElementById('genre-filter-name');

// Search by genre
const searchGenreForm = document.getElementById('search-genre-form');
const genreFilterGenre = document.getElementById('genre-filter-genre');

let library = {
  "to-watch": [],
  "watching": [],
  "watched": []
};

document.addEventListener('DOMContentLoaded', () => {
  loadLibrary();
  renderLibrary();

  // Theme toggle
  const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');

  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggleCheckbox.checked = true;
  }
  themeToggleCheckbox.addEventListener('change', function () {
    if (this.checked) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  });
});

// Spinner functions
function showSpinner(container) {
  container.innerHTML = `<div class="spinner"></div>`;
}

function hideSpinner(container) {
  container.innerHTML = '';
}

// Search by name
searchNameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchNameInput.value.trim();
  const selectedGenre = genreFilterName.value;
  if (query) {
    fetchMoviesByName(query, selectedGenre);
  }
});

function fetchMoviesByName(query, selectedGenre) {
  showSpinner(moviesContainer);
  fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(data => {
      hideSpinner(moviesContainer);
      if (data.Response === "True") {
        const movieDetailsPromises = data.Search.map(movie =>
          fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdbID}`)
            .then(response => response.json())
        );
        Promise.all(movieDetailsPromises).then(movies => {
          let filteredMovies = movies;
          if (selectedGenre) {
            filteredMovies = movies.filter(movie => {
              return movie.Genre && movie.Genre.split(', ').includes(selectedGenre);
            });
          }
          displayMovies(filteredMovies);
        });
      } else {
        moviesContainer.innerHTML = `<p>No movies found for "${query}".</p>`;
      }
    })
    .catch(err => {
      console.error('Error fetching movies:', err);
      hideSpinner(moviesContainer);
      moviesContainer.innerHTML = `<p>Error fetching movies. Please try again later.</p>`;
    });
}

// Search by genre
searchGenreForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const selectedGenre = genreFilterGenre.value;
  if (selectedGenre) {
    fetchMoviesByGenre(selectedGenre);
  } else {
    alert("Please select a genre.");
  }
});

function fetchMoviesByGenre(selectedGenre) {
  showSpinner(moviesContainer);
  fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(selectedGenre)}`)
    .then(response => response.json())
    .then(data => {
      hideSpinner(moviesContainer);
      if (data.Response === "True") {
        const movieDetailsPromises = data.Search.map(movie =>
          fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdbID}`)
            .then(response => response.json())
        );
        Promise.all(movieDetailsPromises).then(movies => {
          const filteredMovies = movies.filter(movie => {
            return movie.Genre && movie.Genre.split(', ').includes(selectedGenre);
          });
          displayMovies(filteredMovies);
        });
      } else {
        moviesContainer.innerHTML = `<p>No movies found for genre "${selectedGenre}".</p>`;
      }
    })
    .catch(err => {
      console.error('Error fetching movies:', err);
      hideSpinner(moviesContainer);
      moviesContainer.innerHTML = `<p>Error fetching movies. Please try again later.</p>`;
    });
}

// Display movies search results
function displayMovies(movies) {
  moviesContainer.innerHTML = '';
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.classList.add('movie-card');
    card.innerHTML = `
      <img src="${movie.Poster !== "N/A" ? movie.Poster : 'placeholder.jpg'}" alt="${movie.Title}" />
      <h4>${movie.Title}</h4>
      <p>Year: ${movie.Year}</p>
      <p>Genre: ${movie.Genre || 'N/A'}</p>
      <p>IMDb Rating: ${movie.imdbRating || 'N/A'}</p>
    `;
    // Add the movie to the "To-Watch" shelf when clicked
    card.addEventListener('click', () => {
      if (isMovieInLibrary(movie.imdbID)) {
        alert('Movie is already in your library.');
        return;
      }
      library['to-watch'].push(movie);
      saveLibrary();
      renderLibrary();
    });
    moviesContainer.appendChild(card);
  });
}

// Library functions
function isMovieInLibrary(movieId) {
  return Object.values(library).some(shelf =>
    shelf.some(movie => movie.imdbID === movieId)
  );
}

function renderLibrary() {
  ['to-watch', 'watching', 'watched'].forEach(shelfName => {
    const shelfElement = document.querySelector(`#${shelfName} .shelf-content`);
    shelfElement.innerHTML = '';
    library[shelfName].forEach(movie => {
      const card = document.createElement('div');
      card.classList.add('movie-card');
      card.setAttribute('draggable', 'true');
      card.dataset.movieId = movie.imdbID;
      card.innerHTML = `
        <img src="${movie.Poster !== "N/A" ? movie.Poster : 'placeholder.jpg'}" alt="${movie.Title}" />
        <h4>${movie.Title}</h4>
        <p>Year: ${movie.Year}</p>
        <p>Genre: ${movie.Genre || 'N/A'}</p>
        <p>IMDb Rating: ${movie.imdbRating || 'N/A'}</p>
        <button class="remove-btn">Remove</button>
      `;
      card.addEventListener('dragstart', dragStart);
      const removeBtn = card.querySelector('.remove-btn');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeMovieFromShelf(movie.imdbID, shelfName);
      });
      shelfElement.appendChild(card);
    });
  });
}

// Drag-and-drop
function dragStart(e) {
  e.dataTransfer.setData('text/plain', e.currentTarget.dataset.movieId);
}

function allowDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}

function removeDragOver(e) {
  e.currentTarget.classList.remove('dragover');
}

function drop(e, targetShelfName) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  const movieId = e.dataTransfer.getData('text/plain');
  let sourceShelf = null;
  let movieObject = null;
  for (let shelf in library) {
    movieObject = library[shelf].find(mov => mov.imdbID === movieId);
    if (movieObject) {
      sourceShelf = shelf;
      break;
    }
  }
  if (movieObject) {
    if (sourceShelf === targetShelfName) return;
    library[sourceShelf] = library[sourceShelf].filter(movie => movie.imdbID !== movieId);
    library[targetShelfName].push(movieObject);
    saveLibrary();
    renderLibrary();
  } else {
    fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movieId}`)
      .then(response => response.json())
      .then(movie => {
        library[targetShelfName].push(movie);
        saveLibrary();
        renderLibrary();
      })
      .catch(err => console.error('Error fetching movie details:', err));
  }
}

// Remove a movie from a specified shelf.
function removeMovieFromShelf(movieId, shelfName) {
  library[shelfName] = library[shelfName].filter(movie => movie.imdbID !== movieId);
  saveLibrary();
  renderLibrary();
}

// Save the library data to LocalStorage.
function saveLibrary() {
  localStorage.setItem('movieLibrary', JSON.stringify(library));
}

// Load the library data from LocalStorage.
function loadLibrary() {
  const savedLibrary = localStorage.getItem('movieLibrary');
  if (savedLibrary) {
    library = JSON.parse(savedLibrary);
  }
}
