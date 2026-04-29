const BOOKING_URL = "https://script.google.com/macros/s/AKfycbwLS377dvlP5TRgZviL5Pmaj_RBFbeXUTszmU7KbcEdyAyLA8rURceBGq5GWro_cAR9/exec";

let selectedDate = null;
let selectedTime = null;

function selectDate(date) {
  selectedDate = date;
  loadSlots(date);
}

function selectTime(time) {
  selectedTime = time;
}

async function loadSlots(date) {
  const res = await fetch(`${BOOKING_URL}?action=slots&date=${date}`);
  const data = await res.json();

  const el = document.getElementById("slots");
  el.innerHTML = "";

  data.slots.forEach(t => {
    const div = document.createElement("div");
    div.className = "slot";
    div.innerText = t;

    div.onclick = () => {
      document.querySelectorAll(".slot").forEach(s => s.classList.remove("active"));
      div.classList.add("active");
      selectTime(t);
    };

    el.appendChild(div);
  });
}

function renderCalendar() {
  const el = document.getElementById("calendar");
  el.innerHTML = "";

  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    const dateStr = d.toISOString().split("T")[0];

    const div = document.createElement("div");
    div.className = "day";
    div.innerText = d.getDate();

    div.onclick = () => {
      document.querySelectorAll(".day").forEach(x => x.classList.remove("active"));
      div.classList.add("active");
      selectDate(dateStr);
    };

    el.appendChild(div);
  }
}

async function submitBooking() {
  const payload = {
    type: "booking",
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    duration: Number(document.getElementById("duration").value), // 🔥 FIXED
    date: selectedDate,
    time: selectedTime
  };

  if (!payload.name || !payload.phone || !payload.email || !payload.date || !payload.time) {
    alert("Fill all fields + select date and time");
    return;
  }

  await fetch(BOOKING_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  alert("Booking submitted");
}

renderCalendar();