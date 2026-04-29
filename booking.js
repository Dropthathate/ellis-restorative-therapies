const BOOKING_URL = 'https://script.google.com/macros/s/AKfycbwLS377dvlP5TRgZviL5Pmaj_RBFbeXUTszmU7KbcEdyAyLA8rURceBGq5GWro_cAR9/exec';

let currentMonth = 3; // April
let currentYear = 2026;
let selDate = null, selSlot = null;

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const promo = document.getElementById('promo-popup');
        if(promo) promo.classList.add('show');
    }, 1000);

    const submitBtn = document.getElementById('submit-btn');
    if(submitBtn) {
        submitBtn.addEventListener('click', submitBooking);
    }
    
    render();
});

function closePromo() { 
    const promo = document.getElementById('promo-popup');
    if(promo) promo.classList.remove('show'); 
}

function changeMonth(offset) {
    currentMonth += offset;
    
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    
    render();
}

function jsonp(url) {
    return new Promise((resolve) => {
        const cb = 'callback_' + Math.round(Math.random()*1000000);
        const script = document.createElement('script');
        script.src = `${url}${url.includes('?')?'&':'?'}callback=${cb}`;
        window[cb] = (data) => { resolve(data); script.remove(); delete window[cb]; };
        document.body.appendChild(script);
    });
}

async function render() {
    const grid = document.getElementById('cal-grid');
    document.getElementById('cal-month-label').textContent = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color: var(--text-muted);">Loading availability...</div>';

    const data = await jsonp(`${BOOKING_URL}?action=availability&month=${currentMonth}&year=${currentYear}`);
    const avail = data.availability || {};
    grid.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));

    for(let d=1; d<=daysInMonth; d++) {
        const dateKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const day = document.createElement('div');
        const status = avail[dateKey] || 'closed';
        day.className = `cal-day ${status}`;
        day.textContent = d;
        if(status !== 'closed' && status !== 'full') {
            day.onclick = () => selectDate(dateKey, d);
        }
        grid.appendChild(day);
    }
}

async function selectDate(key, d) {
    selDate = key;
    document.getElementById('state-prompt').style.display = 'none';
    document.getElementById('state-slots').style.display = 'block';
    document.getElementById('slot-date-header').textContent = new Date(currentYear, currentMonth, d).toLocaleDateString();
    const grid = document.getElementById('slots-grid');
    grid.innerHTML = 'Loading times...';
    const data = await jsonp(`${BOOKING_URL}?action=slots&date=${selDate}`);
    grid.innerHTML = '';
    data.slots.forEach(s => {
        const b = document.createElement('button');
        b.className = 'slot-btn';
        b.textContent = s;
        b.onclick = () => { 
            selSlot = s; 
            document.getElementById('state-slots').style.display='none'; 
            document.getElementById('state-form').style.display='block'; 
        };
        grid.appendChild(b);
    });
}

async function submitBooking() {
    const name     = document.getElementById('f-name').value;
    const phone    = document.getElementById('f-phone').value;
    const email    = document.getElementById('f-email').value;
    const duration = document.getElementById('f-duration').value;

    if(!name || !phone || !email || !selDate || !selSlot) {
        alert("Please fill out all fields.");
        return;
    }

    document.getElementById('state-form').innerHTML = '<h3>Processing your request...</h3>';

    const params = new URLSearchParams({ action:'book', name, phone, email, date:selDate, time:selSlot, duration });
    const result = await jsonp(`${BOOKING_URL}?${params}`);

    document.getElementById('state-form').style.display = 'none';
    document.getElementById('state-success').style.display = 'block';
}