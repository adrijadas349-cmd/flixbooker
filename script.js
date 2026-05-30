// ========================================================
// 🎬 FlixBooker — Movie Booking Website
// Features: Search (OMDb API) + Seat Booking + My Bookings
// ========================================================

// ====== MOVIE LIST (default featured movies) ======
const movies = [
  { id: 1, title: "Inception", year: "2010", poster: "https://m.media-amazon.com/images/I/51p1VnKzK-L._AC_.jpg" },
  { id: 2, title: "The Dark Knight", year: "2008", poster: "https://m.media-amazon.com/images/I/51K8ouYrHeL._AC_.jpg" },
  { id: 3, title: "La La Land", year: "2016", poster: "https://m.media-amazon.com/images/I/71m7zG8Fb2L._AC_SL1124_.jpg" },
  { id: 4, title: "Parasite", year: "2019", poster: "https://m.media-amazon.com/images/I/81bG5TB6fPL._AC_SL1500_.jpg" }
];

// ====== DOM ELEMENTS ======
const moviesContainer = document.getElementById("moviesContainer");
const bookingModal = document.getElementById("bookingModal");
const bookingForm = document.getElementById("bookingForm");
const bookingClose = document.getElementById("bookingClose");
const bookingCancel = document.getElementById("bookingCancel");
const movieNameInput = document.getElementById("movieName");
const seatMap = document.getElementById("seatMap");
const seatCount = document.getElementById("seatCount");
const toast = document.getElementById("toast");
const canvas = document.getElementById("confetti");
const bookingsList = document.getElementById("bookingsList");

// ====== SEARCH ELEMENTS ======
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const searchResult = document.getElementById("searchResult");
// ====== DATE PICKER ENHANCEMENT ======
const dateInput = document.getElementById("date");

// Restrict to future dates only
const today = new Date().toISOString().split("T")[0];
dateInput.min = today;

// Optional: Automatically suggest next Friday or weekend (for convenience)
function suggestMovieDate() {
  const today = new Date();
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
  dateInput.value = nextFriday.toISOString().split("T")[0];
}

// Auto-suggest when modal opens
function openModal(movie) {
  movieNameInput.value = movie;
  buildSeatMap();
  suggestMovieDate(); // ✅ pre-fills upcoming date
  bookingModal.setAttribute("aria-hidden", "false");
}


// ====== STATE ======
let selectedSeats = new Set();
let bookings = JSON.parse(localStorage.getItem("flixbooker_seats") || "[]");

// ====== RENDER FEATURED MOVIES ======
function renderMovies() {
  moviesContainer.innerHTML = "";
  movies.forEach(m => {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.innerHTML = `
      <img class="movie-poster" src="${m.poster}" alt="${m.title}">
      <h3>${m.title}</h3>
      <p>${m.year}</p>
      <button class="btn primary">Book</button>
    `;
    card.querySelector(".btn").onclick = () => openModal(m.title);
    moviesContainer.appendChild(card);
  });
}

// ====== MODAL HANDLERS ======
function openModal(movie) {
  movieNameInput.value = movie;
  buildSeatMap();
  bookingModal.setAttribute("aria-hidden", "false");
}
function closeModal() {
  bookingModal.setAttribute("aria-hidden", "true");
}
bookingClose.onclick = closeModal;
bookingCancel.onclick = closeModal;
window.onclick = e => {
  if (e.target === bookingModal) closeModal();
};

// ====== BUILD SEAT MAP ======
function buildSeatMap() {
  seatMap.innerHTML = "";
  selectedSeats.clear();
  seatCount.textContent = "0";
  for (let i = 0; i < 48; i++) {
    const seat = document.createElement("div");
    seat.className = "seat";
    seat.onclick = () => {
      if (seat.classList.contains("taken")) return;
      seat.classList.toggle("selected");
      const idx = i;
      if (seat.classList.contains("selected")) selectedSeats.add(idx);
      else selectedSeats.delete(idx);
      seatCount.textContent = selectedSeats.size;
    };
    seatMap.appendChild(seat);
  }
}

