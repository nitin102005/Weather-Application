const apiKey = "0a99cbcc568e2f9bd5ef130da458ff32";

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function () {
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");
  const loc = document.querySelector(".location-name");
  const tempvalue = document.querySelector(".temperature");
  const conditiontxt = document.querySelector(".condition-text");
  const weathericon = document.querySelector(".weather");
  const windspeed = document.querySelector(".wind-speed");
  const uvText = document.querySelector(".uv-value");
  const Humidityvalue = document.querySelector(".Humidity");
  const riseEl = document.getElementById("sunrise-time");
  const setEl = document.getElementById("sunset-time");
  const weeklyForecastEl = document.querySelector(".weekly-forecast");
  const windChartCanvas = document.getElementById("windChart");
  const uvChartCanvas = document.getElementById("uvChart");
  const uvsubtext = document.querySelector(".uv-subtext")
  const visibilityvalue =document.querySelector(".visibility-value")


  let windChart; // To store the chart instance for updates
  let tempChart; // Add this near the top with windChart
  let uvChart; // Add this for UV chart instance

  updateWeatherData("Uttarakhand");
  searchBtn.addEventListener("click", function () {
    const city = searchInput.value.trim();
    if (city === "") {
      alert("Please enter a city name.");
      return;
    }
    console.log("Searching weather for:", city);
    updateWeatherData(city);
  });

  searchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      searchBtn.click();
    }
  });

  async function getFetchData(endpoint, params) {
    let URL;
    if (endpoint === 'weather') {
      URL = `https://api.openweathermap.org/data/2.5/weather?q=${params}&units=metric&appid=${apiKey}`;
    } else if (endpoint === 'forecast') {
      URL = `https://api.openweathermap.org/data/2.5/forecast?q=${params}&units=metric&appid=${apiKey}`;
    } else if (endpoint === 'uvi') {
      URL = `http://api.openweathermap.org/data/2.5/uvi?lat=${params.lat}&lon=${params.lon}&appid=${apiKey}`;
    }
    const response = await fetch(URL);
    if (!response.ok) throw new Error(`Failed to fetch ${endpoint} data`);
    return response.json();
  }

  function getWeatherIcon(id) {
    if (id <= 200 && id < 300) return 'Thunderstorm.png';
    if (id >= 300 && id < 400) return 'drizzle.png';
    if (id >= 500 && id < 600) return 'rain.svg';
    if (id >= 600 && id < 700) return 'snow.png';
    if (id >= 700 && id < 800) return 'atmosphere.svg';
    if (id === 800) return 'clear.svg';
    return 'clouds.svg';
  }

  function renderCurrentDate() {
    const dateEl = document.getElementById("current-date");
    const dayEl = document.getElementById("current-day");
    const today = new Date();
    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const dayOptions = { weekday: 'long' };
    dateEl.textContent = today.toLocaleDateString(undefined, dateOptions);
    dayEl.textContent = today.toLocaleDateString(undefined, dayOptions);
  }

  function renderWeeklyForecast(forecastData) {
    const dailyData = {};
    const today = new Date().toDateString();

    // Process forecast data to group by day
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toDateString();
      const hour = date.getHours();

      // Prefer midday data (12 PM to 3 PM) for a better daily summary
      if (!dailyData[dayKey] || (hour >= 12 && hour <= 15)) {
        dailyData[dayKey] = {
          temp: item.main.temp,
          weatherId: item.weather[0].id,
          dayName: date.toLocaleDateString(undefined, { weekday: 'short' })
        };
      }
    });

    // Clear existing forecast
    weeklyForecastEl.innerHTML = '';

    // Get up to 6 days (including today)
    const forecastDays = Object.values(dailyData).slice(0, 6);

    // Render each day
    forecastDays.forEach(day => {
      const dayCard = document.createElement('div');
      dayCard.className = 'day-card';
      dayCard.innerHTML = `
        <p>${day.dayName}</p>
        <img class="weeklyweather" src="/assets/${getWeatherIcon(day.weatherId)}" alt="weather icon">
        <p>${Math.round(day.temp)}°</p>
      `;
      weeklyForecastEl.appendChild(dayCard);
    });

    // Log if fewer than 6 days are available
    if (forecastDays.length < 6) {
      console.warn(`Only ${forecastDays.length} days of forecast data available.`);
    }
  }

  function initializeWindChart(labels, data) {
    if (windChart) windChart.destroy(); // Destroy existing chart if it exists
    windChart = new Chart(windChartCanvas, {
      type: 'bar',
      data: {
        labels: labels.slice(0, 20),
        datasets: [{
          label: 'Wind Speed(km/h)',
          data: data.slice(0, 20),
          backgroundColor: 'rgba(224, 204, 47, 0.72)', // Gold color similar to image
          barPercentage: 0.4,
          categoryPercentage: 0.8,
          borderRadius: 1


        }]
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: 'Time' },
            ticks: { display: false },
            grid: { display: false }

          },

          y: {
            title: { display: true, text: 'Wind Speed (km/hr)    ' },
            
            ticks: { display: false },
            grid: { display: false }

          }
        },

        plugins: {
          legend: { display: false }

        },
        layout: {
          padding: { left: 10, right: 10, top: 10 } // Add padding for styling
        }
      }
    });
  }

  function initializeTempChart(labels, data) {
    const tempChartCanvas = document.getElementById("tempChart");

    // Destroy the existing chart if it exists to prevent overlap
    if (tempChart) tempChart.destroy();

    // Create a new line chart
    tempChart = new Chart(tempChartCanvas, {
      type: 'line',
      data: {
        labels: ['Morning', 'Afternoon', 'Evening', 'Night'], // Match the image labels
        datasets: [{
          label: 'Temperature (°C)',
          data: data.slice(0, 4), // Use only the first 4 data points for Morning, Afternoon, Evening, Night
          borderColor: 'rgba(224, 204, 47, 0.72)', // Yellow line to match the image
          backgroundColor: 'rgba(224, 204, 47, 0.1)', // Slight fill under the line
          pointBackgroundColor: '#2b2b2b', // Yellow points
          pointBorderColor: 'rgba(224, 204, 47, 0.72)', // White border for points
          pointRadius: 5, // Size of the circular points
          pointHoverRadius: 7, // Slightly larger on hover
          borderWidth: 2, // Line thickness
          fill: false, // Fill under the line
          tension: 0.4 // Smooth curve effect
        }]
      },
      options: {
        scales: {
          x: {
            title: { display: false }, // No title for x-axis
            ticks: { display: true, font: { size: 12 } }, // Show labels
            grid: { display: false }
          },
          y: {
            title: { display: false }, // No title for y-axis
            ticks: { display: false }, // Hide y-axis ticks
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        },
        layout: {
          padding: { left: 0, right: 0, top: 10, bottom: 10 }
        }
      }
    });
  }

  // Helper function to draw ring arcs
  function drawRingArc(ctx, centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, fillStyle) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  function initializeUVChart(uvValue) {
    if (uvChart) uvChart.destroy();

    // Ensure uvValue is a valid number, default to 0 if undefined or invalid
    uvValue = (typeof uvValue === 'number' && !isNaN(uvValue)) ? Math.min(Math.max(uvValue, 0), 12) : 0;

    uvChart = new Chart(uvChartCanvas, {
        type: 'doughnut',
        data: { labels: [], datasets: [] },
        options: {
            cutout: '90%',
            circumference: Math.PI,
            rotation: -Math.PI / 2,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } },
            animation: { animateRotate: true, duration: 1000 },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    updateWeatherData(document.querySelector(".location-name").textContent);
                }
            },
            maintainAspectRatio: true
        },
        plugins: [{
            id: 'uvGaugeCustomization',
            beforeDraw(chart) {
                const { ctx } = chart;
                const { width, height } = chart.chartArea;
                const centerX = width / 2;
                const centerY = height / 1.5;
                const R = Math.min(width, height) / 2.8;
                const uvDisplayValue = (typeof chart.uvValue === 'number' && !isNaN(chart.uvValue)) ? chart.uvValue : 0;

                // Outer track (solid color instead of gradient)
                drawRingArc(ctx, centerX, centerY, R * 0.9, R, Math.PI, 2 * Math.PI, '#696969');

                // Inner accent bar (solid color instead of gradient)
                const f = uvDisplayValue / 12;
                const innerEndA = Math.PI + f * Math.PI;
                drawRingArc(ctx, centerX, centerY, R * 0.7, R * 0.8, Math.PI, innerEndA, 'rgba(224, 204, 47, 0.72)');

                // Draw labels
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '12px Arial';
                ctx.fillStyle = '#FFFFFF';
                const labelRadius = R * 1.05;
                [0, 2, 4, 6, 8, 10, 12].forEach(V => {
                    const angle = Math.PI + (V / 12) * Math.PI;
                    const labelX = centerX + Math.cos(angle) * labelRadius;
                    const labelY = centerY + Math.sin(angle) * labelRadius;
                    ctx.fillText(V.toString(), labelX, labelY);
                });
                ctx.restore();
            }
        }]
    });

    // Assign uvValue to chart instance
    uvChart.uvValue = uvValue;
}

  // Function to calculate dew point
  function calculateDewPoint(temp, humidity) {
    const a = 17.27;
    const b = 237.7;
    const gamma = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    const dewPoint = (b * gamma) / (a - gamma);
    return Math.round(dewPoint);
  }

  async function updateWeatherData(city) {
    try {
      // Fetch current weather
      const weatherData = await getFetchData('weather', city);
      const {
        name: country,
        main: { temp, humidity },
        weather: [{ id, main }],
        wind: { speed },
        sys: { sunrise, sunset },
        coord: { lat, lon },
        visibility: visibility
      } = weatherData;

      // Update current weather display
      loc.textContent = country;
      tempvalue.textContent = Math.round(temp) + '° C';
      conditiontxt.textContent = main;
      weathericon.src = `/assets/${getWeatherIcon(id)}`;
      windspeed.textContent = speed + 'km/h';
      Humidityvalue.textContent = humidity + '%';
      visibilityvalue.textContent = visibility / 1000 + 'km';

      
      // Calculate and display dew point
      const dewPoint = calculateDewPoint(temp, humidity);
      const dewPointElement = document.querySelector(".humidity small");
      dewPointElement.textContent = `The dew point is ${dewPoint}° right now`;

      const toLocal = ts => new Date(ts * 1000)
        .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      riseEl.textContent = `Sunrise: ${toLocal(sunrise)}`;
      setEl.textContent = `Sunset: ${toLocal(sunset)}`;

      const uvData = await getFetchData('uvi', { lat, lon });
      uvText.textContent = `${uvData.value} UV`;
      initializeUVChart(uvData.value); // Initialize UV chart with live data
      if (uvData.value < 3) {
        uvsubtext.textContent = "Low"
      }else if (uvData.value > 3 && uvData.value < 6 ) {
        uvsubtext.textContent = "Moderate"
      }
      else if (uvData.value >=6 && uvData.value < 8 ) {
        uvsubtext.textContent = "High"
      }
      else if (uvData.value >=8 && uvData.value < 11 ) {
        uvsubtext.textContent = "Very high"
      }
      else if (uvData.value >= 11 ) {
        uvsubtext.textContent = "Extreme"
      }

      // Calculate and display feels like (temp + dew point)
      const feelsLike = Math.round(temp + dewPoint);
      const feels = document.querySelector(".feel");
      feels.textContent = `${feelsLike}°`;
      const feelsLikeSmall = document.querySelector(".feels-like small");
    if (feelsLikeSmall) {
      feelsLikeSmall.textContent = feelsLike > temp ? "Humidity is making it feel hotter" : "Humidity is making it feel cooler";
    } else {
      console.log("Feels Like small element not found");
    }


      // Fetch and render weekly forecast
      const forecastData = await getFetchData('forecast', city);
      renderWeeklyForecast(forecastData);

      // Process wind data for chart
      const windData = forecastData.list.map(item => ({
        speed: item.wind.speed,
        time: new Date(item.dt * 1000).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      }));
      const labels = windData.map(d => d.time);
      const speeds = windData.map(d => Math.round(d.speed * 3.6)); // Convert m/s to km/h
      initializeWindChart(labels.slice(0, 40), speeds.slice(0, 40)); // Limit to 40 data points for clarity

      // Process temperature data for chart (average per time period)
      const tempData = forecastData.list.slice(0, 8).reduce((acc, item) => {
        const hour = new Date(item.dt * 1000).getHours();
        const temp = item.main.temp;
        if (hour >= 6 && hour < 12) acc.morning.push(temp); // Morning: 6 AM - 12 PM
        else if (hour >= 12 && hour < 18) acc.afternoon.push(temp); // Afternoon: 12 PM - 6 PM
        else if (hour >= 18 && hour < 24) acc.evening.push(temp); // Evening: 6 PM - 12 AM
        else acc.night.push(temp); // Night: 12 AM - 6 AM
        return acc;
      }, { morning: [], afternoon: [], evening: [], night: [] });

      const tempLabels = ['Morning', 'Afternoon', 'Evening', 'Night'];
      const temperatures = [
        Math.round(tempData.morning.reduce((a, b) => a + b, 0) / tempData.morning.length || 0),
        Math.round(tempData.afternoon.reduce((a, b) => a + b, 0) / tempData.afternoon.length || 0),
        Math.round(tempData.evening.reduce((a, b) => a + b, 0) / tempData.evening.length || 0),
        Math.round(tempData.night.reduce((a, b) => a + b, 0) / tempData.night.length || 0)
      ];

      // Initialize the temperature chart
      initializeTempChart(tempLabels, temperatures);


    } catch (error) {
      console.error('Error updating weather:', error);
      alert('Could not fetch weather data. Please try again.');
    }
  }

  // Initial render
  renderCurrentDate();
});
