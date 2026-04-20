// 全局变量
let map;
let driving;
let drivingRoute;
let pluginsLoaded = false;
let pluginsPromise;

// DOM元素
const tripForm = document.getElementById('tripForm');
const trip1DestinationInput = document.getElementById('trip1Destination');
const trip2OriginInput = document.getElementById('trip2Origin');
const calculateBtn = document.getElementById('calculateBtn');
const loadingEl = document.getElementById('loading');
const resultEl = document.getElementById('result');
const resultContentEl = document.getElementById('resultContent');
const errorEl = document.getElementById('error');

// 自动填充：行程1目的地 → 行程2出发地
trip1DestinationInput.addEventListener('input', () => {
    trip2OriginInput.value = trip1DestinationInput.value;
});

// 初始化地图
function initMap() {
    // 创建地图实例，默认定位在中国北京
    map = new AMap.Map('mapContainer', {
        zoom: 10,
        center: [116.397428, 39.90923]
    });

    // 添加缩放控件
    AMap.plugin('AMap.Scale', () => {
        map.addControl(new AMap.Scale());
    });

    // 异步加载插件并初始化
    pluginsPromise = new Promise((resolve) => {
        AMap.plugin(['AMap.Driving'], () => {
            // 驾车路线规划服务
            driving = new AMap.Driving({
                map: map,
                panel: null, // 不使用默认面板，我们自己显示结果
                policy: 1 // 速度优先
            });

            pluginsLoaded = true;
            resolve();
        });
    });
}

// 地址转坐标：使用高德Web服务API
async function geocodeAddress(address) {
    // 如果用户输入已经包含"北京"，就不用再加了
    const hasBeijing = address.includes('北京') || address.includes('北京市');
    // 尝试全称搜索，物资学院 → 北京物资学院
    let fullAddress = address;
    if (address.includes('物资学院') && !hasBeijing) {
        fullAddress = '北京物资学院';
    }

    const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(fullAddress)}&key=${GAODE_WEB_API_KEY}&output=json`;

    const response = await fetch(url);
    const data = await response.json();

    console.log('geocode', address, data);

    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
        const [lng, lat] = data.geocodes[0].location.split(',').map(Number);
        return {
            lng: lng,
            lat: lat,
            formattedAddress: data.geocodes[0].formatted_address
        };
    } else if (!hasBeijing) {
        // 如果找不到，并且用户没加北京，尝试用"北京"前缀再搜一次
        const url2 = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent('北京 ' + fullAddress)}&key=${GAODE_WEB_API_KEY}&output=json`;
        const response2 = await fetch(url2);
        const data2 = await response2.json();

        if (data2.status === '1' && data2.geocodes && data2.geocodes.length > 0) {
            const [lng, lat] = data2.geocodes[0].location.split(',').map(Number);
            return {
                lng: lng,
                lat: lat,
                formattedAddress: data2.geocodes[0].formatted_address
            };
        }
        throw new Error(`无法找到地址：${address}`);
    } else {
        throw new Error(`无法找到地址：${address}`);
    }
}

// 计算驾车路线和时间 - 使用Web服务API，然后在地图上绘制
async function calculateRoute(origin, destination, color = "#28F") {
    // 使用Web服务API规划路线
    const url = `https://restapi.amap.com/v3/direction/driving?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}&key=${GAODE_WEB_API_KEY}&output=json`;

    const response = await fetch(url);
    const data = await response.json();

    console.log('direction result', data);

    if (data.status === '1' && data.route && data.route.paths && data.route.paths.length > 0) {
        const path = data.route.paths[0];
        const duration = Math.round(path.duration / 60); // 转换为分钟
        const distance = path.distance / 1000; // 转换为公里

        // 解析路线点并在地图上绘制
        if (path.steps) {
            const allPoints = [];
            path.steps.forEach(step => {
                const polyline = step.polyline.split(';');
                polyline.forEach(p => {
                    const [lng, lat] = p.split(',').map(Number);
                    allPoints.push(new AMap.LngLat(lng, lat));
                });
            });

            // 绘制路线
            if (allPoints.length > 0) {
                const polyline = new AMap.Polyline({
                    path: allPoints,
                    strokeColor: color,
                    strokeWeight: 6,
                    strokeOpacity: 0.8,
                    map: map
                });
            }
        }

        return {
            duration: duration,
            distance: distance
        };
    } else {
        throw new Error('无法规划驾车路线，请检查地址后重试');
    }
}