// ====== BOOKING SUBMISSION ======
bookingForm.onsubmit = e => {
  e.preventDefault();
  if (selectedSeats.size === 0) return showToast("Please select at least one seat!");

  const booking = {
    movie: movieNameInput.value,
    date: document.getElementById("date").value,
    seats: [...selectedSeats]
  };

  bookings.push(booking);
  localStorage.setItem("flixbooker_seats", JSON.stringify(bookings));

  renderBookings(); // update booking list
  closeModal();
  showToast(`🎉 Booking confirmed for ${booking.movie}!`);
  runConfetti();
};

// ====== BOOKINGS LIST RENDERING ======
function renderBookings() {
  if (bookings.length === 0) {
    bookingsList.innerHTML = `<p class="muted">No bookings yet — pick a movie and reserve your seats!</p>`;
    return;
  }

  bookingsList.innerHTML = "";
  bookings.forEach((b, index) => {
    const card = document.createElement("div");
    card.className = "booking-card";
    card.innerHTML = `
      <button class="cancel-btn" data-index="${index}">Cancel</button>
      <h4>${b.movie}</h4>
      <p><strong>Date:</strong> ${b.date}</p>
      <p><strong>Seats:</strong> ${b.seats.length}</p>
      <small>Seat Numbers: ${b.seats.join(", ")}</small>
    `;
    bookingsList.appendChild(card);
  });

  // attach cancel handlers
  document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.onclick = e => {
      const i = parseInt(e.target.dataset.index);
      confirmCancel(i);
    };
  });
}

// ====== CANCEL BOOKING ======
function confirmCancel(index) {
  const booking = bookings[index];
  const confirmDelete = confirm(`Cancel booking for "${booking.movie}" on ${booking.date}?`);
  if (confirmDelete) {
    bookings.splice(index, 1);
    localStorage.setItem("flixbooker_seats", JSON.stringify(bookings));
    renderBookings();
    showToast(`❌ Booking canceled for ${booking.movie}`);
  }
}

// ====== TOAST MESSAGE ======
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ====== CONFETTI ANIMATION ======
function runConfetti() {
  const ctx = canvas.getContext("2d");
  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;
  const particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H - H,
      r: Math.random() * 6 + 2,
      d: Math.random() * W,
      color: `hsl(${Math.random() * 360},100%,50%)`,
      tilt: Math.random() * 10 - 10
    });
  }
  let angle = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    angle += 0.01;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x + p.tilt, p.y, p.r, p.r);
    }
    update();
  }
  function update() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += Math.cos(angle + p.d) + 1 + p.r / 2;
      p.x += Math.sin(angle);
      if (p.y > H) {
        particles[i] = {
          x: Math.random() * W,
          y: -10,
          r: p.r,
          d: p.d,
          color: p.color,
          tilt: p.tilt
        };
      }
    }
  }
  let confettiAnim = setInterval(draw, 20);
  setTimeout(() => clearInterval(confettiAnim), 3000);
}

// ====== MOVIE SEARCH (OMDb API) ======
const API_KEY = "13c08df6"; // 🔑 Replace with your actual OMDb key

searchBtn.onclick = async () => {
  const query = searchInput.value.trim();
  if (!query) {
    showToast("Please enter a movie name!");
    return;
  }
  searchResult.innerHTML = "<p class='muted'>Searching...</p>";

  try {
    const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=${API_KEY}`);
    const data = await res.json();

    if (data.Response === "False") {
      searchResult.innerHTML = `<p class='muted'>No results found for "${query}".</p>`;
      return;
    }

    searchResult.innerHTML = `
      <div class="search-card">
        <img src="${data.Poster !== 'N/A' ? data.Poster : 'https://via.placeholder.com/300x450?text=No+Image'}" alt="${data.Title}">
        <h3>${data.Title} (${data.Year})</h3>
        <p><strong>Genre:</strong> ${data.Genre || 'N/A'}</p>
        <p><strong>IMDb:</strong> ⭐ ${data.imdbRating || 'N/A'}</p>
        <p>${data.Plot || 'No description available.'}</p>
        <button class="btn primary" onclick="openModal('${data.Title}')">Book Now</button>
      </div>
    `;
  } catch (err) {
    searchResult.innerHTML = `<p class='muted'>Error fetching data. Check API key or internet connection.</p>`;
    console.error(err);
  }
};

// ====== INITIALIZE ======
renderMovies();
renderBookings();
