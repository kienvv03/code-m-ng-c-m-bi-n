document.addEventListener('DOMContentLoaded', function() {
    const host = 'ws://172.20.10.5:9001';
    const options = {
        clean: true,
        connectTimeout: 4000,
        clientId: 'clientId-' + Math.random().toString(16).substr(2, 8),
        username: 'kvv',
        password: '123',
    };

    const client = mqtt.connect(host, options);

    // Hàm lưu trạng thái vào LocalStorage
    function saveState(key, value) {
        localStorage.setItem(key, value);
    }

    // Hàm khôi phục trạng thái từ LocalStorage
    function loadState(key) {
        return localStorage.getItem(key);
    }

    client.on('connect', () => {
        console.log('Connected to MQTT Broker');
        client.subscribe('home/temperature');
        client.subscribe('home/humidity');
        client.subscribe('home/light');
        client.subscribe('home/led');  // Đăng ký topic điều khiển đèn LED
        client.subscribe('home/fan');  // Đăng ký topic điều khiển quạt

        // Khôi phục trạng thái từ LocalStorage
        const ledState = loadState('home/led');
        const fanState = loadState('home/fan');
        if (ledState) {
            client.publish('home/led', ledState);
            document.getElementById('ledSwitch').checked = (ledState === 'ON');
        }
        if (fanState) {
            client.publish('home/fan', fanState);
            document.getElementById('fanSwitch').checked = (fanState === 'ON');
        }
    });

    client.on('message', (topic, message) => {
        console.log(`Received message on topic ${topic}: ${message.toString()}`);
        try {
            if (message.toString() === 'ON' || message.toString() === 'OFF') {
                // Xử lý trạng thái đèn và quạt
                console.log(`${topic} state: ${message.toString()}`);
                if (topic === 'home/led') {
                    document.getElementById('ledSwitch').checked = (message.toString() === 'ON');
                    saveState('home/led', message.toString());
                }
                if (topic === 'home/fan') {
                    document.getElementById('fanSwitch').checked = (message.toString() === 'ON');
                    saveState('home/fan', message.toString());
                }
            } else {
                const data = JSON.parse(message.toString());

                if (topic === 'home/temperature') {
                    console.log('Temperature:', data.temperature);
                    document.getElementById('temp-value').innerText = data.temperature;
                    saveState('home/temperature', data.temperature);
                }
                if (topic === 'home/humidity') {
                    console.log('Humidity:', data.humidity);
                    document.getElementById('humidity-value').innerText = data.humidity;
                    saveState('home/humidity', data.humidity);
                }
                if (topic === 'home/light') {
                    console.log('Light:', data.light);
                    document.getElementById('light-value').innerText = data.light;
                    saveState('home/light', data.light);
                }

                myChart.data.labels.push(new Date().toLocaleTimeString());
                myChart.data.datasets[0].data.push(data.temperature);
                myChart.data.datasets[1].data.push(data.humidity);
                myChart.data.datasets[2].data.push(data.light);
                myChart.update();
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });

    const ctx = document.getElementById('chart').getContext('2d');

    const data = {
        labels: [],
        datasets: [
            {
                label: 'Nhiệt độ',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: false,
                cubicInterpolationMode: 'monotone', // Sử dụng spline để làm mượt đường biểu đồ
                tension: 0.4,
                data: [],
                showLine: true
            },
            {
                label: 'Độ ẩm',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: false,
                cubicInterpolationMode: 'monotone', // Sử dụng spline để làm mượt đường biểu đồ
                tension: 0.4,
                data: [],
                showLine: true
            },
            {
                label: 'Ánh sáng',
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderColor: 'rgba(255, 206, 86, 1)',
                fill: false,
                cubicInterpolationMode: 'monotone', // Sử dụng spline để làm mượt đường biểu đồ
                tension: 0.4,
                data: [],
                showLine: true
            }
        ]
    };

    const optionsChart = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Biểu đồ Nhiệt độ, Độ ẩm, Ánh sáng',
                fontSize: 24,
                padding: 20,
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';

                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y;
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                grid: {
                    color: 'rgba(200, 200, 200, 0.3)',
                    beginAtZero: true
                }
            }
        }
    };

    const myChart = new Chart(ctx, { type: 'line', data: data, options: optionsChart });

    document.getElementById('ledSwitch').addEventListener('change', function(event) {
        const message = event.target.checked ? 'ON' : 'OFF';
        client.publish('home/led', message);
        console.log(`Sent message: ${message} to home/led`);
    });

    document.getElementById('fanSwitch').addEventListener('change', function(event) {
        const message = event.target.checked ? 'ON' : 'OFF';
        client.publish('home/fan', message);
        console.log(`Sent message: ${message} to home/fan`);
    });

    // Khôi phục dữ liệu cũ từ LocalStorage khi tải lại trang
    document.getElementById('temp-value').innerText = loadState('home/temperature') || '--';
    document.getElementById('humidity-value').innerText = loadState('home/humidity') || '--';
    document.getElementById('light-value').innerText = loadState('home/light') || '--';
});