// 显示结果
function displayResult(requiredMinutes, availableMinutes, distanceKm) {
    const isEnough = requiredMinutes < availableMinutes;
    const extraTime = availableMinutes - requiredMinutes;

    resultEl.classList.remove('hidden', 'enough', 'not-enough');
    resultEl.classList.add(isEnough ? 'enough' : 'not-enough');

    let html = `
        <div class="result-item">预计行驶时间：<strong>${requiredMinutes.toFixed(1)} 分钟</strong></div>
        <div class="result-item">行驶距离：<strong>${distanceKm.toFixed(1)} 公里</strong></div>
        <div class="result-item">可用间隔：<strong>${availableMinutes} 分钟</strong></div>
        <div class="result-item conclusion">${isEnough
            ? `✓ 时间足够，剩余 ${extraTime.toFixed(1)} 分钟`
            : `✗ 时间不够，还差 ${Math.abs(extraTime).toFixed(1)} 分钟`
        }</div>
    `;

    resultContentEl.innerHTML = html;
}

// 显示错误
function showError(message) {
    errorEl.classList.remove('hidden');
    errorEl.textContent = message;
}

// 隐藏错误
function hideError() {
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
}

// 表单提交处理
async function handleSubmit(e) {
    e.preventDefault();

    // 获取输入值
    const trip1Origin = document.getElementById('trip1Origin').value.trim();
    const trip1Dest = trip1DestinationInput.value.trim();
    const trip2Origin = trip2OriginInput.value.trim();
    const trip2Dest = document.getElementById('trip2Destination').value.trim();
    const interval = parseInt(document.getElementById('interval').value);

    // 验证
    if (!trip1Origin || !trip1Dest || !trip2Origin || !trip2Dest || !interval) {
        showError('请填写所有必填项');
        return;
    }

    if (interval <= 0) {
        showError('间隔时间必须大于0');
        return;
    }

    // 显示加载状态
    calculateBtn.disabled = true;
    loadingEl.classList.remove('hidden');
    hideError();
    resultEl.classList.add('hidden');

    try {
        // 等待插件加载完成
        if (!pluginsLoaded && pluginsPromise) {
            await pluginsPromise;
        }

        // 清除地图
        map.clearMap();

        // 地理编码所有地址，串行请求并加延迟避免QPS超限（免费额度QPS=1）
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const trip1OriginResult = await geocodeAddress(trip1Origin);
        await delay(1100); // 延迟超过1秒，避免QPS超限
        const trip1DestResult = await geocodeAddress(trip1Dest);
        await delay(1100);
        const trip2OriginResult = await geocodeAddress(trip2Origin);
        await delay(1100);
        const trip2DestResult = await geocodeAddress(trip2Dest);

        // 绘制行程1（橙色）
        await calculateRoute(trip1OriginResult, trip1DestResult, "#FF7F24");

        // 计算行程2（蓝色），这就是我们需要判断时间的
        const routeResult = await calculateRoute(trip2OriginResult, trip2DestResult, "#2196F3");

        // 添加所有标记
        new AMap.Marker({
            position: new AMap.LngLat(trip1OriginResult.lng, trip1OriginResult.lat),
            map: map,
            title: '行程1起点',
            label: {content: '起点1', direction: 'top'}
        });
        new AMap.Marker({
            position: new AMap.LngLat(trip1DestResult.lng, trip1DestResult.lat),
            map: map,
            title: '行程1终点',
            label: {content: '终点1', direction: 'top'}
        });
        new AMap.Marker({
            position: new AMap.LngLat(trip2OriginResult.lng, trip2OriginResult.lat),
            map: map,
            title: '行程2起点',
            label: {content: '起点2', direction: 'top'}
        });
        new AMap.Marker({
            position: new AMap.LngLat(trip2DestResult.lng, trip2DestResult.lat),
            map: map,
            title: '行程2终点',
            label: {content: '终点2', direction: 'top'}
        });

        // 调整地图视野以适应所有点
        const allLng = [trip1OriginResult.lng, trip1DestResult.lng, trip2OriginResult.lng, trip2DestResult.lng];
        const allLat = [trip1OriginResult.lat, trip1DestResult.lat, trip2OriginResult.lat, trip2DestResult.lat];
        const bounds = new AMap.Bounds(
            new AMap.LngLat(Math.min(...allLng), Math.min(...allLat)),
            new AMap.LngLat(Math.max(...allLng), Math.max(...allLat))
        );
        map.setBounds(bounds, 30);

        // 显示结果
        displayResult(routeResult.duration, interval, routeResult.distance);

    } catch (err) {
        console.error('计算出错:', err);
        showError(String(err));
    } finally {
        calculateBtn.disabled = false;
        loadingEl.classList.add('hidden');
    }
}

// 绑定事件
tripForm.addEventListener('submit', handleSubmit);

// 高德API加载完成后会调用这个函数
window.initAMap = function() {
    initMap();
};

// 如果API已经加载完成，直接初始化
if (window.AMap) {
    initMap();
}
